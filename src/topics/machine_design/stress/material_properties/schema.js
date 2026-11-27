/**
 * src/topics/machine_design/stress/material_properties/schema.js
 * Schema for Material Properties, Tensile Testing & Elastic Constants (Part I, Sec. 1-2).
 */

import { STRESS_BASE_VARS } from "../../common/stress_base_schema.js";
import { DIMENSIONS } from "../../../../core/dimensions.js";

export const MATERIAL_PROPERTIES_VARS_DB = Object.freeze({
  F: STRESS_BASE_VARS.F,
  sigma: STRESS_BASE_VARS.sigma,
  tau: STRESS_BASE_VARS.tau,
  E: STRESS_BASE_VARS.E,
  G: STRESS_BASE_VARS.G,
  nu: STRESS_BASE_VARS.nu,
  epsilon: STRESS_BASE_VARS.epsilon,
  gamma: STRESS_BASE_VARS.gamma,
  S_y: STRESS_BASE_VARS.S_y,
  n_s: STRESS_BASE_VARS.n_s,

  "d_0": {
    name: "Initial Specimen Diameter",
    symbol: "d_0",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Initial Specimen Diameter", "Original Bar Diameter", "Gage Diameter"],
    symbolAliases: ["d_0", "D_0"],
    aliases: ["Initial Specimen Diameter", "Original Bar Diameter", "Gage Diameter"]
  },
  "A_0": {
    name: "Original Cross-Sectional Area",
    symbol: "A_0",
    dimension: DIMENSIONS.AREA,
    unit: "mm^2",
    nameAliases: ["Original Cross-Sectional Area", "Initial Gage Area", "Nominal Section Area"],
    symbolAliases: ["A_0", "A_i"],
    aliases: ["Original Cross-Sectional Area", "Initial Gage Area", "Nominal Section Area"]
  },
  "L_0": {
    name: "Original Gage Length",
    symbol: "L_0",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Original Gage Length", "Initial Specimen Length", "Gage Length"],
    symbolAliases: ["L_0", "l_0"],
    aliases: ["Original Gage Length", "Initial Specimen Length", "Gage Length"]
  },
  "delta": {
    name: "Elastic Axial Elongation",
    symbol: "\\delta",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Elastic Axial Elongation", "Axial Extension", "Elastic Deformation"],
    symbolAliases: ["\\delta", "\\Delta L"],
    aliases: ["Elastic Axial Elongation", "Axial Extension", "Elastic Deformation"]
  },
  "epsilon_lat": {
    name: "Lateral Strain Magnitude",
    symbol: "\\varepsilon_{lat}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Lateral Strain Magnitude", "Transverse Contraction Strain", "Radial Strain"],
    symbolAliases: ["\\varepsilon_{lat}", "\\varepsilon_t"],
    aliases: ["Lateral Strain Magnitude", "Transverse Contraction Strain", "Radial Strain"]
  },
  "delta_d": {
    name: "Lateral Diameter Contraction",
    symbol: "\\Delta d",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Lateral Diameter Contraction", "Transverse Diameter Change"],
    symbolAliases: ["\\Delta d", "\\delta_d"],
    aliases: ["Lateral Diameter Contraction", "Transverse Diameter Change"]
  },
  "K": {
    name: "Bulk Modulus",
    symbol: "K",
    dimension: DIMENSIONS.MODULUS,
    unit: "GPa",
    nameAliases: ["Bulk Modulus", "Volumetric Elastic Modulus"],
    symbolAliases: ["K", "B"],
    aliases: ["Bulk Modulus", "Volumetric Elastic Modulus"]
  },
  "p_h": {
    name: "Hydrostatic Pressure",
    symbol: "p_h",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Hydrostatic Pressure", "Uniform Confining Pressure"],
    symbolAliases: ["p_h", "p"],
    aliases: ["Hydrostatic Pressure", "Uniform Confining Pressure"]
  },
  "eps_v": {
    name: "Volumetric Strain",
    symbol: "\\varepsilon_v",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Volumetric Strain", "Dilatation", "Unit Volume Change"],
    symbolAliases: ["\\varepsilon_v", "\\theta_v"],
    aliases: ["Volumetric Strain", "Dilatation", "Unit Volume Change"]
  },
  "eps_y": {
    name: "Yield Strain",
    symbol: "\\varepsilon_y",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Yield Strain", "Elastic Limit Strain"],
    symbolAliases: ["\\varepsilon_y", "e_y"],
    aliases: ["Yield Strain", "Elastic Limit Strain"]
  },
  "u_r": {
    name: "Modulus of Resilience",
    symbol: "u_r",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Modulus of Resilience", "Elastic Strain Energy Density"],
    symbolAliases: ["u_r", "U_r"],
    aliases: ["Modulus of Resilience", "Elastic Strain Energy Density"]
  },
  "L_f": {
    name: "Final Gage Length at Fracture",
    symbol: "L_f",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Final Gage Length at Fracture", "Fracture Length"],
    symbolAliases: ["L_f", "l_f"],
    aliases: ["Final Gage Length at Fracture", "Fracture Length"]
  },
  "d_f": {
    name: "Final Necked Diameter",
    symbol: "d_f",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Final Necked Diameter", "Fracture Diameter"],
    symbolAliases: ["d_f", "D_f"],
    aliases: ["Final Necked Diameter", "Fracture Diameter"]
  },
  "A_f": {
    name: "Final Fracture Area",
    symbol: "A_f",
    dimension: DIMENSIONS.AREA,
    unit: "mm^2",
    nameAliases: ["Final Fracture Area", "Reduced Necked Area"],
    symbolAliases: ["A_f"],
    aliases: ["Final Fracture Area", "Reduced Necked Area"]
  },
  "pct_EL": {
    name: "Percent Elongation",
    symbol: "\\%EL",
    dimension: DIMENSIONS.PERCENTAGE,
    unit: "%",
    nameAliases: ["Percent Elongation", "Ductility Elongation Percentage"],
    symbolAliases: ["\\%EL", "EL"],
    aliases: ["Percent Elongation", "Ductility Elongation Percentage"]
  },
  "pct_RA": {
    name: "Percent Reduction in Area",
    symbol: "\\%RA",
    dimension: DIMENSIONS.PERCENTAGE,
    unit: "%",
    nameAliases: ["Percent Reduction in Area", "Area Reduction Percentage"],
    symbolAliases: ["\\%RA", "RA"],
    aliases: ["Percent Reduction in Area", "Area Reduction Percentage"]
  },
  "eps_f_true": {
    name: "True Fracture Strain",
    symbol: "\\varepsilon_{f,t}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["True Fracture Strain", "Logarithmic Fracture Strain"],
    symbolAliases: ["\\varepsilon_{f,t}", "\\tilde{\\varepsilon}_f"],
    aliases: ["True Fracture Strain", "Logarithmic Fracture Strain"]
  },
  "eps_t": {
    name: "True Axial Strain",
    symbol: "\\varepsilon_t",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["True Axial Strain", "Logarithmic Axial Strain"],
    symbolAliases: ["\\varepsilon_t", "\\tilde{\\varepsilon}"],
    aliases: ["True Axial Strain", "Logarithmic Axial Strain"]
  },
  "sigma_t": {
    name: "True Normal Stress",
    symbol: "\\sigma_t",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["True Normal Stress", "Instantaneous True Stress"],
    symbolAliases: ["\\sigma_t", "\\tilde{\\sigma}"],
    aliases: ["True Normal Stress", "Instantaneous True Stress"]
  }
});
