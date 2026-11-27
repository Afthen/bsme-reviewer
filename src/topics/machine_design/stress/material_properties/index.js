/**
 * src/topics/machine_design/stress/material_properties/index.js
 * Material Properties & Elastic Constants Topic.
 */

import { MATERIAL_PROPERTIES_VARS_DB } from "./schema.js";
import { MATERIAL_PROPERTIES_RELATIONS } from "./relations.js";
import { createMaterialPropertiesSystem } from "./system.js";

export const materialPropertiesTopic = Object.freeze({
  id: "stress_material_properties",
  title: "Material Properties & Elastic Constants",
  subject: "Machine Design",
  category: "Stress",
  noun: "cylindrical tensile test specimen",
  varsDb: MATERIAL_PROPERTIES_VARS_DB,
  relations: MATERIAL_PROPERTIES_RELATIONS,
  createSystem: createMaterialPropertiesSystem
});
