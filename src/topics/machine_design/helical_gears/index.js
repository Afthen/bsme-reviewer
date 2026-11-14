import { HELICAL_RELATION_GRAPH } from "./relations.js";
import { HELICAL_VARS_DB } from "./schema.js";
import { createGroundTruthHelicalSystem } from "./system.js";

export const helicalGearsTopic = Object.freeze({
  id: "helical_gears",
  title: "Helical Gears",
  subject: "Machine Design",
  noun: "helical gear drive",
  varsDb: HELICAL_VARS_DB,
  relations: HELICAL_RELATION_GRAPH,
  createSystem: createGroundTruthHelicalSystem
});
