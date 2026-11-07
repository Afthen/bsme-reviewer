/**
 * src/topics/machine_design/common/gear_base_schema.js
 * Universal gear schema shared across Spur, Helical, Bevel, and Worm drives.
 */

import { DIMENSIONS } from "../../../core/dimensions.js";

export const BASE_GEAR_VARS = Object.freeze({
  "D_P":  { name: "Pitch Diameter", symbol: "D", dimension: DIMENSIONS.LENGTH, baseVar: "D_P", aliases: ["Pitch Diameter", "Pitch Circle Diameter", "Pitch Line Diameter"] },
  "D_P1": { name: "Pinion Pitch Diameter", symbol: "D_1", dimension: DIMENSIONS.LENGTH, baseVar: "D_P", aliases: ["Pinion Pitch Diameter", "Pinion Diameter", "D_p", "D_1"] },
  "D_P2": { name: "Gear Pitch Diameter", symbol: "D_2", dimension: DIMENSIONS.LENGTH, baseVar: "D_P", aliases: ["Gear Pitch Diameter", "Gear Diameter", "D_g", "D_2"] },
  "C":    { name: "Center Distance", symbol: "C", dimension: DIMENSIONS.LENGTH, baseVar: "C", aliases: ["Center Distance", "Shaft Center Distance"] },
  "b":    { name: "Face Width", symbol: "b", dimension: DIMENSIONS.LENGTH, baseVar: "b", aliases: ["Face Width", "Tooth Width", "b"] },
  "P_c":  { name: "Circular Pitch", symbol: "P_c", dimension: DIMENSIONS.LENGTH, baseVar: "P_c", aliases: ["Circular Pitch", "Tooth Pitch"] },
  "P_d":  { name: "Diametral Pitch", symbol: "P_d", dimension: DIMENSIONS.PITCH, unit: "teeth/in", baseVar: "P_d", aliases: ["Diametral Pitch", "Transverse Diametral Pitch"] },
  "m":    { name: "Module", symbol: "m", dimension: DIMENSIONS.LENGTH, unit: "mm", baseVar: "m", aliases: ["Module", "Metric Module", "Module Pitch"] },

  "T":    { name: "Tooth Count", symbol: "T", dimension: DIMENSIONS.COUNT, isInteger: true, unit: "teeth", baseVar: "T", aliases: ["Tooth Count", "Number of Teeth", "N"] },
  "T_1":  { name: "Pinion Teeth", symbol: "T_1", dimension: DIMENSIONS.COUNT, isInteger: true, unit: "teeth", baseVar: "T", aliases: ["Pinion Teeth", "Driver Teeth", "N_p", "T_1"] },
  "T_2":  { name: "Gear Teeth", symbol: "T_2", dimension: DIMENSIONS.COUNT, isInteger: true, unit: "teeth", baseVar: "T", aliases: ["Gear Teeth", "Driven Teeth", "N_g", "T_2"] },
  "n_1":  { name: "Driver Speed", symbol: "n_1", dimension: DIMENSIONS.ROT_SPEED, unit: "rpm", baseVar: "n", aliases: ["Driver Speed", "Pinion Speed", "N_1", "n_1"] },
  "n_2":  { name: "Driven Speed", symbol: "n_2", dimension: DIMENSIONS.ROT_SPEED, unit: "rpm", baseVar: "n", aliases: ["Driven Speed", "Gear Speed", "N_2", "n_2"] },
  "VR":   { name: "Speed Ratio", symbol: "SR", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "VR", aliases: ["Speed Ratio", "Velocity Ratio", "Gear Ratio", "SR"] },
  "V_m":  { name: "Pitch Line Velocity", symbol: "v", dimension: DIMENSIONS.VELOCITY, baseVar: "V_m", aliases: ["Pitch Line Velocity", "Peripheral Speed", "v"] },

  "W_t":  { name: "Tangential Load", symbol: "F_t", dimension: DIMENSIONS.FORCE, baseVar: "W_t", aliases: ["Tangential Load", "Transmitted Load", "Tangential Force", "F_t"] },
  "W_r":  { name: "Radial Load", symbol: "F_r", dimension: DIMENSIONS.FORCE, baseVar: "W_r", aliases: ["Radial Load", "Separating Force", "F_r"] },
  "M_t":  { name: "Shaft Torque", symbol: "T", dimension: DIMENSIONS.TORQUE, baseVar: "M_t", aliases: ["Shaft Torque", "Torque", "T"] },
  "P":    { name: "Transmitted Power", symbol: "P", dimension: DIMENSIONS.POWER, baseVar: "P", aliases: ["Transmitted Power", "Power"] },
  "s":    { name: "Bending Stress", symbol: "s", dimension: DIMENSIONS.STRESS, baseVar: "s", aliases: ["Bending Stress", "Lewis Stress"] },
  "Y":    { name: "Lewis Form Factor", symbol: "Y", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "Y", aliases: ["Form Factor", "Y"] },
  "F_D":  { name: "Dynamic Load", symbol: "F_D", dimension: DIMENSIONS.FORCE, baseVar: "F_D", aliases: ["Dynamic Load", "Buckingham Dynamic Load", "F_d"] },
  "C_d":  { name: "Dynamic Deformation Factor", symbol: "C_d", dimension: DIMENSIONS.FORCE, baseVar: "C_d", aliases: ["Deformation Factor", "C"] }
});