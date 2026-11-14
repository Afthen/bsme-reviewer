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
  MODULUS: "Elastic / Shear Modulus",
  STIFFNESS: "Spring Rate / Stiffness",
  VELOCITY: "Linear Velocity",
  ACCELERATION: "Linear Acceleration",
  ROT_SPEED: "Rotational Speed",
  TIME: "Time / Period",
  FREQUENCY: "Frequency",
  PITCH: "Tooth Pitch",
  ANGLE: "Angle",
  AREA: "Area",
  COUNT: "Count",
  ENERGY: "Energy / Work",
  SPECIFIC_ENERGY: "Specific Energy / Enthalpy",
  MASS: "Mass",
  MASS_FLOW: "Mass Flow Rate",
  DENSITY: "Density",
  VOLUME: "Volume",
  VOLUME_FLOW: "Volume Flow Rate",
  HEAT_TRANSFER_COEFF: "Heat Transfer Coefficient",
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

export function addSeparators(valStr, isLatex = false) {
  if (valStr === undefined || valStr === null) return "";
  const str = String(valStr);
  const sep = isLatex ? "{,}" : ",";
  const parts = str.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return parts.join(".");
}

export function fmtSigFig(n, sigFigs = 6, isLatex = false) {
  if (n === undefined || n === null) return "";
  const num = typeof n === "number" ? n : Number(n);
  if (isNaN(num)) return "";

  if (Number.isInteger(num)) return addSeparators(num.toString(), isLatex);

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

  return addSeparators(formatted.toString(), isLatex);
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
export function formatGivenValue(value, meta = {}, isLatex = true) {
  if (meta.isConstant) {
    if (typeof meta.display === "number") return addSeparators(String(meta.display), isLatex);
    if (typeof meta.display === "string") return meta.display;
    return addSeparators(String(value), isLatex);
  }
  return fmtSigFig(value, 6, isLatex);
}

export function cancelUnit(unitStr) {
  if (!unitStr) return "";
  if (unitStr === "%" || unitStr === "\\%") return "\\cancel{\\text{\\%}}";
  return `\\cancel{\\text{${unitStr}}}`;
}

export function textUnit(unitStr) {
  if (!unitStr) return "";
  if (unitStr === "%" || unitStr === "\\%") return "\\text{\\%}";
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
