/**
 * src/topics/machine_design/helical_gears/schema.js
 * Complete Helical Gear Schema extending Base Gear Schema.
 */

import { BASE_GEAR_VARS } from "../common/index.js";
import { DIMENSIONS } from "../../../core/dimensions.js";

export const HELICAL_VARS_DB = Object.freeze({
  ...BASE_GEAR_VARS,

  // 3D Angles & Pitches
  "psi":   { name: "Helix Angle", symbol: "\\psi", dimension: DIMENSIONS.ANGLE, unit: "deg", baseVar: "psi", aliases: ["Helix Angle", "Tooth Spiral Angle", "Spiral Angle", "psi", "\\psi"] },
  "phi":   { name: "Transverse Pressure Angle", symbol: "\\phi", dimension: DIMENSIONS.ANGLE, unit: "deg", baseVar: "phi", aliases: ["Transverse Pressure Angle", "Tangential Pressure Angle", "Apparent Pressure Angle", "phi", "\\phi"] },
  "phi_n": { name: "Normal Pressure Angle", symbol: "\\phi_n", dimension: DIMENSIONS.ANGLE, unit: "deg", baseVar: "phi_n", aliases: ["Normal Pressure Angle", "Real Pressure Angle", "True Pressure Angle", "phi_n", "\\phi_n"] },
  "P_cn":  { name: "Normal Circular Pitch", symbol: "P_{cn}", dimension: DIMENSIONS.LENGTH, baseVar: "P_cn", aliases: ["Normal Circular Pitch", "Normal Pitch", "P_cn", "P_{cn}"] },
  "P_a":   { name: "Axial Pitch", symbol: "P_a", dimension: DIMENSIONS.LENGTH, baseVar: "P_a", aliases: ["Axial Pitch", "Lead Pitch", "Pitch Along Axis", "P_a"] },
  "P_dn":  { name: "Normal Diametral Pitch", symbol: "P_{dn}", dimension: DIMENSIONS.PITCH, unit: "teeth/in", baseVar: "P_dn", aliases: ["Normal Diametral Pitch", "Real Diametral Pitch", "P_dn", "P_{dn}"] },
  "m":     { name: "Transverse Module", symbol: "m", dimension: DIMENSIONS.LENGTH, unit: "mm", baseVar: "m", aliases: ["Transverse Module", "Module"] },
  "m_n":   { name: "Normal Module", symbol: "m_n", dimension: DIMENSIONS.LENGTH, unit: "mm", baseVar: "m_n", aliases: ["Normal Module", "Module in Normal Plane"] },
  "L_lead":{ name: "Tooth Lead", symbol: "L", dimension: DIMENSIONS.LENGTH, baseVar: "L_lead", aliases: ["Tooth Lead", "Helix Lead", "Lead", "L"] },
  "m_F":   { name: "Face Contact Ratio", symbol: "m_F", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", baseVar: "m_F", aliases: ["Face Contact Ratio", "Helical Overlap Ratio", "Helical Contact Ratio", "m_F"] },
  "T_v":   { name: "Formative Number of Teeth", symbol: "T_v", dimension: DIMENSIONS.COUNT, isInteger: false, unit: "teeth", baseVar: "T_v", aliases: ["Formative Number of Teeth", "Virtual Teeth", "Virtual Number of Teeth", "Equivalent Number of Teeth", "Formative Teeth", "N_ev", "T_v"] },
  "F_a":   { name: "Axial Thrust Load", symbol: "F_a", dimension: DIMENSIONS.FORCE, baseVar: "F_a", aliases: ["Axial Thrust Load", "Axial Force", "Thrust Load", "End Thrust", "F_a"] },
  "W":     { name: "Resultant Normal Force", symbol: "F_n", dimension: DIMENSIONS.FORCE, baseVar: "W", aliases: ["Resultant Normal Force", "Total Contact Force", "Total Tooth Load", "Normal Tooth Force", "F_n", "W"] },
  "k_f":   { name: "Stress Reduction Factor", symbol: "k_f", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", baseVar: "k_f", aliases: ["Stress Reduction Factor", "k_f"] },
  "F_s":   { name: "Beam Fatigue Strength", symbol: "F_s", dimension: DIMENSIONS.FORCE, baseVar: "F_s", aliases: ["Beam Fatigue Strength", "Helical Beam Strength", "F_s"] },
  "F_w":   { name: "Limiting Wear Load", symbol: "F_w", dimension: DIMENSIONS.FORCE, baseVar: "F_w", aliases: ["Limiting Wear Load", "Wear Load", "Buckingham Wear Load", "F_w"] },
  "Q":     { name: "Ratio Factor for Gearing", symbol: "Q", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", baseVar: "Q", aliases: ["Ratio Factor for Gearing", "Q"] },
  "K_w":   { name: "Load-Stress Factor", symbol: "K_w", dimension: DIMENSIONS.STRESS, baseVar: "K_w", aliases: ["Load-Stress Factor", "Wear Factor", "k_g", "K_w"] }
});
