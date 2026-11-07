/**
 * src/core/cas.js
 * Universal Computer Algebra System (CAS) with Semantic & Physical Unit Algebra.
 * Decoupled from topic-specific symbols; handles reserved words (E, I) safely.
 */

// Nerdamer reserved identifiers in engineering contexts
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

export function sanitizeExpr(exprStr) {
  if (!exprStr) return "";
  let s = exprStr.replace(/([a-zA-Z]+)_(\w+)/g, "$1$2");
  s = s.replace(/\bE\b/g, "_E_").replace(/\bI\b/g, "_I_");
  return s;
}

/**
 * Converts CAS expressions to KaTeX using dynamic symbol lookups from varsDb.
 */
export function casToTex(exprStr, varsDb = {}) {
  if (typeof nerdamer === "undefined" || !exprStr) return exprStr || "";
  try {
    let tex = nerdamer(sanitizeExpr(exprStr)).toTeX();

    // Universal Greek & math replacements
    tex = tex.replace(/\bphi\b/g, "\\phi");
    tex = tex.replace(/\bphin\b/g, "\\phi_n");
    tex = tex.replace(/\bpsi\b/g, "\\psi");
    tex = tex.replace(/\beta\b/g, "\\eta");
    tex = tex.replace(/(?<![a-zA-Z\\])pi(?![a-zA-Z])/g, "\\pi");

    // Dynamic schema replacement from varsDb
    for (const [k, meta] of Object.entries(varsDb)) {
      if (meta.symbol) {
        const cleanK = k.replace(/[^a-zA-Z0-9]/g, "");
        const re = new RegExp(`\\b${cleanK}\\b`, "g");
        tex = tex.replace(re, meta.symbol);
      }
    }

    // Clean up reserved word tokens
    tex = tex.replace(/_E_/g, "E").replace(/_I_/g, "I");

    // Inverse trig formatting
    tex = tex.replace(/\\text\{atan\}\((.*?)\)/g, "\\tan^{-1}\\left($1\\right)");
    tex = tex.replace(/\\text\{acos\}\((.*?)\)/g, "\\cos^{-1}\\left($1\\right)");
    tex = tex.replace(/atan\((.*?)\)/g, "\\tan^{-1}\\left($1\\right)");
    tex = tex.replace(/acos\((.*?)\)/g, "\\cos^{-1}\\left($1\\right)");

    // Typography: spacing around operators
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
    const text = nerdamer(`simplify(${sanitizeExpr(exprStr)})`).text();
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

  const targetMeta = varsDb[targetVar] || {};
  const targetTex = targetMeta.symbol || targetVar;

  // Transcendental angle isolation helpers
  if (targetVar === "phi" || targetVar === "psi" || targetVar === "phi_n") {
    if (rawRhs.includes(`tan(${targetVar})`)) {
      const coeff = rawRhs.replace(new RegExp(`(\\*|\\s)?tan\\(${targetVar}\\)`, "g"), "").trim() || "1";
      return {
        targetVar,
        isolatedRhs: `atan((${rawLhs}) / (${coeff}))`,
        texEquation: `${targetTex} = \\tan^{-1}\\left(\\frac{${casToTex(rawLhs, varsDb)}}{${casToTex(coeff, varsDb)}}\\right)`
      };
    }
    if (rawRhs.includes(`cos(${targetVar})`)) {
      const coeff = rawRhs.replace(new RegExp(`(\\*|\\s)?cos\\(${targetVar}\\)`, "g"), "").trim() || "1";
      return {
        targetVar,
        isolatedRhs: `acos((${rawLhs}) / (${coeff}))`,
        texEquation: `${targetTex} = \\cos^{-1}\\left(\\frac{${casToTex(rawLhs, varsDb)}}{${casToTex(coeff, varsDb)}}\\right)`
      };
    }
  }

  const sanitizedLhs = sanitizeExpr(rawLhs);
  const sanitizedRhs = sanitizeExpr(rawRhs);
  const sanitizedEq = `${sanitizedLhs} = ${sanitizedRhs}`;
  const targetToken = toCasToken(targetVar);

  if (toCasToken(rawLhs) === targetToken) {
    const cleanRhs = simplifyExpression(rawRhs);
    return {
      targetVar,
      isolatedRhs: cleanRhs,
      texEquation: `${targetTex} = ${casToTex(cleanRhs, varsDb)}`
    };
  }

  if (typeof nerdamer !== "undefined") {
    try {
      const solutions = nerdamer.solveEquations(sanitizedEq, targetToken);
      if (solutions && solutions.length > 0) {
        let solText = solutions[0];
        if (typeof solText.text === "function") solText = solText.text();
        solText = simplifyExpression(solText.toString());

        return {
          targetVar,
          isolatedRhs: solText,
          texEquation: `${targetTex} = ${casToTex(solText, varsDb)}`
        };
      }
    } catch (err) {
      console.warn(`CAS isolation failed for ${targetVar} in ${eqStr}:`, err);
    }
  }

  return {
    targetVar,
    isolatedRhs: rawRhs,
    texEquation: `${targetTex} = ${casToTex(rawRhs, varsDb)}`
  };
}

// ========================================================
// 5. EXPANDED PHYSICAL & THERMODYNAMIC UNIT ALGEBRA
// ========================================================

export const UNIT_ALGEBRA_DB = Object.freeze({
  // Discrete / Angular
  "teeth":    { sym: "su_teeth", dim: "entity", tex: "\\text{teeth}" },
  "rad":      { sym: "su_rad",   dim: "angular", tex: "\\text{rad}" },
  "rev":      { sym: "su_rev",   dim: "angular", tex: "\\text{rev}" },
  "deg":      { sym: "su_deg",   dim: "angular", tex: "^\\circ" },
  "°":        { sym: "su_deg",   dim: "angular", tex: "^\\circ" },

  // Length
  "mm":       { sym: "u_mm",     dim: "length",  base: "length", tex: "\\text{mm}" },
  "cm":       { sym: "u_cm",     dim: "length",  base: "length", tex: "\\text{cm}" },
  "m":        { sym: "u_m",      dim: "length",  base: "length", tex: "\\text{m}" },
  "in":       { sym: "u_in",     dim: "length",  base: "length", tex: "\\text{in}" },
  "ft":       { sym: "u_ft",     dim: "length",  base: "length", tex: "\\text{ft}" },

  // Time
  "s":        { sym: "u_s",      dim: "time",    base: "time",   tex: "\\text{s}" },
  "min":      { sym: "u_min",    dim: "time",    base: "time",   tex: "\\text{min}" },
  "hr":       { sym: "u_hr",     dim: "time",    base: "time",   tex: "\\text{hr}" },
  "h":        { sym: "u_hr",     dim: "time",    base: "time",   tex: "\\text{h}" },

  // Mass
  "kg":       { sym: "u_kg",     dim: "mass",    base: "mass",   tex: "\\text{kg}" },
  "g":        { sym: "u_g",      dim: "mass",    base: "mass",   tex: "\\text{g}" },
  "lb_m":     { sym: "u_lbm",    dim: "mass",    base: "mass",   tex: "\\text{lb}_m" },

  // Force
  "N":        { sym: "u_N",      dim: "force",   base: "force",  tex: "\\text{N}" },
  "kN":       { sym: "u_kN",     dim: "force",   base: "force",  tex: "\\text{kN}" },
  "lb":       { sym: "u_lb",     dim: "force",   base: "force",  tex: "\\text{lb}" },

  // Velocity & Frequency
  "rpm":      { sym: "(su_rev / u_min)", dim: "rot_speed", hasTime: "u_min", hasSemantic: "su_rev", tex: "\\frac{\\text{rev}}{\\text{min}}" },
  "rev/min":  { sym: "(su_rev / u_min)", dim: "rot_speed", hasTime: "u_min", hasSemantic: "su_rev", tex: "\\frac{\\text{rev}}{\\text{min}}" },
  "m/s":      { sym: "(u_m / u_s)", dim: "velocity", hasLength: "u_m", hasTime: "u_s", tex: "\\frac{\\text{m}}{\\text{s}}" },
  "ft/min":   { sym: "(u_ft / u_min)", dim: "velocity", hasLength: "u_ft", hasTime: "u_min", tex: "\\frac{\\text{ft}}{\\text{min}}" },
  "teeth/in": { sym: "(su_teeth / u_in)", dim: "pitch", hasLength: "u_in", hasSemantic: "su_teeth", tex: "\\frac{\\text{teeth}}{\\text{in}}" },

  // Torque
  "N-m":      { sym: "(u_N * u_m)", dim: "torque", hasForce: "u_N", hasLength: "u_m", tex: "\\text{N}\\cdot\\text{m}" },
  "kN-m":     { sym: "(u_kN * u_m)", dim: "torque", tex: "\\text{kN}\\cdot\\text{m}" },
  "lb-in":    { sym: "(u_lb * u_in)", dim: "torque", hasForce: "u_lb", hasLength: "u_in", tex: "\\text{lb}\\cdot\\text{in}" },
  "lb-ft":    { sym: "(u_lb * u_ft)", dim: "torque", hasForce: "u_lb", hasLength: "u_ft", tex: "\\text{lb}\\cdot\\text{ft}" },

  // Power
  "W":        { sym: "u_W", dim: "power", tex: "\\text{W}" },
  "kW":       { sym: "u_kW", dim: "power", tex: "\\text{kW}" },
  "MW":       { sym: "u_MW", dim: "power", tex: "\\text{MW}" },
  "hp":       { sym: "u_hp", dim: "power", tex: "\\text{hp}" },

  // Pressure & Stress
  "Pa":       { sym: "u_Pa", dim: "stress", tex: "\\text{Pa}" },
  "kPa":      { sym: "u_kPa", dim: "stress", tex: "\\text{kPa}" },
  "bar":      { sym: "u_bar", dim: "stress", tex: "\\text{bar}" },
  "MPa":      { sym: "u_MPa", dim: "stress", tex: "\\text{MPa}" },
  "psi":      { sym: "u_psi", dim: "stress", tex: "\\text{psi}" },

  // Volume & Volume Flow
  "m^3":      { sym: "u_m3", dim: "volume", tex: "\\text{m}^3" },
  "L":        { sym: "u_L", dim: "volume", tex: "\\text{L}" },
  "m^3/s":    { sym: "(u_m3 / u_s)", dim: "vol_flow", tex: "\\frac{\\text{m}^3}{\\text{s}}" },
  "m^3/min":  { sym: "(u_m3 / u_min)", dim: "vol_flow", tex: "\\frac{\\text{m}^3}{\\text{min}}" },
  "L/s":      { sym: "(u_L / u_s)", dim: "vol_flow", tex: "\\frac{\\text{L}}{\\text{s}}" },

  // Energy & Specific Energy
  "J":        { sym: "u_J", dim: "energy", tex: "\\text{J}" },
  "kJ":       { sym: "u_kJ", dim: "energy", tex: "\\text{kJ}" },
  "kJ/kg":    { sym: "(u_kJ / u_kg)", dim: "spec_energy", tex: "\\frac{\\text{kJ}}{\\text{kg}}" },
  "kJ/kg-K":  { sym: "u_cp", dim: "spec_heat", tex: "\\frac{\\text{kJ}}{\\text{kg}\\cdot\\text{K}}" },

  // Mass Flow & Specific Consumption
  "kg/s":     { sym: "(u_kg / u_s)", dim: "mass_flow", tex: "\\frac{\\text{kg}}{\\text{s}}" },
  "kg/h":     { sym: "(u_kg / u_hr)", dim: "mass_flow", tex: "\\frac{\\text{kg}}{\\text{h}}" },
  "kg/kWh":   { sym: "u_sfc", dim: "sfc", tex: "\\frac{\\text{kg}}{\\text{kW}\\cdot\\text{h}}" },
  "g/kWh":    { sym: "u_gsfc", dim: "sfc", tex: "\\frac{\\text{g}}{\\text{kW}\\cdot\\text{h}}" },

  // Temperature & Dimensionless
  "K":        { sym: "u_K", dim: "temp", tex: "\\text{K}" },
  "deg C":    { sym: "u_degC", dim: "temp", tex: "^\\circ\\text{C}" },
  "%":        { sym: "1", dim: "dimensionless", tex: "\\%" },
  "dimless":  { sym: "1", dim: "dimensionless", tex: "" },
  "ratio":    { sym: "1", dim: "dimensionless", tex: "" }
});

export const ATOMIC_CONVERSIONS = Object.freeze([
  { from: "u_mm", to: "u_m",  factor: 1 / 1000, latex: "\\frac{1\\text{ m}}{1000\\,\\cancel{\\text{mm}}}" },
  { from: "u_m",  to: "u_mm", factor: 1000,     latex: "\\frac{1000\\text{ mm}}{1\\,\\cancel{\\text{m}}}" },
  { from: "u_in", to: "u_ft", factor: 1 / 12,   latex: "\\frac{1\\text{ ft}}{12\\,\\cancel{\\text{in}}}" },
  { from: "u_ft", to: "u_in", factor: 12,       latex: "\\frac{12\\,\\cancel{\\text{in}}}{1\\,\\cancel{\\text{ft}}}" },
  { from: "u_mm", to: "u_in", factor: 1 / 25.4, latex: "\\frac{1\\text{ in}}{25.4\\,\\cancel{\\text{mm}}}" },
  { from: "u_in", to: "u_mm", factor: 25.4,     latex: "\\frac{25.4\\text{ mm}}{1\\,\\cancel{\\text{in}}}" },

  { from: "u_min", to: "u_s", factor: 1 / 60,   latex: "\\frac{1\\,\\cancel{\\text{min}}}{60\\text{ s}}" },
  { from: "u_s",   to: "u_min", factor: 60,     latex: "\\frac{60\\,\\cancel{\\text{s}}}{1\\text{ min}}" },
  { from: "u_hr",  to: "u_s", factor: 1 / 3600, latex: "\\frac{1\\,\\cancel{\\text{h}}}{3600\\text{ s}}" },

  { from: "u_W",   to: "u_kW", factor: 1 / 1000, latex: "\\frac{1\\text{ kW}}{1000\\,\\cancel{\\text{W}}}" },
  { from: "u_kW",  to: "u_W",  factor: 1000,     latex: "\\frac{1000\\,\\cancel{\\text{W}}}{1\\,\\cancel{\\text{kW}}}" },
  { from: "u_kW",  to: "u_MW", factor: 1 / 1000, latex: "\\frac{1\\text{ MW}}{1000\\,\\cancel{\\text{kW}}}" },
  { from: "u_hp",  to: "u_ftlb_min", factor: 33000, latex: "\\frac{33000\\,\\cancel{\\text{ft}\\cdot\\text{lb}/\\text{min}}}{1\\,\\cancel{\\text{hp}}}" },

  { from: "u_kPa", to: "u_MPa", factor: 1 / 1000, latex: "\\frac{1\\text{ MPa}}{1000\\,\\cancel{\\text{kPa}}}" },
  { from: "u_bar", to: "u_kPa", factor: 100,      latex: "\\frac{100\\text{ kPa}}{1\\,\\cancel{\\text{bar}}}" },
  { from: "u_L",   to: "u_m3",  factor: 1 / 1000, latex: "\\frac{1\\text{ m}^3}{1000\\,\\cancel{\\text{L}}}" }
]);

export function solveUnitAlgebra(exprStr, S, targetVar, targetUnit, varsDb = {}) {
  const tokens = exprStr.match(/[a-zA-Z][a-zA-Z0-9_]*/g) || [];
  const mathConstants = new Set(["pi", "sin", "cos", "tan", "sqrt", "abs", "atan", "acos", "log", "exp"]);
  const varTokens = Array.from(new Set(tokens.filter(t => !mathConstants.has(t))));

  const activeVarUnits = {};
  varTokens.forEach(tok => {
    const rawUnit = S._u?.[tok] || varsDb[tok]?.unit || "dimless";
    activeVarUnits[tok] = UNIT_ALGEBRA_DB[rawUnit] || { sym: rawUnit, dim: "custom", tex: `\\text{${rawUnit}}` };
  });

  const canceledTokens = new Set();
  const subTokenCancellations = {};
  const selectedConversions = [];

  const targetInfo = UNIT_ALGEBRA_DB[targetUnit] || { sym: targetUnit, dim: "custom", tex: targetUnit };
  const allActiveUnits = Object.values(activeVarUnits);

  const hasMin = allActiveUnits.some(u => u.hasTime === "u_min" || u.sym === "u_min");
  const hasMm = allActiveUnits.some(u => u.hasLength === "u_mm" || u.sym === "u_mm");
  const hasIn = allActiveUnits.some(u => u.hasLength === "u_in" || u.sym === "u_in");
  const hasFt = allActiveUnits.some(u => u.hasLength === "u_ft" || u.sym === "u_ft");
  const hasMeter = allActiveUnits.some(u => u.hasLength === "u_m" || u.sym === "u_m");

  if (hasFt && hasIn) {
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "u_ft" && c.to === "u_in");
    if (conv) {
      selectedConversions.push(conv);
      varTokens.filter(t => activeVarUnits[t].hasLength === "u_in" || activeVarUnits[t].sym === "u_in").forEach(t => canceledTokens.add(t));
      varTokens.filter(t => activeVarUnits[t].hasLength === "u_ft" || activeVarUnits[t].sym === "u_ft").forEach(t => canceledTokens.add(t));
    }
  }

  if (hasMeter && hasMm) {
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "u_m" && c.to === "u_mm");
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
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "u_min" && c.to === "u_s");
    if (conv && !selectedConversions.includes(conv)) {
      selectedConversions.push(conv);
      varTokens.filter(t => activeVarUnits[t].hasTime === "u_min").forEach(t => {
        subTokenCancellations[t] = { cancelMin: true };
      });
    }
  }

  if (hasMm && targetNeedsMeter) {
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "u_mm" && c.to === "u_m");
    if (conv && !selectedConversions.includes(conv)) {
      selectedConversions.push(conv);
      varTokens.filter(t => activeVarUnits[t].sym === "u_mm").forEach(t => canceledTokens.add(t));
    }
  } else if (hasIn && targetNeedsFt) {
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "u_in" && c.to === "u_ft");
    if (conv && !selectedConversions.includes(conv)) {
      selectedConversions.push(conv);
      varTokens.filter(t => activeVarUnits[t].sym === "u_in").forEach(t => canceledTokens.add(t));
    }
  }

  if (targetUnit === "kW" && (hasMin || hasMm || allActiveUnits.some(u => u.sym === "u_N" || u.dim === "torque"))) {
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "u_W" && c.to === "u_kW");
    if (conv && !selectedConversions.includes(conv)) selectedConversions.push(conv);
  } else if (targetUnit === "N-m" && allActiveUnits.some(u => u.sym === "u_kW")) {
    const convW = ATOMIC_CONVERSIONS.find(c => c.from === "u_kW" && c.to === "u_W");
    if (convW) selectedConversions.push(convW);
    varTokens.filter(t => activeVarUnits[t].sym === "u_kW").forEach(t => canceledTokens.add(t));
  } else if (targetUnit === "hp" && (hasIn || allActiveUnits.some(u => u.dim === "torque"))) {
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "u_ftlb_min" && c.to === "u_hp") ||
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
    conversionFactorTex: selectedConversions.map(cf => ` \\cdot ${cf.latex}`).join("")
  };
}