/**
 * src/topics/machine_design/stress/axial_members/relations.js
 * Axial stress, stiffness, stepped series deformation, and fixed-end indeterminate compatibility.
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";

export const AXIAL_MEMBERS_RELATIONS = compileRelations([
  defineRelation({
    id: "eq_stress_ax_total_len",
    name: "Total Bar Length",
    canonicalTex: "L_T = L_1 + L_2",
    formula: "L_tot = L_1 + L_2"
  }),
  defineRelation({
    id: "eq_stress_ax_stiff1",
    name: "Segment 1 Axial Stiffness",
    canonicalTex: "k_1 = \\frac{A_1 E_1}{L_1}",
    formula: "k_1 = (A_1 * E_1) / L_1"
  }),
  defineRelation({
    id: "eq_stress_ax_stiff2",
    name: "Segment 2 Axial Stiffness",
    canonicalTex: "k_2 = \\frac{A_2 E_2}{L_2}",
    formula: "k_2 = (A_2 * E_2) / L_2"
  }),
  defineRelation({
    id: "eq_stress_ax_kpar",
    name: "Fixed-End Parallel Equivalent Stiffness",
    canonicalTex: "k_{par} = k_1 + k_2",
    formula: "k_par = k_1 + k_2"
  }),
  defineRelation({
    id: "eq_stress_ax_kser",
    name: "Unrestrained Series Equivalent Stiffness",
    canonicalTex: "\\frac{1}{k_{ser}} = \\frac{1}{k_1} + \\frac{1}{k_2}",
    formula: "1 / k_ser = 1 / k_1 + 1 / k_2"
  }),
  defineRelation({
    id: "eq_stress_ax_equil",
    name: "Fixed-End Axial Equilibrium",
    canonicalTex: "P = R_1 + R_2",
    formula: "P = R_1 + R_2"
  }),
  defineRelation({
    id: "eq_stress_ax_disp_par",
    name: "Junction Displacement (Indeterminate)",
    canonicalTex: "\\delta_j = \\frac{P}{k_{par}}",
    formula: "delta_j = P / k_par"
  }),
  defineRelation({
    id: "eq_stress_ax_reac1",
    name: "Segment 1 Force-Displacement",
    canonicalTex: "R_1 = k_1 \\delta_j",
    formula: "R_1 = k_1 * delta_j"
  }),
  defineRelation({
    id: "eq_stress_ax_reac2",
    name: "Segment 2 Force-Displacement",
    canonicalTex: "R_2 = k_2 \\delta_j",
    formula: "R_2 = k_2 * delta_j"
  }),
  defineRelation({
    id: "eq_stress_ax_disp1_direct",
    name: "Segment 1 Elastic Elongation (PL/AE)",
    canonicalTex: "\\delta_j = \\frac{R_1 L_1}{A_1 E_1}",
    formula: "delta_j = (R_1 * L_1) / (A_1 * E_1)"
  }),
  defineRelation({
    id: "eq_stress_ax_stress1",
    name: "Segment 1 Axial Stress",
    canonicalTex: "\\sigma_1 = \\frac{R_1}{A_1}",
    formula: "sigma_1 = R_1 / A_1"
  }),
  defineRelation({
    id: "eq_stress_ax_stress2",
    name: "Segment 2 Axial Stress",
    canonicalTex: "\\sigma_2 = \\frac{R_2}{A_2}",
    formula: "sigma_2 = R_2 / A_2"
  }),
  defineRelation({
    id: "eq_stress_ax_strain1",
    name: "Segment 1 Axial Strain",
    canonicalTex: "\\varepsilon_1 = \\frac{\\delta_j}{L_1}",
    formula: "eps_1 = delta_j / L_1"
  }),
  defineRelation({
    id: "eq_stress_ax_strain2",
    name: "Segment 2 Axial Strain",
    canonicalTex: "\\varepsilon_2 = \\frac{\\delta_j}{L_2}",
    formula: "eps_2 = delta_j / L_2"
  }),
  defineRelation({
    id: "eq_stress_ax_ser1",
    name: "Segment 1 Series Elongation",
    canonicalTex: "\\delta_{1,s} = \\frac{P}{k_1}",
    formula: "delta_1_ser = P / k_1"
  }),
  defineRelation({
    id: "eq_stress_ax_ser2",
    name: "Segment 2 Series Elongation",
    canonicalTex: "\\delta_{2,s} = \\frac{P}{k_2}",
    formula: "delta_2_ser = P / k_2"
  }),
  defineRelation({
    id: "eq_stress_ax_ser_tot",
    name: "Total Series Elongation (Sum)",
    canonicalTex: "\\delta_{ser} = \\delta_{1,s} + \\delta_{2,s}",
    formula: "delta_ser = delta_1_ser + delta_2_ser"
  }),
  defineRelation({
    id: "eq_stress_ax_ser_stiff",
    name: "Total Series Elongation (Stiffness)",
    canonicalTex: "\\delta_{ser} = \\frac{P}{k_{ser}}",
    formula: "delta_ser = P / k_ser"
  })
]);
