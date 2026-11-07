/**
 * src/core/derivation.js
 * Universal Graph + CAS Derivation Engine.
 * AST tree-walker parser with recursive parenthesis elimination and literal degree rendering.
 */

import {
  casToTex, isolateVariable, substituteExpression,
  simplifyExpression, solveUnitAlgebra, UNIT_ALGEBRA_DB,
  resolveCanonicalKey, parseMathAST, tokenizeExpr
} from "./cas.js";
import { fmtSigFig } from "./dimensions.js";

/**
 * Recursively peels off all outer layers of parentheses or \left( ... \right) wrappers.
 * e.g. "((15°))" -> "15°", "\left(\left(15°\right)\right)" -> "15°"
 */
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
    // Drill through any nested AST group nodes so arguments are unwrapped
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
      const sep = (rightTex.startsWith("\\left(") || rightTex.startsWith("(") || rightTex.startsWith("\\tan") || rightTex.startsWith("\\cos") || rightTex.startsWith("\\sin")) ? " " : " ";
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

function formatUnitMarkup(unitKey, tok, unitAnalysis) {
  if (!unitKey || unitKey === "dimless" || unitKey === "ratio") return "";
  if (unitKey === "deg" || unitKey === "°") return "°";

  const factors = unitAnalysis?.conversionFactors || [];
  const cancelsMin = factors.some(f => f.from === "u_min" || f.to === "u_min");
  const cancelsMm  = factors.some(f => f.from === "u_mm"  || f.to === "u_mm");
  const cancelsIn  = factors.some(f => f.from === "u_in"  || f.to === "u_in");
  const cancelsFt  = factors.some(f => f.from === "u_ft"  || f.to === "u_ft");
  const isFullyCanceled = unitAnalysis?.canceledTokens?.has(tok);

  if (unitKey === "rpm" || unitKey === "rev/min") {
    if (isFullyCanceled) return `\\,\\frac{\\cancel{\\text{rev}}}{\\cancel{\\text{min}}}`;
    if (cancelsMin || unitAnalysis?.subTokenCancellations?.[tok]?.cancelMin) return `\\,\\frac{\\text{rev}}{\\cancel{\\text{min}}}`;
    return `\\,\\frac{\\text{rev}}{\\text{min}}`;
  }

  if (unitKey === "ft/min") {
    if (cancelsFt && cancelsMin) return `\\,\\frac{\\cancel{\\text{ft}}}{\\cancel{\\text{min}}}`;
    if (cancelsFt) return `\\,\\frac{\\cancel{\\text{ft}}}{\\text{min}}`;
    if (cancelsMin) return `\\,\\frac{\\text{ft}}{\\cancel{\\text{min}}}`;
    return `\\,\\frac{\\text{ft}}{\\text{min}}`;
  }

  if (unitKey === "mm" && (cancelsMm || isFullyCanceled)) return `\\,\\cancel{\\text{mm}}`;
  if (unitKey === "in" && (cancelsIn || isFullyCanceled)) return `\\,\\cancel{\\text{in}}`;
  if (unitKey === "ft" && (cancelsFt || isFullyCanceled)) return `\\,\\cancel{\\text{ft}}`;

  if (unitKey === "teeth") {
    if (factors.length > 0 || isFullyCanceled) return `\\,\\cancel{\\text{teeth}}`;
    return `\\text{ teeth}`;
  }

  const meta = UNIT_ALGEBRA_DB[unitKey];
  return meta?.tex ? `\\,${meta.tex}` : `\\text{ ${unitKey}}`;
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

  const unitAnalysis = solveUnitAlgebra(currentRhs, S, targetVar, targetUnit, varsDb);

  const substitutedValuesMap = {};
  const activeIds = tokenizeExpr(currentRhs).filter(t => t.type === "id").map(t => t.val);

  activeIds.forEach(tok => {
    const mathConsts = new Set(["pi", "sin", "cos", "tan", "sqrt", "abs", "atan", "acos", "asin"]);
    if (mathConsts.has(tok)) return;

    const canonicalKey = resolveCanonicalKey(tok, varsDb);
    const val = S[canonicalKey] !== undefined ? S[canonicalKey] : S[tok];
    if (val === undefined || isNaN(val)) return;

    const meta = varsDb[canonicalKey] || varsDb[tok] || {};
    const unit = S._u?.[canonicalKey] || S._u?.[tok] || meta.unit || "";
    const formattedNum = fmtSigFig(val, 6);
    const unitTex = formatUnitMarkup(unit, tok, unitAnalysis);

    const isAngle = unit === "deg" || unit === "°";
    if (isAngle || !unitTex) {
      substitutedValuesMap[tok] = `${formattedNum}${unitTex}`;
    } else {
      substitutedValuesMap[tok] = `(${formattedNum}${unitTex})`;
    }
  });

  const numericalSubstitutedTex = astToLatex(rhsAst, substitutedValuesMap, varsDb);
  const conversionFactorTex = unitAnalysis.conversionFactorTex;
  const displayTargetUnit = (targetUnit === "deg" || targetUnit === "°") ? "°" : (targetUnit ? `\\text{ ${targetUnit}}` : "");

  lines.push(`&= ${numericalSubstitutedTex}${conversionFactorTex} = \\mathbf{${formattedVal}${displayTargetUnit}}`);

  return `\\[ \\begin{aligned} ${lines.join(" \\\\[6pt]\n")} \\end{aligned} \\]`;
}
