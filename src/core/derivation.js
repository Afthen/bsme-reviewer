/**
 * src/core/derivation.js
 * Aligned KaTeX derivation builder with context-aware symbolic substitution
 * and exact dimensional analysis fractions.
 */

import { casToTex, isolateVariable, substituteExpression, simplifyExpression } from "./cas.js";
import { cancelUnit, formatConversionWithCancellation } from "./dimensions.js";

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
 */
export function buildAlignedDerivation(step, S, allSteps = [], varsDb = {}, relations = [], answeredVars = new Set(), givens = []) {
  const targetVar = step.targetVar;
  const targetMeta = varsDb[targetVar] || {};
  const targetSym = targetMeta.symbol || targetVar;
  const targetUnit = S._u?.[targetVar] || targetMeta.unit || "";
  const isInteger = !!targetMeta.isInteger;
  const formattedVal = fmtPrecise(step.expectedVal, isInteger ? 0 : 4);

  // Combine student-answered variables + problem givens into a set of knowns
  const knownVars = new Set([...answeredVars, ...givens]);

  // 1. Resolve Canonical Equation
  const eq = relations.find(r => r.id === step.eqId);
  const canonicalTex = (eq?.canonicalTex || step.canonicalTex || step.baseFormula || "").replace(/\*/g, " ");
  const baseParts = (eq?.baseFormula || step.baseFormula || "").split("=");
  const canonicalLhs = baseParts[0]?.trim() || "";
  const canonicalRhs = baseParts[1]?.trim() || "";

  // 2. Identify variables that are truly unanswered (intermediate steps solved out of order)
  const inputVars = (step.nodes || []).filter(n => n !== targetVar);
  const unansweredInputs = inputVars.filter(v => !knownVars.has(v) && S[v] !== undefined);

  const lines = [];

  // Line 1: Always Canonical Equation on top
  if (canonicalTex.includes("=")) {
    const [cLhs, cRhs] = canonicalTex.split("=");
    lines.push(`${cLhs.trim()} &= ${cRhs.trim()}`);
  } else {
    lines.push(`\\text{Canonical:} \\quad & ${canonicalTex}`);
  }

  // Line 2: Isolation or Symbolic Expansion
  let workingExpr = canonicalRhs;
  let didSymbolicExpansion = false;

  if (unansweredInputs.length > 0) {
    // Student solved this step before answering its ancestor step: expand symbolically
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
      lines.push(`\\implies ${targetSym} &= ${casToTex(isolatedTarget.isolatedRhs, varsDb)}`);
    }
  } else if (canonicalLhs !== targetVar) {
    // Standard isolation (e.g. v = pi * D1 * N1 => N1 = v / (pi * D1))
    const isolated = isolateVariable(step.baseFormula, targetVar, varsDb);
    lines.push(`\\implies ${targetSym} &= ${casToTex(isolated.isolatedRhs, varsDb)}`);
  }

  // Line 3: Exact Numerical Substitution
  const numericalLine = buildNumericalLine(step, S, targetVar, targetUnit, formattedVal, varsDb, unansweredInputs);
  lines.push(`&= ${numericalLine}`);

  return `\\[ \\begin{aligned} ${lines.join(" \\\\[6pt]\n")} \\end{aligned} \\]`;
}

/**
 * Builds the exact numerical substitution with correct operators and fractions.
 */
function buildNumericalLine(step, S, targetVar, targetUnit, formattedVal, varsDb, unansweredInputs = []) {
  const isSI = S.sys === "SI" || S._u?.V_m === "m/s" || S._u?.D_P1 === "mm";

  // --- Speed Ratio & Kinematics ---
  if (step.eqId === "eq_vr_teeth") {
    if (targetVar === "VR") return `\\frac{${fmtPrecise(S.T_2, 0)}}{${fmtPrecise(S.T_1, 0)}} = \\mathbf{${formattedVal}}`;
    if (targetVar === "T_2") return `${fmtPrecise(S.T_1, 0)} \\times ${fmtPrecise(S.VR, 2)} = \\mathbf{${formattedVal}\\text{ teeth}}`;
    if (targetVar === "T_1") return `\\frac{${fmtPrecise(S.T_2, 0)}}{${fmtPrecise(S.VR, 2)}} = \\mathbf{${formattedVal}\\text{ teeth}}`;
  }

  if (step.eqId === "eq_vr_speed") {
    if (targetVar === "VR") return `\\frac{${fmtPrecise(S.n_1, 0)}\\text{ rpm}}{${fmtPrecise(S.n_2, 1)}\\text{ rpm}} = \\mathbf{${formattedVal}}`;
    if (targetVar === "n_2") return `\\frac{${fmtPrecise(S.n_1, 0)}\\text{ rpm}}{${fmtPrecise(S.VR, 2)}} = \\mathbf{${formattedVal}\\text{ rpm}}`;
    if (targetVar === "n_1") return `${fmtPrecise(S.n_2, 1)}\\text{ rpm} \\times ${fmtPrecise(S.VR, 2)} = \\mathbf{${formattedVal}\\text{ rpm}}`;
  }

  if (step.eqId === "eq_pitch_vel") {
    if (targetVar === "n_1") {
      return isSI
        ? `\\frac{${fmtPrecise(S.V_m, 2)}\\,${cancelUnit("m")}/\\cancel{\\text{s}}}{\\pi \\left(${fmtPrecise(S.D_P1, 1)}\\,${cancelUnit("mm")} \\cdot ${formatConversionWithCancellation("mm_to_m_cancel_mm")}\\right)} \\cdot ${formatConversionWithCancellation("s_to_min_cancel_s")} = \\mathbf{${formattedVal}\\text{ rpm}}`
        : `\\frac{${fmtPrecise(S.V_m, 1)}\\,${cancelUnit("ft")}/\\text{min}}{\\pi \\left(${fmtPrecise(S.D_P1, 3)}\\,${cancelUnit("in")} \\cdot ${formatConversionWithCancellation("in_to_ft_cancel_in")}\\right)} = \\mathbf{${formattedVal}\\text{ rpm}}`;
    }
    if (targetVar === "D_P1") {
      return isSI
        ? `\\frac{${fmtPrecise(S.V_m, 2)}\\,${cancelUnit("m")}/\\cancel{\\text{s}}}{\\pi \\left(${fmtPrecise(S.n_1, 0)}\\,\\frac{\\text{rev}}{\\cancel{\\text{min}}} \\cdot \\frac{1\\,\\cancel{\\text{min}}}{60\\,\\cancel{\\text{s}}}\\right)} \\cdot ${formatConversionWithCancellation("m_to_mm_cancel_m")} = \\mathbf{${formattedVal}\\text{ mm}}`
        : `\\frac{${fmtPrecise(S.V_m, 1)}\\,${cancelUnit("ft")}/\\cancel{\\text{min}}}{\\pi \\left(${fmtPrecise(S.n_1, 0)}\\,\\frac{\\text{rev}}{\\cancel{\\text{min}}}\\right)} \\cdot ${formatConversionWithCancellation("ft_to_in_cancel_ft")} = \\mathbf{${formattedVal}\\text{ in}}`;
    }
    if (targetVar === "V_m") {
      return isSI
        ? `\\pi \\left(${fmtPrecise(S.D_P1, 1)}\\text{ mm} \\cdot \\frac{1\\text{ m}}{1000\\text{ mm}}\\right) \\left(${fmtPrecise(S.n_1, 0)}\\text{ rpm} \\cdot \\frac{1\\text{ min}}{60\\text{ s}}\\right) = \\mathbf{${formattedVal}\\text{ m/s}}`
        : `\\pi \\left(${fmtPrecise(S.D_P1, 3)}\\text{ in} \\cdot \\frac{1\\text{ ft}}{12\\text{ in}}\\right) (${fmtPrecise(S.n_1, 0)}\\text{ rpm}) = \\mathbf{${formattedVal}\\text{ ft/min}}`;
    }
  }

  // --- Working Depth & Addendum ---
  if (targetVar === "h_k" && unansweredInputs.includes("a") && S.h !== undefined && S.c !== undefined) {
    const u = S._u?.h || "mm";
    return `${fmtPrecise(S.h, 2)}\\text{ ${u}} - ${fmtPrecise(S.c, 2)}\\text{ ${u}} = \\mathbf{${formattedVal}\\text{ ${u}}}`;
  }
  if (targetVar === "h_k" && S.a !== undefined) {
    const u = S._u?.a || "mm";
    return `2(${fmtPrecise(S.a, 4)}\\text{ ${u}}) = \\mathbf{${formattedVal}\\text{ ${u}}}`;
  }
  if (targetVar === "a" && step.eqId === "eq_working_depth" && S.h_k !== undefined) {
    const u = S._u?.h_k || "mm";
    return `\\frac{${fmtPrecise(S.h_k, 4)}\\text{ ${u}}}{2} = \\mathbf{${formattedVal}\\text{ ${u}}}`;
  }
  if (targetVar === "a" && step.eqId === "eq_whole_depth" && S.h !== undefined && S.c !== undefined) {
    const u = S._u?.h || "mm";
    return `\\frac{${fmtPrecise(S.h, 2)}\\text{ ${u}} - ${fmtPrecise(S.c, 2)}\\text{ ${u}}}{2} = \\mathbf{${formattedVal}\\text{ ${u}}}`;
  }

  // --- Center Distance ---
  if (step.eqId === "eq_center_dist") {
    const u = S._u?.C || "mm";
    if (targetVar === "C") return `\\frac{${fmtPrecise(S.D_P1, 2)}\\text{ ${u}} + ${fmtPrecise(S.D_P2, 2)}\\text{ ${u}}}{2} = \\mathbf{${formattedVal}\\text{ ${u}}}`;
    if (targetVar === "D_P1") return `2(${fmtPrecise(S.C, 2)}\\text{ ${u}}) - ${fmtPrecise(S.D_P2, 2)}\\text{ ${u}} = \\mathbf{${formattedVal}\\text{ ${u}}}`;
    if (targetVar === "D_P2") return `2(${fmtPrecise(S.C, 2)}\\text{ ${u}}) - ${fmtPrecise(S.D_P1, 2)}\\text{ ${u}} = \\mathbf{${formattedVal}\\text{ ${u}}}`;
  }

  if (step.eqId === "eq_c_teeth_sum") {
    if (targetVar === "P_d") {
      return `\\frac{${fmtPrecise(S.T_1, 0)} + ${fmtPrecise(S.T_2, 0)}}{2(${fmtPrecise(S.C, 1)}\\,${cancelUnit("mm")})} \\cdot ${formatConversionWithCancellation("in_to_mm_cancel_mm")} = \\mathbf{${formattedVal}\\text{ teeth/in}}`;
    }
    if (targetVar === "C") {
      const u = S._u?.C || "in";
      return `\\frac{${fmtPrecise(S.T_1, 0)} + ${fmtPrecise(S.T_2, 0)}}{2(${fmtPrecise(S.P_d, 2)})} = \\mathbf{${formattedVal}\\text{ ${u}}}`;
    }
  }

  // --- Forces, Torque & Power ---
  if (step.eqId === "eq_wt_torque") {
    if (targetVar === "M_t") {
      const uD = S._u?.D_P1 || "mm";
      const uF = S._u?.W_t || "N";
      const uT = S._u?.M_t || "N-m";
      return isSI
        ? `(${fmtPrecise(S.W_t, 0)}\\text{ ${uF}}) \\times \\frac{${fmtPrecise(S.D_P1, 1)}\\,${cancelUnit("mm")} \\cdot ${formatConversionWithCancellation("mm_to_m_cancel_mm")}}{2} = \\mathbf{${formattedVal}\\text{ ${uT}}}`
        : `(${fmtPrecise(S.W_t, 0)}\\text{ ${uF}}) \\times \\frac{${fmtPrecise(S.D_P1, 3)}\\text{ ${uD}}}{2} = \\mathbf{${formattedVal}\\text{ ${uT}}}`;
    }
    if (targetVar === "W_t") {
      const uD = S._u?.D_P1 || "mm";
      const uF = S._u?.W_t || "N";
      return isSI
        ? `\\frac{2(${fmtPrecise(S.M_t, 2)}\\text{ N}\\cdot\\cancel{\\text{m}})}{${fmtPrecise(S.D_P1, 1)}\\,${cancelUnit("mm")} \\cdot ${formatConversionWithCancellation("mm_to_m_cancel_mm")}} = \\mathbf{${formattedVal}\\text{ ${uF}}}`
        : `\\frac{2(${fmtPrecise(S.M_t, 2)}\\text{ lb}\\cdot\\text{in})}{${fmtPrecise(S.D_P1, 3)}\\text{ in}} = \\mathbf{${formattedVal}\\text{ ${uF}}}`;
    }
  }

  if (step.eqId === "eq_w_normal") {
    if (targetVar === "W_t") return `(${fmtPrecise(S.W, 0)}\\text{ N})\\cos(${fmtPrecise(S.phi, 1)}^\\circ) = \\mathbf{${formattedVal}\\text{ N}}`;
    if (targetVar === "W") return `\\frac{${fmtPrecise(S.W_t, 0)}\\text{ N}}{\\cos(${fmtPrecise(S.phi, 1)}^\\circ)} = \\mathbf{${formattedVal}\\text{ N}}`;
  }

  if (step.eqId === "eq_wr_wt") {
    if (targetVar === "W_r") return `(${fmtPrecise(S.W_t, 0)}\\text{ N})\\tan(${fmtPrecise(S.phi, 1)}^\\circ) = \\mathbf{${formattedVal}\\text{ N}}`;
    if (targetVar === "W_t") return `\\frac{${fmtPrecise(S.W_r, 0)}\\text{ N}}{\\tan(${fmtPrecise(S.phi, 1)}^\\circ)} = \\mathbf{${formattedVal}\\text{ N}}`;
  }

  // --- Pitch Definitions ---
  if (step.eqId === "eq_dp1") {
    if (targetVar === "D_P1") return `\\frac{${fmtPrecise(S.T_1, 0)}}{${fmtPrecise(S.P_d, 2)}\\text{ teeth/in}} = \\mathbf{${formattedVal}\\text{ in}}`;
    if (targetVar === "P_d") return `\\frac{${fmtPrecise(S.T_1, 0)}}{${fmtPrecise(S.D_P1, 3)}\\text{ in}} = \\mathbf{${formattedVal}\\text{ teeth/in}}`;
    if (targetVar === "T_1") return `${fmtPrecise(S.D_P1, 3)}\\text{ in} \\times ${fmtPrecise(S.P_d, 2)}\\text{ teeth/in} = \\mathbf{${formattedVal}\\text{ teeth}}`;
  }

  // Universal Fallback
  const inputs = (step.nodes || []).filter(n => n !== targetVar);
  const inputTerms = inputs.map(v => {
    const val = S[v];
    const u = S._u?.[v] || varsDb[v]?.unit || "";
    return u && u !== "dimless" && u !== "ratio" && u !== "teeth" ? `${fmtPrecise(val, 4)}\\text{ ${u}}` : `${fmtPrecise(val, 4)}`;
  });

  return `${inputTerms.join(" \\times ")} = \\mathbf{${formattedVal}${targetUnit ? `\\text{ ${targetUnit}}` : ""}}`;
}
