/**
 * src/topics/machine_design/shafting/overhung_design/index.js
 */

import { SHAFT_OVERHUNG_VARS_DB } from "./schema.js";
import { SHAFT_OVERHUNG_RELATIONS } from "./relations.js";
import { createShaftOverhungSystem } from "./system.js";

export const shaftOverhungDesignTopic = Object.freeze({
  id: "shafting_overhung_design",
  title: "Overhung Shaft: Strength, Rigidity & Dynamics",
  subject: "Machine Design",
  category: "Shafting",
  noun: "overhung cantilevered transmission shaft",
  varsDb: SHAFT_OVERHUNG_VARS_DB,
  relations: SHAFT_OVERHUNG_RELATIONS,
  createSystem: createShaftOverhungSystem
});
