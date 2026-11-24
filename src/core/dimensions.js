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
  PERCENTAGE: "Percentage",
  DIMENSIONLESS: "Dimensionless"
});

/**
 * Universal Number Formatter:
 * Display: up to 6 significant figures with a strict maximum of 6 decimal places.
 * Computation is never rounded by the decimal cap.
 * Formats numbers with thousand separators. Trims trailing zeroes to the right of the decimal.
 */

export const DISPLAY_SIG_FIGS = 6;
export const DISPLAY_MAX_DECIMALS = 6;
// Smallest displayed magnitude of a non-constant value that still keeps 3 trimmed significant figures.
export const MIN_DISPLAY_MAGNITUDE = 0.0995;

// Oracle tolerance (test/latex_oracle.js) lives here so the display floor derives from it.
export const ORACLE_REL_TOLERANCE = 1e-3;
export const ORACLE_ABS_TOLERANCE = 1e-3;

// Hard floor: display rounding (half a unit in the last decimal) must stay within
// half the oracle's relative tolerance. 0.5 * 10^-6 / v <= 0.5 * 1e-3  =>  v >= 1e-3.
export const MIN_DISPLAY_FLOOR = Number((Math.pow(10, -DISPLAY_MAX_DECIMALS) / ORACLE_REL_TOLERANCE).toPrecision(6));

export function displayFloorOk(v) {
  return typeof v === "number" && Number.isFinite(v) && (v === 0 || Math.abs(v) >= MIN_DISPLAY_FLOOR);
}

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

  // Round to sigFigs significant figures, print positionally (never exponent
  // notation), and trim trailing zeros. Neatness of givens is a generation-time
  // concern (snapClean in unit_sampler.js), not a display-time one.
  const rounded = Number(num.toPrecision(sigFigs));
  if (rounded === 0) return "0";
  const decimals = Math.min(DISPLAY_MAX_DECIMALS, Math.max(0, sigFigs - 1 - Math.floor(Math.log10(Math.abs(rounded)))));
  const fixed = num.toFixed(decimals);
  const trimmed = fixed.includes(".") ? fixed.replace(/0+$/, "").replace(/\.$/, "") : fixed;
  return addSeparators(trimmed, isLatex);
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
export function formatGivenValue(value, meta = {}, isLatex = true, activeUnit = null) {
  if (meta.isConstant) {
    const unitMatches = !activeUnit || !meta.unit || activeUnit === meta.unit;
    if (unitMatches) {
      const display = meta.display;
      const numericDisplay = typeof display === "number"
        ? display
        : typeof display === "string" && display.trim() !== ""
          ? Number(display.replace(/,/g, ""))
          : NaN;
      const numericValue = Number(value);
      const displayMatchesValue = Number.isFinite(numericDisplay) &&
        Number.isFinite(numericValue) &&
        Math.abs(numericDisplay - numericValue) <=
          Math.max(1, Math.abs(numericDisplay), Math.abs(numericValue)) * 1e-12;

      if (displayMatchesValue) {
        if (typeof display === "number") return addSeparators(String(display), isLatex);
        return display;
      }
      if (display !== undefined && display !== null &&
          typeof display === "string" && !Number.isFinite(numericDisplay)) {
        return display;
      }
    }
    return fmtSigFig(value, 6, isLatex);
  }
  return fmtSigFig(value, 6, isLatex);
}

export function targetLabel(name, token, unit, unitTex = null, unitVar = null) {
  if (!unit || unit === "dimless" || unit === "ratio") {
    return `${name} (${token})`;
  }
  if (unitTex) {
    return unitVar
      ? `${name} (${token}) in <span class="interactive-unit" data-var="${unitVar}">$${unitTex}$</span>`
      : `${name} (${token}) in $${unitTex}$`;
  }
  if (unit === "deg" || unit === "°") {
    return `${name} (${token}) in °`;
  }
  if (unit === "%") {
    return `${name} (${token}) in %`;
  }
  return `${name} (${token}) in ${unit}`;
}
