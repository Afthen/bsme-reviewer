/**
 * src/core/derivation.js
 * Universal Graph + CAS Derivation Engine.
 * Formats mathematical substitution lines using pure atomic unit-bag markup.
 */

import {
  casToTex, isolateVariable, substituteExpression,
  simplifyExpression, solveUnitAlgebra,
  resolveCanonicalKey, parseMathAST, tokenizeExpr
} from "./cas.js";
import { fmtSigFig } from "./dimensions.js";

export function stripOuterParens(texStr) {
  if (!texStr) return "";
  let s = texStr.trim();
  let changed = true;

  while (changed) {
    changed = false;
    s = s.trim();

    if (s.startsWith("\\left(") && s.endsWith("\\right)")) {
      let depth = 0;
      let wrapsAll = true;
      for (let i = 0; i < s.length - 7; i++) {
        if (s.startsWith("\\left(", i)) depth++;
        else if (s.startsWith("\\right)", i)) depth--;
        if (depth === 0 && i < s.length - 7) {
          wrapsAll = false;
          break;
        }
      }
      if (wrapsAll) {
        s = s.slice(6, -7).trim();
        changed = true;
        continue;
      }
    }

    if (s.startsWith("(") && s.endsWith(")")) {
      let depth = 0;
      let wrapsAll = true;
      for (let i = 0; i < s.length - 1; i++) {
        if (s[i] === "(") depth++;
        else if (s[i] === ")") depth--;
        if (depth === 0) {
          wrapsAll = false;
          break;
        }
      }
      if (wrapsAll) {
        s = s.slice(1, -1).trim();
        changed = true;
        continue;
      }
    }
  }

  return s;
}

function toLatexSymbol(name, varsDb = {}) {
  const canonical = resolveCanonicalKey(name, varsDb);
  if (varsDb[canonical]?.symbol) return varsDb[canonical].symbol;
  if (varsDb[name]?.symbol) return varsDb[name].symbol;
  if (name === "pi") return "\\pi";
  if (name === "phi") return "\\phi";
  if (name === "phin" || name === "phi_n") return "\\phi_n";
  if (name === "psi") return "\\psi";
  return name;
}

function astToLatex(node, substituteMap = null, varsDb = {}) {
  if (!node) return "";

  if (node.type === "num") {
    return node.val;
  }

  if (node.type === "id") {
    if (substituteMap && substituteMap[node.name] !== undefined) {
      return substituteMap[node.name];
    }
    return toLatexSymbol(node.name, varsDb);
  }

  if (node.type === "group") {
    let innerNode = node.expr;
    while (innerNode && innerNode.type === "group") {
      innerNode = innerNode.expr;
    }
    const inner = stripOuterParens(astToLatex(innerNode, substituteMap, varsDb));
    return `(${inner})`;
  }

  if (node.type === "call") {
    let argNode = node.arg;
    while (argNode && argNode.type === "group") {
      argNode = argNode.expr;
    }

    const inner = stripOuterParens(astToLatex(argNode, substituteMap, varsDb));

    if (node.fn === "sqrt") return `\\sqrt{${inner}}`;
    if (node.fn === "cos") return `\\cos(${inner})`;
    if (node.fn === "sin") return `\\sin(${inner})`;
    if (node.fn === "tan") return `\\tan(${inner})`;
    if (node.fn === "atan") return `\\tan^{-1}\\left(${inner}\\right)`;
    if (node.fn === "acos") return `\\cos^{-1}\\left(${inner}\\right)`;
    return `\\text{${node.fn}}\\left(${inner}\\right)`;
  }

  if (node.type === "binary") {
    if (node.op === "/") {
      const num = stripOuterParens(astToLatex(node.left, substituteMap, varsDb));
      const den = stripOuterParens(astToLatex(node.right, substituteMap, varsDb));
      return `\\frac{${num}}{${den}}`;
    }
    if (node.op === "*") {
      const leftTex = astToLatex(node.left, substituteMap, varsDb);
      const rightTex = astToLatex(node.right, substituteMap, varsDb);

      const leftIsNum = /^[+-]?[\d.]+$/.test(leftTex.trim());
      const rightIsNum = /^[+-]?[\d.]+$/.test(rightTex.trim());

      let sep = " ";
      if (leftIsNum && rightIsNum) {
        sep = " \\cdot ";
      } else if (rightTex.startsWith("\\left(") || rightTex.startsWith("(")) {
        sep = "";
      }

      return `${leftTex}${sep}${rightTex}`.trim();
    }
    if (node.op === "+") {
      return `${astToLatex(node.left, substituteMap, varsDb)} + ${astToLatex(node.right, substituteMap, varsDb)}`;
    }
    if (node.op === "-") {
      return `${astToLatex(node.left, substituteMap, varsDb)} - ${astToLatex(node.right, substituteMap, varsDb)}`;
    }
    if (node.op === "^") {
      const leftTex = astToLatex(node.left, substituteMap, varsDb);
      const expTex = stripOuterParens(astToLatex(node.right, substituteMap, varsDb));
      return `{${leftTex}}^{${expTex}}`;
    }
  }

  return "";
}

// ========================================================
// 3. MAIN DERIVATION EXPORT
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

  // PURE ATOMIC UNIT-BAG ANALYSIS
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

  // Canonical formula line
  const canonicalTex = (activeVariant?.canonicalTex || step.canonicalTex || eq?.canonicalTex || `${currentLhs} = ${currentRhs}`).replace(/\*/g, " ");
  if (canonicalTex.includes("=")) {
    const [cLhs, cRhs] = canonicalTex.split("=");
    lines.push(`${cLhs.trim()} &= ${cRhs.trim()}`);
  } else {
    lines.push(`\\text{Canonical:} \\quad & ${canonicalTex}`);
  }

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
  } else if (resolveCanonicalKey(currentLhs, varsDb) !== canonicalTarget) {
    const isolatedTarget = isolateVariable(`${currentLhs} = ${currentRhs}`, targetVar, varsDb);
    currentRhs = isolatedTarget.isolatedRhs;
    rhsAst = parseMathAST(currentRhs);
    lines.push(`\\implies ${targetSym} &= ${astToLatex(rhsAst, null, varsDb)}`);
  }

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

  const numericalSubstitutedTex = astToLatex(rhsAst, substitutedValuesMap, varsDb);
  const conversionFactorTex = unitAnalysis.conversionFactorTex;
  const displayTargetUnit = (targetUnit === "deg" || targetUnit === "°") ? "°" : (targetUnit ? `\\text{ ${targetUnit}}` : "");

  lines.push(`&= ${numericalSubstitutedTex}${conversionFactorTex} = \\mathbf{${formattedVal}${displayTargetUnit}}`);

  return `\\[ \\begin{aligned} ${lines.join(" \\\\[6pt]\n")} \\end{aligned} \\]`;
}
