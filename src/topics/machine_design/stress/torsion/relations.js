/**
 * src/topics/machine_design/stress/torsion/relations.js
 * General elastic torsion relations: power-torque-speed, solid & hollow polar inertia,
 * torsional shear stress, angle of twist, and indeterminate composite compatibility.
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";

export const TORSION_RELATIONS = compileRelations([
  defineRelation({
    id: "eq_stress_tor_omega",
    name: "Angular Velocity from Rotational Speed",
    canonicalTex: "\\omega = 2 \\pi n",
    formula: "omega = 2 * pi * n"
  }),
  defineRelation({
    id: "eq_stress_tor_power",
    name: "Transmitted Power from Torque & Angular Velocity",
    canonicalTex: "P = T_0 \\omega",
    formula: "P = T_0 * omega"
  }),
  defineRelation({
    id: "eq_stress_tor_solid_rad",
    name: "Solid Circular Outer Radius",
    canonicalTex: "r_1 = \\frac{d_1}{2}",
    formula: "r_1 = d_1 / 2"
  }),
  defineRelation({
    id: "eq_stress_tor_solid_j",
    name: "Solid Circular Polar Moment of Inertia",
    canonicalTex: "J_1 = \\frac{\\pi d_1^4}{32}",
    formula: "J_1 = (pi * (d_1^4)) / 32"
  }),
  defineRelation({
    id: "eq_stress_tor_solid_zp",
    name: "Solid Polar Section Modulus",
    canonicalTex: "Z_{p1} = \\frac{\\pi d_1^3}{16}",
    formula: "Z_p1 = (pi * (d_1^3)) / 16"
  }),
  defineRelation({
    id: "eq_stress_tor_solid_stiff",
    name: "Solid Segment Torsional Stiffness",
    canonicalTex: "k_{t1} = \\frac{G_1 J_1}{L_1}",
    formula: "k_t1 = (G_1 * J_1) / L_1"
  }),
  defineRelation({
    id: "eq_stress_tor_solid_torque",
    name: "Solid Segment Torque-Twist",
    canonicalTex: "T_1 = k_{t1} \\theta",
    formula: "T_1 = k_t1 * theta"
  }),
  defineRelation({
    id: "eq_stress_tor_solid_twist",
    name: "Solid Segment Angle of Twist",
    canonicalTex: "\\theta = \\frac{T_1 L_1}{G_1 J_1}",
    formula: "theta = (T_1 * L_1) / (G_1 * J_1)"
  }),
  defineRelation({
    id: "eq_stress_tor_solid_stress_j",
    name: "Solid Torsional Shear Stress (Tr/J)",
    canonicalTex: "\\tau_1 = \\frac{T_1 r_1}{J_1}",
    formula: "tau_1 = (T_1 * r_1) / J_1"
  }),
  defineRelation({
    id: "eq_stress_tor_solid_stress_zp",
    name: "Solid Torsional Shear Stress (T/Zp)",
    canonicalTex: "\\tau_1 = \\frac{T_1}{Z_{p1}}",
    formula: "tau_1 = T_1 / Z_p1"
  }),
  defineRelation({
    id: "eq_stress_tor_hollow_rad",
    name: "Hollow Circular Outer Radius",
    canonicalTex: "r_o = \\frac{D_o}{2}",
    formula: "r_o = D_o / 2"
  }),
  defineRelation({
    id: "eq_stress_tor_hollow_ratio",
    name: "Hollow Diameter Ratio",
    canonicalTex: "k_d = \\frac{D_i}{D_o}",
    formula: "k_d = D_i / D_o"
  }),
  defineRelation({
    id: "eq_stress_tor_hollow_j",
    name: "Hollow Circular Polar Moment of Inertia",
    canonicalTex: "J_2 = \\frac{\\pi (D_o^4 - D_i^4)}{32}",
    formula: "J_2 = (pi * ((D_o^4) - (D_i^4))) / 32"
  }),
  defineRelation({
    id: "eq_stress_tor_hollow_zp",
    name: "Hollow Polar Section Modulus",
    canonicalTex: "Z_{p2} = \\frac{J_2}{r_o}",
    formula: "Z_p2 = J_2 / r_o"
  }),
  defineRelation({
    id: "eq_stress_tor_hollow_stiff",
    name: "Hollow Segment Torsional Stiffness",
    canonicalTex: "k_{t2} = \\frac{G_2 J_2}{L_2}",
    formula: "k_t2 = (G_2 * J_2) / L_2"
  }),
  defineRelation({
    id: "eq_stress_tor_hollow_torque",
    name: "Hollow Segment Torque-Twist",
    canonicalTex: "T_2 = k_{t2} \\theta",
    formula: "T_2 = k_t2 * theta"
  }),
  defineRelation({
    id: "eq_stress_tor_hollow_stress",
    name: "Hollow Torsional Shear Stress",
    canonicalTex: "\\tau_2 = \\frac{T_2 r_o}{J_2}",
    formula: "tau_2 = (T_2 * r_o) / J_2"
  }),
  defineRelation({
    id: "eq_stress_tor_equil",
    name: "Fixed-End Torque Equilibrium",
    canonicalTex: "T_0 = T_1 + T_2",
    formula: "T_0 = T_1 + T_2"
  }),
  defineRelation({
    id: "eq_stress_tor_keq",
    name: "Parallel Equivalent Torsional Stiffness",
    canonicalTex: "k_{t,eq} = k_{t1} + k_{t2}",
    formula: "k_teq = k_t1 + k_t2"
  }),
  defineRelation({
    id: "eq_stress_tor_twist_eq",
    name: "Junction Twist Angle",
    canonicalTex: "\\theta = \\frac{T_0}{k_{t,eq}}",
    formula: "theta = T_0 / k_teq"
  }),
  defineRelation({
    id: "eq_stress_tor_kser",
    name: "Series Equivalent Torsional Stiffness",
    canonicalTex: "\\frac{1}{k_{t,ser}} = \\frac{1}{k_{t1}} + \\frac{1}{k_{t2}}",
    formula: "1 / k_tser = 1 / k_t1 + 1 / k_t2"
  }),
  defineRelation({
    id: "eq_stress_tor_twist_ser",
    name: "Total Unrestrained Series Twist Angle",
    canonicalTex: "\\theta_{ser} = \\frac{T_0}{k_{t,ser}}",
    formula: "theta_ser = T_0 / k_tser"
  }),
  defineRelation({
    id: "eq_stress_tor_fos",
    name: "Torsional Shear Factor of Safety",
    canonicalTex: "n_t = \\frac{S_{sy}}{\\tau_1}",
    formula: "n_t1 = S_sy / tau_1"
  })
]);
