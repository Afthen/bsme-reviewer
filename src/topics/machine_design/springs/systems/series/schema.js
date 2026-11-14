/**
 * src/topics/machine_design/springs/systems/series/schema.js
 * Series Spring System Schema.
 */

import { SPRING_SYSTEM_BASE_VARS } from "../common/index.js";
import { expandIndexedVarsDb } from "../../../../../core/relation_builder.js";

export function createSeriesVarsDb(count = 3) {
  return expandIndexedVarsDb(SPRING_SYSTEM_BASE_VARS, count);
}

export const SERIES_VARS_DB = createSeriesVarsDb(3);
