/**
 * src/topics/machine_design/shafting/static_combined_strength/schema.js
 * Schema for Static Combined Shaft Strength (MSS, DE, Equivalent Moments, Hollow Weight Savings, Axial+Bending+Torsion).
 */

import { DIMENSIONS } from "../../../../core/dimensions.js";
import { SHAFT_BASE_VARS } from "../../common/shaft_base_schema.js";

export const SHAFT_STATIC_STRENGTH_VARS_DB = Object.freeze({
  "n_op": SHAFT_BASE_VARS.n_op,
  "omega": SHAFT_BASE_VARS.omega,
  "P": SHAFT_BASE_VARS.P,
  "T": SHAFT_BASE_VARS.T,
  "M_h": SHAFT_BASE_VARS.M_h,
  "M_v": SHAFT_BASE_VARS.M_v,
  "M": SHAFT_BASE_VARS.M,
  "d": SHAFT_BASE_VARS.d,
  "A": SHAFT_BASE_VARS.A,
  "Z": SHAFT_BASE_VARS.Z,
  "Z_p": SHAFT_BASE_VARS.Z_p,
  "sigma_b": SHAFT_BASE_VARS.sigma_b,
  "tau": SHAFT_BASE_VARS.tau,
  "S_y": SHAFT_BASE_VARS.S_y,
  "T_e": {
    name: "Equivalent Twisting Moment",
    symbol: "T_e",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Equivalent Twisting Moment", "Guest Equivalent Torque"],
    symbolAliases: ["T_e", "M_{t,eq}"],
    aliases: ["Equivalent Twisting Moment", "Guest Equivalent Torque"]
  },
  "M_e": {
    name: "Equivalent Bending Moment",
    symbol: "M_e",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Equivalent Bending Moment", "Principal Equivalent Moment"],
    symbolAliases: ["M_e", "M_{b,eq}"],
    aliases: ["Equivalent Bending Moment", "Principal Equivalent Moment"]
  },
  "tau_max": {
    name: "Combined Maximum Shear Stress",
    symbol: "\\tau_{max}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Combined Maximum Shear Stress", "Peak Tresca Shear Stress"],
    symbolAliases: ["\\tau_{max}"],
    aliases: ["Combined Maximum Shear Stress", "Peak Tresca Shear Stress"]
  },
  "S_sy": {
    name: "Shear Yield Strength (MSS)",
    symbol: "S_{sy}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Shear Yield Strength (MSS)", "Tresca Shear Yield Strength"],
    symbolAliases: ["S_{sy}"],
    aliases: ["Shear Yield Strength (MSS)", "Tresca Shear Yield Strength"]
  },
  "n_MSS": {
    name: "Maximum Shear Stress Factor of Safety",
    symbol: "n_{MSS}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Maximum Shear Stress Factor of Safety", "Tresca Safety Factor"],
    symbolAliases: ["n_{MSS}"],
    aliases: ["Maximum Shear Stress Factor of Safety", "Tresca Safety Factor"]
  },
  "sigma_vm": SHAFT_BASE_VARS.sigma_vm,
  "n_DE": {
    name: "Distortion Energy Factor of Safety",
    symbol: "n_{DE}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Distortion Energy Factor of Safety", "von Mises Safety Factor"],
    symbolAliases: ["n_{DE}"],
    aliases: ["Distortion Energy Factor of Safety", "von Mises Safety Factor"]
  },
  "d_o": SHAFT_BASE_VARS.d_o,
  "d_i": SHAFT_BASE_VARS.d_i,
  "k_d": SHAFT_BASE_VARS.k_d,
  "A_hol": {
    name: "Hollow Shaft Cross-Sectional Area",
    symbol: "A_{hol}",
    dimension: DIMENSIONS.AREA,
    unit: "mm^2",
    nameAliases: ["Hollow Shaft Cross-Sectional Area", "Hollow Section Area"],
    symbolAliases: ["A_{hol}"],
    aliases: ["Hollow Shaft Cross-Sectional Area", "Hollow Section Area"]
  },
  "eta_wt": {
    name: "Hollow Shaft Weight Savings",
    symbol: "\\%_{wt}",
    dimension: DIMENSIONS.PERCENTAGE,
    unit: "%",
    nameAliases: ["Hollow Shaft Weight Savings", "Material Mass Reduction Ratio"],
    symbolAliases: ["\\%_{wt}", "\\eta_{wt}"],
    aliases: ["Hollow Shaft Weight Savings", "Material Mass Reduction Ratio"]
  },
  "F_a": SHAFT_BASE_VARS.F_a,
  "sigma_a": {
    name: "Direct Axial Stress",
    symbol: "\\sigma_a",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Direct Axial Stress", "Thrust Normal Stress"],
    symbolAliases: ["\\sigma_a"],
    aliases: ["Direct Axial Stress", "Thrust Normal Stress"]
  },
  "sigma_x": {
    name: "Combined Axial and Bending Stress",
    symbol: "\\sigma_x",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Combined Axial and Bending Stress", "Total Normal Stress"],
    symbolAliases: ["\\sigma_x"],
    aliases: ["Combined Axial and Bending Stress", "Total Normal Stress"]
  },
  "sigma_comb": {
    name: "Combined 3D von Mises Stress",
    symbol: "\\sigma'_{comb}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Combined 3D von Mises Stress", "Axial-Bending-Torsion Equivalent Stress"],
    symbolAliases: ["\\sigma'_{comb}"],
    aliases: ["Combined 3D von Mises Stress", "Axial-Bending-Torsion Equivalent Stress"]
  },
  "n_comb": {
    name: "Combined 3D Factor of Safety",
    symbol: "n_{comb}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Combined 3D Factor of Safety", "Axial-Bending-Torsion Safety Factor"],
    symbolAliases: ["n_{comb}"],
    aliases: ["Combined 3D Factor of Safety", "Axial-Bending-Torsion Safety Factor"]
  }
});
