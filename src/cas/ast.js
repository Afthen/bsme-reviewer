/**
 * src/cas/ast.js
 * ============================================================================
 * ARCHITECTURAL PILLAR I: The AST-First Math Compiler
 * ============================================================================
 * Mathematical formulas are structured Abstract Syntax Trees (ASTs).
 * Enforces strict operator precedence during string serialization so
 * denominators (A / (B * C)) preserve their grouping under left-associative math.
 * ============================================================================
 */

// ========================================================
// 1. LEXICAL ANALYZER (SCANNER)
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

// ========================================================
// 2. RECURSIVE DESCENT PARSER (GRAMMAR ENFORCEMENT)
// ========================================================

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

/**
 * Re-serializes an AST back into an infix string, enforcing strict
 * mathematical operator precedence and grouping parentheses.
 */
export function astToExprStr(node) {
  if (!node) return "";
  if (node.type === "num") return node.val;
  if (node.type === "id") return node.name;
  if (node.type === "group") return `(${astToExprStr(node.expr)})`;
  if (node.type === "call") return `${node.fn}(${astToExprStr(node.arg)})`;

  if (node.type === "binary") {
    let leftStr = astToExprStr(node.left);
    let rightStr = astToExprStr(node.right);

    // 1. Division: Denominator with ANY binary operation MUST be parenthesized: A / (B * C)
    if (node.op === "/" && node.right.type === "binary") {
      rightStr = `(${rightStr})`;
    }
    if (node.op === "/" && node.left.type === "binary" && (node.left.op === "+" || node.left.op === "-")) {
      leftStr = `(${leftStr})`;
    }

    // 2. Multiplication: Additive terms must be parenthesized: (A + B) * C
    if (node.op === "*") {
      if (node.left.type === "binary" && (node.left.op === "+" || node.left.op === "-")) {
        leftStr = `(${leftStr})`;
      }
      if (node.right.type === "binary" && (node.right.op === "+" || node.right.op === "-")) {
        rightStr = `(${rightStr})`;
      }
    }

    // 3. Subtraction: Right-hand additive terms must be parenthesized: A - (B + C)
    if (node.op === "-" && node.right.type === "binary" && (node.right.op === "+" || node.right.op === "-")) {
      rightStr = `(${rightStr})`;
    }

    // 4. Power: Complex base or exponent must be parenthesized: (A / B) ^ (1 / 2)
    if (node.op === "^") {
      if (node.left.type === "binary") leftStr = `(${leftStr})`;
      if (node.right.type === "binary") rightStr = `(${rightStr})`;
    }

    return `${leftStr} ${node.op} ${rightStr}`;
  }

  return "";
}

// ========================================================
// 3. TREE INSPECTION
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
// 4. NUMERICAL AST EVALUATOR
// ========================================================

export function evalAST(node, S = {}, unitResolver = null) {
  if (!node) return NaN;

  if (node.type === "num") {
    return parseFloat(node.val);
  }

  if (node.type === "id") {
    if (node.name === "pi") return Math.PI;
    if (node.name === "e") return Math.E;
    const val = S[node.name];
    return typeof val === "number" ? val : NaN;
  }

  if (node.type === "group") {
    return evalAST(node.expr, S, unitResolver);
  }

  if (node.type === "call") {
    let a = evalAST(node.arg, S, unitResolver);
    if (isNaN(a)) return NaN;

    if (["sin", "cos", "tan"].includes(node.fn)) {
      if (unitResolver && unitResolver(node.arg)) {
        a = (a * Math.PI) / 180;
      }
    }

    switch (node.fn) {
      case "sin": return Math.sin(a);
      case "cos": return Math.cos(a);
      case "tan": return Math.tan(a);
      case "asin": return Math.asin(a);
      case "acos": return Math.acos(a);
      case "atan": return Math.atan(a);
      case "sqrt": return Math.sqrt(a);
      case "exp": return Math.exp(a);
      case "ln":
      case "log": return Math.log(a);
      case "abs": return Math.abs(a);
      default: return NaN;
    }
  }

  if (node.type === "binary") {
    const L = evalAST(node.left, S, unitResolver);
    const R = evalAST(node.right, S, unitResolver);
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
