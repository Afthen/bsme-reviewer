/**
 * src/core/dimensions.js
 * Physical dimensions, dimensional analysis conversions, and KaTeX cancellation formatters.
 */

// ========================================================
// 1. PHYSICAL DIMENSIONS TAXONOMY
// ========================================================
export const DIMENSIONS = Object.freeze({
  LENGTH: "Length",
  FORCE: "Force",
  TORQUE: "Torque",
  POWER: "Power",
  STRESS: "Stress / Pressure",
  VELOCITY: "Linear Velocity",
  ROT_SPEED: "Rotational Speed",
  PITCH: "Tooth Pitch",
  ANGLE: "Angle",
  COUNT: "Count (Teeth)",
  DIMENSIONLESS: "Dimensionless"
});

// ========================================================
// 2. KATEX CANCELLATION HELPERS
// ========================================================

/**
 * Wraps a unit token in a KaTeX \cancel{\text{...}} block.
 */
export function cancelUnit(unitStr) {
  if (!unitStr) return "";
  return `\\cancel{\\text{${unitStr}}}`;
}

/**
 * Wraps a unit token in KaTeX \text{...}.
 */
export function textUnit(unitStr) {
  if (!unitStr) return "";
  return `\\text{${unitStr}}`;
}

// ========================================================
// 3. NUMERICAL & LABEL FORMATTERS
// ========================================================

export function fmt(n, maxDec = 2) {
  if (n === undefined || n === null) return "";
  const num = typeof n === "number" ? n : Number(n);
  if (isNaN(num)) return "";
  const factor = Math.pow(10, maxDec);
  return (Math.round(num * factor) / factor).toString();
}

export function targetLabel(name, token, unit) {
  if (!unit || unit === "dimless" || unit === "ratio" || unit === "teeth") {
    return `${name} (${token})`;
  }
  if (unit === "deg") {
    return `${name} (${token}) in °`;
  }
  return `${name} (${token}) in ${unit}`;
}
