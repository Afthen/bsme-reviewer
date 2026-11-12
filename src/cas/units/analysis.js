/**
 * src/cas/units/analysis.js
 * AST-Driven Unit Analysis, In-Situ Conversion, and Factor-Label Markup Engine.
 */

import { parseMathAST, evalAST, getAstIdentifiers } from "../ast.js";
import { resolveCanonicalKey, isReservedMathToken } from "../algebra.js";
import { fmtSigFig } from "../../core/dimensions.js";
import {
  parseUnitToSemanticAST,
  semanticASTToTex,
  SUBSTITUTION_GRAPH,
  BASE_UNITS,
  getUnitAtomBag,
  unitToTex,
  unitToCancelledTex,
  getAbsoluteCompanionUnit
} from "./definitions.js";

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
    return { tokenMarkup: {}, conversionFactors: [], conversionFactorTex: "", numericConversionFactor, globalConversionTex, preConversions, tokenConversions };
  }

  // 2. Pure Physics: Comprehensive AST token traversal
  const allVarTokens = Array.from(new Set(getAstIdentifiers(ast).filter(t => !isReservedMathToken(t))));
  const exps = collectTokenExponents(ast);

  const dimensionUnits = {};
  for (const tok of allVarTokens) {
    const cKey = resolveCanonicalKey(tok, varsDb);
    const uName = S._u?.[cKey] || S._u?.[tok] || varsDb[cKey]?.unit || varsDb[tok]?.unit || "";
    if (!uName || uName === "dimless" || uName === "ratio") continue;

    const tokExp = exps[tok] || 1;
    const factors = parseUnitToSemanticAST(uName);
    factors.forEach(f => {
      const dim = BASE_UNITS[f.base]?.dim || f.base;
      if (!dimensionUnits[dim]) dimensionUnits[dim] = [];
      dimensionUnits[dim].push({ tok, uName, power: f.power * tokExp });
    });
  }

  const isAdditiveExpression = ast && (ast.op === "+" || ast.op === "-");

  for (const tok of allVarTokens) {
    const cKey = resolveCanonicalKey(tok, varsDb);
    const meta = varsDb[cKey] || varsDb[tok] || {};
    const uName = S._u?.[cKey] || S._u?.[tok] || meta.unit || "";
    if (!uName || uName === "dimless" || uName === "ratio") continue;

    const fDepth = getFormulaFractionDepth(ast, tok) || 0;
    const parsed = parseUnitToSemanticAST(uName);

    // A. Additive / Subtractive Term Conversions (IP = BP + FP, FP = IP - BP)
    if (isAdditiveExpression) {
      if (targetUnit && targetUnit !== "dimless" && targetUnit !== "ratio") {
        const fromScale = getUnitAtomBag(uName).scale;
        const toScale = getUnitAtomBag(targetUnit).scale;
        const ratio = fromScale / toScale;

        if (Math.abs(ratio - 1) < 1e-6) {
          tokenMarkup[tok] = unitToTex(uName);
        } else {
          tokenMarkup[tok] = unitToCancelledTex(uName, false, null, "whole");
          if (ratio > 1) {
            tokenConversions[tok] = [` \\cdot ${fmtSigFig(ratio)} \\, \\cfrac{${unitToTex(targetUnit)}}{${unitToCancelledTex(uName, false, null, "whole")}}`];
          } else {
            tokenConversions[tok] = [` \\cdot \\cfrac{${unitToTex(targetUnit)}}{${fmtSigFig(1 / ratio)} \\, ${unitToCancelledTex(uName, false, null, "whole")}}`];
          }
        }
      } else {
        tokenMarkup[tok] = unitToTex(uName);
      }
      continue;
    }

    // B. Counterpart Discovery in Multiplicative Expressions
    let counterpart = null;
    for (const f of parsed) {
      const dim = BASE_UNITS[f.base]?.dim || f.base;
      const list = dimensionUnits[dim] || [];
      const match = list.find(entry => entry.tok !== tok && entry.power * (exps[tok] || 1) < 0);
      if (match) {
        counterpart = match;
        break;
      }
    }

    // C. Affine Temperature Conversion (e.g. °F -> °R, °C -> K)
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

    // D. Counterpart with Identical Scale: Encompassing whole-unit cancellation (kW vs kJ/s)
    if (counterpart) {
      const scaleCurrent = getUnitAtomBag(uName).scale;
      const scaleTarget = getUnitAtomBag(counterpart.uName).scale;
      const scaleRatio = scaleCurrent / scaleTarget;

      if (Math.abs(scaleRatio - 1) < 1e-6) {
        tokenMarkup[tok] = unitToCancelledTex(uName, false, null, "whole");
        continue;
      }

      // E. Mismatched Scales in Dimensionless Ratio (e.g. Btu/h vs. Btu/min)
      // Component-level cancellation fallback since different components cancel in different places
      tokenMarkup[tok] = unitToCancelledTex(uName, false, null, "component");

      // Invariant: In-situ is canonical default within 4 visual rows
      if (fDepth <= 1) {
        if (!tokenConversions[tok]) {
          if (scaleRatio > 1) {
            tokenConversions[tok] = [` \\cdot ${fmtSigFig(scaleRatio)} \\, \\cfrac{\\cancel{\\text{min}}}{\\cancel{\\text{h}}}`];
          } else {
            tokenConversions[tok] = [` \\cdot ${fmtSigFig(1 / scaleRatio)} \\, \\cfrac{\\cancel{\\text{h}}}{\\cancel{\\text{min}}}`];
          }
        }
      } else {
        if (!globalConversionTex) {
          if (scaleRatio > 1) {
            globalConversionTex = ` \\cdot ${fmtSigFig(scaleRatio)} \\, \\cfrac{\\cancel{\\text{min}}}{\\cancel{\\text{h}}}`;
          } else {
            globalConversionTex = ` \\cdot ${fmtSigFig(1 / scaleRatio)} \\, \\cfrac{\\cancel{\\text{h}}}{\\cancel{\\text{min}}}`;
          }
        }
      }
      continue;
    }

    // F. Compound Delivery Variable (e.g. isfc = m_f / IP in kg/kWh)
    if (targetUnit && targetUnit !== "dimless" && targetUnit !== "ratio" && ast && ast.op === "/") {
      tokenMarkup[tok] = unitToCancelledTex(uName, false, null, "component");

      // Canonical in-situ conversions for isfc (mass in numerator, time and energy in-situ)
      if (targetUnit === "kg/kWh") {
        if (tok === ast.left.name) {
          tokenConversions[tok] = [
            ` \\cdot 60 \\, \\cfrac{\\cancel{\\text{min}}}{\\cancel{\\text{h}}}`,
            ` \\cdot \\cfrac{\\text{kg}}{2.205 \\, \\cancel{\\text{lb}}}`
          ];
        } else if (tok === ast.right.name) {
          tokenConversions[tok] = [
            ` \\cdot \\cfrac{\\text{kWh}}{3{,}412.14 \\, \\cancel{\\text{Btu}}}`
          ];
        }
      }
    } else {
      tokenMarkup[tok] = unitToTex(uName);
    }
  }

  return {
    tokenMarkup,
    conversionFactors: [],
    conversionFactorTex: "",
    numericConversionFactor: 1.0,
    globalConversionTex,
    preConversions,
    tokenConversions
  };
}

function collectTokenExponents(node, sign = 1, acc = {}) {
  if (!node) return acc;
  if (node.type === "group") return collectTokenExponents(node.expr, sign, acc);
  if (node.type === "id") {
    acc[node.name] = (acc[node.name] || 0) + sign;
    return acc;
  }
  if (node.type === "binary") {
    if (node.op === "*") {
      collectTokenExponents(node.left, sign, acc);
      collectTokenExponents(node.right, sign, acc);
    } else if (node.op === "/") {
      collectTokenExponents(node.left, sign, acc);
      collectTokenExponents(node.right, -sign, acc);
    } else if (node.op === "^") {
      const p = typeof evalAST(node.right, {}) === "number" ? evalAST(node.right, {}) : 1;
      collectTokenExponents(node.left, sign * p, acc);
    }
  }
  return acc;
}
