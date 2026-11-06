/**
 * src/core/cas.js
 * Symbolic Computer Algebra System (CAS) abstraction layer powered by Nerdamer.
 */

// ========================================================
// 1. TOKEN NORMALIZATION & KATEX RESTORATION
// ========================================================

/**
 * Normalizes a single variable token for Nerdamer (removes underscores).
 * e.g., "D_P1" -> "DP1", "h_k" -> "hk", "P_d" -> "Pd"
 */
export function toCasToken(v) {
  if (!v) return "";
  return v.replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Sanitizes an algebraic expression string by removing underscores from variable tokens
 * while preserving arithmetic operators (+, -, *, /, parentheses).
 */
export function sanitizeExpr(exprStr) {
  if (!exprStr) return "";
  return exprStr.replace(/([a-zA-Z]+)_(\w+)/g, "$1$2");
}

/**
 * Restores raw CAS tokens into standard KaTeX notation with subscripts & Greek letters.
 * Strictly eliminates any '*' or '\cdot' multiplication symbols.
 */
export function casToTex(exprStr, varsDb = {}) {
  if (typeof nerdamer === "undefined" || !exprStr) return exprStr || "";
  try {
    let tex = nerdamer(exprStr).toTeX();

    // Restore known Greek characters
    tex = tex.replace(/\bphi\b/g, "\\phi");
    tex = tex.replace(/\bpi\b/g, "\\pi");

    // Restore multi-character engineering symbols
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
    tex = tex.replace(/\bVR\b/g, "\\text{VR}");
    tex = tex.replace(/\bSR\b/g, "\\text{SR}");

    // Restore numbered subscripts: D1 -> D_1, T2 -> T_2, n1 -> N_1
    tex = tex.replace(/\b([A-Za-z])(\d+)\b/g, "$1_{$2}");

    // Eliminate ugly multiplication symbols completely
    tex = tex.replace(/\\cdot/g, " ");
    tex = tex.replace(/\*/g, " ");

    // Remove unnecessary spaces between coefficient numbers and variables (e.g., "2 a" -> "2a")
    tex = tex.replace(/(\d+)\s+([a-zA-Z_\\])/g, "$1$2");

    return tex;
  } catch {
    return (exprStr || "").replace(/\*/g, " ");
  }
}

// ========================================================
// 2. CAS OPERATIONS (SIMPLIFY, SUBSTITUTE, EVALUATE)
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

export function evaluateExpression(exprStr, values = {}) {
  if (typeof nerdamer === "undefined" || !exprStr) return NaN;
  try {
    const cleanVals = {};
    for (const [k, v] of Object.entries(values)) {
      if (typeof v === "number") cleanVals[toCasToken(k)] = v;
    }
    const evaluated = nerdamer(sanitizeExpr(exprStr), cleanVals).evaluate().text();
    return parseFloat(evaluated);
  } catch {
    return NaN;
  }
}

// ========================================================
// 3. DYNAMIC VARIABLE ISOLATION
// ========================================================

/**
 * Symbolically isolates targetVar from an equation (e.g. "h = 2*a + c", "a" -> "(h - c)/2").
 */
export function isolateVariable(eqStr, targetVar, varsDb = {}) {
  const parts = eqStr.split("=");
  const rawLhs = parts[0]?.trim() || "";
  const rawRhs = parts[1]?.trim() || "";

  const targetToken = toCasToken(targetVar);
  const lhsToken = toCasToken(rawLhs);

  // If already isolated on LHS
  if (lhsToken === targetToken) {
    const cleanRhs = simplifyExpression(rawRhs);
    const targetTex = varsDb[targetVar]?.symbol || targetVar;
    return {
      targetVar,
      isolatedRhs: cleanRhs,
      texEquation: `${targetTex} = ${casToTex(cleanRhs, varsDb)}`
    };
  }

  // Use Nerdamer to solve for targetVar
  if (typeof nerdamer !== "undefined") {
    try {
      const sanitizedEq = `${sanitizeExpr(rawLhs)} = ${sanitizeExpr(rawRhs)}`;
      const solutions = nerdamer.solveEquations(sanitizedEq, targetToken);
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
      console.warn(`CAS isolation failed for ${targetVar} in ${eqStr}:`, err);
    }
  }

  return {
    targetVar,
    isolatedRhs: rawRhs,
    texEquation: `${targetVar} = ${casToTex(rawRhs, varsDb)}`
  };
}
