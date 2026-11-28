/**
 * src/topics/machine_design/shafting/critical_speed/index.js
 */

import { SHAFT_CRITICAL_SPEED_VARS_DB } from "./schema.js";
import { SHAFT_CRITICAL_SPEED_RELATIONS } from "./relations.js";
import { createShaftCriticalSpeedSystem } from "./system.js";

export const shaftCriticalSpeedTopic = Object.freeze({
  id: "shafting_critical_speed",
  title: "Lateral Critical Speed & Whirling Unbalance",
  subject: "Machine Design",
  category: "Shafting",
  noun: "high-speed rotating rotor shaft",
  varsDb: SHAFT_CRITICAL_SPEED_VARS_DB,
  relations: SHAFT_CRITICAL_SPEED_RELATIONS,
  createSystem: createShaftCriticalSpeedSystem
});
