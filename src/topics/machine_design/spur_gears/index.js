import { GEAR_RELATION_GRAPH } from "./relations.js";
import { GEAR_VARS_DB } from "./schema.js";
import { createGroundTruthSystem } from "./system.js";

export const spurGearsTopic = Object.freeze({
  id: "spur_gears",
  title: "Spur Gears",
  subject: "Machine Design",
  noun: "spur gear drive",
  varsDb: GEAR_VARS_DB,
  relations: GEAR_RELATION_GRAPH,
  createSystem: createGroundTruthSystem
});

export default spurGearsTopic;
