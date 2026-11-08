/**
 * src/core/derivation.js
 * ============================================================================
 * ARCHITECTURAL PILLAR: Aligned Multi-Line Derivation Generator
 * ============================================================================
 * Generates beautiful, aligned 3-line KaTeX derivation steps for students:
 *   Line 1: Symbolic isolated formula
 *   Line 2: Substituted numeric values with atomic unit cancellation factors
 *   Line 3: Evaluated answer formatted to significant figures with target unit
 * ============================================================================
 */

import { resolveCanonicalKey, substituteExpression } from "../cas/algebra.js";
import { casToTex } from "../cas/latex.js";
import { solveUnitAlgebra } from "../cas/units.js";
import { fmtSigFig } from "./dimensions.js";

/**
 * Builds an aligned KaTeX derivation environment for problem_view.js.
 */
export function buildAlignedDerivation(
  step,
  S = {},
  allSteps = [],
  varsDb = {},
  relations = [],
  answeredVars = new Set(),
  givens = []
) {
  const { targetVar, baseFormula, equationTex, rhsExpr, requiredUnits } = step;

  // 1. Resolve Target Metadata
  const canonicalTarget = resolveCanonicalKey(targetVar, varsDb);
  const targetMeta = varsDb[canonicalTarget] || varsDb[targetVar] || {};
  const targetSymbol = targetMeta.symbol || targetVar;
  const targetUnit = S._u?.[canonicalTarget] || S._u?.[targetVar] || targetMeta.unit || "";

  // 2. Unit Analysis & Conversion Factors
  const formulaRhs = rhsExpr || (baseFormula && baseFormula.includes("=") ? baseFormula.split("=")[1].trim() : baseFormula) || "";
  const unitAnalysis = solveUnitAlgebra(formulaRhs, S, targetVar, targetUnit, varsDb, requiredUnits);

  // 3. Prepare Substituted Numeric Values
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

  // 4. Construct Aligned KaTeX Lines
  // Line 1: Symbolic formula
  const symRhs = casToTex(formulaRhs, varsDb);
  const line1 = `${targetSymbol} &= ${symRhs}`;

  // Line 2: Numbers substituted + conversion factors
  const numRhs = substituteExpression(formulaRhs, subsMap, varsDb);
  const numTex = casToTex(numRhs, varsDb);
  const convTex = unitAnalysis.conversionFactorTex || "";
  const line2 = `&= ${numTex}${convTex}`;

  // Line 3: Final calculated answer
  const val = step.expectedVal !== undefined ? step.expectedVal : S[canonicalTarget];
  const formattedVal = typeof val === "number" ? fmtSigFig(val, 6) : val;

  let unitTex = "";
  if (targetUnit && targetUnit !== "dimless" && targetUnit !== "ratio") {
    unitTex = (targetUnit === "deg" || targetUnit === "°") ? "^\\circ" : `\\text{ ${targetUnit}}`;
  }
  const line3 = `&= ${formattedVal}${unitTex ? " " + unitTex : ""}`;

  return `$$\\begin{aligned}\n  ${line1} \\\\[6pt]\n  ${line2} \\\\[6pt]\n  ${line3}\n\\end{aligned}$$`;
}

// Backward-compatibility alias
export const buildDerivationStep = buildAlignedDerivation;
