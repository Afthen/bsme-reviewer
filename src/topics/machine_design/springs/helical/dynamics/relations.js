/**
 * src/topics/machine_design/springs/helical/dynamics/relations.js
 */
import { defineRelation, compileRelations } from "../../../../../core/relation_builder.js";
import { SPRING_PERIOD_FREQ_REL } from "../../common/spring_base_relations.js";
import { DYNAMICS_VARS_DB } from "./schema.js";

export const DYNAMICS_RELATIONS = compileRelations([
  SPRING_PERIOD_FREQ_REL,
  defineRelation({ id: "eq_dyn_spring_period", name: "Mass-Spring Period", formula: "T = 2 * pi * sqrt(m / k)" }),
  defineRelation({ id: "eq_dyn_spring_freq", name: "Mass-Spring Frequency", formula: "f = (1 / (2 * pi)) * sqrt(k / m)" }),
  defineRelation({ id: "eq_dyn_pendulum_period", name: "Simple Pendulum Period", formula: "T = 2 * pi * sqrt(L / g)" }),
  defineRelation({ id: "eq_dyn_pendulum_freq", name: "Simple Pendulum Frequency", formula: "f = (1 / (2 * pi)) * sqrt(g / L)" })
], { varsDb: DYNAMICS_VARS_DB });
