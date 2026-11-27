/**
 * src/topics/machine_design/common/stress_base_relations.js
 * Reusable foundational mechanics-of-materials and failure relations (eq_base_*).
 * References: Beer & Johnston (Mechanics of Materials), Hibbeler, Shigley's Mechanical Engineering Design.
 */

import { defineRelation } from "../../../core/relation_builder.js";

export const EQ_BASE_HOOKES_AXIAL = defineRelation({
  id: "eq_base_hookes_axial",
  name: "Hooke's Law (Normal Stress-Strain)",
  canonicalTex: "\\sigma = E \\varepsilon",
  formula: "sigma = E * epsilon"
});

export const EQ_BASE_HOOKES_SHEAR = defineRelation({
  id: "eq_base_hookes_shear",
  name: "Hooke's Law (Shear Stress-Strain)",
  canonicalTex: "\\tau = G \\gamma",
  formula: "tau = G * gamma"
});

export const EQ_BASE_ELASTIC_E_G_NU = defineRelation({
  id: "eq_base_elastic_e_g_nu",
  name: "Elastic Constants Identity (E, G, ν)",
  canonicalTex: "E = 2 G (1 + \\nu)",
  formula: "E = 2 * G * (1 + nu)"
});

export const EQ_BASE_ELASTIC_E_K_NU = defineRelation({
  id: "eq_base_elastic_e_k_nu",
  name: "Elastic Constants Identity (E, K, ν)",
  canonicalTex: "E = 3 K (1 - 2\\nu)",
  formula: "E = 3 * K * (1 - 2 * nu)"
});

export const EQ_BASE_SAFETY_FACTOR = defineRelation({
  id: "eq_base_safety_factor",
  name: "Yield Factor of Safety",
  canonicalTex: "n = \\frac{S_y}{\\sigma}",
  formula: "n_s = S_y / sigma"
});

export const EQ_BASE_ALLOWABLE_STRESS = defineRelation({
  id: "eq_base_allowable_stress",
  name: "Allowable Stress from Yield Strength",
  canonicalTex: "\\sigma_{allow} = \\frac{S_y}{n_{des}}",
  formula: "sigma_allow = S_y / n_des"
});

export const EQ_BASE_FLEXURE_STRESS = defineRelation({
  id: "eq_base_flexure_stress",
  name: "Elastic Flexure Formula",
  canonicalTex: "\\sigma_b = \\frac{M c}{I}",
  formula: "sigma_b = (M * c) / I"
});

export const EQ_BASE_SECTION_MODULUS = defineRelation({
  id: "eq_base_section_modulus",
  name: "Elastic Section Modulus Definition",
  canonicalTex: "Z = \\frac{I}{c}",
  formula: "Z = I / c"
});

export const EQ_BASE_FLEXURE_Z = defineRelation({
  id: "eq_base_flexure_z",
  name: "Bending Stress via Section Modulus",
  canonicalTex: "\\sigma_b = \\frac{M}{Z}",
  formula: "sigma_b = M / Z"
});

export const EQ_BASE_VON_MISES_PRINCIPAL = defineRelation({
  id: "eq_base_von_mises_principal",
  name: "von Mises Stress (2D Principal Stresses)",
  canonicalTex: "\\sigma' = \\sqrt{\\sigma_1^2 - \\sigma_1\\sigma_2 + \\sigma_2^2}",
  formula: "sigma_vm = sqrt((sigma_1^2) - sigma_1 * sigma_2 + (sigma_2^2))"
});

export const EQ_BASE_GOODMAN = defineRelation({
  id: "eq_base_goodman",
  name: "Modified Goodman Fatigue Criterion",
  canonicalTex: "\\frac{1}{n_G} = \\frac{\\sigma_a}{S_e} + \\frac{\\sigma_m}{S_{ut}}",
  formula: "1 / n_G = sigma_a / S_e + sigma_m / S_ut"
});
