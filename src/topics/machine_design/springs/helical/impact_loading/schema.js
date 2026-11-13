/**
 * src/topics/machine_design/springs/helical/impact_loading/schema.js
 */
import { DIMENSIONS } from "../../../../../core/dimensions.js";
import { SPRING_BASE_VARS } from "../../common/spring_base_schema.js";

export const IMPACT_VARS_DB = Object.freeze({
  W_drop: { name: "Falling Weight", symbol: "W", dimension: DIMENSIONS.FORCE, unit: "N", aliases: ["Falling Weight", "Impacting Weight", "Dropped Load"] },
  h: { name: "Drop Height", symbol: "h", dimension: DIMENSIONS.LENGTH, unit: "mm", aliases: ["Drop Height", "Free-Fall Height", "Height of Drop"] },
  delta_st: { name: "Static Deflection", symbol: "\\delta_{st}", dimension: DIMENSIONS.LENGTH, unit: "mm", aliases: ["Static Deflection", "Static Spring Deflection"] },
  I_f: { name: "Dynamic Impact Factor", symbol: "I_f", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Dynamic Impact Factor", "Shock Amplification Factor"] },
  F: { ...SPRING_BASE_VARS.F, name: "Maximum Impact Load", aliases: ["Maximum Impact Load", "Dynamic Peak Force"] },
  delta: { ...SPRING_BASE_VARS.delta, name: "Maximum Impact Deflection", aliases: ["Maximum Impact Deflection", "Dynamic Compression"] },
  k: SPRING_BASE_VARS.k,
  SPE: SPRING_BASE_VARS.SPE
});
