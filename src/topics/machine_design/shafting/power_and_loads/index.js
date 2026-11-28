/**
 * src/topics/machine_design/shafting/power_and_loads/index.js
 */

import { SHAFT_POWER_LOADS_VARS_DB } from "./schema.js";
import { SHAFT_POWER_LOADS_RELATIONS } from "./relations.js";
import { createShaftPowerLoadsSystem } from "./system.js";

export const shaftPowerLoadsTopic = Object.freeze({
  id: "shafting_power_and_loads",
  title: "Power, Transmission Loads & Bearing Reactions",
  subject: "Machine Design",
  category: "Shafting",
  noun: "rotating transmission shaft",
  varsDb: SHAFT_POWER_LOADS_VARS_DB,
  relations: SHAFT_POWER_LOADS_RELATIONS,
  createSystem: createShaftPowerLoadsSystem
});
