/**
 * src/topics/hvac/air_properties/schema.js
 * Scoped Psychrometric Air Properties Schema.
 */

import { HVAC_BASE_VARS } from "../common/hvac_base_schema.js";

export const AIR_PROPERTIES_VARS_DB = Object.freeze({
  "P_v":   HVAC_BASE_VARS.P_v,
  "P_sat": HVAC_BASE_VARS.P_sat,
  "P_wb":  HVAC_BASE_VARS.P_wb,
  "P_t":   HVAC_BASE_VARS.P_t,
  "P_a":   HVAC_BASE_VARS.P_a,
  // typical: problem-design ranges in the canonical unit (not textbook table values; review)
  "t_db":  { ...HVAC_BASE_VARS.t_db, typical: [28, 40] },
  "t_wb":  { ...HVAC_BASE_VARS.t_wb, typical: [18, 30] },
  "t_dp":  HVAC_BASE_VARS.t_dp,
  "W":     HVAC_BASE_VARS.W,
  "RH":    HVAC_BASE_VARS.RH,
  "h":     HVAC_BASE_VARS.h,
  "v":     HVAC_BASE_VARS.v,
  "SHR":   HVAC_BASE_VARS.SHR,
  "Q_s":   { ...HVAC_BASE_VARS.Q_s, typical: [15, 35] },
  "Q_l":   { ...HVAC_BASE_VARS.Q_l, typical: [5, 15] },
  "Q_t":   HVAC_BASE_VARS.Q_t
});
