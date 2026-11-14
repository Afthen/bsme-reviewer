/**
 * src/topics/machine_design/springs/leaf/single_leaf/relations.js
 */
import { defineRelation, compileRelations } from "../../../../../core/relation_builder.js";
import { SPRING_RATE_ENERGY_RELS } from "../../common/spring_base_relations.js";
import { SINGLE_LEAF_VARS_DB } from "./schema.js";

export const SINGLE_LEAF_RELATIONS = compileRelations([
  defineRelation({ id: "eq_sleaf_moment", name: "Cantilever Bending Moment", formula: "M = F * L" }),
  defineRelation({ id: "eq_sleaf_fiber_dist", name: "Extreme Fiber Distance", formula: "c = t / 2" }),
  defineRelation({ id: "eq_sleaf_inertia", name: "Rectangular Section Moment of Inertia", formula: "I = (b * (t^3)) / 12" }),
  defineRelation({ id: "eq_sleaf_stress_mci", name: "Flexural Bending Stress (Mc/I)", formula: "S = (M * c) / I" }),
  defineRelation({ id: "eq_sleaf_stress_fl", name: "Single-Leaf Bending Stress", formula: "S = (6 * F * L) / (b * (t^2))" }),
  defineRelation({ id: "eq_sleaf_defl_s", name: "Single-Leaf Deflection (Stress Form)", formula: "delta = (2 * S * (L^2)) / (3 * t * E)" }),
  defineRelation({ id: "eq_sleaf_defl_f", name: "Single-Leaf Deflection (Load Form)", formula: "delta = (4 * F * (L^3)) / (E * b * (t^3))" }),
  ...SPRING_RATE_ENERGY_RELS
], { varsDb: SINGLE_LEAF_VARS_DB });
