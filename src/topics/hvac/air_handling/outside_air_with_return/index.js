import { MIXED_AIR_VARS_DB } from "./schema.js";
import { MIXED_AIR_RELATIONS } from "./relations.js";
import { createMixedAirSystem } from "./system.js";

export const mixedAirTopic = Object.freeze({
  id: "hvac_mixed_air",
  title: "Air Handling (Outside Air with Return)",
  subject: "Air Conditioning",
  noun: "mixed air handling unit",
  varsDb: MIXED_AIR_VARS_DB,
  relations: MIXED_AIR_RELATIONS,
  createSystem: createMixedAirSystem
});
