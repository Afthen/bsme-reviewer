import { TOWER_VARS_DB } from "./schema.js";
import { COOLING_TOWER_RELATIONS } from "./relations.js";
import { createCoolingTowerSystem } from "./system.js";

export const coolingTowerTopic = Object.freeze({
  id: "hvac_cooling_tower",
  title: "Cooling Towers",
  subject: "Air Conditioning",
  noun: "induced draft cooling tower",
  varsDb: TOWER_VARS_DB,
  relations: COOLING_TOWER_RELATIONS,
  createSystem: createCoolingTowerSystem,
  cycleGivens: ["t_w1", "t_w2", "t_wb1", "h_1", "h_2", "W_1", "W_2", "m_w", "c_pw"],
  primaryGoals: ["m_mu", "m_a", "Q_rej", "A_ct", "R_ct"],
  terminalGoals: ["m_mu", "Q_rej"]
});
