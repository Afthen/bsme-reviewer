/**
 * src/topics/machine_design/springs/helical_coil/schema.js
 * Round-wire helical coil spring schema (Lecture Video sections 1-4).
 */

import { SPRING_BASE_VARS } from "../common/index.js";
import { DIMENSIONS } from "../../../../core/dimensions.js";

export const HELICAL_COIL_VARS_DB = Object.freeze({
  ...SPRING_BASE_VARS,

  // Diameters & Spring Index
  "D_m": {
    name: "Mean Coil Diameter",
    symbol: "D_m",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Mean Coil Diameter", "Mean Spring Diameter", "Pitch Diameter"],
    symbolAliases: ["D_m", "D"],
    aliases: ["Mean Coil Diameter", "Mean Spring Diameter", "Pitch Diameter", "D_m"]
  },
  "D_o": {
    name: "Outer Diameter",
    symbol: "D_o",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Outer Diameter", "Outside Diameter", "External Diameter"],
    symbolAliases: ["D_o", "OD"],
    aliases: ["Outer Diameter", "Outside Diameter", "External Diameter", "D_o", "OD"]
  },
  "D_i": {
    name: "Inner Diameter",
    symbol: "D_i",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Inner Diameter", "Inside Diameter", "Internal Diameter"],
    symbolAliases: ["D_i", "ID"],
    aliases: ["Inner Diameter", "Inside Diameter", "Internal Diameter", "D_i", "ID"]
  },
  "R_m": {
    name: "Mean Coil Radius",
    symbol: "R_m",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Mean Coil Radius", "Mean Radius"],
    symbolAliases: ["R_m", "R"],
    aliases: ["Mean Coil Radius", "Mean Radius", "R_m"]
  },
  "d_w": {
    name: "Wire Diameter",
    symbol: "d_w",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Wire Diameter", "Spring Wire Diameter"],
    symbolAliases: ["d_w", "d"],
    aliases: ["Wire Diameter", "Spring Wire Diameter", "d_w", "d"]
  },
  "C": {
    name: "Spring Index",
    symbol: "C",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Spring Index", "Coil Index"],
    symbolAliases: ["C"],
    aliases: ["Spring Index", "Coil Index", "C"]
  },

  // Pitch, Helix Angle & Developed Length
  "p": {
    name: "Coil Pitch",
    symbol: "p",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Coil Pitch", "Pitch between Coils"],
    symbolAliases: ["p"],
    aliases: ["Coil Pitch", "Pitch between Coils", "p"]
  },
  "alpha": {
    name: "Pitch Angle",
    symbol: "\\alpha",
    dimension: DIMENSIONS.ANGLE,
    unit: "°",
    nameAliases: ["Pitch Angle", "Helix Pitch Angle", "Lead Angle"],
    symbolAliases: ["\\alpha", "\\lambda"],
    aliases: ["Pitch Angle", "Helix Pitch Angle", "Lead Angle", "alpha"]
  },
  "L_wire": {
    name: "Active Wire Length",
    symbol: "L",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Active Wire Length", "Developed Wire Length", "Total Coil Length"],
    symbolAliases: ["L", "l_w"],
    aliases: ["Active Wire Length", "Developed Wire Length", "Total Coil Length", "L_wire", "L"]
  },

  // Coil Counts & End Connection Factors
  "n_e": {
    name: "Active Coils",
    symbol: "n_e",
    dimension: DIMENSIONS.COUNT,
    unit: "dimless",
    isInteger: false,
    nameAliases: ["Active Coils", "Effective Number of Coils", "Active Turns"],
    symbolAliases: ["n_e", "n"],
    aliases: ["Active Coils", "Effective Number of Coils", "Active Turns", "n_e", "n"]
  },
  "n_a": {
    name: "Total Coils",
    symbol: "n_a",
    dimension: DIMENSIONS.COUNT,
    unit: "dimless",
    isInteger: false,
    nameAliases: ["Total Coils", "Actual Coils", "Total Number of Turns"],
    symbolAliases: ["n_a", "N_t"],
    aliases: ["Total Coils", "Actual Coils", "Total Number of Turns", "n_a"]
  },
  "n_dead": {
    name: "Inactive Coils",
    symbol: "n_{dead}",
    dimension: DIMENSIONS.COUNT,
    unit: "dimless",
    isInteger: true,
    nameAliases: ["Inactive Coils", "Dead Coils", "End Coils"],
    symbolAliases: ["n_{dead}"],
    aliases: ["Inactive Coils", "Dead Coils", "End Coils", "n_dead"]
  },
  "k_end": {
    name: "End Connection Offset",
    symbol: "k_{end}",
    dimension: DIMENSIONS.COUNT,
    unit: "dimless",
    isInteger: true,
    nameAliases: ["End Connection Offset", "End Factor"],
    symbolAliases: ["k_{end}"],
    aliases: ["End Connection Offset", "End Factor", "k_end"]
  },

  // Stress & Correction Factors
  "S_f": {
    name: "Torsional Shear Stress",
    symbol: "S_f",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Torsional Shear Stress", "Maximum Shear Stress", "Corrected Shear Stress"],
    symbolAliases: ["S_f", "\\tau", "\\tau_{max}"],
    aliases: ["Torsional Shear Stress", "Maximum Shear Stress", "Corrected Shear Stress", "S_f", "\\tau"]
  },
  "G": {
    name: "Modulus of Rigidity",
    symbol: "G",
    dimension: DIMENSIONS.MODULUS,
    unit: "GPa",
    isConstant: true,
    display: 80,
    nameAliases: ["Modulus of Rigidity", "Shear Modulus", "Torsional Modulus"],
    symbolAliases: ["G"],
    aliases: ["Modulus of Rigidity", "Shear Modulus", "Torsional Modulus", "G"]
  },
  "K_w": {
    name: "Wahl Factor",
    symbol: "K_w",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Wahl Factor", "Wahl Correction Factor", "Stress Concentration Factor"],
    symbolAliases: ["K_w", "W"],
    aliases: ["Wahl Factor", "Wahl Correction Factor", "Stress Concentration Factor", "K_w"]
  },
  "K_b": {
    name: "Bergsträsser Factor",
    symbol: "K_b",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Bergsträsser Factor", "Bergstrasser Factor"],
    symbolAliases: ["K_b"],
    aliases: ["Bergsträsser Factor", "Bergstrasser Factor", "K_b"]
  },
  "K_s": {
    name: "Direct Shear Factor",
    symbol: "K_s",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Direct Shear Factor", "Shear Stress Factor"],
    symbolAliases: ["K_s"],
    aliases: ["Direct Shear Factor", "Shear Stress Factor", "K_s"]
  },
  "K_c": {
    name: "Curvature Correction Factor",
    symbol: "K_c",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Curvature Correction Factor", "Curvature Factor"],
    symbolAliases: ["K_c"],
    aliases: ["Curvature Correction Factor", "Curvature Factor", "K_c"]
  },

  // Length Relations
  "FL": {
    name: "Free Length",
    symbol: "FL",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Free Length", "Unloaded Length", "Initial Free Height"],
    symbolAliases: ["FL", "L_0", "L_f"],
    aliases: ["Free Length", "Unloaded Length", "Initial Free Height", "FL", "L_f"]
  },
  "SL": {
    name: "Solid Length",
    symbol: "SL",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Solid Length", "Solid Height", "Compressed Solid Height"],
    symbolAliases: ["SL", "L_s"],
    aliases: ["Solid Length", "Solid Height", "Compressed Solid Height", "SL", "L_s"]
  },
  "OL": {
    name: "Operating Length",
    symbol: "OL",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Operating Length", "Compressed Length", "Operating Height"],
    symbolAliases: ["OL", "L_{op}"],
    aliases: ["Operating Length", "Compressed Length", "Operating Height", "OL"]
  },
  "delta_solid": {
    name: "Deflection to Solid",
    symbol: "\\delta_{solid}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Deflection to Solid", "Solid Deflection", "Maximum Deflection"],
    symbolAliases: ["\\delta_{solid}", "\\delta_s"],
    aliases: ["Deflection to Solid", "Solid Deflection", "Maximum Deflection", "delta_solid"]
  },

  // Dual-Load Calibration States
  "F_1": {
    name: "Initial Load",
    symbol: "F_1",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Initial Load", "Minimum Operating Load", "Load 1"],
    symbolAliases: ["F_1", "P_1"],
    aliases: ["Initial Load", "Minimum Operating Load", "Load 1", "F_1"]
  },
  "F_2": {
    name: "Final Load",
    symbol: "F_2",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Final Load", "Maximum Operating Load", "Load 2"],
    symbolAliases: ["F_2", "P_2"],
    aliases: ["Final Load", "Maximum Operating Load", "Load 2", "F_2"]
  },
  "delta_1": {
    name: "Initial Deflection",
    symbol: "\\delta_1",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Initial Deflection", "Deflection 1"],
    symbolAliases: ["\\delta_1", "y_1"],
    aliases: ["Initial Deflection", "Deflection 1", "delta_1"]
  },
  "delta_2": {
    name: "Final Deflection",
    symbol: "\\delta_2",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Final Deflection", "Deflection 2"],
    symbolAliases: ["\\delta_2", "y_2"],
    aliases: ["Final Deflection", "Deflection 2", "delta_2"]
  },
  "dF": {
    name: "Load Change",
    symbol: "\\Delta F",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Load Change", "Load Difference", "Force Increment"],
    symbolAliases: ["\\Delta F", "\\Delta P"],
    aliases: ["Load Change", "Load Difference", "Force Increment", "dF"]
  },
  "ddelta": {
    name: "Deflection Change",
    symbol: "\\Delta \\delta",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Deflection Change", "Deflection Difference"],
    symbolAliases: ["\\Delta \\delta", "\\Delta y"],
    aliases: ["Deflection Change", "Deflection Difference", "ddelta"]
  },
  "OL_1": {
    name: "Initial Operating Length",
    symbol: "OL_1",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Initial Operating Length", "Length at Load 1"],
    symbolAliases: ["OL_1", "L_1"],
    aliases: ["Initial Operating Length", "Length at Load 1", "OL_1"]
  },
  "OL_2": {
    name: "Final Operating Length",
    symbol: "OL_2",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Final Operating Length", "Length at Load 2"],
    symbolAliases: ["OL_2", "L_2"],
    aliases: ["Final Operating Length", "Length at Load 2", "OL_2"]
  }
});
