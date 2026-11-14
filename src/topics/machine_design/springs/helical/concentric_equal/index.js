import { CONCENTRIC_EQUAL_VARS_DB } from "./schema.js";
import { CONCENTRIC_EQUAL_RELATIONS } from "./relations.js";
import { createConcentricEqualSystem } from "./system.js";
export const concentricEqualTopic = Object.freeze({
  id: "md_springs_helical_concentric_equal",
  title: "Concentric (Equal Height)",
  subject: "Machine Design",
  category: "Springs / Helical Coil Springs",
  noun: "equal-height concentric helical spring assembly",
  varsDb: CONCENTRIC_EQUAL_VARS_DB,
  relations: CONCENTRIC_EQUAL_RELATIONS,
  createSystem: createConcentricEqualSystem
});
