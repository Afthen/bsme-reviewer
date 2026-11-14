/**
 * src/topics/machine_design/springs/systems/series/relations.js
 * Series Spring System relations using continued-formula operators.
 */

import { defineRelation, compileRelations } from "../../../../../core/relation_builder.js";
import { createSpringSystemBaseRelations } from "../common/index.js";

export function createSeriesRelations(count = 3) {
  return compileRelations([
    ...createSpringSystemBaseRelations(count),

    defineRelation({
      id: "eq_spring_series_stiffness",
      name: "Equivalent Stiffness (Series)",
      canonicalTex: "\\frac{1}{k_T} = \\frac{1}{k_1} + \\frac{1}{k_2} + \\dots + \\frac{1}{k_n}",
      formula: "1 / k_T = sum(1 / k_i)",
      count
    }),
    defineRelation({
      id: "eq_spring_series_force",
      name: "Force Equality (Series)",
      canonicalTex: "F_T = F_1 = F_2 = \\dots = F_n",
      formula: "F_T = chain(F_i)",
      count
    }),
    defineRelation({
      id: "eq_spring_series_deflection",
      name: "Total Deflection (Series)",
      canonicalTex: "\\delta_T = \\delta_1 + \\delta_2 + \\dots + \\delta_n",
      formula: "delta_T = sum(delta_i)",
      count
    }),
    defineRelation({
      id: "eq_spring_series_elem_disp",
      name: "Element Deflection from Total Force",
      canonicalTex: "\\delta_i = \\frac{F_T}{k_i}",
      formula: "delta_i = F_T / k_i",
      indexed: true,
      count
    })
  ], { count });
}

export const SERIES_RELATIONS = createSeriesRelations(3);
