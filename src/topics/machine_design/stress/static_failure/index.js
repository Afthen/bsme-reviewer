/**
 * src/topics/machine_design/stress/static_failure/index.js
 * Static Failure Theories & Allowable Stress Design Topic.
 */

import { STATIC_FAILURE_VARS_DB } from "./schema.js";
import { STATIC_FAILURE_RELATIONS } from "./relations.js";
import { createStaticFailureSystem } from "./system.js";

export const staticFailureTopic = Object.freeze({
  id: "stress_static_failure",
  title: "Static Failure Theories & Design",
  subject: "Machine Design",
  category: "Stress",
  noun: "biaxially stressed structural component",
  varsDb: STATIC_FAILURE_VARS_DB,
  relations: STATIC_FAILURE_RELATIONS,
  createSystem: createStaticFailureSystem
});
