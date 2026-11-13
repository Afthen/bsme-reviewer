/**
 * src/topics/machine_design/springs/common/spring_base_schema.js
 * Shared Physical Variable Definitions for Helical, Leaf, and Torsion Springs.
 */

import { DIMENSIONS } from "../../../../core/dimensions.js";
import { CONSTANTS_DB } from "../../../../core/constants_registry.js";

export const SPRING_BASE_VARS = Object.freeze({
  "D_m": {
    name: "Mean Coil Diameter",
    symbol: "D_m",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Mean Coil Diameter", "Mean Helix Diameter"],
    symbolAliases: ["D_m", "D"],
    aliases: ["Mean Coil Diameter", "Mean Helix Diameter", "D_m"]
  },
  "D_o": {
    name: "Outside Coil Diameter",
    symbol: "D_o",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    aliases: ["Outside Coil Diameter", "Outer Coil Diameter", "D_o"]
  },
  "D_i": {
    name: "Inside Coil Diameter",
    symbol: "D_i",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    aliases: ["Inside Coil Diameter", "Inner Coil Diameter", "D_i"]
  },
  "R_m": {
    name: "Mean Coil Radius",
    symbol: "R_m",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    aliases: ["Mean Coil Radius", "R_m"]
  },
  "d_w": {
    name: "Wire Diameter",
    symbol: "d_w",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Wire Diameter", "Spring Wire Diameter"],
    symbolAliases: ["d_w", "d"],
    aliases: ["Wire Diameter", "Spring Wire Diameter", "d_w"]
  },
  "C": {
    name: "Spring Index",
    symbol: "C",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    aliases: ["Spring Index", "Coil Index"]
  },
  "p": {
    name: "Coil Pitch",
    symbol: "p",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    aliases: ["Coil Pitch", "Helical Pitch"]
  },
  "alpha": {
    name: "Helix Pitch Angle",
    symbol: "\\alpha",
    dimension: DIMENSIONS.ANGLE,
    unit: "°",
    aliases: ["Helix Pitch Angle", "Coil Pitch Angle", "Lead Angle"]
  },
  "n": {
    name: "Active Coils",
    symbol: "n",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Active Coils", "Effective Coils"],
    symbolAliases: ["n", "n_e", "N_a"],
    aliases: ["Active Coils", "Effective Coils", "Number of Active Coils", "n_e"]
  },
  "L": {
    name: "Active Wire Length",
    symbol: "L",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    aliases: ["Active Wire Length", "Developed Wire Length"]
  },
  "K_w": {
    name: "Wahl Stress Factor",
    symbol: "K_w",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    aliases: ["Wahl Stress Factor", "Wahl Factor", "K_w"]
  },
  "K_b": {
    name: "Bergsträsser Factor",
    symbol: "K_b",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    aliases: ["Bergsträsser Factor", "Bergstrasser Factor", "K_b"]
  },
  "K_s": {
    name: "Direct Shear Factor",
    symbol: "K_s",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    aliases: ["Direct Shear Factor", "Shear Stress Multiplication Factor", "K_s"]
  },
  "K_c": {
    name: "Curvature Correction Factor",
    symbol: "K_c",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    aliases: ["Curvature Correction Factor", "Curvature Factor", "K_c"]
  },
  "F": {
    name: "Applied Spring Load",
    symbol: "F",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Applied Spring Load", "Axial Force", "Spring Force"],
    symbolAliases: ["F", "P"],
    aliases: ["Applied Spring Load", "Axial Force", "Spring Force"]
  },
  "delta": {
    name: "Spring Deflection",
    symbol: "\\delta",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Spring Deflection", "Axial Deflection", "Compression"],
    symbolAliases: ["\\delta", "y"],
    aliases: ["Spring Deflection", "Axial Deflection", "Spring Compression"]
  },
  "S_f": {
    name: "Torsional Shear Stress",
    symbol: "S_f",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    aliases: ["Torsional Shear Stress", "Maximum Shear Stress", "S_f"]
  },
  "S": {
    name: "Design Stress",
    symbol: "S",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    aliases: ["Design Stress", "Induced Stress", "Spring Stress"]
  },
  "G": {
    name: "Modulus of Rigidity",
    symbol: "G",
    dimension: DIMENSIONS.MODULUS,
    unit: "GPa",
    isConstant: true,
    aliases: ["Modulus of Rigidity", "Shear Modulus", "G"]
  },
  "E": {
    name: "Modulus of Elasticity",
    symbol: "E",
    dimension: DIMENSIONS.MODULUS,
    unit: "GPa",
    isConstant: true,
    aliases: ["Modulus of Elasticity", "Young's Modulus", "E"]
  },
  "k": {
    name: "Spring Rate",
    symbol: "k",
    dimension: DIMENSIONS.STIFFNESS,
    unit: "N/mm",
    aliases: ["Spring Rate", "Spring Stiffness", "Spring Constant"]
  },
  "SPE": {
    name: "Spring Potential Energy",
    symbol: "SPE",
    dimension: DIMENSIONS.ENERGY,
    unit: "J",
    aliases: ["Spring Potential Energy", "Elastic Strain Energy", "SPE"]
  },
  "FL": {
    name: "Free Length",
    symbol: "FL",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    aliases: ["Free Length", "Uncompressed Length", "FL"]
  },
  "SL": {
    name: "Solid Length",
    symbol: "SL",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    aliases: ["Solid Length", "Solid Height", "SL"]
  },
  "OL": {
    name: "Operating Length",
    symbol: "OL",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    aliases: ["Operating Length", "Loaded Length", "Working Height", "OL"]
  },
  "delta_solid": {
    name: "Solid Deflection",
    symbol: "\\delta_{solid}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    aliases: ["Solid Deflection", "Maximum Travel to Solid"]
  },
  "b": {
    name: "Wire / Leaf Width",
    symbol: "b",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    aliases: ["Section Width", "Wire Width", "Leaf Width"]
  },
  "t": {
    name: "Wire / Leaf Thickness",
    symbol: "t",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    aliases: ["Section Thickness", "Wire Thickness", "Leaf Thickness"]
  },
  "M": {
    name: "Bending Moment",
    symbol: "M",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-mm",
    aliases: ["Bending Moment", "Applied Moment"]
  },
  "L_a": {
    name: "Moment Arm Length",
    symbol: "L_a",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    aliases: ["Moment Arm Length", "Lever Arm", "L_a"]
  },
  "T": {
    name: "Oscillation Period",
    symbol: "T",
    dimension: DIMENSIONS.TIME,
    unit: "s",
    aliases: ["Oscillation Period", "Period of Vibration", "Time Period"]
  },
  "f": {
    name: "Natural Frequency",
    symbol: "f",
    dimension: DIMENSIONS.FREQUENCY,
    unit: "Hz",
    aliases: ["Natural Frequency", "Cyclic Frequency"]
  },
  "g": CONSTANTS_DB.g
});
