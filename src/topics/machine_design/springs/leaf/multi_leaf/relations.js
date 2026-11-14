/**
 * src/topics/machine_design/springs/leaf/multi_leaf/relations.js
 * Source: Vallance & Doughtie / Faires, Design of Machine Elements
 * (Young's modulus E restored in denominator of multi-leaf deflection).
 */
import { defineRelation, compileRelations } from "../../../../../core/relation_builder.js";
import { SPRING_RATE_ENERGY_RELS } from "../../common/spring_base_relations.js";
import { MULTI_LEAF_VARS_DB } from "./schema.js";

export const MULTI_LEAF_RELATIONS = compileRelations([
  defineRelation({ id: "eq_mleaf_stress", name: "Multi-Leaf Bending Stress", formula: "S = (18 * F * L) / (b * (t^2) * (2 * n_g + 3 * n_f))" }),
  defineRelation({ id: "eq_mleaf_defl", name: "Multi-Leaf Deflection (Load Form)", formula: "delta = (12 * F * (L^3)) / (E * b * (t^3) * (2 * n_g + 3 * n_f))" }),
  defineRelation({ id: "eq_mleaf_defl_stress", name: "Multi-Leaf Deflection (Stress Form)", formula: "delta = (2 * S * (L^2)) / (3 * t * E)" }),
  ...SPRING_RATE_ENERGY_RELS
], { varsDb: MULTI_LEAF_VARS_DB });
