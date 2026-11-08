/**
 * src/core/derivation.js
 * Universal Graph + CAS Derivation Engine.
 * Empirical equations are protected from symbolic inlining; units rendered via pure atomic bags.
 */

import { resolveCanonicalKey, substituteExpression, simplifyExpression } from "../cas/algebra.js";
import { casToTex } from "../cas/latex.js";
import { solveUnitAlgebra, getUnitAtomBag } from "../cas/units.js";
import { fmtSigFig } from "./dimensions.js";

export function buildDerivationStep(step, S, varsDb = {}) {
  const { targetVar, baseFormula, equationTex, rhsExpr, requiredUnits } = step;
  const canonicalTarget = resolveCanonicalKey(targetVar, varsDb);
  const targetMeta = varsDb[canonicalTarget] || varsDb[targetVar] || {};
  const targetSymbol = targetMeta.symbol || targetVar;
  const targetUnit = S._u?.[canonicalTarget] || S._u?.[targetVar] || targetMeta.unit || "";

  const symbolicTex = equationTex || `${targetSymbol} = ${casToTex(rhsExpr || baseFormula, varsDb)}`;
  const unitAnalysis = solveUnitAlgebra(rhsExpr || baseFormula, S, targetVar, targetUnit, varsDb, requiredUnits);

  const subsMap = {};
  const evalState = { ...S };

  if (unitAnalysis.preConversions && unitAnalysis.preConversions.length > 0) {
    unitAnalysis.preConversions.forEach(pc => {
      evalState[pc.token] = pc.convertedVal;
      evalState[pc.canonicalKey] = pc.convertedVal;
    });
  }

  for (const [k, v] of Object.entries(evalState)) {
    if (typeof v === "number") {
      subsMap[k] = fmtSigFig(v, 4);
    }
  }

  const substitutedTexStr = substituteExpression(rhsExpr || baseFormula, subsMap, varsDb);
  const substitutedTex = `${targetSymbol} = ${casToTex(substitutedTexStr, varsDb)}${unitAnalysis.conversionFactorTex || ""}`;

  const val = S[canonicalTarget] !== undefined ? S[canonicalTarget] : S[targetVar];
  const formattedVal = typeof val === "number" ? fmtSigFig(val, 4) : val;
  let unitTex = targetUnit && targetUnit !== "dimless" && targetUnit !== "ratio" ? `\\text{ ${targetUnit}}` : "";
  if (targetUnit === "deg" || targetUnit === "°") unitTex = "^\\circ";

  const resultTex = `${targetSymbol} = ${formattedVal}${unitTex ? " " + unitTex : ""}`;

  return {
    symbolicTex,
    substitutedTex,
    resultTex,
    unitAnalysis,
    expectedVal: val
  };
}
