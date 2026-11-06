/**
 * src/topics/machine_design/spur_gears/schema.js
 * Spur gear variable dictionary, canonical symbols, aliases, and physical dimensions.
 */

import { DIMENSIONS } from "../../../core/dimensions.js";

export const GEAR_VARS_DB = Object.freeze({
  // ========================================================
  // 1. GEOMETRY & TOOTH PROPORTIONS
  // ========================================================
  "D_P":  { name: "Pitch Diameter", symbol: "D", dimension: DIMENSIONS.LENGTH, baseVar: "D_P" },
  "D_P1": { name: "Pinion Pitch Diameter", symbol: "D_1", dimension: DIMENSIONS.LENGTH, baseVar: "D_P", aliases: ["Pinion Pitch Diameter", "Pinion Diameter"] },
  "D_P2": { name: "Gear Pitch Diameter", symbol: "D_2", dimension: DIMENSIONS.LENGTH, baseVar: "D_P", aliases: ["Gear Pitch Diameter", "Wheel Diameter"] },
  "P_d":  { name: "Diametral Pitch", symbol: "P_d", dimension: DIMENSIONS.PITCH, baseVar: "P_d", unit: "teeth/in" },
  "P_c":  { name: "Circular Pitch", symbol: "P_c", dimension: DIMENSIONS.LENGTH, baseVar: "P_c" },
  "m":    { name: "Metric Module", symbol: "m", dimension: DIMENSIONS.LENGTH, baseVar: "m", unit: "mm" },
  "C":    { name: "Center Distance", symbol: "C", dimension: DIMENSIONS.LENGTH, baseVar: "C" },
  "a":    { name: "Addendum", symbol: "a", dimension: DIMENSIONS.LENGTH, baseVar: "a", aliases: ["Addendum", "Radial Height Above Pitch Circle"] },
  "d":    { name: "Dedendum", symbol: "d", dimension: DIMENSIONS.LENGTH, baseVar: "d", aliases: ["Dedendum", "Root Depth Below Pitch Circle"] },
  "c":    { name: "Tooth Clearance", symbol: "c", dimension: DIMENSIONS.LENGTH, baseVar: "c", aliases: ["Tooth Clearance", "Clearance"] },
  "h_k":  { name: "Working Depth", symbol: "W_r", dimension: DIMENSIONS.LENGTH, baseVar: "h_k", aliases: ["Working Depth", "Operating Tooth Depth"] },
  "h":    { name: "Whole Depth", symbol: "W", dimension: DIMENSIONS.LENGTH, baseVar: "h", aliases: ["Whole Depth", "Total Tooth Depth"] },
  "t":    { name: "Tooth Thickness", symbol: "t", dimension: DIMENSIONS.LENGTH, baseVar: "t" },
  "S_space": { name: "Tooth Space", symbol: "S", dimension: DIMENSIONS.LENGTH, baseVar: "S_space" },
  "D_o":  { name: "Outside Blank Diameter", symbol: "D_o", dimension: DIMENSIONS.LENGTH, baseVar: "D_o", aliases: ["Outside Blank Diameter", "Tip Diameter"] },
  "D_r":  { name: "Root Diameter", symbol: "D_r", dimension: DIMENSIONS.LENGTH, baseVar: "D_r", aliases: ["Root Diameter", "Dedendum Circle Diameter"] },
  "D_b":  { name: "Base Circle Diameter", symbol: "D_b", dimension: DIMENSIONS.LENGTH, baseVar: "D_b" },
  "p_b":  { name: "Base Pitch", symbol: "p_b", dimension: DIMENSIONS.LENGTH, baseVar: "p_b" },
  "B":    { name: "Tooth Backlash", symbol: "B", dimension: DIMENSIONS.LENGTH, baseVar: "B" },
  "b":    { name: "Face Width", symbol: "b", dimension: DIMENSIONS.LENGTH, baseVar: "b" },
  "C_i":  { name: "Center Distance to Idler", symbol: "C_i", dimension: DIMENSIONS.LENGTH, baseVar: "C_i" },

  // ========================================================
  // 2. TOOTH COUNTS & KINEMATICS
  // ========================================================
  "T":    { name: "Tooth Count", symbol: "T", dimension: DIMENSIONS.COUNT, isInteger: true, unit: "teeth", baseVar: "T" },
  "T_1":  { name: "Pinion Teeth", symbol: "T_1", dimension: DIMENSIONS.COUNT, isInteger: true, unit: "teeth", baseVar: "T", aliases: ["Pinion Teeth", "Driver Teeth"] },
  "T_2":  { name: "Gear Teeth", symbol: "T_2", dimension: DIMENSIONS.COUNT, isInteger: true, unit: "teeth", baseVar: "T", aliases: ["Gear Teeth", "Driven Teeth"] },
  "n":    { name: "Rotational Speed", symbol: "n", dimension: DIMENSIONS.ROT_SPEED, baseVar: "n", unit: "rpm" },
  "n_1":  { name: "Driver Speed", symbol: "n_1", dimension: DIMENSIONS.ROT_SPEED, baseVar: "n", unit: "rpm", aliases: ["Driver Speed", "Pinion Speed"] },
  "n_2":  { name: "Driven Speed", symbol: "n_2", dimension: DIMENSIONS.ROT_SPEED, baseVar: "n", unit: "rpm", aliases: ["Driven Speed", "Gear Speed"] },
  "VR":   { name: "Speed Ratio", symbol: "SR", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "VR", aliases: ["Speed Ratio", "Velocity Ratio"] },
  "V_m":  { name: "Pitch Line Velocity", symbol: "v", dimension: DIMENSIONS.VELOCITY, baseVar: "V_m", aliases: ["Pitch Line Velocity", "Peripheral Speed"] },

  // ========================================================
  // 3. DYNAMICS, FORCES & BUCKINGHAM DYNAMIC LOAD
  // ========================================================
  "W_t":  { name: "Transmitted Load", symbol: "F_t", dimension: DIMENSIONS.FORCE, baseVar: "W_t", aliases: ["Transmitted Load", "Tangential Force"] },
  "W_r":  { name: "Radial Load", symbol: "F_r", dimension: DIMENSIONS.FORCE, baseVar: "W_r", aliases: ["Radial Load", "Separating Force"] },
  "W":    { name: "Normal Contact Force", symbol: "F_n", dimension: DIMENSIONS.FORCE, baseVar: "W", aliases: ["Normal Contact Force", "Total Tooth Load"] },
  "M_t":  { name: "Shaft Torque", symbol: "T", dimension: DIMENSIONS.TORQUE, baseVar: "M_t", aliases: ["Shaft Torque", "Twisting Moment"] },
  "P":    { name: "Transmitted Power", symbol: "P", dimension: DIMENSIONS.POWER, baseVar: "P" },
  "phi":  { name: "Pressure Angle", symbol: "\\phi", dimension: DIMENSIONS.ANGLE, baseVar: "phi", unit: "deg" },
  "s":    { name: "Bending Stress", symbol: "s", dimension: DIMENSIONS.STRESS, baseVar: "s", aliases: ["Bending Stress", "Lewis Bending Stress"] },
  "Y":    { name: "Form Factor", symbol: "Y", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "Y" },
  "y_form": { name: "Lewis Form Factor", symbol: "y", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "y_form" },
  "F_D":  { name: "Dynamic Tooth Load", symbol: "F_D", dimension: DIMENSIONS.FORCE, baseVar: "F_D", aliases: ["Buckingham Dynamic Load"] },
  "C_d":  { name: "Dynamic Deformation Factor", symbol: "C_d", dimension: DIMENSIONS.FORCE, baseVar: "C_d" }
});

export function getVarMeta(varKey) {
  return GEAR_VARS_DB[varKey] || {
    name: varKey,
    symbol: varKey,
    dimension: DIMENSIONS.DIMENSIONLESS
  };
}
