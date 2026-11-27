/**
 * src/topics/machine_design/pressure_vessels/thick_walled_cylinders/schema.js
 * Variable schema for Thick-Walled Cylinders & Lamé Theory (Part III, Sec. 8-10, 12).
 * References: Shigley Sec. 3.16 (Thick-Walled Cylinders), Beer & Johnston Ch. 7.
 */

import { DIMENSIONS } from "../../../../core/dimensions.js";
import { STRESS_BASE_VARS } from "../../common/stress_base_schema.js";
import { PRESSURE_VESSEL_BASE_VARS } from "../../common/pressure_vessel_base_schema.js";

export const THICK_WALLED_CYLINDERS_VARS_DB = Object.freeze({
  "D_i": PRESSURE_VESSEL_BASE_VARS.D_i,
  "D_o": PRESSURE_VESSEL_BASE_VARS.D_o,
  "r_i": PRESSURE_VESSEL_BASE_VARS.r_i,
  "r_o": PRESSURE_VESSEL_BASE_VARS.r_o,
  "t": PRESSURE_VESSEL_BASE_VARS.t,
  "p_i": PRESSURE_VESSEL_BASE_VARS.p_i,
  "sigma_t_i": {
    name: "Inner Surface Tangential Stress",
    symbol: "\\sigma_{t,i}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Inner Surface Tangential Stress", "Inner Bore Hoop Stress", "Maximum Tangential Stress"],
    symbolAliases: ["\\sigma_{t,i}", "\\sigma_{ti}", "\\sigma_{t1}"],
    aliases: ["Inner Surface Tangential Stress", "Inner Bore Hoop Stress", "Maximum Tangential Stress"]
  },
  "sigma_t_o": {
    name: "Outer Surface Tangential Stress",
    symbol: "\\sigma_{t,o}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Outer Surface Tangential Stress", "Outer Boundary Hoop Stress"],
    symbolAliases: ["\\sigma_{t,o}", "\\sigma_{to}", "\\sigma_{t2}"],
    aliases: ["Outer Surface Tangential Stress", "Outer Boundary Hoop Stress"]
  },
  "sigma_r_i": {
    name: "Inner Surface Radial Compressive Stress",
    symbol: "\\sigma_{r,i}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Inner Surface Radial Compressive Stress", "Inner Bore Radial Pressure", "Radial Stress at Inner Surface"],
    symbolAliases: ["\\sigma_{r,i}", "\\sigma_{ri}", "p_i"],
    aliases: ["Inner Surface Radial Compressive Stress", "Inner Bore Radial Pressure", "Radial Stress at Inner Surface"]
  },
  "sigma_L": PRESSURE_VESSEL_BASE_VARS.sigma_L,
  "tau_max_i": {
    name: "Inner Bore Maximum Shear Stress",
    symbol: "\\tau_{max,i}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Inner Bore Maximum Shear Stress", "Maximum Shear Stress at Bore"],
    symbolAliases: ["\\tau_{max,i}", "\\tau_{max}"],
    aliases: ["Inner Bore Maximum Shear Stress", "Maximum Shear Stress at Bore"]
  },
  "E": STRESS_BASE_VARS.E,
  "u_o": {
    name: "Outer Surface Radial Displacement",
    symbol: "u_o",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Outer Surface Radial Displacement", "Outer Radial Deflection"],
    symbolAliases: ["u_o", "\\delta_{r,o}"],
    aliases: ["Outer Surface Radial Displacement", "Outer Radial Deflection"]
  },
  "delta_D_o": {
    name: "Outer Diametral Expansion",
    symbol: "\\Delta D_o",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Outer Diametral Expansion", "Outer Diameter Growth"],
    symbolAliases: ["\\Delta D_o", "\\delta_{D,o}"],
    aliases: ["Outer Diametral Expansion", "Outer Diameter Growth"]
  },
  "S_y": STRESS_BASE_VARS.S_y,
  "n_s": STRESS_BASE_VARS.n_s,
  "sigma_allow": STRESS_BASE_VARS.sigma_allow
});
