/**
 * src/topics/machine_design/stress/shear_and_bearing/schema.js
 * Schema for Direct Shear, Bearing, Net-Section Tension & Tear-Out Connections (Part III, Sec. 5-6).
 */

import { STRESS_BASE_VARS } from "../../common/stress_base_schema.js";
import { DIMENSIONS } from "../../../../core/dimensions.js";

export const SHEAR_BEARING_VARS_DB = Object.freeze({
  F: STRESS_BASE_VARS.F,
  tau: STRESS_BASE_VARS.tau,
  sigma_br: STRESS_BASE_VARS.sigma_br,
  S_y: STRESS_BASE_VARS.S_y,

  "d": {
    name: "Pin Diameter",
    symbol: "d",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Pin Diameter", "Fastener Diameter", "Rivet Diameter"],
    symbolAliases: ["d", "d_p"],
    aliases: ["Pin Diameter", "Fastener Diameter", "Rivet Diameter"]
  },
  "n_s": {
    name: "Number of Shear Planes",
    symbol: "n_s",
    dimension: DIMENSIONS.COUNT,
    unit: "dimless",
    isInteger: true,
    nameAliases: ["Number of Shear Planes", "Shear Plane Count"],
    symbolAliases: ["n_s", "m_s"],
    aliases: ["Number of Shear Planes", "Shear Plane Count"]
  },
  "n_f": {
    name: "Number of Fasteners",
    symbol: "n_f",
    dimension: DIMENSIONS.COUNT,
    unit: "dimless",
    isInteger: true,
    nameAliases: ["Number of Fasteners", "Pin Count", "Rivet Count"],
    symbolAliases: ["n_f", "N_r"],
    aliases: ["Number of Fasteners", "Pin Count", "Rivet Count"]
  },
  "t": {
    name: "Plate Thickness",
    symbol: "t",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Plate Thickness", "Lug Thickness"],
    symbolAliases: ["t"],
    aliases: ["Plate Thickness", "Lug Thickness"]
  },
  "w": {
    name: "Plate Width",
    symbol: "w",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Plate Width", "Gross Strap Width"],
    symbolAliases: ["w", "b"],
    aliases: ["Plate Width", "Gross Strap Width"]
  },
  "e_edge": {
    name: "End Edge Distance",
    symbol: "e",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["End Edge Distance", "Shear-Out Distance"],
    symbolAliases: ["e", "a"],
    aliases: ["End Edge Distance", "Shear-Out Distance"]
  },
  "A_s": {
    name: "Fastener Shear Area",
    symbol: "A_s",
    dimension: DIMENSIONS.AREA,
    unit: "mm^2",
    nameAliases: ["Fastener Shear Area", "Pin Cross-Sectional Area"],
    symbolAliases: ["A_s"],
    aliases: ["Fastener Shear Area", "Pin Cross-Sectional Area"]
  },
  "A_b": {
    name: "Projected Bearing Area",
    symbol: "A_b",
    dimension: DIMENSIONS.AREA,
    unit: "mm^2",
    nameAliases: ["Projected Bearing Area", "Contact Bearing Area"],
    symbolAliases: ["A_b"],
    aliases: ["Projected Bearing Area", "Contact Bearing Area"]
  },
  "A_net": {
    name: "Net-Section Tensile Area",
    symbol: "A_{net}",
    dimension: DIMENSIONS.AREA,
    unit: "mm^2",
    nameAliases: ["Net-Section Tensile Area", "Reduced Plate Tensile Area"],
    symbolAliases: ["A_{net}", "A_t"],
    aliases: ["Net-Section Tensile Area", "Reduced Plate Tensile Area"]
  },
  "sigma_net": {
    name: "Net-Section Tensile Stress",
    symbol: "\\sigma_{net}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Net-Section Tensile Stress", "Plate Ligament Tensile Stress"],
    symbolAliases: ["\\sigma_{net}", "\\sigma_t"],
    aliases: ["Net-Section Tensile Stress", "Plate Ligament Tensile Stress"]
  },
  "A_tear": {
    name: "Edge Tear-Out Area",
    symbol: "A_{tear}",
    dimension: DIMENSIONS.AREA,
    unit: "mm^2",
    nameAliases: ["Edge Tear-Out Area", "Shear-Out Area"],
    symbolAliases: ["A_{tear}"],
    aliases: ["Edge Tear-Out Area", "Shear-Out Area"]
  },
  "tau_tear": {
    name: "Edge Tear-Out Shear Stress",
    symbol: "\\tau_{tear}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Edge Tear-Out Shear Stress", "Plate Shear-Out Stress"],
    symbolAliases: ["\\tau_{tear}"],
    aliases: ["Edge Tear-Out Shear Stress", "Plate Shear-Out Stress"]
  },
  "S_sy": {
    name: "Shear Yield Strength",
    symbol: "S_{sy}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Shear Yield Strength", "Allowable Shear Yield Stress"],
    symbolAliases: ["S_{sy}", "\\tau_y"],
    aliases: ["Shear Yield Strength", "Allowable Shear Yield Stress"]
  },
  "S_yc": {
    name: "Bearing Yield Strength",
    symbol: "S_{yc}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Bearing Yield Strength", "Compressive Crushing Strength"],
    symbolAliases: ["S_{yc}", "S_c"],
    aliases: ["Bearing Yield Strength", "Compressive Crushing Strength"]
  },
  "n_sh": {
    name: "Shear Factor of Safety",
    symbol: "n_{sh}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Shear Factor of Safety", "Pin Shear Safety Factor"],
    symbolAliases: ["n_{sh}"],
    aliases: ["Shear Factor of Safety", "Pin Shear Safety Factor"]
  },
  "n_br": {
    name: "Bearing Factor of Safety",
    symbol: "n_{br}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Bearing Factor of Safety", "Crushing Safety Factor"],
    symbolAliases: ["n_{br}"],
    aliases: ["Bearing Factor of Safety", "Crushing Safety Factor"]
  },
  "n_tn": {
    name: "Net-Tension Factor of Safety",
    symbol: "n_{tn}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Net-Tension Factor of Safety", "Plate Tension Safety Factor"],
    symbolAliases: ["n_{tn}"],
    aliases: ["Net-Tension Factor of Safety", "Plate Tension Safety Factor"]
  },
  "n_tr": {
    name: "Tear-Out Factor of Safety",
    symbol: "n_{tr}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Tear-Out Factor of Safety", "Edge Shear-Out Safety Factor"],
    symbolAliases: ["n_{tr}"],
    aliases: ["Tear-Out Factor of Safety", "Edge Shear-Out Safety Factor"]
  }
});
