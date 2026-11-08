import { BYPASS_AIR_VARS_DB } from "./schema.js";
import { BYPASS_AIR_RELATIONS } from "./relations.js";
import { createBypassAirSystem } from "./system.js";

export const bypassAirTopic = Object.freeze({
  id: "hvac_bypass_air",
  title: "Air Handling (Coil with Bypass)",
  subject: "Air Conditioning",
  noun: "cooling coil with bypass factor",
  varsDb: BYPASS_AIR_VARS_DB,
  relations: BYPASS_AIR_RELATIONS,
  createSystem: createBypassAirSystem
});
