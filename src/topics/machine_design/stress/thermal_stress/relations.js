/**
 * src/topics/machine_design/stress/thermal_stress/relations.js
 * Relations for Thermal Expansion, Restrained Thermal Stress & Composite Thermal Assemblies.
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";

export const THERMAL_STRESS_RELATIONS = compileRelations([
  defineRelation({
    id: "eq_stress_th_dt",
    name: "Temperature Change",
    canonicalTex: "\\Delta T = T_f - T_i",
    formula: "dT = T_f - T_i"
  }),
  defineRelation({
    id: "eq_stress_th_bar_stiff",
    name: "Bar Axial Stiffness",
    canonicalTex: "k_b = \\frac{A E}{L}",
    formula: "k_b = (A * E) / L"
  }),
  defineRelation({
    id: "eq_stress_th_strain",
    name: "Free Thermal Strain",
    canonicalTex: "\\varepsilon_{th} = \\alpha_1 \\Delta T",
    formula: "eps_th = alpha_1 * dT"
  }),
  defineRelation({
    id: "eq_stress_th_exp_strain",
    name: "Free Thermal Expansion from Strain",
    canonicalTex: "\\delta_{th} = \\varepsilon_{th} L",
    formula: "delta_th = eps_th * L"
  }),
  defineRelation({
    id: "eq_stress_th_exp_direct",
    name: "Free Thermal Expansion",
    canonicalTex: "\\delta_{th} = \\alpha_1 L \\Delta T",
    formula: "delta_th = alpha_1 * L * dT"
  }),
  defineRelation({
    id: "eq_stress_th_stress_hooke",
    name: "Restrained Thermal Stress from Strain",
    canonicalTex: "\\sigma_{th} = E \\varepsilon_{th}",
    formula: "sigma_th = E * eps_th"
  }),
  defineRelation({
    id: "eq_stress_th_stress_direct",
    name: "Fully Restrained Thermal Stress",
    canonicalTex: "\\sigma_{th} = E \\alpha_1 \\Delta T",
    formula: "sigma_th = E * alpha_1 * dT"
  }),
  defineRelation({
    id: "eq_stress_th_force",
    name: "Fully Restrained Thermal Force",
    canonicalTex: "P_{th} = A \\sigma_{th}",
    formula: "P_th = A * sigma_th"
  }),
  defineRelation({
    id: "eq_stress_th_gap_disp",
    name: "Restrained Elongation with Gap",
    canonicalTex: "\\delta_{res} = \\delta_{th} - \\delta_{gap}",
    formula: "delta_res = delta_th - delta_gap"
  }),
  defineRelation({
    id: "eq_stress_th_gap_strain",
    name: "Partially Restrained Strain",
    canonicalTex: "\\varepsilon_{res} = \\frac{\\delta_{res}}{L}",
    formula: "eps_res = delta_res / L"
  }),
  defineRelation({
    id: "eq_stress_th_gap_stress",
    name: "Partially Restrained Thermal Stress",
    canonicalTex: "\\sigma_{part} = E \\varepsilon_{res}",
    formula: "sigma_part = E * eps_res"
  }),
  defineRelation({
    id: "eq_stress_th_el_stiff",
    name: "Support-Bar Combined Stiffness",
    canonicalTex: "\\frac{1}{k_{comb}} = \\frac{1}{k_b} + \\frac{1}{k_s}",
    formula: "1 / k_comb = 1 / k_b + 1 / k_s"
  }),
  defineRelation({
    id: "eq_stress_th_el_force",
    name: "Elastically Restrained Thermal Force",
    canonicalTex: "P_{el} = k_{comb} \\delta_{th}",
    formula: "P_el = k_comb * delta_th"
  }),
  defineRelation({
    id: "eq_stress_th_el_sp_disp",
    name: "Support Spring Deflection",
    canonicalTex: "\\delta_{sp} = \\frac{P_{el}}{k_s}",
    formula: "delta_sp = P_el / k_s"
  }),
  defineRelation({
    id: "eq_stress_th_el_stress",
    name: "Elastically Restrained Thermal Stress",
    canonicalTex: "\\sigma_{el} = \\frac{P_{el}}{A}",
    formula: "sigma_el = P_el / A"
  }),
  defineRelation({
    id: "eq_stress_th_mech_disp",
    name: "Mechanical Axial Elongation",
    canonicalTex: "\\delta_{mech} = \\frac{P_{app}}{k_b}",
    formula: "delta_mech = P_app / k_b"
  }),
  defineRelation({
    id: "eq_stress_th_combined_disp",
    name: "Combined Thermal-Mechanical Elongation",
    canonicalTex: "\\delta_{tot} = \\delta_{mech} + \\delta_{th}",
    formula: "delta_tot = delta_mech + delta_th"
  }),
  defineRelation({
    id: "eq_stress_th_dalpha",
    name: "Differential Expansion Coefficient",
    canonicalTex: "\\Delta\\alpha = \\alpha_2 - \\alpha_1",
    formula: "d_alpha = alpha_2 - alpha_1"
  }),
  defineRelation({
    id: "eq_stress_th_comp_stiff",
    name: "Composite Series Axial Stiffness",
    canonicalTex: "\\frac{1}{k_{comp}} = \\frac{1}{k_b} + \\frac{1}{k_2}",
    formula: "1 / k_comp = 1 / k_b + 1 / k_2"
  }),
  defineRelation({
    id: "eq_stress_th_comp_force",
    name: "Composite Thermal Interaction Force",
    canonicalTex: "P_{comp} = k_{comp} \\Delta\\alpha L \\Delta T",
    formula: "P_comp = k_comp * d_alpha * L * dT"
  })
]);
