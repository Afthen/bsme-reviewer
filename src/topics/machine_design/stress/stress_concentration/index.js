/**
 * src/topics/machine_design/stress/stress_concentration/index.js
 * Stress Concentration & Notch Sensitivity Topic.
 */

import { STRESS_CONCENTRATION_VARS_DB } from "./schema.js";
import { STRESS_CONCENTRATION_RELATIONS } from "./relations.js";
import { createStressConcentrationSystem } from "./system.js";

export const stressConcentrationTopic = Object.freeze({
  id: "stress_concentration",
  title: "Stress Concentration & Notch Sensitivity",
  subject: "Machine Design",
  category: "Stress",
  noun: "stepped circular bar with a shoulder fillet",
  varsDb: STRESS_CONCENTRATION_VARS_DB,
  relations: STRESS_CONCENTRATION_RELATIONS,
  createSystem: createStressConcentrationSystem
});
