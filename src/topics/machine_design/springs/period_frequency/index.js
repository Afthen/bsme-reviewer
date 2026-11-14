/**
 * src/topics/machine_design/springs/period_frequency/index.js
 * Period and Frequency Topic.
 */

import { PERIOD_FREQUENCY_VARS_DB } from "./schema.js";
import { PERIOD_FREQUENCY_RELATIONS } from "./relations.js";
import { createPeriodFrequencySystem } from "./system.js";

export const periodFrequencyTopic = Object.freeze({
  id: "springs_period_frequency",
  title: "Spring Period & Frequency",
  subject: "Machine Design",
  category: "Springs",
  noun: "mass-spring oscillatory system",
  varsDb: PERIOD_FREQUENCY_VARS_DB,
  relations: PERIOD_FREQUENCY_RELATIONS,
  createSystem: createPeriodFrequencySystem
});
