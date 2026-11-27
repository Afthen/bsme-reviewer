/**
 * src/topics/machine_design/stress/combined_loading/relations.js
 * Relations for Combined Axial, Eccentric Bending & Torsion Superposition on a Circular Member.
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";
import {
  EQ_BASE_FLEXURE_STRESS,
  EQ_BASE_SECTION_MODULUS,
  EQ_BASE_FLEXURE_Z
} from "../../common/stress_base_relations.js";

export const COMBINED_LOADING_RELATIONS = compileRelations([
  EQ_BASE_FLEXURE_STRESS,
  EQ_BASE_SECTION_MODULUS,
  EQ_BASE_FLEXURE_Z,

  defineRelation({
    id: "eq_stress_comb_area",
    name: "Circular Cross-Section Area",
    canonicalTex: "A = \\frac{\\pi d^2}{4}",
    formula: "A = (pi * (d^2)) / 4"
  }),
  defineRelation({
    id: "eq_stress_comb_radius",
    name: "Outer Fiber Radius",
    canonicalTex: "c = \\frac{d}{2}",
    formula: "c = d / 2"
  }),
  defineRelation({
    id: "eq_stress_comb_inertia",
    name: "Circular Area Moment of Inertia",
    canonicalTex: "I = \\frac{\\pi d^4}{64}",
    formula: "I = (pi * (d^4)) / 64"
  }),
  defineRelation({
    id: "eq_stress_comb_polar_j",
    name: "Circular Polar Moment of Inertia",
    canonicalTex: "J = \\frac{\\pi d^4}{32}",
    formula: "J = (pi * (d^4)) / 32"
  }),
  defineRelation({
    id: "eq_stress_comb_polar_zp",
    name: "Circular Polar Section Modulus",
    canonicalTex: "Z_p = \\frac{\\pi d^3}{16}",
    formula: "Z_p = (pi * (d^3)) / 16"
  }),
  defineRelation({
    id: "eq_stress_comb_axial",
    name: "Direct Axial Stress",
    canonicalTex: "\\sigma_a = \\frac{P}{A}",
    formula: "sigma_a = P / A"
  }),
  defineRelation({
    id: "eq_stress_comb_ecc_moment",
    name: "Eccentric Bending Moment",
    canonicalTex: "M = P e",
    formula: "M = P * e_ecc"
  }),
  defineRelation({
    id: "eq_stress_comb_super_max",
    name: "Combined Axial and Bending Stress (Tension Side)",
    canonicalTex: "\\sigma_x = \\sigma_a + \\sigma_b",
    formula: "sigma_x = sigma_a + sigma_b"
  }),
  defineRelation({
    id: "eq_stress_comb_super_opp",
    name: "Combined Axial and Bending Stress (Opposite Side)",
    canonicalTex: "\\sigma_{opp} = \\sigma_a - \\sigma_b",
    formula: "sigma_opp = sigma_a - sigma_b"
  }),
  defineRelation({
    id: "eq_stress_comb_torsion_j",
    name: "Torsional Shear Stress (Tc/J)",
    canonicalTex: "\\tau_{xy} = \\frac{T c}{J}",
    formula: "tau_t = (T * c) / J"
  }),
  defineRelation({
    id: "eq_stress_comb_torsion_zp",
    name: "Torsional Shear Stress (T/Zp)",
    canonicalTex: "\\tau_{xy} = \\frac{T}{Z_p}",
    formula: "tau_t = T / Z_p"
  }),
  defineRelation({
    id: "eq_stress_comb_circ_trans_shear",
    name: "Circular Transverse Shear Stress (Neutral Axis)",
    canonicalTex: "\\tau_v = \\frac{4 V}{3 A}",
    formula: "tau_v = (4 * V) / (3 * A)"
  }),
  defineRelation({
    id: "eq_stress_comb_avg",
    name: "Average Normal Stress (Uniaxial + Shear)",
    canonicalTex: "\\sigma_{avg} = \\frac{\\sigma_x}{2}",
    formula: "sigma_avg = sigma_x / 2"
  }),
  defineRelation({
    id: "eq_stress_comb_taumax",
    name: "Maximum In-Plane Shear Stress",
    canonicalTex: "\\tau_{max} = \\sqrt{\\left(\\frac{\\sigma_x}{2}\\right)^2 + \\tau_{xy}^2}",
    formula: "tau_max = sqrt(((sigma_x / 2)^2) + (tau_t^2))"
  }),
  defineRelation({
    id: "eq_stress_comb_p1",
    name: "Major Principal Stress",
    canonicalTex: "\\sigma_1 = \\sigma_{avg} + \\tau_{max}",
    formula: "sigma_1 = sigma_avg + tau_max"
  }),
  defineRelation({
    id: "eq_stress_comb_p2",
    name: "Minor Principal Stress",
    canonicalTex: "\\sigma_2 = \\sigma_{avg} - \\tau_{max}",
    formula: "sigma_2 = sigma_avg - tau_max"
  }),
  defineRelation({
    id: "eq_stress_comb_vm",
    name: "von Mises Stress (Bending + Torsion)",
    canonicalTex: "\\sigma' = \\sqrt{\\sigma_x^2 + 3 \\tau_{xy}^2}",
    formula: "sigma_vm = sqrt((sigma_x^2) + 3 * (tau_t^2))"
  }),
  defineRelation({
    id: "eq_stress_comb_nde",
    name: "Distortion Energy Safety Factor",
    canonicalTex: "n_{DE} = \\frac{S_y}{\\sigma'}",
    formula: "n_DE = S_y / sigma_vm"
  }),
  defineRelation({
    id: "eq_stress_comb_nmss",
    name: "Maximum Shear Stress Safety Factor",
    canonicalTex: "n_{MSS} = \\frac{S_y}{2 \\tau_{max}}",
    formula: "n_MSS = S_y / (2 * tau_max)"
  })
]);
