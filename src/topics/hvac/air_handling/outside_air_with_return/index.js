import { MIXED_AIR_VARS_DB } from "./schema.js";
import { MIXED_AIR_RELATIONS } from "./relations.js";
import { createMixedAirSystem } from "./system.js";

export const mixedAirTopic = Object.freeze({
  id: "hvac_mixed_air",
  title: "Outside Air with Return",
  subject: "Air Conditioning",
  category: "Air Handling",
  noun: "mixed air handling unit",
  varsDb: MIXED_AIR_VARS_DB,
  relations: MIXED_AIR_RELATIONS,
  createSystem: createMixedAirSystem,
  cycleGivens: ["m_o", "m_r", "t_o", "t_r", "h_o", "h_r", "h_s", "v_o", "v_m"],
  primaryGoals: ["q_c", "V_m", "h_m", "t_m", "m_m", "y", "V_o"],
  terminalGoals: ["q_c", "V_m"]
});
