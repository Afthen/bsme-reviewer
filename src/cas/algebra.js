import { parseMathAST, astToExprStr, astHasVariable, countVariableOccurrences, unwrapGroup } from "./ast.js";

export const RESERVED_MATH_TOKENS = Object.freeze(new Set([
  "pi", "e", "sin", "cos", "tan", "asin", "acos", "atan", "sqrt", "exp", "ln", "log", "abs"
]));

export function isReservedMathToken(token) { return RESERVED_MATH_TOKENS.has(token); }

export function resolveCanonicalKey(token, varsDb = {}) {
  if (!token) return "";
  if (isReservedMathToken(token)) return token;
  if (varsDb[token]) return token;
  for (const [key, meta] of Object.entries(varsDb)) {
    if (meta.aliases && meta.aliases.includes(token)) return key;
  }
  return token;
}

export function invertEquationAST(lhsNode, rhsNode, targetVar) {
  const leftCount = countVariableOccurrences(lhsNode, targetVar);
  const rightCount = countVariableOccurrences(rhsNode, targetVar);
  if (leftCount + rightCount !== 1) return { success: false };

  let E = leftCount === 1 ? lhsNode : rhsNode;
  let Y = leftCount === 1 ? rhsNode : lhsNode;

  while (true) {
    E = unwrapGroup(E);
    if (E.type === "id" && E.name === targetVar) return { success: true, isolatedAST: Y };

    if (E.type === "call") {
      const inner = E.arg;
      switch (E.fn) {
        case "sqrt": Y = { type: "binary", op: "^", left: { type: "group", expr: Y }, right: { type: "num", val: "2" } }; break;
        case "sin": Y = { type: "call", fn: "asin", arg: Y }; break;
        case "cos": Y = { type: "call", fn: "acos", arg: Y }; break;
        case "tan": Y = { type: "call", fn: "atan", arg: Y }; break;
        case "asin": Y = { type: "call", fn: "sin", arg: Y }; break;
        case "acos": Y = { type: "call", fn: "cos", arg: Y }; break;
        case "atan": Y = { type: "call", fn: "tan", arg: Y }; break;
        case "ln": case "log": Y = { type: "call", fn: "exp", arg: Y }; break;
        case "exp": Y = { type: "call", fn: "ln", arg: Y }; break;
        default: return { success: false };
      }
      E = inner; continue;
    }

    if (E.type === "binary") {
      const targetInLeft = astHasVariable(E.left, targetVar);
      const targetInRight = astHasVariable(E.right, targetVar);

      if (targetInLeft && !targetInRight) {
        const B = E.right;
        switch (E.op) {
          case "+": Y = { type: "binary", op: "-", left: Y, right: { type: "group", expr: B } }; break;
          case "-": Y = { type: "binary", op: "+", left: Y, right: { type: "group", expr: B } }; break;
          case "*": Y = { type: "binary", op: "/", left: { type: "group", expr: Y }, right: { type: "group", expr: B } }; break;
          case "/": Y = { type: "binary", op: "*", left: { type: "group", expr: Y }, right: { type: "group", expr: B } }; break;
          case "^": Y = { type: "binary", op: "^", left: { type: "group", expr: Y }, right: { type: "group", expr: { type: "binary", op: "/", left: { type: "num", val: "1" }, right: { type: "group", expr: B } } } }; break;
          default: return { success: false };
        }
        E = E.left; continue;
      } else if (targetInRight && !targetInLeft) {
        const A = E.left;
        switch (E.op) {
          case "+": Y = { type: "binary", op: "-", left: Y, right: { type: "group", expr: A } }; break;
          case "-": Y = { type: "binary", op: "-", left: { type: "group", expr: A }, right: { type: "group", expr: Y } }; break;
          case "*": Y = { type: "binary", op: "/", left: { type: "group", expr: Y }, right: { type: "group", expr: A } }; break;
          case "/": Y = { type: "binary", op: "/", left: { type: "group", expr: A }, right: { type: "group", expr: Y } }; break;
          default: return { success: false };
        }
        E = E.right; continue;
      }
    }
    return { success: false };
  }
}

export function isolateVariable(eqStr, targetVar, varsDb = {}) {
  const [rawLhs = "", rawRhs = ""] = eqStr.split("=").map(s => s.trim());
  const canonicalTarget = resolveCanonicalKey(targetVar, varsDb);
  const lhsAst = parseMathAST(rawLhs);
  const rhsAst = parseMathAST(rawRhs);

  if (!lhsAst || !rhsAst) return { targetVar, isolatedRhs: rawRhs, isolatedAST: rhsAst, success: false };
  const res = invertEquationAST(lhsAst, rhsAst, targetVar);
  if (res.success) return { targetVar, isolatedRhs: astToExprStr(res.isolatedAST), isolatedAST: res.isolatedAST, success: true };
  if (resolveCanonicalKey(rawLhs, varsDb) === canonicalTarget) return { targetVar, isolatedRhs: rawRhs, isolatedAST: rhsAst, success: true };
  return { targetVar, isolatedRhs: rawRhs, isolatedAST: rhsAst, success: false };
}

export function astSubstitute(node, subsObj = {}, varsDb = {}) {
  if (!node) return null;
  if (node.type === "id") {
    const k = resolveCanonicalKey(node.name, varsDb);
    const repl = subsObj[node.name] || subsObj[k];
    return repl !== undefined ? (parseMathAST(repl) ? { type: "group", expr: parseMathAST(repl) } : node) : node;
  }
  if (node.type === "group") return { type: "group", expr: astSubstitute(node.expr, subsObj, varsDb) };
  if (node.type === "call") return { type: "call", fn: node.fn, arg: astSubstitute(node.arg, subsObj, varsDb) };
  if (node.type === "binary") return { type: "binary", op: node.op, left: astSubstitute(node.left, subsObj, varsDb), right: astSubstitute(node.right, subsObj, varsDb) };
  return node;
}

export function substituteExpression(exprStr, subsObj = {}, varsDb = {}) {
  const ast = parseMathAST(exprStr);
  return ast ? astToExprStr(astSubstitute(ast, subsObj, varsDb)) : exprStr;
}

export function simplifyExpression(exprStr) { return exprStr || ""; }
