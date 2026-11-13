/**
 * src/topics/machine_design/springs/helical/square_wire/relations.js
 * Source: Vallance & Doughtie / Faires, Design of Machine Elements (square-wire helical equations).
 */
import { defineRelation, compileRelations } from "../../../../../core/relation_builder.js";
import {
  SPRING_WIRE_LEN_REL, SPRING_STRESS_FACTORS_RELS, SPRING_RATE_ENERGY_RELS
} from "../../common/spring_base_relations.js";
import { SQUARE_WIRE_VARS_DB } from "./schema.js";

export const SQUARE_WIRE_RELATIONS = compileRelations([
  defineRelation({ id: "eq_sqspring_index", name: "Square-Wire Spring Index", formula: "C = D_m / b" }),
  SPRING_WIRE_LEN_REL,
  ...SPRING_STRESS_FACTORS_RELS,
  defineRelation({ id: "eq_sqspring_stress", name: "Square-Wire Shear Stress", formula: "S = (2.4 * K_w * F * D_m) / (b^3)" }),
  defineRelation({ id: "eq_sqspring_defl", name: "Square-Wire Deflection", formula: "delta = (5.575 * F * (D_m^3) * n) / (G * (b^4))" }),
  ...SPRING_RATE_ENERGY_RELS
], { varsDb: SQUARE_WIRE_VARS_DB });
