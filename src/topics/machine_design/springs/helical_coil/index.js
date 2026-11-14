/**
 * src/topics/machine_design/springs/helical_coil/index.js
 * Round-wire Helical Coil Spring Topic.
 */

import { HELICAL_COIL_VARS_DB } from "./schema.js";
import { HELICAL_COIL_RELATIONS } from "./relations.js";
import { createHelicalCoilSystem } from "./system.js";

export const helicalCoilTopic = Object.freeze({
  id: "springs_helical_coil",
  title: "Helical Coil Springs",
  subject: "Machine Design",
  category: "Springs",
  noun: "helical coil spring (round wire)",
  varsDb: HELICAL_COIL_VARS_DB,
  relations: HELICAL_COIL_RELATIONS,
  createSystem: createHelicalCoilSystem
});
