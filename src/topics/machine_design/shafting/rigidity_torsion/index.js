/**
 * src/topics/machine_design/shafting/rigidity_torsion/index.js
 */

import { SHAFT_RIGIDITY_TORSION_VARS_DB } from "./schema.js";
import { SHAFT_RIGIDITY_TORSION_RELATIONS } from "./relations.js";
import { createShaftRigidityTorsionSystem } from "./system.js";

export const shaftRigidityTorsionTopic = Object.freeze({
  id: "shafting_rigidity_torsion",
  title: "Torsional Rigidity & Stepped Shaft Twist",
  subject: "Machine Design",
  category: "Shafting",
  noun: "stepped power-transmitting shaft",
  varsDb: SHAFT_RIGIDITY_TORSION_VARS_DB,
  relations: SHAFT_RIGIDITY_TORSION_RELATIONS,
  createSystem: createShaftRigidityTorsionSystem
});
