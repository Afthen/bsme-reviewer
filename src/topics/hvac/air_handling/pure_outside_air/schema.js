/**
 * src/topics/hvac/air_handling/pure_outside_air/schema.js
 * Scoped schema for 100% Outside Air systems.
 */

import { HVAC_BASE_VARS } from "../../common/hvac_base_schema.js";

export const PURE_AIR_VARS_DB = Object.freeze({
  "m_o": HVAC_BASE_VARS.m_o,
  "h_o": HVAC_BASE_VARS.h_o,
  "h_s": HVAC_BASE_VARS.h_s,
  "q_c": HVAC_BASE_VARS.q_c
});
