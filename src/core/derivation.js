/**
 * src/core/derivation.js
 * Universal Graph + CAS Derivation Engine.
 * Pure AST tree-walker parser with ZERO regex replacements on LaTeX strings.
 */

import {
  casToTex, isolateVariable, substituteExpression,
  simplifyExpression, SYMBOL_TO_KEY, solveUnitAlgebra, UNIT_ALGEBRA_DB
} from "./cas.js";
import { fmtSigFig, cancelUnit } from "./dimensions.js";

// ========================================================
// 1. AST EXPRESSION PARSER
// ========================================================

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

function parseMathAST(exprStr) {
  const tokens = tokenizeExpr(exprStr);
  let pos = 0;

  function peek() { return tokens[pos]; }
  function consume(expectedVal) {
    const tok = tokens[pos];
    if (expectedVal && (!tok || tok.val !== expectedVal)) return null;
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

function stripOuterParens(texStr) {
  if (!texStr) return "";
  let s = texStr.trim();
  if (s.startsWith("\\left(") && s.endsWith("\\right)")) {
    return s.slice(6, -7).trim();
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
    if (wrapsAll) return s.slice(1, -1).trim();
  }
  return s;
}

function astToLatex(node, substituteMap = null, varsDb = {}) {
  if (!node) return "";

  if (node.type === "num") {
    return node.val;
  }

  if (node.type === "id") {
    if (substituteMap && substituteMap[node.name]) {
      return substituteMap[node.name];
    }
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
      const num = stripOuterParens(astToLatex(node.left, substituteMap, varsDb));
      const den = stripOuterParens(astToLatex(node.right, substituteMap, varsDb));
      return `\\frac{${num}}{${den}}`;
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

function toLatexSymbol(name, varsDb = {}) {
  const k = SYMBOL_TO_KEY[name] || name;
  if (varsDb[k]?.symbol) return varsDb[k].symbol;
  if (name === "pi") return "\\pi";
  if (name === "phi") return "\\phi";
  if (name === "phin" || name === "phi_n") return "\\phi_n";
  if (name === "psi") return "\\psi";
  if (name === "Ft" || name === "F_t" || name === "Wt" || name === "W_t") return "F_t";
  if (name === "Fn" || name === "F_n" || name === "W") return "F_n";
  if (name === "Fr" || name === "F_r" || name === "Wr" || name === "W_r") return "F_r";
  if (name === "Fa" || name === "F_a") return "F_a";
  if (name === "FD" || name === "F_D") return "F_D";
  if (name === "Fs" || name === "F_s") return "F_s";
  if (name === "Fw" || name === "F_w") return "F_w";
  if (name === "Cd" || name === "C_d") return "C_d";
  if (name === "Kw" || name === "K_w") return "K_w";
  if (name === "Pd" || name === "P_d") return "P_d";
  if (name === "Pdn" || name === "P_dn") return "P_{dn}";
  if (name === "Pc" || name === "P_c") return "P_c";
  if (name === "Pcn" || name === "P_cn") return "P_{cn}";
  if (name === "Pa" || name === "P_a") return "P_a";
  if (name === "Do" || name === "D_o") return "D_o";
  if (name === "Dr" || name === "D_r") return "D_r";
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
  if (name === "Tv" || name === "T_v" || name === "Nev") return "T_v";
  if (name === "mF" || name === "m_F") return "m_F";
  if (name === "Llead" || name === "L_lead") return "L";
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

  if (unitKey === "teeth/in") {
    if (cancelsIn) return `\\,\\frac{\\cancel{\\text{teeth}}}{\\cancel{\\text{in}}}`;
    return `\\,\\frac{\\text{teeth}}{\\text{in}}`;
  }

  const meta = UNIT_ALGEBRA_DB[unitKey];
  return meta?.tex ? `\\,${meta.tex}` : `\\text{ ${unitKey}}`;
}

// ========================================================
// 3. MAIN EXPORT
// ========================================================

export function buildAlignedDerivation(step, S, allSteps = [], varsDb = {}, relations = [], answeredVars = new Set(), givens = []) {
  const targetVar = step.targetVar;
  const targetKey = SYMBOL_TO_KEY[targetVar] || targetVar;
  const targetMeta = varsDb[targetKey] || {};
  const targetSym = targetMeta.symbol || targetVar;
  const targetUnit = S._u?.[targetKey] || targetMeta.unit || "";
  const formattedVal = fmtSigFig(step.expectedVal, 6);

  const knownVars = new Set([
    ...Array.from(answeredVars).map(v => SYMBOL_TO_KEY[v] || v),
    ...givens.map(g => SYMBOL_TO_KEY[g] || g)
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
  } else if (SYMBOL_TO_KEY[currentLhs] !== targetKey) {
    const isolatedTarget = isolateVariable(`${currentLhs} = ${currentRhs}`, targetVar, varsDb);
    currentRhs = isolatedTarget.isolatedRhs;
    rhsAst = parseMathAST(currentRhs);
    lines.push(`\\implies ${targetSym} &= ${astToLatex(rhsAst, null, varsDb)}`);
  }

  const unitAnalysis = solveUnitAlgebra(currentRhs, S, targetVar, targetUnit, varsDb);

  const substitutedValuesMap = {};
  const activeIds = tokenizeExpr(currentRhs).filter(t => t.type === "id").map(t => t.val);

  activeIds.forEach(tok => {
    if (tok === "pi") return;
    const varKey = SYMBOL_TO_KEY[tok] || tok;
    const val = S[varKey] !== undefined ? S[varKey] : S[tok];
    if (val === undefined || isNaN(val)) return;

    const meta = varsDb[varKey] || {};
    const unit = S._u?.[varKey] || meta.unit || "";
    const formattedNum = fmtSigFig(val, 6);
    const unitTex = formatUnitMarkup(unit, tok, unitAnalysis);

    substitutedValuesMap[tok] = `(${formattedNum}${unitTex})`;
  });

  const numericalSubstitutedTex = astToLatex(rhsAst, substitutedValuesMap, varsDb);
  const conversionFactorTex = unitAnalysis.conversionFactorTex;

  lines.push(`&= ${numericalSubstitutedTex}${conversionFactorTex} = \\mathbf{${formattedVal}${targetUnit ? `\\text{ ${targetUnit}}` : ""}}`);

  return `\\[ \\begin{aligned} ${lines.join(" \\\\[6pt]\n")} \\end{aligned} \\]`;
}
