/**
 * src/topics/machine_design/common/stress_base_schema.js
 * Shared Machine Design mechanics-of-materials variable schema.
 * Designed for reuse across Stress, Shafting, Couplings, Keys, Pressure Vessels, and Bolted Joints.
 */

import { DIMENSIONS } from "../../../core/dimensions.js";

export const STRESS_BASE_VARS = Object.freeze({
  "F": {
    name: "Applied Force",
    symbol: "F",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Applied Force", "External Load", "Applied Axial Load"],
    symbolAliases: ["F", "P", "W"],
    aliases: ["Applied Force", "External Load", "Applied Axial Load"]
  },
  "V": {
    name: "Transverse Shear Force",
    symbol: "V",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Transverse Shear Force", "Internal Shear Force", "Beam Shear Load"],
    symbolAliases: ["V", "V_s"],
    aliases: ["Transverse Shear Force", "Internal Shear Force", "Beam Shear Load"]
  },
  "A": {
    name: "Cross-Sectional Area",
    symbol: "A",
    dimension: DIMENSIONS.AREA,
    unit: "mm^2",
    nameAliases: ["Cross-Sectional Area", "Section Area", "Transverse Area"],
    symbolAliases: ["A", "A_c"],
    aliases: ["Cross-Sectional Area", "Section Area", "Transverse Area"]
  },
  "sigma": {
    name: "Normal Stress",
    symbol: "\\sigma",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Normal Stress", "Direct Normal Stress", "Axial Normal Stress"],
    symbolAliases: ["\\sigma", "s_t"],
    aliases: ["Normal Stress", "Direct Normal Stress", "Axial Normal Stress"]
  },
  "tau": {
    name: "Shear Stress",
    symbol: "\\tau",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Shear Stress", "Direct Shear Stress", "Average Shear Stress"],
    symbolAliases: ["\\tau", "s_s"],
    aliases: ["Shear Stress", "Direct Shear Stress", "Average Shear Stress"]
  },
  "sigma_br": {
    name: "Bearing Stress",
    symbol: "\\sigma_{br}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Bearing Stress", "Projected Contact Stress", "Crushing Stress"],
    symbolAliases: ["\\sigma_{br}", "s_c", "\\sigma_c"],
    aliases: ["Bearing Stress", "Projected Contact Stress", "Crushing Stress"]
  },
  "sigma_b": {
    name: "Bending Stress",
    symbol: "\\sigma_b",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Bending Stress", "Flexural Stress", "Maximum Flexure Stress"],
    symbolAliases: ["\\sigma_b", "s_b", "\\sigma_f"],
    aliases: ["Bending Stress", "Flexural Stress", "Maximum Flexure Stress"]
  },
  "E": {
    name: "Modulus of Elasticity",
    symbol: "E",
    dimension: DIMENSIONS.MODULUS,
    unit: "GPa",
    nameAliases: ["Modulus of Elasticity", "Young's Modulus", "Tensile Elastic Modulus"],
    symbolAliases: ["E", "E_y"],
    aliases: ["Modulus of Elasticity", "Young's Modulus", "Tensile Elastic Modulus"]
  },
  "G": {
    name: "Modulus of Rigidity",
    symbol: "G",
    dimension: DIMENSIONS.MODULUS,
    unit: "GPa",
    nameAliases: ["Modulus of Rigidity", "Shear Modulus", "Torsional Modulus"],
    symbolAliases: ["G", "E_s"],
    aliases: ["Modulus of Rigidity", "Shear Modulus", "Torsional Modulus"]
  },
  "nu": {
    name: "Poisson's Ratio",
    symbol: "\\nu",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Poisson's Ratio", "Lateral Strain Ratio"],
    symbolAliases: ["\\nu", "\\mu"],
    aliases: ["Poisson's Ratio", "Lateral Strain Ratio"]
  },
  "epsilon": {
    name: "Normal Strain",
    symbol: "\\varepsilon",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Normal Strain", "Axial Strain", "Unit Elongation"],
    symbolAliases: ["\\varepsilon", "e_a"],
    aliases: ["Normal Strain", "Axial Strain", "Unit Elongation"]
  },
  "gamma": {
    name: "Shear Strain",
    symbol: "\\gamma",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Shear Strain", "Angular Shear Distortion"],
    symbolAliases: ["\\gamma", "\\gamma_{xy}"],
    aliases: ["Shear Strain", "Angular Shear Distortion"]
  },
  "S_y": {
    name: "Yield Strength",
    symbol: "S_y",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Yield Strength", "Tensile Yield Strength", "Yield Point Stress"],
    symbolAliases: ["S_y", "\\sigma_y", "S_{yp}"],
    aliases: ["Yield Strength", "Tensile Yield Strength", "Yield Point Stress"]
  },
  "S_ut": {
    name: "Ultimate Tensile Strength",
    symbol: "S_{ut}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Ultimate Tensile Strength", "Tensile Ultimate Strength", "Ultimate Strength"],
    symbolAliases: ["S_{ut}", "S_u", "\\sigma_u"],
    aliases: ["Ultimate Tensile Strength", "Tensile Ultimate Strength", "Ultimate Strength"]
  },
  "n_s": {
    name: "Factor of Safety",
    symbol: "n",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Factor of Safety", "Safety Factor", "Design Factor"],
    symbolAliases: ["n", "N_{fs}", "FS"],
    aliases: ["Factor of Safety", "Safety Factor", "Design Factor"]
  },
  "sigma_allow": {
    name: "Allowable Normal Stress",
    symbol: "\\sigma_{allow}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Allowable Normal Stress", "Working Normal Stress", "Permissible Normal Stress"],
    symbolAliases: ["\\sigma_{allow}", "s_w", "\\sigma_w"],
    aliases: ["Allowable Normal Stress", "Working Normal Stress", "Permissible Normal Stress"]
  },
  "M": {
    name: "Bending Moment",
    symbol: "M",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Bending Moment", "Internal Bending Moment", "Flexural Moment"],
    symbolAliases: ["M", "M_b"],
    aliases: ["Bending Moment", "Internal Bending Moment", "Flexural Moment"]
  },
  "I": {
    name: "Moment of Inertia",
    symbol: "I",
    dimension: DIMENSIONS.SECOND_MOMENT_OF_AREA,
    unit: "mm^4",
    nameAliases: ["Moment of Inertia", "Second Moment of Area", "Area Moment of Inertia"],
    symbolAliases: ["I", "I_x"],
    aliases: ["Moment of Inertia", "Second Moment of Area", "Area Moment of Inertia"]
  },
  "c": {
    name: "Extreme Fiber Distance",
    symbol: "c",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Extreme Fiber Distance", "Outer Fiber Distance", "Neutral-Axis Distance"],
    symbolAliases: ["c", "y_{max}"],
    aliases: ["Extreme Fiber Distance", "Outer Fiber Distance", "Neutral-Axis Distance"]
  },
  "Z": {
    name: "Section Modulus",
    symbol: "Z",
    dimension: DIMENSIONS.SECTION_MODULUS,
    unit: "mm^3",
    nameAliases: ["Section Modulus", "Elastic Section Modulus"],
    symbolAliases: ["Z", "S_x"],
    aliases: ["Section Modulus", "Elastic Section Modulus"]
  },
  "T": {
    name: "Applied Torque",
    symbol: "T",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    nameAliases: ["Applied Torque", "Twisting Moment", "Torsional Moment"],
    symbolAliases: ["T", "M_t"],
    aliases: ["Applied Torque", "Twisting Moment", "Torsional Moment"]
  },
  "J": {
    name: "Polar Moment of Inertia",
    symbol: "J",
    dimension: DIMENSIONS.SECOND_MOMENT_OF_AREA,
    unit: "mm^4",
    nameAliases: ["Polar Moment of Inertia", "Polar Second Moment of Area"],
    symbolAliases: ["J", "I_p"],
    aliases: ["Polar Moment of Inertia", "Polar Second Moment of Area"]
  },
  "sigma_1": {
    name: "Major Principal Stress",
    symbol: "\\sigma_1",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Major Principal Stress", "First Principal Stress", "Maximum Principal Stress"],
    symbolAliases: ["\\sigma_1", "s_1"],
    aliases: ["Major Principal Stress", "First Principal Stress", "Maximum Principal Stress"]
  },
  "sigma_2": {
    name: "Minor Principal Stress",
    symbol: "\\sigma_2",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Minor Principal Stress", "Second Principal Stress", "In-Plane Minimum Principal Stress"],
    symbolAliases: ["\\sigma_2", "s_2"],
    aliases: ["Minor Principal Stress", "Second Principal Stress", "In-Plane Minimum Principal Stress"]
  },
  "sigma_vm": {
    name: "von Mises Stress",
    symbol: "\\sigma'",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["von Mises Stress", "Equivalent von Mises Stress", "Distortion Energy Stress"],
    symbolAliases: ["\\sigma'", "\\sigma_{vm}", "\\sigma_e"],
    aliases: ["von Mises Stress", "Equivalent von Mises Stress", "Distortion Energy Stress"]
  },
  "S_e": {
    name: "Corrected Endurance Limit",
    symbol: "S_e",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Corrected Endurance Limit", "Modified Endurance Limit", "Fatigue Endurance Strength"],
    symbolAliases: ["S_e", "S_n"],
    aliases: ["Corrected Endurance Limit", "Modified Endurance Limit", "Fatigue Endurance Strength"]
  },
  "sigma_a": {
    name: "Alternating Stress",
    symbol: "\\sigma_a",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Alternating Stress", "Stress Amplitude", "Cyclic Alternating Stress"],
    symbolAliases: ["\\sigma_a", "S_a"],
    aliases: ["Alternating Stress", "Stress Amplitude", "Cyclic Alternating Stress"]
  },
  "sigma_m": {
    name: "Mean Stress",
    symbol: "\\sigma_m",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Mean Stress", "Midrange Stress", "Steady Mean Stress"],
    symbolAliases: ["\\sigma_m", "S_m"],
    aliases: ["Mean Stress", "Midrange Stress", "Steady Mean Stress"]
  }
});
