/**
 * src/topics/machine_design/stress/beam_bending_shear/index.js
 * Beam Bending & Transverse Shear Topic.
 */

import { BEAM_BENDING_VARS_DB } from "./schema.js";
import { BEAM_BENDING_RELATIONS } from "./relations.js";
import { createBeamBendingSystem } from "./system.js";

export const beamBendingShearTopic = Object.freeze({
  id: "stress_beam_bending_shear",
  title: "Beam Bending & Transverse Shear",
  subject: "Machine Design",
  category: "Stress",
  noun: "simply supported rectangular beam",
  varsDb: BEAM_BENDING_VARS_DB,
  relations: BEAM_BENDING_RELATIONS,
  createSystem: createBeamBendingSystem
});
