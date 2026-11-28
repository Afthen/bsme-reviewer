/**
 * src/topics/machine_design/shafting/static_combined_strength/relations.js
 * Static shaft strength sizing (solid & hollow) under combined axial, bending & torsion.
 * References: Shigley (Ch. 5 & 7), Norton (Ch. 10), Beer & Johnston.
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";
import { EQ_BASE_FLEXURE_Z } from "../../common/stress_base_relations.js";
import {
  EQ_BASE_SHAFT_OMEGA,
  EQ_BASE_SHAFT_POWER,
  EQ_BASE_SHAFT_MOMENT_RES,
  EQ_BASE_SHAFT_SOLID_AREA,
  EQ_BASE_SHAFT_SOLID_Z,
  EQ_BASE_SHAFT_SOLID_ZP,
  EQ_BASE_SHAFT_TORSION_ZP,
  EQ_BASE_SHAFT_HOLLOW_RATIO
} from "../../common/shaft_base_relations.js";

export const SHAFT_STATIC_STRENGTH_RELATIONS = compileRelations([
  EQ_BASE_SHAFT_OMEGA,
  EQ_BASE_SHAFT_POWER,
  EQ_BASE_SHAFT_MOMENT_RES,
  EQ_BASE_SHAFT_SOLID_AREA,
  EQ_BASE_SHAFT_SOLID_Z,
  EQ_BASE_SHAFT_SOLID_ZP,
  EQ_BASE_FLEXURE_Z,
  EQ_BASE_SHAFT_TORSION_ZP,
  EQ_BASE_SHAFT_HOLLOW_RATIO,

  defineRelation({
    id: "eq_shaft_stat_te_mss",
    name: "Equivalent Twisting Moment (MSS)",
    canonicalTex: "T_e = \\sqrt{M^2 + T^2}",
    formula: "T_e = sqrt((M^2) + (T^2))"
  }),
  defineRelation({
    id: "eq_shaft_stat_me_mss",
    name: "Equivalent Bending Moment (MSS)",
    canonicalTex: "M_e = \\frac{1}{2}(M + T_e)",
    formula: "M_e = 0.5 * (M + T_e)"
  }),
  defineRelation({
    id: "eq_shaft_stat_tau_max",
    name: "Combined Maximum Shear Stress",
    canonicalTex: "\\tau_{max} = \\frac{T_e}{Z_p}",
    formula: "tau_max = T_e / Z_p"
  }),
  defineRelation({
    id: "eq_shaft_stat_ssy_mss",
    name: "Tresca Shear Yield Strength",
    canonicalTex: "S_{sy} = 0.5 S_y",
    formula: "S_sy = 0.5 * S_y"
  }),
  defineRelation({
    id: "eq_shaft_stat_nmss",
    name: "Maximum Shear Stress Factor of Safety",
    canonicalTex: "n_{MSS} = \\frac{S_{sy}}{\\tau_{max}}",
    formula: "n_MSS = S_sy / tau_max"
  }),
  defineRelation({
    id: "eq_shaft_stat_vm_bt",
    name: "von Mises Stress (Bending and Torsion)",
    canonicalTex: "\\sigma' = \\sqrt{\\sigma_b^2 + 3\\tau^2}",
    formula: "sigma_vm = sqrt((sigma_b^2) + 3 * (tau^2))"
  }),
  defineRelation({
    id: "eq_shaft_stat_nde",
    name: "Distortion Energy Factor of Safety",
    canonicalTex: "n_{DE} = \\frac{S_y}{\\sigma'}",
    formula: "n_DE = S_y / sigma_vm"
  }),
  defineRelation({
    id: "eq_shaft_stat_zp_de_sizing",
    name: "Required Polar Section Modulus (Distortion Energy)",
    canonicalTex: "Z_p = \\frac{n_{DE} \\sqrt{4 M^2 + 3 T^2}}{S_y}",
    formula: "Z_p = (n_DE * sqrt(4 * (M^2) + 3 * (T^2))) / S_y"
  }),
  defineRelation({
    id: "eq_shaft_stat_hollow_do",
    name: "Equal-Strength Hollow Shaft Outer Diameter",
    canonicalTex: "d_o = \\frac{d}{(1 - K^4)^{1/3}}",
    formula: "d_o = d / ((1 - (k_d^4)) ^ (1 / 3))"
  }),
  defineRelation({
    id: "eq_shaft_stat_hollow_area",
    name: "Hollow Shaft Cross-Sectional Area",
    canonicalTex: "A_{hol} = \\frac{\\pi (d_o^2 - d_i^2)}{4}",
    formula: "A_hol = (pi * ((d_o^2) - (d_i^2))) / 4"
  }),
  defineRelation({
    id: "eq_shaft_stat_wt_saving",
    name: "Hollow Shaft Material Weight Savings",
    canonicalTex: "\\%_{wt} = \\frac{A - A_{hol}}{A}",
    formula: "eta_wt = (A - A_hol) / A"
  }),
  defineRelation({
    id: "eq_shaft_stat_axial",
    name: "Direct Axial Thrust Stress",
    canonicalTex: "\\sigma_a = \\frac{F_a}{A}",
    formula: "sigma_a = F_a / A"
  }),
  defineRelation({
    id: "eq_shaft_stat_super",
    name: "Combined Axial and Bending Normal Stress",
    canonicalTex: "\\sigma_x = \\sigma_a + \\sigma_b",
    formula: "sigma_x = sigma_a + sigma_b"
  }),
  defineRelation({
    id: "eq_shaft_stat_vm_comb",
    name: "Combined 3D von Mises Stress",
    canonicalTex: "\\sigma'_{comb} = \\sqrt{\\sigma_x^2 + 3\\tau^2}",
    formula: "sigma_comb = sqrt((sigma_x^2) + 3 * (tau^2))"
  }),
  defineRelation({
    id: "eq_shaft_stat_n_comb",
    name: "Combined 3D Factor of Safety",
    canonicalTex: "n_{comb} = \\frac{S_y}{\\sigma'_{comb}}",
    formula: "n_comb = S_y / sigma_comb"
  })
]);
