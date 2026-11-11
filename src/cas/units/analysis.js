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

  // 2. Pure Physics: Universal Dimensional Pipeline (Zero Hardcoding)
  const exps = collectTokenExponents(ast);
  const allTokens = Array.from(new Set(Object.keys(exps)));

  // Identify active system context (SI vs US) from targetUnit or state
  const isUS = targetUnit ? ["lb", "ft", "in", "hp", "Btu", "psi", "psf", "°F", "°R"].some(u => targetUnit.includes(u)) : (S.sys === "US");

  // Dimensional tally across AST
  const dimensionUnits = {};
  for (const tok of allTokens) {
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

  // Universal Token Inspection
  for (const tok of allTokens) {
    const cKey = resolveCanonicalKey(tok, varsDb);
    const meta = varsDb[cKey] || varsDb[tok] || {};
    const uName = S._u?.[cKey] || S._u?.[tok] || meta.unit || "";
    if (!uName || uName === "dimless" || uName === "ratio") continue;

    const fDepth = getFormulaFractionDepth(ast, tok) || 0;

    // Check if another token shares this dimension with opposite exponent
    const tokFactors = parseUnitToSemanticAST(uName);
    let counterpart = null;
    for (const f of tokFactors) {
      const dim = BASE_UNITS[f.base]?.dim || f.base;
      const list = dimensionUnits[dim] || [];
      const match = list.find(entry => entry.tok !== tok && entry.power * (exps[tok] || 1) < 0);
      if (match) {
        counterpart = match;
        break;
      }
    }

    // A. Identical Units with opposite exponents: direct in-situ cancellation
    if (counterpart && counterpart.uName === uName) {
      tokenMarkup[tok] = `\\cancel{${unitToTex(uName)}}`;
      continue;
    }

    // B. Mismatched Scales in Dimensionless Ratio (e.g., Btu/h vs Btu/min in Q_ip / Q_f)
    if (counterpart && counterpart.uName !== uName) {
      const scaleCurrent = getUnitAtomBag(uName).scale;
      const scaleTarget = getUnitAtomBag(counterpart.uName).scale;
      const scaleRatio = scaleCurrent / scaleTarget;

      tokenMarkup[tok] = `\\cancel{${unitToTex(uName)}}`;

      // Clamping rule: If inside a fraction (fDepth >= 1), placing conversion inside
      // would create level 3 (illegal) -> place inline outside main fraction
      if (fDepth >= 1) {
        if (!globalConversionTex) {
          if (scaleRatio > 1) {
            globalConversionTex = ` \\cdot \\cfrac{${fmtSigFig(scaleRatio)}\\,\\cancel{\\text{min}}}{\\cancel{\\text{h}}}`;
          } else {
            globalConversionTex = ` \\cdot \\cfrac{\\cancel{\\text{h}}}{${fmtSigFig(1 / scaleRatio)}\\,\\cancel{\\text{min}}}`;
          }
        }
      } else {
        // At top level (fDepth == 0): sits beside the variable
        if (scaleRatio > 1) {
          tokenConversions[tok] = [` \\cdot \\cfrac{${fmtSigFig(scaleRatio)}\\,\\cancel{${unitToTex(counterpart.uName)}}}{\\cancel{${unitToTex(uName)}}}`];
        } else {
          tokenConversions[tok] = [` \\cdot \\cfrac{\\cancel{${unitToTex(counterpart.uName)}}}{${fmtSigFig(1 / scaleRatio)}\\,\\cancel{${unitToTex(uName)}}}`];
        }
      }
      continue;
    }

    // A. Universal Affine Temperature Conversion (e.g., °F -> °R, °C -> K)
    const parsed = parseUnitToSemanticAST(uName);
    if (parsed.length === 1 && BASE_UNITS[parsed[0].base]?.dim === "Th") {
      const baseMeta = BASE_UNITS[parsed[0].base];
      const isDiff = meta.dimension === "Temperature Difference" || !!meta.isDifference;

      if (!isDiff && baseMeta.offset) {
        const rawVal = S[cKey] !== undefined ? S[cKey] : S[tok];
        const absUnit = isUS ? "°R" : "K";
        const offsetVal = baseMeta.offset;
        const formattedNum = fmtSigFig(rawVal, 6);

        // Explicit in-situ affine conversion
        tokenMarkup[tok] = `(${formattedNum} + ${offsetVal})\\,${unitToTex(absUnit)}`;
        tokenConversions[tok] = ["__AFFINE_CONVERTED__"];
        continue;
      }
    }

    // B. Universal Multiplicative Scale & Drop-In Conversion
    const workingUnit = isUS
      ? (meta.dimension === "Power" ? (targetUnit === "hp" ? "hp" : "kW") : uName)
      : uName;

    const fromScale = getUnitAtomBag(uName).scale;
    const toScale = getUnitAtomBag(workingUnit).scale;
    const ratio = toScale / fromScale;

    if (Math.abs(ratio - 1) > 1e-6) {
      const ratioStr = fmtSigFig(ratio, 6);
      tokenMarkup[tok] = `\\cancel{${unitToTex(uName)}}`;
      tokenConversions[tok] = [` \\cdot \\cfrac{${unitToTex(workingUnit)}}{${ratioStr}\\,\\cancel{${unitToTex(uName)}}}`];
      continue;
    }

    // In-situ component conversion for compound fractions (e.g. kg/kWh -> lb/s)
    const numFactors = parsed.filter(f => f.power > 0);
    const denFactors = parsed.filter(f => f.power < 0);

    const numParts = [];
    numFactors.forEach(f => {
      const bMeta = BASE_UNITS[f.base];
      const fullBase = `${f.prefix ? (bMeta?.symbol ? f.prefix.charAt(0) : f.prefix) : ""}${bMeta?.symbol || f.base}`;
      // Mass conversion: kg -> lb if target is US
      if (bMeta?.dim === "M" && isUS && fullBase === "kg") {
        const kgScale = getUnitAtomBag("kg").scale;
        const lbScale = getUnitAtomBag("lb").scale;
        const rStr = fmtSigFig(kgScale / lbScale, 4);
        numParts.push(`\\cancel{\\text{kg}} \\cdot ${rStr}\\cfrac{\\text{lb}}{\\cancel{\\text{kg}}}`);
      } else {
        numParts.push(`\\text{${fullBase}}`);
      }
    });

    const denParts = [];
    denFactors.forEach(f => {
      const bMeta = BASE_UNITS[f.base];
      const fullBase = `${f.prefix ? (bMeta?.symbol ? f.prefix.charAt(0) : f.prefix) : ""}${bMeta?.symbol || f.base}`;
      if (fullBase === "kWh") {
        const kwhScale = getUnitAtomBag("kWh").scale;
        const kjScale = getUnitAtomBag("kJ").scale;
        const rStr = fmtSigFig(kwhScale / kjScale, 6);
        denParts.push(`\\cancel{\\text{kWh}} \\cdot ${rStr}\\cfrac{\\cancel{\\text{kJ}}}{\\cancel{\\text{kWh}}}`);
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
