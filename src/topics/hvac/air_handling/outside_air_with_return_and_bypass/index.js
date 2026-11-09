/**
 * src/topics/hvac/air_handling/outside_air_with_return_and_bypass/index.js
 * Complete Air Handling Cycle with Return, Bypass Factor, Reheat, and State Points 1 to 6.
 */

import { BYPASS_AIR_VARS_DB } from "./schema.js";
import { BYPASS_AIR_RELATIONS } from "./relations.js";
import { createBypassAirSystem } from "./system.js";

export const bypassAirTopic = Object.freeze({
  id: "hvac_bypass_air",
  title: "Coil with Bypass",
  subject: "Air Conditioning",
  category: "Air Handling",
  noun: "cooling coil with bypass factor",
  varsDb: BYPASS_AIR_VARS_DB,
  relations: BYPASS_AIR_RELATIONS,
  createSystem: createBypassAirSystem,
  cycleGivens: ["m_o", "m_r", "t_o", "t_r", "h_o", "h_r", "t_adp", "h_adp", "BF", "t_rh", "v_o", "v_s", "c_pa"],
  primaryGoals: ["q_c", "q_rh", "V_s", "h_s", "t_s", "CF", "h_m", "t_m", "m_m"],
  terminalGoals: ["q_c", "q_rh", "V_s"]
});
