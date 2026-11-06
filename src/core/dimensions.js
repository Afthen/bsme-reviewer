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
// 2. DIMENSIONAL CONVERSIONS & FRACTION FORMATTERS
// ========================================================
export const CONVERSIONS = Object.freeze({
  mm_to_in: { factor: 1 / 25.4, latex: "\\frac{1\\text{ in}}{25.4\\text{ mm}}" },
  in_to_mm: { factor: 25.4, latex: "\\frac{25.4\\text{ mm}}{1\\text{ in}}" },
  m_to_mm:  { factor: 1000, latex: "\\frac{1000\\text{ mm}}{1\\text{ m}}" },
  mm_to_m:  { factor: 1 / 1000, latex: "\\frac{1\\text{ m}}{1000\\text{ mm}}" },
  min_to_s: { factor: 60, latex: "\\frac{60\\text{ s}}{1\\text{ min}}" },
  s_to_min: { factor: 1 / 60, latex: "\\frac{1\\text{ min}}{60\\text{ s}}" },
  ft_to_in: { factor: 12, latex: "\\frac{12\\text{ in}}{1\\text{ ft}}" },
  in_to_ft: { factor: 1 / 12, latex: "\\frac{1\\text{ ft}}{12\\text{ in}}" }
});

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

/**
 * Formats standard dimensional conversion fractions with strikethrough cancellation.
 */
export function formatConversionWithCancellation(type) {
  switch (type) {
    case "in_to_mm_cancel_mm":
      return "\\frac{25.4\\,\\cancel{\\text{mm}}}{1\\text{ in}}";
    case "mm_to_in_cancel_mm":
      return "\\frac{1\\text{ in}}{25.4\\,\\cancel{\\text{mm}}}";
    case "mm_to_m_cancel_mm":
      return "\\frac{1\\text{ m}}{1000\\,\\cancel{\\text{mm}}}";
    case "m_to_mm_cancel_m":
      return "\\frac{1000\\text{ mm}}{1\\,\\cancel{\\text{m}}}";
    case "min_to_s_cancel_min":
      return "\\frac{1\\,\\cancel{\\text{min}}}{60\\,\\cancel{\\text{s}}}";
    case "s_to_min_cancel_s":
      return "\\frac{60\\,\\cancel{\\text{s}}}{1\\text{ min}}";
    case "ft_to_in_cancel_ft":
      return "\\frac{12\\text{ in}}{1\\,\\cancel{\\text{ft}}}";
    case "in_to_ft_cancel_in":
      return "\\frac{1\\text{ ft}}{12\\,\\cancel{\\text{in}}}";
    default:
      return "";
  }
}

// ========================================================
// 3. NUMERICAL & LABEL FORMATTERS
// ========================================================

/**
 * Uniform numeric rounding formatter (default 2 decimals).
 */
export function fmt(n, maxDec = 2) {
  if (n === undefined || n === null) return "";
  const num = typeof n === "number" ? n : Number(n);
  if (isNaN(num)) return "";
  const factor = Math.pow(10, maxDec);
  return (Math.round(num * factor) / factor).toString();
}

/**
 * Formats step target headers for interactive parsing.
 * e.g., "Pinion Pitch Diameter ({{D_1|D_P1}}) in mm"
 */
export function targetLabel(name, token, unit) {
  if (!unit || unit === "dimless" || unit === "ratio" || unit === "teeth") {
    return `${name} (${token})`;
  }
  if (unit === "deg") {
    return `${name} (${token}) in °`;
  }
  return `${name} (${token}) in ${unit}`;
}
