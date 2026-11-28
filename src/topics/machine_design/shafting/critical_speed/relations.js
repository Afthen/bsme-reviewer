/**
 * src/topics/machine_design/shafting/critical_speed/relations.js
 * Lateral Critical Speed (Rayleigh & Dunkerley Two-Rotor Bounds), Operating Margin,
 * Rotating Unbalance Force, and Jeffcott Undamped Whirl Response.
 * References: Shigley (Ch. 7, Eqs. 7-22 & 7-23), Norton (Ch. 10), Rao (Mechanical Vibrations).
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";
import { EQ_BASE_SHAFT_OMEGA } from "../../common/shaft_base_relations.js";

export const SHAFT_CRITICAL_SPEED_RELATIONS = compileRelations([
  EQ_BASE_SHAFT_OMEGA,

  defineRelation({
    id: "eq_shaft_cr_w1",
    name: "Rotor 1 Static Weight",
    canonicalTex: "W_1 = m_1 g",
    formula: "W_1 = m_1 * g"
  }),
  defineRelation({
    id: "eq_shaft_cr_k1",
    name: "Lateral Shaft Stiffness at Rotor 1",
    canonicalTex: "k_1 = \\frac{W_1}{\\delta_1}",
    formula: "k_1 = W_1 / delta_1"
  }),
  defineRelation({
    id: "eq_shaft_cr_f1",
    name: "Rotor 1 Isolated Lateral Critical Frequency",
    canonicalTex: "f_1 = \\frac{1}{2\\pi}\\sqrt{\\frac{g}{\\delta_1}}",
    formula: "f_1 = (1 / (2 * pi)) * sqrt(g / delta_1)"
  }),
  defineRelation({
    id: "eq_shaft_cr_f2",
    name: "Rotor 2 Isolated Lateral Critical Frequency",
    canonicalTex: "f_2 = \\frac{1}{2\\pi}\\sqrt{\\frac{g}{\\delta_2}}",
    formula: "f_2 = (1 / (2 * pi)) * sqrt(g / delta_2)"
  }),
  defineRelation({
    id: "eq_shaft_cr_dunkerley",
    name: "Dunkerley Lower-Bound Critical Frequency",
    canonicalTex: "\\frac{1}{f_D^2} = \\frac{1}{f_1^2} + \\frac{1}{f_2^2}",
    formula: "1 / (f_D^2) = 1 / (f_1^2) + 1 / (f_2^2)"
  }),
  defineRelation({
    id: "eq_shaft_cr_rayleigh",
    name: "Rayleigh Energy Critical Frequency",
    canonicalTex: "f_R = \\frac{1}{2\\pi}\\sqrt{\\frac{g (m_1 \\delta_1 + m_2 \\delta_2)}{m_1 \\delta_1^2 + m_2 \\delta_2^2}}",
    formula: "f_R = (1 / (2 * pi)) * sqrt((g * (m_1 * delta_1 + m_2 * delta_2)) / (m_1 * (delta_1^2) + m_2 * (delta_2^2)))"
  }),
  defineRelation({
    id: "eq_shaft_cr_omega_d",
    name: "Dunkerley Critical Angular Speed from Frequency",
    canonicalTex: "\\omega_D = 2\\pi f_D",
    formula: "omega_D = 2 * pi * f_D"
  }),
  defineRelation({
    id: "eq_shaft_cr_nd",
    name: "Dunkerley Critical Speed (RPM)",
    canonicalTex: "\\omega_D = 2\\pi n_D",
    formula: "omega_D = 2 * pi * n_D"
  }),
  defineRelation({
    id: "eq_shaft_cr_fop",
    name: "Operating Rotational Frequency",
    canonicalTex: "\\omega = 2\\pi f_{op}",
    formula: "omega = 2 * pi * f_op"
  }),
  defineRelation({
    id: "eq_shaft_cr_rcr",
    name: "Critical Speed Separation Ratio",
    canonicalTex: "r_{cr} = \\frac{n_{op}}{n_D}",
    formula: "r_cr = n_op / n_D"
  }),
  defineRelation({
    id: "eq_shaft_cr_r1",
    name: "Jeffcott Speed Ratio",
    canonicalTex: "r_1 = \\frac{f_{op}}{f_1}",
    formula: "r_1 = f_op / f_1"
  }),
  defineRelation({
    id: "eq_shaft_cr_fu",
    name: "Centrifugal Unbalance Force",
    canonicalTex: "F_u = 4\\pi^2 m_1 e_u f_{op}^2",
    formula: "F_u = 4 * (pi^2) * m_1 * e_unb * (f_op^2)"
  }),
  defineRelation({
    id: "eq_shaft_cr_whirl",
    name: "Jeffcott Undamped Whirl Amplitude",
    canonicalTex: "y_w = \\frac{e_u r_1^2}{1 - r_1^2}",
    formula: "y_w = (e_unb * (r_1^2)) / (1 - (r_1^2))"
  }),
  defineRelation({
    id: "eq_shaft_cr_fdyn",
    name: "Synchronous Dynamic Shaft Force",
    canonicalTex: "F_{dyn} = k_1 y_w",
    formula: "F_dyn = k_1 * y_w"
  })
]);
