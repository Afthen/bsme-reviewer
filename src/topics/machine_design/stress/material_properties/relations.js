/**
 * src/topics/machine_design/stress/material_properties/relations.js
 * Mechanics relations for Material Properties, Tensile Testing & Elastic Constants.
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";
import {
  EQ_BASE_HOOKES_AXIAL,
  EQ_BASE_HOOKES_SHEAR,
  EQ_BASE_ELASTIC_E_G_NU,
  EQ_BASE_ELASTIC_E_K_NU,
  EQ_BASE_SAFETY_FACTOR
} from "../../common/stress_base_relations.js";

export const MATERIAL_PROPERTIES_RELATIONS = compileRelations([
  EQ_BASE_HOOKES_AXIAL,
  EQ_BASE_HOOKES_SHEAR,
  EQ_BASE_ELASTIC_E_G_NU,
  EQ_BASE_ELASTIC_E_K_NU,
  EQ_BASE_SAFETY_FACTOR,

  defineRelation({
    id: "eq_stress_mat_area_0",
    name: "Original Circular Area",
    canonicalTex: "A_0 = \\frac{\\pi d_0^2}{4}",
    formula: "A_0 = (pi * (d_0^2)) / 4"
  }),
  defineRelation({
    id: "eq_stress_mat_eng_stress",
    name: "Engineering Normal Stress",
    canonicalTex: "\\sigma = \\frac{F}{A_0}",
    formula: "sigma = F / A_0"
  }),
  defineRelation({
    id: "eq_stress_mat_eng_strain",
    name: "Engineering Axial Strain",
    canonicalTex: "\\varepsilon = \\frac{\\delta}{L_0}",
    formula: "epsilon = delta / L_0"
  }),
  defineRelation({
    id: "eq_stress_mat_poisson",
    name: "Lateral Strain via Poisson's Ratio",
    canonicalTex: "\\varepsilon_{lat} = \\nu \\varepsilon",
    formula: "epsilon_lat = nu * epsilon"
  }),
  defineRelation({
    id: "eq_stress_mat_lat_contraction",
    name: "Lateral Diameter Contraction",
    canonicalTex: "\\Delta d = \\varepsilon_{lat} d_0",
    formula: "delta_d = epsilon_lat * d_0"
  }),
  defineRelation({
    id: "eq_stress_mat_bulk",
    name: "Bulk Modulus Hydrostatic Relation",
    canonicalTex: "p_h = K \\varepsilon_v",
    formula: "p_h = K * eps_v"
  }),
  defineRelation({
    id: "eq_stress_mat_yield_strain",
    name: "Yield Strain",
    canonicalTex: "\\varepsilon_y = \\frac{S_y}{E}",
    formula: "eps_y = S_y / E"
  }),
  defineRelation({
    id: "eq_stress_mat_resilience",
    name: "Modulus of Resilience",
    canonicalTex: "u_r = \\frac{1}{2} S_y \\varepsilon_y",
    formula: "u_r = 0.5 * S_y * eps_y"
  }),
  defineRelation({
    id: "eq_stress_mat_resilience_e",
    name: "Modulus of Resilience (Strength-Modulus)",
    canonicalTex: "u_r = \\frac{S_y^2}{2 E}",
    formula: "u_r = (S_y^2) / (2 * E)"
  }),
  defineRelation({
    id: "eq_stress_mat_area_f",
    name: "Final Fracture Area",
    canonicalTex: "A_f = \\frac{\\pi d_f^2}{4}",
    formula: "A_f = (pi * (d_f^2)) / 4"
  }),
  defineRelation({
    id: "eq_stress_mat_pct_el",
    name: "Percent Elongation",
    canonicalTex: "\\%EL = \\frac{L_f - L_0}{L_0}",
    formula: "pct_EL = (L_f - L_0) / L_0"
  }),
  defineRelation({
    id: "eq_stress_mat_pct_ra",
    name: "Percent Reduction in Area",
    canonicalTex: "\\%RA = \\frac{A_0 - A_f}{A_0}",
    formula: "pct_RA = (A_0 - A_f) / A_0"
  }),
  defineRelation({
    id: "eq_stress_mat_true_fracture_strain",
    name: "True Fracture Strain (Area Ratio)",
    canonicalTex: "\\varepsilon_{f,t} = \\ln\\left(\\frac{A_0}{A_f}\\right)",
    formula: "eps_f_true = ln(A_0 / A_f)"
  }),
  defineRelation({
    id: "eq_stress_mat_true_strain",
    name: "True Strain from Engineering Strain",
    canonicalTex: "\\varepsilon_t = \\ln(1 + \\varepsilon)",
    formula: "eps_t = ln(1 + epsilon)"
  }),
  defineRelation({
    id: "eq_stress_mat_true_stress",
    name: "True Stress from Engineering Stress",
    canonicalTex: "\\sigma_t = \\sigma (1 + \\varepsilon)",
    formula: "sigma_t = sigma * (1 + epsilon)"
  })
]);
