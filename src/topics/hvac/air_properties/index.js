import { AIR_PROPERTIES_VARS_DB } from "./schema.js";
import { AIR_PROPERTIES_RELATIONS } from "./relations.js";
import { createAirPropertiesSystem } from "./system.js";

export const airPropertiesTopic = Object.freeze({
  id: "hvac_air_properties",
  title: "Air Properties",
  subject: "Air Conditioning",
  category: null, // Sits directly under Air Conditioning folder alongside Air Handling
  noun: "psychrometric moist air sample",
  varsDb: AIR_PROPERTIES_VARS_DB,
  relations: AIR_PROPERTIES_RELATIONS,
  createSystem: createAirPropertiesSystem
});
