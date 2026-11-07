/**
 * src/core/dimensions.js
 * Physical dimensions, KaTeX cancellation formatters, and universal 6-sig-fig engine.
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
  DIMENSIONLESS: "Dimensionless"
});

/**
 * Universal 6-Significant-Figures Formatter.
 * Trims trailing zeroes to the right of the decimal.
 */
export function fmtSigFig(n, sigFigs = 6) {
  if (n === undefined || n === null) return "";
  const num = typeof n === "number" ? n : Number(n);
  if (isNaN(num)) return "";
  if (Number.isInteger(num)) return num.toString();
  const prec = parseFloat(num.toPrecision(sigFigs));
  return prec.toString();
}

export function fmt(n) {
  return fmtSigFig(n, 6);
}

export function cancelUnit(unitStr) {
  if (!unitStr) return "";
  return `\\cancel{\\text{${unitStr}}}`;
}

export function textUnit(unitStr) {
  if (!unitStr) return "";
  return `\\text{${unitStr}}`;
}

export function targetLabel(name, token, unit) {
  if (!unit || unit === "dimless" || unit === "ratio") {
    return `${name} (${token})`;
  }
  if (unit === "deg" || unit === "°") {
    return `${name} (${token}) in °`;
  }
  return `${name} (${token}) in ${unit}`;
}