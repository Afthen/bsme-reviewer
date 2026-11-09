import { DIMENSIONS } from "../../../core/dimensions.js";

export const POWERPLANT_DESIGN_VARS = Object.freeze({
  // Chimney / Stack Draft
  "h_chimney": { name: "Chimney Height", symbol: "H", dimension: DIMENSIONS.LENGTH, unit: "m" },
  "d_chimney": { name: "Chimney Diameter", symbol: "D", dimension: DIMENSIONS.LENGTH, unit: "m" },
  "P_draft": { name: "Draft Pressure", symbol: "P_{draft}", dimension: DIMENSIONS.PRESSURE, unit: "Pa" },
  "P_atm": { name: "Atmospheric Pressure", symbol: "P_{atm}", dimension: DIMENSIONS.PRESSURE, unit: "Pa" },
  "T_gas": { name: "Flue Gas Temperature", symbol: "T_g", dimension: DIMENSIONS.TEMPERATURE, unit: "K" },
  "T_air": { name: "Ambient Air Temperature", symbol: "T_a", dimension: DIMENSIONS.TEMPERATURE, unit: "K" },
  "rho_gas": { name: "Flue Gas Density", symbol: "\\rho_g", dimension: DIMENSIONS.DENSITY, unit: "kg/m^3" },
  "rho_air": { name: "Ambient Air Density", symbol: "\\rho_a", dimension: DIMENSIONS.DENSITY, unit: "kg/m^3" },
  "R_g": { name: "Specific Gas Const (Flue Gas)", symbol: "R_g", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "J/kg-K", isConstant: true },
  "g": { name: "Gravity", symbol: "g", dimension: DIMENSIONS.ACCELERATION, unit: "m/s^2", isConstant: true },
  // Heat Exchangers
  "Q_HX": { name: "Heat Transfer Rate", symbol: "Q", dimension: DIMENSIONS.POWER, unit: "kW" },
  "U": { name: "Overall Heat Transfer Coeff", symbol: "U", dimension: DIMENSIONS.HEAT_TRANSFER_COEFF, unit: "kW/m^2-K" },
  "A_HX": { name: "Heat Transfer Area", symbol: "A", dimension: DIMENSIONS.AREA, unit: "m^2" },
  "LMTD": { name: "Log Mean Temp Difference", symbol: "LMTD", dimension: DIMENSIONS.TEMPERATURE, unit: "K" },
  // Piping
  "V_fluid": { name: "Fluid Velocity", symbol: "V", dimension: DIMENSIONS.VELOCITY, unit: "m/s" },
  "Vol_flow": { name: "Volumetric Flow Rate", symbol: "\\dot{V}", dimension: DIMENSIONS.VOLUME_FLOW, unit: "m^3/s" },
  "A_pipe": { name: "Pipe Cross-Sectional Area", symbol: "A_{pipe}", dimension: DIMENSIONS.AREA, unit: "m^2" },
  "h_L": { name: "Major Head Loss", symbol: "h_L", dimension: DIMENSIONS.LENGTH, unit: "m" },
  "f": { name: "Friction Factor", symbol: "f", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless" },
  "L": { name: "Pipe Length", symbol: "L", dimension: DIMENSIONS.LENGTH, unit: "m" },
  "D": { name: "Pipe Diameter", symbol: "D", dimension: DIMENSIONS.LENGTH, unit: "m" }
});