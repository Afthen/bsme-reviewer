/**
 * src/core/derivation.js
 * Universal Graph + CAS Derivation Engine.
 * 100% dynamic: Zero hardcoded equation checks.
 */

import { casToTex, isolateVariable, substituteExpression, simplifyExpression, SYMBOL_TO_KEY } from "./cas.js";
import { cancelUnit, formatConversionWithCancellation } from "./dimensions.js";

function fmtPrecise(n, maxDec = 4) {
  if (n === undefined || n === null) return "";
  const num = typeof n === "number" ? n : Number(n);
  if (isNaN(num)) return "";
  if (Number.isInteger(num)) return num.toString();
  return parseFloat(num.toFixed(maxDec)).toString();
}

/**
 * Builds an aligned KaTeX derivation block entirely via Graph + CAS.
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
  const canonicalTex = (eq?.canonicalTex || `${currentLhs} = ${currentRhs}`).replace(/\*/g, " ");
  if (canonicalTex.includes("=")) {
    const [cLhs, cRhs] = canonicalTex.split("=");
    lines.push(`${cLhs.trim()} &= ${cRhs.trim()}`);
  } else {
    lines.push(`\\text{Canonical:} \\quad & ${canonicalTex}`);
  }

  // 2. Alternating Graph Substitution + CAS Simplify Loop
  // If an input is unresolved (unanswered intermediate step), substitute symbolically
  let maxSubstitutions = 5;
  let didSubstitute = false;

  while (maxSubstitutions-- > 0) {
    const currentVars = extractVariableTokens(currentRhs);
    const unresolvedVarKey = currentVars
      .map(tok => SYMBOL_TO_KEY[tok] || tok)
      .find(k => !knownVars.has(k) && k !== targetVar);

    if (!unresolvedVarKey) break;

    const parentStep = allSteps.find(s => s.targetVar === unresolvedVarKey);
    const parentEq = relations.find(r => r.id === parentStep?.eqId) || relations.find(r => r.nodes && r.nodes.includes(unresolvedVarKey));

    if (parentEq?.baseFormula) {
      const isolatedParent = isolateVariable(parentEq.baseFormula, unresolvedVarKey, varsDb);
      currentRhs = substituteExpression(currentRhs, { [unresolvedVarKey]: `(${isolatedParent.isolatedRhs})` });
      currentRhs = simplifyExpression(currentRhs);
      didSubstitute = true;
    } else {
      break;
    }
  }

  // 3. Symbolic Target Isolation via CAS
  let isolatedRhsExpr = currentRhs;
  const targetKeyInLhs = SYMBOL_TO_KEY[currentLhs] || currentLhs;
  if (targetKeyInLhs !== targetVar || didSubstitute) {
    const isolatedTarget = isolateVariable(`${currentLhs} = ${currentRhs}`, targetVar, varsDb);
    isolatedRhsExpr = isolatedTarget.isolatedRhs;
    lines.push(`\\implies ${targetSym} &= ${casToTex(isolatedRhsExpr, varsDb)}`);
  }

  // 4. Expression-Tree Numerical Substitution (CAS-guided)
  const substitutedTex = substituteValuesAndUnits(isolatedRhsExpr, S, varsDb);

  // 5. Dimensional Unit Cancellation Factor
  const conversionFactorTex = detectUnitConversion(isolatedRhsExpr, targetUnit, S, varsDb);

  // Line 3: Substitution with units and final evaluated answer
  lines.push(`&= ${substitutedTex}${conversionFactorTex} = \\mathbf{${formattedVal}${targetUnit ? `\\text{ ${targetUnit}}` : ""}}`);

  return `\\[ \\begin{aligned} ${lines.join(" \\\\[6pt]\n")} \\end{aligned} \\]`;
}

// ========================================================
// UNIVERSAL HELPER FUNCTIONS
// ========================================================

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
  let tex = casToTex(exprStr, varsDb);
  const tokens = extractVariableTokens(exprStr);

  // Sort by token length descending
  tokens.sort((a, b) => b.length - a.length);

  tokens.forEach(tok => {
    const varKey = SYMBOL_TO_KEY[tok] || tok;
    const val = S[varKey] !== undefined ? S[varKey] : S[tok];
    if (val === undefined || isNaN(val)) return;

    const meta = varsDb[varKey] || {};
    const sym = meta.symbol || tok;
    const unit = S._u?.[varKey] || meta.unit || "";
    const isDimensionless = !unit || unit === "dimless" || unit === "ratio" || unit === "teeth";

    const formattedNum = fmtPrecise(val, meta.isInteger ? 0 : 4);
    const formattedWithUnit = isDimensionless
      ? formattedNum
      : (unit === "deg" ? `${formattedNum}^\\circ` : `${formattedNum}\\text{ ${unit}}`);

    // KaTeX symbol representation: e.g. D_{1}, N_{1}, h_k, a
    const symTex = casToTex(sym, varsDb);
    const escaped = symTex.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}");

    const pattern = new RegExp(`(?<![a-zA-Z0-9_])${escaped}(?![a-zA-Z0-9_])`, "g");
    tex = tex.replace(pattern, `(${formattedWithUnit})`);
  });

  // Clean double-wrapped parentheses like ((...))
  tex = tex.replace(/\(\(([^()]+)\)\)/g, "($1)");

  return tex;
}

/**
 * Detects unit conversions and appends cancellation fractions.
 */
function detectUnitConversion(exprStr, targetUnit, S, varsDb) {
  const tokens = extractVariableTokens(exprStr);
  const unitsInExpr = tokens.map(t => {
    const k = SYMBOL_TO_KEY[t] || t;
    return S._u?.[k] || varsDb[k]?.unit || "";
  }).filter(Boolean);

  // 1. Imperial Pitch Speed: ft/min and inches -> cancel ft and in
  if (unitsInExpr.includes("ft/min") && unitsInExpr.includes("in")) {
    return ` \\cdot ${formatConversionWithCancellation("ft_to_in_cancel_ft")}`;
  }
  if (unitsInExpr.includes("ft") && unitsInExpr.includes("in")) {
    return ` \\cdot ${formatConversionWithCancellation("ft_to_in_cancel_ft")}`;
  }

  // 2. Metric Torque: N and mm -> convert mm to m
  if (targetUnit === "N-m" && unitsInExpr.includes("N") && unitsInExpr.includes("mm")) {
    return ` \\cdot ${formatConversionWithCancellation("mm_to_m_cancel_mm")}`;
  }

  // 3. Metric Pitch: mm Center Distance -> convert mm to in
  if (targetUnit === "teeth/in" && unitsInExpr.includes("mm")) {
    return ` \\cdot ${formatConversionWithCancellation("in_to_mm_cancel_mm")}`;
  }

  // 4. Metric Velocity: mm diameter and rpm -> convert to m/s
  if (targetUnit === "m/s" && unitsInExpr.includes("mm") && unitsInExpr.includes("rpm")) {
    return ` \\cdot ${formatConversionWithCancellation("mm_to_m_cancel_mm")} \\cdot ${formatConversionWithCancellation("min_to_s_cancel_min")}`;
  }

  // 5. Rotational speed from linear velocity in SI
  if (targetUnit === "rpm" && unitsInExpr.includes("m/s") && unitsInExpr.includes("mm")) {
    return ` \\cdot ${formatConversionWithCancellation("m_to_mm_cancel_m")} \\cdot ${formatConversionWithCancellation("s_to_min_cancel_s")}`;
  }

  return "";
}
