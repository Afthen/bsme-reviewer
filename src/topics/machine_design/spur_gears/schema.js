/**
 * src/topics/machine_design/spur_gears/schema.js
 * Comprehensive Spur Gear Schema with complete aliases from Prime's Pocket Reference Manual.
 */

import { DIMENSIONS } from "../../../core/dimensions.js";

export const GEAR_VARS_DB = Object.freeze({
  // ========================================================
  // 1. PITCH CIRCLES, DIAMETERS & PROPORTIONS
  // ========================================================
  "D_P": {
    name: "Pitch Diameter",
    symbol: "D",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "D_P",
    aliases: ["Pitch Diameter", "Pitch Circle Diameter", "Pitch Line Diameter", "Operating Pitch Diameter"]
  },
  "D_P1": {
    name: "Pinion Pitch Diameter",
    symbol: "D_1",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "D_P",
    aliases: ["Pinion Pitch Diameter", "Pinion Diameter", "Driver Pitch Diameter", "D_p", "D_1"]
  },
  "D_P2": {
    name: "Gear Pitch Diameter",
    symbol: "D_2",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "D_P",
    aliases: ["Gear Pitch Diameter", "Gear Diameter", "Wheel Diameter", "Driven Pitch Diameter", "D_g", "D_2"]
  },
  "P_d": {
    name: "Diametral Pitch",
    symbol: "P_d",
    dimension: DIMENSIONS.PITCH,
    unit: "teeth/in",
    baseVar: "P_d",
    aliases: ["Diametral Pitch", "Transverse Diametral Pitch", "Pitch Index"]
  },
  "P_c": {
    name: "Circular Pitch",
    symbol: "P_c",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "P_c",
    aliases: ["Circular Pitch", "Tooth Pitch", "Pitch Circumference"]
  },
  "m": {
    name: "Metric Module",
    symbol: "m",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    baseVar: "m",
    aliases: ["Metric Module", "Module", "Module Pitch", "M"]
  },
  "C": {
    name: "Center Distance",
    symbol: "C",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "C",
    aliases: ["Center Distance", "Shaft Center Distance", "Distance Between Centers"]
  },
  "a": {
    name: "Addendum",
    symbol: "a",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "a",
    aliases: ["Addendum", "Addendum Height", "Radial Height Above Pitch Circle"]
  },
  "d": {
    name: "Dedendum",
    symbol: "d",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "d",
    aliases: ["Dedendum", "Dedendum Depth", "Root Depth Below Pitch Circle"]
  },
  "c": {
    name: "Tooth Clearance",
    symbol: "c",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "c",
    aliases: ["Tooth Clearance", "Clearance", "Radial Clearance", "Bottom Clearance"]
  },
  "h_k": {
    name: "Working Depth",
    symbol: "W_r",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "h_k",
    aliases: ["Working Depth", "Operating Depth", "W_r", "h_k"]
  },
  "h": {
    name: "Whole Depth",
    symbol: "W",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "h",
    aliases: ["Whole Depth", "Total Depth", "Full Depth", "W", "W_h", "h"]
  },
  "t": {
    name: "Tooth Thickness",
    symbol: "t",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "t",
    aliases: ["Tooth Thickness", "Circular Thickness", "Arc Tooth Thickness", "T"]
  },
  "S_space": {
    name: "Tooth Space",
    symbol: "S",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "S_space",
    aliases: ["Tooth Space", "Space Width", "Width of Space", "S"]
  },
  "B": {
    name: "Backlash",
    symbol: "B",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "B",
    aliases: ["Tooth Backlash", "Backlash", "Circumferential Backlash", "B"]
  },
  "D_o": {
    name: "Outside Blank Diameter",
    symbol: "D_o",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "D_o",
    aliases: ["Outside Blank Diameter", "Outside Diameter", "Tip Diameter", "Addendum Circle Diameter", "D_op", "D_og"]
  },
  "D_r": {
    name: "Root Diameter",
    symbol: "D_r",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "D_r",
    aliases: ["Root Diameter", "Dedendum Circle Diameter", "Root Circle Diameter", "Bottom Diameter", "D_rp", "D_rg"]
  },
  "D_b": {
    name: "Base Circle Diameter",
    symbol: "D_b",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "D_b",
    aliases: ["Base Circle Diameter", "Base Diameter", "Involute Base Circle Diameter", "D_bp", "D_bg"]
  },
  "p_b": {
    name: "Base Pitch",
    symbol: "p_b",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "p_b",
    aliases: ["Base Pitch", "Normal Base Pitch", "Involute Base Pitch"]
  },
  "b": {
    name: "Face Width",
    symbol: "b",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "b",
    aliases: ["Face Width", "Tooth Width", "Axial Length of Tooth", "f"]
  },
  "r_f": {
    name: "Fillet Radius",
    symbol: "r_f",
    dimension: DIMENSIONS.LENGTH,
    baseVar: "r_f",
    aliases: ["Fillet Radius", "Root Fillet Radius", "Tooth Fillet Radius"]
  },
  "CR": {
    name: "Contact Ratio",
    symbol: "\\text{CR}",
    dimension: DIMENSIONS.DIMENSIONLESS,
    baseVar: "CR",
    aliases: ["Contact Ratio", "Profile Contact Ratio", "Length of Action Ratio", "m_p"]
  },

  // ========================================================
  // 2. TOOTH COUNTS, KINEMATICS & TRAINS
  // ========================================================
  "T":   { name: "Tooth Count", symbol: "T", dimension: DIMENSIONS.COUNT, isInteger: true, unit: "teeth", baseVar: "T", aliases: ["Tooth Count", "Number of Teeth", "N"] },
  "T_1": { name: "Pinion Teeth", symbol: "T_1", dimension: DIMENSIONS.COUNT, isInteger: true, unit: "teeth", baseVar: "T", aliases: ["Pinion Teeth", "Driver Teeth", "Number of Teeth in Pinion", "N_p", "T_p"] },
  "T_2": { name: "Gear Teeth", symbol: "T_2", dimension: DIMENSIONS.COUNT, isInteger: true, unit: "teeth", baseVar: "T", aliases: ["Gear Teeth", "Driven Teeth", "Number of Teeth in Gear", "N_g", "T_g"] },
  "n_1": { name: "Driver Speed", symbol: "n_1", dimension: DIMENSIONS.ROT_SPEED, unit: "rpm", baseVar: "n", aliases: ["Driver Speed", "Pinion Speed", "Input Rotational Speed", "N_1", "N_p"] },
  "n_2": { name: "Driven Speed", symbol: "n_2", dimension: DIMENSIONS.ROT_SPEED, unit: "rpm", baseVar: "n", aliases: ["Driven Speed", "Gear Speed", "Output Rotational Speed", "N_2", "N_g"] },
  "VR":  { name: "Speed Ratio", symbol: "SR", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "VR", aliases: ["Speed Ratio", "Velocity Ratio", "Speed Reduction Ratio", "Gear Ratio", "SR", "m_G"] },
  "V_m": { name: "Pitch Line Velocity", symbol: "v", dimension: DIMENSIONS.VELOCITY, baseVar: "V_m", aliases: ["Pitch Line Velocity", "Peripheral Speed", "Linear Pitch Speed", "V_m", "v"] },

  // ========================================================
  // 3. FORCES, TORQUE, POWER, STRESS & DESIGN
  // ========================================================
  "W_t": { name: "Transmitted Load", symbol: "F_t", dimension: DIMENSIONS.FORCE, baseVar: "W_t", aliases: ["Transmitted Load", "Tangential Force", "Tangential Tooth Load", "Power Transmitting Force", "F_t", "W_t"] },
  "W_r": { name: "Radial Load", symbol: "F_r", dimension: DIMENSIONS.FORCE, baseVar: "W_r", aliases: ["Radial Load", "Separating Force", "Separating Load", "Radial Tooth Force", "F_r", "W_r"] },
  "W":   { name: "Normal Contact Force", symbol: "F_n", dimension: DIMENSIONS.FORCE, baseVar: "W", aliases: ["Normal Contact Force", "Total Tooth Load", "Normal Tooth Load", "Resultant Tooth Force", "F_n", "W"] },
  "M_t": { name: "Shaft Torque", symbol: "T", dimension: DIMENSIONS.TORQUE, baseVar: "M_t", aliases: ["Shaft Torque", "Twisting Moment", "Pinion Torque", "Torque", "T", "M_t"] },
  "P":   { name: "Transmitted Power", symbol: "P", dimension: DIMENSIONS.POWER, baseVar: "P", aliases: ["Transmitted Power", "Power", "Shaft Power", "Operating Power"] },
  "phi": { name: "Pressure Angle", symbol: "\\phi", dimension: DIMENSIONS.ANGLE, unit: "deg", baseVar: "phi", aliases: ["Pressure Angle", "Angle of Obliquity", "Standard Pressure Angle"] },
  "s":   { name: "Bending Stress", symbol: "s", dimension: DIMENSIONS.STRESS, baseVar: "s", aliases: ["Bending Stress", "Lewis Bending Stress", "Tooth Root Stress", "S"] },
  "S_n": { name: "Endurance Strength", symbol: "S_n", dimension: DIMENSIONS.STRESS, baseVar: "S_n", aliases: ["Endurance Strength", "Fatigue Strength", "Endurance Limit", "S_e"] },
  "Y":   { name: "Form Factor", symbol: "Y", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "Y", aliases: ["Form Factor", "Modified Lewis Form Factor", "AGMA Geometry Factor"] },
  "y_form": { name: "Lewis Form Factor", symbol: "y", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "y_form", aliases: ["Lewis Form Factor", "Circular Form Factor", "y"] },
  "k_f": { name: "Stress Reduction Factor", symbol: "k_f", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "k_f", aliases: ["Stress Reduction Factor", "Fatigue Stress Concentration Factor", "k_f"] },
  "F_s": { name: "Beam Fatigue Strength", symbol: "F_s", dimension: DIMENSIONS.FORCE, baseVar: "F_s", aliases: ["Beam Fatigue Strength", "Beam Strength of Tooth", "Lewis Safe Bending Load", "F_s", "F_b"] },
  "F_D": { name: "Dynamic Tooth Load", symbol: "F_D", dimension: DIMENSIONS.FORCE, baseVar: "F_D", aliases: ["Dynamic Tooth Load", "Buckingham Dynamic Load", "Dynamic Load", "F_d", "F_D"] },
  "C_d": { name: "Dynamic Deformation Factor", symbol: "C_d", dimension: DIMENSIONS.FORCE, baseVar: "C_d", aliases: ["Dynamic Deformation Factor", "Deformation Factor", "Material Factor for Dynamic Load", "C", "C'"] },
  "F_w": { name: "Wear Load", symbol: "F_w", dimension: DIMENSIONS.FORCE, baseVar: "F_w", aliases: ["Wear Load", "Limiting Wear Load", "Buckingham Wear Load", "Wear Capacity", "F_w"] },
  "Q":   { name: "Ratio Factor for Gearing", symbol: "Q", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "Q", aliases: ["Ratio Factor for Gearing", "Gear Ratio Factor", "Q"] },
  "K_w": { name: "Load-Stress Factor", symbol: "K_w", dimension: DIMENSIONS.STRESS, baseVar: "K_w", aliases: ["Load-Stress Factor", "Wear Factor", "Material Wear Factor", "k_g", "K_w"] },
  "N_sf": { name: "Service Factor for Fatigue", symbol: "N_{sf}", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "N_sf", aliases: ["Service Factor for Fatigue", "Fatigue Factor of Safety", "Safety Factor", "N_sf"] }
});

export function getVarMeta(varKey) {
  return GEAR_VARS_DB[varKey] || {
    name: varKey,
    symbol: varKey,
    dimension: DIMENSIONS.DIMENSIONLESS
  };
}