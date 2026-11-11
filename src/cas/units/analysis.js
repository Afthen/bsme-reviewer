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
  unitToTex
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

  // 1. Handling empirical relations with requiredUnits contracts
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

  // 2. Pure physics dimensional analysis & Factor-Label in-situ unit conversions
  const allTokens = Array.from(new Set(getAstIdentifiers(ast).filter(t => !isReservedMathToken(t))));

  for (const tok of allTokens) {
    const cKey = resolveCanonicalKey(tok, varsDb);
    const uName = S._u?.[cKey] || S._u?.[tok] || varsDb[cKey]?.unit || varsDb[tok]?.unit || "";
    if (!uName || uName === "dimless" || uName === "ratio") continue;

    const factors = parseUnitToSemanticAST(uName);
    const numFactors = factors.filter(f => f.power > 0);
    const denFactors = factors.filter(f => f.power < 0);

    // Identify target unit system context
    const isTargetUS = targetUnit && ["lb", "ft", "in", "hp", "Btu", "psi", "psf"].some(u => targetUnit.includes(u));

    // A. Check for compound block conversion (e.g., Btu/h -> kW / (kJ/s))
    if (uName === "Btu/h" || uName === "Btu/min") {
      const uScale = getUnitAtomBag(uName).scale;
      const kwScale = 1000.0;
      const ratio = kwScale / uScale; // 3412.14
      const ratioStr = fmtSigFig(ratio, 6);

      const fDepth = getFormulaFractionDepth(ast, tok) || 0;
      // Fraction height check: block fraction is level 2; if fDepth > 0, height = 3 > 2 (illegal)
      if (fDepth === 0) {
        tokenMarkup[tok] = `\\cancel{${unitToTex(uName)}}`;
        tokenConversions[tok] = [` \\cdot \\cfrac{\\cfrac{\\cancel{\\text{kJ}}}{\\text{s}}}{${ratioStr}\\,\\cancel{${unitToTex(uName)}}}`];
      } else {
        tokenMarkup[tok] = unitToTex(uName);
        globalConversionTex += ` \\cdot \\cfrac{\\cfrac{\\cancel{\\text{kJ}}}{\\text{s}}}{${ratioStr}\\,\\cancel{${unitToTex(uName)}}}`;
      }
      continue;
    }

    // B. In-situ conversion within numerator and denominator factors
    const numParts = [];
    numFactors.forEach(f => {
      const fullBase = `${f.prefix ? (BASE_UNITS[f.base]?.symbol ? f.prefix.charAt(0) : f.prefix) : ""}${BASE_UNITS[f.base]?.symbol || f.base}`;
      // Mass conversion: kg -> lb if target is US
      if (fullBase === "kg" && isTargetUS) {
        const kgScale = getUnitAtomBag("kg").scale;
        const lbScale = getUnitAtomBag("lb").scale;
        const ratio = fmtSigFig(kgScale / lbScale, 4); // 2.205
        numParts.push(`\\cancel{\\text{kg}} \\cdot ${ratio}\\cfrac{\\text{lb}}{\\cancel{\\text{kg}}}`);
      } else {
        numParts.push(`\\text{${fullBase}}`);
      }
    });

    const denParts = [];
    denFactors.forEach(f => {
      const fullBase = `${f.prefix ? (BASE_UNITS[f.base]?.symbol ? f.prefix.charAt(0) : f.prefix) : ""}${BASE_UNITS[f.base]?.symbol || f.base}`;
      // Energy conversion: kWh -> kJ
      if (fullBase === "kWh") {
        const kwhScale = getUnitAtomBag("kWh").scale;
        const kjScale = getUnitAtomBag("kJ").scale;
        const ratio = fmtSigFig(kwhScale / kjScale, 6); // 3600
        denParts.push(`\\cancel{\\text{kWh}} \\cdot ${ratio}\\cfrac{\\cancel{\\text{kJ}}}{\\cancel{\\text{kWh}}}`);
      } else {
        denParts.push(`\\text{${fullBase}}`);
      }
    });

    if (denParts.length > 0) {
      tokenMarkup[tok] = `\\cfrac{${numParts.join("\\cdot ") || "1"}}{${denParts.join("\\cdot ")}}`;
    } else {
      tokenMarkup[tok] = numParts.join("\\cdot ");
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
