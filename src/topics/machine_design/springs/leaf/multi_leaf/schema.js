/**
 * src/topics/machine_design/springs/leaf/multi_leaf/schema.js
 */
import { DIMENSIONS } from "../../../../../core/dimensions.js";
import { LEAF_COMMON_VARS } from "../leaf_common.js";

export const MULTI_LEAF_VARS_DB = Object.freeze({
  ...LEAF_COMMON_VARS,
  n_g: { name: "Graduated Leaves", symbol: "n_g", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", isInteger: true, aliases: ["Graduated Leaves", "Number of Graduated Leaves", "n_g"] },
  n_f: { name: "Full-Length Leaves", symbol: "n_f", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", isInteger: true, aliases: ["Full-Length Leaves", "Number of Full Leaves", "n_f"] }
});
