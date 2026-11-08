import { parseMathAST } from "./ast.js";
import { resolveCanonicalKey } from "./algebra.js";

export function toLatexSymbol(name, varsDb = {}) {
  const c = resolveCanonicalKey(name, varsDb);
  if (varsDb[c]?.symbol) return varsDb[c].symbol;
  if (varsDb[name]?.symbol) return varsDb[name].symbol;
  if (name === "pi") return "\\pi";
  if (name === "phi") return "\\phi";
  if (name === "phin" || name === "phi_n") return "\\phi_n";
  if (name === "psi") return "\\psi";
  return name;
}

export function stripOuterParens(texStr) {
  let s = (texStr || "").trim();
  let changed = true;
  while (changed) {
    changed = false;
    s = s.trim();
    if (s.startsWith("\\left(") && s.endsWith("\\right)")) {
      let d = 0, wraps = true;
      for (let i = 0; i < s.length - 7; i++) {
        if (s.startsWith("\\left(", i)) d++; else if (s.startsWith("\\right)", i)) d--;
        if (d === 0 && i < s.length - 7) { wraps = false; break; }
      }
      if (wraps) { s = s.slice(6, -7).trim(); changed = true; continue; }
    }
    if (s.startsWith("(") && s.endsWith(")")) {
      let d = 0, wraps = true;
      for (let i = 0; i < s.length - 1; i++) {
        if (s[i] === "(") d++; else if (s[i] === ")") d--;
        if (d === 0) { wraps = false; break; }
      }
      if (wraps) { s = s.slice(1, -1).trim(); changed = true; continue; }
    }
  }
  return s;
}

export function astToLatex(node, substituteMap = null, varsDb = {}) {
  if (!node) return "";
  
  if (node.type === "num") return node.val;
  
  if (node.type === "id") {
    return (substituteMap && substituteMap[node.name] !== undefined) 
      ? substituteMap[node.name] 
      : toLatexSymbol(node.name, varsDb);
  }
  
  if (node.type === "group") {
    let innerNode = node.expr;
    while (innerNode && innerNode.type === "group") innerNode = innerNode.expr;
    
    // Smart Parens: No defensive parens around raw numbers, variables, or functions
    if (innerNode.type === "num" || innerNode.type === "id" || innerNode.type === "call") {
      return astToLatex(innerNode, substituteMap, varsDb);
    }
    return `\\left(${stripOuterParens(astToLatex(innerNode, substituteMap, varsDb))}\\right)`;
  }
  
  if (node.type === "call") {
    const inner = stripOuterParens(astToLatex(unwrapGroup(node.arg), substituteMap, varsDb));
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
    // Spaced continuous fractions
    if (node.op === "/") {
      return `\\cfrac{${stripOuterParens(astToLatex(node.left, substituteMap, varsDb))}}{${stripOuterParens(astToLatex(node.right, substituteMap, varsDb))}}`;
    }
    if (node.op === "*") {
      const L = astToLatex(node.left, substituteMap, varsDb);
      const R = astToLatex(node.right, substituteMap, varsDb);
      
      const leftIsSimpleNum = /^[+-]?[\d.]+$/.test(L.trim());
      const rightIsSimpleNum = /^[+-]?[\d.]+$/.test(R.trim());
      
      let sep = " ";
      if (leftIsSimpleNum && rightIsSimpleNum) sep = " \\cdot ";
      else if (R.startsWith("\\left(") || R.startsWith("(")) sep = "";
      
      return `${L}${sep}${R}`.trim();
    }
    if (node.op === "+") return `${astToLatex(node.left, substituteMap, varsDb)} + ${astToLatex(node.right, substituteMap, varsDb)}`;
    if (node.op === "-") return `${astToLatex(node.left, substituteMap, varsDb)} - ${astToLatex(node.right, substituteMap, varsDb)}`;
    if (node.op === "^") return `{${astToLatex(node.left, substituteMap, varsDb)}}^{${stripOuterParens(astToLatex(node.right, substituteMap, varsDb))}}`;
  }
  return "";
}

function unwrapGroup(node) {
  let n = node;
  while (n && n.type === "group") n = n.expr;
  return n;
}

export function casToTex(exprStr, varsDb = {}) {
  const ast = parseMathAST(exprStr);
  return ast ? astToLatex(ast, null, varsDb) : exprStr;
}
