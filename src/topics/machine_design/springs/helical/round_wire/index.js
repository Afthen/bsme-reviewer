/**
 * src/topics/machine_design/springs/helical/round_wire/index.js
 */
import { HELICAL_ROUND_VARS_DB } from "./schema.js";
import { HELICAL_ROUND_RELATIONS } from "./relations.js";
import { createHelicalRoundSystem } from "./system.js";

export const helicalRoundTopic = Object.freeze({
  id: "md_springs_helical_round",
  title: "Round Wire",
  subject: "Machine Design",
  category: "Springs / Helical Coil Springs",
  noun: "round-wire helical coil spring",
  varsDb: HELICAL_ROUND_VARS_DB,
  relations: HELICAL_ROUND_RELATIONS,
  createSystem: createHelicalRoundSystem
});
