/**
 * src/topics/machine_design/springs/leaf/single_leaf/schema.js
 */
import { DIMENSIONS } from "../../../../../core/dimensions.js";
import { SPRING_BASE_VARS } from "../../common/spring_base_schema.js";
import { LEAF_COMMON_VARS } from "../leaf_common.js";

export const SINGLE_LEAF_VARS_DB = Object.freeze({
  ...LEAF_COMMON_VARS,
  M: SPRING_BASE_VARS.M,
  c: { name: "Extreme Fiber Distance", symbol: "c", dimension: DIMENSIONS.LENGTH, unit: "mm", aliases: ["Extreme Fiber Distance", "Half Leaf Thickness"] },
  I: { name: "Area Moment of Inertia", symbol: "I", dimension: DIMENSIONS.AREA_MOMENT, unit: "mm^4", aliases: ["Area Moment of Inertia", "Second Moment of Area"] }
});
