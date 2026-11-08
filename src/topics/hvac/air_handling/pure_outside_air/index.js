import { PURE_AIR_VARS_DB } from "./schema.js";
import { PURE_AIR_RELATIONS } from "./relations.js";
import { createPureAirSystem } from "./system.js";

export const pureOutsideAirTopic = Object.freeze({
  id: "hvac_pure_outside_air",
  title: "Pure Outside Air",
  subject: "Air Conditioning",
  category: "Air Handling",
  noun: "100% outside air conditioning system",
  varsDb: PURE_AIR_VARS_DB,
  relations: PURE_AIR_RELATIONS,
  createSystem: createPureAirSystem
});
