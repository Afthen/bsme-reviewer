/**
 * src/topics/powerplant_design/common/powerplant_base_schema.js
 * Universal thermodynamics and powerplant variables.
 */

import { DIMENSIONS } from "../../../core/dimensions.js";

export const POWERPLANT_BASE_VARS = Object.freeze({
  "eta_m": {
    name: "Mechanical Efficiency",
    symbol: "\\eta_m",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    aliases: ["Mechanical Efficiency"],
    nameAliases: ["Engine Mechanical Efficiency", "Mechanical Efficiency"],
    symbolAliases: ["\\eta_m", "e_m"]
  },
  "eta_th": {
    name: "Brake Thermal Efficiency",
    symbol: "\\eta_{th}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    aliases: ["Brake Thermal Efficiency", "Overall Thermal Efficiency"],
    nameAliases: ["Brake Thermal Efficiency", "Overall Thermal Efficiency"],
    symbolAliases: ["\\eta_{th}", "\\eta_b", "e_{th}"]
  },
  "eta_ith": {
    name: "Indicated Thermal Efficiency",
    symbol: "\\eta_{ith}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    aliases: ["Indicated Thermal Efficiency"],
    nameAliases: ["Indicated Thermal Efficiency"],
    symbolAliases: ["\\eta_{ith}", "\\eta_i", "e_{ith}"]
  },
  "eta_g": {
    name: "Generator Efficiency",
    symbol: "\\eta_g",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    aliases: ["Generator Efficiency", "Electrical Efficiency"],
    nameAliases: ["Electrical Generator Efficiency", "Alternator Efficiency"],
    symbolAliases: ["\\eta_g", "\\eta_{gen}"]
  },
  "BP": {
    name: "Brake Power",
    symbol: "BP",
    dimension: DIMENSIONS.POWER,
    unit: "kW",
    aliases: ["Brake Power", "Shaft Power"],
    nameAliases: ["Brake Power", "Engine Shaft Power", "Brake Horsepower Output"],
    symbolAliases: ["BP", "P_b", "\\text{BHP}"]
  },
  "IP": {
    name: "Indicated Power",
    symbol: "IP",
    dimension: DIMENSIONS.POWER,
    unit: "kW",
    aliases: ["Indicated Power"],
    nameAliases: ["Indicated Cylinder Power", "Total Developed Power"],
    symbolAliases: ["IP", "P_i", "\\text{IHP}"]
  },
  "FP": {
    name: "Friction Power",
    symbol: "FP",
    dimension: DIMENSIONS.POWER,
    unit: "kW",
    aliases: ["Friction Power"],
    nameAliases: ["Engine Friction Losses", "Friction Power"],
    symbolAliases: ["FP", "P_f"]
  },
  "EP": {
    name: "Electrical Power",
    symbol: "EP",
    dimension: DIMENSIONS.POWER,
    unit: "kW",
    aliases: ["Electrical Power", "Generator Power"],
    nameAliases: ["Generator Net Output", "Electrical Power"],
    symbolAliases: ["EP", "P_e", "\\text{kW}_{gen}"]
  },
  "Q_f": {
    name: "Heat Supplied by Fuel",
    symbol: "Q_f",
    dimension: DIMENSIONS.POWER,
    unit: "kW",
    aliases: ["Heat Supplied by Fuel", "Fuel Heat Rate"],
    nameAliases: ["Fuel Energy Input Rate", "Heat Released by Fuel"],
    symbolAliases: ["Q_f", "\\dot{Q}_f", "H_f"]
  },
  "m_f": {
    name: "Fuel Mass Flow Rate",
    symbol: "\\dot{m}_f",
    dimension: DIMENSIONS.MASS_FLOW,
    unit: "kg/s",
    aliases: ["Fuel Mass Flow Rate", "Fuel Consumption Rate", "Fuel Rate"],
    nameAliases: ["Fuel Mass Flow Rate", "Hourly Fuel Rate"],
    symbolAliases: ["\\dot{m}_f", "m_f", "w_f"]
  },
  "HV": {
    name: "Heating Value",
    symbol: "HV",
    dimension: DIMENSIONS.SPECIFIC_ENERGY,
    unit: "kJ/kg",
    aliases: ["Heating Value", "Calorific Value", "Higher Heating Value"],
    nameAliases: ["Higher Heating Value", "Fuel Calorific Value"],
    symbolAliases: ["\\text{HV}", "\\text{HHV}", "q_{hv}"]
  },
  "bsfc": {
    name: "Brake Specific Fuel Consumption",
    symbol: "bsfc",
    dimension: DIMENSIONS.SPECIFIC_CONSUMPTION,
    unit: "kg/kWh",
    aliases: ["Brake Specific Fuel Consumption", "BSFC"],
    nameAliases: ["Brake Specific Fuel Consumption", "Brake Fuel Rate"],
    symbolAliases: ["\\text{bsfc}", "\\text{BSFC}"]
  },
  "isfc": {
    name: "Indicated Specific Fuel Consumption",
    symbol: "isfc",
    dimension: DIMENSIONS.SPECIFIC_CONSUMPTION,
    unit: "kg/kWh",
    aliases: ["Indicated Specific Fuel Consumption", "ISFC"],
    nameAliases: ["Indicated Specific Fuel Consumption", "Indicated Fuel Rate"],
    symbolAliases: ["\\text{isfc}", "\\text{ISFC}"]
  }
});