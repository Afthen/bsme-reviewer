/**
 * src/cas/units/analysis.js
 * AST-Driven Unit Analysis, In-Situ Conversion, and Factor-Label Markup Engine.
 */

import { parseMathAST, evalAST, getAstIdentifiers } from "../ast.js";
import { resolveCanonicalKey, isReservedMathToken } from "../algebra.js";
import { fmtSigFig, DIMENSIONS } from "../../core/dimensions.js";
import {
  parseUnitToSemanticAST,
  BASE_UNITS,
  getUnitAtomBag,
  isDimEqual,
  unitToTex,
  unitToCancelledTex,
  getUnitOffset,
  getAbsoluteCompanionUnit,
  valueToCoherentBase,
  formatValueInUnit
} from "./definitions.js";
import {
  fmtScale,
  formatPairConversion,
  formatComponentMismatch,
  isCanonicalScaleFactor,
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

export function solveUnitAlgebra(exprOrAST, S, targetVar, targetUnit, varsDb = {}, requiredUnits = null, forceInSitu = false) {
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
      const meta = varsDb[cKey] || varsDb[tok] || {};
      const currU = S._u?.[cKey] || S._u?.[tok] || meta.unit || "";
      const effectiveU = reqU || currU;
      if (effectiveU && getUnitAtomBag(effectiveU, meta.dimension).dimMap?.Ang === 1) {
        tokenMarkup[tok] = unitToTex(effectiveU, false, meta.dimension);
      }
      if (!reqU) return;

      if (currU && reqU && currU !== reqU) {
        const isDiff = meta.dimension === DIMENSIONS.TEMPERATURE_DIFF || !!meta.isDifference;
        const currBag = getUnitAtomBag(currU, meta.dimension);
        const reqBag = getUnitAtomBag(reqU, meta.dimension);
        if (currBag.scale && reqBag.scale) {
          const rawVal = S[cKey] !== undefined ? S[cKey] : S[tok];
          const convertedVal = formatValueInUnit(
            valueToCoherentBase(rawVal, currU, isDiff, meta.dimension),
            reqU,
            isDiff,
            meta.dimension
          );
          const ratio = currBag.scale / reqBag.scale;
          const isAffine = !isDiff && (currBag.dimMap.Th !== undefined || reqBag.dimMap.Th !== undefined);
          preConversions.push({
            token: tok, canonicalKey: cKey, fromUnit: currU, toUnit: reqU,
            conv: {
              factor: isAffine ? 1.0 : ratio,
              latex: isAffine
                ? `${fmtSigFig(convertedVal, 6, true)}\\,${unitToTex(reqU)}`
                : `\\cfrac{${fmtScale(ratio, true)}\\,${unitToTex(reqU)}}{\\cancel{${unitToTex(currU)}}}`
            },
            rawVal, convertedVal
          });
        }
      }
    });

    const cTarget = resolveCanonicalKey(targetVar, varsDb);
    const reqTargetU = requiredUnits[cTarget] || requiredUnits[targetVar];
    if (reqTargetU && targetUnit && reqTargetU !== targetUnit) {
      const targetMeta = varsDb[cTarget] || varsDb[targetVar] || {};
      const targetIsDiff = targetMeta.dimension === DIMENSIONS.TEMPERATURE_DIFF || !!targetMeta.isDifference;
      const reqBag = getUnitAtomBag(reqTargetU, targetMeta.dimension);
      const targetBag = getUnitAtomBag(targetUnit, targetMeta.dimension);
      const isTargetAffine = !targetIsDiff && (reqBag.dimMap.Th !== undefined || targetBag.dimMap.Th !== undefined);

      if (reqBag.scale && targetBag.scale && !isTargetAffine) {
        numericConversionFactor = reqBag.scale / targetBag.scale;
        if (Math.abs(numericConversionFactor - 1) > 1e-12) {
          const ratio = numericConversionFactor;
          if (ratio < 1) {
            globalConversionTex = ` \\cdot \\left[\\cfrac{${unitToTex(targetUnit)}}{${fmtScale(1 / ratio, true)}\\,${unitToTex(reqTargetU)}}\\right]`;
          } else {
            globalConversionTex = ` \\cdot \\left[\\cfrac{${fmtScale(ratio, true)}\\,${unitToTex(targetUnit)}}{${unitToTex(reqTargetU)}}\\right]`;
          }
        }
      }
    }
    return { tokenMarkup, conversionFactors: [], conversionFactorTex: "", numericConversionFactor, globalConversionTex, preConversions, tokenConversions, conversionScalars };
  }

  // 2. Pure Physics: Recursive Additive-Branch + Multiplicative AST Analysis
  const cTarget = resolveCanonicalKey(targetVar, varsDb);
  const targetDim = (varsDb[cTarget] || varsDb[targetVar] || {}).dimension || null;

  function hasTopAdditive(node) {
    if (!node) return false;
    if (node.type === "group") return hasTopAdditive(node.expr);
    return node.type === "binary" && (node.op === "+" || node.op === "-");
  }

  function collectAdditiveBranches(node) {
    if (!node) return [];
    if (node.type === "group") return collectAdditiveBranches(node.expr);
    if (node.type === "call" && node.fn === "sqrt" && hasTopAdditive(node.arg)) {
      return collectAdditiveBranches(node.arg).map(b => ({ type: "call", fn: "sqrt", arg: b }));
    }
    if (node.type === "binary" && node.op === "^" && hasTopAdditive(node.left)) {
      return collectAdditiveBranches(node.left).map(b => ({ type: "binary", op: "^", left: b, right: node.right }));
    }
    if (node.type === "binary" && (node.op === "+" || node.op === "-")) {
      return [...collectAdditiveBranches(node.left), ...collectAdditiveBranches(node.right)];
    }
    return [node];
  }

  function isTokenInAdditiveSubtree(node, targetTok, insideAdd = false) {
    if (!node) return false;
    if (node.type === "id") return insideAdd && node.name === targetTok;
    if (node.type === "group") return isTokenInAdditiveSubtree(node.expr, targetTok, insideAdd);
    if (node.type === "call") return isTokenInAdditiveSubtree(node.arg, targetTok, insideAdd);
    if (node.type === "binary") {
      const nextAdd = insideAdd || node.op === "+" || node.op === "-";
      return isTokenInAdditiveSubtree(node.left, targetTok, nextAdd) ||
        isTokenInAdditiveSubtree(node.right, targetTok, nextAdd);
    }
    return false;
  }

  const branches = collectAdditiveBranches(ast);
  const isMultiBranch = branches.length > 1;

  // A dimensionless physical ratio projected into a percentage target must
  // acquire the target unit's scale. Percentage is intentionally distinct
  // from ordinary dimensionless units in the semantic unit registry.
  function isDimensionlessBranch(branchAst) {
    const exps = collectTokenExponents(branchAst);
    const dimensions = {};

    for (const [tok, exp] of Object.entries(exps)) {
      const cKey = resolveCanonicalKey(tok, varsDb);
      const meta = varsDb[cKey] || varsDb[tok] || {};
      const uName = S._u?.[cKey] || S._u?.[tok] || meta.unit || "";
      if (!uName || uName === "dimless" || uName === "ratio") continue;

      const dimMap = getUnitAtomBag(uName, meta.dimension).dimMap || {};
      for (const [dim, power] of Object.entries(dimMap)) {
        dimensions[dim] = (dimensions[dim] || 0) + power * exp;
      }
    }

    return Object.values(dimensions).every(power => Math.abs(power) < 1e-9);
  }

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

    const hasExplicitTarget = !!(targetUnit && targetUnit !== "dimless" && targetUnit !== "ratio");
    const branchTargetBag = hasExplicitTarget
      ? getUnitAtomBag(targetUnit, targetDim)
      : null;

    const pairedInSectionC = new Set();
    const resolvedUnitByTok = {};

    const findCounterpart = (tok) => {
      const myInfo = tokenBags[tok];
      if (!myInfo || Math.abs(myInfo.exp) !== 1) return null;
      let fallback = null;
      for (const [otherTok, otherInfo] of Object.entries(tokenBags)) {
        if (
          otherTok === tok ||
          pairedInSectionC.has(otherTok) ||
          Math.abs(otherInfo.exp) !== 1 ||
          otherInfo.exp * myInfo.exp >= 0 ||
          !isDimEqual(myInfo.bag.dimMap, otherInfo.bag.dimMap)
        ) {
          continue;
        }
        const ratio = myInfo.bag.scale / otherInfo.bag.scale;
        if (Math.abs(ratio - 1) < 1e-6) {
          return { tok: otherTok, uName: otherInfo.uName, dim: otherInfo.dim };
        }
        if (!fallback) {
          fallback = { tok: otherTok, uName: otherInfo.uName, dim: otherInfo.dim };
        }
      }
      return fallback;
    };

    // Pass 1: Non-dimensional markers, Section B (affine temp), and Section C (1:1 counterpart bijection)
    for (const tok of branchTokens) {
      const cKey = resolveCanonicalKey(tok, varsDb);
      const meta = varsDb[cKey] || varsDb[tok] || {};
      const uName = S._u?.[cKey] || S._u?.[tok] || meta.unit || "";
      if (!uName || uName === "dimless" || uName === "ratio") continue;

      const fDepth = getFormulaFractionDepth(branchAst, tok) || 0;
      const useInlineUnit = fDepth >= 2;

      if (uName === "%" || uName === "\\%" || exps[tok] === undefined) {
        tokenMarkup[tok] = unitToTex(uName, useInlineUnit, meta.dimension);
        continue;
      }

      if (pairedInSectionC.has(tok)) continue;

      const parsed = parseUnitToSemanticAST(uName, meta.dimension);
      const counterpart = findCounterpart(tok);

      // B. Affine Temperature Conversion (e.g. °F -> °R, °C -> K)
      if (parsed.length === 1 && BASE_UNITS[parsed[0].base]?.dimMap?.Th) {
        const baseMeta = BASE_UNITS[parsed[0].base];
        const isDiff = meta.dimension === "Temperature Difference" || !!meta.isDifference;

        if (!isDiff && baseMeta.offset) {
          const rawVal = S[cKey] !== undefined ? S[cKey] : S[tok];
          const absUnit = getAbsoluteCompanionUnit(uName);
          const offsetVal = baseMeta.offset;
          const formattedNum = fmtSigFig(rawVal, 6, true);

          if (counterpart) {
            tokenMarkup[tok] = `(${formattedNum} + ${offsetVal}) \\, ${unitToCancelledTex(absUnit, false, null, "whole")}`;
            pairedInSectionC.add(tok);
            const otherOffset = getUnitOffset(counterpart.uName, counterpart.dim);
            if (!otherOffset && Math.abs(getUnitAtomBag(absUnit).scale / getUnitAtomBag(counterpart.uName, counterpart.dim).scale - 1) < 1e-6) {
              pairedInSectionC.add(counterpart.tok);
              const otherDepth = getFormulaFractionDepth(branchAst, counterpart.tok) || 0;
              tokenMarkup[counterpart.tok] = unitToCancelledTex(counterpart.uName, otherDepth >= 2, counterpart.dim, "whole");
              resolvedUnitByTok[counterpart.tok] = counterpart.uName;
            }
          } else {
            tokenMarkup[tok] = `(${formattedNum} + ${offsetVal}) \\, ${unitToTex(absUnit)}`;
          }
          resolvedUnitByTok[tok] = absUnit;
          tokenConversions[tok] = ["__AFFINE_CONVERTED__"];
          continue;
        } else if (!isDiff && counterpart) {
          const otherOffset = getUnitOffset(counterpart.uName, counterpart.dim);
          if (!otherOffset && Math.abs(getUnitAtomBag(uName, meta.dimension).scale / getUnitAtomBag(counterpart.uName, counterpart.dim).scale - 1) < 1e-6) {
            tokenMarkup[tok] = unitToCancelledTex(uName, useInlineUnit, meta.dimension, "whole");
            pairedInSectionC.add(tok);
            pairedInSectionC.add(counterpart.tok);
            const otherDepth = getFormulaFractionDepth(branchAst, counterpart.tok) || 0;
            tokenMarkup[counterpart.tok] = unitToCancelledTex(counterpart.uName, otherDepth >= 2, counterpart.dim, "whole");
            resolvedUnitByTok[tok] = uName;
            resolvedUnitByTok[counterpart.tok] = counterpart.uName;
            continue;
          }
        }
      }

      // C. Counterpart with Matching Dimension Vector
      if (counterpart) {
        const bagCurrent = getUnitAtomBag(uName, meta.dimension);
        const bagTarget = getUnitAtomBag(counterpart.uName, counterpart.dim);
        const scaleRatio = bagCurrent.scale / bagTarget.scale;
        const otherDepth = getFormulaFractionDepth(branchAst, counterpart.tok) || 0;
        const otherInline = otherDepth >= 2;

        pairedInSectionC.add(tok);
        pairedInSectionC.add(counterpart.tok);

        if (Math.abs(scaleRatio - 1) < 1e-6) {
          tokenMarkup[tok] = unitToCancelledTex(uName, useInlineUnit, meta.dimension, "whole");
          tokenMarkup[counterpart.tok] = unitToCancelledTex(counterpart.uName, otherInline, counterpart.dim, "whole");
          resolvedUnitByTok[tok] = uName;
          resolvedUnitByTok[counterpart.tok] = counterpart.uName;
          continue;
        }

        if (isDimEqual(bagCurrent.dimMap, bagTarget.dimMap)) {
          const mismatch = formatComponentMismatch(uName, counterpart.uName, meta.dimension, counterpart.dim);
          const cancelMode = mismatch.isComponentBijection ? "component" : "whole";
          tokenMarkup[tok] = unitToCancelledTex(uName, useInlineUnit, meta.dimension, cancelMode);
          tokenMarkup[counterpart.tok] = unitToCancelledTex(counterpart.uName, otherInline, counterpart.dim, cancelMode);

          const mTex = useInlineUnit ? mismatch.tex.replaceAll("\\cfrac", "\\tfrac") : mismatch.tex;
          const mScalars = mismatch.scalars || (mismatch.scalar !== null ? [mismatch.scalar] : []);

          if (fDepth <= 1 || forceInSitu) {
            if (!tokenConversions[tok] && !tokenConversions[counterpart.tok]?.length) {
              tokenConversions[tok] = [mTex];
              conversionScalars.push(...mScalars);
              resolvedUnitByTok[tok] = counterpart.uName;
              resolvedUnitByTok[counterpart.tok] = counterpart.uName;
            } else {
              resolvedUnitByTok[tok] = uName;
              resolvedUnitByTok[counterpart.tok] = counterpart.uName;
            }
          } else if (otherDepth <= 1) {
            const revMismatch = formatComponentMismatch(counterpart.uName, uName, counterpart.dim, meta.dimension);
            const revMode = revMismatch.isComponentBijection ? "component" : "whole";
            tokenMarkup[tok] = unitToCancelledTex(uName, useInlineUnit, meta.dimension, revMode);
            tokenMarkup[counterpart.tok] = unitToCancelledTex(counterpart.uName, otherInline, counterpart.dim, revMode);
            const revTex = otherInline ? revMismatch.tex.replaceAll("\\cfrac", "\\tfrac") : revMismatch.tex;
            const revScalars = revMismatch.scalars || (revMismatch.scalar !== null ? [revMismatch.scalar] : []);
            tokenConversions[counterpart.tok] = [revTex];
            conversionScalars.push(...revScalars);
            resolvedUnitByTok[tok] = uName;
            resolvedUnitByTok[counterpart.tok] = uName;
          } else if (!isMultiBranch && !globalConversionTex) {
            globalConversionTex = mismatch.tex;
            conversionScalars.push(...mScalars);
            resolvedUnitByTok[tok] = counterpart.uName;
            resolvedUnitByTok[counterpart.tok] = counterpart.uName;
          } else {
            tokenConversions[tok] = [mTex];
            conversionScalars.push(...mScalars);
            resolvedUnitByTok[tok] = counterpart.uName;
            resolvedUnitByTok[counterpart.tok] = counterpart.uName;
          }
          continue;
        }
      }
    }

    // Pass 2: Section D — Target Unit Scaling over remaining unpaired tokens
    const remainingTokens = branchTokens.filter(tok => tokenBags[tok] && !pairedInSectionC.has(tok));
    if (remainingTokens.length > 0) {
      const isSingleDimRemaining = !!branchTargetBag
        && remainingTokens.every(tok => isDimEqual(tokenBags[tok].bag.dimMap, branchTargetBag.dimMap));

      // The pairwise shortcut is valid only when every token converts by registered ratios.
      // Atom-soup targets (e.g. kg*m*m/(h*h^2)) fall through to the per-atom compound builder.
      const pairwiseIsCanonical = hasExplicitTarget && isSingleDimRemaining
        && remainingTokens.every(tok => {
          const { uName, dim } = tokenBags[tok];
          return formatPairConversion(uName, targetUnit, dim, targetDim, "whole").scalars.every(isCanonicalScaleFactor);
        });

      if (pairwiseIsCanonical) {
        const mismatchingCount = remainingTokens.filter(tok =>
          Math.abs(tokenBags[tok].bag.scale / branchTargetBag.scale - 1) >= 1e-6
        ).length;

        for (const tok of remainingTokens) {
          const { uName, dim: tokDim, exp: tokExp } = tokenBags[tok];
          const fDepth = getFormulaFractionDepth(branchAst, tok) || 0;
          const useInlineUnit = fDepth >= 2;
          const inAdditive = forceInSitu || isMultiBranch || isTokenInAdditiveSubtree(branchAst, tok);
          const conv = formatPairConversion(uName, targetUnit, tokDim, targetDim, "whole");

          if (!conv.tex) {
            tokenMarkup[tok] = unitToTex(uName, useInlineUnit, tokDim);
            resolvedUnitByTok[tok] = uName;
          } else {
            const cancelTarget = conv.cancelledIndices || (conv.isDecomposed ? "component" : "whole");
            tokenMarkup[tok] = unitToCancelledTex(uName, useInlineUnit, tokDim, cancelTarget);
            const convTex = useInlineUnit ? conv.tex.replaceAll("\\cfrac", "\\tfrac") : conv.tex;
            const convScalars = conv.scalars || (conv.scalar !== null ? [conv.scalar] : []);

            if (!inAdditive && !globalConversionTex && tokExp === 1 && mismatchingCount === 1) {
              globalConversionTex = convTex;
              conversionScalars.push(...convScalars);
              resolvedUnitByTok[tok] = targetUnit;
            } else {
              tokenConversions[tok] = [convTex];
              conversionScalars.push(...convScalars);
              resolvedUnitByTok[tok] = targetUnit;
            }
          }
        }
      } else {
        const entries = remainingTokens.map(tok => ({
          tok,
          uName: tokenBags[tok].uName,
          dim: tokenBags[tok].dim,
          exp: tokenBags[tok].exp
        }));
        const compoundTarget = (targetDim === DIMENSIONS.PERCENTAGE && isDimensionlessBranch(branchAst))
          ? "dimless"
          : (targetUnit || "dimless");
        const compoundDim = compoundTarget === "dimless" ? null : targetDim;
        const { conversionsByToken, scalars, cancelledIndicesByToken, globalConvTex, resolvedUnitsByToken } =
          buildCompoundTokenConversions(entries, compoundTarget, compoundDim);

        for (const [k, convList] of Object.entries(conversionsByToken)) {
          const kDepth = getFormulaFractionDepth(branchAst, k) || 0;
          tokenConversions[k] = kDepth >= 2
            ? convList.map(c => c.replaceAll("\\cfrac", "\\tfrac"))
            : convList;
        }
        for (const [k, idxSet] of Object.entries(cancelledIndicesByToken || {})) {
          if (tokenMarkup[k] !== undefined) continue;
          const kCanon = resolveCanonicalKey(k, varsDb);
          const kMeta = varsDb[kCanon] || varsDb[k] || {};
          const kU = S._u?.[kCanon] || S._u?.[k] || kMeta.unit || "";
          const kDepth = getFormulaFractionDepth(branchAst, k) || 0;
          tokenMarkup[k] = unitToCancelledTex(kU, kDepth >= 2, kMeta.dimension, idxSet);
        }
        Object.assign(resolvedUnitByTok, resolvedUnitsByToken || {});
        if (globalConvTex) {
          if (forceInSitu || isMultiBranch) {
            const attachTok = entries.find(e => e.exp === 1)?.tok;
            if (attachTok) {
              if (!tokenConversions[attachTok]) tokenConversions[attachTok] = [];
              const aDepth = getFormulaFractionDepth(branchAst, attachTok) || 0;
              tokenConversions[attachTok].push(aDepth >= 2 ? globalConvTex.replaceAll("\\cfrac", "\\tfrac") : globalConvTex);
            }
          } else {
            globalConversionTex += globalConvTex;
          }
        }
        conversionScalars.push(...scalars);

        for (const tok of remainingTokens) {
          const { uName, dim: tokDim } = tokenBags[tok];
          const fDepth = getFormulaFractionDepth(branchAst, tok) || 0;
          if (tokenMarkup[tok] === undefined) {
            tokenMarkup[tok] = unitToCancelledTex(uName, fDepth >= 2, tokDim, new Set());
          }
          if (resolvedUnitByTok[tok] === undefined) {
            resolvedUnitByTok[tok] = uName;
          }
        }
      }
    }

    // Solve nested unfactored sums (e.g. 1 / (1/k_1 + 1/k_2)) and transcendental call arguments (e.g. acos(P_cn / P_c))
    const prefixSymbols = { pico: "p", nano: "n", micro: "u", milli: "m", centi: "c", deci: "d", kilo: "k", mega: "M", giga: "G" };
    const unitForSubExpr = (exprNode) => {
      const subExps = collectTokenExponents(exprNode, 1, {});
      const numParts = [];
      const denParts = [];
      for (const [t, p] of Object.entries(subExps)) {
        const cK = resolveCanonicalKey(t, varsDb);
        const m = varsDb[cK] || varsDb[t] || {};
        const u = resolvedUnitByTok[t] || S._u?.[cK] || S._u?.[t] || m.unit || "";
        if (!u || u === "dimless" || u === "ratio") continue;
        for (const f of parseUnitToSemanticAST(u, m.dimension)) {
          const netP = f.power * p;
          if (Math.abs(netP) < 1e-9) continue;
          const bSym = BASE_UNITS[f.base]?.symbol || f.base;
          const pSym = f.prefix ? (prefixSymbols[f.prefix] || f.prefix) : "";
          const absP = Math.abs(netP);
          const uStr = absP === 1 ? `${pSym}${bSym}` : `${pSym}${bSym}^${absP}`;
          if (netP > 0) numParts.push(uStr);
          else denParts.push(uStr);
        }
      }
      const n = numParts.join("*");
      const d = denParts.join("*");
      return d ? `${n || "1"}/(${d})` : (n || "dimless");
    };

    const mergeSubAnalysis = (sub) => {
      for (const [k, m] of Object.entries(sub.tokenMarkup || {})) {
        if (tokenMarkup[k] !== undefined) continue;
        const kDepth = getFormulaFractionDepth(branchAst, k) || 0;
        tokenMarkup[k] = kDepth >= 2 ? m.replaceAll("\\cfrac", "\\tfrac") : m;
      }
      for (const [k, list] of Object.entries(sub.tokenConversions || {})) {
        if (tokenConversions[k]) continue;
        const kDepth = getFormulaFractionDepth(branchAst, k) || 0;
        tokenConversions[k] = kDepth >= 2 ? list.map(c => c.replaceAll("\\cfrac", "\\tfrac")) : list;
      }
      conversionScalars.push(...(sub.conversionScalars || []));
    };

    const unfactoredSums = [];
    const transcendentalArgs = [];
    (function scanNested(n) {
      if (!n) return;
      if (n.type === "group") { scanNested(n.expr); return; }
      if (n.type === "call") {
        if (n.fn === "sqrt" || n.fn === "abs") scanNested(n.arg);
        else if (!["sin", "cos", "tan"].includes(n.fn)) transcendentalArgs.push(n.arg);
        return;
      }
      if (n.type === "binary") {
        if (n.op === "+" || n.op === "-") {
          const flat = [];
          (function collectTerms(t) {
            const u = t && t.type === "group" ? t.expr : t;
            if (u && u.type === "binary" && (u.op === "+" || u.op === "-")) {
              collectTerms(u.left);
              collectTerms(u.right);
            } else if (u) {
              flat.push(u);
            }
          })(n);
          if (flat.length > 1) {
            unfactoredSums.push({ firstTerm: flat[0], siblingTerms: flat.slice(1) });
            scanNested(flat[0]);
            return;
          }
        }
        scanNested(n.left);
        scanNested(n.right);
      }
    })(branchAst);

    for (const { firstTerm, siblingTerms } of unfactoredSums) {
      const sibTargetUnit = unitForSubExpr(firstTerm);
      for (const sib of siblingTerms) {
        mergeSubAnalysis(solveUnitAlgebra(sib, S, "__sum_sib__", sibTargetUnit, varsDb, null, true));
      }
    }
    for (const argNode of transcendentalArgs) {
      mergeSubAnalysis(solveUnitAlgebra(argNode, S, "__call_arg__", "dimless", varsDb, null, true));
    }
  }

  if (
    !forceInSitu &&
    targetUnit &&
    targetDim === DIMENSIONS.PERCENTAGE &&
    branches.length > 0 &&
    branches.every(isDimensionlessBranch)
  ) {
    const targetScale = getUnitAtomBag(targetUnit, targetDim).scale;
    if (Number.isFinite(targetScale) && targetScale > 0) {
      const ratioToTarget = 1 / targetScale;
      if (Math.abs(ratioToTarget - 1) > 1e-12) {
        globalConversionTex += ` \\cdot ${fmtScale(ratioToTarget)}`;
        conversionScalars.push(ratioToTarget);
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
    if (node.fn === "abs") {
      return collectTokenExponents(node.arg, sign, acc);
    }
    // Transcendental calls (sin, cos, tan, exp, ln, log, etc.) consume their argument units
    return acc;
  }
  if (node.type === "binary") {
    if (node.op === "+" || node.op === "-") {
      // Terms of a sum are alternatives of one shared dimension: count one representative.
      collectTokenExponents(node.left, sign, acc);
    } else if (node.op === "*") {
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
