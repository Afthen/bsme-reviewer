/**
 * src/topics/machine_design/shafting/fatigue_design/index.js
 */

import { SHAFT_FATIGUE_VARS_DB } from "./schema.js";
import { SHAFT_FATIGUE_RELATIONS } from "./relations.js";
import { createShaftFatigueSystem } from "./system.js";

export const shaftFatigueDesignTopic = Object.freeze({
  id: "shafting_fatigue_design",
  title: "Rotating Shaft Fatigue & Stress Concentration",
  subject: "Machine Design",
  category: "Shafting",
  noun: "stepped rotating shaft under cyclic loading",
  varsDb: SHAFT_FATIGUE_VARS_DB,
  relations: SHAFT_FATIGUE_RELATIONS,
  createSystem: createShaftFatigueSystem
});
