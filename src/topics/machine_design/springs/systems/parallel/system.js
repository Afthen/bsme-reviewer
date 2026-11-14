/**
 * src/topics/machine_design/springs/systems/parallel/system.js
 * Parallel Spring System ground truth generator (mirrors Video Problem 3).
 */

import { createSpringSystemGroundTruth } from "../common/index.js";
import { createParallelVarsDb } from "./schema.js";

export function createParallelSystem({ sys = "SI", count = 3 } = {}) {
  return createSpringSystemGroundTruth({
    sys,
    isParallel: true,
    count,
    varsDb: createParallelVarsDb(count)
  });
}
