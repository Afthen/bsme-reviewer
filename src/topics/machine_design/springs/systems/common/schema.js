/**
 * src/topics/machine_design/springs/systems/common/schema.js
 * Fractal schema template for multi-spring network systems (Series & Parallel).
 */

import { DIMENSIONS } from "../../../../../core/dimensions.js";

export const SPRING_SYSTEM_BASE_VARS = Object.freeze({
  "F_T": {
    name: "Total Applied Load",
    symbol: "F_T",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Total Applied Load", "Total Spring Force", "System Load"],
    symbolAliases: ["F_T", "F_{total}", "W_T"],
    aliases: ["Total Applied Load", "Total Spring Force", "System Load", "F_T"]
  },
  "delta_T": {
    name: "Total Deflection",
    symbol: "\\delta_T",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Total Deflection", "System Deflection", "Total Displacement"],
    symbolAliases: ["\\delta_T", "\\delta_{total}", "y_T"],
    aliases: ["Total Deflection", "System Deflection", "Total Displacement", "delta_T"]
  },
  "k_T": {
    name: "Equivalent Stiffness",
    symbol: "k_T",
    dimension: DIMENSIONS.STIFFNESS,
    unit: "N/mm",
    nameAliases: ["Equivalent Stiffness", "Equivalent Spring Rate", "Total System Rate"],
    symbolAliases: ["k_T", "k_{eq}", "K_T"],
    aliases: ["Equivalent Stiffness", "Equivalent Spring Rate", "Total System Rate", "k_T"]
  },

  // Indexed templates instantiated via expandIndexedVarsDb
  "k_i": {
    name: "Spring {i} Stiffness",
    symbol: "k_{i}",
    dimension: DIMENSIONS.STIFFNESS,
    unit: "N/mm",
    nameAliases: ["Spring {i} Stiffness", "Spring {i} Rate"],
    symbolAliases: ["k_{i}"],
    aliases: ["Spring {i} Stiffness", "Spring {i} Rate", "k_i"]
  },
  "F_i": {
    name: "Spring {i} Load",
    symbol: "F_{i}",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Spring {i} Load", "Spring {i} Force"],
    symbolAliases: ["F_{i}"],
    aliases: ["Spring {i} Load", "Spring {i} Force", "F_i"]
  },
  "delta_i": {
    name: "Spring {i} Deflection",
    symbol: "\\delta_{i}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Spring {i} Deflection", "Spring {i} Compression"],
    symbolAliases: ["\\delta_{i}"],
    aliases: ["Spring {i} Deflection", "Spring {i} Compression", "delta_i"]
  }
});
