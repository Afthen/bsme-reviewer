/**
 * src/core/derivation.js
 * Universal Graph + CAS Derivation Engine.
 * Uses a pure AST (Abstract Syntax Tree) expression parser and tree-walker.
 * ZERO regex replacements on LaTeX strings.
 */

import {
  casToTex, isolateVariable, substituteExpression,
  simplifyExpression, SYMBOL_TO_KEY, solveUnitAlgebra, UNIT_ALGEBRA_DB
} from "./cas.js";
import { cancelUnit } from "./dimensions.js";

// ========================================================
// 1. AST PARSER (REPLACES ALL REGEX STRING MANIPULATION)
// ========================================================

/**
 * Character-by-character scanner (lexer) that breaks a math expression into tokens.
 */
function tokenizeExpr(str) {
  const tokens = [];
  let i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (ch === " " || ch === "\t" || ch === "\n") {
      i++;
      continue;
    }
    if ("+-*/^()=".includes(ch)) {
      tokens.push({ type: "op", val: ch });
      i++;
    } else if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(str[i + 1] || ""))) {
      let num = "";
      while (i < str.length && /[0-9.]/.test(str[i])) {
        num += str[i++];
      }
      tokens.push({ type: "num", val: num });
    } else if (/[a-zA-Z_]/.test(ch)) {
      let id = "";
      while (i < str.length && /[a-zA-Z0-9_]/.test(str[i])) {
        id += str[i++];
      }
      tokens.push({ type: "id", val: id });
    } else {
      i++;
    }
  }
  return tokens;
}

/**
 * Recursive descent parser constructing an AST from tokens.
 */
function parseMathAST(exprStr) {
  const tokens = tokenizeExpr(exprStr);
  let pos = 0;

  function peek() {
    return tokens[pos];
  }
  function consume(expectedVal) {
    const tok = tokens[pos];
    if (expectedVal && (!tok || tok.val !== expectedVal)) {
      return null;
    }
    pos++;
    return tok;
  }

  function parsePrimary() {
    const tok = peek();
    if (!tok) return null;

    if (tok.val === "(") {
      consume("(");
      const node = parseAddSub();
      consume(")");
      return { type: "group", expr: node };
    }

    if (tok.type === "num") {
      consume();
      return { type: "num", val: tok.val };
    }

    if (tok.type === "id") {
      consume();
      // Check for function call: fn(arg)
      if (peek() && peek().val === "(") {
        consume("(");
        const arg = parseAddSub();
        consume(")");
        return { type: "call", fn: tok.val, arg };
      }
      return { type: "id", name: tok.val };
    }

    return null;
  }

  function parsePower() {
    let left = parsePrimary();
    while (peek() && peek().val === "^") {
      const op = consume().val;
      const right = parsePrimary();
      left = { type: "binary", op, left, right };
    }
    return left;
  }

  function parseMulDiv() {
    let left = parsePower();
    while (peek() && (peek().val === "*" || peek().val === "/")) {
      const op = consume().val;
      const right = parsePower();
      left = { type: "binary", op, left, right };
    }
    return left;
  }

  function parseAddSub() {
    let left = parseMulDiv();
    while (peek() && (peek().val === "+" || peek().val === "-")) {
      const op = consume().val;
      const right = parseMulDiv();
      left = { type: "binary", op, left, right };
    }
    return left;
  }

  return parseAddSub();
}

/**
 * Recursively converts an AST directly into LaTeX.
 * If substituteMap is provided, variable nodes are directly replaced at the tree level.
 */
function astToLatex(node, substituteMap = null, varsDb = {}) {
  if (!node) return "";

  if (node.type === "num") {
    return node.val;
  }

  if (node.type === "id") {
    // If a substitution mapping exists for this exact token, output it directly
    if (substituteMap && substituteMap[node.name]) {
      return substituteMap[node.name];
    }
    // Otherwise render its symbolic LaTeX token
    return toLatexSymbol(node.name, varsDb);
  }

  if (node.type === "group") {
    return `\\left(${astToLatex(node.expr, substituteMap, varsDb)}\\right)`;
  }

  if (node.type === "call") {
    const inner = astToLatex(node.arg, substituteMap, varsDb);
    if (node.fn === "sqrt") return `\\sqrt{${inner}}`;
    if (node.fn === "cos") return `\\cos(${inner})`;
    if (node.fn === "sin") return `\\sin(${inner})`;
    if (node.fn === "tan") return `\\tan(${inner})`;
    return `\\text{${node.fn}}\\left(${inner}\\right)`;
  }

  if (node.type === "binary") {
    if (node.op === "/") {
      const num = astToLatex(node.left, substituteMap, varsDb);
      const den = astToLatex(node.right, substituteMap, varsDb);
      return `\\frac{${stripOuterParens(num)}}{${stripOuterParens(den)}}`;
    }
    if (node.op === "*") {
      const leftTex = astToLatex(node.left, substituteMap, varsDb);
      const rightTex = astToLatex(node.right, substituteMap, varsDb);
      return `${leftTex}${rightTex.startsWith("\\left(") || rightTex.startsWith("(") ? "" : " "}${rightTex}`;
    }
    if (node.op === "+") {
      return `${astToLatex(node.left, substituteMap, varsDb)} + ${astToLatex(node.right, substituteMap, varsDb)}`;
    }
    if (node.op === "-") {
      return `${astToLatex(node.left, substituteMap, varsDb)} - ${astToLatex(node.right, substituteMap, varsDb)}`;
    }
    if (node.op === "^") {
      return `{${astToLatex(node.left, substituteMap, varsDb)}}^{${astToLatex(node.right, substituteMap, varsDb)}}`;
    }
  }

  return "";
}

function stripOuterParens(texStr) {
  if (texStr.startsWith("\\left(") && texStr.endsWith("\\right)")) {
    return texStr.slice(6, -7);
  }
  return texStr;
}

function toLatexSymbol(name, varsDb = {}) {
  const k = SYMBOL_TO_KEY[name] || name;
  if (varsDb[k]?.symbol) return varsDb[k].symbol;
  if (name === "pi") return "\\pi";
  if (name === "phi") return "\\phi";
  if (name === "Ft" || name === "F_t" || name === "Wt" || name === "W_t") return "F_t";
  if (name === "Fn" || name === "F_n" || name === "W") return "F_n";
  if (name === "Fr" || name === "F_r" || name === "Wr" || name === "W_r") return "F_r";
  if (name === "Pd" || name === "P_d") return "P_d";
  if (name === "Do" || name === "D_o") return "D_o";
  if (name === "Db" || name === "D_b") return "D_b";
  if (name === "VR" || name === "SR") return "\\text{SR}";
  if (name === "Mt" || name === "M_t") return "T";
  if (name === "Vm" || name === "V_m") return "v";
  if (name === "n1" || name === "n_1") return "N_1";
  if (name === "n2" || name === "n_2") return "N_2";
  if (name === "D1" || name === "D_1") return "D_1";
  if (name === "D2" || name === "D_2") return "D_2";
  if (name === "T1" || name === "T_1") return "T_1";
  if (name === "T2" || name === "T_2") return "T_2";
  if (name === "psi") return "\\psi";
  if (name === "phin" || name === "phi_n") return "\\phi_n";
  if (name === "Pcn" || name === "P_cn") return "P_{cn}";
  if (name === "Pdn" || name === "P_dn") return "P_{dn}";
  if (name === "Pa" || name === "P_a") return "P_a";
  if (name === "Fa" || name === "F_a") return "F_a";
  if (name === "Dr" || name === "D_r") return "D_r";
  if (name === "FD" || name === "F_D") return "F_D";
  if (name === "Cd" || name === "C_d") return "C_d";
  if (name === "yform" || name === "y_form") return "y";
  return name;
}

// ========================================================
// 2. UNIT FORMATTING (TIED TO CAS CONVERSION FACTORS)
// ========================================================

function formatUnitMarkup(unitKey, tok, unitAnalysis) {
  if (!unitKey || unitKey === "dimless" || unitKey === "ratio") return "";
  if (unitKey === "deg") return "^\\circ";

  const factors = unitAnalysis?.conversionFactors || [];

  const cancelsMin = factors.some(f => f.from === "u_min" || f.to === "u_min");
  const cancelsMm  = factors.some(f => f.from === "u_mm"  || f.to === "u_mm");
  const cancelsIn  = factors.some(f => f.from === "u_in"  || f.to === "u_in");
  const cancelsFt  = factors.some(f => f.from === "u_ft"  || f.to === "u_ft");
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

  // 2. Velocity: ft/min
  if (unitKey === "ft/min") {
    if (cancelsFt && cancelsMin) return `\\,\\frac{\\cancel{\\text{ft}}}{\\cancel{\\text{min}}}`;
    if (cancelsFt) return `\\,\\frac{\\cancel{\\text{ft}}}{\\text{min}}`;
    if (cancelsMin) return `\\,\\frac{\\text{ft}}{\\cancel{\\text{min}}}`;
    return `\\,\\frac{\\text{ft}}{\\text{min}}`;
  }

  // 3. Lengths
  if (unitKey === "mm" && (cancelsMm || isFullyCanceled)) return `\\,\\cancel{\\text{mm}}`;
  if (unitKey === "in" && (cancelsIn || isFullyCanceled)) return `\\,\\cancel{\\text{in}}`;
  if (unitKey === "ft" && (cancelsFt || isFullyCanceled)) return `\\,\\cancel{\\text{ft}}`;

  // 4. Force & Torque
  if (unitKey === "lb" && isFullyCanceled) return `\\,\\cancel{\\text{lb}}`;
  if (unitKey === "N" && isFullyCanceled) return `\\,\\cancel{\\text{N}}`;
  if (unitKey === "lb-in") {
    if (isFullyCanceled) return `\\,\\cancel{\\text{lb}\\cdot\\text{in}}`;
    if (cancelsIn) return `\\,\\text{lb}\\cdot\\cancel{\\text{in}}`;
    return `\\,\\text{lb}\\cdot\\text{in}`;
  }
  if (unitKey === "N-m") {
    if (isFullyCanceled) return `\\,\\cancel{\\text{N}\\cdot\\text{m}}`;
    return `\\,\\text{N}\\cdot\\text{m}`;
  }

  // 5. Tooth counts & Tooth pitch
  if (unitKey === "teeth") {
    if (factors.length > 0 || isFullyCanceled) return `\\,\\cancel{\\text{teeth}}`;
    return `\\text{ teeth}`;
  }
  if (unitKey === "teeth/in") {
    if (cancelsIn) return `\\,\\frac{\\cancel{\\text{teeth}}}{\\cancel{\\text{in}}}`;
    return `\\,\\frac{\\text{teeth}}{\\text{in}}`;
  }

  const meta = UNIT_ALGEBRA_DB[unitKey];
  return meta?.tex ? `\\,${meta.tex}` : `\\text{ ${unitKey}}`;
}

function fmtPrecise(n, maxDec = 4) {
  if (n === undefined || n === null) return "";
  const num = typeof n === "number" ? n : Number(n);
  if (isNaN(num)) return "";
  if (Number.isInteger(num)) return num.toString();
  return parseFloat(num.toFixed(maxDec)).toString();
}

// ========================================================
// 3. UNIVERSAL STEP DERIVATION BUILDER
// ========================================================

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

  // 1. Resolve Canonical Equation
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

  // 2. Symbolic Graph Substitution with Tree Construction
  let maxSubstitutions = 5;
  let didSubstitute = false;
  let intermediateSubFormulaTex = "";

  // Parse RHS into an AST
  let rhsAst = parseMathAST(currentRhs);

  while (maxSubstitutions-- > 0) {
    const idTokens = tokenizeExpr(currentRhs).filter(t => t.type === "id").map(t => t.val);
    const mathConsts = new Set(["pi", "sin", "cos", "tan", "sqrt", "abs"]);
    const unresolvedToken = idTokens.find(tok => {
      const k = SYMBOL_TO_KEY[tok] || tok;
      return !mathConsts.has(tok) && !knownVars.has(k) && k !== targetKey;
    });

    if (!unresolvedToken) break;

    const unresolvedKey = SYMBOL_TO_KEY[unresolvedToken] || unresolvedToken;
    const parentStep = allSteps.find(s => (SYMBOL_TO_KEY[s.targetVar] || s.targetVar) === unresolvedKey);
    const parentEq = relations.find(r => r.id === parentStep?.eqId) || relations.find(r => r.nodes && r.nodes.includes(unresolvedKey));

    if (parentEq?.baseFormula) {
      const isolatedParent = isolateVariable(parentEq.baseFormula, unresolvedToken, varsDb);
      const parentAst = parseMathAST(isolatedParent.isolatedRhs);

      // Create substitution mapping at AST level
      const subMap = {
        [unresolvedToken]: `\\left(${astToLatex(parentAst, null, varsDb)}\\right)`
      };
      const unsimplifiedTex = astToLatex(rhsAst, subMap, varsDb);

      // Simplify algebraically via CAS
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

  // If substitution occurred, render: &= 2\pi N_1 \left(\frac{F_t D_1}{2}\right) = \pi D_1 F_t N_1
  if (didSubstitute && intermediateSubFormulaTex) {
    lines.push(`&= ${intermediateSubFormulaTex}`);
  } else if (SYMBOL_TO_KEY[currentLhs] !== targetKey) {
    const isolatedTarget = isolateVariable(`${currentLhs} = ${currentRhs}`, targetVar, varsDb);
    currentRhs = isolatedTarget.isolatedRhs;
    rhsAst = parseMathAST(currentRhs);
    lines.push(`\\implies ${targetSym} &= ${astToLatex(rhsAst, null, varsDb)}`);
  }

  // 3. General CAS Unit Solver (Solves conversions & cancellations)
  const unitAnalysis = solveUnitAlgebra(currentRhs, S, targetVar, targetUnit, varsDb);

  // 4. Build Exact Substituted Values Map for Tree Nodes
  const substitutedValuesMap = {};
  const activeIds = tokenizeExpr(currentRhs).filter(t => t.type === "id").map(t => t.val);

  activeIds.forEach(tok => {
    if (tok === "pi") return;
    const varKey = SYMBOL_TO_KEY[tok] || tok;
    const val = S[varKey] !== undefined ? S[varKey] : S[tok];
    if (val === undefined || isNaN(val)) return;

    const meta = varsDb[varKey] || {};
    const unit = S._u?.[varKey] || meta.unit || "";
    const formattedNum = fmtPrecise(val, meta.isInteger ? 0 : 4);
    const unitTex = formatUnitMarkup(unit, tok, unitAnalysis);

    // Map AST node directly: e.g. T -> (700\text{ lb-in})
    substitutedValuesMap[tok] = `(${formattedNum}${unitTex})`;
  });

  // Render numerical substitution straight from the AST (ZERO regex)
  const numericalSubstitutedTex = astToLatex(rhsAst, substitutedValuesMap, varsDb);
  const conversionFactorTex = unitAnalysis.conversionFactorTex;

  // 5. Final Line
  lines.push(`&= ${numericalSubstitutedTex}${conversionFactorTex} = \\mathbf{${formattedVal}${targetUnit ? `\\text{ ${targetUnit}}` : ""}}`);

  return `\\[ \\begin{aligned} ${lines.join(" \\\\[6pt]\n")} \\end{aligned} \\]`;
}
