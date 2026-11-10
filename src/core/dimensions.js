/**
 * src/core/dimensions.js
 * Physical dimensions, KaTeX cancellation formatters, and universal number formatting.
 */

export const DIMENSIONS = Object.freeze({
  LENGTH: "Length",
  FORCE: "Force",
  TORQUE: "Torque",
  POWER: "Power",
  PRESSURE: "Pressure / Stress",
  STRESS: "Pressure / Stress",
  VELOCITY: "Linear Velocity",
  ROT_SPEED: "Rotational Speed",
  PITCH: "Tooth Pitch",
  ANGLE: "Angle",
  COUNT: "Count",
  ENERGY: "Energy / Work",
  SPECIFIC_ENERGY: "Specific Energy / Enthalpy",
  MASS: "Mass",
  MASS_FLOW: "Mass Flow Rate",
  VOLUME: "Volume",
  VOLUME_FLOW: "Volume Flow Rate",
  SPECIFIC_CONSUMPTION: "Specific Fuel Consumption",
  TEMPERATURE: "Temperature",
  TEMPERATURE_DIFF: "Temperature Difference",
  PERCENTAGE: "Percentage",
  DIMENSIONLESS: "Dimensionless"
});

/**
 * Universal Number Formatter:
 * Enforces up to 6 significant figures, with a strict maximum of 3 decimal places.
 * Formats numbers with thousand separators. Trims trailing zeroes to the right of the decimal.
 */
export function fmtSigFig(n, sigFigs = 6) {
  if (n === undefined || n === null) return "";
  const num = typeof n === "number" ? n : Number(n);
  if (isNaN(num)) return "";

  const addSeparators = (valStr) => {
    const parts = valStr.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  if (Number.isInteger(num)) return addSeparators(num.toString());

  // 1. Apply significant figures precision first
  let formatted = parseFloat(num.toPrecision(sigFigs));

  // 2. Enforce maximum of 3 decimal places across the entire repository
  if (Math.abs(formatted) < 1e-4) return "0";

  const str = formatted.toString();
  if (str.includes(".")) {
    const parts = str.split(".");
    if (parts[1].length > 3) {
      formatted = Number(formatted.toFixed(3));
    }
  }

  return addSeparators(formatted.toString());
}

export function fmt(n) {
  return fmtSigFig(n, 6);
}

/**
 * Given-value formatter. Measured givens round to 6 s.f.; constants bypass
 * rounding entirely and print their tabulated academic form (meta.display),
 * or full precision when no tabulated form is declared.
 * @param {number} value
 * @param {object} meta varsDb / CONSTANTS_DB entry for the variable
 */
export function formatGivenValue(value, meta = {}) {
  if (meta.isConstant) {
    if (typeof meta.display === "number") return String(meta.display);
    if (typeof meta.display === "string") return meta.display;
    return String(value);
  }
  return fmtSigFig(value, 6);
}

export function cancelUnit(unitStr) {
  if (!unitStr) return "";
  if (unitStr === "%") return "\\cancel{\\%}";
  return `\\cancel{\\text{${unitStr}}}`;
}

export function textUnit(unitStr) {
  if (!unitStr) return "";
  if (unitStr === "%") return "\\%";
  if (unitStr.startsWith("°")) return unitStr;
  return `\\text{${unitStr}}`;
}

export function targetLabel(name, token, unit) {
  if (!unit || unit === "dimless" || unit === "ratio") {
    return `${name} (${token})`;
  }
  if (unit === "deg" || unit === "°") {
    return `${name} (${token}) in °`;
  }
  if (unit === "%") {
    return `${name} (${token}) in %`;
  }
  return `${name} (${token}) in ${unit}`;
}
