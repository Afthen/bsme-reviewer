/**
 * src/topics/machine_design/springs/systems/series/index.js
 * Series Spring System topic with dynamic variadic n support.
 */

import { SERIES_VARS_DB, createSeriesVarsDb } from "./schema.js";
import { SERIES_RELATIONS, createSeriesRelations } from "./relations.js";
import { createSeriesSystem } from "./system.js";

export const springSeriesTopic = Object.freeze({
  id: "springs_series",
  title: "Springs in Series",
  subject: "Machine Design",
  category: "Springs",
  noun: "series-connected spring system",
  varsDb: SERIES_VARS_DB,
  relations: SERIES_RELATIONS,
  createSystem: (opts) => createSeriesSystem({ ...opts, count: 3 }),
  countRange: [2, 4],
  instantiate: (n) => ({
    varsDb: createSeriesVarsDb(n),
    relations: createSeriesRelations(n),
    createSystem: (opts) => createSeriesSystem({ ...opts, count: n })
  })
});
