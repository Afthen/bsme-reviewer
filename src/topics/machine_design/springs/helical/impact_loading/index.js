/**
 * src/topics/machine_design/springs/helical/impact_loading/index.js
 */
import { IMPACT_VARS_DB } from "./schema.js";
import { IMPACT_RELATIONS } from "./relations.js";
import { createImpactSystem } from "./system.js";

export const impactLoadingTopic = Object.freeze({
  id: "md_springs_helical_impact",
  title: "Impact Loading",
  subject: "Machine Design",
  category: "Springs / Helical Coil Springs",
  noun: "helical spring under impact loading",
  varsDb: IMPACT_VARS_DB,
  relations: IMPACT_RELATIONS,
  createSystem: createImpactSystem
});
