/**
 * src/topics/machine_design/pressure_vessels/asme_shells_and_heads/index.js
 * ASME Section VIII Division 1 Pressure Vessel Shells and Formed Heads Topic.
 */

import { ASME_SHELLS_AND_HEADS_VARS_DB } from "./schema.js";
import { ASME_SHELLS_AND_HEADS_RELATIONS } from "./relations.js";
import { createAsmeShellsAndHeadsSystem } from "./system.js";

export const asmeShellsAndHeadsTopic = Object.freeze({
  id: "pv_asme_shells_and_heads",
  title: "ASME Section VIII Pressure Vessel Design",
  subject: "Machine Design",
  category: "Pressure Vessels",
  noun: "ASME Section VIII Division 1 pressure vessel shell and formed head",
  varsDb: ASME_SHELLS_AND_HEADS_VARS_DB,
  relations: ASME_SHELLS_AND_HEADS_RELATIONS,
  createSystem: createAsmeShellsAndHeadsSystem
});
