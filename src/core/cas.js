/**
 * src/core/cas.js
 * Universal Computer Algebra System (CAS) with Recursive AST Inversion
 * and True Atomic Unit-Bag Algebra.
 * Pure native AST implementation with zero regex manipulation of math terms.
 */

// ========================================================
// 1. CANONICAL KEY & KEYWORD PROTECTION
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
 * Case-sensitive exact match first, then explicit alias match.
 * Never performs case-insensitive guessing or underscore stripping.
 */
export function resolveCanonicalKey(token, varsDb = {}) {
  if (!token) return "";
  if (isReservedMathToken(token)) return token;
  if (varsDb[token]) return token;

  // Search explicit aliases in varsDb
  for (const [key, meta] of Object.entries(varsDb)) {
    if (meta.aliases && meta.aliases.includes(token)) {
      return key;
    }
  }

  return token;
}

// ========================================================
// 2. AST EXPRESSION PARSER & STRINGIFIER
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

/**
 * Collect all identifier tokens from an AST (pure tree walk, zero regex).
 */
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

/**
 * Checks whether an AST contains a given variable (pure tree walk, zero regex).
 */
export function astHasVariable(node, targetVar, varsDb = {}) {
  if (!node) return false;
  const canonicalTarget = resolveCanonicalKey(targetVar, varsDb);

  function walk(n) {
    if (!n) return false;
    if (n.type === "id") {
      return resolveCanonicalKey(n.name, varsDb) === canonicalTarget;
    }
    if (n.type === "group") return walk(n.expr);
    if (n.type === "call") return walk(n.arg);
    if (n.type === "binary") return walk(n.left) || walk(n.right);
    return false;
  }

  return walk(node);
}

/**
 * Counts occurrences of a variable in an AST.
 */
export function countVariableOccurrences(node, targetVar, varsDb = {}) {
  if (!node) return 0;
  const canonicalTarget = resolveCanonicalKey(targetVar, varsDb);
  let count = 0;

  function walk(n) {
    if (!n) return;
    if (n.type === "id" && resolveCanonicalKey(n.name, varsDb) === canonicalTarget) {
      count++;
    }
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
// 3. PURE AST EVALUATOR (GROUND TRUTH NUMERICAL VERIFICATION)
// ========================================================

/**
 * Evaluates an AST numerically given a system S.
 * Supports standard constants (pi, e) and trigonometric/exponential functions.
 */
export function evalAST(node, S = {}) {
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
    return evalAST(node.expr, S);
  }

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

// ========================================================
// 4. RECURSIVE AST INVERSION ENGINE ("ONION PEELER")
// ========================================================

/**
 * Inverts an equation AST step by step until the target variable is isolated.
 * General for any tree where targetVar appears exactly once.
 */
function invertEquationAST(lhsNode, rhsNode, targetVar, varsDb = {}) {
  const canonicalTarget = resolveCanonicalKey(targetVar, varsDb);

  const leftCount = countVariableOccurrences(lhsNode, targetVar, varsDb);
  const rightCount = countVariableOccurrences(rhsNode, targetVar, varsDb);
  const totalCount = leftCount + rightCount;

  if (totalCount === 0) return { success: false, reason: "Target not in equation" };
  if (totalCount > 1) return { success: false, reason: "Target appears multiple times (non-invertible)" };

  let E = leftCount === 1 ? lhsNode : rhsNode;
  let Y = leftCount === 1 ? rhsNode : lhsNode;

  while (true) {
    E = unwrapGroup(E);

    // Terminal condition: E is the target variable
    if (E.type === "id" && resolveCanonicalKey(E.name, varsDb) === canonicalTarget) {
      return { success: true, isolatedAST: Y };
    }

    // Layer: Function call f(A) = Y
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

    // Layer: Binary operation (A op B) = Y
    if (E.type === "binary") {
      const targetInLeft = astHasVariable(E.left, targetVar, varsDb);
      const targetInRight = astHasVariable(E.right, targetVar, varsDb);

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
            return { success: false, reason: `Unsupported binary operator: ${E.op}` };
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
            return { success: false, reason: `Unsupported binary operator in right branch: ${E.op}` };
        }
        E = E.right;
        continue;
      }
    }

    return { success: false, reason: "Unhandled AST node type" };
  }
}

export function isolateVariable(eqStr, targetVar, varsDb = {}) {
  const parts = eqStr.split("=");
  const rawLhs = parts[0]?.trim() || "";
  const rawRhs = parts[1]?.trim() || "";

  const canonicalTarget = resolveCanonicalKey(targetVar, varsDb);
  const targetMeta = varsDb[canonicalTarget] || varsDb[targetVar] || {};
  const targetTex = targetMeta.symbol || targetVar;

  const lhsAst = parseMathAST(rawLhs);
  const rhsAst = parseMathAST(rawRhs);

  if (!lhsAst || !rhsAst) {
    return {
      targetVar,
      isolatedRhs: rawRhs,
      texEquation: `${targetTex} = ${casToTex(rawRhs, varsDb)}`,
      success: false
    };
  }

  const result = invertEquationAST(lhsAst, rhsAst, targetVar, varsDb);

  if (result.success && result.isolatedAST) {
    const isolatedExpr = astToExprStr(result.isolatedAST);
    const texRight = astToLatex(result.isolatedAST, null, varsDb);
    return {
      targetVar,
      isolatedRhs: isolatedExpr,
      isolatedAST: result.isolatedAST,
      texEquation: `${targetTex} = ${texRight}`,
      success: true
    };
  }

  // Fallback if already isolated
  const lhsCanon = resolveCanonicalKey(rawLhs, varsDb);
  if (lhsCanon === canonicalTarget) {
    return {
      targetVar,
      isolatedRhs: rawRhs,
      isolatedAST: rhsAst,
      texEquation: `${targetTex} = ${casToTex(rawRhs, varsDb)}`,
      success: true
    };
  }

  return {
    targetVar,
    isolatedRhs: rawRhs,
    isolatedAST: rhsAst,
    texEquation: `${targetTex} = ${casToTex(rawRhs, varsDb)}`,
    success: false
  };
}

// ========================================================
// 5. AST SUBSTITUTION & LATEX FORMATTER
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
  const newAst = astSubstitute(ast, subsObj, varsDb);
  return astToExprStr(newAst);
}

export function simplifyExpression(exprStr) {
  return exprStr || "";
}

function toLatexSymbol(name, varsDb = {}) {
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

  if (node.type === "num") {
    return node.val;
  }

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

    if (node.fn === "sqrt") return `\\sqrt{${inner}}`;
    if (node.fn === "cos") return `\\cos(${inner})`;
    if (node.fn === "sin") return `\\sin(${inner})`;
    if (node.fn === "tan") return `\\tan(${inner})`;
    if (node.fn === "atan") return `\\tan^{-1}\\left(${inner}\\right)`;
    if (node.fn === "acos") return `\\cos^{-1}\\left(${inner}\\right)`;
    if (node.fn === "asin") return `\\sin^{-1}\\left(${inner}\\right)`;
    if (node.fn === "exp") return `e^{${inner}}`;
    if (node.fn === "ln") return `\\ln\\left(${inner}\\right)`;
    return `\\text{${node.fn}}\\left(${inner}\\right)`;
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
      if (leftIsNum && rightIsNum) {
        sep = " \\cdot ";
      } else if (rightTex.startsWith("\\left(") || rightTex.startsWith("(")) {
        sep = "";
      }

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

// ========================================================
// 6. ATOMIC BASE UNIT & COMPOUND UNIT REGISTRY (DATA-DRIVEN)
// ========================================================

export const BASE_DIMENSIONS = Object.freeze({
  L: "Length",
  T: "Time",
  F: "Force",
  M: "Mass",
  Th: "Temperature",
  C: "Count"
});

export const ATOMIC_BASE_UNITS = Object.freeze({
  m:    { dim: "L", scale: 1.0, tex: "\\text{m}" },
  mm:   { dim: "L", scale: 0.001, tex: "\\text{mm}" },
  cm:   { dim: "L", scale: 0.01, tex: "\\text{cm}" },
  in:   { dim: "L", scale: 0.0254, tex: "\\text{in}" },
  ft:   { dim: "L", scale: 0.3048, tex: "\\text{ft}" },

  s:    { dim: "T", scale: 1.0, tex: "\\text{s}" },
  min:  { dim: "T", scale: 60.0, tex: "\\text{min}" },
  h:    { dim: "T", scale: 3600.0, tex: "\\text{h}" },
  hr:   { dim: "T", scale: 3600.0, tex: "\\text{h}" },

  N:    { dim: "F", scale: 1.0, tex: "\\text{N}" },
  kN:   { dim: "F", scale: 1000.0, tex: "\\text{kN}" },
  lb:   { dim: "F", scale: 4.4482216, tex: "\\text{lb}" },

  kg:   { dim: "M", scale: 1.0, tex: "\\text{kg}" },
  g:    { dim: "M", scale: 0.001, tex: "\\text{g}" },
  lb_m: { dim: "M", scale: 0.45359237, tex: "\\text{lb}_m" },

  K:    { dim: "Th", scale: 1.0, tex: "\\text{K}" },
  "°C": { dim: "Th", scale: 1.0, tex: "^\\circ\\text{C}" },

  teeth:{ dim: "C", scale: 1.0, tex: "\\text{teeth}" },
  rad:  { dim: "C", scale: 1.0, tex: "\\text{rad}" },
  rev:  { dim: "C", scale: 1.0, tex: "\\text{rev}" },
  "°":  { dim: "C", scale: Math.PI / 180, tex: "°" },
  deg:  { dim: "C", scale: Math.PI / 180, tex: "°" }
});

export const COMPOUND_UNITS = Object.freeze({
  psi:        { atoms: { lb: 1, in: -2 }, displayTex: "\\text{psi}" },
  MPa:        { atoms: { N: 1, mm: -2 }, displayTex: "\\text{MPa}" },
  Pa:         { atoms: { N: 1, m: -2 }, displayTex: "\\text{Pa}" },
  kPa:        { factor: 1000, atoms: { N: 1, m: -2 }, displayTex: "\\text{kPa}" },
  bar:        { factor: 100000, atoms: { N: 1, m: -2 }, displayTex: "\\text{bar}" },

  "N-m":      { atoms: { N: 1, m: 1 }, displayTex: "\\text{N}\\cdot\\text{m}" },
  "N*m":      { atoms: { N: 1, m: 1 }, displayTex: "\\text{N}\\cdot\\text{m}" },
  "kN-m":     { atoms: { kN: 1, m: 1 }, displayTex: "\\text{kN}\\cdot\\text{m}" },
  "lb-in":    { atoms: { lb: 1, in: 1 }, displayTex: "\\text{lb}\\cdot\\text{in}" },
  "lb-ft":    { atoms: { lb: 1, ft: 1 }, displayTex: "\\text{lb}\\cdot\\text{ft}" },
  J:          { atoms: { N: 1, m: 1 }, displayTex: "\\text{J}" },
  kJ:         { factor: 1000, atoms: { N: 1, m: 1 }, displayTex: "\\text{kJ}" },

  W:          { atoms: { N: 1, m: 1, s: -1 }, displayTex: "\\text{W}" },
  kW:         { factor: 1000, atoms: { N: 1, m: 1, s: -1 }, displayTex: "\\text{kW}" },
  MW:         { factor: 1e6, atoms: { N: 1, m: 1, s: -1 }, displayTex: "\\text{MW}" },
  hp:         { factor: 33000, atoms: { ft: 1, lb: 1, min: -1 }, displayTex: "\\text{hp}" },

  kWh:        { factor: 3.6e6, atoms: { N: 1, m: 1 }, displayTex: "\\text{kWh}" },
  "kg/kWh":   { factor: 1 / 3.6e6, atoms: { kg: 1, N: -1, m: -1 }, displayTex: "\\frac{\\text{kg}}{\\text{kWh}}" },
  "g/kWh":    { factor: 0.001 / 3.6e6, atoms: { g: 1, N: -1, m: -1 }, displayTex: "\\frac{\\text{g}}{\\text{kWh}}" },

  "m/s":      { atoms: { m: 1, s: -1 }, displayTex: "\\frac{\\text{m}}{\\text{s}}" },
  "ft/min":   { atoms: { ft: 1, min: -1 }, displayTex: "\\frac{\\text{ft}}{\\text{min}}" },

  "teeth/in": { atoms: { teeth: 1, in: -1 }, displayTex: "\\frac{\\text{teeth}}{\\text{in}}" },
  rpm:        { atoms: { min: -1 }, displayTex: "\\text{rpm}" },
  "rev/min":  { atoms: { rev: 1, min: -1 }, displayTex: "\\frac{\\text{rev}}{\\text{min}}" },

  "kg/s":     { atoms: { kg: 1, s: -1 }, displayTex: "\\frac{\\text{kg}}{\\text{s}}" },
  "kg/h":     { atoms: { kg: 1, h: -1 }, displayTex: "\\frac{\\text{kg}}{\\text{h}}" },
  "kJ/kg":    { factor: 1000, atoms: { N: 1, m: 1, kg: -1 }, displayTex: "\\frac{\\text{kJ}}{\\text{kg}}" },
  "kJ/(kg*K)":{ factor: 1000, atoms: { N: 1, m: 1, kg: -1, K: -1 }, displayTex: "\\frac{\\text{kJ}}{\\text{kg}\\cdot\\text{K}}" },
  "kJ/kg-K":  { factor: 1000, atoms: { N: 1, m: 1, kg: -1, K: -1 }, displayTex: "\\frac{\\text{kJ}}{\\text{kg}\\cdot\\text{K}}" },

  "m^3":      { atoms: { m: 3 }, displayTex: "\\text{m}^3" },
  L:          { factor: 0.001, atoms: { m: 3 }, displayTex: "\\text{L}" },
  "m^3/s":    { atoms: { m: 3, s: -1 }, displayTex: "\\frac{\\text{m}^3}{\\text{s}}" },
  "m^3/h":    { factor: 1 / 3600, atoms: { m: 3, s: -1 }, displayTex: "\\frac{\\text{m}^3}{\\text{h}}" },
  "L/s":      { factor: 0.001, atoms: { m: 3, s: -1 }, displayTex: "\\frac{\\text{L}}{\\text{s}}" },
  "L/h":      { factor: 0.001 / 3600, atoms: { m: 3, s: -1 }, displayTex: "\\frac{\\text{L}}{\\text{h}}" }
});

export function getUnitAtomBag(uName) {
  if (!uName || uName === "dimless" || uName === "ratio" || uName === "%") {
    return { factor: 1.0, atoms: {}, dimMap: {}, scale: 1.0, isDimensionless: true };
  }

  if (COMPOUND_UNITS[uName]) {
    const c = COMPOUND_UNITS[uName];
    const factor = c.factor || 1.0;
    const atoms = { ...c.atoms };
    let scale = factor;
    const dimMap = {};

    for (const [aName, p] of Object.entries(atoms)) {
      const base = ATOMIC_BASE_UNITS[aName];
      if (base) {
        dimMap[base.dim] = (dimMap[base.dim] || 0) + p;
        scale *= Math.pow(base.scale, p);
      }
    }
    return { factor, atoms, dimMap, scale, isDimensionless: false, displayTex: c.displayTex };
  }

  if (ATOMIC_BASE_UNITS[uName]) {
    const base = ATOMIC_BASE_UNITS[uName];
    return {
      factor: 1.0,
      atoms: { [uName]: 1 },
      dimMap: { [base.dim]: 1 },
      scale: base.scale,
      isDimensionless: false,
      displayTex: base.tex
    };
  }

  // Flag as un-registered unit for validator alerting
  return { factor: 1.0, atoms: {}, dimMap: {}, scale: 1.0, isDimensionless: false, isUnknown: true, rawUnit: uName };
}

export function isDimEqual(aMap, bMap) {
  const allDims = new Set([...Object.keys(aMap || {}), ...Object.keys(bMap || {})]);
  for (const d of allDims) {
    if ((aMap?.[d] || 0) !== (bMap?.[d] || 0)) return false;
  }
  return true;
}

// ========================================================
// 7. AST ATOMIC UNIT COLLECTOR & CANCELLATION ENGINE
// ========================================================

function evalExprUnitAST(node, S, varsDb) {
  if (!node) return { factor: 1.0, atoms: [] };

  if (node.type === "num") {
    return { factor: 1.0, atoms: [] };
  }

  if (node.type === "id") {
    const canonicalKey = resolveCanonicalKey(node.name, varsDb);
    const uName = S._u?.[canonicalKey] || S._u?.[node.name] || varsDb[canonicalKey]?.unit || varsDb[node.name]?.unit || "dimless";
    const bag = getUnitAtomBag(uName);

    const atoms = [];
    for (const [aName, p] of Object.entries(bag.atoms)) {
      const base = ATOMIC_BASE_UNITS[aName];
      atoms.push({
        token: node.name,
        canonicalKey,
        unitName: uName,
        atom: aName,
        dim: base?.dim || "custom",
        scale: base?.scale || 1.0,
        power: p,
        tex: base?.tex || `\\text{${aName}}`
      });
    }

    return { factor: bag.factor, atoms };
  }

  if (node.type === "group") {
    return evalExprUnitAST(node.expr, S, varsDb);
  }

  if (node.type === "call") {
    if (["sin", "cos", "tan", "atan", "acos", "asin"].includes(node.fn)) {
      return { factor: 1.0, atoms: [] };
    }
    if (node.fn === "sqrt") {
      const inner = evalExprUnitAST(node.arg, S, varsDb);
      return {
        factor: Math.sqrt(inner.factor),
        atoms: inner.atoms.map(a => ({ ...a, power: a.power / 2 }))
      };
    }
    return evalExprUnitAST(node.arg, S, varsDb);
  }

  if (node.type === "binary") {
    const left = evalExprUnitAST(node.left, S, varsDb);
    const right = evalExprUnitAST(node.right, S, varsDb);

    if (node.op === "*") {
      return {
        factor: left.factor * right.factor,
        atoms: [...left.atoms, ...right.atoms]
      };
    }

    if (node.op === "/") {
      const invRightAtoms = right.atoms.map(a => ({ ...a, power: -a.power }));
      return {
        factor: left.factor / right.factor,
        atoms: [...left.atoms, ...invRightAtoms]
      };
    }

    if (node.op === "+" || node.op === "-") {
      return left;
    }
  }

  return { factor: 1.0, atoms: [] };
}

export function solveUnitAlgebra(exprStr, S, targetVar, targetUnit, varsDb = {}, requiredUnits = null) {
  const ast = parseMathAST(exprStr);
  const selectedConversions = [];
  const preConversions = [];

  // ========================================================
  // A. EMPIRICAL EQUATIONS (Option B Pre-Conditioning Contract)
  // ========================================================
  if (requiredUnits && typeof requiredUnits === "object") {
    // Pure AST identifier extraction (zero regex)
    const allTokens = getAstIdentifiers(ast);
    const varTokens = Array.from(new Set(allTokens.filter(t => !isReservedMathToken(t))));

    varTokens.forEach(tok => {
      const canonicalKey = resolveCanonicalKey(tok, varsDb);
      const reqU = requiredUnits[canonicalKey] || requiredUnits[tok];
      if (!reqU) return;

      const currentU = S._u?.[canonicalKey] || S._u?.[tok] || varsDb[canonicalKey]?.unit || varsDb[tok]?.unit || "";

      if (currentU && reqU && currentU !== reqU && currentU !== "deg" && reqU !== "°") {
        const currentBag = getUnitAtomBag(currentU);
        const reqBag = getUnitAtomBag(reqU);

        if (isDimEqual(currentBag.dimMap, reqBag.dimMap)) {
          const ratio = currentBag.scale / reqBag.scale;
          const conv = {
            factor: ratio,
            latex: `\\frac{1\\text{ ${reqU}}}{${(1 / ratio).toFixed(4).replace(/\.?0+$/, "")}\\,\\cancel{\\text{${currentU}}}}`
          };
          const rawVal = S[canonicalKey] !== undefined ? S[canonicalKey] : S[tok];
          const convertedVal = rawVal * ratio;

          preConversions.push({
            token: tok,
            canonicalKey,
            fromUnit: currentU,
            toUnit: reqU,
            conv,
            rawVal,
            convertedVal
          });
        }
      }
    });

    return {
      tokenMarkup: {},
      conversionFactors: [],
      conversionFactorTex: "",
      preConversions
    };
  }

  // ========================================================
  // B. PURE ATOMIC UNIT ANALYSIS (ZERO HARDCODED UNIT NAMES)
  // ========================================================
  const exprAnalysis = evalExprUnitAST(ast, S, varsDb);
  const targetBag = getUnitAtomBag(targetUnit);

  const targetWantsTeeth = (targetBag.atoms["teeth"] || 0) > 0;
  const atomList = exprAnalysis.atoms.map((a, idx) => ({ ...a, id: idx, canceled: false, preserved: false }));

  // PASS 1: Direct Identical Atom Cancellation
  for (let i = 0; i < atomList.length; i++) {
    for (let j = i + 1; j < atomList.length; j++) {
      const a1 = atomList[i];
      const a2 = atomList[j];

      if (a1.atom === a2.atom && a1.power * a2.power < 0 && !a1.canceled && !a2.canceled) {
        a1.canceled = true;
        a2.canceled = true;
      }
    }
  }

  // PASS 2: Goal Unit Preservation
  atomList.forEach(a => {
    if (!a.canceled) {
      if (a.atom === "teeth") {
        if (targetWantsTeeth) {
          a.preserved = true;
        } else {
          a.canceled = true;
        }
      }
    }
  });

  // PASS 3: Internal Same-Dimension Clash
  const remainingAtoms = atomList.filter(a => !a.canceled && !a.preserved);
  const dimsPresent = Array.from(new Set(remainingAtoms.map(a => a.dim)));

  dimsPresent.forEach(dim => {
    const dimAtoms = remainingAtoms.filter(a => a.dim === dim);
    const pos = dimAtoms.find(a => a.power > 0);
    const neg = dimAtoms.find(a => a.power < 0);

    if (pos && neg && pos.atom !== neg.atom) {
      const ratio = pos.scale / neg.scale;
      let convLatex = "";

      if (ratio < 1) {
        const factor = (1 / ratio).toFixed(4).replace(/\.?0+$/, "");
        convLatex = `\\frac{1\\,\\cancel{\\text{${neg.atom}}}}{${factor}\\,\\cancel{\\text{${pos.atom}}}}`;
      } else {
        const factor = ratio.toFixed(4).replace(/\.?0+$/, "");
        convLatex = `\\frac{${factor}\\,\\cancel{\\text{${neg.atom}}}}{1\\,\\cancel{\\text{${pos.atom}}}}`;
      }

      selectedConversions.push({ latex: convLatex });
      pos.canceled = true;
      neg.canceled = true;
    }
  });

  // PASS 4: Target Unit Reconciliation
  const netExprDims = {};
  let netExprScale = exprAnalysis.factor;

  atomList.filter(a => !a.canceled).forEach(a => {
    netExprDims[a.dim] = (netExprDims[a.dim] || 0) + a.power;
    netExprScale *= Math.pow(a.scale, a.power);
  });

  if (isDimEqual(netExprDims, targetBag.dimMap)) {
    const scaleRatio = targetBag.scale / netExprScale;

    if (Math.abs(scaleRatio - 1.0) > 1e-4) {
      const uncanceled = atomList.filter(a => !a.canceled && !a.preserved);

      uncanceled.forEach(a => {
        for (const [tAtom, tPower] of Object.entries(targetBag.atoms)) {
          const tBase = ATOMIC_BASE_UNITS[tAtom];

          if (tBase && tBase.dim === a.dim && Math.abs(tPower - a.power) < 1e-4 && a.atom !== tAtom) {
            let convLatex = "";
            if (a.power < 0) {
              const ratio = tBase.scale / a.scale;
              convLatex = ratio > 1
                ? `\\frac{${ratio.toFixed(4).replace(/\.?0+$/, "")}\\,\\cancel{\\text{${a.atom}}}}{1\\text{ ${tAtom}}}`
                : `\\frac{1\\,\\cancel{\\text{${a.atom}}}}{${(1 / ratio).toFixed(4).replace(/\.?0+$/, "")}\\text{ ${tAtom}}}`;
            } else {
              const ratio = a.scale / tBase.scale;
              convLatex = ratio > 1
                ? `\\frac{${ratio.toFixed(4).replace(/\.?0+$/, "")}\\text{ ${tAtom}}}{1\\,\\cancel{\\text{${a.atom}}}}`
                : `\\frac{1\\text{ ${tAtom}}}{${(1 / ratio).toFixed(4).replace(/\.?0+$/, "")}\\,\\cancel{\\text{${a.atom}}}}`;
            }

            selectedConversions.push({ latex: convLatex });
            a.canceled = true;
          }
        }
      });
    }
  }

  // BUILD TOKEN UNIT MARKUP DIRECTLY FROM ATOMS
  const tokenMarkup = {};
  const tokenGroups = {};

  atomList.forEach(a => {
    if (!tokenGroups[a.token]) tokenGroups[a.token] = [];
    tokenGroups[a.token].push(a);
  });

  for (const [tok, atoms] of Object.entries(tokenGroups)) {
    const uName = atoms[0]?.unitName;
    const compound = COMPOUND_UNITS[uName];

    if (!compound) {
      const a = atoms[0];
      tokenMarkup[tok] = a.canceled ? `\\cancel{${a.tex}}` : a.tex;
      continue;
    }

    const numAtoms = atoms.filter(a => a.power > 0);
    const denAtoms = atoms.filter(a => a.power < 0);

    const formatAtom = a => a.canceled ? `\\cancel{${a.tex}}` : a.tex;

    const numStr = numAtoms.map(formatAtom).join("\\cdot");
    const denStr = denAtoms.map(formatAtom).join("\\cdot");
    const prefix = compound.factor && compound.factor !== 1 ? `${compound.factor}\\,` : "";

    if (denAtoms.length > 0) {
      tokenMarkup[tok] = `\\frac{${prefix}${numStr || "1"}}{${denStr}}`;
    } else {
      tokenMarkup[tok] = `${prefix}${numStr}`;
    }
  }

  return {
    tokenMarkup,
    conversionFactors: selectedConversions,
    conversionFactorTex: selectedConversions.map(cf => ` \\cdot ${cf.latex}`).join(""),
    preConversions
  };
}
