/**
 * src/topics/machine_design/springs/leaf/uniform_strength/relations.js
 */
import { defineRelation, compileRelations } from "../../../../../core/relation_builder.js";
import { SPRING_RATE_ENERGY_RELS } from "../../common/spring_base_relations.js";
import { UNIFORM_LEAF_VARS_DB } from "./schema.js";

export const UNIFORM_LEAF_RELATIONS = compileRelations([
  defineRelation({ id: "eq_uleaf_stress", name: "Uniform-Strength Cantilever Stress", formula: "S = (6 * F * L) / (b * (t^2))" }),
  defineRelation({ id: "eq_uleaf_defl_stress", name: "Uniform-Strength Deflection (Stress Form)", formula: "delta = (S * (L^2)) / (t * E)" }),
  defineRelation({ id: "eq_uleaf_defl_load", name: "Uniform-Strength Deflection (Load Form)", formula: "delta = (6 * F * (L^3)) / (E * b * (t^3))" }),
  ...SPRING_RATE_ENERGY_RELS
], { varsDb: UNIFORM_LEAF_VARS_DB });
