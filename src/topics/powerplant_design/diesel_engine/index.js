import { DIESEL_ENGINE_VARS_DB } from "./schema.js";
import { DIESEL_ENGINE_RELATIONS } from "./relations.js";
import { createDieselEngineSystem } from "./system.js";

export const dieselEngineTopic = Object.freeze({
  id: "powerplant_design_diesel_engine",
  title: "Diesel Engine Machinery",
  subject: "Powerplant Design",
  category: "Internal Combustion Engines",
  noun: "stationary Diesel engine powerplant",
  varsDb: DIESEL_ENGINE_VARS_DB,
  relations: DIESEL_ENGINE_RELATIONS,
  createSystem: createDieselEngineSystem,
});
