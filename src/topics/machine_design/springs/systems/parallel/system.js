/**
 * src/topics/machine_design/springs/systems/parallel/system.js
 * Parallel Spring System ground truth generator (mirrors Video Problem 3).
 */

import { createSpringSystemGroundTruth } from "../common/index.js";
import { createParallelVarsDb } from "./schema.js";

export function createParallelSystem({ sys = "SI", count = 3 } = {}) {
  const { S, _u } = createSpringSystemGroundTruth({ sys, isParallel: true, count });
  const varsDb = createParallelVarsDb(count);

  const _names = {};
  for (const [k, meta] of Object.entries(varsDb)) {
    _names[k] = meta.nameAliases?.[0] || meta.name;
  }

  return { ...S, _names, _u };
}
