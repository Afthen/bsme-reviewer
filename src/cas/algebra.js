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

      if (uLeft && uLeft.type === "binary" && uLeft.op === "/") {
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

      if (uRight && uRight.type === "binary" && uRight.op === "/") {
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

/**
 * Collects all terms containing the target variable into a standardized (A * x = B) form.
 * NULL-SAFE: If any branch is non-linear, the entire result is null.
 */
const isZeroNode = n => {
  const u = unwrapGroup(n);
  return u?.type === "num" && u.val === "0";
};

const isOneNode = n => {
  const u = unwrapGroup(n);
  return u?.type === "num" && u.val === "1";
};

const isNegZeroSub = n => {
  const u = unwrapGroup(n);
  return u?.type === "binary" && u.op === "-" && isZeroNode(u.left);
};

const wrapBinary = n => (n && n.type === "binary" ? { type: "group", expr: n } : n);

const wrapAddSub = n => {
  const u = unwrapGroup(n);
  return u && u.type === "binary" && (u.op === "+" || u.op === "-") ? { type: "group", expr: u } : n;
};

function addNodes(A, B) {
  if (!A || !B) return A || B;
  if (isZeroNode(A)) return B;
  if (isZeroNode(B)) return A;
  if (isNegZeroSub(B)) return subNodes(A, unwrapGroup(B).right);
  if (isNegZeroSub(A)) return subNodes(B, unwrapGroup(A).right);
  return { type: "binary", op: "+", left: wrapAddSub(A), right: wrapAddSub(B) };
}

function subNodes(A, B) {
  if (!A || !B) return A || B;
  if (isZeroNode(B)) return A;
  if (isZeroNode(A)) return negateNode(B);
  if (isNegZeroSub(B)) return addNodes(A, unwrapGroup(B).right);
  return { type: "binary", op: "-", left: wrapAddSub(A), right: wrapAddSub(B) };
}

function collectTerms(node, targetVar) {
  if (!node) return null;
  const n = unwrapGroup(node);

  if (n.type === "num") {
    return { coeff: { type: "num", val: "0" }, constant: n };
  }

  if (n.type === "id") {
    if (n.name === targetVar) return { coeff: { type: "num", val: "1" }, constant: { type: "num", val: "0" } };
    return { coeff: { type: "num", val: "0" }, constant: n };
  }

  if (n.type === "binary") {
    if (n.op === "+" || n.op === "-") {
      const L = collectTerms(n.left, targetVar);
      const R = collectTerms(n.right, targetVar);

      // If either branch is non-linear (null), the whole sum is non-linear
      if (L === null || R === null) return null;

      const isSub = n.op === "-";
      return {
        coeff: isSub ? subNodes(L.coeff, R.coeff) : addNodes(L.coeff, R.coeff),
        constant: isSub ? subNodes(L.constant, R.constant) : addNodes(L.constant, R.constant)
      };
    }

    if (n.op === "*") {
      const hasL = astHasVariable(n.left, targetVar);
      const hasR = astHasVariable(n.right, targetVar);
      if (hasL && hasR) return null; // Non-linear term (x*x)

      const sub = hasL ? collectTerms(n.left, targetVar) : collectTerms(n.right, targetVar);
      if (!sub) return null;
      const factor = hasL ? n.right : n.left;

      return {
        coeff: multiplyNode(sub.coeff, factor),
        constant: multiplyNode(sub.constant, factor)
      };
    }

    if (n.op === "/") {
      // Only support targetVar in numerator for direct linear collection
      if (astHasVariable(n.right, targetVar)) return null;
      const sub = collectTerms(n.left, targetVar);
      if (!sub) return null;
      const invB = { type: "binary", op: "^", left: wrapBinary(n.right), right: { type: "num", val: "-1" } };
      return {
        coeff: multiplyNode(sub.coeff, invB),
        constant: multiplyNode(sub.constant, invB)
      };
    }
  }
  return null;
}

export function invertEquationAST(lhsNode, rhsNode, targetVar) {
  const leftCount = countVariableOccurrences(lhsNode, targetVar);
  const rightCount = countVariableOccurrences(rhsNode, targetVar);
  const totalCount = leftCount + rightCount;

  if (totalCount === 0) return { success: false, reason: "Target not found" };

  // TIER 1: Single-occurrence "Onion Peeler"
  if (totalCount === 1) {
    let E = leftCount === 1 ? lhsNode : rhsNode;
    let Y = leftCount === 1 ? rhsNode : lhsNode;

    while (true) {
      E = unwrapGroup(E);
      if (!E) return { success: false };
      if (E.type === "id" && E.name === targetVar) return { success: true, isolatedAST: flattenFractions(Y) };

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

  // TIER 2: Direct linear collection (no targetVar in denominator)
  const diffNode = subNodes(lhsNode, rhsNode);
  const lin = collectTerms(diffNode, targetVar);

  if (lin && !isZeroNode(lin.coeff)) {
    let numerator = negateNode(lin.constant);
    let denominator = lin.coeff;
    if (isNegZeroSub(numerator)) {
      numerator = unwrapGroup(numerator).right;
      denominator = negateNode(denominator);
    }
    const rawAst = isOneNode(denominator)
      ? numerator
      : { type: "binary", op: "/", left: wrapBinary(numerator), right: wrapBinary(denominator) };
    return { success: true, isolatedAST: flattenFractions(rawAst) };
  }

  // TIER 3: Linear-rational cross-multiplication (e.g. BF = (t_s - t_adp) / (t_m - t_adp))
  return solveLinearRationalAST(lhsNode, rhsNode, targetVar);
}

function multiplyNode(A, B) {
  if (!A || !B) return null;
  if (isZeroNode(A) || isZeroNode(B)) return { type: "num", val: "0" };
  if (isOneNode(A)) return B;
  if (isOneNode(B)) return A;
  const uA = unwrapGroup(A);
  const uB = unwrapGroup(B);
  if (isNegZeroSub(uA) && isOneNode(uA.right)) return negateNode(B);
  if (isNegZeroSub(uB) && isOneNode(uB.right)) return negateNode(A);
  return { type: "binary", op: "*", left: wrapBinary(A), right: wrapBinary(B) };
}

function divideNode(A, B) {
  if (!A || !B) return null;
  if (isZeroNode(A)) return { type: "num", val: "0" };
  if (isOneNode(B)) return A;
  return { type: "binary", op: "/", left: wrapBinary(A), right: wrapBinary(B) };
}

function negateNode(A) {
  if (!A) return null;
  const u = unwrapGroup(A);
  if (isZeroNode(u)) return u;
  if (u.type === "binary" && u.op === "-") {
    if (isZeroNode(u.left)) return u.right;
    return { type: "binary", op: "-", left: wrapAddSub(u.right), right: wrapAddSub(u.left) };
  }
  return { type: "binary", op: "-", left: { type: "num", val: "0" }, right: wrapAddSub(u) };
}

function toRational(node, targetVar) {
  if (!node) return null;
  const u = unwrapGroup(node);
  if (!astHasVariable(u, targetVar) || u.type === "id") {
    return { num: u, den: { type: "num", val: "1" } };
  }
  if (u.type === "binary") {
    if (u.op === "/") {
      const L = toRational(u.left, targetVar);
      const R = toRational(u.right, targetVar);
      if (!L || !R) return null;
      return { num: multiplyNode(L.num, R.den), den: multiplyNode(L.den, R.num) };
    }
    if (u.op === "*") {
      const L = toRational(u.left, targetVar);
      const R = toRational(u.right, targetVar);
      if (!L || !R) return null;
      return { num: multiplyNode(L.num, R.num), den: multiplyNode(L.den, R.den) };
    }
    if (u.op === "+" || u.op === "-") {
      const L = toRational(u.left, targetVar);
      const R = toRational(u.right, targetVar);
      if (!L || !R) return null;
      if (isOneNode(L.den) && isOneNode(R.den)) {
        return { num: u.op === "+" ? addNodes(L.num, R.num) : subNodes(L.num, R.num), den: { type: "num", val: "1" } };
      }
      const crossL = multiplyNode(L.num, R.den);
      const crossR = multiplyNode(R.num, L.den);
      return {
        num: u.op === "+" ? addNodes(crossL, crossR) : subNodes(crossL, crossR),
        den: multiplyNode(L.den, R.den)
      };
    }
  }
  return null;
}

export function solveLinearRationalAST(lhsNode, rhsNode, targetVar) {
  const L = toRational(lhsNode, targetVar);
  const R = toRational(rhsNode, targetVar);
  if (!L || !R) return { success: false, reason: "Non-linear or non-rational equation" };

  const diffNode = subNodes(multiplyNode(L.num, R.den), multiplyNode(R.num, L.den));
  const lin = collectTerms(diffNode, targetVar);
  if (!lin || isZeroNode(lin.coeff)) return { success: false, reason: "Non-linear equation" };

  let numerator = negateNode(lin.constant);
  let denominator = lin.coeff;

  if (isNegZeroSub(numerator)) {
    numerator = unwrapGroup(numerator).right;
    denominator = negateNode(denominator);
  }

  const rawAst = isOneNode(denominator)
    ? numerator
    : divideNode(numerator, denominator);
  const isolatedAST = flattenFractions(rawAst);
  if (astHasVariable(isolatedAST, targetVar)) {
    return { success: false, reason: "Non-linear or non-invertible equation" };
  }

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
    
    // INTEGRITY CHECK: The target variable MUST NOT exist in the resulting RHS
    if (astHasVariable(flattened, targetVar)) {
      return { targetVar, isolatedRhs: rawRhs, isolatedAST: rhsAst, success: false };
    }

    return {
      targetVar,
      isolatedRhs: astToExprStr(flattened),
      isolatedAST: flattened,
      success: true
    };
  }

  if (resolveCanonicalKey(rawLhs, varsDb) === canonicalTarget) {
    const flattened = flattenFractions(rhsAst);
    if (astHasVariable(flattened, targetVar)) return { targetVar, isolatedRhs: rawRhs, isolatedAST: rhsAst, success: false };
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
