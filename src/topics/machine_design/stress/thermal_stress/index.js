/**
 * src/topics/machine_design/stress/thermal_stress/index.js
 * Thermal Stress & Combined Thermal-Mechanical Loading Topic.
 */

import { THERMAL_STRESS_VARS_DB } from "./schema.js";
import { THERMAL_STRESS_RELATIONS } from "./relations.js";
import { createThermalStressSystem } from "./system.js";

export const thermalStressTopic = Object.freeze({
  id: "stress_thermal_stress",
  title: "Thermal Stress & Restrained Expansion",
  subject: "Machine Design",
  category: "Stress",
  noun: "thermally loaded structural bar assembly",
  varsDb: THERMAL_STRESS_VARS_DB,
  relations: THERMAL_STRESS_RELATIONS,
  createSystem: createThermalStressSystem
});
