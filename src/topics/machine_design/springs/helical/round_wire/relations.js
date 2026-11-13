/**
 * src/topics/machine_design/springs/helical/round_wire/relations.js
 */
import { defineRelation, compileRelations } from "../../../../../core/relation_builder.js";
import {
  SPRING_INDEX_REL, SPRING_WIRE_LEN_REL, SPRING_STRESS_FACTORS_RELS,
  SPRING_RATE_ENERGY_RELS, SPRING_FREE_SOLID_REL, SPRING_FREE_OP_REL
} from "../../common/spring_base_relations.js";
import { HELICAL_ROUND_VARS_DB } from "./schema.js";

export const HELICAL_ROUND_RELATIONS = compileRelations([
  defineRelation({ id: "eq_hround_dm_avg", name: "Mean Diameter from Inner & Outer", formula: "D_m = (D_o + D_i) / 2" }),
  defineRelation({ id: "eq_hround_dm_do", name: "Mean Diameter from Outer Diameter", formula: "D_m = D_o - d_w" }),
  defineRelation({ id: "eq_hround_dm_di", name: "Mean Diameter from Inner Diameter", formula: "D_m = D_i + d_w" }),
  defineRelation({ id: "eq_hround_dm_rm", name: "Mean Diameter from Mean Radius", formula: "D_m = 2 * R_m" }),
  SPRING_INDEX_REL,
  defineRelation({ id: "eq_hround_c_do", name: "Spring Index from Outer Diameter", formula: "C = (D_o - d_w) / d_w" }),
  defineRelation({ id: "eq_hround_c_di", name: "Spring Index from Inner Diameter", formula: "C = (D_i + d_w) / d_w" }),
  defineRelation({ id: "eq_hround_pitch_angle", name: "Helix Pitch Angle", formula: "tan(alpha) = p / (pi * D_m)" }),
  SPRING_WIRE_LEN_REL,
  ...SPRING_STRESS_FACTORS_RELS,
  defineRelation({ id: "eq_hround_stress_dm", name: "Torsional Shear Stress (Mean Diameter)", formula: "S_f = (8 * K_w * F * D_m) / (pi * (d_w^3))" }),
  defineRelation({ id: "eq_hround_stress_c", name: "Torsional Shear Stress (Spring Index)", formula: "S_f = (8 * K_w * F * C) / (pi * (d_w^2))" }),
  defineRelation({ id: "eq_hround_defl_dm", name: "Helical Spring Deflection (Mean Diameter)", formula: "delta = (8 * F * (D_m^3) * n) / (G * (d_w^4))" }),
  defineRelation({ id: "eq_hround_defl_c", name: "Helical Spring Deflection (Spring Index)", formula: "delta = (8 * F * (C^3) * n) / (G * d_w)" }),
  defineRelation({ id: "eq_hround_actual_coils", name: "Actual Total Coils", formula: "n_a = n + n_dead" }),
  defineRelation({ id: "eq_hround_solid_len", name: "Solid Length", formula: "SL = (n + k_end) * d_w" }),
  defineRelation({ id: "eq_hround_free_len_pitch", name: "Free Length from Pitch", formula: "FL = n * p + k_end * d_w" }),
  SPRING_FREE_SOLID_REL,
  SPRING_FREE_OP_REL,
  ...SPRING_RATE_ENERGY_RELS,
  defineRelation({ id: "eq_hround_rate_s1", name: "Spring Rate (State 1)", formula: "k = F_1 / delta_1" }),
  defineRelation({ id: "eq_hround_rate_s2", name: "Spring Rate (State 2)", formula: "k = F_2 / delta_2" }),
  defineRelation({ id: "eq_hround_df", name: "Incremental Force", formula: "dF = F_2 - F_1" }),
  defineRelation({ id: "eq_hround_ddelta", name: "Incremental Deflection", formula: "ddelta = delta_2 - delta_1" }),
  defineRelation({ id: "eq_hround_rate_inc", name: "Incremental Spring Rate", formula: "k = dF / ddelta" }),
  defineRelation({ id: "eq_hround_fl_ol1", name: "Free Length (State 1)", formula: "FL = OL_1 + delta_1" }),
  defineRelation({ id: "eq_hround_fl_ol2", name: "Free Length (State 2)", formula: "FL = OL_2 + delta_2" }),
  defineRelation({ id: "eq_hround_ddelta_ol", name: "Incremental Deflection from Lengths", formula: "ddelta = OL_1 - OL_2" })
], { varsDb: HELICAL_ROUND_VARS_DB });
