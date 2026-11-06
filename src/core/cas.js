/**
 * src/core/cas.js
 * Universal Computer Algebra System (CAS) with Semantic & Physical Unit Algebra.
 */

// ========================================================
// 1. CANONICAL SYMBOL <-> DATABASE KEY RESOLVER
// ========================================================

export const SYMBOL_TO_KEY = Object.freeze({
  "v": "V_m", "Vm": "V_m", "V_m": "V_m",
  "D1": "D_P1", "D_1": "D_P1", "D_P1": "D_P1", "DP1": "D_P1",
  "D2": "D_P2", "D_2": "D_P2", "D_P2": "D_P2", "DP2": "D_P2",
  "D": "D_P", "D_P": "D_P", "DP": "D_P",
  "Ft": "W_t", "F_t": "W_t", "Wt": "W_t", "W_t": "W_t",
  "Fr": "W_r", "F_r": "W_r", "Wr": "W_r", "W_r": "W_r",
  "Fn": "W", "F_n": "W", "W": "W",
  "T": "M_t", "Mt": "M_t", "M_t": "M_t",
  "SR": "VR", "VR": "VR",
  "N1": "n_1", "n1": "n_1", "n_1": "n_1", "N_1": "n_1",
  "N2": "n_2", "n2": "n_2", "n_2": "n_2", "N_2": "n_2",
  "T1": "T_1", "T_1": "T_1",
  "T2": "T_2", "T_2": "T_2",
  "Pd": "P_d", "P_d": "P_d",
  "Pc": "P_c", "P_c": "P_c",
  "hk": "h_k", "h_k": "h_k",
  "Do": "D_o", "D_o": "D_o",
  "Db": "D_b", "D_b": "D_b",
  "pb": "p_b", "p_b": "p_b",
  "c": "c", "h": "h", "a": "a", "s": "s", "b": "b", "Y": "Y", "C": "C", "P": "P", "phi": "phi", "m": "m", "t": "t"
});

export function getPossibleTokens(varKey) {
  const matches = [];
  for (const [sym, k] of Object.entries(SYMBOL_TO_KEY)) {
    if (k === varKey) matches.push(sym);
  }
  return matches.length > 0 ? matches : [varKey];
}

export function toCasToken(v) {
  if (!v) return "";
  return v.replace(/[^a-zA-Z0-9]/g, "");
}

export function sanitizeExpr(exprStr) {
  if (!exprStr) return "";
  return exprStr.replace(/([a-zA-Z]+)_(\w+)/g, "$1$2");
}

export function casToTex(exprStr, varsDb = {}) {
  if (typeof nerdamer === "undefined" || !exprStr) return exprStr || "";
  try {
    let tex = nerdamer(sanitizeExpr(exprStr)).toTeX();

    tex = tex.replace(/\bphi\b/g, "\\phi");
    tex = tex.replace(/(?<![a-zA-Z\\])pi(?![a-zA-Z])/g, "\\pi");

    tex = tex.replace(/\bhk\b/g, "h_k");
    tex = tex.replace(/\bPd\b/g, "P_d");
    tex = tex.replace(/\bPc\b/g, "P_c");
    tex = tex.replace(/\bDo\b/g, "D_o");
    tex = tex.replace(/\bDb\b/g, "D_b");
    tex = tex.replace(/\bFt\b/g, "F_t");
    tex = tex.replace(/\bFn\b/g, "F_n");
    tex = tex.replace(/\bFr\b/g, "F_r");
    tex = tex.replace(/\bFD\b/g, "F_D");
    tex = tex.replace(/\bCd\b/g, "C_d");
    tex = tex.replace(/\bCi\b/g, "C_i");
    tex = tex.replace(/\bMt\b/g, "T");
    tex = tex.replace(/\bVm\b/g, "v");
    tex = tex.replace(/\bVR\b/g, "\\text{SR}");
    tex = tex.replace(/\bSR\b/g, "\\text{SR}");

    tex = tex.replace(/\bn_?1\b/g, "N_1");
    tex = tex.replace(/\bn_?2\b/g, "N_2");
    tex = tex.replace(/\b([A-Za-z])(\d+)\b/g, "$1_{$2}");

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
    return nerdamer(`simplify(${sanitizeExpr(exprStr)})`).text();
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
      const tokens = getPossibleTokens(k);
      tokens.forEach(tok => {
        cleanSubs[toCasToken(tok)] = sanitizeExpr(v);
      });
    }
    return nerdamer(sanitizeExpr(exprStr), cleanSubs).text();
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

  const targetKey = SYMBOL_TO_KEY[targetVar] || targetVar;
  const targetTex = varsDb[targetKey]?.symbol || targetVar;

  if (targetKey === "phi") {
    if (rawRhs.includes("tan(phi)")) {
      const coeff = rawRhs.replace(/(\*|\s)?tan\(phi\)/g, "").trim() || "1";
      return {
        targetVar,
        isolatedRhs: `atan((${rawLhs}) / (${coeff}))`,
        texEquation: `\\phi = \\tan^{-1}\\left(\\frac{${casToTex(rawLhs, varsDb)}}{${casToTex(coeff, varsDb)}}\\right)`
      };
    }
    if (rawRhs.includes("cos(phi)")) {
      const coeff = rawRhs.replace(/(\*|\s)?cos\(phi\)/g, "").trim() || "1";
      return {
        targetVar,
        isolatedRhs: `acos((${rawLhs}) / (${coeff}))`,
        texEquation: `\\phi = \\cos^{-1}\\left(\\frac{${casToTex(rawLhs, varsDb)}}{${casToTex(coeff, varsDb)}}\\right)`
      };
    }
  }

  const possibleTokens = getPossibleTokens(targetVar);
  const sanitizedLhs = sanitizeExpr(rawLhs);
  const sanitizedRhs = sanitizeExpr(rawRhs);
  const sanitizedEq = `${sanitizedLhs} = ${sanitizedRhs}`;

  const tokenInEq = possibleTokens.find(tok => {
    const clean = toCasToken(tok);
    const regex = new RegExp(`\\b${clean}\\b`);
    return regex.test(sanitizedLhs) || regex.test(sanitizedRhs);
  }) || toCasToken(targetVar);

  if (toCasToken(rawLhs) === toCasToken(tokenInEq)) {
    const cleanRhs = simplifyExpression(rawRhs);
    return {
      targetVar,
      isolatedRhs: cleanRhs,
      texEquation: `${targetTex} = ${casToTex(cleanRhs, varsDb)}`
    };
  }

  if (typeof nerdamer !== "undefined") {
    try {
      const cleanToken = toCasToken(tokenInEq);
      const solutions = nerdamer.solveEquations(sanitizedEq, cleanToken);
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
// 2. CAS UNIT REGISTRY: SEMANTIC (su_) & PHYSICAL (u_)
// ========================================================

export const UNIT_ALGEBRA_DB = Object.freeze({
  "teeth":    { sym: "su_teeth", dim: "entity", tex: "\\text{teeth}" },
  "rad":      { sym: "su_rad",   dim: "angular", tex: "\\text{rad}" },
  "rev":      { sym: "su_rev",   dim: "angular", tex: "\\text{rev}" },
  "deg":      { sym: "su_deg",   dim: "angular", tex: "^\\circ" },

  "mm":       { sym: "u_mm",     dim: "length",  base: "length", tex: "\\text{mm}" },
  "m":        { sym: "u_m",      dim: "length",  base: "length", tex: "\\text{m}" },
  "in":       { sym: "u_in",     dim: "length",  base: "length", tex: "\\text{in}" },
  "ft":       { sym: "u_ft",     dim: "length",  base: "length", tex: "\\text{ft}" },

  "s":        { sym: "u_s",      dim: "time",    base: "time",   tex: "\\text{s}" },
  "min":      { sym: "u_min",    dim: "time",    base: "time",   tex: "\\text{min}" },

  "N":        { sym: "u_N",      dim: "force",   base: "force",  tex: "\\text{N}" },
  "lb":       { sym: "u_lb",     dim: "force",   base: "force",  tex: "\\text{lb}" },

  "rpm":      { sym: "(su_rev / u_min)", dim: "rot_speed", hasTime: "u_min", hasSemantic: "su_rev", tex: "\\frac{\\text{rev}}{\\text{min}}" },
  "rev/min":  { sym: "(su_rev / u_min)", dim: "rot_speed", hasTime: "u_min", hasSemantic: "su_rev", tex: "\\frac{\\text{rev}}{\\text{min}}" },
  "teeth/in": { sym: "(su_teeth / u_in)", dim: "pitch", hasLength: "u_in", hasSemantic: "su_teeth", tex: "\\frac{\\text{teeth}}{\\text{in}}" },
  "m/s":      { sym: "(u_m / u_s)", dim: "velocity", hasLength: "u_m", hasTime: "u_s", tex: "\\frac{\\text{m}}{\\text{s}}" },
  "ft/min":   { sym: "(u_ft / u_min)", dim: "velocity", hasLength: "u_ft", hasTime: "u_min", tex: "\\frac{\\text{ft}}{\\text{min}}" },

  "N-m":      { sym: "(u_N * u_m)", dim: "torque", hasForce: "u_N", hasLength: "u_m", tex: "\\text{N}\\cdot\\text{m}" },
  "lb-in":    { sym: "(u_lb * u_in)", dim: "torque", hasForce: "u_lb", hasLength: "u_in", tex: "\\text{lb}\\cdot\\text{in}" },

  "W":        { sym: "u_W", dim: "power", tex: "\\text{W}" },
  "kW":       { sym: "u_kW", dim: "power", tex: "\\text{kW}" },
  "hp":       { sym: "u_hp", dim: "power", tex: "\\text{hp}" },

  "MPa":      { sym: "u_MPa", dim: "stress", tex: "\\text{MPa}" },
  "psi":      { sym: "u_psi", dim: "stress", tex: "\\text{psi}" },
  "Pa":       { sym: "u_Pa", dim: "stress", tex: "\\text{Pa}" },

  "dimless":  { sym: "1", dim: "dimensionless", tex: "" },
  "ratio":    { sym: "1", dim: "dimensionless", tex: "" }
});

// ========================================================
// 3. ATOMIC DIMENSIONAL CONVERSION DICTIONARY
// ========================================================

export const ATOMIC_CONVERSIONS = Object.freeze([
  { from: "u_mm", to: "u_m",  factor: 1 / 1000, latex: "\\frac{1\\text{ m}}{1000\\,\\cancel{\\text{mm}}}" },
  { from: "u_m",  to: "u_mm", factor: 1000,     latex: "\\frac{1000\\text{ mm}}{1\\,\\cancel{\\text{m}}}" },
  { from: "u_in", to: "u_ft", factor: 1 / 12,   latex: "\\frac{1\\text{ ft}}{12\\,\\cancel{\\text{in}}}" },
  { from: "u_ft", to: "u_in", factor: 12,       latex: "\\frac{12\\text{ in}}{1\\,\\cancel{\\text{ft}}}" },
  { from: "u_mm", to: "u_in", factor: 1 / 25.4, latex: "\\frac{1\\text{ in}}{25.4\\,\\cancel{\\text{mm}}}" },
  { from: "u_in", to: "u_mm", factor: 25.4,     latex: "\\frac{25.4\\text{ mm}}{1\\,\\cancel{\\text{in}}}" },

  { from: "u_min", to: "u_s", factor: 1 / 60,   latex: "\\frac{1\\,\\cancel{\\text{min}}}{60\\text{ s}}" },
  { from: "u_s",   to: "u_min", factor: 60,     latex: "\\frac{60\\,\\cancel{\\text{s}}}{1\\text{ min}}" },

  { from: "u_W",   to: "u_kW", factor: 1 / 1000, latex: "\\frac{1\\text{ kW}}{1000\\,\\cancel{\\text{W}}}" },
  { from: "u_kW",  to: "u_W",  factor: 1000,     latex: "\\frac{1000\\,\\cancel{\\text{W}}}{1\\,\\cancel{\\text{kW}}}" },
  { from: "u_hp",  to: "u_ftlb_min", factor: 33000, latex: "\\frac{33000\\,\\cancel{\\text{ft}\\cdot\\text{lb}/\\text{min}}}{1\\,\\cancel{\\text{hp}}}" }
]);

// ========================================================
// 4. GENERAL CAS UNIT SOLVER
// ========================================================

export function solveUnitAlgebra(exprStr, S, targetVar, targetUnit, varsDb = {}) {
  const tokens = exprStr.match(/[a-zA-Z][a-zA-Z0-9_]*/g) || [];
  const mathConstants = new Set(["pi", "sin", "cos", "tan", "sqrt", "abs", "atan", "acos", "log", "exp"]);
  const varTokens = Array.from(new Set(tokens.filter(t => !mathConstants.has(t))));

  const activeVarUnits = {};
  varTokens.forEach(tok => {
    const k = SYMBOL_TO_KEY[tok] || tok;
    const rawUnit = S._u?.[k] || varsDb[k]?.unit || "dimless";
    activeVarUnits[tok] = UNIT_ALGEBRA_DB[rawUnit] || { sym: rawUnit, dim: "custom", tex: `\\text{${rawUnit}}` };
  });

  const canceledTokens = new Set();
  const subTokenCancellations = {};
  const selectedConversions = [];

  const targetInfo = UNIT_ALGEBRA_DB[targetUnit] || { sym: targetUnit, dim: "custom", tex: targetUnit };
  const allActiveUnits = Object.values(activeVarUnits);

  // Unit Flags declared ONCE
  const hasMin = allActiveUnits.some(u => u.hasTime === "u_min" || u.sym === "u_min");
  const hasMm = allActiveUnits.some(u => u.hasLength === "u_mm" || u.sym === "u_mm");
  const hasInch = allActiveUnits.some(u => u.hasLength === "u_in" || u.sym === "u_in");

  const targetNeedsSec = targetInfo.hasTime === "u_s" || targetUnit === "kW" || targetUnit === "W" || targetUnit === "N-m";
  const targetNeedsMeter = targetInfo.hasLength === "u_m" || targetUnit === "N-m" || targetUnit === "kW" || targetUnit === "W";
  const targetNeedsInch = targetInfo.hasLength === "u_in" || targetUnit === "teeth/in";
  const targetNeedsMm = targetInfo.hasLength === "u_mm" || targetUnit === "mm";
  const targetNeedsFt = targetInfo.hasLength === "u_ft" || targetUnit === "hp";

  // 1. Time Matching
  if (hasMin && targetNeedsSec) {
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "u_min" && c.to === "u_s");
    if (conv) {
      selectedConversions.push(conv);
      varTokens.filter(t => activeVarUnits[t].hasTime === "u_min").forEach(t => {
        subTokenCancellations[t] = { cancelMin: true };
      });
    }
  }

  // 2. Length Matching
  if (hasMm && targetNeedsMeter) {
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "u_mm" && c.to === "u_m");
    if (conv) {
      selectedConversions.push(conv);
      varTokens.filter(t => activeVarUnits[t].sym === "u_mm").forEach(t => canceledTokens.add(t));
    }
  } else if (hasMm && targetNeedsInch) {
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "u_in" && c.to === "u_mm");
    if (conv) {
      selectedConversions.push(conv);
      varTokens.filter(t => activeVarUnits[t].sym === "u_mm").forEach(t => canceledTokens.add(t));
    }
  } else if (hasInch && targetNeedsMm) {
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "u_in" && c.to === "u_mm");
    if (conv) {
      selectedConversions.push(conv);
    }
  } else if (hasInch && targetNeedsFt) {
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "u_in" && c.to === "u_ft");
    if (conv) {
      selectedConversions.push(conv);
      varTokens.filter(t => activeVarUnits[t].sym === "u_in").forEach(t => canceledTokens.add(t));
    }
  }

  // 3. Power Matching
  if (targetUnit === "kW" && (hasMin || hasMm || allActiveUnits.some(u => u.sym === "u_N" || u.dim === "torque"))) {
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "u_W" && c.to === "u_kW");
    if (conv && !selectedConversions.includes(conv)) selectedConversions.push(conv);
  } else if (targetUnit === "N-m" && allActiveUnits.some(u => u.sym === "u_kW")) {
    const convW = ATOMIC_CONVERSIONS.find(c => c.from === "u_kW" && c.to === "u_W");
    if (convW) selectedConversions.push(convW);
    varTokens.filter(t => activeVarUnits[t].sym === "u_kW").forEach(t => canceledTokens.add(t));
  } else if (targetUnit === "hp" && (hasInch || allActiveUnits.some(u => u.dim === "torque"))) {
    const conv = ATOMIC_CONVERSIONS.find(c => c.from === "u_ftlb_min" && c.to === "u_hp") ||
                 { latex: "\\frac{1\\text{ hp}}{33000\\,\\cancel{\\text{ft}\\cdot\\text{lb}/\\text{min}}}" };
    selectedConversions.push(conv);
  }

  // 4. Dimensionless Ratio Full Cancellation
  const isTargetDimless = !targetUnit || targetUnit === "dimless" || targetUnit === "ratio";
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
