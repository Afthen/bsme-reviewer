/**
 * src/core/derivation.js
 * ============================================================================
 * ARCHITECTURAL PILLAR: Textbook-Grade Aligned Derivations
 * ============================================================================
 * 1. Canonical Implication: Displays Base => Isolated if algebraic manipulation occurred.
 * 2. Inline Factor-Label Units: Attaches units directly to substituted numbers.
 * 3. Typographical Spacing: Uses \cfrac for steps and \tfrac for final answer units.
 * ============================================================================
 */

import { parseMathAST } from "../cas/ast.js";
import { resolveCanonicalKey } from "../cas/algebra.js";
import { casToTex, astToLatex } from "../cas/latex.js";
import { solveUnitAlgebra } from "../cas/units.js";
import { fmtSigFig } from "./dimensions.js";

export function buildAlignedDerivation(
  step,
  S = {},
  allSteps = [],
  varsDb = {},
  relations = [],
  answeredVars = new Set(),
  givens = []
) {
  const { targetVar, baseFormula, canonicalTex, rhsExpr, requiredUnits } = step;

  const canonicalTarget = resolveCanonicalKey(targetVar, varsDb);
  const targetMeta = varsDb[canonicalTarget] || varsDb[targetVar] || {};
  const targetSymbol = targetMeta.symbol || targetVar;
  const targetUnit = S._u?.[canonicalTarget] || S._u?.[targetVar] || targetMeta.unit || "";

  const formulaRhs = rhsExpr || (baseFormula && baseFormula.includes("=") ? baseFormula.split("=")[1].trim() : baseFormula) || "";
  const unitAnalysis = solveUnitAlgebra(formulaRhs, S, targetVar, targetUnit, varsDb, requiredUnits);

  const evalState = { ...S };
  if (unitAnalysis.preConversions && unitAnalysis.preConversions.length > 0) {
    unitAnalysis.preConversions.forEach(pc => {
      evalState[pc.token] = pc.convertedVal;
      evalState[pc.canonicalKey] = pc.convertedVal;
    });
  }

  // Build Substitution Mapping with Explicit Unit Atoms & Inline Conversions
  const subsMap = {};
  for (const [k, v] of Object.entries(evalState)) {
    if (typeof v === "number") {
      const formattedNum = fmtSigFig(v, 6);
      const unitMarkup = unitAnalysis.tokenMarkup?.[k] || "";
      const inlineConv = unitAnalysis.tokenConversions?.[k] ? unitAnalysis.tokenConversions[k].join("") : "";

      if (unitMarkup !== "" || inlineConv !== "") {
        // e.g. 1200\,\cfrac{\text{rev}}{\text{min}} \cdot \cfrac{1\,\text{min}}{60\,\text{s}}
        subsMap[k] = `${formattedNum}\\,${unitMarkup}${inlineConv}`;
      } else {
        subsMap[k] = formattedNum;
      }
    }
  }

  // Line 1: Canonical Implication or Direct Isolation
  const symRhs = casToTex(formulaRhs, varsDb);
  const isolatedEq = `${targetSymbol} = ${symRhs}`;
  const displayCanonical = canonicalTex || casToTex(baseFormula, varsDb);
  
  let line1;
  const norm = s => (s || "").replace(/\s+/g, "");
  if (norm(displayCanonical) === norm(isolatedEq) || !baseFormula) {
    line1 = `${targetSymbol} &= ${symRhs}`;
  } else {
    // A => B formatting
    line1 = `${displayCanonical} \\quad \\Rightarrow \\quad ${targetSymbol} &= ${symRhs}`;
  }

  // Line 2: Substituted numeric values (6 sig figs) + target-level conversion factors
  const rhsAst = parseMathAST(formulaRhs);
  const numTex = astToLatex(rhsAst, subsMap, varsDb);
  const globalConvTex = unitAnalysis.conversionFactorTex || "";
  const line2 = `&= ${numTex}${globalConvTex}`;

  // Line 3: Final calculated answer (6 sig figs) with \tfrac for units
  const val = step.expectedVal !== undefined ? step.expectedVal : S[canonicalTarget];
  const formattedVal = typeof val === "number" ? fmtSigFig(val, 6) : val;

  let unitTex = "";
  if (targetUnit && targetUnit !== "dimless" && targetUnit !== "ratio") {
    if (targetUnit === "deg" || targetUnit === "°") {
      unitTex = "^\\circ";
    } else if (targetUnit.includes("/")) {
      const [num, den] = targetUnit.split("/");
      unitTex = `\\,\\tfrac{\\text{${num}}}{\\text{${den}}}`;
    } else {
      unitTex = `\\,\\text{${targetUnit}}`;
    }
  }
  
  const line3 = `&= ${formattedVal}${unitTex}`;

  return `$$\\begin{aligned}\n  ${line1} \\\\[6pt]\n  ${line2} \\\\[6pt]\n  ${line3}\n\\end{aligned}$$`;
}

export const buildDerivationStep = buildAlignedDerivation;
