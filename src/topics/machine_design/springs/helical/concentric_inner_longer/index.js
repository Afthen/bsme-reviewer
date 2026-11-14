import { CONCENTRIC_INNER_VARS_DB } from "./schema.js";
import { CONCENTRIC_INNER_RELATIONS } from "./relations.js";
import { createConcentricInnerSystem } from "./system.js";
export const concentricInnerTopic = Object.freeze({
  id: "md_springs_helical_concentric_inner",
  title: "Concentric (Inner Longer)",
  subject: "Machine Design",
  category: "Springs / Helical Coil Springs",
  noun: "concentric spring assembly with longer inner coil",
  varsDb: CONCENTRIC_INNER_VARS_DB,
  relations: CONCENTRIC_INNER_RELATIONS,
  createSystem: createConcentricInnerSystem
});
