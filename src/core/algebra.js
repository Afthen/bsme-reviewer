/**
 * src/core/algebra.js
 * Symbolic algebra engine: recursive AST equation inversion and variable substitution.
 * Depends solely on ast.js.
 */

import {
  parseMathAST, astToExprStr, astHasVariable,
  countVariableOccurrences, unwrapGroup
} from "./ast.js";

// ========================================================
// 1. KEYWORD PROTECTION & CANONICAL RESOLUTION
// ========================================================

export const RESERVED_MATH_TOKENS = Object.freeze(new Set([
  "pi", "e",
  "sin", "cos", "tan", "asin", "acos", "atan",
  "sqrt", "exp", "ln", "log", "abs"
]));

export function isReservedMathToken(token) {
  return RESERVED_MATH_TOKENS.has(token);
}

export function resolveCanonicalKey(token, varsDb = {}) {
  if (!token) return "";
  if (isReservedMathToken(token)) return token;
  if (varsDb[token]) return token;

  for (const [key, meta] of Object.entries(varsDb)) {
    if (meta.aliases && meta.aliases.includes(token)) {
      return key;
    }
  }
  return token;
}

// ========================================================
// 2. RECURSIVE EQUATION INVERSION ("ONION PEELER")
// ========================================================

export function invertEquationAST(lhsNode, rhsNode, targetVar) {
  const leftCount = countVariableOccurrences(lhsNode, targetVar);
  const rightCount = countVariableOccurrences(rhsNode, targetVar);
  const totalCount = leftCount + rightCount;

  if (totalCount === 0) return { success: false, reason: "Target variable not in equation" };
  if (totalCount > 1) return { success: false, reason: "Target appears multiple times (non-invertible)" };

  let E = leftCount === 1 ? lhsNode : rhsNode;
  let Y = leftCount === 1 ? rhsNode : lhsNode;

  while (true) {
    E = unwrapGroup(E);

    if (E.type === "id" && E.name === targetVar) {
      return { success: true, isolatedAST: Y };
    }

    if (E.type === "call") {
      const inner = E.arg;
      switch (E.fn) {
        case "sqrt":
          Y = { type: "binary", op: "^", left: { type: "group", expr: Y }, right: { type: "num", val: "2" } };
          break;
        case "sin":
          Y = { type: "call", fn: "asin", arg: Y };
          break;
        case "cos":
          Y = { type: "call", fn: "acos", arg: Y };
          break;
        case "tan":
          Y = { type: "call", fn: "atan", arg: Y };
          break;
        case "asin":
          Y = { type: "call", fn: "sin", arg: Y };
          break;
        case "acos":
          Y = { type: "call", fn: "cos", arg: Y };
          break;
        case "atan":
          Y = { type: "call", fn: "tan", arg: Y };
          break;
        case "ln":
        case "log":
          Y = { type: "call", fn: "exp", arg: Y };
          break;
        case "exp":
          Y = { type: "call", fn: "ln", arg: Y };
          break;
        default:
          return { success: false, reason: `Unsupported inverse function: ${E.fn}` };
      }
      E = inner;
      continue;
    }

    if (E.type === "binary") {
      const targetInLeft = astHasVariable(E.left, targetVar);
      const targetInRight = astHasVariable(E.right, targetVar);

      if (targetInLeft && !targetInRight) {
        const B = E.right;
        switch (E.op) {
          case "+":
            Y = { type: "binary", op: "-", left: Y, right: { type: "group", expr: B } };
            break;
          case "-":
            Y = { type: "binary", op: "+", left: Y, right: { type: "group", expr: B } };
            break;
          case "*":
            Y = { type: "binary", op: "/", left: { type: "group", expr: Y }, right: { type: "group", expr: B } };
            break;
          case "/":
            Y = { type: "binary", op: "*", left: { type: "group", expr: Y }, right: { type: "group", expr: B } };
            break;
          case "^":
            Y = {
              type: "binary",
              op: "^",
              left: { type: "group", expr: Y },
              right: {
                type: "group",
                expr: { type: "binary", op: "/", left: { type: "num", val: "1" }, right: { type: "group", expr: B } }
              }
            };
            break;
          default:
            return { success: false, reason: `Unsupported operator: ${E.op}` };
        }
        E = E.left;
        continue;
      } else if (targetInRight && !targetInLeft) {
        const A = E.left;
        switch (E.op) {
          case "+":
            Y = { type: "binary", op: "-", left: Y, right: { type: "group", expr: A } };
            break;
          case "-":
            Y = { type: "binary", op: "-", left: { type: "group", expr: A }, right: { type: "group", expr: Y } };
            break;
          case "*":
            Y = { type: "binary", op: "/", left: { type: "group", expr: Y }, right: { type: "group", expr: A } };
            break;
          case "/":
            Y = { type: "binary", op: "/", left: { type: "group", expr: A }, right: { type: "group", expr: Y } };
            break;
          default:
            return { success: false, reason: `Unsupported operator in right branch: ${E.op}` };
        }
        E = E.right;
        continue;
      }
    }

    return { success: false, reason: "Unhandled AST branch" };
  }
}

export function isolateVariable(eqStr, targetVar, varsDb = {}) {
  const parts = eqStr.split("=");
  const rawLhs = parts[0]?.trim() || "";
  const rawRhs = parts[1]?.trim() || "";

  const canonicalTarget = resolveCanonicalKey(targetVar, varsDb);
  const targetMeta = varsDb[canonicalTarget] || varsDb[targetVar] || {};
  const targetSym = targetMeta.symbol || targetVar;

  const lhsAst = parseMathAST(rawLhs);
  const rhsAst = parseMathAST(rawRhs);

  if (!lhsAst || !rhsAst) {
    return { targetVar, isolatedRhs: rawRhs, isolatedAST: rhsAst, success: false };
  }

  const result = invertEquationAST(lhsAst, rhsAst, targetVar);

  if (result.success && result.isolatedAST) {
    return {
      targetVar,
      isolatedRhs: astToExprStr(result.isolatedAST),
      isolatedAST: result.isolatedAST,
      success: true
    };
  }

  if (resolveCanonicalKey(rawLhs, varsDb) === canonicalTarget) {
    return {
      targetVar,
      isolatedRhs: rawRhs,
      isolatedAST: rhsAst,
      success: true
    };
  }

  return {
    targetVar,
    isolatedRhs: rawRhs,
    isolatedAST: rhsAst,
    success: false
  };
}

// ========================================================
// 3. AST SUBSTITUTION
// ========================================================

export function astSubstitute(node, subsObj = {}, varsDb = {}) {
  if (!node) return null;
  if (node.type === "id") {
    const canonicalKey = resolveCanonicalKey(node.name, varsDb);
    const repl = subsObj[node.name] || subsObj[canonicalKey];
    if (repl !== undefined) {
      const subAst = parseMathAST(repl);
      return subAst ? { type: "group", expr: subAst } : node;
    }
    return node;
  }
  if (node.type === "group") {
    return { type: "group", expr: astSubstitute(node.expr, subsObj, varsDb) };
  }
  if (node.type === "call") {
    return { type: "call", fn: node.fn, arg: astSubstitute(node.arg, subsObj, varsDb) };
  }
  if (node.type === "binary") {
    return {
      type: "binary",
      op: node.op,
      left: astSubstitute(node.left, subsObj, varsDb),
      right: astSubstitute(node.right, subsObj, varsDb)
    };
  }
  return node;
}

export function substituteExpression(exprStr, subsObj = {}, varsDb = {}) {
  if (!exprStr) return "";
  const ast = parseMathAST(exprStr);
  if (!ast) return exprStr;
  return astToExprStr(astSubstitute(ast, subsObj, varsDb));
}

export function simplifyExpression(exprStr) {
  return exprStr || "";
}
