/**
 * src/topics/machine_design/springs/cantilever_leaf/schema.js
 * Cantilever leaf spring schema (Lecture Video Problem 4).
 */

import { SPRING_BASE_VARS } from "../common/index.js";
import { DIMENSIONS } from "../../../../core/dimensions.js";

export const CANTILEVER_LEAF_VARS_DB = Object.freeze({
  "F": {
    ...SPRING_BASE_VARS.F,
    nameAliases: ["Applied Load", "End Load", "Cantilever Load"],
    aliases: ["Applied Load", "End Load", "Cantilever Load", "F"]
  },
  "delta": {
    ...SPRING_BASE_VARS.delta,
    nameAliases: ["Spring Deflection", "Tip Deflection", "Cantilever Deflection"],
    aliases: ["Spring Deflection", "Tip Deflection", "Cantilever Deflection", "delta"]
  },
  "k": SPRING_BASE_VARS.k,
  "S": {
    name: "Maximum Bending Stress",
    symbol: "S",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Maximum Bending Stress", "Bending Stress", "Leaf Stress"],
    symbolAliases: ["S", "\\sigma", "\\sigma_b"],
    aliases: ["Maximum Bending Stress", "Bending Stress", "Leaf Stress", "S"]
  },
  "L": {
    name: "Cantilever Length",
    symbol: "L",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Cantilever Length", "Spring Length", "Span"],
    symbolAliases: ["L"],
    aliases: ["Cantilever Length", "Spring Length", "Span", "L"]
  },
  "b": {
    name: "Leaf Width",
    symbol: "b",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Leaf Width", "Width of Leaves"],
    symbolAliases: ["b"],
    aliases: ["Leaf Width", "Width of Leaves", "b"]
  },
  "t": {
    name: "Leaf Thickness",
    symbol: "t",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Leaf Thickness", "Thickness of Leaves"],
    symbolAliases: ["t"],
    aliases: ["Leaf Thickness", "Thickness of Leaves", "t"]
  },
  "n_leaves": {
    name: "Number of Leaves",
    symbol: "n",
    dimension: DIMENSIONS.COUNT,
    unit: "dimless",
    isInteger: true,
    nameAliases: ["Number of Leaves", "Leaf Count"],
    symbolAliases: ["n", "N_l"],
    aliases: ["Number of Leaves", "Leaf Count", "n_leaves", "n"]
  },
  "E": {
    name: "Modulus of Elasticity",
    symbol: "E",
    dimension: DIMENSIONS.MODULUS,
    unit: "GPa",
    isConstant: true,
    display: 207,
    nameAliases: ["Modulus of Elasticity", "Young's Modulus"],
    symbolAliases: ["E"],
    aliases: ["Modulus of Elasticity", "Young's Modulus", "E"]
  }
});
