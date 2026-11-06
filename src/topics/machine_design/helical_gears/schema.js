/**
 * src/topics/machine_design/helical_gears/schema.js
 * Helical gear variable dictionary, canonical symbols, aliases, and physical dimensions.
 */

import { DIMENSIONS } from "../../../core/dimensions.js";

export const HELICAL_VARS_DB = Object.freeze({
  // ========================================================
  // 1. HELICAL ANGLES & PITCHES (3D TOOTH GEOMETRY)
  // ========================================================
  "psi": {
    name: "Helix Angle",
    symbol: "\\psi",
    dimension: DIMENSIONS.ANGLE,
    unit: "deg",
    baseVar: "psi",
    aliases: ["Helix Angle", "Tooth Spiral Angle"]
  },
  "phi": {
    name: "Transverse Pressure Angle",
    symbol: "\\phi",
    dimension: DIMENSIONS.ANGLE,
    unit: "deg",
    baseVar: "phi",
    aliases: ["Transverse Pressure Angle", "Tangential Pressure Angle"]
  },
  "phi_n": {
    name: "Normal Pressure Angle",
    symbol: "\\phi_n",
    dimension: DIMENSIONS.ANGLE,
    unit: "deg",
    baseVar: "phi_n",
    aliases: ["Normal Pressure Angle"]
  },
  "P_c": {
    name: "Circular Pitch",
    symbol: "P_c",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "P_c",
    aliases: ["Transverse Circular Pitch", "Circular Pitch"]
  },
  "P_cn": {
    name: "Normal Circular Pitch",
    symbol: "P_{cn}",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "P_cn",
    aliases: ["Normal Circular Pitch"]
  },
  "P_a": {
    name: "Axial Pitch",
    symbol: "P_a",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "P_a",
    aliases: ["Axial Pitch", "Lead Pitch"]
  },
  "P_d": {
    name: "Transverse Diametral Pitch",
    symbol: "P_d",
    dimension: DIMENSIONS.PITCH,
    unit: "teeth/in",
    baseVar: "P_d",
    aliases: ["Transverse Diametral Pitch", "Diametral Pitch"]
  },
  "P_dn": {
    name: "Normal Diametral Pitch",
    symbol: "P_{dn}",
    dimension: DIMENSIONS.PITCH,
    unit: "teeth/in",
    baseVar: "P_dn",
    aliases: ["Normal Diametral Pitch"]
  },
  "m": {
    name: "Transverse Metric Module",
    symbol: "m",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    baseVar: "m"
  },
  "m_n": {
    name: "Normal Metric Module",
    symbol: "m_n",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    baseVar: "m_n"
  },

  // ========================================================
  // 2. GEAR GEOMETRY & PROPORTIONS
  // ========================================================
  "D_P":  { name: "Pitch Diameter", symbol: "D", dimension: DIMENSIONS.LENGTH, baseVar: "D_P" },
  "D_P1": { name: "Pinion Pitch Diameter", symbol: "D_1", dimension: DIMENSIONS.LENGTH, baseVar: "D_P", aliases: ["Pinion Pitch Diameter", "Pinion Diameter"] },
  "D_P2": { name: "Gear Pitch Diameter", symbol: "D_2", dimension: DIMENSIONS.LENGTH, baseVar: "D_P", aliases: ["Gear Pitch Diameter", "Wheel Diameter"] },
  "C":    { name: "Center Distance", symbol: "C", dimension: DIMENSIONS.LENGTH, baseVar: "C" },
  "b":    { name: "Face Width", symbol: "b", dimension: DIMENSIONS.LENGTH, baseVar: "b" },
  "D_o":  { name: "Outside Blank Diameter", symbol: "D_o", dimension: DIMENSIONS.LENGTH, baseVar: "D_o", aliases: ["Outside Diameter", "Tip Diameter"] },
  "D_r":  { name: "Root Diameter", symbol: "D_r", dimension: DIMENSIONS.LENGTH, baseVar: "D_r" },
  "a":    { name: "Addendum", symbol: "a", dimension: DIMENSIONS.LENGTH, baseVar: "a" },
  "d":    { name: "Dedendum", symbol: "d", dimension: DIMENSIONS.LENGTH, baseVar: "d" },
  "c":    { name: "Tooth Clearance", symbol: "c", dimension: DIMENSIONS.LENGTH, baseVar: "c" },

  // ========================================================
  // 3. TOOTH COUNTS & KINEMATICS
  // ========================================================
  "T":    { name: "Tooth Count", symbol: "T", dimension: DIMENSIONS.COUNT, isInteger: true, unit: "teeth", baseVar: "T" },
  "T_1":  { name: "Pinion Teeth", symbol: "T_1", dimension: DIMENSIONS.COUNT, isInteger: true, unit: "teeth", baseVar: "T", aliases: ["Pinion Teeth", "Driver Teeth"] },
  "T_2":  { name: "Gear Teeth", symbol: "T_2", dimension: DIMENSIONS.COUNT, isInteger: true, unit: "teeth", baseVar: "T", aliases: ["Gear Teeth", "Driven Teeth"] },
  "T_v":  { name: "Formative Teeth", symbol: "T_v", dimension: DIMENSIONS.COUNT, isInteger: false, unit: "teeth", baseVar: "T_v", aliases: ["Virtual Number of Teeth", "Equivalent Tooth Count"] },
  "n_1":  { name: "Driver Speed", symbol: "n_1", dimension: DIMENSIONS.ROT_SPEED, unit: "rpm", baseVar: "n", aliases: ["Driver Speed", "Pinion Speed"] },
  "n_2":  { name: "Driven Speed", symbol: "n_2", dimension: DIMENSIONS.ROT_SPEED, unit: "rpm", baseVar: "n", aliases: ["Driven Speed", "Gear Speed"] },
  "VR":   { name: "Speed Ratio", symbol: "SR", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "VR", aliases: ["Speed Ratio", "Velocity Ratio"] },
  "V_m":  { name: "Pitch Line Velocity", symbol: "v", dimension: DIMENSIONS.VELOCITY, baseVar: "V_m", aliases: ["Pitch Line Velocity", "Peripheral Speed"] },

  // ========================================================
  // 4. 3D FORCES, TORQUE, POWER & STRENGTH
  // ========================================================
  "W_t":  { name: "Tangential Load", symbol: "F_t", dimension: DIMENSIONS.FORCE, baseVar: "W_t", aliases: ["Tangential Load", "Transmitted Load"] },
  "W_r":  { name: "Radial Separating Force", symbol: "F_r", dimension: DIMENSIONS.FORCE, baseVar: "W_r", aliases: ["Radial Load", "Separating Force"] },
  "F_a":  { name: "Axial Thrust Load", symbol: "F_a", dimension: DIMENSIONS.FORCE, baseVar: "F_a", aliases: ["Axial Load", "Thrust Force"] },
  "W":    { name: "Resultant Normal Force", symbol: "F_n", dimension: DIMENSIONS.FORCE, baseVar: "W", aliases: ["Total Contact Load", "Normal Tooth Load"] },
  "M_t":  { name: "Shaft Torque", symbol: "T", dimension: DIMENSIONS.TORQUE, baseVar: "M_t", aliases: ["Shaft Torque", "Twisting Moment"] },
  "P":    { name: "Transmitted Power", symbol: "P", dimension: DIMENSIONS.POWER, baseVar: "P" },
  "s":    { name: "Bending Stress", symbol: "s", dimension: DIMENSIONS.STRESS, baseVar: "s", aliases: ["Bending Stress", "Lewis Bending Stress"] },
  "Y":    { name: "Lewis Form Factor", symbol: "Y", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "Y" },
  "F_D":  { name: "Buckingham Dynamic Load", symbol: "F_D", dimension: DIMENSIONS.FORCE, baseVar: "F_D", aliases: ["Dynamic Tooth Load"] },
  "C_d":  { name: "Dynamic Deformation Factor", symbol: "C_d", dimension: DIMENSIONS.FORCE, baseVar: "C_d" }
});

export function getVarMeta(varKey) {
  return HELICAL_VARS_DB[varKey] || {
    name: varKey,
    symbol: varKey,
    dimension: DIMENSIONS.DIMENSIONLESS
  };
}
