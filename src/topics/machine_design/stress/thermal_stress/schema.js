/**
 * src/topics/machine_design/stress/thermal_stress/schema.js
 * Schema for Thermal Expansion, Restrained & Composite Thermal Stress (Part II, Sec. 4).
 */

import { STRESS_BASE_VARS } from "../../common/stress_base_schema.js";
import { DIMENSIONS } from "../../../../core/dimensions.js";

export const THERMAL_STRESS_VARS_DB = Object.freeze({
  A: STRESS_BASE_VARS.A,
  E: STRESS_BASE_VARS.E,

  "T_i": {
    name: "Initial Temperature",
    symbol: "T_i",
    dimension: DIMENSIONS.TEMPERATURE,
    unit: "°C",
    nameAliases: ["Initial Temperature", "Reference Installation Temperature"],
    symbolAliases: ["T_i", "T_0"],
    aliases: ["Initial Temperature", "Reference Installation Temperature"]
  },
  "T_f": {
    name: "Final Temperature",
    symbol: "T_f",
    dimension: DIMENSIONS.TEMPERATURE,
    unit: "°C",
    nameAliases: ["Final Temperature", "Operating Temperature"],
    symbolAliases: ["T_f", "T_1"],
    aliases: ["Final Temperature", "Operating Temperature"]
  },
  "dT": {
    name: "Temperature Rise",
    symbol: "\\Delta T",
    dimension: DIMENSIONS.TEMPERATURE,
    unit: "Δ°C",
    nameAliases: ["Temperature Rise", "Temperature Change", "Thermal Difference"],
    symbolAliases: ["\\Delta T", "\\Delta t"],
    aliases: ["Temperature Rise", "Temperature Change", "Thermal Difference"]
  },
  "alpha_1": {
    name: "Primary Expansion Coefficient",
    symbol: "\\alpha_1",
    dimension: DIMENSIONS.THERMAL_EXPANSION,
    unit: "um/(m*Δ°C)",
    nameAliases: ["Primary Expansion Coefficient", "Bar Thermal Expansion Coefficient"],
    symbolAliases: ["\\alpha_1", "\\alpha"],
    aliases: ["Primary Expansion Coefficient", "Bar Thermal Expansion Coefficient"]
  },
  "alpha_2": {
    name: "Secondary Expansion Coefficient",
    symbol: "\\alpha_2",
    dimension: DIMENSIONS.THERMAL_EXPANSION,
    unit: "um/(m*Δ°C)",
    nameAliases: ["Secondary Expansion Coefficient", "Sleeve Thermal Expansion Coefficient"],
    symbolAliases: ["\\alpha_2"],
    aliases: ["Secondary Expansion Coefficient", "Sleeve Thermal Expansion Coefficient"]
  },
  "d_alpha": {
    name: "Differential Expansion Coefficient",
    symbol: "\\Delta\\alpha",
    dimension: DIMENSIONS.THERMAL_EXPANSION,
    unit: "um/(m*Δ°C)",
    nameAliases: ["Differential Expansion Coefficient", "Mismatch Expansion Coefficient"],
    symbolAliases: ["\\Delta\\alpha"],
    aliases: ["Differential Expansion Coefficient", "Mismatch Expansion Coefficient"]
  },
  "L": {
    name: "Member Length",
    symbol: "L",
    dimension: DIMENSIONS.LENGTH,
    unit: "m",
    nameAliases: ["Member Length", "Bar Length"],
    symbolAliases: ["L"],
    aliases: ["Member Length", "Bar Length"]
  },
  "k_b": {
    name: "Bar Axial Stiffness",
    symbol: "k_b",
    dimension: DIMENSIONS.STIFFNESS,
    unit: "kN/mm",
    nameAliases: ["Bar Axial Stiffness", "Member Axial Stiffness"],
    symbolAliases: ["k_b"],
    aliases: ["Bar Axial Stiffness", "Member Axial Stiffness"]
  },
  "eps_th": {
    name: "Free Thermal Strain",
    symbol: "\\varepsilon_{th}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Free Thermal Strain", "Unrestrained Thermal Strain"],
    symbolAliases: ["\\varepsilon_{th}", "\\varepsilon_T"],
    aliases: ["Free Thermal Strain", "Unrestrained Thermal Strain"]
  },
  "delta_th": {
    name: "Free Thermal Expansion",
    symbol: "\\delta_{th}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Free Thermal Expansion", "Unrestrained Thermal Elongation"],
    symbolAliases: ["\\delta_{th}", "\\delta_T"],
    aliases: ["Free Thermal Expansion", "Unrestrained Thermal Elongation"]
  },
  "sigma_th": {
    name: "Fully Restrained Thermal Stress",
    symbol: "\\sigma_{th}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Fully Restrained Thermal Stress", "Rigidly Restrained Thermal Stress"],
    symbolAliases: ["\\sigma_{th}", "\\sigma_T"],
    aliases: ["Fully Restrained Thermal Stress", "Rigidly Restrained Thermal Stress"]
  },
  "P_th": {
    name: "Fully Restrained Thermal Force",
    symbol: "P_{th}",
    dimension: DIMENSIONS.FORCE,
    unit: "kN",
    nameAliases: ["Fully Restrained Thermal Force", "Rigid Support Thermal Load"],
    symbolAliases: ["P_{th}", "F_{th}"],
    aliases: ["Fully Restrained Thermal Force", "Rigid Support Thermal Load"]
  },
  "delta_gap": {
    name: "Initial Expansion Gap",
    symbol: "\\delta_{gap}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Initial Expansion Gap", "End Clearance Gap"],
    symbolAliases: ["\\delta_{gap}", "c_{gap}"],
    aliases: ["Initial Expansion Gap", "End Clearance Gap"]
  },
  "delta_res": {
    name: "Restrained Thermal Deformation",
    symbol: "\\delta_{res}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Restrained Thermal Deformation", "Suppressed Expansion"],
    symbolAliases: ["\\delta_{res}"],
    aliases: ["Restrained Thermal Deformation", "Suppressed Expansion"]
  },
  "eps_res": {
    name: "Partially Restrained Strain",
    symbol: "\\varepsilon_{res}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Partially Restrained Strain", "Gapped Thermal Strain"],
    symbolAliases: ["\\varepsilon_{res}"],
    aliases: ["Partially Restrained Strain", "Gapped Thermal Strain"]
  },
  "sigma_part": {
    name: "Partially Restrained Thermal Stress",
    symbol: "\\sigma_{part}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Partially Restrained Thermal Stress", "Gapped Restraint Stress"],
    symbolAliases: ["\\sigma_{part}"],
    aliases: ["Partially Restrained Thermal Stress", "Gapped Restraint Stress"]
  },
  "k_s": {
    name: "Elastic Support Stiffness",
    symbol: "k_s",
    dimension: DIMENSIONS.STIFFNESS,
    unit: "kN/mm",
    nameAliases: ["Elastic Support Stiffness", "End Spring Stiffness"],
    symbolAliases: ["k_s"],
    aliases: ["Elastic Support Stiffness", "End Spring Stiffness"]
  },
  "k_comb": {
    name: "Support-Bar Series Stiffness",
    symbol: "k_{comb}",
    dimension: DIMENSIONS.STIFFNESS,
    unit: "kN/mm",
    nameAliases: ["Support-Bar Series Stiffness", "Effective Elastic Restraint Stiffness"],
    symbolAliases: ["k_{comb}"],
    aliases: ["Support-Bar Series Stiffness", "Effective Elastic Restraint Stiffness"]
  },
  "P_el": {
    name: "Elastically Restrained Thermal Force",
    symbol: "P_{el}",
    dimension: DIMENSIONS.FORCE,
    unit: "kN",
    nameAliases: ["Elastically Restrained Thermal Force", "Spring-Restrained Thermal Load"],
    symbolAliases: ["P_{el}"],
    aliases: ["Elastically Restrained Thermal Force", "Spring-Restrained Thermal Load"]
  },
  "delta_sp": {
    name: "Elastic Support Deflection",
    symbol: "\\delta_{sp}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Elastic Support Deflection", "Support Spring Compression"],
    symbolAliases: ["\\delta_{sp}"],
    aliases: ["Elastic Support Deflection", "Support Spring Compression"]
  },
  "sigma_el": {
    name: "Elastically Restrained Thermal Stress",
    symbol: "\\sigma_{el}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Elastically Restrained Thermal Stress", "Spring-Restrained Thermal Stress"],
    symbolAliases: ["\\sigma_{el}"],
    aliases: ["Elastically Restrained Thermal Stress", "Spring-Restrained Thermal Stress"]
  },
  "P_app": {
    name: "Applied Mechanical Axial Load",
    symbol: "P_{app}",
    dimension: DIMENSIONS.FORCE,
    unit: "kN",
    nameAliases: ["Applied Mechanical Axial Load", "External Mechanical Load"],
    symbolAliases: ["P_{app}"],
    aliases: ["Applied Mechanical Axial Load", "External Mechanical Load"]
  },
  "delta_mech": {
    name: "Mechanical Axial Elongation",
    symbol: "\\delta_{mech}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Mechanical Axial Elongation", "Load-Induced Extension"],
    symbolAliases: ["\\delta_{mech}"],
    aliases: ["Mechanical Axial Elongation", "Load-Induced Extension"]
  },
  "delta_tot": {
    name: "Combined Thermal-Mechanical Elongation",
    symbol: "\\delta_{tot}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Combined Thermal-Mechanical Elongation", "Net Combined Elongation"],
    symbolAliases: ["\\delta_{tot}"],
    aliases: ["Combined Thermal-Mechanical Elongation", "Net Combined Elongation"]
  },
  "k_2": {
    name: "Sleeve Axial Stiffness",
    symbol: "k_2",
    dimension: DIMENSIONS.STIFFNESS,
    unit: "kN/mm",
    nameAliases: ["Sleeve Axial Stiffness", "Companion Member Stiffness"],
    symbolAliases: ["k_2"],
    aliases: ["Sleeve Axial Stiffness", "Companion Member Stiffness"]
  },
  "k_comp": {
    name: "Composite Series Stiffness",
    symbol: "k_{comp}",
    dimension: DIMENSIONS.STIFFNESS,
    unit: "kN/mm",
    nameAliases: ["Composite Series Stiffness", "Bimetallic Effective Stiffness"],
    symbolAliases: ["k_{comp}"],
    aliases: ["Composite Series Stiffness", "Bimetallic Effective Stiffness"]
  },
  "P_comp": {
    name: "Composite Thermal Interaction Force",
    symbol: "P_{comp}",
    dimension: DIMENSIONS.FORCE,
    unit: "kN",
    nameAliases: ["Composite Thermal Interaction Force", "Bimetallic Thermal Force"],
    symbolAliases: ["P_{comp}"],
    aliases: ["Composite Thermal Interaction Force", "Bimetallic Thermal Force"]
  }
});
