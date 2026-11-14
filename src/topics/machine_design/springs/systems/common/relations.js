/**
 * src/topics/machine_design/springs/systems/common/relations.js
 * Fractal base relations for spring systems.
 */

import { defineRelation, compileRelations } from "../../../../../core/relation_builder.js";

export function createSpringSystemBaseRelations(count = 3) {
  return compileRelations([
    defineRelation({
      id: "eq_base_spring_system_rate",
      name: "System Hooke's Law",
      canonicalTex: "k_T = \\frac{F_T}{\\delta_T}",
      formula: "k_T = F_T / delta_T"
    }),
    defineRelation({
      id: "eq_base_spring_element_rate",
      name: "Individual Spring Element Rate",
      canonicalTex: "F_i = k_i \\delta_i",
      formula: "F_i = k_i * delta_i",
      indexed: true,
      count
    })
  ], { count });
}

export const SPRING_SYSTEM_BASE_RELATIONS = createSpringSystemBaseRelations(3);
