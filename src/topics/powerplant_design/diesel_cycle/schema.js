/**
 * src/topics/powerplant_design/diesel_cycle/schema.js
 * Scoped schema for Air-Standard Diesel Cycle.
 * Enforces lowercase symbols for Specific Energy (kJ/kg) per thermodynamic convention.
 */
import { DIMENSIONS } from "../../../core/dimensions.js";

export const DIESEL_CYCLE_VARS_DB = Object.freeze({
  "r_k": {
    name: "Compression Ratio",
    symbol: "r_k",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    aliases: ["Compression Ratio"],
    symbolAliases: ["r_k", "r"]
  },
  "r_c": {
    name: "Cut-off Ratio",
    symbol: "r_c",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    aliases: ["Cut-off Ratio", "Load Ratio"],
    symbolAliases: ["r_c", "\\rho"]
  },
  "r_e": {
    name: "Expansion Ratio",
    symbol: "r_e",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    aliases: ["Expansion Ratio"],
    symbolAliases: ["r_e"]
  },
  "k": {
    name: "Specific Heat Ratio",
    symbol: "k",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    isConstant: true,
    aliases: ["Specific Heat Ratio", "Isentropic Exponent"],
    symbolAliases: ["k", "\\gamma"]
  },
  "T_1": {
    name: "Initial Temperature",
    symbol: "T_1",
    dimension: DIMENSIONS.TEMPERATURE,
    unit: "K",
    aliases: ["Initial Temperature", "Intake Temperature"],
    symbolAliases: ["T_1", "T_{in}"]
  },
  "T_2": {
    name: "Temperature after Compression",
    symbol: "T_2",
    dimension: DIMENSIONS.TEMPERATURE,
    unit: "K",
    aliases: ["Temperature after Compression", "Discharge Temperature"],
    symbolAliases: ["T_2", "T_c"]
  },
  "T_3": {
    name: "Temperature after Heat Addition",
    symbol: "T_3",
    dimension: DIMENSIONS.TEMPERATURE,
    unit: "K",
    aliases: ["Temperature after Heat Addition", "Maximum Cycle Temperature"],
    symbolAliases: ["T_3", "T_{max}"]
  },
  "T_4": {
    name: "Temperature after Expansion",
    symbol: "T_4",
    dimension: DIMENSIONS.TEMPERATURE,
    unit: "K",
    aliases: ["Temperature after Expansion", "Exhaust Temperature"],
    symbolAliases: ["T_4", "T_{exh}"]
  },
  "c_p": {
    name: "Specific Heat at Constant Pressure",
    symbol: "c_p",
    dimension: DIMENSIONS.SPECIFIC_ENERGY,
    unit: "kJ/kg-K",
    isConstant: true,
    aliases: ["Specific Heat at Constant Pressure", "c_p"],
    symbolAliases: ["c_p"]
  },
  "c_v": {
    name: "Specific Heat at Constant Volume",
    symbol: "c_v",
    dimension: DIMENSIONS.SPECIFIC_ENERGY,
    unit: "kJ/kg-K",
    isConstant: true,
    aliases: ["Specific Heat at Constant Volume", "c_v"],
    symbolAliases: ["c_v"]
  },
  // Specific Heat Added (lowercase q_A)
  "Q_A": {
    name: "Specific Heat Added",
    symbol: "q_A",
    dimension: DIMENSIONS.SPECIFIC_ENERGY,
    unit: "kJ/kg",
    aliases: ["Specific Heat Added", "Heat Added per Unit Mass", "Heat Added", "Heat Supplied"],
    nameAliases: ["Specific Heat Added", "Heat Added per Unit Mass", "Heat Supplied"],
    symbolAliases: ["q_A", "q_{in}", "q_{add}"]
  },
  // Specific Heat Rejected (lowercase q_R)
  "Q_R": {
    name: "Specific Heat Rejected",
    symbol: "q_R",
    dimension: DIMENSIONS.SPECIFIC_ENERGY,
    unit: "kJ/kg",
    aliases: ["Specific Heat Rejected", "Heat Rejected per Unit Mass", "Heat Rejected"],
    nameAliases: ["Specific Heat Rejected", "Heat Rejected per Unit Mass", "Heat Rejected"],
    symbolAliases: ["q_R", "q_{out}", "q_{rej}"]
  },
  // Specific Net Work (lowercase w_{net})
  "W_net": {
    name: "Specific Net Work",
    symbol: "w_{net}",
    dimension: DIMENSIONS.SPECIFIC_ENERGY,
    unit: "kJ/kg",
    aliases: ["Specific Net Work", "Net Work per Unit Mass", "Net Cycle Work", "Net Work"],
    nameAliases: ["Specific Net Work", "Net Work per Unit Mass", "Net Cycle Work"],
    symbolAliases: ["w_{net}", "w_{cycle}"]
  },
  "e_th": {
    name: "Thermal Efficiency",
    symbol: "e_{th}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    aliases: ["Thermal Efficiency", "Air-Standard Efficiency"],
    symbolAliases: ["e_{th}", "\\eta_{th}", "\\eta_{diesel}"]
  }
});