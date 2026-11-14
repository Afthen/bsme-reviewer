/**
 * src/topics/machine_design/springs/common/relations.js
 * Universal spring physics relations shared across all spring topics.
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";

export const SPRING_BASE_RELATIONS = compileRelations([
  defineRelation({
    id: "eq_base_spring_rate",
    name: "Hooke's Law Spring Rate",
    canonicalTex: "k = \\frac{F}{\\delta}",
    formula: "k = F / delta"
  }),
  defineRelation({
    id: "eq_base_spring_energy_f_delta",
    name: "Spring Potential Energy (Force-Deflection)",
    canonicalTex: "SPE = \\frac{1}{2} F \\delta",
    formula: "SPE = 0.5 * F * delta"
  }),
  defineRelation({
    id: "eq_base_spring_energy_k_delta",
    name: "Spring Potential Energy (Stiffness-Deflection)",
    canonicalTex: "SPE = \\frac{1}{2} k \\delta^2",
    formula: "SPE = 0.5 * k * (delta^2)"
  })
]);
