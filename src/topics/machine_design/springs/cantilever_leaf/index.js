/**
 * src/topics/machine_design/springs/cantilever_leaf/index.js
 * Cantilever Leaf Spring Topic.
 */

import { CANTILEVER_LEAF_VARS_DB } from "./schema.js";
import { CANTILEVER_LEAF_RELATIONS } from "./relations.js";
import { createCantileverLeafSystem } from "./system.js";

export const cantileverLeafTopic = Object.freeze({
  id: "springs_cantilever_leaf",
  title: "Cantilever Leaf Springs",
  subject: "Machine Design",
  category: "Springs",
  noun: "cantilever leaf spring",
  varsDb: CANTILEVER_LEAF_VARS_DB,
  relations: CANTILEVER_LEAF_RELATIONS,
  createSystem: createCantileverLeafSystem
});
