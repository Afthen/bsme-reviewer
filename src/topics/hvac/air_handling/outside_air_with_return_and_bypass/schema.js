/**
 * src/topics/hvac/air_handling/outside_air_with_return_and_bypass/schema.js
 * Scoped schema for Cooling Coil with Bypass Air handling with full State Points 1 to 6.
 */
import { HVAC_BASE_VARS } from "../../common/hvac_base_schema.js";
import { DIMENSIONS } from "../../../../core/dimensions.js";

export const BYPASS_AIR_VARS_DB = Object.freeze({
  "m_o":   HVAC_BASE_VARS.m_o,
  "m_r":   HVAC_BASE_VARS.m_r,
  "m_m":   HVAC_BASE_VARS.m_m,
  "y":     HVAC_BASE_VARS.y,
  // State Point 1 (Outdoor Air Stream)
  "t_o": {
    ...HVAC_BASE_VARS.t_o,
    nameAliases: ["Outside Air Temperature", "Point 1 Temperature", "State 1 Temperature", "Outdoor Air Temp"],
    symbolAliases: ["t_o", "t_1", "T_1"]
  },
  "h_o": {
    ...HVAC_BASE_VARS.h_o,
    nameAliases: ["Outside Air Enthalpy", "Point 1 Enthalpy", "State 1 Enthalpy"],
    symbolAliases: ["h_o", "h_1"]
  },
  // State Point 2 (Return Air Stream)
  "t_r": {
    ...HVAC_BASE_VARS.t_r,
    nameAliases: ["Return Air Temperature", "Point 2 Temperature", "State 2 Temperature", "Room Air Temp"],
    symbolAliases: ["t_r", "t_2", "T_2"]
  },
  "h_r": {
    ...HVAC_BASE_VARS.h_r,
    nameAliases: ["Return Air Enthalpy", "Point 2 Enthalpy", "State 2 Enthalpy"],
    symbolAliases: ["h_r", "h_2"]
  },
  // State Point 3 (Mixed Air Stream entering coil)
  "t_m": {
    ...HVAC_BASE_VARS.t_m,
    nameAliases: ["Mixed Air Temperature", "Point 3 Temperature", "State 3 Temperature", "Entering Coil Temperature"],
    symbolAliases: ["t_m", "t_3", "T_3"]
  },
  "h_m": {
    ...HVAC_BASE_VARS.h_m,
    nameAliases: ["Mixed Air Enthalpy", "Point 3 Enthalpy", "State 3 Enthalpy", "Entering Coil Enthalpy"],
    symbolAliases: ["h_m", "h_3"]
  },
  // State Point 4 (Apparatus Dew Point / Coil Surface)
  "t_adp": {
    name: "Apparatus Dew Point",
    symbol: "t_{adp}",
    dimension: DIMENSIONS.TEMPERATURE,
    unit: "°C",
    aliases: ["Apparatus Dew Point", "Coil Surface Temperature", "Effective Surface Temp", "Cooling Coil Dew Point", "ADP"],
    nameAliases: ["Apparatus Dew Point", "Point 4 Temperature", "Coil Surface Temperature", "Effective Surface Temp"],
    symbolAliases: ["t_{adp}", "t_4", "T_4", "t_{coil}"]
  },
  "h_adp": {
    name: "ADP Enthalpy",
    symbol: "h_{adp}",
    dimension: DIMENSIONS.SPECIFIC_ENERGY,
    unit: "kJ/kg",
    aliases: ["Apparatus Dew Point Enthalpy", "Saturation Enthalpy at ADP"],
    nameAliases: ["ADP Enthalpy", "Point 4 Enthalpy", "Saturation Enthalpy at ADP"],
    symbolAliases: ["h_{adp}", "h_4"]
  },
  // State Point 5 (Supply Air leaving cooling coil)
  "t_s": {
    ...HVAC_BASE_VARS.t_s,
    nameAliases: ["Supply Air Temperature", "Point 5 Temperature", "State 5 Temperature", "Leaving Coil Temperature"],
    symbolAliases: ["t_s", "t_5", "T_5"]
  },
  "h_s": {
    ...HVAC_BASE_VARS.h_s,
    nameAliases: ["Supply Air Enthalpy", "Point 5 Enthalpy", "State 5 Enthalpy", "Leaving Coil Enthalpy"],
    symbolAliases: ["h_s", "h_5"]
  },
  // State Point 6 (Supply Air after Reheater)
  "t_rh": {
    ...HVAC_BASE_VARS.t_rh,
    nameAliases: ["Reheated Air Temperature", "Point 6 Temperature", "State 6 Temperature", "Supply Air Temp after Reheater"],
    symbolAliases: ["t_{rh}", "t_6", "T_6"]
  },
  "h_rh": {
    ...HVAC_BASE_VARS.h_rh,
    nameAliases: ["Reheated Air Enthalpy", "Point 6 Enthalpy", "State 6 Enthalpy"],
    symbolAliases: ["h_{rh}", "h_6"]
  },
  "BF":    { name: "Bypass Factor", symbol: "BF", dimension: DIMENSIONS.DIMENSIONLESS, aliases: ["Bypass Factor", "Coil Bypass Factor", "Bypass Fraction", "Uncontacted Fraction"], symbolAliases: ["BF", "\\text{BF}"] },
  "CF":    { name: "Contact Factor", symbol: "CF", dimension: DIMENSIONS.DIMENSIONLESS, aliases: ["Contact Factor", "Coil Efficiency", "Contact Efficiency", "1 - BF"], symbolAliases: ["CF", "\\text{CF}"] },
  "q_c":   HVAC_BASE_VARS.q_c,
  "q_rh":  HVAC_BASE_VARS.q_rh,
  "V_o":   HVAC_BASE_VARS.V_o,
  "v_o":   HVAC_BASE_VARS.v_o,
  "V_m":   HVAC_BASE_VARS.V_m,
  "v_m":   HVAC_BASE_VARS.v_m,
  "V_s":   HVAC_BASE_VARS.V_s,
  "v_s":   HVAC_BASE_VARS.v_s,
  "c_pa":  HVAC_BASE_VARS.c_pa
});
