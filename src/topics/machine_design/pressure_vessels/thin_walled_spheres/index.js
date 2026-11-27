/**
 * src/topics/machine_design/pressure_vessels/thin_walled_spheres/index.js
 * Thin-Walled Spherical Pressure Vessels Topic.
 */

import { THIN_WALLED_SPHERES_VARS_DB } from "./schema.js";
import { THIN_WALLED_SPHERES_RELATIONS } from "./relations.js";
import { createThinWalledSpheresSystem } from "./system.js";

export const thinWalledSpheresTopic = Object.freeze({
  id: "pv_thin_walled_spheres",
  title: "Thin-Walled Spherical Vessels",
  subject: "Machine Design",
  category: "Pressure Vessels",
  noun: "thin-walled spherical pressure vessel",
  varsDb: THIN_WALLED_SPHERES_VARS_DB,
  relations: THIN_WALLED_SPHERES_RELATIONS,
  createSystem: createThinWalledSpheresSystem
});
