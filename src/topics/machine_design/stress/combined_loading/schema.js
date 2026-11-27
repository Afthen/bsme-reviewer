/**
 * src/topics/machine_design/stress/combined_loading/schema.js
 * Schema for Combined Axial, Eccentric, Bending & Torsion Loading (Part VI, Sec. 11 & Sec. 8.14).
 */

import { STRESS_BASE_VARS } from "../../common/stress_base_schema.js";
import { DIMENSIONS } from "../../../../core/dimensions.js";

export const COMBINED_LOADING_VARS_DB = Object.freeze({
  A: STRESS_BASE_VARS.A,
  c: STRESS_BASE_VARS.c,
  I: STRESS_BASE_VARS.I,
  Z: STRESS_BASE_VARS.Z,
  J: STRESS_BASE_VARS.J,
  M: STRESS_BASE_VARS.M,
  V: STRESS_BASE_VARS.V,
  T: STRESS_BASE_VARS.T,
  sigma_b: STRESS_BASE_VARS.sigma_b,
  sigma_1: STRESS_BASE_VARS.sigma_1,
  sigma_2: STRESS_BASE_VARS.sigma_2,
  sigma_vm: STRESS_BASE_VARS.sigma_vm,
  S_y: STRESS_BASE_VARS.S_y,

  "d": {
    name: "Circular Bar Diameter",
    symbol: "d",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Circular Bar Diameter", "Solid Member Diameter"],
    symbolAliases: ["d", "D"],
    aliases: ["Circular Bar Diameter", "Solid Member Diameter"]
  },
  "Z_p": {
    name: "Polar Section Modulus",
    symbol: "Z_p",
    dimension: DIMENSIONS.SECTION_MODULUS,
    unit: "mm^3",
    nameAliases: ["Polar Section Modulus", "Torsional Section Modulus"],
    symbolAliases: ["Z_p"],
    aliases: ["Polar Section Modulus", "Torsional Section Modulus"]
  },
  "P": {
    name: "Eccentric Axial Load",
    symbol: "P",
    dimension: DIMENSIONS.FORCE,
    unit: "kN",
    nameAliases: ["Eccentric Axial Load", "Direct Axial Force"],
    symbolAliases: ["P", "F_a"],
    aliases: ["Eccentric Axial Load", "Direct Axial Force"]
  },
  "e_ecc": {
    name: "Load Eccentricity",
    symbol: "e",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Load Eccentricity", "Moment Arm Eccentricity"],
    symbolAliases: ["e", "e_0"],
    aliases: ["Load Eccentricity", "Moment Arm Eccentricity"]
  },
  "sigma_a": {
    name: "Direct Axial Normal Stress",
    symbol: "\\sigma_a",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Direct Axial Normal Stress", "Mean Axial Component"],
    symbolAliases: ["\\sigma_a"],
    aliases: ["Direct Axial Normal Stress", "Mean Axial Component"]
  },
  "sigma_x": {
    name: "Maximum Combined Normal Stress",
    symbol: "\\sigma_x",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Maximum Combined Normal Stress", "Critical Fiber Normal Stress"],
    symbolAliases: ["\\sigma_x", "\\sigma_{max}"],
    aliases: ["Maximum Combined Normal Stress", "Critical Fiber Normal Stress"]
  },
  "sigma_opp": {
    name: "Opposite-Fiber Combined Normal Stress",
    symbol: "\\sigma_{opp}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Opposite-Fiber Combined Normal Stress", "Minimum Fiber Normal Stress"],
    symbolAliases: ["\\sigma_{opp}", "\\sigma_{min}"],
    aliases: ["Opposite-Fiber Combined Normal Stress", "Minimum Fiber Normal Stress"]
  },
  "tau_t": {
    name: "Torsional Shear Stress",
    symbol: "\\tau_{xy}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Torsional Shear Stress", "Outer-Fiber Shear Stress"],
    symbolAliases: ["\\tau_{xy}", "\\tau_t"],
    aliases: ["Torsional Shear Stress", "Outer-Fiber Shear Stress"]
  },
  "tau_v": {
    name: "Neutral-Axis Transverse Shear Stress",
    symbol: "\\tau_v",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Neutral-Axis Transverse Shear Stress", "Circular Beam Shear Stress"],
    symbolAliases: ["\\tau_v"],
    aliases: ["Neutral-Axis Transverse Shear Stress", "Circular Beam Shear Stress"]
  },
  "sigma_avg": {
    name: "Element Average Normal Stress",
    symbol: "\\sigma_{avg}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Element Average Normal Stress", "Center Stress"],
    symbolAliases: ["\\sigma_{avg}"],
    aliases: ["Element Average Normal Stress", "Center Stress"]
  },
  "tau_max": {
    name: "Maximum In-Plane Shear Stress",
    symbol: "\\tau_{max}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Maximum In-Plane Shear Stress", "Principal Shear Stress"],
    symbolAliases: ["\\tau_{max}"],
    aliases: ["Maximum In-Plane Shear Stress", "Principal Shear Stress"]
  },
  "n_DE": {
    name: "Distortion Energy Safety Factor",
    symbol: "n_{DE}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Distortion Energy Safety Factor", "von Mises Factor of Safety"],
    symbolAliases: ["n_{DE}"],
    aliases: ["Distortion Energy Safety Factor", "von Mises Factor of Safety"]
  },
  "n_MSS": {
    name: "Maximum Shear Stress Safety Factor",
    symbol: "n_{MSS}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Maximum Shear Stress Safety Factor", "Tresca Factor of Safety"],
    symbolAliases: ["n_{MSS}"],
    aliases: ["Maximum Shear Stress Safety Factor", "Tresca Factor of Safety"]
  }
});
