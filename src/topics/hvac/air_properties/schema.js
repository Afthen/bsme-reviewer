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
  "t_db":  HVAC_BASE_VARS.t_db,
  "t_wb":  HVAC_BASE_VARS.t_wb,
  "t_dp":  HVAC_BASE_VARS.t_dp,
  "W":     HVAC_BASE_VARS.W,
  "RH":    HVAC_BASE_VARS.RH,
  "h":     HVAC_BASE_VARS.h,
  "v":     HVAC_BASE_VARS.v,
  "SHR":   HVAC_BASE_VARS.SHR,
  "Q_s":   HVAC_BASE_VARS.Q_s,
  "Q_l":   HVAC_BASE_VARS.Q_l,
  "Q_t":   HVAC_BASE_VARS.Q_t
});
