/**
 * src/topics/machine_design/stress/static_failure/schema.js
 * Schema for Static Failure Theories (Ductile & Brittle) and Allowable Stress Design (Part IX, Sec. 16-17).
 */

import { STRESS_BASE_VARS } from "../../common/stress_base_schema.js";
import { DIMENSIONS } from "../../../../core/dimensions.js";

export const STATIC_FAILURE_VARS_DB = Object.freeze({
  sigma_1: STRESS_BASE_VARS.sigma_1,
  sigma_2: STRESS_BASE_VARS.sigma_2,
  S_y: STRESS_BASE_VARS.S_y,
  nu: STRESS_BASE_VARS.nu,
  S_ut: STRESS_BASE_VARS.S_ut,
  sigma_vm: STRESS_BASE_VARS.sigma_vm,
  sigma_allow: STRESS_BASE_VARS.sigma_allow,
  F: STRESS_BASE_VARS.F,

  "S_uc": {
    name: "Ultimate Compressive Strength",
    symbol: "S_{uc}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Ultimate Compressive Strength", "Compressive Fracture Strength"],
    symbolAliases: ["S_{uc}", "S_c"],
    aliases: ["Ultimate Compressive Strength", "Compressive Fracture Strength"]
  },
  "tau_max": {
    name: "Maximum Principal Shear Stress",
    symbol: "\\tau_{max}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Maximum Principal Shear Stress", "Tresca Shear Stress"],
    symbolAliases: ["\\tau_{max}"],
    aliases: ["Maximum Principal Shear Stress", "Tresca Shear Stress"]
  },
  "S_sy_MSS": {
    name: "Tresca Shear Yield Strength",
    symbol: "S_{sy,MSS}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Tresca Shear Yield Strength", "MSS Shear Strength"],
    symbolAliases: ["S_{sy,MSS}"],
    aliases: ["Tresca Shear Yield Strength", "MSS Shear Strength"]
  },
  "n_MSS": {
    name: "Maximum Shear Stress Safety Factor (Tresca)",
    symbol: "n_{MSS}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Maximum Shear Stress Safety Factor (Tresca)", "Tresca-Guest Factor of Safety"],
    symbolAliases: ["n_{MSS}", "n_{Tresca}"],
    aliases: ["Maximum Shear Stress Safety Factor (Tresca)", "Tresca-Guest Factor of Safety"]
  },
  "S_sy_DE": {
    name: "Distortion Energy Shear Yield Strength",
    symbol: "S_{sy,DE}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Distortion Energy Shear Yield Strength", "von Mises Shear Yield Strength"],
    symbolAliases: ["S_{sy,DE}"],
    aliases: ["Distortion Energy Shear Yield Strength", "von Mises Shear Yield Strength"]
  },
  "n_DE": {
    name: "Distortion Energy Safety Factor (von Mises)",
    symbol: "n_{DE}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Distortion Energy Safety Factor (von Mises)", "von Mises Factor of Safety"],
    symbolAliases: ["n_{DE}", "n_{VM}"],
    aliases: ["Distortion Energy Safety Factor (von Mises)", "von Mises Factor of Safety"]
  },
  "sigma_SV": {
    name: "Saint-Venant Equivalent Stress",
    symbol: "\\sigma_{SV}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Saint-Venant Equivalent Stress", "Maximum Principal Strain Equivalent Stress"],
    symbolAliases: ["\\sigma_{SV}"],
    aliases: ["Saint-Venant Equivalent Stress", "Maximum Principal Strain Equivalent Stress"]
  },
  "n_SV": {
    name: "Maximum Principal Strain Safety Factor (Saint-Venant)",
    symbol: "n_{SV}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Maximum Principal Strain Safety Factor (Saint-Venant)", "Saint-Venant Safety Factor"],
    symbolAliases: ["n_{SV}"],
    aliases: ["Maximum Principal Strain Safety Factor (Saint-Venant)", "Saint-Venant Safety Factor"]
  },
  "sigma_BH": {
    name: "Beltrami-Haigh Equivalent Stress",
    symbol: "\\sigma_{BH}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Beltrami-Haigh Equivalent Stress", "Total Strain Energy Equivalent Stress"],
    symbolAliases: ["\\sigma_{BH}"],
    aliases: ["Beltrami-Haigh Equivalent Stress", "Total Strain Energy Equivalent Stress"]
  },
  "n_BH": {
    name: "Total Strain Energy Safety Factor (Beltrami-Haigh)",
    symbol: "n_{BH}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Total Strain Energy Safety Factor (Beltrami-Haigh)", "Beltrami-Haigh Safety Factor"],
    symbolAliases: ["n_{BH}"],
    aliases: ["Total Strain Energy Safety Factor (Beltrami-Haigh)", "Beltrami-Haigh Safety Factor"]
  },
  "n_MPS": {
    name: "Maximum Principal Stress Safety Factor (Rankine)",
    symbol: "n_{MPS}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Maximum Principal Stress Safety Factor (Rankine)", "Rankine Brittle Safety Factor"],
    symbolAliases: ["n_{MPS}", "n_{Rankine}"],
    aliases: ["Maximum Principal Stress Safety Factor (Rankine)", "Rankine Brittle Safety Factor"]
  },
  "n_CM": {
    name: "Coulomb-Mohr Safety Factor",
    symbol: "n_{CM}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Coulomb-Mohr Safety Factor", "Brittle Coulomb-Mohr Factor of Safety"],
    symbolAliases: ["n_{CM}"],
    aliases: ["Coulomb-Mohr Safety Factor", "Brittle Coulomb-Mohr Factor of Safety"]
  },
  "n_MM": {
    name: "Modified Mohr Safety Factor",
    symbol: "n_{MM}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Modified Mohr Safety Factor", "Modified Mohr Brittle Factor of Safety"],
    symbolAliases: ["n_{MM}"],
    aliases: ["Modified Mohr Safety Factor", "Modified Mohr Brittle Factor of Safety"]
  },
  "n_des": {
    name: "Target Design Factor",
    symbol: "n_{des}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Target Design Factor", "Required Safety Factor"],
    symbolAliases: ["n_{des}", "N_d"],
    aliases: ["Target Design Factor", "Required Safety Factor"]
  },
  "tau_allow": {
    name: "Allowable Shear Stress",
    symbol: "\\tau_{allow}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Allowable Shear Stress", "Working Shear Stress"],
    symbolAliases: ["\\tau_{allow}"],
    aliases: ["Allowable Shear Stress", "Working Shear Stress"]
  },
  "A_req": {
    name: "Minimum Required Cross-Sectional Area",
    symbol: "A_{req}",
    dimension: DIMENSIONS.AREA,
    unit: "mm^2",
    nameAliases: ["Minimum Required Cross-Sectional Area", "Design Tensile Area"],
    symbolAliases: ["A_{req}", "A_{min}"],
    aliases: ["Minimum Required Cross-Sectional Area", "Design Tensile Area"]
  }
});
