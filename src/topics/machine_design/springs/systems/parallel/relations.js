/**
 * src/topics/machine_design/springs/systems/parallel/relations.js
 * Parallel Spring System relations using continued-formula operators.
 */

import { defineRelation, compileRelations } from "../../../../../core/relation_builder.js";
import { SPRING_SYSTEM_BASE_RELATIONS } from "../common/index.js";

export function createParallelRelations(count = 3) {
  return compileRelations([
    ...SPRING_SYSTEM_BASE_RELATIONS,

    defineRelation({
      id: "eq_spring_parallel_stiffness",
      name: "Equivalent Stiffness (Parallel)",
      canonicalTex: "k_T = k_1 + k_2 + \\dots + k_n",
      formula: "k_T = sum(k_i)",
      count
    }),
    defineRelation({
      id: "eq_spring_parallel_force",
      name: "Total Load (Parallel)",
      canonicalTex: "F_T = F_1 + F_2 + \\dots + F_n",
      formula: "F_T = sum(F_i)",
      count
    }),
    defineRelation({
      id: "eq_spring_parallel_deflection",
      name: "Deflection Equality (Parallel)",
      canonicalTex: "\\delta_T = \\delta_1 = \\delta_2 = \\dots = \\delta_n",
      formula: "delta_T = chain(delta_i)",
      count
    }),
    defineRelation({
      id: "eq_spring_parallel_elem_force",
      name: "Element Force from Total Deflection",
      canonicalTex: "F_i = k_i \\delta_T",
      formula: "F_i = k_i * delta_T",
      count
    })
  ], { count });
}

export const PARALLEL_RELATIONS = createParallelRelations(3);
