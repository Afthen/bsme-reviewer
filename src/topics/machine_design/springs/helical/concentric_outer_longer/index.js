import { CONCENTRIC_OUTER_VARS_DB } from "./schema.js";
import { CONCENTRIC_OUTER_RELATIONS } from "./relations.js";
import { createConcentricOuterSystem } from "./system.js";
export const concentricOuterTopic = Object.freeze({
  id: "md_springs_helical_concentric_outer",
  title: "Concentric (Outer Longer)",
  subject: "Machine Design",
  category: "Springs / Helical Coil Springs",
  noun: "concentric spring assembly with longer outer coil",
  varsDb: CONCENTRIC_OUTER_VARS_DB,
  relations: CONCENTRIC_OUTER_RELATIONS,
  createSystem: createConcentricOuterSystem
});
