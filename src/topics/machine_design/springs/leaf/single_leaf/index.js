import { SINGLE_LEAF_VARS_DB } from "./schema.js";
import { SINGLE_LEAF_RELATIONS } from "./relations.js";
import { createSingleLeafSystem } from "./system.js";

export const singleLeafTopic = Object.freeze({
  id: "md_springs_leaf_single",
  title: "Single Leaf",
  subject: "Machine Design",
  category: "Springs / Leaf Springs",
  noun: "single-leaf cantilever spring",
  varsDb: SINGLE_LEAF_VARS_DB,
  relations: SINGLE_LEAF_RELATIONS,
  createSystem: createSingleLeafSystem
});
