/**
 * src/topics/hvac/dryers/index.js
 * Topic manifest for Industrial / Air Dryers under Air Conditioning.
 */

import { DRYER_VARS_DB } from "./schema.js";
import { DRYER_RELATIONS } from "./relations.js";
import { createDryerSystem } from "./system.js";

export const dryersTopic = Object.freeze({
  id: "hvac_dryers",
  title: "Dryers",
  subject: "Air Conditioning",
  category: null,
  noun: "adiabatic air dryer",
  varsDb: DRYER_VARS_DB,
  relations: DRYER_RELATIONS,
  createSystem: createDryerSystem
});
