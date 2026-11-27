/**
 * src/topics/machine_design/pressure_vessels/thin_walled_spheres/schema.js
 * Variable schema for Thin-Walled Spherical Pressure Vessels (Part II, Sec. 6 & 7).
 * References: Beer & Johnston Sec. 7.9, Hibbeler Sec. 8.1.
 */

import { DIMENSIONS } from "../../../../core/dimensions.js";
import { STRESS_BASE_VARS } from "../../common/stress_base_schema.js";
import { PRESSURE_VESSEL_BASE_VARS } from "../../common/pressure_vessel_base_schema.js";

export const THIN_WALLED_SPHERES_VARS_DB = Object.freeze({
  "D_i": PRESSURE_VESSEL_BASE_VARS.D_i,
  "D_o": PRESSURE_VESSEL_BASE_VARS.D_o,
  "D_m": PRESSURE_VESSEL_BASE_VARS.D_m,
  "r_i": PRESSURE_VESSEL_BASE_VARS.r_i,
  "r_o": PRESSURE_VESSEL_BASE_VARS.r_o,
  "t": PRESSURE_VESSEL_BASE_VARS.t,
  "c_a": PRESSURE_VESSEL_BASE_VARS.c_a,
  "t_nom": PRESSURE_VESSEL_BASE_VARS.t_nom,
  "p_i": PRESSURE_VESSEL_BASE_VARS.p_i,
  "sigma_s": PRESSURE_VESSEL_BASE_VARS.sigma_s,
  "tau_max": PRESSURE_VESSEL_BASE_VARS.tau_max,
  "F_sep": {
    name: "Hemispherical Joint Separation Force",
    symbol: "F_{sep}",
    dimension: DIMENSIONS.FORCE,
    unit: "kN",
    nameAliases: ["Hemispherical Joint Separation Force", "Equatorial Separation Force", "Hemisphere Separation Thrust"],
    symbolAliases: ["F_{sep}", "P_{sep}", "F_h"],
    aliases: ["Hemispherical Joint Separation Force", "Equatorial Separation Force", "Hemisphere Separation Thrust"]
  },
  "E": STRESS_BASE_VARS.E,
  "nu": STRESS_BASE_VARS.nu,
  "delta_D": PRESSURE_VESSEL_BASE_VARS.delta_D,
  "S_y": STRESS_BASE_VARS.S_y,
  "n_s": STRESS_BASE_VARS.n_s,
  "sigma_allow": STRESS_BASE_VARS.sigma_allow
});
