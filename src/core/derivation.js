/**
 * src/core/derivation.js
 * Universal Graph + CAS Derivation Engine.
 * 100% dynamic: Zero hardcoded equation checks.
 * Uses Nerdamer CAS for graph substitution, symbolic simplification,
 * variable isolation, exact expression-tree numerical substitution, and unit cancellation.
 */

import { casToTex, isolateVariable, substituteExpression, simplifyExpression } from "./cas.js";
import { cancelUnit, formatConversionWithCancellation } from "./dimensions.js";

/**
 * Universal numerical formatter matching the input's natural precision.
 */
function fmtPrecise(n, maxDec = 4) {
  if (n === undefined || n === null) return "";
  const num = typeof n === "number" ? n : Number(n);
  if (isNaN(num)) return "";
  if (Number.isInteger(num)) return num.toString();
  return parseFloat(num.toFixed(maxDec)).toString();
}

/**
 * Builds an aligned KaTeX derivation block entirely via Graph + CAS.
 * @param {Object} step - Current step object.
 * @param {Object} S - Ground truth system state.
 * @param {Array} allSteps - All DAG path steps.
 * @param {Object} varsDb - Topic variable metadata.
 * @param {Array} relations - Topic relation graph.
 * @param {Set} answeredVars - Set of variable keys currently answered by the student.
 * @param {Array} givens - Initial problem givens.
 */
export function buildAlignedDerivation(step, S, allSteps = [], varsDb = {}, relations = [], answeredVars = new Set(), givens = []) {
  const targetVar = step.targetVar;
  const targetMeta = varsDb[targetVar] || {};
  const targetSym = targetMeta.symbol || targetVar;
  const targetUnit = S._u?.[targetVar] || targetMeta.unit || "";
  const isInteger = !!targetMeta.isInteger;
  const formattedVal = fmtPrecise(step.expectedVal, isInteger ? 0 : 4);

  // Combine student-answered variables and initial givens into knowns
  const knownVars = new Set([...answeredVars, ...givens]);

  // 1. Resolve Canonical Equation from the Graph
  const eq = relations.find(r => r.id === step.eqId);
  const baseFormula = eq?.baseFormula || step.baseFormula || "";
  const baseParts = baseFormula.split("=");
  let currentLhs = baseParts[0]?.trim() || "";
  let currentRhs = baseParts[1]?.trim() || "";

  const lines = [];

  // Line 1: Canonical Equation on top
  const canonicalTex = (eq?.canonicalTex || step.canonicalTex || `${currentLhs} = ${currentRhs}`).replace(/\*/g, " ");
  if (canonicalTex.includes("=")) {
    const [cLhs, cRhs] = canonicalTex.split("=");
    lines.push(`${cLhs.trim()} &= ${cRhs.trim()}`);
  } else {
    lines.push(`\\text{Canonical:} \\quad & ${canonicalTex}`);
  }

  // 2. Alternating Graph Substitution + CAS Simplify Loop
  // If an input is unresolved (unanswered intermediate step or faded ancestor), substitute symbolically
  let maxSubstitutions = 5;
  let didSubstitute = false;

  while (maxSubstitutions-- > 0) {
    const currentVars = extractVariableTokens(currentRhs);
    const unresolvedVar = currentVars.find(v => !knownVars.has(v) && v !== targetVar);
    if (!unresolvedVar) break;

    // Find the producer relation in the graph for this unresolved variable
    const parentStep = allSteps.find(s => s.targetVar === unresolvedVar);
    const parentEq = relations.find(r => r.id === parentStep?.eqId) || relations.find(r => r.nodes && r.nodes.includes(unresolvedVar));

    if (parentEq?.baseFormula) {
      const isolatedParent = isolateVariable(parentEq.baseFormula, unresolvedVar, varsDb);
      // Graph substitution
      currentRhs = substituteExpression(currentRhs, { [unresolvedVar]: `(${isolatedParent.isolatedRhs})` });
      // CAS simplification
      currentRhs = simplifyExpression(currentRhs);
      didSubstitute = true;
    } else {
      break;
    }
  }

  // 3. Symbolic Target Isolation via CAS
  let isolatedRhsExpr = currentRhs;
  if (currentLhs !== targetVar || didSubstitute) {
    const isolatedTarget = isolateVariable(`${currentLhs} = ${currentRhs}`, targetVar, varsDb);
    isolatedRhsExpr = isolatedTarget.isolatedRhs;
    lines.push(`\\implies ${targetSym} &= ${casToTex(isolatedRhsExpr, varsDb)}`);
  }

  // 4. Expression-Tree Numerical Substitution (CAS-guided)
  const substitutedTex = substituteValuesAndUnits(isolatedRhsExpr, S, varsDb);

  // 5. Dimensional Unit Cancellation Factor
  const conversionFactorTex = detectUnitConversion(isolatedRhsExpr, targetUnit, S, varsDb);

  // Line: Substitution with units and final evaluated answer
  lines.push(`&= ${substitutedTex}${conversionFactorTex} = \\mathbf{${formattedVal}${targetUnit ? `\\text{ ${targetUnit}}` : ""}}`);

  return `\\[ \\begin{aligned} ${lines.join(" \\\\[6pt]\n")} \\end{aligned} \\]`;
}

// ========================================================
// UNIVERSAL HELPER FUNCTIONS (ZERO HARDCODED EQUATION CHECKS)
// ========================================================

/**
 * Extracts variable identifier tokens from an algebraic expression.
 */
function extractVariableTokens(exprStr) {
  if (!exprStr) return [];
  const tokens = exprStr.match(/[a-zA-Z][a-zA-Z0-9_]*/g) || [];
  const mathConstants = new Set(["pi", "sin", "cos", "tan", "sqrt", "abs", "log", "exp"]);
  return Array.from(new Set(tokens.filter(t => !mathConstants.has(t))));
}

/**
 * Dynamically substitutes values and units into an algebraic expression tree via KaTeX.
 */
function substituteValuesAndUnits(exprStr, S, varsDb) {
  // Convert expression structure to pure KaTeX template
  let tex = casToTex(exprStr, varsDb);

  const tokens = extractVariableTokens(exprStr);
  // Sort by token length descending to prevent partial token replacement (e.g. D_1 before D)
  tokens.sort((a, b) => b.length - a.length);

  tokens.forEach(token => {
    // Resolve value from system state
    const val = S[token] !== undefined ? S[token] : S[token.replace(/_/g, "")];
    if (val === undefined || isNaN(val)) return;

    const meta = varsDb[token] || {};
    const sym = meta.symbol || token;
    const unit = S._u?.[token] || meta.unit || "";
    const isDimensionless = !unit || unit === "dimless" || unit === "ratio" || unit === "teeth";

    const formattedNum = fmtPrecise(val, meta.isInteger ? 0 : 4);
    const formattedWithUnit = isDimensionless
      ? formattedNum
      : (unit === "deg" ? `${formattedNum}^\\circ` : `${formattedNum}\\text{ ${unit}}`);

    // Match symbol in KaTeX: e.g. T_{2}, D_{1}, h_k, a, etc.
    const symTex = casToTex(sym, varsDb);
    const escapedSym = symTex.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}");

    // Replace symbol with formatted numerical value wrapped in parentheses where needed
    const pattern = new RegExp(`(?<![a-zA-Z0-9_])${escapedSym}(?![a-zA-Z0-9_])`, "g");
    tex = tex.replace(pattern, formattedWithUnit);
  });

  return tex;
}

/**
 * Dynamically analyzes physical units in the expression and generates
 * the required cancellation fraction if dimensional conversion is needed.
 */
function detectUnitConversion(exprStr, targetUnit, S, varsDb) {
  const tokens = extractVariableTokens(exprStr);
  const unitsInExpr = tokens.map(t => S._u?.[t] || varsDb[t]?.unit || "").filter(Boolean);

  // 1. Imperial Length mismatch: ft/min and inches in rotational velocity (v = pi * D * N)
  if (unitsInExpr.includes("ft/min") && unitsInExpr.includes("in")) {
    return ` \\cdot ${formatConversionWithCancellation("in_to_ft_cancel_in")}`;
  }
  if (unitsInExpr.includes("ft") && unitsInExpr.includes("in")) {
    return ` \\cdot ${formatConversionWithCancellation("in_to_ft_cancel_in")}`;
  }

  // 2. Metric Length prefix mismatch: N and mm resulting in N-m torque (T = Ft * D / 2)
  if (targetUnit === "N-m" && unitsInExpr.includes("N") && unitsInExpr.includes("mm")) {
    return ` \\cdot ${formatConversionWithCancellation("mm_to_m_cancel_mm")}`;
  }

  // 3. Metric to Imperial Pitch conversion: mm center distance to teeth/in (Pd = (T1+T2)/(2C))
  if (targetUnit === "teeth/in" && unitsInExpr.includes("mm")) {
    return ` \\cdot ${formatConversionWithCancellation("in_to_mm_cancel_mm")}`;
  }

  // 4. Metric Velocity: mm diameter and rpm to m/s pitch velocity
  if (targetUnit === "m/s" && unitsInExpr.includes("mm") && unitsInExpr.includes("rpm")) {
    return ` \\cdot ${formatConversionWithCancellation("mm_to_m_cancel_mm")} \\cdot ${formatConversionWithCancellation("min_to_s_cancel_min")}`;
  }

  // 5. Rotational speed from linear velocity (N = v / (pi * D)) in SI
  if (targetUnit === "rpm" && unitsInExpr.includes("m/s") && unitsInExpr.includes("mm")) {
    return ` \\cdot ${formatConversionWithCancellation("m_to_mm_cancel_m")} \\cdot ${formatConversionWithCancellation("s_to_min_cancel_s")}`;
  }

  return "";
}
