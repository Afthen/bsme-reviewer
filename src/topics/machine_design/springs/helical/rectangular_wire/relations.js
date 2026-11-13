/**
 * src/topics/machine_design/springs/helical/rectangular_wire/relations.js
 * Source: Vallance & Doughtie / Wahl (rectangular-wire helical stress & deflection,
 * corrected to dimensionally homogeneous (b - 0.56*t)).
 */
import { defineRelation, compileRelations } from "../../../../../core/relation_builder.js";
import {
  SPRING_WIRE_LEN_REL, SPRING_STRESS_FACTORS_RELS, SPRING_RATE_ENERGY_RELS
} from "../../common/spring_base_relations.js";
import { RECT_WIRE_VARS_DB } from "./schema.js";

export const RECT_WIRE_RELATIONS = compileRelations([
  defineRelation({ id: "eq_rectspring_index", name: "Rectangular-Wire Spring Index", formula: "C = D_m / t" }),
  SPRING_WIRE_LEN_REL,
  ...SPRING_STRESS_FACTORS_RELS,
  defineRelation({ id: "eq_rectspring_stress", name: "Rectangular-Wire Shear Stress", formula: "S = (K_w * F * D_m * (3 * b + 1.8 * t)) / (2 * (b^2) * (t^2))" }),
  defineRelation({ id: "eq_rectspring_defl", name: "Rectangular-Wire Deflection", formula: "delta = (2.5 * F * (D_m^3) * n) / (G * (t^3) * (b - 0.56 * t))" }),
  ...SPRING_RATE_ENERGY_RELS
], { varsDb: RECT_WIRE_VARS_DB });
