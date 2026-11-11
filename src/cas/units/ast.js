/**
 * src/cas/units/ast.js
 * Lexer and Recursive Descent Parser for Unit Expressions.
 */

import { resolveUnitToken } from "./definitions.js";

export function tokenizeUnitExpr(str) {
  const tokens = [];
  let i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (ch === " " || ch === "\t" || ch === "\n") {
      i++;
      continue;
    }
    if ("*/^()-·".includes(ch)) {
      tokens.push({ type: "op", val: ch === "·" ? "*" : ch });
      i++;
    } else if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(str[i + 1] || ""))) {
      let num = "";
      while (i < str.length && /[0-9.]/.test(str[i])) num += str[i++];
      tokens.push({ type: "num", val: num });
    } else if (/[a-zA-Z°%]/.test(ch)) {
      let id = "";
      while (i < str.length && /[a-zA-Z0-9°_%]/.test(str[i])) id += str[i++];
      tokens.push({ type: "id", val: id });
    } else {
      i++;
    }
  }
  return tokens;
}

export function parseUnitAST(exprStr, dimension = null) {
  if (!exprStr) return null;
  const tokens = tokenizeUnitExpr(exprStr);
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
      const node = parseDiv();
      consume(")");
      return { type: "group", expr: node };
    }

    if (tok.type === "num") {
      consume();
      return { type: "num", val: tok.val };
    }

    if (tok.type === "id" || tok.type === "op") {
      const val = consume().val;
      const resolved = resolveUnitToken(val, dimension);
      return {
        type: "unit",
        prefix: resolved.prefix,
        base: resolved.base,
        raw: val,
        power: 1
      };
    }
    return null;
  }

  function parsePower() {
    let left = parsePrimary();
    while (peek() && peek().val === "^") {
      consume("^");
      const right = parsePrimary();
      let pVal = 1;
      if (right && right.type === "num") pVal = parseFloat(right.val);
      if (left && left.type === "unit") left.power *= pVal;
      else left = { type: "binary", op: "^", left, right };
    }
    return left;
  }

  // Compound product: binds *, ·, -, and adjacent units tighter than solidus /
  function parseProduct() {
    let left = parsePower();
    while (
      peek() &&
      (peek().val === "*" || peek().val === "-" || (peek().type !== "op" && peek().val !== ")"))
    ) {
      if (peek().val === "*" || peek().val === "-") {
        consume();
      }
      const right = parsePower();
      if (right) {
        left = { type: "binary", op: "*", left, right };
      }
    }
    return left;
  }

  // Division solidus (/): everything following / in the product binds to the denominator
  function parseDiv() {
    let left = parseProduct();
    while (peek() && peek().val === "/") {
      consume("/");
      const right = parseProduct();
      left = { type: "binary", op: "/", left, right };
    }
    return left;
  }

  return parseDiv();
}

export function flattenUnitAST(node, currentSign = 1) {
  if (!node) return [];
  if (node.type === "unit") {
    return [{ prefix: node.prefix, base: node.base, power: node.power * currentSign }];
  }
  if (node.type === "group") {
    return flattenUnitAST(node.expr, currentSign);
  }
  if (node.type === "binary") {
    if (node.op === "*") {
      return [...flattenUnitAST(node.left, currentSign), ...flattenUnitAST(node.right, currentSign)];
    }
    if (node.op === "/") {
      return [...flattenUnitAST(node.left, currentSign), ...flattenUnitAST(node.right, -currentSign)];
    }
  }
  return [];
}
