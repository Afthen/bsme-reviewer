/**
 * src/core/cas.js
 * Symbolic Computer Algebra System (CAS) abstraction layer powered by Nerdamer.
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

/**
 * Returns all possible CAS string representations for a given variable key.
 */
export function getPossibleTokens(varKey) {
  const matches = [];
  for (const [sym, k] of Object.entries(SYMBOL_TO_KEY)) {
    if (k === varKey) matches.push(sym);
  }
  return matches.length > 0 ? matches : [varKey];
}

// ========================================================
// 2. TOKEN NORMALIZATION & KATEX RESTORATION
// ========================================================

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
    tex = tex.replace(/\bpi\b/g, "\\pi");

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

    // Convert n1/n2 to N_1/N_2 and D1/D2 to D_1/D_2
    tex = tex.replace(/\bn_?1\b/g, "N_1");
    tex = tex.replace(/\bn_?2\b/g, "N_2");
    tex = tex.replace(/\b([A-Za-z])(\d+)\b/g, "$1_{$2}");

    // Strip multiplication symbols
    tex = tex.replace(/\\cdot/g, " ");
    tex = tex.replace(/\*/g, " ");
    tex = tex.replace(/(\d+)\s+([a-zA-Z_\\])/g, "$1$2");

    return tex;
  } catch {
    return (exprStr || "").replace(/\*/g, " ");
  }
}

// ========================================================
// 3. CAS OPERATIONS
// ========================================================

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

// ========================================================
// 4. DYNAMIC VARIABLE ISOLATION WITH SYMBOL ALIASING
// ========================================================

export function isolateVariable(eqStr, targetVar, varsDb = {}) {
  const parts = eqStr.split("=");
  const rawLhs = parts[0]?.trim() || "";
  const rawRhs = parts[1]?.trim() || "";

  const possibleTokens = getPossibleTokens(targetVar);
  const sanitizedLhs = sanitizeExpr(rawLhs);
  const sanitizedRhs = sanitizeExpr(rawRhs);
  const sanitizedEq = `${sanitizedLhs} = ${sanitizedRhs}`;

  // Find the exact token representation used in this equation
  const tokenInEq = possibleTokens.find(tok => {
    const clean = toCasToken(tok);
    const regex = new RegExp(`\\b${clean}\\b`);
    return regex.test(sanitizedLhs) || regex.test(sanitizedRhs);
  }) || toCasToken(targetVar);

  // If already isolated on LHS
  if (toCasToken(rawLhs) === toCasToken(tokenInEq)) {
    const cleanRhs = simplifyExpression(rawRhs);
    const targetTex = varsDb[targetVar]?.symbol || targetVar;
    return {
      targetVar,
      isolatedRhs: cleanRhs,
      texEquation: `${targetTex} = ${casToTex(cleanRhs, varsDb)}`
    };
  }

  // Use Nerdamer to isolate the token
  if (typeof nerdamer !== "undefined") {
    try {
      const cleanToken = toCasToken(tokenInEq);
      const solutions = nerdamer.solveEquations(sanitizedEq, cleanToken);
      if (solutions && solutions.length > 0) {
        let solText = solutions[0];
        if (typeof solText.text === "function") solText = solText.text();
        solText = simplifyExpression(solText.toString());

        const targetTex = varsDb[targetVar]?.symbol || targetVar;
        return {
          targetVar,
          isolatedRhs: solText,
          texEquation: `${targetTex} = ${casToTex(solText, varsDb)}`
        };
      }
    } catch (err) {
      console.warn(`CAS isolation failed for ${targetVar} (${tokenInEq}) in ${eqStr}:`, err);
    }
  }

  return {
    targetVar,
    isolatedRhs: rawRhs,
    texEquation: `${targetVar} = ${casToTex(rawRhs, varsDb)}`
  };
}
