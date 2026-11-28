/**
 * src/topics/machine_design/shafting/static_combined_strength/index.js
 */

import { SHAFT_STATIC_STRENGTH_VARS_DB } from "./schema.js";
import { SHAFT_STATIC_STRENGTH_RELATIONS } from "./relations.js";
import { createShaftStaticStrengthSystem } from "./system.js";

export const shaftStaticStrengthTopic = Object.freeze({
  id: "shafting_static_combined_strength",
  title: "Static Combined Strength & Hollow Sizing",
  subject: "Machine Design",
  category: "Shafting",
  noun: "combined-loaded transmission shaft",
  varsDb: SHAFT_STATIC_STRENGTH_VARS_DB,
  relations: SHAFT_STATIC_STRENGTH_RELATIONS,
  createSystem: createShaftStaticStrengthSystem
});
