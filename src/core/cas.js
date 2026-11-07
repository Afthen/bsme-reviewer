/**
 * src/core/cas.js
 * Universal Computer Algebra System (CAS) with True Dimensional Vector Analysis.
 * Supports expanded constituent unit definitions (psi -> lb/in^2, MPa -> N/mm^2, etc.).
 */

const RESERVED_CAS_WORDS = new Set(["E", "I"]);

export function toCasToken(v) {
  if (!v) return "";
  const clean = v.replace(/[^a-zA-Z0-9]/g, "");
  return RESERVED_CAS_WORDS.has(clean) ? `_${clean}_` : clean;
}

export function fromCasToken(v) {
  if (!v) return "";
  return v.replace(/^_([EI])_$/, "$1");
}

export function resolveCanonicalKey(token, varsDb = {}) {
  if (!token) return "";
  const clean = fromCasToken(token);
  if (varsDb[clean]) return clean;
  if (varsDb[token]) return token;

  const normToken = clean.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  for (const k of Object.keys(varsDb)) {
    const normK = k.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (normK === normToken) return k;
  }
  return clean;
}

export function sanitizeExpr(exprStr) {
  if (!exprStr) return "";
  let s = exprStr.replace(/([a-zA-Z]+)_(\w+)/g, "$1$2");
  s = s.replace(/\bE\b/g, "_E_").replace(/\bI\b/g, "_I_");
  return s;
}

// ========================================================
// 1. AST EXPRESSION PARSER & STRINGIFIER
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
    if ("+-*/^()=".includes(ch)) {
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

function getAstIdentifiers(node) {
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

function flattenMultiplication(node) {
  const factors = [];
  function collect(n) {
    if (!n) return;
    if (n.type === "binary" && n.op === "*") {
      collect(n.left);
      collect(n.right);
    } else {
      factors.push(n);
    }
  }
  collect(node);
  return factors;
}

// ========================================================
// 2. ELEMENTARY ALGEBRAIC ISOLATION
// ========================================================

function tryElementaryIsolate(rawLhs, rawRhs, targetVar, varsDb = {}) {
  const targetCanon = resolveCanonicalKey(targetVar, varsDb);
  const lhsCanon = resolveCanonicalKey(rawLhs.trim(), varsDb);

  if (lhsCanon === targetCanon) {
    return { isolatedRhs: rawRhs.trim(), success: true };
  }

  const ast = parseMathAST(rawRhs);
  if (!ast) return { success: false };

  // 1. Division: LHS = Num / Den
  if (ast.type === "binary" && ast.op === "/") {
    const numIds = getAstIdentifiers(ast.left);
    const denIds = getAstIdentifiers(ast.right);

    const targetInNum = numIds.some(id => resolveCanonicalKey(id, varsDb) === targetCanon);
    const targetInDen = denIds.some(id => resolveCanonicalKey(id, varsDb) === targetCanon);

    if (targetInNum && ast.left.type === "id") {
      const denStr = astToExprStr(ast.right);
      return { isolatedRhs: `${rawLhs.trim()} * ${denStr}`, success: true };
    }

    if (targetInDen && ast.right.type === "id") {
      const numStr = astToExprStr(ast.left);
      return { isolatedRhs: `(${numStr}) / (${rawLhs.trim()})`, success: true };
    }

    if (targetInDen && ast.right.type === "call") {
      const fn = ast.right.fn;
      const argId = ast.right.arg?.name;
      if (resolveCanonicalKey(argId, varsDb) === targetCanon) {
        const numStr = astToExprStr(ast.left);
        const ratio = `(${numStr}) / (${rawLhs.trim()})`;
        if (fn === "tan") return { isolatedRhs: `atan(${ratio})`, success: true };
        if (fn === "cos") return { isolatedRhs: `acos(${ratio})`, success: true };
        if (fn === "sin") return { isolatedRhs: `asin(${ratio})`, success: true };
      }
    }
  }

  // 2. Multiplication: LHS = A * B * C...
  if (ast.type === "binary" && ast.op === "*") {
    const factors = flattenMultiplication(ast);
    const targetIdx = factors.findIndex(f => f.type === "id" && resolveCanonicalKey(f.name, varsDb) === targetCanon);

    if (targetIdx !== -1) {
      const otherFactors = factors.filter((_, i) => i !== targetIdx);
      const otherStr = otherFactors.map(f => astToExprStr(f)).join(" * ");
      return { isolatedRhs: `(${rawLhs.trim()}) / (${otherStr})`, success: true };
    }

    const trigIdx = factors.findIndex(f => f.type === "call" && ["sin", "cos", "tan"].includes(f.fn) && f.arg?.type === "id" && resolveCanonicalKey(f.arg.name, varsDb) === targetCanon);
    if (trigIdx !== -1) {
      const trigNode = factors[trigIdx];
      const otherFactors = factors.filter((_, i) => i !== trigIdx);
      const otherStr = otherFactors.length > 0 ? otherFactors.map(f => astToExprStr(f)).join(" * ") : "1";
      const ratio = `(${rawLhs.trim()}) / (${otherStr})`;
      if (trigNode.fn === "tan") return { isolatedRhs: `atan(${ratio})`, success: true };
      if (trigNode.fn === "cos") return { isolatedRhs: `acos(${ratio})`, success: true };
      if (trigNode.fn === "sin") return { isolatedRhs: `asin(${ratio})`, success: true };
    }
  }

  // 3. Addition / Subtraction
  if (ast.type === "binary" && ast.op === "+") {
    if (ast.left.type === "id" && resolveCanonicalKey(ast.left.name, varsDb) === targetCanon) {
      return { isolatedRhs: `(${rawLhs.trim()}) - (${astToExprStr(ast.right)})`, success: true };
    }
    if (ast.right.type === "id" && resolveCanonicalKey(ast.right.name, varsDb) === targetCanon) {
      return { isolatedRhs: `(${rawLhs.trim()}) - (${astToExprStr(ast.left)})`, success: true };
    }
  }
  if (ast.type === "binary" && ast.op === "-") {
    if (ast.left.type === "id" && resolveCanonicalKey(ast.left.name, varsDb) === targetCanon) {
      return { isolatedRhs: `(${rawLhs.trim()}) + (${astToExprStr(ast.right)})`, success: true };
    }
    if (ast.right.type === "id" && resolveCanonicalKey(ast.right.name, varsDb) === targetCanon) {
      return { isolatedRhs: `(${astToExprStr(ast.left)}) - (${rawLhs.trim()})`, success: true };
    }
  }

  // 4. Square Root
  if (ast.type === "call" && ast.fn === "sqrt") {
    if (ast.arg?.type === "id" && resolveCanonicalKey(ast.arg.name, varsDb) === targetCanon) {
      return { isolatedRhs: `(${rawLhs.trim()})^2`, success: true };
    }
  }

  return { success: false };
}

// ========================================================
// 3. CAS ENGINE & LATEX FORMATTER
// ========================================================

export function casToTex(exprStr, varsDb = {}) {
  if (typeof nerdamer === "undefined" || !exprStr) return exprStr || "";
  try {
    let clean = exprStr;
    clean = clean.replace(/cos\((.*?)\)\^\(-1\)\*sin\(\1\)/g, "tan($1)");
    clean = clean.replace(/sin\((.*?)\)\*cos\(\1\)\^\(-1\)/g, "tan($1)");

    let tex = nerdamer(sanitizeExpr(clean)).toTeX();

    tex = tex.replace(/\bphi\b/g, "\\phi");
    tex = tex.replace(/\bphin\b/g, "\\phi_n");
    tex = tex.replace(/\bpsi\b/g, "\\psi");
    tex = tex.replace(/\beta\b/g, "\\eta");
    tex = tex.replace(/(?<![a-zA-Z\\])pi(?![a-zA-Z])/g, "\\pi");

    for (const [k, meta] of Object.entries(varsDb)) {
      if (meta.symbol) {
        const cleanK = k.replace(/[^a-zA-Z0-9]/g, "");
        const re = new RegExp(`\\b${cleanK}\\b`, "g");
        tex = tex.replace(re, meta.symbol);
      }
    }

    tex = tex.replace(/_E_/g, "E").replace(/_I_/g, "I");

    tex = tex.replace(/\\text\{atan\}\((.*?)\)/g, "\\tan^{-1}\\left($1\\right)");
    tex = tex.replace(/\\text\{acos\}\((.*?)\)/g, "\\cos^{-1}\\left($1\\right)");
    tex = tex.replace(/atan\((.*?)\)/g, "\\tan^{-1}\\left($1\\right)");
    tex = tex.replace(/acos\((.*?)\)/g, "\\cos^{-1}\\left($1\\right)");

    tex = tex.replace(/\\cdot/g, " ");
    tex = tex.replace(/\*/g, " ");
    tex = tex.replace(/(\d+)\s+([a-zA-Z_\\])/g, "$1$2");

    return tex;
  } catch {
    return (exprStr || "").replace(/\*/g, " ");
  }
}

export function simplifyExpression(exprStr) {
  if (typeof nerdamer === "undefined" || !exprStr) return exprStr;
  try {
    let clean = exprStr.replace(/cos\((.*?)\)\^\(-1\)\*sin\(\1\)/g, "tan($1)");
    clean = clean.replace(/sin\((.*?)\)\*cos\(\1\)\^\(-1\)/g, "tan($1)");
    const text = nerdamer(`simplify(${sanitizeExpr(clean)})`).text();
    return text.replace(/_E_/g, "E").replace(/_I_/g, "I");
  } catch {
    return exprStr;
  }
}

export function substituteExpression(exprStr, subsObj = {}) {
  if (typeof nerdamer === "undefined" || !exprStr) return exprStr;
  try {
    const cleanSubs = {};
    for (const [k, v] of Object.entries(subsObj)) {
      cleanSubs[toCasToken(k)] = sanitizeExpr(v);
    }
    const res = nerdamer(sanitizeExpr(exprStr), cleanSubs).text();
    return res.replace(/_E_/g, "E").replace(/_I_/g, "I");
  } catch {
    let result = exprStr;
    for (const [k, v] of Object.entries(subsObj)) {
      result = result.split(toCasToken(k)).join(`(${v})`);
    }
    return result;
  }
}

export function isolateVariable(eqStr, targetVar, varsDb = {}) {
  const parts = eqStr.split("=");
  const rawLhs = parts[0]?.trim() || "";
  const rawRhs = parts[1]?.trim() || "";

  const canonicalTarget = resolveCanonicalKey(targetVar, varsDb);
  const targetMeta = varsDb[canonicalTarget] || varsDb[targetVar] || {};
  const targetTex = targetMeta.symbol || targetVar;

  const elem = tryElementaryIsolate(rawLhs, rawRhs, targetVar, varsDb);
  if (elem.success) {
    const texRight = casToTex(elem.isolatedRhs, varsDb);
    return {
      targetVar,
      isolatedRhs: elem.isolatedRhs,
      texEquation: `${targetTex} = ${texRight}`
    };
  }

  const sanitizedLhs = sanitizeExpr(rawLhs);
  const sanitizedRhs = sanitizeExpr(rawRhs);
  const sanitizedEq = `${sanitizedLhs} = ${sanitizedRhs}`;
  const targetToken = toCasToken(targetVar);

  if (typeof nerdamer !== "undefined") {
    try {
      const solutions = nerdamer.solveEquations(sanitizedEq, targetToken);
      if (solutions && solutions.length > 0) {
        let solText = solutions[0];
        if (typeof solText.text === "function") solText = solText.text();
        solText = simplifyExpression(solText.toString());

        solText = solText.replace(/cos\((.*?)\)\^\(-1\)\*sin\(\1\)/g, "tan($1)");
        solText = solText.replace(/sin\((.*?)\)\*cos\(\1\)\^\(-1\)/g, "tan($1)");

        return {
          targetVar,
          isolatedRhs: solText,
          texEquation: `${targetTex} = ${casToTex(solText, varsDb)}`
        };
      }
    } catch (err) {
      console.warn(`CAS isolation fallback failed for ${targetVar} in ${eqStr}:`, err);
    }
  }

  return {
    targetVar,
    isolatedRhs: rawRhs,
    texEquation: `${targetTex} = ${casToTex(rawRhs, varsDb)}`
  };
}

// ========================================================
// 4. BASE-DIMENSION VECTOR ENGINE [M, L, T, Theta, C]
// ========================================================

function makeDim(M = 0, L = 0, T = 0, Th = 0, C = 0) {
  return { M, L, T, Th, C };
}

function addDim(a, b) {
  return {
    M: (a.M || 0) + (b.M || 0),
    L: (a.L || 0) + (b.L || 0),
    T: (a.T || 0) + (b.T || 0),
    Th: (a.Th || 0) + (b.Th || 0),
    C: (a.C || 0) + (b.C || 0)
  };
}

function subDim(a, b) {
  return {
    M: (a.M || 0) - (b.M || 0),
    L: (a.L || 0) - (b.L || 0),
    T: (a.T || 0) - (b.T || 0),
    Th: (a.Th || 0) - (b.Th || 0),
    C: (a.C || 0) - (b.C || 0)
  };
}

export function isDimEqual(a, b) {
  if (!a || !b) return false;
  return (
    (a.M || 0) === (b.M || 0) &&
    (a.L || 0) === (b.L || 0) &&
    (a.T || 0) === (b.T || 0) &&
    (a.Th || 0) === (b.Th || 0) &&
    (a.C || 0) === (b.C || 0)
  );
}

/**
 * Universal Dimensional Unit Registry with Expanded Physical Representations.
 * Scale factors are calibrated relative to SI Base: kg, m, s, K, count.
 */
export const UNIT_ALGEBRA_DB = Object.freeze({
  // Entities & Angular
  "teeth":    { dim: makeDim(0, 0, 0, 0, 1), scale: 1.0, baseType: "count", unitName: "teeth", tex: "\\text{teeth}", expandedTex: "\\cancel{\\text{teeth}}" },
  "rad":      { dim: makeDim(), scale: 1.0, baseType: "angular", unitName: "rad", tex: "\\text{rad}" },
  "rev":      { dim: makeDim(), scale: 1.0, baseType: "angular", unitName: "rev", tex: "\\text{rev}" },
  "deg":      { dim: makeDim(), scale: Math.PI / 180, baseType: "angular", unitName: "°", tex: "°" },
  "°":        { dim: makeDim(), scale: Math.PI / 180, baseType: "angular", unitName: "°", tex: "°" },

  // Length [L]
  "mm":       { dim: makeDim(0, 1, 0, 0, 0), scale: 0.001, baseType: "length", unitName: "mm", tex: "\\text{mm}" },
  "cm":       { dim: makeDim(0, 1, 0, 0, 0), scale: 0.01, baseType: "length", unitName: "cm", tex: "\\text{cm}" },
  "m":        { dim: makeDim(0, 1, 0, 0, 0), scale: 1.0, baseType: "length", unitName: "m", tex: "\\text{m}" },
  "in":       { dim: makeDim(0, 1, 0, 0, 0), scale: 0.0254, baseType: "length", unitName: "in", tex: "\\text{in}" },
  "ft":       { dim: makeDim(0, 1, 0, 0, 0), scale: 0.3048, baseType: "length", unitName: "ft", tex: "\\text{ft}" },

  // Time [T]
  "s":        { dim: makeDim(0, 0, 1, 0, 0), scale: 1.0, baseType: "time", unitName: "s", tex: "\\text{s}" },
  "min":      { dim: makeDim(0, 0, 1, 0, 0), scale: 60.0, baseType: "time", unitName: "min", tex: "\\text{min}" },
  "hr":       { dim: makeDim(0, 0, 1, 0, 0), scale: 3600.0, baseType: "time", unitName: "h", tex: "\\text{h}" },
  "h":        { dim: makeDim(0, 0, 1, 0, 0), scale: 3600.0, baseType: "time", unitName: "h", tex: "\\text{h}" },

  // Rotational frequency [T^-1]
  "rpm":      { dim: makeDim(0, 0, -1, 0, 0), scale: 1 / 60, baseType: "time", unitName: "min", tex: "\\frac{\\text{rev}}{\\text{min}}" },
  "rev/min":  { dim: makeDim(0, 0, -1, 0, 0), scale: 1 / 60, baseType: "time", unitName: "min", tex: "\\frac{\\text{rev}}{\\text{min}}" },

  // Mass [M]
  "kg":       { dim: makeDim(1, 0, 0, 0, 0), scale: 1.0, baseType: "mass", unitName: "kg", tex: "\\text{kg}" },
  "g":        { dim: makeDim(1, 0, 0, 0, 0), scale: 0.001, baseType: "mass", unitName: "g", tex: "\\text{g}" },
  "lb_m":     { dim: makeDim(1, 0, 0, 0, 0), scale: 0.45359237, baseType: "mass", unitName: "lb_m", tex: "\\text{lb}_m" },

  // Force [M L T^-2]
  "N":        { dim: makeDim(1, 1, -2, 0, 0), scale: 1.0, baseType: "force", unitName: "N", tex: "\\text{N}" },
  "kN":       { dim: makeDim(1, 1, -2, 0, 0), scale: 1000.0, baseType: "force", unitName: "kN", tex: "\\text{kN}" },
  "lb":       { dim: makeDim(1, 1, -2, 0, 0), scale: 4.4482216, baseType: "force", unitName: "lb", tex: "\\text{lb}" },

  // Velocity [L T^-1]
  "m/s":      { dim: makeDim(0, 1, -1, 0, 0), scale: 1.0, components: { length: "m", time: "s" }, tex: "\\frac{\\text{m}}{\\text{s}}" },
  "ft/min":   { dim: makeDim(0, 1, -1, 0, 0), scale: 0.3048 / 60, components: { length: "ft", time: "min" }, tex: "\\frac{\\text{ft}}{\\text{min}}" },

  // Pitch [C L^-1]
  "teeth/in": { dim: makeDim(0, -1, 0, 0, 1), scale: 1 / 0.0254, components: { count: "teeth", length: "in" }, tex: "\\frac{\\text{teeth}}{\\text{in}}", expandedTex: "\\frac{\\cancel{\\text{teeth}}}{\\text{in}}" },

  // Torque / Energy [M L^2 T^-2]
  "J":        { dim: makeDim(1, 2, -2, 0, 0), scale: 1.0, baseType: "energy", unitName: "J", tex: "\\text{J}", expandedTex: "\\text{N}\\cdot\\text{m}" },
  "kJ":       { dim: makeDim(1, 2, -2, 0, 0), scale: 1000.0, baseType: "energy", unitName: "kJ", tex: "\\text{kJ}", expandedTex: "1000\\,\\text{N}\\cdot\\text{m}" },
  "N-m":      { dim: makeDim(1, 2, -2, 0, 0), scale: 1.0, baseType: "energy", unitName: "N-m", tex: "\\text{N}\\cdot\\text{m}" },
  "kN-m":     { dim: makeDim(1, 2, -2, 0, 0), scale: 1000.0, baseType: "energy", unitName: "kN-m", tex: "\\text{kN}\\cdot\\text{m}" },
  "lb-in":    { dim: makeDim(1, 2, -2, 0, 0), scale: 4.4482216 * 0.0254, baseType: "energy", unitName: "lb-in", tex: "\\text{lb}\\cdot\\text{in}" },
  "lb-ft":    { dim: makeDim(1, 2, -2, 0, 0), scale: 4.4482216 * 0.3048, baseType: "energy", unitName: "lb-ft", tex: "\\text{lb}\\cdot\\text{ft}" },

  // Power [M L^2 T^-3]
  "W":        { dim: makeDim(1, 2, -3, 0, 0), scale: 1.0, baseType: "power", unitName: "W", tex: "\\text{W}", expandedTex: "\\frac{\\text{N}\\cdot\\text{m}}{\\text{s}}" },
  "kW":       { dim: makeDim(1, 2, -3, 0, 0), scale: 1000.0, baseType: "power", unitName: "kW", tex: "\\text{kW}", expandedTex: "\\frac{1000\\text{ N}\\cdot\\text{m}}{\\text{s}}" },
  "MW":       { dim: makeDim(1, 2, -3, 0, 0), scale: 1e6, baseType: "power", unitName: "MW", tex: "\\text{MW}" },
  "hp":       { dim: makeDim(1, 2, -3, 0, 0), scale: 745.69987, baseType: "power", unitName: "hp", tex: "\\text{hp}", expandedTex: "\\frac{33000\\text{ ft}\\cdot\\text{lb}}{\\text{min}}" },

  // Pressure & Stress [M L^-1 T^-2]
  "Pa":       { dim: makeDim(1, -1, -2, 0, 0), scale: 1.0, baseType: "pressure", unitName: "Pa", tex: "\\text{Pa}", expandedTex: "\\frac{\\text{N}}{\\text{m}^2}" },
  "kPa":      { dim: makeDim(1, -1, -2, 0, 0), scale: 1000.0, baseType: "pressure", unitName: "kPa", tex: "\\text{kPa}", expandedTex: "\\frac{\\text{kN}}{\\text{m}^2}" },
  "bar":      { dim: makeDim(1, -1, -2, 0, 0), scale: 100000.0, baseType: "pressure", unitName: "bar", tex: "\\text{bar}", expandedTex: "10^5\\,\\frac{\\text{N}}{\\text{m}^2}" },
  "MPa":      { dim: makeDim(1, -1, -2, 0, 0), scale: 1e6, baseType: "pressure", unitName: "MPa", tex: "\\text{MPa}", expandedTex: "\\frac{\\text{N}}{\\text{mm}^2}" },
  "psi":      { dim: makeDim(1, -1, -2, 0, 0), scale: 6894.757, baseType: "pressure", unitName: "psi", tex: "\\text{psi}", expandedTex: "\\frac{\\text{lb}}{\\text{in}^2}" },

  // Volume [L^3]
  "m^3":      { dim: makeDim(0, 3, 0, 0, 0), scale: 1.0, baseType: "volume", unitName: "m^3", tex: "\\text{m}^3" },
  "L":        { dim: makeDim(0, 3, 0, 0, 0), scale: 0.001, baseType: "volume", unitName: "L", tex: "\\text{L}" },

  // Specific Energy [L^2 T^-2]
  "kJ/kg":    { dim: makeDim(0, 2, -2, 0, 0), scale: 1000.0, tex: "\\frac{\\text{kJ}}{\\text{kg}}" },

  // Mass Flow [M T^-1]
  "kg/s":     { dim: makeDim(1, 0, -1, 0, 0), scale: 1.0, tex: "\\frac{\\text{kg}}{\\text{s}}" },
  "kg/h":     { dim: makeDim(1, 0, -1, 0, 0), scale: 1 / 3600, tex: "\\frac{\\text{kg}}{\\text{h}}" },

  // Temperature [Th]
  "K":        { dim: makeDim(0, 0, 0, 1, 0), scale: 1.0, baseType: "temp", unitName: "K", tex: "\\text{K}" },
  "deg C":    { dim: makeDim(0, 0, 0, 1, 0), scale: 1.0, baseType: "temp", unitName: "°C", tex: "^\\circ\\text{C}" },

  // Dimensionless
  "%":        { dim: makeDim(), scale: 0.01, tex: "\\%" },
  "dimless":  { dim: makeDim(), scale: 1.0, tex: "" },
  "ratio":    { dim: makeDim(), scale: 1.0, tex: "" }
});

export const ATOMIC_CONVERSIONS = Object.freeze([
  { from: "mm", to: "m",   factor: 1 / 1000, latex: "\\frac{1\\text{ m}}{1000\\,\\cancel{\\text{mm}}}" },
  { from: "m",  to: "mm",  factor: 1000,     latex: "\\frac{1000\\text{ mm}}{1\\,\\cancel{\\text{m}}}" },
  { from: "in", to: "ft",  factor: 1 / 12,   latex: "\\frac{1\\text{ ft}}{12\\,\\cancel{\\text{in}}}" },
  { from: "ft", to: "in",  factor: 12,       latex: "\\frac{12\\,\\cancel{\\text{in}}}{1\\,\\cancel{\\text{ft}}}" },
  { from: "mm", to: "in",  factor: 1 / 25.4, latex: "\\frac{1\\text{ in}}{25.4\\,\\cancel{\\text{mm}}}" },
  { from: "in", to: "mm",  factor: 25.4,     latex: "\\frac{25.4\\text{ mm}}{1\\,\\cancel{\\text{in}}}" },

  { from: "min", to: "s",   factor: 1 / 60,   latex: "\\frac{1\\,\\cancel{\\text{min}}}{60\\text{ s}}" },
  { from: "s",   to: "min", factor: 60,       latex: "\\frac{60\\,\\cancel{\\text{s}}}{1\\text{ min}}" },
  { from: "hr",  to: "s",   factor: 1 / 3600, latex: "\\frac{1\\,\\cancel{\\text{h}}}{3600\\text{ s}}" },

  { from: "W",   to: "kW",  factor: 1 / 1000, latex: "\\frac{1\\text{ kW}}{1000\\,\\cancel{\\text{W}}}" },
  { from: "kW",  to: "W",   factor: 1000,     latex: "\\frac{1000\\,\\cancel{\\text{W}}}{1\\,\\cancel{\\text{kW}}}" },
  { from: "kW",  to: "MW",  factor: 1 / 1000, latex: "\\frac{1\\text{ MW}}{1000\\,\\cancel{\\text{kW}}}" },
  { from: "hp",  to: "ftlb_min", factor: 33000, latex: "\\frac{33000\\,\\cancel{\\text{ft}\\cdot\\text{lb}/\\text{min}}}{1\\,\\cancel{\\text{hp}}}" },

  { from: "kPa", to: "MPa", factor: 1 / 1000, latex: "\\frac{1\\text{ MPa}}{1000\\,\\cancel{\\text{kPa}}}" },
  { from: "bar", to: "kPa", factor: 100,      latex: "\\frac{100\\text{ kPa}}{1\\,\\cancel{\\text{bar}}}" },
  { from: "L",   to: "m^3", factor: 1 / 1000, latex: "\\frac{1\\text{ m}^3}{1000\\,\\cancel{\\text{L}}}" }
]);

export function findConversion(fromU, toU) {
  if (fromU === toU) return null;
  const direct = ATOMIC_CONVERSIONS.find(c => c.from === fromU && c.to === toU);
  if (direct) return direct;

  const inv = ATOMIC_CONVERSIONS.find(c => c.from === toU && c.to === fromU);
  if (inv) {
    return {
      from: fromU,
      to: toU,
      factor: 1 / inv.factor,
      latex: `\\frac{1\\text{ ${toU}}}{${inv.factor}\\,\\cancel{\\text{${fromU}}}}`
    };
  }
  return null;
}

function evalExprUnitAST(node, S, varsDb) {
  if (!node) return { dim: makeDim(), scale: 1.0, components: [] };

  if (node.type === "num") {
    return { dim: makeDim(), scale: 1.0, components: [] };
  }

  if (node.type === "id") {
    const canonicalKey = resolveCanonicalKey(node.name, varsDb);
    const uName = S._u?.[canonicalKey] || S._u?.[node.name] || varsDb[canonicalKey]?.unit || varsDb[node.name]?.unit || "dimless";
    const info = UNIT_ALGEBRA_DB[uName] || { dim: makeDim(), scale: 1.0, tex: uName };

    const comps = [];
    if (info.components) {
      for (const [baseType, u] of Object.entries(info.components)) {
        comps.push({ token: node.name, canonicalKey, baseType, unit: u, power: 1 });
      }
    } else if (info.baseType) {
      comps.push({ token: node.name, canonicalKey, baseType: info.baseType, unit: info.unitName || uName, power: 1 });
    }

    return {
      dim: info.dim,
      scale: info.scale,
      components: comps
    };
  }

  if (node.type === "group") {
    return evalExprUnitAST(node.expr, S, varsDb);
  }

  if (node.type === "call") {
    if (["sin", "cos", "tan", "atan", "acos", "asin"].includes(node.fn)) {
      return { dim: makeDim(), scale: 1.0, components: [] };
    }
    if (node.fn === "sqrt") {
      const inner = evalExprUnitAST(node.arg, S, varsDb);
      const halfDim = {
        M: inner.dim.M / 2, L: inner.dim.L / 2, T: inner.dim.T / 2, Th: inner.dim.Th / 2, C: inner.dim.C / 2
      };
      return {
        dim: halfDim,
        scale: Math.sqrt(inner.scale),
        components: inner.components.map(c => ({ ...c, power: c.power / 2 }))
      };
    }
    return evalExprUnitAST(node.arg, S, varsDb);
  }

  if (node.type === "binary") {
    const left = evalExprUnitAST(node.left, S, varsDb);
    const right = evalExprUnitAST(node.right, S, varsDb);

    if (node.op === "*") {
      return {
        dim: addDim(left.dim, right.dim),
        scale: left.scale * right.scale,
        components: [...left.components, ...right.components]
      };
    }

    if (node.op === "/") {
      const invRightComps = right.components.map(c => ({ ...c, power: -c.power }));
      return {
        dim: subDim(left.dim, right.dim),
        scale: left.scale / right.scale,
        components: [...left.components, ...invRightComps]
      };
    }

    if (node.op === "+" || node.op === "-") {
      return left;
    }
  }

  return { dim: makeDim(), scale: 1.0, components: [] };
}

export function solveUnitAlgebra(exprStr, S, targetVar, targetUnit, varsDb = {}, requiredUnits = null) {
  const ast = parseMathAST(exprStr);
  const canceledTokens = new Set();
  const subTokenCancellations = {};
  const selectedConversions = [];
  const preConversions = [];

  // ========================================================
  // A. EMPIRICAL EQUATIONS (Option B Pre-Conditioning Contract)
  // ========================================================
  if (requiredUnits && typeof requiredUnits === "object") {
    const tokens = exprStr.match(/[a-zA-Z][a-zA-Z0-9_]*/g) || [];
    const mathConstants = new Set(["pi", "sin", "cos", "tan", "sqrt", "abs", "atan", "acos", "asin"]);
    const varTokens = Array.from(new Set(tokens.filter(t => !mathConstants.has(t))));

    varTokens.forEach(tok => {
      const canonicalKey = resolveCanonicalKey(tok, varsDb);
      const reqU = requiredUnits[canonicalKey] || requiredUnits[tok];
      if (!reqU) return;

      const currentU = S._u?.[canonicalKey] || S._u?.[tok] || varsDb[canonicalKey]?.unit || varsDb[tok]?.unit || "";

      if (currentU && reqU && currentU !== reqU && currentU !== "deg" && reqU !== "°") {
        const conv = findConversion(currentU, reqU);
        if (conv) {
          const rawVal = S[canonicalKey] !== undefined ? S[canonicalKey] : S[tok];
          const convertedVal = rawVal * conv.factor;
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
      canceledTokens,
      subTokenCancellations,
      conversionFactors: [],
      conversionFactorTex: "",
      preConversions
    };
  }

  // ========================================================
  // B. DIMENSIONALLY HOMOGENEOUS AST ANALYSIS
  // ========================================================
  const exprAnalysis = evalExprUnitAST(ast, S, varsDb);
  const targetInfo = UNIT_ALGEBRA_DB[targetUnit] || { dim: makeDim(), scale: 1.0, tex: targetUnit };

  if (isDimEqual(exprAnalysis.dim, targetInfo.dim)) {
    const ratio = targetInfo.scale / exprAnalysis.scale;

    if (Math.abs(ratio - 1.0) > 1e-4) {
      exprAnalysis.components.forEach(comp => {
        if (comp.baseType === "length") {
          let targetLengthU = targetInfo.components?.length;
          if (!targetLengthU && targetInfo.baseType === "length") targetLengthU = targetInfo.unitName;

          if (targetLengthU && comp.unit !== targetLengthU) {
            let conv = null;
            if (comp.power < 0) {
              if (comp.unit === "mm" && targetLengthU === "in") {
                conv = { latex: "\\frac{25.4\\,\\cancel{\\text{mm}}}{1\\text{ in}}" };
              } else if (comp.unit === "in" && targetLengthU === "mm") {
                conv = { latex: "\\frac{1\\text{ in}}{25.4\\,\\cancel{\\text{mm}}}" };
              } else if (comp.unit === "m" && targetLengthU === "mm") {
                conv = { latex: "\\frac{1\\,\\cancel{\\text{m}}}{1000\\text{ mm}}" };
              }
            } else {
              if (comp.unit === "mm" && targetLengthU === "m") {
                conv = { latex: "\\frac{1\\text{ m}}{1000\\,\\cancel{\\text{mm}}}" };
              } else if (comp.unit === "in" && targetLengthU === "ft") {
                conv = { latex: "\\frac{1\\text{ ft}}{12\\,\\cancel{\\text{in}}}" };
              } else if (comp.unit === "in" && targetLengthU === "mm") {
                conv = { latex: "\\frac{25.4\\text{ mm}}{1\\,\\cancel{\\text{in}}}" };
              }
            }

            if (conv) {
              selectedConversions.push(conv);
              canceledTokens.add(comp.token);
            }
          }
        }

        if (comp.baseType === "time") {
          let targetTimeU = targetInfo.components?.time;
          if (!targetTimeU && targetInfo.baseType === "time") targetTimeU = targetInfo.unitName;

          if (targetTimeU && comp.unit !== targetTimeU) {
            if (comp.unit === "min" && targetTimeU === "s") {
              selectedConversions.push({ latex: "\\frac{1\\,\\cancel{\\text{min}}}{60\\text{ s}}" });
              subTokenCancellations[comp.token] = { cancelMin: true };
            }
          }
        }
      });

      if (targetUnit === "kW" && Math.abs(ratio - 0.001) < 1e-5) {
        selectedConversions.push({ latex: "\\frac{1\\text{ kW}}{1000\\,\\cancel{\\text{W}}}" });
      } else if (targetUnit === "hp" && exprAnalysis.scale < 10) {
        selectedConversions.push({ latex: "\\frac{1\\text{ hp}}{33000\\,\\cancel{\\text{ft}\\cdot\\text{lb}/\\text{min}}}" });
      }
    }
  }

  return {
    canceledTokens,
    subTokenCancellations,
    conversionFactors: selectedConversions,
    conversionFactorTex: selectedConversions.map(cf => ` \\cdot ${cf.latex}`).join(""),
    preConversions
  };
}
