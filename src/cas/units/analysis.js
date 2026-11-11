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

  // 2. Pure Physics: Net Exponent Dimensional Cancellation & In-Situ Conversion
  const exps = collectTokenExponents(ast);
  const allTokens = Array.from(new Set(Object.keys(exps)));

  // Collect net base unit factors across the AST to identify natural cancellation
  const netDimensionTally = {};
  for (const tok of allTokens) {
    const cKey = resolveCanonicalKey(tok, varsDb);
    const uName = S._u?.[cKey] || S._u?.[tok] || varsDb[cKey]?.unit || varsDb[tok]?.unit || "";
    if (!uName || uName === "dimless" || uName === "ratio") continue;

    const tokExp = exps[tok] || 1;
    const factors = parseUnitToSemanticAST(uName);
    factors.forEach(f => {
      const dim = BASE_UNITS[f.base]?.dim || f.base;
      netDimensionTally[dim] = (netDimensionTally[dim] || 0) + f.power * tokExp;
    });
  }

  const isDimensionlessRatio = Object.values(netDimensionTally).every(p => p === 0);

  // If the expression is a dimensionless ratio where like-units match across terms
  if (isDimensionlessRatio) {
    for (const tok of allTokens) {
      const cKey = resolveCanonicalKey(tok, varsDb);
      const uName = S._u?.[cKey] || S._u?.[tok] || varsDb[cKey]?.unit || varsDb[tok]?.unit || "";
      if (uName && uName !== "dimless" && uName !== "ratio") {
        tokenMarkup[tok] = `\\cancel{${unitToTex(uName)}}`;
      }
    }
    return { tokenMarkup, conversionFactors: [], conversionFactorTex: "", numericConversionFactor: 1.0, globalConversionTex: "", preConversions, tokenConversions };
  }

  // Non-zero net dimensions: In-situ component conversion & factor-label placement
  const isTargetUS = targetUnit && ["lb", "ft", "in", "hp", "Btu", "psi", "psf"].some(u => targetUnit.includes(u));

  for (const tok of allTokens) {
    const cKey = resolveCanonicalKey(tok, varsDb);
    const uName = S._u?.[cKey] || S._u?.[tok] || varsDb[cKey]?.unit || varsDb[tok]?.unit || "";
    if (!uName || uName === "dimless" || uName === "ratio") continue;

    const factors = parseUnitToSemanticAST(uName);
    const numFactors = factors.filter(f => f.power > 0);
    const denFactors = factors.filter(f => f.power < 0);

    // Compound unit block conversion (e.g. Btu/h -> kW / (kJ/s))
    if (uName === "Btu/h" || uName === "Btu/min") {
      const uScale = getUnitAtomBag(uName).scale;
      // If target is Power (e.g. hp), convert directly to target unit
      if (targetUnit && (targetUnit === "hp" || targetUnit === "kW")) {
        const tgtScale = getUnitAtomBag(targetUnit).scale;
        const ratio = tgtScale / uScale;
        const ratioStr = fmtSigFig(ratio, 6);
        tokenMarkup[tok] = `\\cancel{${unitToTex(uName)}}`;
        tokenConversions[tok] = [` \\cdot \\cfrac{${unitToTex(targetUnit)}}{${ratioStr}\\,\\cancel{${unitToTex(uName)}}}`];
      } else {
        // Coherent base: 1 kW = 1 kJ/s drop-in replacement
        const kwScale = 1000.0;
        const ratio = kwScale / uScale;
        const ratioStr = fmtSigFig(ratio, 6);
        tokenMarkup[tok] = `\\cancel{${unitToTex(uName)}}`;
        tokenConversions[tok] = [` \\cdot \\cfrac{ \\cfrac{\\cancel{\\text{kJ}}}{\\text{s}} }{${ratioStr}\\,\\cancel{${unitToTex(uName)}}}`];
      }
      continue;
    }

    // In-situ component factor conversion within compound units (e.g., kg/kWh)
    const numParts = [];
    numFactors.forEach(f => {
      const fullBase = `${f.prefix ? (BASE_UNITS[f.base]?.symbol ? f.prefix.charAt(0) : f.prefix) : ""}${BASE_UNITS[f.base]?.symbol || f.base}`;
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
