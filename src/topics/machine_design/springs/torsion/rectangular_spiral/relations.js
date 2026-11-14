/**
 * src/topics/machine_design/springs/torsion/rectangular_spiral/relations.js
 */
import { defineRelation, compileRelations } from "../../../../../core/relation_builder.js";
import { SPRING_TORSION_MOMENT_REL, SPRING_RATE_ENERGY_RELS } from "../../common/spring_base_relations.js";
import { RECT_SPIRAL_VARS_DB } from "./schema.js";

export const RECT_SPIRAL_RELATIONS = compileRelations([
  SPRING_TORSION_MOMENT_REL,
  defineRelation({ id: "eq_torsion_rect_defl", name: "Spiral Torsion Deflection (Rectangular)", formula: "delta = (12 * F * L * (L_a^2)) / (E * b * (t^3))" }),
  ...SPRING_RATE_ENERGY_RELS
], { varsDb: RECT_SPIRAL_VARS_DB });
