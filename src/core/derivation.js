/**
 * src/core/derivation.js
 * Universal Graph + CAS Derivation Engine.
 * Empirical equations are protected from symbolic inlining; units rendered via pure atomic bags.
 */

import { resolveCanonicalKey, substituteExpression, simplifyExpression } from "../cas/algebra.js";
import { casToTex } from "../cas/latex.js";
import { solveUnitAlgebra, getUnitAtomBag } from "../cas/units.js";
import { fmtSigFig } from "./dimensions.js";

// ========================================================
// MAIN DERIVATION EXPORT
// ========================================================

export function buildAlignedDerivation(step, S, allSteps = [], varsDb = {}, relations = [], answeredVars = new Set(), givens = []) {
  const targetVar = step.targetVar;
  const canonicalTarget = resolveCanonicalKey(targetVar, varsDb);
  const targetMeta = varsDb[canonicalTarget] || varsDb[targetVar] || {};
  const targetSym = targetMeta.symbol || targetVar;
  const targetUnit = S._u?.[canonicalTarget] || S._u?.[targetVar] || targetMeta.unit || "";
  const formattedVal = fmtSigFig(step.expectedVal, 6);

  const knownVars = new Set([
    ...Array.from(answeredVars).map(v => resolveCanonicalKey(v, varsDb)),
    ...givens.map(g => resolveCanonicalKey(g, varsDb))
  ]);

  const eq = relations.find(r => r.id === step.eqId);
  const activeVariant = (eq?.variants && S?.sys && eq.variants[S.sys]) ? eq.variants[S.sys] : null;

  const baseFormula = activeVariant?.baseFormula || step.baseFormula || eq?.baseFormula || "";
  const requiredUnits = activeVariant?.requiredUnits || step.requiredUnits || eq?.requiredUnits || null;
  const baseParts = baseFormula.split("=");
  let currentLhs = baseParts[0]?.trim() || "";
  let currentRhs = baseParts[1]?.trim() || "";

  const lines = [];

  // 1. OPTION B: INPUT PRE-CONDITIONING FOR EMPIRICAL RULES
  const unitAnalysis = solveUnitAlgebra(currentRhs, S, targetVar, targetUnit, varsDb, requiredUnits);
  const preConvertedVals = {};

  if (unitAnalysis.preConversions && unitAnalysis.preConversions.length > 0) {
    unitAnalysis.preConversions.forEach(pc => {
      const sym = varsDb[pc.canonicalKey]?.symbol || pc.token;
      const rawFormatted = fmtSigFig(pc.rawVal, 6);
      const convFormatted = fmtSigFig(pc.convertedVal, 6);
      lines.push(`\\text{Pre-convert } ${sym} \\text{ to } \\text{${pc.toUnit}}: \\quad ${sym} &= ${rawFormatted}\\,${pc.conv.latex} = \\mathbf{${convFormatted}\\text{ ${pc.toUnit}}}`);
      preConvertedVals[pc.token] = { val: pc.convertedVal, unit: pc.toUnit };
    });
  }

  // 2. Canonical formula line
  const canonicalTex = (activeVariant?.canonicalTex || step.canonicalTex || eq?.canonicalTex || `${currentLhs} = ${currentRhs}`).replace(/\*/g, " ");
  if (canonicalTex.includes("=")) {
    const [cLhs, cRhs] = canonicalTex.split("=");
    lines.push(`${cLhs.trim()} &= ${cRhs.trim()}`);
  } else {
    lines.push(`\\text{Canonical:} \\quad & ${canonicalTex}`);
  }

  // 3. Symbolic Inlining: ONLY allowed on physical equations.
  // Empirical equations (with requiredUnits) must NEVER have parent formulas inlined!
  const isEmpirical = !!requiredUnits;

  if (!isEmpirical) {
    let maxSubstitutions = 5;
    let didSubstitute = false;
    let intermediateSubFormulaTex = "";
    let rhsAst = parseMathAST(currentRhs);

    while (maxSubstitutions-- > 0) {
      const idTokens = tokenizeExpr(currentRhs).filter(t => t.type === "id").map(t => t.val);
      const mathConsts = new Set(["pi", "sin", "cos", "tan", "sqrt", "abs", "atan", "acos", "asin"]);
      const unresolvedToken = idTokens.find(tok => {
        const k = resolveCanonicalKey(tok, varsDb);
        return !mathConsts.has(tok) && !knownVars.has(k) && k !== canonicalTarget;
      });

      if (!unresolvedToken) break;

      const unresolvedKey = resolveCanonicalKey(unresolvedToken, varsDb);
      const parentStep = allSteps.find(s => resolveCanonicalKey(s.targetVar, varsDb) === unresolvedKey);
      const parentEq = relations.find(r => r.id === parentStep?.eqId) || relations.find(r => r.nodes && r.nodes.includes(unresolvedKey));

      if (parentEq?.baseFormula) {
        const isolatedParent = isolateVariable(parentEq.baseFormula, unresolvedToken, varsDb);
        const parentAst = parseMathAST(isolatedParent.isolatedRhs);

        const subMap = {
          [unresolvedToken]: `\\left(${astToLatex(parentAst, null, varsDb)}\\right)`
        };
        const unsimplifiedTex = astToLatex(rhsAst, subMap, varsDb);

        currentRhs = substituteExpression(currentRhs, { [unresolvedToken]: `(${isolatedParent.isolatedRhs})` });
        currentRhs = simplifyExpression(currentRhs);
        rhsAst = parseMathAST(currentRhs);
        const simplifiedTex = astToLatex(rhsAst, null, varsDb);

        if (unsimplifiedTex !== simplifiedTex) {
          intermediateSubFormulaTex = `${unsimplifiedTex} = ${simplifiedTex}`;
        } else {
          intermediateSubFormulaTex = unsimplifiedTex;
        }

        didSubstitute = true;
      } else {
        break;
      }
    }

    if (didSubstitute && intermediateSubFormulaTex) {
      lines.push(`&= ${intermediateSubFormulaTex}`);
    }
  }

  if (resolveCanonicalKey(currentLhs, varsDb) !== canonicalTarget) {
    const isolatedTarget = isolateVariable(`${currentLhs} = ${currentRhs}`, targetVar, varsDb);
    currentRhs = isolatedTarget.isolatedRhs;
    const rhsAst = parseMathAST(currentRhs);
    lines.push(`\\implies ${targetSym} &= ${astToLatex(rhsAst, null, varsDb)}`);
  }

  // 4. Numerical Substitution Line
  const substitutedValuesMap = {};
  const activeIds = tokenizeExpr(currentRhs).filter(t => t.type === "id").map(t => t.val);

  activeIds.forEach(tok => {
    const mathConsts = new Set(["pi", "sin", "cos", "tan", "sqrt", "abs", "atan", "acos", "asin"]);
    if (mathConsts.has(tok)) return;

    const canonicalKey = resolveCanonicalKey(tok, varsDb);

    let val = preConvertedVals[tok]?.val;
    let unit = preConvertedVals[tok]?.unit;

    if (val === undefined) {
      val = S[canonicalKey] !== undefined ? S[canonicalKey] : S[tok];
      unit = S._u?.[canonicalKey] || S._u?.[tok] || varsDb[canonicalKey]?.unit || varsDb[tok]?.unit || "";
    }

    if (val === undefined || isNaN(val)) return;

    const formattedNum = fmtSigFig(val, 6);
    const unitTex = unitAnalysis.tokenMarkup?.[tok] || (unit && unit !== "dimless" ? `\\text{ ${unit}}` : "");

    const isAngle = unit === "deg" || unit === "°";
    if (isAngle || !unitTex) {
      substitutedValuesMap[tok] = `${formattedNum}${unitTex}`;
    } else if (unitTex.includes("\\frac")) {
      substitutedValuesMap[tok] = `\\left(${formattedNum}\\,${unitTex}\\right)`;
    } else {
      substitutedValuesMap[tok] = `(${formattedNum}${unitTex.startsWith("\\") ? `\\,${unitTex}` : ` ${unitTex}`})`;
    }
  });

  const rhsAst = parseMathAST(currentRhs);
  const numericalSubstitutedTex = astToLatex(rhsAst, substitutedValuesMap, varsDb);
  const conversionFactorTex = unitAnalysis.conversionFactorTex;
  const displayTargetUnit = (targetUnit === "deg" || targetUnit === "°") ? "°" : (targetUnit ? `\\text{ ${targetUnit}}` : "");

  lines.push(`&= ${numericalSubstitutedTex}${conversionFactorTex} = \\mathbf{${formattedVal}${displayTargetUnit}}`);

  return `\\[ \\begin{aligned} ${lines.join(" \\\\[6pt]\n")} \\end{aligned} \\]`;
}
