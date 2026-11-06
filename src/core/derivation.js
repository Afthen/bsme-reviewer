/**
 * src/core/derivation.js
 * Universal Graph + CAS Derivation Engine.
 * Displays explicit formula substitution steps before simplification,
 * followed by numerical substitution with synchronized unit cancellations.
 */

import {
  casToTex, isolateVariable, substituteExpression,
  simplifyExpression, SYMBOL_TO_KEY, solveUnitAlgebra, UNIT_ALGEBRA_DB
} from "./cas.js";
import { cancelUnit } from "./dimensions.js";

function fmtPrecise(n, maxDec = 4) {
  if (n === undefined || n === null) return "";
  const num = typeof n === "number" ? n : Number(n);
  if (isNaN(num)) return "";
  if (Number.isInteger(num)) return num.toString();
  return parseFloat(num.toFixed(maxDec)).toString();
}

function extractVariableTokens(exprStr) {
  if (!exprStr) return [];
  const tokens = exprStr.match(/[a-zA-Z][a-zA-Z0-9_]*/g) || [];
  const mathConstants = new Set(["pi", "sin", "cos", "tan", "sqrt", "abs", "log", "exp", "atan", "acos", "asin"]);
  return Array.from(new Set(tokens.filter(t => !mathConstants.has(t))));
}

/**
 * Synchronizes substituted variable units with active conversion factors.
 */
function formatUnitMarkup(unitKey, tok, unitAnalysis) {
  if (!unitKey || unitKey === "dimless" || unitKey === "ratio") return "";
  if (unitKey === "deg") return "^\\circ";

  const factors = unitAnalysis?.conversionFactors || [];

  const cancelsMin = factors.some(f => f.from === "u_min" || f.to === "u_min");
  const cancelsMm  = factors.some(f => f.from === "u_mm"  || f.to === "u_mm");
  const cancelsIn  = factors.some(f => f.from === "u_in"  || f.to === "u_in");
  const isFullyCanceled = unitAnalysis?.canceledTokens?.has(tok);

  // 1. Rotational speed: rpm = rev / min
  if (unitKey === "rpm" || unitKey === "rev/min") {
    if (isFullyCanceled) {
      return `\\,\\frac{\\cancel{\\text{rev}}}{\\cancel{\\text{min}}}`;
    }
    if (cancelsMin || unitAnalysis?.subTokenCancellations?.[tok]?.cancelMin) {
      return `\\,\\frac{\\text{rev}}{\\cancel{\\text{min}}}`;
    }
    return `\\,\\frac{\\text{rev}}{\\text{min}}`;
  }
  
  // 2. Tooth counts and tooth pitch
  if (unitKey === "teeth") {
    // If teeth is in numerator and denominator (e.g. T2 / Pd or T2 / T1)
    const hasToothCancellation = factors.length > 0 || isFullyCanceled;
    if (hasToothCancellation) {
      return `\\,\\cancel{\\text{teeth}}`;
    }
    return `\\text{ teeth}`;
  }

  if (unitKey === "teeth/in") {
    const cancelsIn = factors.some(f => f.from === "u_in" || f.to === "u_in");
    if (cancelsIn) {
      return `\\,\\frac{\\cancel{\\text{teeth}}}{\\cancel{\\text{in}}}`;
    }
    return `\\,\\frac{\\text{teeth}}{\\text{in}}`;
  }
  
  // 3. Length units
  if (unitKey === "mm" && (cancelsMm || isFullyCanceled)) {
    return `\\,\\cancel{\\text{mm}}`;
  }
  if (unitKey === "in" && (cancelsIn || isFullyCanceled)) {
    return `\\,\\cancel{\\text{in}}`;
  }

  // 4. Fully canceled entity units (e.g. teeth in T2 / T1)
  if (isFullyCanceled) {
    return `\\,\\cancel{\\text{${unitKey}}}`;
  }

  const meta = UNIT_ALGEBRA_DB[unitKey];
  return meta?.tex ? `\\,${meta.tex}` : `\\text{ ${unitKey}}`;
}

/**
 * Substitutes numeric values and units into the algebraic expression tree.
 */
function substituteValuesAndUnits(exprStr, S, varsDb, unitAnalysis) {
  let tex = casToTex(exprStr, varsDb);
  const tokens = extractVariableTokens(exprStr);
  tokens.sort((a, b) => b.length - a.length);

  tokens.forEach(tok => {
    const varKey = SYMBOL_TO_KEY[tok] || tok;
    const val = S[varKey] !== undefined ? S[varKey] : S[tok];
    if (val === undefined || isNaN(val)) return;

    const meta = varsDb[varKey] || {};
    const sym = meta.symbol || tok;
    const unit = S._u?.[varKey] || meta.unit || "";

    const formattedNum = fmtPrecise(val, meta.isInteger ? 0 : 4);
    const unitTex = formatUnitMarkup(unit, tok, unitAnalysis);
    const formattedWithUnit = unit === "deg" ? `${formattedNum}${unitTex}` : `${formattedNum}${unitTex}`;

    const symTex = casToTex(sym, varsDb);
    const escaped = symTex.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}");
    const pattern = new RegExp(`(?<![a-zA-Z0-9_])${escaped}(?![a-zA-Z0-9_])`, "g");
    tex = tex.replace(pattern, `(${formattedWithUnit})`);
  });

  tex = tex.replace(/\(\(([^()]+)\)\)/g, "($1)");
  return tex;
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

  const knownVars = new Set([
    ...Array.from(answeredVars).map(v => SYMBOL_TO_KEY[v] || v),
    ...givens.map(g => SYMBOL_TO_KEY[g] || g)
  ]);

  // 1. Canonical Equation
  const eq = relations.find(r => r.id === step.eqId);
  const baseFormula = eq?.baseFormula || step.baseFormula || "";
  const baseParts = baseFormula.split("=");
  let currentLhs = baseParts[0]?.trim() || "";
  let currentRhs = baseParts[1]?.trim() || "";

  const lines = [];
  const canonicalTex = (eq?.canonicalTex || `${currentLhs} = ${currentRhs}`).replace(/\*/g, " ");
  if (canonicalTex.includes("=")) {
    const [cLhs, cRhs] = canonicalTex.split("=");
    lines.push(`${cLhs.trim()} &= ${cRhs.trim()}`);
  } else {
    lines.push(`\\text{Canonical:} \\quad & ${canonicalTex}`);
  }

  // 2. Symbolic Graph Substitution with Explicit Intermediate Steps
  let maxSubstitutions = 5;
  let didSubstitute = false;
  let substitutionStepTex = "";
  let currentRhsTex = canonicalTex.includes("=") ? canonicalTex.split("=")[1].trim() : casToTex(currentRhs, varsDb);

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
      const parentFormulaTex = casToTex(isolatedParent.isolatedRhs, varsDb);
      const parentSymbolTex = casToTex(varsDb[unresolvedKey]?.symbol || unresolvedToken, varsDb);

      // Construct unsimplified LaTeX showing the exact substituted expression in parentheses
      const escapedToken = parentSymbolTex.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}");
      const unsimplifiedTex = currentRhsTex.replace(
        new RegExp(`(?<![a-zA-Z0-9_])${escapedToken}(?![a-zA-Z0-9_])`, "g"),
        `\\left(${parentFormulaTex}\\right)`
      );

      // Compute algebraic reduction via CAS
      currentRhs = substituteExpression(currentRhs, { [unresolvedToken]: `(${isolatedParent.isolatedRhs})` });
      currentRhs = simplifyExpression(currentRhs);
      const simplifiedTex = casToTex(currentRhs, varsDb);

      // Display: &= 2\pi N_1 \left(\frac{F_t D_1}{2}\right) = \pi D_1 F_t N_1
      if (unsimplifiedTex !== simplifiedTex) {
        substitutionStepTex = `${unsimplifiedTex} = ${simplifiedTex}`;
      } else {
        substitutionStepTex = unsimplifiedTex;
      }

      currentRhsTex = simplifiedTex;
      didSubstitute = true;
    } else {
      break;
    }
  }

  // Add the explicit intermediate substitution line
  if (didSubstitute && substitutionStepTex) {
    lines.push(`&= ${substitutionStepTex}`);
  } else if (SYMBOL_TO_KEY[currentLhs] !== targetKey) {
    const isolatedTarget = isolateVariable(`${currentLhs} = ${currentRhs}`, targetVar, varsDb);
    currentRhs = isolatedTarget.isolatedRhs;
    lines.push(`\\implies ${targetSym} &= ${casToTex(currentRhs, varsDb)}`);
  }

  // 3. General CAS Unit Solver (Algebraic & Semantic)
  const unitAnalysis = solveUnitAlgebra(currentRhs, S, targetVar, targetUnit, varsDb);
  const substitutedTex = substituteValuesAndUnits(currentRhs, S, varsDb, unitAnalysis);

  // 4. Conversion Factor Fraction Rendering
  const conversionFactorTex = unitAnalysis.conversionFactorTex;

  // 5. Final Numerical Substitution Line
  lines.push(`&= ${substitutedTex}${conversionFactorTex} = \\mathbf{${formattedVal}${targetUnit ? `\\text{ ${targetUnit}}` : ""}}`);

  return `\\[ \\begin{aligned} ${lines.join(" \\\\[6pt]\n")} \\end{aligned} \\]`;
}
