/**
 * src/topics/machine_design/shafting/rigidity_torsion/relations.js
 * Stepped-Shaft Torsional Rigidity, Equivalent Uniform Diameter, and Rigidity vs. Strength Sizing.
 * References: Shigley (Ch. 3 & Ch. 7), Beer & Johnston (Ch. 3).
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";
import { EQ_BASE_SHAFT_OMEGA, EQ_BASE_SHAFT_POWER } from "../../common/shaft_base_relations.js";

export const SHAFT_RIGIDITY_TORSION_RELATIONS = compileRelations([
  EQ_BASE_SHAFT_OMEGA,
  EQ_BASE_SHAFT_POWER,

  defineRelation({
    id: "eq_shaft_rtor_ltot",
    name: "Total Stepped Shaft Length",
    canonicalTex: "L_{tot} = L_1 + L_2 + L_3",
    formula: "L_tot = L_1 + L_2 + L_3"
  }),
  defineRelation({
    id: "eq_shaft_rtor_j1",
    name: "Segment 1 Polar Moment of Inertia",
    canonicalTex: "J_1 = \\frac{\\pi d_1^4}{32}",
    formula: "J_1 = (pi * (d_1^4)) / 32"
  }),
  defineRelation({
    id: "eq_shaft_rtor_j2",
    name: "Segment 2 Polar Moment of Inertia",
    canonicalTex: "J_2 = \\frac{\\pi d_2^4}{32}",
    formula: "J_2 = (pi * (d_2^4)) / 32"
  }),
  defineRelation({
    id: "eq_shaft_rtor_j3",
    name: "Segment 3 Polar Moment of Inertia",
    canonicalTex: "J_3 = \\frac{\\pi d_3^4}{32}",
    formula: "J_3 = (pi * (d_3^4)) / 32"
  }),
  defineRelation({
    id: "eq_shaft_rtor_t1",
    name: "Segment 1 Angle of Twist",
    canonicalTex: "\\theta_1 = \\frac{T L_1}{G J_1}",
    formula: "theta_1 = (T * L_1) / (G * J_1)"
  }),
  defineRelation({
    id: "eq_shaft_rtor_t2",
    name: "Segment 2 Angle of Twist",
    canonicalTex: "\\theta_2 = \\frac{T L_2}{G J_2}",
    formula: "theta_2 = (T * L_2) / (G * J_2)"
  }),
  defineRelation({
    id: "eq_shaft_rtor_t3",
    name: "Segment 3 Angle of Twist",
    canonicalTex: "\\theta_3 = \\frac{T L_3}{G J_3}",
    formula: "theta_3 = (T * L_3) / (G * J_3)"
  }),
  defineRelation({
    id: "eq_shaft_rtor_ttot",
    name: "Total Stepped Shaft Angle of Twist",
    canonicalTex: "\\theta_{tot} = \\theta_1 + \\theta_2 + \\theta_3",
    formula: "theta_tot = theta_1 + theta_2 + theta_3"
  }),
  defineRelation({
    id: "eq_shaft_rtor_kt",
    name: "Overall Torsional Stiffness",
    canonicalTex: "k_t = \\frac{T}{\\theta_{tot}}",
    formula: "k_t = T / theta_tot"
  }),
  defineRelation({
    id: "eq_shaft_rtor_jeq",
    name: "Equivalent Uniform Polar Inertia",
    canonicalTex: "J_{eq} = \\frac{T L_{tot}}{G \\theta_{tot}}",
    formula: "J_eq = (T * L_tot) / (G * theta_tot)"
  }),
  defineRelation({
    id: "eq_shaft_rtor_deq",
    name: "Equivalent Uniform Shaft Diameter",
    canonicalTex: "J_{eq} = \\frac{\\pi d_{eq}^4}{32}",
    formula: "J_eq = (pi * (d_eq^4)) / 32"
  }),
  defineRelation({
    id: "eq_shaft_rtor_jrig",
    name: "Twist-Required Polar Moment of Inertia",
    canonicalTex: "J_{rig} = \\frac{T L_{tot}}{G \\theta_{allow}}",
    formula: "J_rig = (T * L_tot) / (G * theta_allow)"
  }),
  defineRelation({
    id: "eq_shaft_rtor_drig",
    name: "Torsional Rigidity Shaft Diameter",
    canonicalTex: "J_{rig} = \\frac{\\pi d_{rig,T}^4}{32}",
    formula: "J_rig = (pi * (d_rig_T^4)) / 32"
  }),
  defineRelation({
    id: "eq_shaft_rtor_zpstr",
    name: "Torsional Strength Polar Section Modulus",
    canonicalTex: "Z_{p,str} = \\frac{T}{\\tau_{allow}}",
    formula: "Z_p_str = T / tau_allow"
  }),
  defineRelation({
    id: "eq_shaft_rtor_dstr",
    name: "Torsional Strength Shaft Diameter",
    canonicalTex: "Z_{p,str} = \\frac{\\pi d_{str,T}^3}{16}",
    formula: "Z_p_str = (pi * (d_str_T^3)) / 16"
  }),
  defineRelation({
    id: "eq_shaft_rtor_ntheta",
    name: "Torsional Rigidity Margin",
    canonicalTex: "n_{\\theta} = \\frac{\\theta_{allow}}{\\theta_{tot}}",
    formula: "n_theta = theta_allow / theta_tot"
  })
]);
