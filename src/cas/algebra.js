/**
 * src/cas/algebra.js
 * ============================================================================
 * ARCHITECTURAL PILLARS:
 * - PILLAR I: The "Onion Peeler" + Linear Rational Factoring + Fraction Flattener
 * - PILLAR III: Case-Sensitive Physical Nomenclature
 * ============================================================================
 */

import {
  parseMathAST, astToExprStr, astHasVariable,
  countVariableOccurrences, unwrapGroup
} from "./ast.js";

export const RESERVED_MATH_TOKENS = Object.freeze(new Set([
  "pi", "e", "sin", "cos", "tan", "asin", "acos", "atan", "sqrt", "exp", "ln", "log", "abs"
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
// 1. AST FRACTION FLATTENER (KILLS NESTED FRACTION TOWERS)
// ========================================================

/**
 * Recursively simplifies compound division ASTs:
 *   (A / B) / C  ===>  A / (B * C)
 *   A / (B / C)  ===>  (A * C) / B
 */
export function flattenFractions(node) {
  if (!node) return null;
  if (node.type === "group") {
    return { type: "group", expr: flattenFractions(node.expr) };
  }
  if (node.type === "call") {
    return { type: "call", fn: node.fn, arg: flattenFractions(node.arg) };
  }
  if (node.type === "binary") {
    let left = flattenFractions(node.left);
    let right = flattenFractions(node.right);

    if (node.op === "/") {
      let uLeft = unwrapGroup(left);
      let uRight = unwrapGroup(right);

      // (A / B) / C ===> A / (B * C)
      if (uLeft.type === "binary" && uLeft.op === "/") {
        const A = uLeft.left;
        const B = uLeft.right;
        const C = right;
        return flattenFractions({
          type: "binary",
          op: "/",
          left: { type: "group", expr: A },
          right: {
            type: "group",
            expr: {
              type: "binary",
              op: "*",
              left: { type: "group", expr: B },
              right: { type: "group", expr: C }
            }
          }
        });
      }

      // A / (B / C) ===> (A * C) / B
      if (uRight.type === "binary" && uRight.op === "/") {
        const A = left;
        const B = uRight.left;
        const C = uRight.right;
        return flattenFractions({
          type: "binary",
          op: "/",
          left: {
            type: "group",
            expr: {
              type: "binary",
              op: "*",
              left: { type: "group", expr: A },
              right: { type: "group", expr: C }
            }
          },
          right: { type: "group", expr: B }
        });
      }
    }

    return { type: "binary", op: node.op, left, right };
  }
  return node;
}

// ========================================================
// 2. RECURSIVE ONION PEELER (SINGLE-OCCURRENCE INVERSION)
// ========================================================

export function invertEquationAST(lhsNode, rhsNode, targetVar) {
  const leftCount = countVariableOccurrences(lhsNode, targetVar);
  const rightCount = countVariableOccurrences(rhsNode, targetVar);
  const totalCount = leftCount + rightCount;

  if (totalCount === 0) return { success: false, reason: "Target not found" };

  if (totalCount > 1) {
    return solveLinearRationalAST(lhsNode, rhsNode, targetVar);
  }

  let E = leftCount === 1 ? lhsNode : rhsNode;
  let Y = leftCount === 1 ? rhsNode : lhsNode;

  while (true) {
    E = unwrapGroup(E);

    if (E.type === "id" && E.name === targetVar) {
      return { success: true, isolatedAST: flattenFractions(Y) };
    }

    if (E.type === "call") {
      const inner = E.arg;
      switch (E.fn) {
        case "sqrt": Y = { type: "binary", op: "^", left: { type: "group", expr: Y }, right: { type: "num", val: "2" } }; break;
        case "sin":  Y = { type: "call", fn: "asin", arg: Y }; break;
        case "cos":  Y = { type: "call", fn: "acos", arg: Y }; break;
        case "tan":  Y = { type: "call", fn: "atan", arg: Y }; break;
        case "asin": Y = { type: "call", fn: "sin", arg: Y };  break;
        case "acos": Y = { type: "call", fn: "cos", arg: Y };  break;
        case "atan": Y = { type: "call", fn: "tan", arg: Y };  break;
        case "ln":
        case "log":  Y = { type: "call", fn: "exp", arg: Y };  break;
        case "exp":  Y = { type: "call", fn: "ln", arg: Y };   break;
        default: return { success: false, reason: `Unsupported inverse function: ${E.fn}` };
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
          case "+": Y = { type: "binary", op: "-", left: Y, right: { type: "group", expr: B } }; break;
          case "-": Y = { type: "binary", op: "+", left: Y, right: { type: "group", expr: B } }; break;
          case "*": Y = { type: "binary", op: "/", left: { type: "group", expr: Y }, right: { type: "group", expr: B } }; break;
          case "/": Y = { type: "binary", op: "*", left: { type: "group", expr: Y }, right: { type: "group", expr: B } }; break;
          case "^":
            Y = {
              type: "binary", op: "^", left: { type: "group", expr: Y },
              right: { type: "group", expr: { type: "binary", op: "/", left: { type: "num", val: "1" }, right: { type: "group", expr: B } } }
            };
            break;
          default: return { success: false };
        }
        E = E.left;
        continue;
      } else if (targetInRight && !targetInLeft) {
        const A = E.left;
        switch (E.op) {
          case "+": Y = { type: "binary", op: "-", left: Y, right: { type: "group", expr: A } }; break;
          case "-": Y = { type: "binary", op: "-", left: { type: "group", expr: A }, right: { type: "group", expr: Y } }; break;
          case "*": Y = { type: "binary", op: "/", left: { type: "group", expr: Y }, right: { type: "group", expr: A } }; break;
          case "/": Y = { type: "binary", op: "/", left: { type: "group", expr: A }, right: { type: "group", expr: Y } }; break;
          default: return { success: false };
        }
        E = E.right;
        continue;
      }
    }

    return { success: false };
  }
}

// ========================================================
// 3. LINEAR RATIONAL POLYNOMIAL FACTORING
// ========================================================

function extractLinearCoeffs(node, targetVar) {
  if (!node) return null;
  const n = unwrapGroup(node);

  if (!astHasVariable(n, targetVar)) {
    return { coeff: { type: "num", val: "0" }, constant: n };
  }

  if (n.type === "id" && n.name === targetVar) {
    return { coeff: { type: "num", val: "1" }, constant: { type: "num", val: "0" } };
  }

  if (n.type === "binary") {
    if (n.op === "+" || n.op === "-") {
      const L = extractLinearCoeffs(n.left, targetVar);
      const R = extractLinearCoeffs(n.right, targetVar);
      if (!L || !R) return null;

      const coeff = (L.coeff.val === "0") ? (n.op === "+" ? R.coeff : negateNode(R.coeff))
                  : (R.coeff.val === "0") ? L.coeff
                  : { type: "binary", op: n.op, left: { type: "group", expr: L.coeff }, right: { type: "group", expr: R.coeff } };

      const constant = (L.constant.val === "0") ? (n.op === "+" ? R.constant : negateNode(R.constant))
                     : (R.constant.val === "0") ? L.constant
                     : { type: "binary", op: n.op, left: { type: "group", expr: L.constant }, right: { type: "group", expr: R.constant } };

      return { coeff, constant };
    }

    if (n.op === "*") {
      const hasL = astHasVariable(n.left, targetVar);
      const hasR = astHasVariable(n.right, targetVar);
      if (hasL && hasR) return null;

      const sub = hasL ? extractLinearCoeffs(n.left, targetVar) : extractLinearCoeffs(n.right, targetVar);
      const k = hasL ? n.right : n.left;
      if (!sub) return null;

      return {
        coeff: multiplyNode(sub.coeff, k),
        constant: multiplyNode(sub.constant, k)
      };
    }

    if (n.op === "/" && !astHasVariable(n.right, targetVar)) {
      const sub = extractLinearCoeffs(n.left, targetVar);
      if (!sub) return null;
      return {
        coeff: divideNode(sub.coeff, n.right),
        constant: divideNode(sub.constant, n.right)
      };
    }
  }

  return null;
}

function multiplyNode(A, B) {
  if (A.val === "0") return { type: "num", val: "0" };
  if (A.val === "1") return B;
  return { type: "binary", op: "*", left: { type: "group", expr: A }, right: { type: "group", expr: B } };
}

function divideNode(A, B) {
  if (A.val === "0") return { type: "num", val: "0" };
  return { type: "binary", op: "/", left: { type: "group", expr: A }, right: { type: "group", expr: B } };
}

function negateNode(A) {
  if (A.val === "0") return A;
  return { type: "binary", op: "-", left: { type: "num", val: "0" }, right: { type: "group", expr: A } };
}

export function solveLinearRationalAST(lhsNode, rhsNode, targetVar) {
  let N_L = lhsNode, D_L = { type: "num", val: "1" };
  let N_R = rhsNode, D_R = { type: "num", val: "1" };

  const uL = unwrapGroup(lhsNode);
  const uR = unwrapGroup(rhsNode);

  if (uL.type === "binary" && uL.op === "/") { N_L = uL.left; D_L = uL.right; }
  if (uR.type === "binary" && uR.op === "/") { N_R = uR.left; D_R = uR.right; }

  const term1 = (D_R.val === "1") ? N_L : { type: "binary", op: "*", left: { type: "group", expr: N_L }, right: { type: "group", expr: D_R } };
  const term2 = (D_L.val === "1") ? N_R : { type: "binary", op: "*", left: { type: "group", expr: N_R }, right: { type: "group", expr: D_L } };

  const diffNode = { type: "binary", op: "-", left: { type: "group", expr: term1 }, right: { type: "group", expr: term2 } };

  const lin = extractLinearCoeffs(diffNode, targetVar);
  if (!lin || lin.coeff.val === "0") return { success: false, reason: "Non-linear equation" };

  let numerator = negateNode(lin.constant);
  let denominator = lin.coeff;

  if (numerator.type === "binary" && numerator.op === "-" && numerator.left.val === "0") {
    numerator = unwrapGroup(numerator.right);
    denominator = negateNode(denominator);
  }

  const isolatedAST = flattenFractions({
    type: "binary",
    op: "/",
    left: { type: "group", expr: numerator },
    right: { type: "group", expr: denominator }
  });

  return { success: true, isolatedAST };
}

export function isolateVariable(eqStr, targetVar, varsDb = {}) {
  const [rawLhs = "", rawRhs = ""] = eqStr.split("=").map(s => s.trim());
  const canonicalTarget = resolveCanonicalKey(targetVar, varsDb);
  const lhsAst = parseMathAST(rawLhs);
  const rhsAst = parseMathAST(rawRhs);

  if (!lhsAst || !rhsAst) return { targetVar, isolatedRhs: rawRhs, isolatedAST: rhsAst, success: false };

  const res = invertEquationAST(lhsAst, rhsAst, targetVar);
  if (res.success) {
    const flattened = flattenFractions(res.isolatedAST);
    return {
      targetVar,
      isolatedRhs: astToExprStr(flattened),
      isolatedAST: flattened,
      success: true
    };
  }

  if (resolveCanonicalKey(rawLhs, varsDb) === canonicalTarget) {
    const flattened = flattenFractions(rhsAst);
    return { targetVar, isolatedRhs: astToExprStr(flattened), isolatedAST: flattened, success: true };
  }

  return { targetVar, isolatedRhs: rawRhs, isolatedAST: rhsAst, success: false };
}

export function astSubstitute(node, subsObj = {}, varsDb = {}) {
  if (!node) return null;
  if (node.type === "id") {
    const k = resolveCanonicalKey(node.name, varsDb);
    const repl = subsObj[node.name] || subsObj[k];
    if (repl !== undefined) {
      const subAst = parseMathAST(repl);
      if (!subAst) return node;
      if (subAst.type === "binary" && (subAst.op === "+" || subAst.op === "-")) {
        return { type: "group", expr: subAst };
      }
      return subAst;
    }
    return node;
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
