/**
src/topics/hvac/air_handling/outside_air_with_return/schema.js
Scoped schema for Mixed Air Handling units.
*/
import { HVAC_BASE_VARS } from "../../common/hvac_base_schema.js";
export const MIXED_AIR_VARS_DB = Object.freeze({
 "t_o ": HVAC_BASE_VARS.t_o,
 "t_r ": HVAC_BASE_VARS.t_r,
 "t_m ": HVAC_BASE_VARS.t_m,
 "h_o ": HVAC_BASE_VARS.h_o,
 "h_r ": HVAC_BASE_VARS.h_r,
 "h_m ": HVAC_BASE_VARS.h_m,
 "h_s ": HVAC_BASE_VARS.h_s,
 "m_o ": HVAC_BASE_VARS.m_o,
 "m_r ": HVAC_BASE_VARS.m_r,
 "m_m ": HVAC_BASE_VARS.m_m,
 "q_c ": HVAC_BASE_VARS.q_c,
 "y ":   HVAC_BASE_VARS.y,
 "V_o ": HVAC_BASE_VARS.V_o,
 "v_o ": HVAC_BASE_VARS.v_o,
 "V_m ": HVAC_BASE_VARS.V_m,
 "v_m ": HVAC_BASE_VARS.v_m
});
