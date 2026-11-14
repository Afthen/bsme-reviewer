/**
 * src/topics/machine_design/springs/systems/parallel/index.js
 * Parallel Spring System topic with dynamic variadic n support.
 */

import { PARALLEL_VARS_DB, createParallelVarsDb } from "./schema.js";
import { PARALLEL_RELATIONS, createParallelRelations } from "./relations.js";
import { createParallelSystem } from "./system.js";

export const springParallelTopic = Object.freeze({
  id: "springs_parallel",
  title: "Springs in Parallel",
  subject: "Machine Design",
  category: "Springs",
  noun: "parallel-connected spring system",
  varsDb: PARALLEL_VARS_DB,
  relations: PARALLEL_RELATIONS,
  createSystem: (opts) => createParallelSystem({ ...opts, count: 3 }),
  countRange: [2, 4],
  instantiate: (n) => ({
    varsDb: createParallelVarsDb(n),
    relations: createParallelRelations(n),
    createSystem: (opts) => createParallelSystem({ ...opts, count: n })
  })
});
