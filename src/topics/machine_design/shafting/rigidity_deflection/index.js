/**
 * src/topics/machine_design/shafting/rigidity_deflection/index.js
 */

import { SHAFT_RIGIDITY_DEFLECTION_VARS_DB } from "./schema.js";
import { SHAFT_RIGIDITY_DEFLECTION_RELATIONS } from "./relations.js";
import { createShaftRigidityDeflectionSystem } from "./system.js";

export const shaftRigidityDeflectionTopic = Object.freeze({
  id: "shafting_rigidity_deflection",
  title: "Lateral Rigidity: Deflection, Slope & Alignment",
  subject: "Machine Design",
  category: "Shafting",
  noun: "stiffness-critical transmission shaft",
  varsDb: SHAFT_RIGIDITY_DEFLECTION_VARS_DB,
  relations: SHAFT_RIGIDITY_DEFLECTION_RELATIONS,
  createSystem: createShaftRigidityDeflectionSystem
});
