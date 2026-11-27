/**
 * src/topics/machine_design/pressure_vessels/thick_walled_cylinders/index.js
 * Thick-Walled Cylinders & Lamé Theory Topic.
 */

import { THICK_WALLED_CYLINDERS_VARS_DB } from "./schema.js";
import { THICK_WALLED_CYLINDERS_RELATIONS } from "./relations.js";
import { createThickWalledCylindersSystem } from "./system.js";

export const thickWalledCylindersTopic = Object.freeze({
  id: "pv_thick_walled_cylinders",
  title: "Thick-Walled Cylinders & Lamé Theory",
  subject: "Machine Design",
  category: "Pressure Vessels",
  noun: "thick-walled cylinder under internal pressure",
  varsDb: THICK_WALLED_CYLINDERS_VARS_DB,
  relations: THICK_WALLED_CYLINDERS_RELATIONS,
  createSystem: createThickWalledCylindersSystem
});
