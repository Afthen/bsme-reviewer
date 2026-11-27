/**
 * src/topics/machine_design/stress/fatigue/index.js
 * Fatigue Strength, Marin Equation & Fluctuating Stress Criteria Topic.
 */

import { FATIGUE_VARS_DB } from "./schema.js";
import { FATIGUE_RELATIONS } from "./relations.js";
import { createFatigueSystem } from "./system.js";

export const fatigueTopic = Object.freeze({
  id: "stress_fatigue",
  title: "Fatigue, Marin & Fluctuating Stress",
  subject: "Machine Design",
  category: "Stress",
  noun: "cyclically loaded notched rotating steel bar",
  varsDb: FATIGUE_VARS_DB,
  relations: FATIGUE_RELATIONS,
  createSystem: createFatigueSystem
});
