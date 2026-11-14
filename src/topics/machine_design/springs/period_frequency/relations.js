/**
 * src/topics/machine_design/springs/period_frequency/relations.js
 * Period and Frequency relations (Lecture Video section 11).
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";

export const PERIOD_FREQUENCY_RELATIONS = compileRelations([
  defineRelation({
    id: "eq_spring_period_frequency",
    name: "Period from Frequency",
    canonicalTex: "T = \\frac{1}{f}",
    formula: "T_period = 1 / f"
  }),
  defineRelation({
    id: "eq_spring_period_mass",
    name: "Mass-Spring Oscillation Period",
    canonicalTex: "T = 2\\pi \\sqrt{\\frac{m}{k}}",
    formula: "T_period = 2 * pi * sqrt(m / k)"
  }),
  defineRelation({
    id: "eq_pendulum_period_length",
    name: "Simple Pendulum Period",
    canonicalTex: "T = 2\\pi \\sqrt{\\frac{L}{g}}",
    formula: "T_period = 2 * pi * sqrt(L_p / g)"
  })
]);
