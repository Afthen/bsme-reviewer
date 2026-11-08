/**
 * src/core/ast.js
 * Pure mathematical AST primitives, lexer, parser, and numeric evaluator.
 * Independent of units, physical dimensions, or LaTeX formatting.
 */

// ========================================================
// 1. LEXER & PARSER
// ========================================================

export function tokenizeExpr(str) {
  const tokens = [];
  let i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (ch === " " || ch === "\t" || ch === "\n") {
      i++;
      continue;
    }
    if ("+-*/^()=,".includes(ch)) {
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

export function parseMathAST(exprStr) {
  if (!exprStr) return null;
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

export function astToExprStr(node) {
  if (!node) return "";
  if (node.type === "num") return node.val;
  if (node.type === "id") return node.name;
  if (node.type === "group") return `(${astToExprStr(node.expr)})`;
  if (node.type === "call") return `${node.fn}(${astToExprStr(node.arg)})`;
  if (node.type === "binary") {
    return `${astToExprStr(node.left)} ${node.op} ${astToExprStr(node.right)}`;
  }
  return "";
}

// ========================================================
// 2. TREE TRAVERSAL & INSPECTION
// ========================================================

export function getAstIdentifiers(node) {
  const ids = [];
  function walk(n) {
    if (!n) return;
    if (n.type === "id") ids.push(n.name);
    if (n.expr) walk(n.expr);
    if (n.arg) walk(n.arg);
    if (n.left) walk(n.left);
    if (n.right) walk(n.right);
  }
  walk(node);
  return ids;
}

export function astHasVariable(node, targetVar) {
  if (!node) return false;
  function walk(n) {
    if (!n) return false;
    if (n.type === "id") return n.name === targetVar;
    if (n.type === "group") return walk(n.expr);
    if (n.type === "call") return walk(n.arg);
    if (n.type === "binary") return walk(n.left) || walk(n.right);
    return false;
  }
  return walk(node);
}

export function countVariableOccurrences(node, targetVar) {
  if (!node) return 0;
  let count = 0;
  function walk(n) {
    if (!n) return;
    if (n.type === "id" && n.name === targetVar) count++;
    if (n.type === "group") walk(n.expr);
    if (n.type === "call") walk(n.arg);
    if (n.type === "binary") {
      walk(n.left);
      walk(n.right);
    }
  }
  walk(node);
  return count;
}

export function unwrapGroup(node) {
  let n = node;
  while (n && n.type === "group") {
    n = n.expr;
  }
  return n;
}

// ========================================================
// 3. PURE NUMERIC AST EVALUATOR
// ========================================================

export function evalAST(node, S = {}) {
  if (!node) return NaN;

  if (node.type === "num") return parseFloat(node.val);

  if (node.type === "id") {
    if (node.name === "pi") return Math.PI;
    if (node.name === "e") return Math.E;
    const val = S[node.name];
    return typeof val === "number" ? val : NaN;
  }

  if (node.type === "group") return evalAST(node.expr, S);

  if (node.type === "call") {
    const argVal = evalAST(node.arg, S);
    if (isNaN(argVal)) return NaN;
    switch (node.fn) {
      case "sin": return Math.sin(argVal);
      case "cos": return Math.cos(argVal);
      case "tan": return Math.tan(argVal);
      case "asin": return Math.asin(argVal);
      case "acos": return Math.acos(argVal);
      case "atan": return Math.atan(argVal);
      case "sqrt": return Math.sqrt(argVal);
      case "exp": return Math.exp(argVal);
      case "ln":
      case "log": return Math.log(argVal);
      case "abs": return Math.abs(argVal);
      default: return NaN;
    }
  }

  if (node.type === "binary") {
    const L = evalAST(node.left, S);
    const R = evalAST(node.right, S);
    if (isNaN(L) || isNaN(R)) return NaN;
    switch (node.op) {
      case "+": return L + R;
      case "-": return L - R;
      case "*": return L * R;
      case "/": return R !== 0 ? L / R : NaN;
      case "^": return Math.pow(L, R);
      default: return NaN;
    }
  }

  return NaN;
}
