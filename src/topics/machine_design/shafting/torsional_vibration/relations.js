/**
 * src/topics/machine_design/shafting/torsional_vibration/relations.js
 * Two-Rotor Stepped-Shaft Torsional Vibration: Equivalent Inertia, Equivalent Length,
 * Natural Frequency, Nodal Plane Location, and Dynamic Vibratory Shear Stress.
 * References: Rao (Mechanical Vibrations, Ch. 2 & 4), Shigley (Ch. 7), Mott (Ch. 12).
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";

export const SHAFT_TORSIONAL_VIB_RELATIONS = compileRelations([
  defineRelation({
    id: "eq_shaft_tv_im1",
    name: "Rotor 1 Disc Mass Moment of Inertia",
    canonicalTex: "I_{m1} = \\frac{1}{2} m_1 R_1^2",
    formula: "I_m1 = 0.5 * m_1 * (R_1^2)"
  }),
  defineRelation({
    id: "eq_shaft_tv_im2",
    name: "Rotor 2 Disc Mass Moment of Inertia",
    canonicalTex: "I_{m2} = \\frac{1}{2} m_2 R_2^2",
    formula: "I_m2 = 0.5 * m_2 * (R_2^2)"
  }),
  defineRelation({
    id: "eq_shaft_tv_ieq",
    name: "Two-Rotor Equivalent Mass Moment of Inertia",
    canonicalTex: "\\frac{1}{I_{eq}} = \\frac{1}{I_{m1}} + \\frac{1}{I_{m2}}",
    formula: "1 / I_eq = 1 / I_m1 + 1 / I_m2"
  }),
  defineRelation({
    id: "eq_shaft_tv_j1",
    name: "Segment 1 Polar Moment of Inertia",
    canonicalTex: "J_1 = \\frac{\\pi d_1^4}{32}",
    formula: "J_1 = (pi * (d_1^4)) / 32"
  }),
  defineRelation({
    id: "eq_shaft_tv_j2",
    name: "Segment 2 Polar Moment of Inertia",
    canonicalTex: "J_2 = \\frac{\\pi d_2^4}{32}",
    formula: "J_2 = (pi * (d_2^4)) / 32"
  }),
  defineRelation({
    id: "eq_shaft_tv_ltot",
    name: "Total Shaft Length Between Rotors",
    canonicalTex: "L_{tot} = L_1 + L_2",
    formula: "L_tot = L_1 + L_2"
  }),
  defineRelation({
    id: "eq_shaft_tv_leq",
    name: "Equivalent Uniform Shaft Length (at Diameter d1)",
    canonicalTex: "L_{eq} = L_1 + L_2 \\frac{J_1}{J_2}",
    formula: "L_eq = L_1 + L_2 * (J_1 / J_2)"
  }),
  defineRelation({
    id: "eq_shaft_tv_kt1",
    name: "Segment 1 Torsional Stiffness",
    canonicalTex: "k_{t1} = \\frac{G J_1}{L_1}",
    formula: "k_t1 = (G * J_1) / L_1"
  }),
  defineRelation({
    id: "eq_shaft_tv_kt2",
    name: "Segment 2 Torsional Stiffness",
    canonicalTex: "k_{t2} = \\frac{G J_2}{L_2}",
    formula: "k_t2 = (G * J_2) / L_2"
  }),
  defineRelation({
    id: "eq_shaft_tv_kteq",
    name: "Series Equivalent Torsional Stiffness",
    canonicalTex: "\\frac{1}{k_{t,eq}} = \\frac{1}{k_{t1}} + \\frac{1}{k_{t2}}",
    formula: "1 / k_teq = 1 / k_t1 + 1 / k_t2"
  }),
  defineRelation({
    id: "eq_shaft_tv_fnt",
    name: "Torsional Natural Frequency",
    canonicalTex: "f_{nt} = \\frac{1}{2\\pi}\\sqrt{\\frac{G J_1}{L_{eq} I_{eq}}}",
    formula: "f_nt = (1 / (2 * pi)) * sqrt((G * J_1) / (L_eq * I_eq))"
  }),
  defineRelation({
    id: "eq_shaft_tv_omegant",
    name: "Torsional Natural Angular Frequency",
    canonicalTex: "\\omega_{nt} = 2\\pi f_{nt}",
    formula: "omega_nt = 2 * pi * f_nt"
  }),
  defineRelation({
    id: "eq_shaft_tv_nct",
    name: "Torsional Critical Speed (RPM)",
    canonicalTex: "\\omega_{nt} = 2\\pi n_{ct}",
    formula: "omega_nt = 2 * pi * n_ct"
  }),
  defineRelation({
    id: "eq_shaft_tv_node_bal",
    name: "Two-Rotor Nodal Inertia Balance",
    canonicalTex: "L_{n1} I_{m1} = L_{n2} I_{m2}",
    formula: "L_n1 * I_m1 = L_n2 * I_m2"
  }),
  defineRelation({
    id: "eq_shaft_tv_node_sum",
    name: "Nodal Span Partition",
    canonicalTex: "L_{tot} = L_{n1} + L_{n2}",
    formula: "L_tot = L_n1 + L_n2"
  }),
  defineRelation({
    id: "eq_shaft_tv_tosc",
    name: "Dynamic Vibratory Torque Amplitude",
    canonicalTex: "T_{osc} = k_{t,eq} \\theta_{osc}",
    formula: "T_osc = k_teq * theta_osc"
  }),
  defineRelation({
    id: "eq_shaft_tv_tauosc",
    name: "Dynamic Vibratory Shear Stress (at Diameter d1)",
    canonicalTex: "\\tau_{osc} = \\frac{16 T_{osc}}{\\pi d_1^3}",
    formula: "tau_osc = (16 * T_osc) / (pi * (d_1^3))"
  })
]);
