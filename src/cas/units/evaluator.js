/**
 * src/cas/units/evaluator.js
 * Universal physical AST evaluator:
 * - Pure physics relations: transforms all input variables into coherent SI base units
 *   via valueToCoherentBase, evaluates AST in coherent base, and projects the result
 *   into targetUnit via formatValueInUnit (ensuring exact affine & scale conversions)
 * - Identifies temperature difference variables (DIMENSIONS.TEMPERATURE_DIFF) to bypass
 *   affine origin offsets during base conversion and projection
 * - Empirical relations with requiredUnits: converts inputs to requiredUnits via preConversions,
 *   evaluates AST in required units, and projects result into targetUnit via numericConversionFactor
 * - Resolves bare angle tokens in degrees for trigonometric functions
 */

import { evalAST, getAstIdentifiers } from "../ast.js";
import { resolveCanonicalKey, isReservedMathToken } from "../algebra.js";
import { solveUnitAlgebra } from "./analysis.js";
import { valueToCoherentBase, formatValueInUnit } from "./definitions.js";
import { DIMENSIONS } from "../../core/dimensions.js";

export function isExpressionInDegrees(node, S, varsDb) {
  if (!node) return false;
  if (node.type === "id") {
    const cKey = resolveCanonicalKey(node.name, varsDb);
    const u = S._u?.[cKey] || S._u?.[node.name] || varsDb[cKey]?.unit || varsDb[node.name]?.unit;
    return u === "deg" || u === "°";
  }
  if (node.type === "group") return isExpressionInDegrees(node.expr, S, varsDb);
  if (node.type === "binary") return isExpressionInDegrees(node.left, S, varsDb) || isExpressionInDegrees(node.right, S, varsDb);
  return false;
}

function isDifferenceVariable(key, varsDb) {
  const meta = varsDb[key] || {};
  return meta.dimension === DIMENSIONS.TEMPERATURE_DIFF || !!meta.isDifference;
}

export function evaluatePhysicalAST(node, S, targetVar, varsDb = {}, requiredUnits = null) {
  if (!node) return { value: NaN, unitAnalysis: null };
  const cTarget = resolveCanonicalKey(targetVar, varsDb);
  const targetUnit = S._u?.[cTarget] || S._u?.[targetVar] || varsDb[cTarget]?.unit || varsDb[targetVar]?.unit || "dimless";

  const unitAnalysis = solveUnitAlgebra(node, S, targetVar, targetUnit, varsDb, requiredUnits);

  // 1. Empirical formulas with requiredUnits (e.g. Buckingham, Carrier, Liley, BSFC):
  //    Inputs convert into requiredUnits via preConversions; result converts into targetUnit
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

  // 2. Pure physics relations: transform all input variables into coherent SI base units
  //    before AST evaluation so multi-unit expressions (e.g. hp + W) evaluate accurately
  const coherentState = { ...S };
  const varTokens = getAstIdentifiers(node).filter(t => !isReservedMathToken(t));

  varTokens.forEach(tok => {
    const cKey = resolveCanonicalKey(tok, varsDb);
    const meta = varsDb[cKey] || varsDb[tok] || {};
    const uName = S._u?.[cKey] || S._u?.[tok] || meta.unit || "";

    if (uName && uName !== "dimless" && uName !== "ratio") {
      const rawVal = S[cKey] !== undefined ? S[cKey] : S[tok];
      if (typeof rawVal === "number" && !isNaN(rawVal)) {
        const isDiff = isDifferenceVariable(cKey, varsDb) || isDifferenceVariable(tok, varsDb);
        const valInBase = valueToCoherentBase(rawVal, uName, isDiff, meta.dimension);
        coherentState[tok] = valInBase;
        coherentState[cKey] = valInBase;
      }
    }
  });

  const coherentNum = evalAST(node, coherentState, null);
  if (isNaN(coherentNum)) return { value: NaN, unitAnalysis };

  // Project coherent SI base result into requested targetUnit with target dimension awareness
  const targetMeta = varsDb[cTarget] || varsDb[targetVar] || {};
  const targetIsDiff = isDifferenceVariable(cTarget, varsDb) || isDifferenceVariable(targetVar, varsDb);
  const finalValue = formatValueInUnit(coherentNum, targetUnit, targetIsDiff, targetMeta.dimension);
  return { value: finalValue, unitAnalysis };
}
