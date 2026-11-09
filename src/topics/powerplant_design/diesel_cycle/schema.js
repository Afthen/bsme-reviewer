/**
 * src/topics/powerplant/diesel_cycle/schema.js
 * Scoped schema for Air-Standard Diesel Cycle.
 */
import { DIMENSIONS } from "../../../core/dimensions.js";

export const DIESEL_CYCLE_VARS_DB = Object.freeze({
  "r_k": { name: "Compression Ratio", symbol: "r_k", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Compression Ratio"] },
  "r_c": { name: "Cut-off Ratio", symbol: "r_c", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Cut-off Ratio", "Load Ratio"] },
  "r_e": { name: "Expansion Ratio", symbol: "r_e", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Expansion Ratio"] },
  "k": { name: "Specific Heat Ratio", symbol: "k", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", isConstant: true, aliases: ["Specific Heat Ratio", "Isentropic Exponent"] },
  "T_1": { name: "Initial Temperature", symbol: "T_1", dimension: DIMENSIONS.TEMPERATURE, unit: "K", aliases: ["Initial Temperature", "Intake Temperature"] },
  "T_2": { name: "Temperature after Compression", symbol: "T_2", dimension: DIMENSIONS.TEMPERATURE, unit: "K", aliases: ["Temperature after Compression", "Discharge Temperature"] },
  "T_3": { name: "Temperature after Heat Addition", symbol: "T_3", dimension: DIMENSIONS.TEMPERATURE, unit: "K", aliases: ["Temperature after Heat Addition", "Maximum Cycle Temperature"] },
  "T_4": { name: "Temperature after Expansion", symbol: "T_4", dimension: DIMENSIONS.TEMPERATURE, unit: "K", aliases: ["Temperature after Expansion", "Exhaust Temperature"] },
  "c_p": { name: "Specific Heat at Constant Pressure", symbol: "c_p", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg-K", isConstant: true, aliases: ["Specific Heat at Constant Pressure", "c_p"] },
  "c_v": { name: "Specific Heat at Constant Volume", symbol: "c_v", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg-K", isConstant: true, aliases: ["Specific Heat at Constant Volume", "c_v"] },
  "Q_A": { name: "Heat Added", symbol: "Q_A", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg", aliases: ["Heat Added", "Heat Supplied"] },
  "Q_R": { name: "Heat Rejected", symbol: "Q_R", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg", aliases: ["Heat Rejected"] },
  "W_net": { name: "Net Work", symbol: "W_{net}", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg", aliases: ["Net Work", "Cycle Work"] },
  "e_th": { name: "Thermal Efficiency", symbol: "e_{th}", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Thermal Efficiency", "Air-Standard Efficiency"] }
});