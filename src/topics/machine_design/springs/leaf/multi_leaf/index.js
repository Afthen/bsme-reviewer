import { MULTI_LEAF_VARS_DB } from "./schema.js";
import { MULTI_LEAF_RELATIONS } from "./relations.js";
import { createMultiLeafSystem } from "./system.js";

export const multiLeafTopic = Object.freeze({
  id: "md_springs_leaf_multi",
  title: "Multiple Leaves",
  subject: "Machine Design",
  category: "Springs / Leaf Springs",
  noun: "multi-leaf laminated spring",
  varsDb: MULTI_LEAF_VARS_DB,
  relations: MULTI_LEAF_RELATIONS,
  createSystem: createMultiLeafSystem
});
