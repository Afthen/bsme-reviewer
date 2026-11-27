/**
 * src/topics/machine_design/stress/torsion/index.js
 * Torsion of Circular Members Topic.
 */

import { TORSION_VARS_DB } from "./schema.js";
import { TORSION_RELATIONS } from "./relations.js";
import { createTorsionSystem } from "./system.js";

export const torsionTopic = Object.freeze({
  id: "stress_torsion",
  title: "Torsion of Circular Members",
  subject: "Machine Design",
  category: "Stress",
  noun: "stepped solid-and-hollow circular torsion assembly",
  varsDb: TORSION_VARS_DB,
  relations: TORSION_RELATIONS,
  createSystem: createTorsionSystem
});
