/**
 * src/topics/hvac/air_handling/outside_air_with_return_and_bypass/schema.js
 * Scoped schema for Cooling Coil with Bypass Air handling.
 */

import { HVAC_BASE_VARS } from "../../common/hvac_base_schema.js";
import { DIMENSIONS } from "../../../../core/dimensions.js";

export const BYPASS_AIR_VARS_DB = Object.freeze({
  "m_o":   HVAC_BASE_VARS.m_o,
  "m_r":   HVAC_BASE_VARS.m_r,
  "m_m":   HVAC_BASE_VARS.m_m,
  "y":     HVAC_BASE_VARS.y,
  "t_o":   HVAC_BASE_VARS.t_o,
  "t_r":   HVAC_BASE_VARS.t_r,
  "t_m":   HVAC_BASE_VARS.t_m,
  "t_s":   HVAC_BASE_VARS.t_s,
  "t_rh":  HVAC_BASE_VARS.t_rh,
  "h_o":   HVAC_BASE_VARS.h_o,
  "h_r":   HVAC_BASE_VARS.h_r,
  "h_m":   HVAC_BASE_VARS.h_m,
  "h_s":   HVAC_BASE_VARS.h_s,
  "h_rh":  HVAC_BASE_VARS.h_rh,
  "q_c":   HVAC_BASE_VARS.q_c,
  "q_rh":  HVAC_BASE_VARS.q_rh,
  "V_o":   HVAC_BASE_VARS.V_o,
  "v_o":   HVAC_BASE_VARS.v_o,
  "V_m":   HVAC_BASE_VARS.V_m,
  "v_m":   HVAC_BASE_VARS.v_m,
  "V_s":   HVAC_BASE_VARS.V_s,
  "v_s":   HVAC_BASE_VARS.v_s,
  "c_pa":  HVAC_BASE_VARS.c_pa,
  "t_adp": { name: "Apparatus Dew Point", symbol: "t_{adp}", dimension: DIMENSIONS.TEMPERATURE, unit: "°C", aliases: ["Apparatus Dew Point", "Coil Surface Temperature", "Effective Surface Temp", "Cooling Coil Dew Point", "ADP"] },
  "h_adp": { name: "ADP Enthalpy", symbol: "h_{adp}", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg", aliases: ["Apparatus Dew Point Enthalpy", "Saturation Enthalpy at ADP"] },
  "BF":    { name: "Bypass Factor", symbol: "BF", dimension: DIMENSIONS.DIMENSIONLESS, aliases: ["Bypass Factor", "Coil Bypass Factor", "Bypass Fraction", "Uncontacted Fraction"] },
  "CF":    { name: "Contact Factor", symbol: "CF", dimension: DIMENSIONS.DIMENSIONLESS, aliases: ["Contact Factor", "Coil Efficiency", "Contact Efficiency", "1 - BF"] }
});