import { UNIFORM_LEAF_VARS_DB } from "./schema.js";
import { UNIFORM_LEAF_RELATIONS } from "./relations.js";
import { createUniformLeafSystem } from "./system.js";

export const uniformStrengthLeafTopic = Object.freeze({
  id: "md_springs_leaf_uniform",
  title: "Cantilever (Uniform Strength)",
  subject: "Machine Design",
  category: "Springs / Leaf Springs",
  noun: "uniform-strength graduated cantilever leaf spring",
  varsDb: UNIFORM_LEAF_VARS_DB,
  relations: UNIFORM_LEAF_RELATIONS,
  createSystem: createUniformLeafSystem
});
