/**
 * src/core/derivation.js
 * Aligned KaTeX derivation builder with intermediate physical units and dynamic CAS substitution.
 */

import { casToTex, isolateVariable, substituteExpression, simplifyExpression } from "./cas.js";
import { fmt, cancelUnit, formatConversionWithCancellation } from "./dimensions.js";

/**
 * Builds an aligned KaTeX block for a solution step.
 */
export function buildAlignedDerivation(step, S, allSteps = [], varsDb = {}, relations = []) {
  const targetVar = step.targetVar;
  const targetMeta = varsDb[targetVar] || {};
  const targetSym = targetMeta.symbol || targetVar;
  const targetUnit = S._u?.[targetVar] || targetMeta.unit || "";
  const isInteger = !!targetMeta.isInteger;
  const formattedVal = fmt(step.expectedVal, isInteger ? 0 : 2);

  // 1. Resolve Canonical Equation & Target Isolation
  const eq = relations.find(r => r.id === step.eqId);
  const canonicalTex = eq?.canonical?.tex || step.canonicalTex || step.baseFormula || "";
  const canonicalParts = (eq?.baseFormula || step.baseFormula || "").split("=");
  const canonicalLhs = canonicalParts[0]?.trim() || "";
  const canonicalRhs = canonicalParts[1]?.trim() || "";

  // Check if ancestor steps were faded (requires algebraic compound substitution)
  const fadedAncestors = (step.ancestorIndices || [])
    .map(i => allSteps[i])
    .filter(s => s && s.isFaded);

  const lines = [];

  // Line 1: Always Canonical Equation on top
  if (canonicalTex.includes("=")) {
    const [cLhs, cRhs] = canonicalTex.split("=");
    lines.push(`${cLhs.trim()} &= ${cRhs.trim()}`);
  } else {
    lines.push(`\\text{Canonical:} \\quad & ${canonicalTex}`);
  }

  // Line 2: Alternating Graph Substitution + CAS Simplification for Faded Ancestors
  let currentExpr = canonicalRhs;
  if (fadedAncestors.length > 0) {
    fadedAncestors.forEach(fStep => {
      const fVar = fStep.targetVar;
      const fEq = relations.find(r => r.id === fStep.eqId);
      if (fEq?.baseFormula) {
        const isolatedAncestor = isolateVariable(fEq.baseFormula, fVar, varsDb);
        currentExpr = substituteExpression(currentExpr, { [fVar]: `(${isolatedAncestor.isolatedRhs})` });
        currentExpr = simplifyExpression(currentExpr);
      }
    });

    // Isolate target variable from compounded expression
    const isolatedCompounded = isolateVariable(`${canonicalLhs} = ${currentExpr}`, targetVar, varsDb);
    lines.push(`\\implies ${targetSym} &= ${casToTex(isolatedCompounded.isolatedRhs, varsDb)}`);
  } else if (canonicalLhs !== targetVar) {
    // Single-step rearrangement (e.g., h_k = 2a => a = h_k / 2)
    const isolated = isolateVariable(step.baseFormula, targetVar, varsDb);
    lines.push(`\\implies ${targetSym} &= ${casToTex(isolated.isolatedRhs, varsDb)}`);
  }

  // Line 3: Value Substitution with Units & Dimension Cancellation
  const numericalLine = buildNumericalLine(step, S, targetSym, targetUnit, formattedVal, varsDb);
  lines.push(`&= ${numericalLine}`);

  return `\\[ \\begin{aligned} ${lines.join(" \\\\[6pt]\n")} \\end{aligned} \\]`;
}

/**
 * Builds the numerical substitution line carrying units into every term.
 */
function buildNumericalLine(step, S, targetSym, targetUnit, formattedVal, varsDb) {
  const targetVar = step.targetVar;

  // Specific high-frequency engineering relations with explicit unit conversions
  if (targetVar === "a" && S.h_k !== undefined) {
    const u = S._u?.h_k || "mm";
    return `\\frac{${fmt(S.h_k, 2)}\\text{ ${u}}}{2} = \\mathbf{${formattedVal}\\text{ ${u}}}`;
  }

  if (targetVar === "h_k" && S.a !== undefined) {
    const u = S._u?.a || "mm";
    return `2(${fmt(S.a, 2)}\\text{ ${u}}) = \\mathbf{${formattedVal}\\text{ ${u}}}`;
  }

  if (targetVar === "P_d" && S.T_1 !== undefined && S.T_2 !== undefined && S.C !== undefined) {
    return `\\frac{${fmt(S.T_1, 0)} + ${fmt(S.T_2, 0)}}{2(${fmt(S.C, 1)}\\,${cancelUnit("mm")})} \\cdot ${formatConversionWithCancellation("in_to_mm_cancel_mm")} = \\mathbf{${formattedVal}\\text{ teeth/in}}`;
  }

  if ((targetVar === "D_P1" || targetVar === "D_1") && S.V_m !== undefined && S.n_1 !== undefined) {
    if (S.sys === "SI" || S._u?.V_m === "m/s") {
      return `\\frac{${fmt(S.V_m, 2)}\\,${cancelUnit("m")}/\\cancel{\\text{s}}}{\\pi \\left(${fmt(S.n_1, 0)}\\,\\frac{\\cancel{\\text{rev}}}{\\cancel{\\text{min}}} \\cdot \\frac{1\\,\\cancel{\\text{min}}}{60\\,\\cancel{\\text{s}}}\\right)} \\cdot ${formatConversionWithCancellation("m_to_mm_cancel_m")} = \\mathbf{${formattedVal}\\text{ mm}}`;
    }
  }

  if ((targetVar === "M_t" || targetVar === "T") && S.W !== undefined && S.phi !== undefined) {
    const dVal = S.D_P1 || S.D_1 || 60;
    return `(${fmt(S.W, 0)}\\text{ N})\\cos(${fmt(S.phi, 0)}^\\circ) \\times \\frac{${fmt(dVal, 0)}\\,${cancelUnit("mm")} \\cdot ${formatConversionWithCancellation("mm_to_m_cancel_mm")}}{2} = \\mathbf{${formattedVal}\\text{ N}\\cdot\\text{m}}`;
  }

  // Universal fallback carrying units
  const inputs = (step.nodes || []).filter(n => n !== targetVar);
  const inputTerms = inputs.map(v => {
    const val = S[v];
    const u = S._u?.[v] || varsDb[v]?.unit || "";
    return u && u !== "dimless" && u !== "ratio" && u !== "teeth" ? `${fmt(val, 2)}\\text{ ${u}}` : `${fmt(val, 2)}`;
  });

  return `${inputTerms.join(" \\times ")} = \\mathbf{${formattedVal}${targetUnit ? `\\text{ ${targetUnit}}` : ""}}`;
}
