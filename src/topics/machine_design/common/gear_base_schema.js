/**
 * src/topics/machine_design/common/gear_base_schema.js
 * Universal gear schema shared across Spur, Helical, Bevel, and Worm drives.
 */

import { DIMENSIONS } from "../../../core/dimensions.js";

export const BASE_GEAR_VARS = Object.freeze({
  "D_P":  { name: "Pitch Diameter", symbol: "D", dimension: DIMENSIONS.LENGTH, isAbstract: true, baseVar: "D_P", aliases: ["Pitch Diameter", "Pitch Circle Diameter", "Pitch Line Diameter"] },
  "D_P1": { name: "Pinion Pitch Diameter", symbol: "D_1", dimension: DIMENSIONS.LENGTH, baseVar: "D_P", aliases: ["Pinion Pitch Diameter", "Pinion Diameter", "D_p", "D_1"], nameAliases: ["Pinion Pitch Diameter", "Driver Diameter", "Pinion Diameter"], symbolAliases: ["D_1", "D_p", "d_1"] },
  "D_P2": { name: "Gear Pitch Diameter", symbol: "D_2", dimension: DIMENSIONS.LENGTH, baseVar: "D_P", aliases: ["Gear Pitch Diameter", "Gear Diameter", "D_g", "D_2"], nameAliases: ["Gear Pitch Diameter", "Driven Diameter", "Gear Diameter"], symbolAliases: ["D_2", "D_g", "d_2"] },
  "C":    { name: "Center Distance", symbol: "C", dimension: DIMENSIONS.LENGTH, baseVar: "C", aliases: ["Center Distance", "Shaft Center Distance"], nameAliases: ["Center Distance", "Shaft Center Distance"], symbolAliases: ["C", "c_d"] },
  "b":    { name: "Face Width", symbol: "b", dimension: DIMENSIONS.LENGTH, baseVar: "b", aliases: ["Face Width", "Tooth Width", "b"], nameAliases: ["Face Width", "Active Tooth Width"], symbolAliases: ["b", "F"] },
  "P_c":  { name: "Circular Pitch", symbol: "P_c", dimension: DIMENSIONS.LENGTH, baseVar: "P_c", aliases: ["Circular Pitch", "Tooth Pitch"], nameAliases: ["Circular Pitch", "Circumferential Pitch"], symbolAliases: ["P_c", "p"] },
  "P_d":  { name: "Diametral Pitch", symbol: "P_d", dimension: DIMENSIONS.PITCH, unit: "teeth/in", baseVar: "P_d", aliases: ["Diametral Pitch", "Transverse Diametral Pitch"], nameAliases: ["Diametral Pitch", "Pitch Index"], symbolAliases: ["P_d", "DP"] },
  "m":    { name: "Module", symbol: "m", dimension: DIMENSIONS.LENGTH, unit: "mm", baseVar: "m", aliases: ["Module", "Metric Module", "Module Pitch"], nameAliases: ["Metric Module", "Module"], symbolAliases: ["m"] },

  "T":    { name: "Tooth Count", symbol: "T", dimension: DIMENSIONS.COUNT, isInteger: true, isAbstract: true, unit: "teeth", baseVar: "T", aliases: ["Tooth Count", "Number of Teeth", "N"] },
  "T_1":  { name: "Pinion Teeth", symbol: "T_1", dimension: DIMENSIONS.COUNT, isInteger: true, unit: "teeth", baseVar: "T", aliases: ["Pinion Teeth", "Driver Teeth", "N_p", "T_1"], nameAliases: ["Pinion Teeth", "Number of Teeth on Pinion"], symbolAliases: ["T_1", "N_1", "N_p"] },
  "T_2":  { name: "Gear Teeth", symbol: "T_2", dimension: DIMENSIONS.COUNT, isInteger: true, unit: "teeth", baseVar: "T", aliases: ["Gear Teeth", "Driven Teeth", "N_g", "T_2"], nameAliases: ["Gear Teeth", "Number of Teeth on Gear"], symbolAliases: ["T_2", "N_2", "N_g"] },
  "n_1":  { name: "Driver Speed", symbol: "n_1", dimension: DIMENSIONS.ROT_SPEED, unit: "rpm", baseVar: "n", aliases: ["Driver Speed", "Pinion Speed", "N_1", "n_1"], nameAliases: ["Pinion Rotational Speed", "Driver RPM"], symbolAliases: ["n_1", "N_1", "N_p"] },
  "n_2":  { name: "Driven Speed", symbol: "n_2", dimension: DIMENSIONS.ROT_SPEED, unit: "rpm", baseVar: "n", aliases: ["Driven Speed", "Gear Speed", "N_2", "n_2"], nameAliases: ["Gear Rotational Speed", "Driven RPM"], symbolAliases: ["n_2", "N_2", "N_g"] },
  "VR":   { name: "Speed Ratio", symbol: "SR", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", baseVar: "VR", aliases: ["Speed Ratio", "Velocity Ratio", "Gear Ratio", "SR"], nameAliases: ["Speed Reduction Ratio", "Gear Ratio"], symbolAliases: ["\\text{SR}", "\\text{VR}", "m_G"] },
  "V_m":  { name: "Pitch Line Velocity", symbol: "v", dimension: DIMENSIONS.VELOCITY, baseVar: "V_m", aliases: ["Pitch Line Velocity", "Peripheral Speed", "v"], nameAliases: ["Pitch Line Velocity", "Peripheral Linear Speed"], symbolAliases: ["v", "V_m"] },

  "W_t":  { name: "Tangential Load", symbol: "F_t", dimension: DIMENSIONS.FORCE, baseVar: "W_t", aliases: ["Tangential Load", "Transmitted Load", "Tangential Force", "F_t"], nameAliases: ["Transmitted Tangential Load", "Tangential Tooth Force"], symbolAliases: ["F_t", "W_t"] },
  "W_r":  { name: "Radial Load", symbol: "F_r", dimension: DIMENSIONS.FORCE, baseVar: "W_r", aliases: ["Radial Load", "Separating Force", "F_r"], nameAliases: ["Separating Load", "Radial Tooth Force"], symbolAliases: ["F_r", "W_r"] },
  "M_t":  { name: "Shaft Torque", symbol: "T", dimension: DIMENSIONS.TORQUE, baseVar: "M_t", aliases: ["Shaft Torque", "Torque", "T"], nameAliases: ["Transmitted Torque", "Shaft Torque"], symbolAliases: ["T", "M_t"] },
  "P":    { name: "Transmitted Power", symbol: "P", dimension: DIMENSIONS.POWER, baseVar: "P", aliases: ["Transmitted Power", "Power"], nameAliases: ["Transmitted Mechanical Power", "Shaft Power"], symbolAliases: ["P", "\\text{Power}"] },
  "s":    { name: "Bending Stress", symbol: "s", dimension: DIMENSIONS.STRESS, baseVar: "s", aliases: ["Bending Stress", "Lewis Stress"], nameAliases: ["Lewis Bending Stress", "Tooth Root Stress"], symbolAliases: ["s", "\\sigma_b"] },
  "Y":    { name: "Lewis Form Factor", symbol: "Y", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", baseVar: "Y", aliases: ["Form Factor", "Y"], nameAliases: ["Lewis Form Factor", "Tooth Form Factor"], symbolAliases: ["Y"] },
  "F_D":  { name: "Dynamic Load", symbol: "F_D", dimension: DIMENSIONS.FORCE, baseVar: "F_D", aliases: ["Dynamic Load", "Buckingham Dynamic Load", "F_d"], nameAliases: ["Buckingham Dynamic Load", "Total Dynamic Tooth Load"], symbolAliases: ["F_D", "W_d"] },
  "C_d":  { name: "Dynamic Deformation Factor", symbol: "C_d", dimension: DIMENSIONS.FORCE, baseVar: "C_d", aliases: ["Deformation Factor", "C"], nameAliases: ["Deformation Factor", "Tooth Error Factor"], symbolAliases: ["C_d", "C"] }
});
