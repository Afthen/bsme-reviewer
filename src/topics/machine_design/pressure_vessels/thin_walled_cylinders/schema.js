/**
 * src/topics/machine_design/pressure_vessels/thin_walled_cylinders/schema.js
 * Variable schema for Thin-Walled Cylindrical Pressure Vessels (Part II, Sec. 5 & 7).
 * References: Beer & Johnston Ch. 7, Hibbeler Ch. 8, Shigley Ch. 3.
 */

import { STRESS_BASE_VARS } from "../../common/stress_base_schema.js";
import { PRESSURE_VESSEL_BASE_VARS } from "../../common/pressure_vessel_base_schema.js";

export const THIN_WALLED_CYLINDERS_VARS_DB = Object.freeze({
  "D_i": PRESSURE_VESSEL_BASE_VARS.D_i,
  "D_o": PRESSURE_VESSEL_BASE_VARS.D_o,
  "D_m": PRESSURE_VESSEL_BASE_VARS.D_m,
  "r_i": PRESSURE_VESSEL_BASE_VARS.r_i,
  "r_o": PRESSURE_VESSEL_BASE_VARS.r_o,
  "t": PRESSURE_VESSEL_BASE_VARS.t,
  "L": PRESSURE_VESSEL_BASE_VARS.L,
  "c_a": PRESSURE_VESSEL_BASE_VARS.c_a,
  "t_nom": PRESSURE_VESSEL_BASE_VARS.t_nom,
  "p_i": PRESSURE_VESSEL_BASE_VARS.p_i,
  "sigma_h": PRESSURE_VESSEL_BASE_VARS.sigma_h,
  "sigma_L": PRESSURE_VESSEL_BASE_VARS.sigma_L,
  "tau_max_in": PRESSURE_VESSEL_BASE_VARS.tau_max_in,
  "tau_max": PRESSURE_VESSEL_BASE_VARS.tau_max,
  "F_L": PRESSURE_VESSEL_BASE_VARS.F_L,
  "E": STRESS_BASE_VARS.E,
  "nu": STRESS_BASE_VARS.nu,
  "delta_D": PRESSURE_VESSEL_BASE_VARS.delta_D,
  "delta_L": PRESSURE_VESSEL_BASE_VARS.delta_L,
  "S_y": STRESS_BASE_VARS.S_y,
  "n_s": STRESS_BASE_VARS.n_s,
  "sigma_allow": STRESS_BASE_VARS.sigma_allow
});
