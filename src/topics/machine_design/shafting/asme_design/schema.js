/**
 * src/topics/machine_design/shafting/asme_design/schema.js
 * Schema for ASME Code for Design of Transmission Shafting (ASA B17c-1927).
 * Distinct from modern Distortion-Energy fatigue criteria (ANSI/ASME B106.1M-1985).
 */

import { DIMENSIONS } from "../../../../core/dimensions.js";
import { SHAFT_BASE_VARS } from "../../common/shaft_base_schema.js";

export const SHAFT_ASME_VARS_DB = Object.freeze({
  "n_op": SHAFT_BASE_VARS.n_op,
  "omega": SHAFT_BASE_VARS.omega,
  "P": SHAFT_BASE_VARS.P,
  "T": SHAFT_BASE_VARS.T,
  "M_h": SHAFT_BASE_VARS.M_h,
  "M_v": SHAFT_BASE_VARS.M_v,
  "M": SHAFT_BASE_VARS.M,
  "S_y": SHAFT_BASE_VARS.S_y,
  "S_ut": SHAFT_BASE_VARS.S_ut,
  "S_sy_lim": {
    name: "ASME Yield Shear Limit (30% Sy)",
    symbol: "S_{s,y}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["ASME Yield Shear Limit (30% Sy)", "Code Yield Shear Bound"],
    symbolAliases: ["S_{s,y}"],
    aliases: ["ASME Yield Shear Limit (30% Sy)", "Code Yield Shear Bound"]
  },
  "S_s0": {
    name: "ASME Unkeyed Allowable Shear Stress",
    symbol: "S_{s0}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["ASME Unkeyed Allowable Shear Stress", "Unkeyed Code Shear Stress"],
    symbolAliases: ["S_{s0}"],
    aliases: ["ASME Unkeyed Allowable Shear Stress", "Unkeyed Code Shear Stress"]
  },
  "k_key": {
    name: "ASME Keyway Reduction Factor",
    symbol: "k_{key}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["ASME Keyway Reduction Factor", "Keyway Stress Derating Factor"],
    symbolAliases: ["k_{key}"],
    aliases: ["ASME Keyway Reduction Factor", "Keyway Stress Derating Factor"]
  },
  "S_s": {
    name: "ASME Design Allowable Shear Stress",
    symbol: "S_s",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["ASME Design Allowable Shear Stress", "Code Allowable Shear Stress"],
    symbolAliases: ["S_s", "\\tau_{allow}"],
    aliases: ["ASME Design Allowable Shear Stress", "Code Allowable Shear Stress"]
  },
  "C_m": {
    name: "ASME Bending Shock and Fatigue Factor",
    symbol: "K_m",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["ASME Bending Shock and Fatigue Factor", "Bending Shock Factor"],
    symbolAliases: ["K_m", "C_m"],
    aliases: ["ASME Bending Shock and Fatigue Factor", "Bending Shock Factor"]
  },
  "C_t": {
    name: "ASME Torsion Shock and Fatigue Factor",
    symbol: "K_t",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["ASME Torsion Shock and Fatigue Factor", "Torsion Shock Factor"],
    symbolAliases: ["K_t", "C_t"],
    aliases: ["ASME Torsion Shock and Fatigue Factor", "Torsion Shock Factor"]
  },
  "M_f": {
    name: "Shock-Factored Bending Moment",
    symbol: "M_f",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Shock-Factored Bending Moment", "Weighted Bending Moment"],
    symbolAliases: ["M_f", "K_m M"],
    aliases: ["Shock-Factored Bending Moment", "Weighted Bending Moment"]
  },
  "T_f": {
    name: "Shock-Factored Torque",
    symbol: "T_f",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Shock-Factored Torque", "Weighted Twisting Moment"],
    symbolAliases: ["T_f", "K_t T"],
    aliases: ["Shock-Factored Torque", "Weighted Twisting Moment"]
  },
  "T_e": {
    name: "ASME Equivalent Twisting Moment",
    symbol: "T_e",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["ASME Equivalent Twisting Moment", "Code Equivalent Torque"],
    symbolAliases: ["T_e"],
    aliases: ["ASME Equivalent Twisting Moment", "Code Equivalent Torque"]
  },
  "M_e": {
    name: "ASME Equivalent Bending Moment",
    symbol: "M_e",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["ASME Equivalent Bending Moment", "Code Equivalent Moment"],
    symbolAliases: ["M_e"],
    aliases: ["ASME Equivalent Bending Moment", "Code Equivalent Moment"]
  },
  "Z_p": SHAFT_BASE_VARS.Z_p,
  "d": SHAFT_BASE_VARS.d,
  "d_o": SHAFT_BASE_VARS.d_o,
  "d_i": SHAFT_BASE_VARS.d_i,
  "k_d": SHAFT_BASE_VARS.k_d,
  "tau_nom": {
    name: "Nominal Torsional Shear Stress",
    symbol: "\\tau_{nom}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Nominal Torsional Shear Stress", "Unfactored Shear Stress"],
    symbolAliases: ["\\tau_{nom}"],
    aliases: ["Nominal Torsional Shear Stress", "Unfactored Shear Stress"]
  },
  "sigma_nom": {
    name: "Nominal Bending Stress",
    symbol: "\\sigma_{nom}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Nominal Bending Stress", "Unfactored Flexure Stress"],
    symbolAliases: ["\\sigma_{nom}"],
    aliases: ["Nominal Bending Stress", "Unfactored Flexure Stress"]
  }
});
