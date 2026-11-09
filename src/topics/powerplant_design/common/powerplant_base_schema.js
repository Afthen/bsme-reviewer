/**
 * src/topics/powerplant/common/powerplant_base_schema.js
 * Universal thermodynamics and powerplant variables.
 */
import { DIMENSIONS } from "../../../core/dimensions.js";

export const POWERPLANT_BASE_VARS = Object.freeze({
  // Efficiencies
  "eta_m": { name: "Mechanical Efficiency", symbol: "\\eta_m", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Mechanical Efficiency"] },
  "eta_th": { name: "Brake Thermal Efficiency", symbol: "\\eta_{th}", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Brake Thermal Efficiency", "Overall Thermal Efficiency"] },
  "eta_ith": { name: "Indicated Thermal Efficiency", symbol: "\\eta_{ith}", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Indicated Thermal Efficiency"] },
  "eta_g": { name: "Generator Efficiency", symbol: "\\eta_g", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Generator Efficiency", "Electrical Efficiency"] },
  
  // Power
  "BP": { name: "Brake Power", symbol: "BP", dimension: DIMENSIONS.POWER, unit: "kW", aliases: ["Brake Power", "Shaft Power"] },
  "IP": { name: "Indicated Power", symbol: "IP", dimension: DIMENSIONS.POWER, unit: "kW", aliases: ["Indicated Power"] },
  "FP": { name: "Friction Power", symbol: "FP", dimension: DIMENSIONS.POWER, unit: "kW", aliases: ["Friction Power"] },
  "EP": { name: "Electrical Power", symbol: "EP", dimension: DIMENSIONS.POWER, unit: "kW", aliases: ["Electrical Power", "Generator Power"] },
  "Q_f": { name: "Heat Supplied by Fuel", symbol: "Q_f", dimension: DIMENSIONS.POWER, unit: "kW", aliases: ["Heat Supplied by Fuel", "Fuel Heat Rate"] },
  
  // Fuel
  "m_f": { name: "Fuel Mass Flow Rate", symbol: "\\dot{m}_f", dimension: DIMENSIONS.MASS_FLOW, unit: "kg/s", aliases: ["Fuel Consumption Rate", "Fuel Rate"] },
  "HV": { name: "Heating Value", symbol: "HV", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg", aliases: ["Heating Value", "Calorific Value", "Higher Heating Value"] },
  "bsfc": { name: "Brake Specific Fuel Consumption", symbol: "bsfc", dimension: DIMENSIONS.SPECIFIC_CONSUMPTION, unit: "kg/kWh", aliases: ["Brake Specific Fuel Consumption", "BSFC"] },
  "isfc": { name: "Indicated Specific Fuel Consumption", symbol: "isfc", dimension: DIMENSIONS.SPECIFIC_CONSUMPTION, unit: "kg/kWh", aliases: ["Indicated Specific Fuel Consumption", "ISFC"] }
});