/**
 * src/core/derivation.js
 * Universal Graph + CAS Derivation Engine.
 * Dynamic expression-tree numerical substitution with unit cancellation fractions.
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
  const targetKey = SYMBOL_TO_KEY[targetVar] || targetVar;
  const targetMeta = varsDb[targetKey] || {};
  const targetSym = targetMeta.symbol || targetVar;
  const targetUnit = S._u?.[targetKey] || targetMeta.unit || "";
  const isInteger = !!targetMeta.isInteger;
  const formattedVal = fmtPrecise(step.expectedVal, isInteger ? 0 : 4);

  // Combine student-answered variables and initial givens into knowns
  const knownVars = new Set([
    ...Array.from(answeredVars).map(v => SYMBOL_TO_KEY[v] || v),
    ...givens.map(g => SYMBOL_TO_KEY[g] || g)
  ]);

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
    const unresolvedToken = currentVars.find(tok => {
      const k = SYMBOL_TO_KEY[tok] || tok;
      return !knownVars.has(k) && k !== targetKey;
    });

    if (!unresolvedToken) break;

    const unresolvedKey = SYMBOL_TO_KEY[unresolvedToken] || unresolvedToken;
    const parentStep = allSteps.find(s => (SYMBOL_TO_KEY[s.targetVar] || s.targetVar) === unresolvedKey);
    const parentEq = relations.find(r => r.id === parentStep?.eqId) || relations.find(r => r.nodes && r.nodes.includes(unresolvedKey));

    if (parentEq?.baseFormula) {
      const isolatedParent = isolateVariable(parentEq.baseFormula, unresolvedToken, varsDb);
      currentRhs = substituteExpression(currentRhs, { [unresolvedToken]: `(${isolatedParent.isolatedRhs})` });
      currentRhs = simplifyExpression(currentRhs);
      didSubstitute = true;
    } else {
      break;
    }
  }

  // 3. Symbolic Target Isolation via CAS
  let isolatedRhsExpr = currentRhs;
  const currentLhsKey = SYMBOL_TO_KEY[currentLhs] || currentLhs;
  if (currentLhsKey !== targetKey || didSubstitute) {
    const isolatedTarget = isolateVariable(`${currentLhs} = ${currentRhs}`, targetVar, varsDb);
    isolatedRhsExpr = isolatedTarget.isolatedRhs;
    lines.push(`\\implies ${targetSym} &= ${casToTex(isolatedRhsExpr, varsDb)}`);
  }

  // 4. Expression-Tree Numerical Substitution (CAS-guided)
  const substitutedTex = substituteValuesAndUnits(isolatedRhsExpr, S, varsDb);

  // 5. Dimensional Unit Cancellation Factor
  const conversionFactorTex = detectUnitConversion(step, isolatedRhsExpr, targetUnit, S, varsDb);

  // Line: Substitution with units, cancellation factors, and final evaluated answer
  lines.push(`&= ${substitutedTex}${conversionFactorTex} = \\mathbf{${formattedVal}${targetUnit ? `\\text{ ${targetUnit}}` : ""}}`);

  return `\\[ \\begin{aligned} ${lines.join(" \\\\[6pt]\n")} \\end{aligned} \\]`;
}

// ========================================================
// UNIVERSAL HELPER FUNCTIONS
// ========================================================

function extractVariableTokens(exprStr) {
  if (!exprStr) return [];
  const tokens = exprStr.match(/[a-zA-Z][a-zA-Z0-9_]*/g) || [];
  const mathConstants = new Set(["pi", "sin", "cos", "tan", "sqrt", "abs", "log", "exp", "atan", "acos", "asin"]);
  return Array.from(new Set(tokens.filter(t => !mathConstants.has(t))));
}

/**
 * Dynamically substitutes values and units into an algebraic expression tree via KaTeX.
 */
function substituteValuesAndUnits(exprStr, S, varsDb) {
  let tex = casToTex(exprStr, varsDb);
  const tokens = extractVariableTokens(exprStr);

  // Sort by token length descending to replace multi-char tokens before single-char (e.g. T2 before T)
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

    // Match symbol in KaTeX (e.g., T_{2}, N_{1}, D_{1}, T)
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
 * Detects unit conversions and returns explicit cancellation fractions.
 */
function detectUnitConversion(step, exprStr, targetUnit, S, varsDb) {
  const isSI = S.sys === "SI" || S._u?.V_m === "m/s" || S._u?.D_P1 === "mm";
  const tokens = extractVariableTokens(exprStr);
  const unitsInExpr = tokens.map(t => {
    const k = SYMBOL_TO_KEY[t] || t;
    return S._u?.[k] || varsDb[k]?.unit || "";
  }).filter(Boolean);

  // 1. Mechanical Rotational Power (P = 2*pi*N*T)
  if (targetUnit === "kW" && unitsInExpr.includes("rpm") && unitsInExpr.includes("N-m")) {
    return ` \\cdot \\frac{1\\,\\cancel{\\text{min}}}{60\\,\\cancel{\\text{s}}} \\cdot \\frac{1\\text{ kW}}{1000\\,\\cancel{\\text{W}}}`;
  }
  if (targetUnit === "hp" && unitsInExpr.includes("rpm") && unitsInExpr.includes("lb-in")) {
    return ` \\cdot \\frac{1\\,\\cancel{\\text{ft}}}{12\\,\\cancel{\\text{in}}} \\cdot \\frac{1\\text{ hp}}{33000\\,\\cancel{\\text{ft}\\cdot\\text{lb}/\\text{min}}}`;
  }

  // 2. Shaft Torque from Power (T = P / (2*pi*N))
  if (targetUnit === "N-m" && unitsInExpr.includes("kW") && unitsInExpr.includes("rpm")) {
    return ` \\cdot \\frac{1000\\,\\cancel{\\text{W}}}{1\\,\\cancel{\\text{kW}}} \\cdot \\frac{60\\,\\cancel{\\text{s}}}{1\\,\\cancel{\\text{min}}}`;
  }
  if (targetUnit === "lb-in" && unitsInExpr.includes("hp") && unitsInExpr.includes("rpm")) {
    return ` \\cdot \\frac{33000\\,\\cancel{\\text{ft}\\cdot\\text{lb}/\\text{min}}}{1\\,\\cancel{\\text{hp}}} \\cdot \\frac{12\\text{ in}}{1\\,\\cancel{\\text{ft}}}`;
  }

  // 3. Linear Power (P = Ft * v)
  if (targetUnit === "kW" && unitsInExpr.includes("N") && unitsInExpr.includes("m/s")) {
    return ` \\cdot \\frac{1\\text{ kW}}{1000\\,\\cancel{\\text{N}\\cdot\\text{m/s}}}`;
  }
  if (targetUnit === "hp" && unitsInExpr.includes("lb") && unitsInExpr.includes("ft/min")) {
    return ` \\cdot \\frac{1\\text{ hp}}{33000\\,\\cancel{\\text{ft}\\cdot\\text{lb}/\\text{min}}}`;
  }

  // 4. Pitch Line Velocity (v = pi * D * N)
  if (targetUnit === "m/s" && unitsInExpr.includes("mm") && unitsInExpr.includes("rpm")) {
    return ` \\cdot \\frac{1\\text{ m}}{1000\\,\\cancel{\\text{mm}}} \\cdot \\frac{1\\,\\cancel{\\text{min}}}{60\\text{ s}}`;
  }
  if (targetUnit === "ft/min" && unitsInExpr.includes("in") && unitsInExpr.includes("rpm")) {
    return ` \\cdot \\frac{1\\text{ ft}}{12\\,\\cancel{\\text{in}}}`;
  }

  // 5. Pitch Diameter from Velocity (D = v / (pi * N))
  if (targetUnit === "mm" && unitsInExpr.includes("m/s") && unitsInExpr.includes("rpm")) {
    return ` \\cdot \\frac{60\\,\\cancel{\\text{s}}}{1\\,\\cancel{\\text{min}}} \\cdot \\frac{1000\\text{ mm}}{1\\,\\cancel{\\text{m}}}`;
  }
  if (targetUnit === "in" && unitsInExpr.includes("ft/min") && unitsInExpr.includes("rpm")) {
    return ` \\cdot \\frac{12\\text{ in}}{1\\,\\cancel{\\text{ft}}}`;
  }

  // 6. Rotational Speed from Velocity (N = v / (pi * D))
  if (targetUnit === "rpm" && unitsInExpr.includes("m/s") && unitsInExpr.includes("mm")) {
    return ` \\cdot \\frac{1000\\,\\cancel{\\text{mm}}}{1\\,\\cancel{\\text{m}}} \\cdot \\frac{60\\text{ s}}{1\\,\\cancel{\\text{min}}}`;
  }
  if (targetUnit === "rpm" && unitsInExpr.includes("ft/min") && unitsInExpr.includes("in")) {
    return ` \\cdot \\frac{12\\,\\cancel{\\text{in}}}{1\\,\\cancel{\\text{ft}}}`;
  }

  // 7. Torque from Tangential Load (T = Ft * D / 2)
  if (targetUnit === "N-m" && unitsInExpr.includes("N") && unitsInExpr.includes("mm")) {
    return ` \\cdot ${formatConversionWithCancellation("mm_to_m_cancel_mm")}`;
  }

  // 8. Tangential Load from Torque (Ft = 2T / D)
  if (targetUnit === "N" && unitsInExpr.includes("N-m") && unitsInExpr.includes("mm")) {
    return ` \\cdot \\frac{1000\\,\\cancel{\\text{mm}}}{1\\,\\cancel{\\text{m}}}`;
  }

  // 9. Diametral Pitch from Center Distance / Diameter
  if (targetUnit === "teeth/in" && unitsInExpr.includes("mm")) {
    return ` \\cdot ${formatConversionWithCancellation("in_to_mm_cancel_mm")}`;
  }
  if (targetUnit === "mm" && unitsInExpr.includes("teeth/in")) {
    return ` \\cdot \\frac{25.4\\text{ mm}}{1\\,\\cancel{\\text{in}}}`;
  }

  return "";
}
