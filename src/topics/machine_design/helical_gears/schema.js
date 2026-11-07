/**
 * src/topics/machine_design/helical_gears/schema.js
 * Comprehensive Helical Gear Schema with complete aliases from Prime's Pocket Reference Manual.
 */

import { DIMENSIONS } from "../../../core/dimensions.js";

export const HELICAL_VARS_DB = Object.freeze({
  // ========================================================
  // 1. 3D ANGLES & PITCHES
  // ========================================================
  "psi": {
    name: "Helix Angle",
    symbol: "\\psi",
    dimension: DIMENSIONS.ANGLE,
    unit: "deg",
    baseVar: "psi",
    aliases: ["Helix Angle", "Tooth Spiral Angle", "Spiral Angle", "psi", "\\psi"]
  },
  "phi": {
    name: "Transverse Pressure Angle",
    symbol: "\\phi",
    dimension: DIMENSIONS.ANGLE,
    unit: "deg",
    baseVar: "phi",
    aliases: ["Transverse Pressure Angle", "Tangential Pressure Angle", "Apparent Pressure Angle", "phi", "\\phi"]
  },
  "phi_n": {
    name: "Normal Pressure Angle",
    symbol: "\\phi_n",
    dimension: DIMENSIONS.ANGLE,
    unit: "deg",
    baseVar: "phi_n",
    aliases: ["Normal Pressure Angle", "Real Pressure Angle", "True Pressure Angle", "phi_n", "\\phi_n"]
  },
  "P_c": {
    name: "Transverse Circular Pitch",
    symbol: "P_c",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "P_c",
    aliases: ["Transverse Circular Pitch", "Circular Pitch", "Tangential Pitch", "P_c"]
  },
  "P_cn": {
    name: "Normal Circular Pitch",
    symbol: "P_{cn}",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "P_cn",
    aliases: ["Normal Circular Pitch", "Normal Pitch", "P_cn", "P_{cn}"]
  },
  "P_a": {
    name: "Axial Pitch",
    symbol: "P_a",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "P_a",
    aliases: ["Axial Pitch", "Lead Pitch", "Pitch Along Axis", "P_a"]
  },
  "P_d": {
    name: "Transverse Diametral Pitch",
    symbol: "P_d",
    dimension: DIMENSIONS.PITCH,
    unit: "teeth/in",
    baseVar: "P_d",
    aliases: ["Transverse Diametral Pitch", "Diametral Pitch", "Apparent Diametral Pitch", "P_d"]
  },
  "P_dn": {
    name: "Normal Diametral Pitch",
    symbol: "P_{dn}",
    dimension: DIMENSIONS.PITCH,
    unit: "teeth/in",
    baseVar: "P_dn",
    aliases: ["Normal Diametral Pitch", "Real Diametral Pitch", "P_dn", "P_{dn}"]
  },
  "L_lead": {
    name: "Tooth Lead",
    symbol: "L",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "L_lead",
    aliases: ["Tooth Lead", "Helix Lead", "Lead", "L"]
  },
  "m_F": {
    name: "Face Contact Ratio",
    symbol: "m_F",
    dimension: DIMENSIONS.DIMENSIONLESS,
    baseVar: "m_F",
    aliases: ["Face Contact Ratio", "Helical Overlap Ratio", "Helical Contact Ratio", "m_F"]
  },

  // ========================================================
  // 2. DIAMETERS & TOOTH COUNTS
  // ========================================================
  "D_P":  { name: "Pitch Diameter", symbol: "D", dimension: DIMENSIONS.LENGTH, baseVar: "D_P", aliases: ["Pitch Diameter", "Pitch Circle Diameter"] },
  "D_P1": { name: "Pinion Pitch Diameter", symbol: "D_1", dimension: DIMENSIONS.LENGTH, baseVar: "D_P", aliases: ["Pinion Pitch Diameter", "Pinion Diameter", "D_p", "D_1"] },
  "D_P2": { name: "Gear Pitch Diameter", symbol: "D_2", dimension: DIMENSIONS.LENGTH, baseVar: "D_P", aliases: ["Gear Pitch Diameter", "Gear Diameter", "D_g", "D_2"] },
  "C":    { name: "Center Distance", symbol: "C", dimension: DIMENSIONS.LENGTH, baseVar: "C", aliases: ["Center Distance", "Shaft Center Distance"] },
  "b":    { name: "Face Width", symbol: "b", dimension: DIMENSIONS.LENGTH, baseVar: "b", aliases: ["Face Width", "Tooth Width", "b"] },
  "T":    { name: "Tooth Count", symbol: "T", dimension: DIMENSIONS.COUNT, isInteger: true, unit: "teeth", baseVar: "T", aliases: ["Tooth Count", "Number of Teeth", "N"] },
  "T_1":  { name: "Pinion Teeth", symbol: "T_1", dimension: DIMENSIONS.COUNT, isInteger: true, unit: "teeth", baseVar: "T", aliases: ["Pinion Teeth", "Driver Teeth", "N_p", "T_1"] },
  "T_2":  { name: "Gear Teeth", symbol: "T_2", dimension: DIMENSIONS.COUNT, isInteger: true, unit: "teeth", baseVar: "T", aliases: ["Gear Teeth", "Driven Teeth", "N_g", "T_2"] },
  "T_v":  { name: "Formative Number of Teeth", symbol: "T_v", dimension: DIMENSIONS.COUNT, isInteger: false, unit: "teeth", baseVar: "T_v", aliases: ["Formative Number of Teeth", "Virtual Teeth", "Virtual Number of Teeth", "Equivalent Number of Teeth", "Formative Teeth", "N_ev", "T_v"] },
  "n_1":  { name: "Driver Speed", symbol: "n_1", dimension: DIMENSIONS.ROT_SPEED, unit: "rpm", baseVar: "n", aliases: ["Driver Speed", "Pinion Speed", "N_1", "n_1"] },
  "n_2":  { name: "Driven Speed", symbol: "n_2", dimension: DIMENSIONS.ROT_SPEED, unit: "rpm", baseVar: "n", aliases: ["Driven Speed", "Gear Speed", "N_2", "n_2"] },
  "VR":   { name: "Speed Ratio", symbol: "SR", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "VR", aliases: ["Speed Ratio", "Velocity Ratio", "Gear Ratio", "SR"] },
  "V_m":  { name: "Pitch Line Velocity", symbol: "v", dimension: DIMENSIONS.VELOCITY, baseVar: "V_m", aliases: ["Pitch Line Velocity", "Peripheral Speed", "V_m", "v"] },

  // ========================================================
  // 3. 3D FORCES, TORQUE, POWER & STRENGTH
  // ========================================================
  "W_t":  { name: "Tangential Load", symbol: "F_t", dimension: DIMENSIONS.FORCE, baseVar: "W_t", aliases: ["Tangential Load", "Transmitted Load", "Tangential Force", "F_t", "W_t"] },
  "W_r":  { name: "Radial Load", symbol: "F_r", dimension: DIMENSIONS.FORCE, baseVar: "W_r", aliases: ["Radial Load", "Separating Force", "Separating Load", "Radial Force", "F_r", "W_r"] },
  "F_a":  { name: "Axial Thrust Load", symbol: "F_a", dimension: DIMENSIONS.FORCE, baseVar: "F_a", aliases: ["Axial Thrust Load", "Axial Force", "Thrust Load", "End Thrust", "F_a"] },
  "W":    { name: "Resultant Normal Force", symbol: "F_n", dimension: DIMENSIONS.FORCE, baseVar: "W", aliases: ["Resultant Normal Force", "Total Contact Force", "Total Tooth Load", "Normal Tooth Force", "F_n", "W"] },
  "M_t":  { name: "Shaft Torque", symbol: "T", dimension: DIMENSIONS.TORQUE, baseVar: "M_t", aliases: ["Shaft Torque", "Torque", "T"] },
  "P":    { name: "Transmitted Power", symbol: "P", dimension: DIMENSIONS.POWER, baseVar: "P", aliases: ["Transmitted Power", "Power"] },
  "s":    { name: "Bending Stress", symbol: "s", dimension: DIMENSIONS.STRESS, baseVar: "s", aliases: ["Bending Stress", "Lewis Bending Stress", "s"] },
  "Y":    { name: "Lewis Form Factor", symbol: "Y", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "Y", aliases: ["Lewis Form Factor", "Form Factor", "Y"] },
  "k_f":  { name: "Stress Reduction Factor", symbol: "k_f", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "k_f", aliases: ["Stress Reduction Factor", "k_f"] },
  "F_s":  { name: "Beam Fatigue Strength", symbol: "F_s", dimension: DIMENSIONS.FORCE, baseVar: "F_s", aliases: ["Beam Fatigue Strength", "Helical Beam Strength", "F_s"] },
  "F_D":  { name: "Dynamic Tooth Load", symbol: "F_D", dimension: DIMENSIONS.FORCE, baseVar: "F_D", aliases: ["Dynamic Tooth Load", "Buckingham Dynamic Load", "F_D", "F_d"] },
  "C_d":  { name: "Dynamic Deformation Factor", symbol: "C_d", dimension: DIMENSIONS.FORCE, baseVar: "C_d", aliases: ["Dynamic Deformation Factor", "Deformation Factor", "C", "C'"] },
  "F_w":  { name: "Limiting Wear Load", symbol: "F_w", dimension: DIMENSIONS.FORCE, baseVar: "F_w", aliases: ["Limiting Wear Load", "Wear Load", "Buckingham Wear Load", "F_w"] },
  "Q":    { name: "Ratio Factor for Gearing", symbol: "Q", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "Q", aliases: ["Ratio Factor for Gearing", "Q"] },
  "K_w":  { name: "Load-Stress Factor", symbol: "K_w", dimension: DIMENSIONS.STRESS, baseVar: "K_w", aliases: ["Load-Stress Factor", "Wear Factor", "k_g", "K_w"] }
});

export function getVarMeta(varKey) {
  return HELICAL_VARS_DB[varKey] || {
    name: varKey,
    symbol: varKey,
    dimension: DIMENSIONS.DIMENSIONLESS
  };
}