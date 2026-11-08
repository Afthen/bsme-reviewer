/**
 * src/topics/hvac/cooling_tower/schema.js
 * Self-contained Cooling Tower Schema with exhaustive board-exam aliases.
 */

import { DIMENSIONS } from "../../../core/dimensions.js";

export const TOWER_VARS_DB = Object.freeze({
  "m_w":   { name: "Water Mass Flow", symbol: "\\dot{m}_w", dimension: DIMENSIONS.MASS_FLOW, unit: "kg/s", aliases: ["Water Mass Flow", "Circulating Water Rate", "Cooling Water Rate", "Condenser Water Flow Rate", "Warm Water Rate"] },
  "m_a":   { name: "Air Mass Flow", symbol: "\\dot{m}_a", dimension: DIMENSIONS.MASS_FLOW, unit: "kg/s", aliases: ["Air Mass Flow", "Draft Air Rate", "Cooling Tower Air Flow", "Air Mass Flow Rate", "Dry Air Rate"] },
  "m_mu":  { name: "Make-up Water Rate", symbol: "\\dot{m}_{mu}", dimension: DIMENSIONS.MASS_FLOW, unit: "kg/s", aliases: ["Make-up Water Rate", "Evaporation Rate", "Make-up Requirement", "Water Loss Rate"] },
  "t_w1":  { name: "Entering Water Temp", symbol: "t_{w1}", dimension: DIMENSIONS.TEMPERATURE, unit: "°C", aliases: ["Entering Water Temp", "Hot Water Temp", "Warm Water Temp", "Condenser Water Leaving Temp"] },
  "t_w2":  { name: "Leaving Water Temp", symbol: "t_{w2}", dimension: DIMENSIONS.TEMPERATURE, unit: "°C", aliases: ["Leaving Water Temp", "Cold Water Temp", "Cooled Water Temp", "Basin Water Temp"] },
  "t_wb1": { name: "Entering Air Wet-Bulb", symbol: "t_{wb1}", dimension: DIMENSIONS.TEMPERATURE, unit: "°C", aliases: ["Entering Air Wet-Bulb", "Ambient Wet-Bulb Temp", "Outside Wet-Bulb", "Entering Wet Bulb"] },
  "h_1":   { name: "Entering Air Enthalpy", symbol: "h_1", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg", aliases: ["Entering Air Enthalpy", "Enthalpy of Draft Air"] },
  "h_2":   { name: "Leaving Air Enthalpy", symbol: "h_2", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg", aliases: ["Leaving Air Enthalpy", "Exhaust Air Enthalpy"] },
  "W_1":   { name: "Entering Humidity Ratio", symbol: "W_1", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Entering Humidity Ratio", "Entering Moisture Content"] },
  "W_2":   { name: "Leaving Humidity Ratio", symbol: "W_2", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Leaving Humidity Ratio", "Exhaust Moisture Content"] },
  "c_pw":  { name: "Specific Heat of Water", symbol: "c_{pw}", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg-K", aliases: ["Specific Heat of Water", "Water Specific Heat"] },
  "R_ct":  { name: "Cooling Range", symbol: "Range", dimension: DIMENSIONS.TEMPERATURE, unit: "°C", aliases: ["Cooling Range", "Range", "Water Temperature Drop", "Actual Cooling"] },
  "A_ct":  { name: "Cooling Approach", symbol: "Approach", dimension: DIMENSIONS.TEMPERATURE, unit: "°C", aliases: ["Cooling Approach", "Approach", "Tower Approach"] },
  "q_rej": { name: "Heat Rejected", symbol: "q_{rej}", dimension: DIMENSIONS.POWER, unit: "kW", aliases: ["Heat Rejected", "Cooling Tower Heat Load", "Heat Removed from Water", "Heat Absorbed by Air"] }
});
