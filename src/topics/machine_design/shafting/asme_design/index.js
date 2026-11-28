/**
 * src/topics/machine_design/shafting/asme_design/index.js
 */

import { SHAFT_ASME_VARS_DB } from "./schema.js";
import { SHAFT_ASME_RELATIONS } from "./relations.js";
import { createShaftAsmeSystem } from "./system.js";

export const shaftAsmeDesignTopic = Object.freeze({
  id: "shafting_asme_design",
  title: "ASME B17c Transmission Shafting Code",
  subject: "Machine Design",
  category: "Shafting",
  noun: "ASME code-designed transmission shaft",
  varsDb: SHAFT_ASME_VARS_DB,
  relations: SHAFT_ASME_RELATIONS,
  createSystem: createShaftAsmeSystem
});
