/**
 * src/topics/machine_design/springs/helical/parallel/index.js
 */
import {
  buildSpringNetworkSchema,
  buildSpringNetworkRelations,
  createSpringNetworkSystem
} from "../../common/spring_systems_helper.js";
import { PARALLEL_SPRINGS_VARS_DB } from "./schema.js";
import { PARALLEL_SPRINGS_RELATIONS } from "./relations.js";
import { createParallelSpringsSystem } from "./system.js";

export const parallelSpringsTopic = Object.freeze({
  id: "md_springs_helical_parallel",
  title: "Parallel Systems",
  subject: "Machine Design",
  category: "Springs / Helical Coil Springs",
  noun: "parallel-connected helical spring system",
  countRange: [2, 4],
  varsDb: PARALLEL_SPRINGS_VARS_DB,
  relations: PARALLEL_SPRINGS_RELATIONS,
  createSystem: createParallelSpringsSystem,
  instantiate(count = 3) {
    return {
      varsDb: buildSpringNetworkSchema(count),
      relations: buildSpringNetworkRelations("parallel", count),
      createSystem: ({ sys = "SI" } = {}) => createSpringNetworkSystem({ sys, mode: "parallel", count })
    };
  }
});
