/**
 * src/topics/powerplant_design/diesel_cycle/index.js
 * Ideal air-standard Diesel cycle with full state point chain and cognitive fading.
 */

import { DIESEL_CYCLE_VARS_DB } from "./schema.js";
import { DIESEL_CYCLE_RELATIONS } from "./relations.js";
import { createDieselCycleSystem } from "./system.js";

export const dieselCycleTopic = Object.freeze({
  id: "powerplant_design_diesel_cycle",
  title: "Diesel Cycle (Ideal)",
  subject: "Powerplant Design",
  category: "Internal Combustion Engines",
  noun: "ideal air-standard Diesel cycle",
  varsDb: DIESEL_CYCLE_VARS_DB,
  relations: DIESEL_CYCLE_RELATIONS,
  createSystem: createDieselCycleSystem,
  cycleGivens: ["T_1", "r_k", "r_c", "k", "c_p", "c_v"],
  primaryGoals: ["e_th", "W_net", "Q_A", "Q_R", "T_4", "T_3", "T_2", "r_e"],
  terminalGoals: ["e_th", "W_net"]
});
