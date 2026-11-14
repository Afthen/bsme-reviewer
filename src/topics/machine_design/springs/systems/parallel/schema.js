/**
 * src/topics/machine_design/springs/systems/parallel/schema.js
 * Parallel Spring System Schema.
 */

import { SPRING_SYSTEM_BASE_VARS } from "../common/index.js";
import { expandIndexedVarsDb } from "../../../../../core/relation_builder.js";

export function createParallelVarsDb(count = 3) {
  return expandIndexedVarsDb(SPRING_SYSTEM_BASE_VARS, count);
}

export const PARALLEL_VARS_DB = createParallelVarsDb(3);
