/**
 * src/core/latex.js
 * KaTeX code generator and mathematical expression stringifier.
 */

import { parseMathAST } from "./ast.js";
import { resolveCanonicalKey } from "./algebra.js";

export function toLatexSymbol(name, varsDb = {}) {
  const canonical = resolveCanonicalKey(name, varsDb);
  if (varsDb[canonical]?.symbol) return varsDb[canonical].symbol;
  if (varsDb[name]?.symbol) return varsDb[name].symbol;
  if (name === "pi") return "\\pi";
  if (name === "phi") return "\\phi";
  if (name === "phin" || name === "phi_n") return "\\phi_n";
  if (name === "psi") return "\\psi";
  return name;
}

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

export function astToLatex(node, substituteMap = null, varsDb = {}) {
  if (!node) return "";

  if (node.type === "num") return node.val;

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

    switch (node.fn) {
      case "sqrt": return `\\sqrt{${inner}}`;
      case "cos": return `\\cos(${inner})`;
      case "sin": return `\\sin(${inner})`;
      case "tan": return `\\tan(${inner})`;
      case "atan": return `\\tan^{-1}\\left(${inner}\\right)`;
      case "acos": return `\\cos^{-1}\\left(${inner}\\right)`;
      case "asin": return `\\sin^{-1}\\left(${inner}\\right)`;
      case "exp": return `e^{${inner}}`;
      case "ln": return `\\ln\\left(${inner}\\right)`;
      default: return `\\text{${node.fn}}\\left(${inner}\\right)`;
    }
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
      if (leftIsNum && rightIsNum) sep = " \\cdot ";
      else if (rightTex.startsWith("\\left(") || rightTex.startsWith("(")) sep = "";

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

export function casToTex(exprStr, varsDb = {}) {
  if (!exprStr) return "";
  const ast = parseMathAST(exprStr);
  if (!ast) return exprStr;
  return astToLatex(ast, null, varsDb);
}
