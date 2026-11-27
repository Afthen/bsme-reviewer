/**
 * src/topics/machine_design/stress/combined_loading/index.js
 * Combined Axial, Eccentric Bending & Torsion Loading Topic.
 */

import { COMBINED_LOADING_VARS_DB } from "./schema.js";
import { COMBINED_LOADING_RELATIONS } from "./relations.js";
import { createCombinedLoadingSystem } from "./system.js";

export const combinedLoadingTopic = Object.freeze({
  id: "stress_combined_loading",
  title: "Combined Axial, Bending & Torsion",
  subject: "Machine Design",
  category: "Stress",
  noun: "circular bar under combined axial, bending, and torsional loads",
  varsDb: COMBINED_LOADING_VARS_DB,
  relations: COMBINED_LOADING_RELATIONS,
  createSystem: createCombinedLoadingSystem
});
