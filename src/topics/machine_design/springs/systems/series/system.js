/**
 * src/topics/machine_design/springs/systems/series/system.js
 * Series Spring System ground truth generator.
 */

import { createSpringSystemGroundTruth } from "../common/index.js";
import { createSeriesVarsDb } from "./schema.js";

export function createSeriesSystem({ sys = "SI", count = 3 } = {}) {
  return createSpringSystemGroundTruth({
    sys,
    isParallel: false,
    count,
    varsDb: createSeriesVarsDb(count)
  });
}
