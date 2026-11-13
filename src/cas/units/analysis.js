/**
 * src/cas/units/analysis.js
 * AST-Driven Unit Analysis, In-Situ Conversion, and Factor-Label Markup Engine.
 */

import { parseMathAST, evalAST, getAstIdentifiers } from "../ast.js";
import { resolveCanonicalKey, isReservedMathToken } from "../algebra.js";
import { fmtSigFig } from "../../core/dimensions.js";
import {
  parseUnitToSemanticAST,
  BASE_UNITS,
  getUnitAtomBag,
  isDimEqual,
  unitToTex,
  unitToCancelledTex,
  getAbsoluteCompanionUnit
} from "./definitions.js";
import {
  formatPairConversion,
  formatComponentMismatch,
  buildCompoundTokenConversions
} from "./scales.js";

function getFormulaFractionDepth(node, targetName, currentDepth = 0) {
  if (!node) return null;
  if (node.type === "id" && node.name === targetName) return currentDepth;
  if (node.type === "group") return getFormulaFractionDepth(node.expr, targetName, currentDepth);
  if (node.type === "call") return getFormulaFractionDepth(node.arg, targetName, currentDepth);
  if (node.type === "binary") {
    const nextDepth = currentDepth + (node.op === "/" ? 1 : 0);
    const l = getFormulaFractionDepth(node.left, targetName, nextDepth);
    if (l !== null) return l;
    return getFormulaFractionDepth(node.right, targetName, nextDepth);
  }
  return null;
}

export function solveUnitAlgebra(exprOrAST, S, targetVar, targetUnit, varsDb = {}, requiredUnits = null) {
  const ast = typeof exprOrAST === "string" ? parseMathAST(exprOrAST) : exprOrAST;
  const tokenMarkup = {};
  const tokenConversions = {};
  const preConversions = [];
  const conversionScalars = [];
  let globalConversionTex = "";
  let numericConversionFactor = 1.0;

  // 1. Empirical relations with requiredUnits contracts
  if (requiredUnits && typeof requiredUnits === "object") {
    const varTokens = Array.from(new Set(getAstIdentifiers(ast).filter(t => !isReservedMathToken(t))));
    varTokens.forEach(tok => {
      const cKey = resolveCanonicalKey(tok, varsDb);
      const reqU = requiredUnits[cKey] || requiredUnits[tok];
      if (!reqU) return;
      const currU = S._u?.[cKey] || S._u?.[tok] || varsDb[cKey]?.unit || varsDb[tok]?.unit || "";

      if (currU === "°C" && (reqU === "K" || reqU === "degK")) {
        const rawVal = S[cKey] !== undefined ? S[cKey] : S[tok];
        preConversions.push({
          token: tok, canonicalKey: cKey, fromUnit: currU, toUnit: reqU,
          conv: { factor: 1.0, latex: `(${fmtSigFig(rawVal)} + 273.15)\\,\\text{K}` },
          rawVal, convertedVal: rawVal + 273.15
        });
        return;
      }
      if (currU && reqU && currU !== reqU && currU !== "deg" && currU !== "°") {
        const currScale = getUnitAtomBag(currU).scale;
        const reqScale = getUnitAtomBag(reqU).scale;
        if (currScale && reqScale) {
          const ratio = currScale / reqScale;
          const rawVal = S[cKey] !== undefined ? S[cKey] : S[tok];
          preConversions.push({
            token: tok, canonicalKey: cKey, fromUnit: currU, toUnit: reqU,
            conv: { factor: ratio, latex: `\\cfrac{${fmtSigFig(ratio)}\\,${unitToTex(reqU)}}{\\cancel{${unitToTex(currU)}}}` },
            rawVal, convertedVal: rawVal * ratio
          });
        }
      }
    });

    const cTarget = resolveCanonicalKey(targetVar, varsDb);
    const reqTargetU = requiredUnits[cTarget] || requiredUnits[targetVar];
    if (reqTargetU && targetUnit && reqTargetU !== targetUnit) {
      const reqScale = getUnitAtomBag(reqTargetU).scale;
      const targetScale = getUnitAtomBag(targetUnit).scale;
      if (reqScale && targetScale) {
        numericConversionFactor = reqScale / targetScale;
        if (Math.abs(numericConversionFactor - 1) > 1e-12) {
          const ratio = numericConversionFactor;
          if (ratio < 1) {
            globalConversionTex = ` \\cdot \\left[\\cfrac{${unitToTex(targetUnit)}}{${fmtSigFig(1 / ratio)}\\,${unitToTex(reqTargetU)}}\\right]`;
          } else {
            globalConversionTex = ` \\cdot \\left[\\cfrac{${fmtSigFig(ratio)}\\,${unitToTex(targetUnit)}}{${unitToTex(reqTargetU)}}\\right]`;
          }
        }
      }
    }
    return { tokenMarkup: {}, conversionFactors: [], conversionFactorTex: "", numericConversionFactor, globalConversionTex, preConversions, tokenConversions, conversionScalars };
  }

  // 2. Pure Physics: Recursive Additive-Branch + Multiplicative AST Analysis
  const cTarget = resolveCanonicalKey(targetVar, varsDb);
  const targetDim = (varsDb[cTarget] || varsDb[targetVar] || {}).dimension || null;

  function collectAdditiveBranches(node) {
    if (!node) return [];
    if (node.type === "group") return collectAdditiveBranches(node.expr);
    if (node.type === "call" && node.fn === "sqrt") return collectAdditiveBranches(node.arg);
    if (node.type === "binary" && (node.op === "+" || node.op === "-")) {
      return [...collectAdditiveBranches(node.left), ...collectAdditiveBranches(node.right)];
    }
    return [node];
  }

  const branches = collectAdditiveBranches(ast);
  const isMultiBranch = branches.length > 1;

  for (const branchAst of branches) {
    const branchTokens = Array.from(new Set(getAstIdentifiers(branchAst).filter(t => !isReservedMathToken(t))));
    const exps = collectTokenExponents(branchAst);

    const tokenBags = {};
    for (const tok of branchTokens) {
      if (exps[tok] === undefined) continue;
      const cKey = resolveCanonicalKey(tok, varsDb);
      const meta = varsDb[cKey] || varsDb[tok] || {};
      const uName = S._u?.[cKey] || S._u?.[tok] || meta.unit || "";
      if (!uName || uName === "dimless" || uName === "ratio" || uName === "%" || uName === "\\%") continue;
      tokenBags[tok] = { uName, dim: meta.dimension, exp: exps[tok], bag: getUnitAtomBag(uName, meta.dimension) };
    }

    let compoundComputed = false;

    for (const tok of branchTokens) {
      const cKey = resolveCanonicalKey(tok, varsDb);
      const meta = varsDb[cKey] || varsDb[tok] || {};
      const uName = S._u?.[cKey] || S._u?.[tok] || meta.unit || "";
      if (!uName || uName === "dimless" || uName === "ratio") continue;

      if (uName === "%" || uName === "\\%" || exps[tok] === undefined) {
        tokenMarkup[tok] = unitToTex(uName, false, meta.dimension);
        continue;
      }

      const fDepth = getFormulaFractionDepth(branchAst, tok) || 0;
      const parsed = parseUnitToSemanticAST(uName, meta.dimension);

      // A. Counterpart Discovery within this branch via 7D Dimensional Vectors
      const myInfo = tokenBags[tok];
      let counterpart = null;
      if (myInfo) {
        for (const [otherTok, otherInfo] of Object.entries(tokenBags)) {
          if (otherTok !== tok && otherInfo.exp * myInfo.exp < 0 && isDimEqual(myInfo.bag.dimMap, otherInfo.bag.dimMap)) {
            counterpart = { tok: otherTok, uName: otherInfo.uName, dim: otherInfo.dim };
            break;
          }
        }
      }

      // B. Affine Temperature Conversion (e.g. °F -> °R, °C -> K)
      if (parsed.length === 1 && BASE_UNITS[parsed[0].base]?.dim === "Th") {
        const baseMeta = BASE_UNITS[parsed[0].base];
        const isDiff = meta.dimension === "Temperature Difference" || !!meta.isDifference;

        if (!isDiff && baseMeta.offset) {
          const rawVal = S[cKey] !== undefined ? S[cKey] : S[tok];
          const absUnit = getAbsoluteCompanionUnit(uName);
          const offsetVal = baseMeta.offset;
          const formattedNum = fmtSigFig(rawVal, 6);

          if (counterpart) {
            tokenMarkup[tok] = `(${formattedNum} + ${offsetVal}) \\, ${unitToCancelledTex(absUnit, false, null, "whole")}`;
          } else {
            tokenMarkup[tok] = `(${formattedNum} + ${offsetVal}) \\, ${unitToTex(absUnit)}`;
          }
          tokenConversions[tok] = ["__AFFINE_CONVERTED__"];
          continue;
        } else if (!isDiff && counterpart) {
          tokenMarkup[tok] = unitToCancelledTex(uName, false, null, "whole");
          continue;
        }
      }

      // C. Counterpart with Matching Dimension Vector
      if (counterpart) {
        const bagCurrent = getUnitAtomBag(uName, meta.dimension);
        const bagTarget = getUnitAtomBag(counterpart.uName, counterpart.dim);
        const scaleRatio = bagCurrent.scale / bagTarget.scale;

        if (Math.abs(scaleRatio - 1) < 1e-6) {
          tokenMarkup[tok] = unitToCancelledTex(uName, false, meta.dimension, "whole");
          continue;
        }

        if (isDimEqual(bagCurrent.dimMap, bagTarget.dimMap)) {
          tokenMarkup[tok] = unitToCancelledTex(uName, false, meta.dimension, "component");
          const mismatch = formatComponentMismatch(uName, counterpart.uName, meta.dimension, counterpart.dim);
          if (fDepth <= 1) {
            if (!tokenConversions[tok] && !branchTokens.some(t => tokenConversions[t]?.length > 0)) {
              tokenConversions[tok] = [mismatch.tex];
              if (mismatch.scalar !== null) conversionScalars.push(mismatch.scalar);
            }
          } else if (!isMultiBranch && !globalConversionTex) {
            globalConversionTex = mismatch.tex;
            if (mismatch.scalar !== null) conversionScalars.push(mismatch.scalar);
          }
          continue;
        }
      }

      // D. Target Unit Scaling (Single-Dimension vs Compound Branch Decomposition)
      if (targetUnit && targetUnit !== "dimless" && targetUnit !== "ratio") {
        const tokBag = getUnitAtomBag(uName, meta.dimension);
        const targetBag = getUnitAtomBag(targetUnit, targetDim);

        if (isDimEqual(tokBag.dimMap, targetBag.dimMap)) {
          const conv = formatPairConversion(uName, targetUnit, meta.dimension, targetDim, "whole");
          if (!conv.tex) {
            tokenMarkup[tok] = unitToTex(uName, false, meta.dimension);
          } else {
            const cancelMode = conv.isDecomposed ? "component" : "whole";
            tokenMarkup[tok] = unitToCancelledTex(uName, false, meta.dimension, cancelMode);
            if (isMultiBranch) {
              // Inside an additive branch, keep conversion in-situ on the term
              tokenConversions[tok] = [conv.tex];
              conversionScalars.push(...(conv.scalars || (conv.scalar !== null ? [conv.scalar] : [])));
            } else if (!globalConversionTex) {
              // Single-branch Option B: preserves target unit intact on main line
              globalConversionTex = conv.tex;
              conversionScalars.push(...(conv.scalars || (conv.scalar !== null ? [conv.scalar] : [])));
            }
          }
        } else {
          // Compound branch (e.g. m_f / IP or Q_rej / m_a)
          tokenMarkup[tok] = unitToCancelledTex(uName, false, meta.dimension, "component");
          if (!compoundComputed) {
            compoundComputed = true;
            const entries = Object.entries(tokenBags).map(([t, info]) => ({
              tok: t, uName: info.uName, dim: info.dim, exp: info.exp
            }));
            const { conversionsByToken, scalars } = buildCompoundTokenConversions(entries, targetUnit, targetDim);
            for (const [k, convList] of Object.entries(conversionsByToken)) {
              tokenConversions[k] = convList;
            }
            conversionScalars.push(...scalars);
          }
        }
      } else {
        tokenMarkup[tok] = unitToTex(uName, false, meta.dimension);
      }
    }
  }

  return {
    tokenMarkup,
    conversionFactors: [],
    conversionFactorTex: "",
    numericConversionFactor: 1.0,
    globalConversionTex,
    preConversions,
    tokenConversions,
    conversionScalars
  };
}

function collectTokenExponents(node, sign = 1, acc = {}) {
  if (!node) return acc;
  if (node.type === "group") return collectTokenExponents(node.expr, sign, acc);
  if (node.type === "id") {
    acc[node.name] = (acc[node.name] || 0) + sign;
    return acc;
  }
  if (node.type === "call") {
    if (node.fn === "sqrt") {
      return collectTokenExponents(node.arg, sign * 0.5, acc);
    }
    // Transcendental calls (sin, cos, tan, exp, ln, log, etc.) consume their argument units
    return acc;
  }
  if (node.type === "binary") {
    if (node.op === "*" || node.op === "+" || node.op === "-") {
      collectTokenExponents(node.left, sign, acc);
      collectTokenExponents(node.right, sign, acc);
    } else if (node.op === "/") {
      collectTokenExponents(node.left, sign, acc);
      collectTokenExponents(node.right, -sign, acc);
    } else if (node.op === "^") {
      const rawP = evalAST(node.right, {});
      const p = Number.isFinite(rawP) ? rawP : 1;
      collectTokenExponents(node.left, sign * p, acc);
    }
  }
  return acc;
}
