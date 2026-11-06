/**
 * src/core/derivation.js
 * Aligned KaTeX derivation builder with context-aware symbolic substitution (anti-spoiler)
 * and precision-synchronized units.
 */

import { casToTex, isolateVariable, substituteExpression, simplifyExpression } from "./cas.js";
import { cancelUnit, formatConversionWithCancellation } from "./dimensions.js";

/**
 * Universal numerical formatter matching the input's actual precision.
 */
function fmtPrecise(n, maxDec = 4) {
  if (n === undefined || n === null) return "";
  const num = typeof n === "number" ? n : Number(n);
  if (isNaN(num)) return "";
  if (Number.isInteger(num)) return num.toString();
  const rounded = parseFloat(num.toFixed(maxDec));
  return rounded.toString();
}

/**
 * Builds an aligned KaTeX derivation block.
 * @param {Object} step - Current step object.
 * @param {Object} S - Ground truth system state.
 * @param {Array} allSteps - All DAG path steps.
 * @param {Object} varsDb - Topic variable metadata.
 * @param {Array} relations - Topic relation graph.
 * @param {Set} answeredVars - Set of variable keys currently answered by the student.
 */
export function buildAlignedDerivation(step, S, allSteps = [], varsDb = {}, relations = [], answeredVars = new Set()) {
  const targetVar = step.targetVar;
  const targetMeta = varsDb[targetVar] || {};
  const targetSym = targetMeta.symbol || targetVar;
  const targetUnit = S._u?.[targetVar] || targetMeta.unit || "";
  const isInteger = !!targetMeta.isInteger;
  const formattedVal = fmtPrecise(step.expectedVal, isInteger ? 0 : 4);

  // 1. Resolve Canonical Equation
  const eq = relations.find(r => r.id === step.eqId);
  const canonicalTex = (eq?.canonicalTex || step.canonicalTex || step.baseFormula || "").replace(/\*/g, " ");
  const baseParts = (eq?.baseFormula || step.baseFormula || "").split("=");
  const canonicalLhs = baseParts[0]?.trim() || "";
  const canonicalRhs = baseParts[1]?.trim() || "";

  // 2. Identify Unanswered Ancestors (to prevent numerical spoilers when jumping ahead)
  const inputVars = (step.nodes || []).filter(n => n !== targetVar);
  const unansweredInputs = inputVars.filter(v => !answeredVars.has(v) && S[v] !== undefined);

  const lines = [];

  // Line 1: Always Canonical Equation on top
  if (canonicalTex.includes("=")) {
    const [cLhs, cRhs] = canonicalTex.split("=");
    lines.push(`${cLhs.trim()} &= ${cRhs.trim()}`);
  } else {
    lines.push(`\\text{Canonical:} \\quad & ${canonicalTex}`);
  }

  // Line 2: If an input is unanswered, substitute it symbolically using its parent formula
  let workingExpr = canonicalRhs;
  let didSymbolicExpansion = false;

  if (unansweredInputs.length > 0) {
    unansweredInputs.forEach(unansweredVar => {
      const parentStep = allSteps.find(s => s.targetVar === unansweredVar);
      const parentEq = relations.find(r => r.id === parentStep?.eqId);
      if (parentEq?.baseFormula) {
        const isolatedParent = isolateVariable(parentEq.baseFormula, unansweredVar, varsDb);
        workingExpr = substituteExpression(workingExpr, { [unansweredVar]: `(${isolatedParent.isolatedRhs})` });
        workingExpr = simplifyExpression(workingExpr);
        didSymbolicExpansion = true;
      }
    });

    if (didSymbolicExpansion) {
      const isolatedTarget = isolateVariable(`${canonicalLhs} = ${workingExpr}`, targetVar, varsDb);
      lines.push(`&= ${casToTex(isolatedTarget.isolatedRhs, varsDb)}`);
    }
  } else if (canonicalLhs !== targetVar) {
    // Normal single-step rearrangement (e.g. h = 2a + c => a = (h - c)/2)
    const isolated = isolateVariable(step.baseFormula, targetVar, varsDb);
    lines.push(`\\implies ${targetSym} &= ${casToTex(isolated.isolatedRhs, varsDb)}`);
  }

  // Line 3: Substitution carrying units into each term
  const numericalLine = buildNumericalLine(step, S, targetVar, targetUnit, formattedVal, varsDb, unansweredInputs, relations);
  lines.push(`&= ${numericalLine}`);

  return `\\[ \\begin{aligned} ${lines.join(" \\\\[6pt]\n")} \\end{aligned} \\]`;
}

/**
 * Builds the numerical substitution line carrying units into every term without spoiling unanswered variables.
 */
function buildNumericalLine(step, S, targetVar, targetUnit, formattedVal, varsDb, unansweredInputs = [], relations = []) {
  // Case: Step 2 (hk) solved before Step 1 (a) -> substitute h - c directly
  if (targetVar === "h_k" && unansweredInputs.includes("a") && S.h !== undefined && S.c !== undefined) {
    const u = S._u?.h || "mm";
    return `${fmtPrecise(S.h, 2)}\\text{ ${u}} - ${fmtPrecise(S.c, 2)}\\text{ ${u}} = \\mathbf{${formattedVal}\\text{ ${u}}}`;
  }

  // Working Depth when a is known
  if (targetVar === "h_k" && S.a !== undefined) {
    const u = S._u?.a || "mm";
    return `2(${fmtPrecise(S.a, 4)}\\text{ ${u}}) = \\mathbf{${formattedVal}\\text{ ${u}}}`;
  }

  // Addendum from working depth
  if (targetVar === "a" && S.h_k !== undefined && !step.baseFormula.includes("c")) {
    const u = S._u?.h_k || "mm";
    return `\\frac{${fmtPrecise(S.h_k, 4)}\\text{ ${u}}}{2} = \\mathbf{${formattedVal}\\text{ ${u}}}`;
  }

  // Addendum from whole depth & clearance (a = (h - c) / 2)
  if (targetVar === "a" && S.h !== undefined && S.c !== undefined) {
    const u = S._u?.h || "mm";
    return `\\frac{${fmtPrecise(S.h, 2)}\\text{ ${u}} - ${fmtPrecise(S.c, 2)}\\text{ ${u}}}{2} = \\frac{${fmtPrecise(S.h - S.c, 2)}\\text{ ${u}}}{2} = \\mathbf{${formattedVal}\\text{ ${u}}}`;
  }

  // Center Distance from Teeth
  if (targetVar === "P_d" && S.T_1 !== undefined && S.T_2 !== undefined && S.C !== undefined) {
    return `\\frac{${fmtPrecise(S.T_1, 0)} + ${fmtPrecise(S.T_2, 0)}}{2(${fmtPrecise(S.C, 1)}\\,${cancelUnit("mm")})} \\cdot ${formatConversionWithCancellation("in_to_mm_cancel_mm")} = \\mathbf{${formattedVal}\\text{ teeth/in}}`;
  }

  // Velocity to Diameter
  if ((targetVar === "D_P1" || targetVar === "D_1") && S.V_m !== undefined && S.n_1 !== undefined) {
    if (S.sys === "SI" || S._u?.V_m === "m/s") {
      return `\\frac{${fmtPrecise(S.V_m, 2)}\\,${cancelUnit("m")}/\\cancel{\\text{s}}}{\\pi \\left(${fmtPrecise(S.n_1, 0)}\\,\\frac{\\cancel{\\text{rev}}}{\\cancel{\\text{min}}} \\cdot \\frac{1\\,\\cancel{\\text{min}}}{60\\,\\cancel{\\text{s}}}\\right)} \\cdot ${formatConversionWithCancellation("m_to_mm_cancel_m")} = \\mathbf{${formattedVal}\\text{ mm}}`;
    }
  }

  // Normal Contact Force to Torque
  if ((targetVar === "M_t" || targetVar === "T") && S.W !== undefined && S.phi !== undefined) {
    const dVal = S.D_P1 || S.D_1 || 60;
    return `(${fmtPrecise(S.W, 0)}\\text{ N})\\cos(${fmtPrecise(S.phi, 0)}^\\circ) \\times \\frac{${fmtPrecise(dVal, 0)}\\,${cancelUnit("mm")} \\cdot ${formatConversionWithCancellation("mm_to_m_cancel_mm")}}{2} = \\mathbf{${formattedVal}\\text{ N}\\cdot\\text{m}}`;
  }

  // General fallback carrying exact unit formatting
  const inputs = (step.nodes || []).filter(n => n !== targetVar);
  const inputTerms = inputs.map(v => {
    const val = S[v];
    const u = S._u?.[v] || varsDb[v]?.unit || "";
    return u && u !== "dimless" && u !== "ratio" && u !== "teeth" ? `${fmtPrecise(val, 4)}\\text{ ${u}}` : `${fmtPrecise(val, 4)}`;
  });

  return `${inputTerms.join(" \\times ")} = \\mathbf{${formattedVal}${targetUnit ? `\\text{ ${targetUnit}}` : ""}}`;
}
