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
  createSystem: createCoolingTowerSystem
});
