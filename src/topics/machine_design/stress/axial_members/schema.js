/**
 * src/topics/machine_design/stress/axial_members/schema.js
 * Schema for Stepped, Series & Statically Indeterminate Axial Bars (Part II, Sec. 3).
 */

import { DIMENSIONS } from "../../../../core/dimensions.js";

export const AXIAL_MEMBERS_VARS_DB = Object.freeze({
  "P": {
    name: "Applied Axial Force",
    symbol: "P",
    dimension: DIMENSIONS.FORCE,
    unit: "kN",
    nameAliases: ["Applied Axial Force", "Junction Axial Load", "External Axial Force"],
    symbolAliases: ["P", "F"],
    aliases: ["Applied Axial Force", "Junction Axial Load", "External Axial Force"]
  },
  "R_1": {
    name: "Segment 1 Internal Load",
    symbol: "R_1",
    dimension: DIMENSIONS.FORCE,
    unit: "kN",
    nameAliases: ["Segment 1 Internal Load", "Left Wall Reaction", "Bar 1 Axial Force"],
    symbolAliases: ["R_1", "P_1", "F_1"],
    aliases: ["Segment 1 Internal Load", "Left Wall Reaction", "Bar 1 Axial Force"]
  },
  "R_2": {
    name: "Segment 2 Internal Load",
    symbol: "R_2",
    dimension: DIMENSIONS.FORCE,
    unit: "kN",
    nameAliases: ["Segment 2 Internal Load", "Right Wall Reaction", "Bar 2 Axial Force"],
    symbolAliases: ["R_2", "P_2", "F_2"],
    aliases: ["Segment 2 Internal Load", "Right Wall Reaction", "Bar 2 Axial Force"]
  },
  "A_1": {
    name: "Segment 1 Cross-Sectional Area",
    symbol: "A_1",
    dimension: DIMENSIONS.AREA,
    unit: "mm^2",
    nameAliases: ["Segment 1 Cross-Sectional Area", "Bar 1 Section Area"],
    symbolAliases: ["A_1"],
    aliases: ["Segment 1 Cross-Sectional Area", "Bar 1 Section Area"]
  },
  "A_2": {
    name: "Segment 2 Cross-Sectional Area",
    symbol: "A_2",
    dimension: DIMENSIONS.AREA,
    unit: "mm^2",
    nameAliases: ["Segment 2 Cross-Sectional Area", "Bar 2 Section Area"],
    symbolAliases: ["A_2"],
    aliases: ["Segment 2 Cross-Sectional Area", "Bar 2 Section Area"]
  },
  "L_1": {
    name: "Segment 1 Length",
    symbol: "L_1",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Segment 1 Length", "Bar 1 Length"],
    symbolAliases: ["L_1"],
    aliases: ["Segment 1 Length", "Bar 1 Length"]
  },
  "L_2": {
    name: "Segment 2 Length",
    symbol: "L_2",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Segment 2 Length", "Bar 2 Length"],
    symbolAliases: ["L_2"],
    aliases: ["Segment 2 Length", "Bar 2 Length"]
  },
  "L_tot": {
    name: "Total Assembly Length",
    symbol: "L_T",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Total Assembly Length", "Overall Bar Length"],
    symbolAliases: ["L_T", "L"],
    aliases: ["Total Assembly Length", "Overall Bar Length"]
  },
  "E_1": {
    name: "Segment 1 Modulus of Elasticity",
    symbol: "E_1",
    dimension: DIMENSIONS.MODULUS,
    unit: "GPa",
    nameAliases: ["Segment 1 Modulus of Elasticity", "Bar 1 Young's Modulus"],
    symbolAliases: ["E_1"],
    aliases: ["Segment 1 Modulus of Elasticity", "Bar 1 Young's Modulus"]
  },
  "E_2": {
    name: "Segment 2 Modulus of Elasticity",
    symbol: "E_2",
    dimension: DIMENSIONS.MODULUS,
    unit: "GPa",
    nameAliases: ["Segment 2 Modulus of Elasticity", "Bar 2 Young's Modulus"],
    symbolAliases: ["E_2"],
    aliases: ["Segment 2 Modulus of Elasticity", "Bar 2 Young's Modulus"]
  },
  "k_1": {
    name: "Segment 1 Axial Stiffness",
    symbol: "k_1",
    dimension: DIMENSIONS.STIFFNESS,
    unit: "kN/mm",
    nameAliases: ["Segment 1 Axial Stiffness", "Bar 1 Axial Rigidity Rate"],
    symbolAliases: ["k_1"],
    aliases: ["Segment 1 Axial Stiffness", "Bar 1 Axial Rigidity Rate"]
  },
  "k_2": {
    name: "Segment 2 Axial Stiffness",
    symbol: "k_2",
    dimension: DIMENSIONS.STIFFNESS,
    unit: "kN/mm",
    nameAliases: ["Segment 2 Axial Stiffness", "Bar 2 Axial Rigidity Rate"],
    symbolAliases: ["k_2"],
    aliases: ["Segment 2 Axial Stiffness", "Bar 2 Axial Rigidity Rate"]
  },
  "k_par": {
    name: "Fixed-End Equivalent Stiffness",
    symbol: "k_{par}",
    dimension: DIMENSIONS.STIFFNESS,
    unit: "kN/mm",
    nameAliases: ["Fixed-End Equivalent Stiffness", "Parallel Axial Stiffness"],
    symbolAliases: ["k_{par}", "k_{eq}"],
    aliases: ["Fixed-End Equivalent Stiffness", "Parallel Axial Stiffness"]
  },
  "k_ser": {
    name: "Unrestrained Series Stiffness",
    symbol: "k_{ser}",
    dimension: DIMENSIONS.STIFFNESS,
    unit: "kN/mm",
    nameAliases: ["Unrestrained Series Stiffness", "Series Axial Stiffness"],
    symbolAliases: ["k_{ser}"],
    aliases: ["Unrestrained Series Stiffness", "Series Axial Stiffness"]
  },
  "delta_j": {
    name: "Junction Axial Displacement",
    symbol: "\\delta_j",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Junction Axial Displacement", "Fixed-End Step Deflection"],
    symbolAliases: ["\\delta_j", "\\delta"],
    aliases: ["Junction Axial Displacement", "Fixed-End Step Deflection"]
  },
  "sigma_1": {
    name: "Segment 1 Axial Stress",
    symbol: "\\sigma_1",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Segment 1 Axial Stress", "Bar 1 Normal Stress"],
    symbolAliases: ["\\sigma_1"],
    aliases: ["Segment 1 Axial Stress", "Bar 1 Normal Stress"]
  },
  "sigma_2": {
    name: "Segment 2 Axial Stress",
    symbol: "\\sigma_2",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Segment 2 Axial Stress", "Bar 2 Normal Stress"],
    symbolAliases: ["\\sigma_2"],
    aliases: ["Segment 2 Axial Stress", "Bar 2 Normal Stress"]
  },
  "eps_1": {
    name: "Segment 1 Axial Strain",
    symbol: "\\varepsilon_1",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Segment 1 Axial Strain", "Bar 1 Normal Strain"],
    symbolAliases: ["\\varepsilon_1"],
    aliases: ["Segment 1 Axial Strain", "Bar 1 Normal Strain"]
  },
  "eps_2": {
    name: "Segment 2 Axial Strain",
    symbol: "\\varepsilon_2",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Segment 2 Axial Strain", "Bar 2 Normal Strain"],
    symbolAliases: ["\\varepsilon_2"],
    aliases: ["Segment 2 Axial Strain", "Bar 2 Normal Strain"]
  },
  "delta_1_ser": {
    name: "Segment 1 Unrestrained Elongation",
    symbol: "\\delta_{1,s}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Segment 1 Unrestrained Elongation", "Series Segment 1 Extension"],
    symbolAliases: ["\\delta_{1,s}", "\\delta_1"],
    aliases: ["Segment 1 Unrestrained Elongation", "Series Segment 1 Extension"]
  },
  "delta_2_ser": {
    name: "Segment 2 Unrestrained Elongation",
    symbol: "\\delta_{2,s}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Segment 2 Unrestrained Elongation", "Series Segment 2 Extension"],
    symbolAliases: ["\\delta_{2,s}", "\\delta_2"],
    aliases: ["Segment 2 Unrestrained Elongation", "Series Segment 2 Extension"]
  },
  "delta_ser": {
    name: "Total Unrestrained Series Elongation",
    symbol: "\\delta_{ser}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Total Unrestrained Series Elongation", "Total Stepped Bar Extension"],
    symbolAliases: ["\\delta_{ser}", "\\delta_T"],
    aliases: ["Total Unrestrained Series Elongation", "Total Stepped Bar Extension"]
  }
});
