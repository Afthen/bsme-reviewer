/**
 * src/topics/machine_design/springs/helical/impact_loading/relations.js
 */
import { defineRelation, compileRelations } from "../../../../../core/relation_builder.js";
import { SPRING_RATE_ENERGY_RELS } from "../../common/spring_base_relations.js";
import { IMPACT_VARS_DB } from "./schema.js";

export const IMPACT_RELATIONS = compileRelations([
  defineRelation({ id: "eq_impact_static_defl", name: "Static Deflection", formula: "delta_st = W_drop / k" }),
  defineRelation({ id: "eq_impact_factor", name: "Dynamic Impact Factor", formula: "I_f = 1 + sqrt(1 + (2 * h) / delta_st)" }),
  defineRelation({ id: "eq_impact_dyn_defl", name: "Impact Deflection", formula: "delta = I_f * delta_st" }),
  defineRelation({ id: "eq_impact_dyn_force", name: "Maximum Impact Force", formula: "F = I_f * W_drop" }),
  defineRelation({ id: "eq_impact_st_from_dyn", name: "Static Deflection from Impact Travel", formula: "delta_st = (delta^2) / (2 * (h + delta))" }),
  defineRelation({ id: "eq_impact_work_force", name: "Impact Energy Balance (Force)", formula: "W_drop * (h + delta) = 0.5 * F * delta" }),
  defineRelation({ id: "eq_impact_work_rate", name: "Impact Energy Balance (Stiffness)", formula: "W_drop * (h + delta) = 0.5 * k * (delta^2)" }),
  defineRelation({ id: "eq_impact_work_spe", name: "Impact Work & Potential Energy", formula: "W_drop * (h + delta) = SPE" }),
  ...SPRING_RATE_ENERGY_RELS
], { varsDb: IMPACT_VARS_DB });
