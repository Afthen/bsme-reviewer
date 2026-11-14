/**
 * src/topics/machine_design/springs/systems/series/system.js
 * Series Spring System ground truth generator.
 */

import { createSpringSystemGroundTruth } from "../common/index.js";
import { createSeriesVarsDb } from "./schema.js";

export function createSeriesSystem({ sys = "SI", count = 3 } = {}) {
  const { S, _u } = createSpringSystemGroundTruth({ sys, isParallel: false, count });
  const varsDb = createSeriesVarsDb(count);

  const _names = {};
  for (const [k, meta] of Object.entries(varsDb)) {
    _names[k] = meta.nameAliases?.[0] || meta.name;
  }

  return { ...S, _names, _u };
}
