/**
 * src/core/derivation.js
 * ============================================================================
 * ARCHITECTURAL PILLAR: Textbook-Grade Aligned Derivations
 * ============================================================================
 * 1. Smart Implication: Omits arrow if canonical formula is already isolated for target.
 * 2. Shared Unit Factoring: (23 + 69) \, \text{teeth} instead of clunky duplicates.
 * 3. Factor Parenthesizing: Wraps subsequent multiplied factors in parens.
 * 4. Boxed Final Answer: Repeats target symbol and encloses answer in \boxed{}.
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

  // 1. Build Substitution Mapping with Factor Parenthesizing & Unit Atoms
  const subsMap = {};
  for (const [k, v] of Object.entries(evalState)) {
    if (typeof v === "number") {
      const formattedNum = fmtSigFig(v, 6);
      const unitMarkup = unitAnalysis.tokenMarkup?.[k] || "";
      const inlineConv = unitAnalysis.tokenConversions?.[k] ? unitAnalysis.tokenConversions[k].join("") : "";

      if (unitMarkup !== "" || inlineConv !== "") {
        subsMap[k] = `${formattedNum}\\,${unitMarkup}${inlineConv}`;
      } else {
        subsMap[k] = formattedNum;
      }
    }
  }

  // 2. Unit Factoring for Additions e.g. (23 + 69) \, \text{teeth}
  const rhsAst = parseMathAST(formulaRhs);
  if (rhsAst && rhsAst.type === "binary" && rhsAst.op === "/") {
    const numNode = rhsAst.left;
    if (numNode.type === "binary" && numNode.op === "+") {
      const leftKey = numNode.left.type === "id" ? numNode.left.name : null;
      const rightKey = numNode.right.type === "id" ? numNode.right.name : null;
      if (leftKey && rightKey && evalState[leftKey] !== undefined && evalState[rightKey] !== undefined) {
        const uL = S._u?.[leftKey] || varsDb[leftKey]?.unit || "";
        const uR = S._u?.[rightKey] || varsDb[rightKey]?.unit || "";
        if (uL === uR && uL !== "") {
          const uMarkup = unitAnalysis.tokenMarkup?.[leftKey] || `\\text{${uL}}`;
          subsMap[leftKey] = `(${fmtSigFig(evalState[leftKey], 6)} + ${fmtSigFig(evalState[rightKey], 6)})\\,${uMarkup}`;
          subsMap[rightKey] = "0"; // Handled jointly in factored parenthetical
        }
      }
    }
  }

  // 3. Smart Implication Arrow Logic
  const symRhs = casToTex(formulaRhs, varsDb);
  const displayCanonical = canonicalTex || casToTex(baseFormula, varsDb);
  
  let line1;
  const norm = s => (s || "").replace(/\\left|\\right|\s/g, "");
  const isAlreadyIsolated = norm(displayCanonical).startsWith(norm(targetSymbol) + "=");

  const numTex = astToLatex(rhsAst, subsMap, varsDb).replace(/\+\s*0(?!\d)/g, "");
  const globalConvTex = unitAnalysis.conversionFactorTex || "";

  if (isAlreadyIsolated || !baseFormula) {
    // Already isolated: substitute directly on Line 1!
    line1 = `${displayCanonical} &= ${numTex}${globalConvTex}`;
  } else {
    // Rearrangement occurred: Canonical => Isolated &= Substituted
    line1 = `${displayCanonical} \\; \\Rightarrow \\; ${targetSymbol} &= ${symRhs} \\\\[6pt]\n  &= ${numTex}${globalConvTex}`;
  }

  // 4. Final Answer Line with Boxed Result & \tfrac for Units
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
  
  const finalLine = `${targetSymbol} &= \\boxed{${formattedVal}${unitTex}}`;

  return `$$\\begin{aligned}\n  ${line1} \\\\[6pt]\n  ${finalLine}\n\\end{aligned}$$`;
}

export const buildDerivationStep = buildAlignedDerivation;
