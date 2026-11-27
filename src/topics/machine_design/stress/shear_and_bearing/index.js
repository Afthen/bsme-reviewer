/**
 * src/topics/machine_design/stress/shear_and_bearing/index.js
 * Direct Shear, Bearing & Plate Connections Topic.
 */

import { SHEAR_BEARING_VARS_DB } from "./schema.js";
import { SHEAR_BEARING_RELATIONS } from "./relations.js";
import { createShearBearingSystem } from "./system.js";

export const shearAndBearingTopic = Object.freeze({
  id: "stress_shear_and_bearing",
  title: "Direct Shear, Bearing & Connections",
  subject: "Machine Design",
  category: "Stress",
  noun: "pinned double-shear clevis plate connection",
  varsDb: SHEAR_BEARING_VARS_DB,
  relations: SHEAR_BEARING_RELATIONS,
  createSystem: createShearBearingSystem
});
