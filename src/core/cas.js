/**
 * src/core/cas.js
 * Universal Computer Algebra System (CAS) with Semantic & Physical Unit Algebra.
 * Features elementary algebraic inversion, requiredUnits contract checks, and atomic unit conversion helpers.
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
      return {
        isolatedRhs: `${rawLhs.trim()} * ${denStr}`,
        success: true
      };
    }

    if (targetInDen && ast.right.type === "id") {
      const numStr = astToExprStr(ast.left);
      return {
        isolatedRhs: `(${numStr}) / (${rawLhs.trim()})`,
        success: true
      };
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
      return {
        isolatedRhs: `(${rawLhs.trim()}) / (${otherStr})`,
        success: true
      };
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

  // 3. Addition: LHS = A + B
  if (ast.type === "binary" && ast.op === "+") {
    if (ast.left.type === "id" && resolveCanonicalKey(ast.left.name, varsDb) === targetCanon) {
      return { isolatedRhs: `(${rawLhs.trim()}) - (${astToExprStr(ast.right)})`, success: true };
    }
    if (ast.right.type === "id" && resolveCanonicalKey(ast.right.name, varsDb) === targetCanon) {
      return { isolatedRhs: `(${rawLhs.trim()}) - (${astToExprStr(ast.left)})`, success: true };
    }
  }

  // 4. Subtraction: LHS = A - B
  if (ast.type === "binary" && ast.op === "-") {
    if (ast.left.type === "id" && resolveCanonicalKey(ast.left.name, varsDb) === targetCanon) {
      return { isolatedRhs: `(${rawLhs.trim()}) + (${astToExprStr(ast.right)})`, success: true };
    }
    if (ast.right.type === "id" && resolveCanonicalKey(ast.right.name, varsDb) === targetCanon) {
      return { isolatedRhs: `(${astToExprStr(ast.left)}) - (${rawLhs.trim()})`, success: true };
    }
  }

  // 5. Square Root: LHS = sqrt(A)
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
// 4. PHYSICAL & THERMODYNAMIC UNIT ALGEBRA
// ========================================================

export const UNIT_ALGEBRA_DB = Object.freeze({
  "teeth":    { sym: "su_teeth", dim: "entity", tex: "\\text{teeth}" },
  "rad":      { sym: "su_rad",   dim: "angular", tex: "\\text{rad}" },
  "rev":      { sym: "su_rev",   dim: "angular", tex: "\\text{rev}" },
  "deg":      { sym: "su_deg",   dim: "angular", tex: "°" },
  "°":        { sym: "su_deg",   dim: "angular", tex: "°" },

  "mm":       { sym: "u_mm",     dim: "length",  base: "length", tex: "\\text{mm}" },
  "cm":       { sym: "u_cm",     dim: "length",  base: "length", tex: "\\text{cm}" },
  "m":        { sym: "u_m",      dim: "length",  base: "length", tex: "\\text{m}" },
  "in":       { sym: "u_in",     dim: "length",  base: "length", tex: "\\text{in}" },
  "ft":       { sym: "u_ft",     dim: "length",  base: "length", tex: "\\text{ft}" },

  "s":        { sym: "u_s",      dim: "time",    base: "time",   tex: "\\text{s}" },
  "min":      { sym: "u_min",    dim: "time",    base: "time",   tex: "\\text{min}" },
  "hr":       { sym: "u_hr",     dim: "time",    base: "time",   tex: "\\text{hr}" },
  "h":        { sym: "u_hr",     dim: "time",    base: "time",   tex: "\\text{h}" },

  "kg":       { sym: "u_kg",     dim: "mass",    base: "mass",   tex: "\\text{kg}" },
  "g":        { sym: "u_g",      dim: "mass",    base: "mass",   tex: "\\text{g}" },
  "lb_m":     { sym: "u_lbm",    dim: "mass",    base: "mass",   tex: "\\text{lb}_m" },

  "N":        { sym: "u_N",      dim: "force",   base: "force",  tex: "\\text{N}" },
  "kN":       { sym: "u_kN",     dim: "force",   base: "force",  tex: "\\text{kN}" },
  "lb":       { sym: "u_lb",     dim: "force",   base: "force",  tex: "\\text{lb}" },

  "rpm":      { sym: "(su_rev / u_min)", dim: "rot_speed", hasTime: "u_min", hasSemantic: "su_rev", tex: "\\frac{\\text{rev}}{\\text{min}}" },
  "rev/min":  { sym: "(su_rev / u_min)", dim: "rot_speed", hasTime: "u_min", hasSemantic: "su_rev", tex: "\\frac{\\text{rev}}{\\text{min}}" },
  "m/s":      { sym: "(u_m / u_s)", dim: "velocity", hasLength: "u_m", hasTime: "u_s", tex: "\\frac{\\text{m}}{\\text{s}}" },
  "ft/min":   { sym: "(u_ft / u_min)", dim: "velocity", hasLength: "u_ft", hasTime: "u_min", tex: "\\frac{\\text{ft}}{\\text{min}}" },
  "teeth/in": { sym: "(su_teeth / u_in)", dim: "pitch", hasLength: "u_in", hasSemantic: "su_teeth", tex: "\\frac{\\text{teeth}}{\\text{in}}" },

  "N-m":      { sym: "(u_N * u_m)", dim: "torque", hasForce: "u_N", hasLength: "u_m", tex: "\\text{N}\\cdot\\text{m}" },
  "kN-m":     { sym: "(u_kN * u_m)", dim: "torque", tex: "\\text{kN}\\cdot\\text{m}" },
  "lb-in":    { sym: "(u_lb * u_in)", dim: "torque", hasForce: "u_lb", hasLength: "u_in", tex: "\\text{lb}\\cdot\\text{in}" },
  "lb-ft":    { sym: "(u_lb * u_ft)", dim: "torque", hasForce: "u_lb", hasLength: "u_ft", tex: "\\text{lb}\\cdot\\text{ft}" },

  "W":        { sym: "u_W", dim: "power", tex: "\\text{W}" },
  "kW":       { sym: "u_kW", dim: "power", tex: "\\text{kW}" },
  "MW":       { sym: "u_MW", dim: "power", tex: "\\text{MW}" },
  "hp":       { sym: "u_hp", dim: "power", tex: "\\text{hp}" },

  "Pa":       { sym: "u_Pa", dim: "stress", tex: "\\text{Pa}" },
  "kPa":      { sym: "u_kPa", dim: "stress", tex: "\\text{kPa}" },
  "bar":      { sym: "u_bar", dim: "stress", tex: "\\text{bar}" },
  "MPa":      { sym: "u_MPa", dim: "stress", tex: "\\text{MPa}" },
  "psi":      { sym: "u_psi", dim: "stress", tex: "\\text{psi}" },

  "m^3":      { sym: "u_m3", dim: "volume", tex: "\\text{m}^3" },
  "L":        { sym: "u_L", dim: "volume", tex: "\\text{L}" },
  "m^3/s":    { sym: "(u_m3 / u_s)", dim: "vol_flow", tex: "\\frac{\\text{m}^3}{\\text{s}}" },
  "m^3/min":  { sym: "(u_m3 / u_min)", dim: "vol_flow", tex: "\\frac{\\text{m}^3}{\\text{min}}" },
  "L/s":      { sym: "(u_L / u_s)", dim: "vol_flow", tex: "\\frac{\\text{L}}{\\text{s}}" },

  "J":        { sym: "u_J", dim: "energy", tex: "\\text{J}" },
  "kJ":       { sym: "u_kJ", dim: "energy", tex: "\\text{kJ}" },
  "kJ/kg":    { sym: "(u_kJ / u_kg)", dim: "spec_energy", tex: "\\frac{\\text{kJ}}{\\text{kg}}" },
  "kJ/kg-K":  { sym: "u_cp", dim: "spec_heat", tex: "\\frac{\\text{kJ}}{\\text{kg}\\cdot\\text{K}}" },

  "kg/s":     { sym: "(u_kg / u_s)", dim: "mass_flow", tex: "\\frac{\\text{kg}}{\\text{s}}" },
  "kg/h":     { sym: "(u_kg / u_hr)", dim: "mass_flow", tex: "\\frac{\\text{kg}}{\\text{h}}" },
  "kg/kWh":   { sym: "u_sfc", dim: "sfc", tex: "\\frac{\\text{kg}}{\\text{kW}\\cdot\\text{h}}" },
  "g/kWh":    { sym: "u_gsfc", dim: "sfc", tex: "\\frac{\\text{g}}{\\text{kW}\\cdot\\text{h}}" },

  "K":        { sym: "u_K", dim: "temp", tex: "\\text{K}" },
  "deg C":    { sym: "u_degC", dim: "temp", tex: "^\\circ\\text{C}" },
  "%":        { sym: "1", dim: "dimensionless", tex: "\\%" },
  "dimless":  { sym: "1", dim: "dimensionless", tex: "" },
  "ratio":    { sym: "1", dim: "dimensionless", tex: "" }
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

export function solveUnitAlgebra(exprStr, S, targetVar, targetUnit, varsDb = {}, requiredUnits = null) {
  const tokens = exprStr.match(/[a-zA-Z][a-zA-Z0-9_]*/g) || [];
  const mathConstants = new Set(["pi", "sin", "cos", "tan", "sqrt", "abs", "atan", "acos", "asin", "log", "exp"]);
  const varTokens = Array.from(new Set(tokens.filter(t => !mathConstants.has(t))));

  const activeVarUnits = {};
  varTokens.forEach(tok => {
    const canonicalKey = resolveCanonicalKey(tok, varsDb);
    const rawUnit = S._u?.[canonicalKey] || S._u?.[tok] || varsDb[canonicalKey]?.unit || varsDb[tok]?.unit || "dimless";
    activeVarUnits[tok] = UNIT_ALGEBRA_DB[rawUnit] || { sym: rawUnit, dim: "custom", tex: `\\text{${rawUnit}}` };
  });

  const canceledTokens = new Set();
  const subTokenCancellations = {};
  const selectedConversions = [];
  const preConversions = [];

  // ========================================================
  // A. EMPIRICAL FORMULA HANDLING (requiredUnits Contract)
  // ========================================================
  if (requiredUnits && typeof requiredUnits === "object") {
    varTokens.forEach(tok => {
      const canonicalKey = resolveCanonicalKey(tok, varsDb);
      const reqU = requiredUnits[canonicalKey] || requiredUnits[tok];
      if (!reqU) return;

      const currentU = S._u?.[canonicalKey] || S._u?.[tok] || varsDb[canonicalKey]?.unit || varsDb[tok]?.unit || "";

      // Check for unit mismatch against the empirical contract
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

    // Suppress all global cross-variable conversions for empirical equations
    return {
      canceledTokens,
      subTokenCancellations,
      conversionFactors: [],
      conversionFactorTex: "",
      preConversions
    };
  }

  // ========================================================
  // B. STANDARD DIMENSIONALLY HOMOGENEOUS EQUATIONS
  // ========================================================
  const targetInfo = UNIT_ALGEBRA_DB[targetUnit] || { sym: targetUnit, dim: "custom", tex: targetUnit };
  const allActiveUnits = Object.values(activeVarUnits);

  const hasMin = allActiveUnits.some(u => u.hasTime === "u_min" || u.sym === "u_min");
  const hasMm = allActiveUnits.some(u => u.hasLength === "u_mm" || u.sym === "u_mm");
  const hasIn = allActiveUnits.some(u => u.hasLength === "u_in" || u.sym === "u_in");
  const hasFt = allActiveUnits.some(u => u.hasLength === "u_ft" || u.sym === "u_ft");
  const hasMeter = allActiveUnits.some(u => u.hasLength === "u_m" || u.sym === "u_m");

  if (hasFt && hasIn) {
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "ft" && c.to === "in");
    if (conv) {
      selectedConversions.push(conv);
      varTokens.filter(t => activeVarUnits[t].hasLength === "u_in" || activeVarUnits[t].sym === "u_in").forEach(t => canceledTokens.add(t));
      varTokens.filter(t => activeVarUnits[t].hasLength === "u_ft" || activeVarUnits[t].sym === "u_ft").forEach(t => canceledTokens.add(t));
    }
  }

  if (hasMeter && hasMm) {
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "m" && c.to === "mm");
    if (conv) {
      selectedConversions.push(conv);
      varTokens.filter(t => activeVarUnits[t].hasLength === "u_mm" || activeVarUnits[t].sym === "u_mm").forEach(t => canceledTokens.add(t));
      varTokens.filter(t => activeVarUnits[t].hasLength === "u_m" || activeVarUnits[t].sym === "u_m").forEach(t => canceledTokens.add(t));
    }
  }

  const targetNeedsSec = targetInfo.hasTime === "u_s" || targetUnit === "kW" || targetUnit === "W" || targetUnit === "N-m";
  const targetNeedsMeter = targetInfo.hasLength === "u_m" || targetUnit === "N-m" || targetUnit === "kW" || targetUnit === "W";
  const targetNeedsInch = targetInfo.hasLength === "u_in" || targetUnit === "teeth/in";
  const targetNeedsFt = targetInfo.hasLength === "u_ft" || targetUnit === "hp";

  if (hasMin && targetNeedsSec) {
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "min" && c.to === "s");
    if (conv && !selectedConversions.includes(conv)) {
      selectedConversions.push(conv);
      varTokens.filter(t => activeVarUnits[t].hasTime === "u_min").forEach(t => {
        subTokenCancellations[t] = { cancelMin: true };
      });
    }
  }

  if (hasMm && targetNeedsMeter) {
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "mm" && c.to === "m");
    if (conv && !selectedConversions.includes(conv)) {
      selectedConversions.push(conv);
      varTokens.filter(t => activeVarUnits[t].sym === "u_mm").forEach(t => canceledTokens.add(t));
    }
  } else if (hasIn && targetNeedsFt) {
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "in" && c.to === "ft");
    if (conv && !selectedConversions.includes(conv)) {
      selectedConversions.push(conv);
      varTokens.filter(t => activeVarUnits[t].sym === "u_in").forEach(t => canceledTokens.add(t));
    }
  }

  if (targetUnit === "kW" && (hasMin || hasMm || allActiveUnits.some(u => u.sym === "u_N" || u.dim === "torque"))) {
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "W" && c.to === "kW");
    if (conv && !selectedConversions.includes(conv)) selectedConversions.push(conv);
  } else if (targetUnit === "N-m" && allActiveUnits.some(u => u.sym === "u_kW")) {
    const convW = ATOMIC_CONVERSIONS.find(c => c.from === "kW" && c.to === "W");
    if (convW) selectedConversions.push(convW);
    varTokens.filter(t => activeVarUnits[t].sym === "u_kW").forEach(t => canceledTokens.add(t));
  } else if (targetUnit === "hp" && (hasIn || allActiveUnits.some(u => u.dim === "torque"))) {
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "ftlb_min" && c.to === "hp") ||
                 { latex: "\\frac{1\\text{ hp}}{33000\\,\\cancel{\\text{ft}\\cdot\\text{lb}/\\text{min}}}" };
    if (!selectedConversions.some(c => c.latex === conv.latex)) selectedConversions.push(conv);
  }

  const isTargetDimless = !targetUnit || targetUnit === "dimless" || targetUnit === "ratio" || targetUnit === "%";
  if (isTargetDimless) {
    varTokens.forEach(tok => canceledTokens.add(tok));
  }

  return {
    canceledTokens,
    subTokenCancellations,
    conversionFactors: selectedConversions,
    conversionFactorTex: selectedConversions.map(cf => ` \\cdot ${cf.latex}`).join(""),
    preConversions: []
  };
}
