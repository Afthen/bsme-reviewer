/**
 * src/cas/algebra.js
 * ============================================================================
 * ARCHITECTURAL PILLARS:
 * - PILLAR I: The "Onion Peeler" Symbolic Inversion
 * - PILLAR III: Case-Sensitive Physical Nomenclature
 * ============================================================================
 * PHILOSOPHY:
 * 1. The Onion Peeler:
 *    Instead of matching hardcoded equation shapes, this engine traces the path
 *    from the root node down to the target variable, peeling operations off layer
 *    by layer using exact inverse algebraic operations (+ <-> -, * <-> /, etc.).
 *    Works on arbitrary nesting, products-over-products, and powers.
 *
 * 2. Strict Case-Sensitivity:
 *    In engineering, letter case is physical reality:
 *      T (Torque/Teeth/Temp) != t (thickness/time)
 *      C (Center distance) != c (clearance)
 *      P_i (Indicated power) != pi (3.14159...)
 *    Case-insensitive matching is strictly forbidden. Reserved math keywords
 *    (pi, e, sin, cos, etc.) are permanently guarded.
 * ============================================================================
 */

import {
  parseMathAST, astToExprStr, astHasVariable,
  countVariableOccurrences, unwrapGroup
} from "./ast.js";

// ========================================================
// 1. KEYWORD PROTECTION & STRICT CANONICAL RESOLUTION
// ========================================================

export const RESERVED_MATH_TOKENS = Object.freeze(new Set([
  "pi", "e",
  "sin", "cos", "tan", "asin", "acos", "atan",
  "sqrt", "exp", "ln", "log", "abs"
]));

export function isReservedMathToken(token) {
  return RESERVED_MATH_TOKENS.has(token);
}

/**
 * Strict canonical key resolver.
 * Exact match first, then explicit schema alias list.
 * Never guesses via lowercase or stripping underscores.
 */
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

/**
 * Recursively peels off operations from E = Y until E is isolated to targetVar.
 */
export function invertEquationAST(lhsNode, rhsNode, targetVar) {
  const leftCount = countVariableOccurrences(lhsNode, targetVar);
  const rightCount = countVariableOccurrences(rhsNode, targetVar);
  const totalCount = leftCount + rightCount;

  // Uninvertible if variable is absent or appears on both sides / multiple times
  if (totalCount === 0) return { success: false, reason: "Target variable not in equation" };
  if (totalCount > 1) return { success: false, reason: "Target appears multiple times (non-invertible)" };

  let E = leftCount === 1 ? lhsNode : rhsNode;
  let Y = leftCount === 1 ? rhsNode : lhsNode;

  while (true) {
    E = unwrapGroup(E);

    // Terminal condition: target variable is fully isolated
    if (E.type === "id" && E.name === targetVar) {
      return { success: true, isolatedAST: Y };
    }

    // Layer: Function call f(A) = Y
    if (E.type === "call") {
      const inner = E.arg;
      switch (E.fn) {
        case "sqrt":
          Y = { type: "binary", op: "^", left: { type: "group", expr: Y }, right: { type: "num", val: "2" } };
          break;
        case "sin":  Y = { type: "call", fn: "asin", arg: Y }; break;
        case "cos":  Y = { type: "call", fn: "acos", arg: Y }; break;
        case "tan":  Y = { type: "call", fn: "atan", arg: Y }; break;
        case "asin": Y = { type: "call", fn: "sin", arg: Y };  break;
        case "acos": Y = { type: "call", fn: "cos", arg: Y };  break;
        case "atan": Y = { type: "call", fn: "tan", arg: Y };  break;
        case "ln":
        case "log":  Y = { type: "call", fn: "exp", arg: Y };  break;
        case "exp":  Y = { type: "call", fn: "ln", arg: Y };   break;
        default:
          return { success: false, reason: `Unsupported inverse function: ${E.fn}` };
      }
      E = inner;
      continue;
    }

    // Layer: Binary operation (A op B) = Y
    if (E.type === "binary") {
      const targetInLeft = astHasVariable(E.left, targetVar);
      const targetInRight = astHasVariable(E.right, targetVar);

      if (targetInLeft && !targetInRight) {
        // Target is in left branch (A op B = Y)
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
            // A ^ n = Y => A = Y ^ (1 / n)
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
        // Target is in right branch (A op B = Y)
        const A = E.left;
        switch (E.op) {
          case "+":
            // A + B = Y => B = Y - A
            Y = { type: "binary", op: "-", left: Y, right: { type: "group", expr: A } };
            break;
          case "-":
            // A - B = Y => B = A - Y
            Y = { type: "binary", op: "-", left: { type: "group", expr: A }, right: { type: "group", expr: Y } };
            break;
          case "*":
            // A * B = Y => B = Y / A
            Y = { type: "binary", op: "/", left: { type: "group", expr: Y }, right: { type: "group", expr: A } };
            break;
          case "/":
            // A / B = Y => B = A / Y
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

/**
 * Public entry point for variable isolation.
 */
export function isolateVariable(eqStr, targetVar, varsDb = {}) {
  const [rawLhs = "", rawRhs = ""] = eqStr.split("=").map(s => s.trim());
  const canonicalTarget = resolveCanonicalKey(targetVar, varsDb);
  const lhsAst = parseMathAST(rawLhs);
  const rhsAst = parseMathAST(rawRhs);

  if (!lhsAst || !rhsAst) {
    return { targetVar, isolatedRhs: rawRhs, isolatedAST: rhsAst, success: false };
  }

  const res = invertEquationAST(lhsAst, rhsAst, targetVar);

  if (res.success) {
    return {
      targetVar,
      isolatedRhs: astToExprStr(res.isolatedAST),
      isolatedAST: res.isolatedAST,
      success: true
    };
  }

  // Already isolated in LHS
  if (resolveCanonicalKey(rawLhs, varsDb) === canonicalTarget) {
    return {
      targetVar,
      isolatedRhs: rawRhs,
      isolatedAST: rhsAst,
      success: true
    };
  }

  return { targetVar, isolatedRhs: rawRhs, isolatedAST: rhsAst, success: false };
}

// ========================================================
// 3. AST SUBSTITUTION
// ========================================================

/**
 * Substitutes numeric values into an AST without string regex hazards.
 */
export function astSubstitute(node, subsObj = {}, varsDb = {}) {
  if (!node) return null;
  if (node.type === "id") {
    const k = resolveCanonicalKey(node.name, varsDb);
    const repl = subsObj[node.name] || subsObj[k];
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
  const ast = parseMathAST(exprStr);
  return ast ? astToExprStr(astSubstitute(ast, subsObj, varsDb)) : exprStr;
}

export function simplifyExpression(exprStr) {
  return exprStr || "";
}
