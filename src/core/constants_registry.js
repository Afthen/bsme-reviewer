/**
 * src/core/constants_registry.js
 * Universal core engineering constants registry with memory mode flags.
 */

import { DIMENSIONS } from "./dimensions.js";

export const CONSTANTS_DB = Object.freeze({
  "c_pw": {
    name: "Specific Heat of Water",
    symbol: "c_{pw}",
    dimension: DIMENSIONS.SPECIFIC_ENERGY,
    unit: "kJ/kg-K",
    valueSI: 4.187,
    valueUS: 1.0,
    unitSI: "kJ/kg-K",
    unitUS: "Btu/(lb*F)",
    isConstant: true,
    aliases: ["Specific Heat of Water", "Water Specific Heat", "c_{pw}"]
  },
  "c_pa": {
    name: "Specific Heat of Air",
    symbol: "c_{pa}",
    dimension: DIMENSIONS.SPECIFIC_ENERGY,
    unit: "kJ/kg-K",
    valueSI: 1.0062,
    valueUS: 0.24,
    unitSI: "kJ/kg-K",
    unitUS: "Btu/lb",
    isConstant: true,
    aliases: ["Specific Heat of Air", "Air Specific Heat", "c_{pa}"]
  },
  "g": {
    name: "Acceleration Due to Gravity",
    symbol: "g",
    dimension: DIMENSIONS.VELOCITY,
    unit: "m/s^2",
    valueSI: 9.81,
    valueUS: 32.2,
    unitSI: "m/s^2",
    unitUS: "ft/s^2",
    isConstant: true,
    aliases: ["Gravity", "Acceleration Due to Gravity", "g"]
  }
});

export function getConstantValue(constKey, sys = "SI") {
  const meta = CONSTANTS_DB[constKey];
  if (!meta) return 0;
  return sys === "US" ? meta.valueUS : meta.valueSI;
}

export function getConstantUnit(constKey, sys = "SI") {
  const meta = CONSTANTS_DB[constKey];
  if (!meta) return "";
  return sys === "US" ? meta.unitUS : meta.unitSI;
}
