/**
 * src/cas/units/evaluator.js
 * Numerical evaluation of physical AST formulas with trigonometric unit resolution.
 */

import { evalAST } from "../ast.js";
import { resolveCanonicalKey } from "../algebra.js";
import { solveUnitAlgebra } from "./analysis.js";

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
