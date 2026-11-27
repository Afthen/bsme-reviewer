/**
 * src/topics/machine_design/pressure_vessels/thin_walled_cylinders/index.js
 * Thin-Walled Cylindrical Pressure Vessels Topic.
 */

import { THIN_WALLED_CYLINDERS_VARS_DB } from "./schema.js";
import { THIN_WALLED_CYLINDERS_RELATIONS } from "./relations.js";
import { createThinWalledCylindersSystem } from "./system.js";

export const thinWalledCylindersTopic = Object.freeze({
  id: "pv_thin_walled_cylinders",
  title: "Thin-Walled Cylindrical Vessels",
  subject: "Machine Design",
  category: "Pressure Vessels",
  noun: "thin-walled cylindrical pressure vessel",
  varsDb: THIN_WALLED_CYLINDERS_VARS_DB,
  relations: THIN_WALLED_CYLINDERS_RELATIONS,
  createSystem: createThinWalledCylindersSystem
});
