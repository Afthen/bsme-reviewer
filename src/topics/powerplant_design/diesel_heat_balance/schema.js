import { POWERPLANT_BASE_VARS } from "../common/powerplant_base_schema.js";
import { DIMENSIONS } from "../../../core/dimensions.js";

export const DIESEL_HEAT_BALANCE_VARS_DB = Object.freeze({
  ...POWERPLANT_BASE_VARS,
  "Q_ip": { name: "Heat to Indicated Power", symbol: "Q_{ip}", dimension: DIMENSIONS.POWER, unit: "kW" },
  "Q_cw": { name: "Heat to Cooling Water", symbol: "Q_{cw}", dimension: DIMENSIONS.POWER, unit: "kW" },
  "Q_exh": { name: "Heat to Exhaust", symbol: "Q_{exh}", dimension: DIMENSIONS.POWER, unit: "kW" },
  "Q_rad": { name: "Radiation/Unaccounted Loss", symbol: "Q_{rad}", dimension: DIMENSIONS.POWER, unit: "kW" },
  "m_cw": { name: "Cooling Water Mass Flow", symbol: "\\dot{m}_{cw}", dimension: DIMENSIONS.MASS_FLOW, unit: "kg/s" },
  "dT_cw": { name: "Cooling Water Temp Rise", symbol: "\\Delta T_{cw}", dimension: DIMENSIONS.TEMPERATURE, unit: "K" },
  "cp_w": { name: "Specific Heat of Water", symbol: "c_{p,w}", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg-K", isConstant: true },
  "pct_cw": { name: "Cooling Water Heat %", symbol: "\\%_{cw}", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless" },
  "pct_exh": { name: "Exhaust Heat %", symbol: "\\%_{exh}", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless" },
  "pct_rad": { name: "Radiation Heat %", symbol: "\\%_{rad}", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless" }
});