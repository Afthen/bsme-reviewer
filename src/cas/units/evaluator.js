/**
 * src/cas/units/evaluator.js
 * Numerical evaluation of physical AST formulas with:
 * - Coherent SI base unit transformation for pure physics relations,
 *   guaranteeing consistent multi-unit additions/subtractions (e.g. hp + W)
 * - Explicit requiredUnits contract preservation for empirical formulations
 * - Trigonometric unit resolution for bare angle tokens in degrees
 */

import { evalAST, getAstIdentifiers } from "../ast.js";
import { resolveCanonicalKey, isReservedMathToken } from "../algebra.js";
import { solveUnitAlgebra } from "./analysis.js";
import { getUnitAtomBag } from "./definitions.js";

export function isExpressionInDegrees(node, S, varsDb) {
  if (!node) return false;
  if (node.type === "id") {
    const cKey = resolveCanonicalKey(node.name, varsDb);
    const u = S._u?.[cKey] || S._u?.[node.name] || varsDb[cKey]?.unit || varsDb[node.name]?.unit;
    return u === "deg" || u === "°";
  }
  if (node.type === "group") return isExpressionInDegrees(node.expr, S, varsDb);
  return false;
}

export function evaluatePhysicalAST(node, S, targetVar, varsDb = {}, requiredUnits = null) {
  if (!node) return { value: NaN, unitAnalysis: null };
  const cTarget = resolveCanonicalKey(targetVar, varsDb);
  const targetUnit = S._u?.[cTarget] || S._u?.[targetVar] || varsDb[cTarget]?.unit || varsDb[targetVar]?.unit || "dimless";

  const unitAnalysis = solveUnitAlgebra(node, S, targetVar, targetUnit, varsDb, requiredUnits);

  // 1. Empirical Formulas with requiredUnits: preserve dedicated factor-label conversions
  if (requiredUnits && typeof requiredUnits === "object") {
    const evalState = { ...S };
    if (unitAnalysis.preConversions && unitAnalysis.preConversions.length > 0) {
      unitAnalysis.preConversions.forEach(pc => {
        evalState[pc.token] = pc.convertedVal;
        evalState[pc.canonicalKey] = pc.convertedVal;
      });
    }

    const unitResolver = (argNode) => isExpressionInDegrees(argNode, S, varsDb);
    const rawNum = evalAST(node, evalState, unitResolver);
    if (isNaN(rawNum)) return { value: NaN, unitAnalysis };

    const finalValue = rawNum * (unitAnalysis.numericConversionFactor || 1.0);
    return { value: finalValue, unitAnalysis };
  }

  // 2. Pure Physics Relations: transform all tokens into coherent SI base units
  //    before AST evaluation so operations like BP (hp) + FP (W) evaluate accurately
  const coherentState = { ...S };
  const varTokens = getAstIdentifiers(node).filter(t => !isReservedMathToken(t));

  varTokens.forEach(tok => {
    const cKey = resolveCanonicalKey(tok, varsDb);
    const uName = S._u?.[cKey] || S._u?.[tok] || varsDb[cKey]?.unit || varsDb[tok]?.unit || "";

    if (uName && uName !== "dimless" && uName !== "ratio" && uName !== "deg" && uName !== "°") {
      const bag = getUnitAtomBag(uName);
      const rawVal = S[cKey] !== undefined ? S[cKey] : S[tok];
      if (typeof rawVal === "number" && !isNaN(rawVal)) {
        const valInBase = rawVal * (bag.scale || 1.0);
        coherentState[tok] = valInBase;
        coherentState[cKey] = valInBase;
      }
    }
  });

  const unitResolver = (argNode) => isExpressionInDegrees(argNode, S, varsDb);
  const coherentNum = evalAST(node, coherentState, unitResolver);
  if (isNaN(coherentNum)) return { value: NaN, unitAnalysis };

  const targetBag = getUnitAtomBag(targetUnit);
  const targetScale = targetBag.scale || 1.0;
  const finalValue = targetScale > 0 ? (coherentNum / targetScale) : coherentNum;

  return { value: finalValue, unitAnalysis };
}
