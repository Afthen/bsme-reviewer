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
  terminalGoals: ["q_c", "q_rh", "V_s"]
});
