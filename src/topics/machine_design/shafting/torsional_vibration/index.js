/**
 * src/topics/machine_design/shafting/torsional_vibration/index.js
 */

import { SHAFT_TORSIONAL_VIB_VARS_DB } from "./schema.js";
import { SHAFT_TORSIONAL_VIB_RELATIONS } from "./relations.js";
import { createShaftTorsionalVibSystem } from "./system.js";

export const shaftTorsionalVibTopic = Object.freeze({
  id: "shafting_torsional_vibration",
  title: "Torsional Vibration & Multi-Rotor Dynamics",
  subject: "Machine Design",
  category: "Shafting",
  noun: "two-rotor torsionally vibrating shaft",
  varsDb: SHAFT_TORSIONAL_VIB_VARS_DB,
  relations: SHAFT_TORSIONAL_VIB_RELATIONS,
  createSystem: createShaftTorsionalVibSystem
});
