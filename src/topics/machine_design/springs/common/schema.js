/**
 * src/topics/machine_design/springs/common/schema.js
 * Universal core spring variables shared across all mechanical spring subtopics.
 */

import { DIMENSIONS } from "../../../../core/dimensions.js";

export const SPRING_BASE_VARS = Object.freeze({
  "F": {
    name: "Applied Load",
    symbol: "F",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    nameAliases: ["Applied Load", "Spring Force", "Axial Load", "Compressive Load"],
    symbolAliases: ["F", "W", "P"],
    aliases: ["Applied Load", "Spring Force", "Axial Load", "Compressive Load", "F", "W"]
  },
  "delta": {
    name: "Spring Deflection",
    symbol: "\\delta",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Spring Deflection", "Axial Deflection", "Elongation", "Compression Distance"],
    symbolAliases: ["\\delta", "y", "x"],
    aliases: ["Spring Deflection", "Axial Deflection", "Elongation", "Compression Distance", "delta", "y"]
  },
  "k": {
    name: "Spring Rate",
    symbol: "k",
    dimension: DIMENSIONS.STIFFNESS,
    unit: "N/mm",
    nameAliases: ["Spring Rate", "Spring Stiffness", "Spring Constant", "Load Gradient"],
    symbolAliases: ["k", "K"],
    aliases: ["Spring Rate", "Spring Stiffness", "Spring Constant", "Load Gradient", "k"]
  },
  "SPE": {
    name: "Spring Potential Energy",
    symbol: "SPE",
    dimension: DIMENSIONS.ENERGY,
    unit: "J",
    nameAliases: ["Spring Potential Energy", "Strain Energy", "Stored Elastic Energy", "Resilience"],
    symbolAliases: ["SPE", "U", "E_p"],
    aliases: ["Spring Potential Energy", "Strain Energy", "Stored Elastic Energy", "Resilience", "SPE", "U"]
  }
});
