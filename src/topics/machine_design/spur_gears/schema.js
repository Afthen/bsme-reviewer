/**
 * src/topics/machine_design/spur_gears/schema.js
 * Spur Gear Schema extending universal gear base with Prime's Manual aliases.
 */

import { BASE_GEAR_VARS } from "../common/gear_base_schema.js";
import { DIMENSIONS } from "../../../core/dimensions.js";

export const GEAR_VARS_DB = Object.freeze({
  ...BASE_GEAR_VARS,

  "a": { name: "Addendum", symbol: "a", dimension: DIMENSIONS.LENGTH, baseVar: "a", aliases: ["Addendum", "Addendum Height"] },
  "d": { name: "Dedendum", symbol: "d", dimension: DIMENSIONS.LENGTH, baseVar: "d", aliases: ["Dedendum", "Dedendum Depth"] },
  "c": { name: "Tooth Clearance", symbol: "c", dimension: DIMENSIONS.LENGTH, baseVar: "c", aliases: ["Tooth Clearance", "Clearance"] },
  "h_k": { name: "Working Depth", symbol: "W_r", dimension: DIMENSIONS.LENGTH, baseVar: "h_k", aliases: ["Working Depth", "W_r"] },
  "h": { name: "Whole Depth", symbol: "W", dimension: DIMENSIONS.LENGTH, baseVar: "h", aliases: ["Whole Depth", "Total Depth", "W"] },
  "t": { name: "Tooth Thickness", symbol: "t", dimension: DIMENSIONS.LENGTH, baseVar: "t", aliases: ["Tooth Thickness", "Circular Thickness", "T"] },
  "S_space": { name: "Tooth Space", symbol: "S", dimension: DIMENSIONS.LENGTH, baseVar: "S_space", aliases: ["Tooth Space", "Space Width"] },
  "B": { name: "Backlash", symbol: "B", dimension: DIMENSIONS.LENGTH, baseVar: "B", aliases: ["Tooth Backlash", "Backlash"] },
  "D_o": { name: "Outside Blank Diameter", symbol: "D_o", dimension: DIMENSIONS.LENGTH, baseVar: "D_o", aliases: ["Outside Blank Diameter", "Tip Diameter"] },
  "D_r": { name: "Root Diameter", symbol: "D_r", dimension: DIMENSIONS.LENGTH, baseVar: "D_r", aliases: ["Root Diameter", "Dedendum Circle Diameter"] },
  "D_b": { name: "Base Circle Diameter", symbol: "D_b", dimension: DIMENSIONS.LENGTH, baseVar: "D_b", aliases: ["Base Circle Diameter", "Base Diameter"] },
  "p_b": { name: "Base Pitch", symbol: "p_b", dimension: DIMENSIONS.LENGTH, baseVar: "p_b", aliases: ["Base Pitch", "Normal Base Pitch"] },
  "W": { name: "Normal Contact Force", symbol: "F_n", dimension: DIMENSIONS.FORCE, baseVar: "W", aliases: ["Normal Contact Force", "Total Tooth Load", "F_n"] },
  "phi": { name: "Pressure Angle", symbol: "\\phi", dimension: DIMENSIONS.ANGLE, unit: "deg", baseVar: "phi", aliases: ["Pressure Angle", "Angle of Obliquity"] },
  "S_n": { name: "Endurance Strength", symbol: "S_n", dimension: DIMENSIONS.STRESS, baseVar: "S_n", aliases: ["Endurance Strength", "Fatigue Limit"] },
  "y_form": { name: "Lewis Form Factor", symbol: "y", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "y_form", aliases: ["Lewis Form Factor", "y"] },
  "k_f": { name: "Stress Reduction Factor", symbol: "k_f", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "k_f", aliases: ["Stress Reduction Factor", "k_f"] },
  "F_s": { name: "Beam Fatigue Strength", symbol: "F_s", dimension: DIMENSIONS.FORCE, baseVar: "F_s", aliases: ["Beam Fatigue Strength", "Lewis Safe Load", "F_s"] },
  "F_w": { name: "Wear Load", symbol: "F_w", dimension: DIMENSIONS.FORCE, baseVar: "F_w", aliases: ["Wear Load", "Buckingham Wear Load", "F_w"] },
  "Q": { name: "Ratio Factor for Gearing", symbol: "Q", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "Q", aliases: ["Ratio Factor for Gearing", "Q"] },
  "K_w": { name: "Load-Stress Factor", symbol: "K_w", dimension: DIMENSIONS.STRESS, baseVar: "K_w", aliases: ["Load-Stress Factor", "Wear Factor", "k_g", "K_w"] },
  "N_sf": { name: "Service Factor for Fatigue", symbol: "N_{sf}", dimension: DIMENSIONS.DIMENSIONLESS, baseVar: "N_sf", aliases: ["Service Factor for Fatigue", "Fatigue Factor of Safety", "N_sf"] }
});

export function getVarMeta(varKey) {
  return GEAR_VARS_DB[varKey] || {
    name: varKey,
    symbol: varKey,
    dimension: DIMENSIONS.DIMENSIONLESS
  };
}