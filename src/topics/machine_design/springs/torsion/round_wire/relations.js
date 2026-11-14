/**
 * src/topics/machine_design/springs/torsion/round_wire/relations.js
 * Source: Wahl / Shigley (11th ed., Eq. 10-43) inner-fiber torsion curvature factor k_1.
 */
import { defineRelation, compileRelations } from "../../../../../core/relation_builder.js";
import {
  SPRING_INDEX_REL, SPRING_WIRE_LEN_REL, SPRING_TORSION_MOMENT_REL, SPRING_RATE_ENERGY_RELS
} from "../../common/spring_base_relations.js";
import { TORSION_ROUND_VARS_DB } from "./schema.js";

export const TORSION_ROUND_RELATIONS = compileRelations([
  SPRING_INDEX_REL,
  SPRING_WIRE_LEN_REL,
  SPRING_TORSION_MOMENT_REL,
  defineRelation({ id: "eq_torsion_k1", name: "Inner-Fiber Curvature Factor", formula: "k_1 = (4 * (C^2) - C - 1) / (4 * C * (C - 1))" }),
  defineRelation({ id: "eq_torsion_stress_m", name: "Torsion Bending Stress (Moment Form)", formula: "S = (k_1 * 32 * M) / (pi * (d_w^3))" }),
  defineRelation({ id: "eq_torsion_stress_f", name: "Torsion Bending Stress (Force Form)", formula: "S = (k_1 * 32 * F * L_a) / (pi * (d_w^3))" }),
  defineRelation({ id: "eq_torsion_defl_helical", name: "Helical Torsion Deflection (Round)", formula: "delta = (64 * F * D_m * (L_a^2) * n) / (E * (d_w^4))" }),
  defineRelation({ id: "eq_torsion_defl_spiral", name: "Spiral Torsion Deflection (Round)", formula: "delta = (64 * F * L * (L_a^2)) / (pi * E * (d_w^4))" }),
  ...SPRING_RATE_ENERGY_RELS
], { varsDb: TORSION_ROUND_VARS_DB });
