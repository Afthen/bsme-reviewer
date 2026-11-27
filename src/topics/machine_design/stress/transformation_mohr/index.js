/**
 * src/topics/machine_design/stress/transformation_mohr/index.js
 * Plane & 3D Stress Transformation (Mohr's Circle) Topic.
 */

import { TRANSFORMATION_MOHR_VARS_DB } from "./schema.js";
import { TRANSFORMATION_MOHR_RELATIONS } from "./relations.js";
import { createTransformationMohrSystem } from "./system.js";

export const transformationMohrTopic = Object.freeze({
  id: "stress_transformation_mohr",
  title: "Stress Transformation & Mohr's Circle",
  subject: "Machine Design",
  category: "Stress",
  noun: "three-dimensional stress element",
  varsDb: TRANSFORMATION_MOHR_VARS_DB,
  relations: TRANSFORMATION_MOHR_RELATIONS,
  createSystem: createTransformationMohrSystem
});
