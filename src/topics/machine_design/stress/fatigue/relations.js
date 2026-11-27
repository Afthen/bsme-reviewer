/**
 * src/topics/machine_design/stress/fatigue/relations.js
 * Fluctuating stress, Marin equation, Basquin finite-life S-N curve,
 * and fatigue failure criteria (Goodman, Soderberg, Gerber, ASME Elliptic, Langer).
 * Reference: Shigley's Mechanical Engineering Design, Ch. 6.
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";
import { EQ_BASE_GOODMAN } from "../../common/stress_base_relations.js";

export const FATIGUE_RELATIONS = compileRelations([
  EQ_BASE_GOODMAN,

  defineRelation({
    id: "eq_stress_fat_kf",
    name: "Fatigue Stress Concentration Factor",
    canonicalTex: "K_f = 1 + q (K_t - 1)",
    formula: "K_f = 1 + q * (K_t - 1)"
  }),
  defineRelation({
    id: "eq_stress_fat_loc_a",
    name: "Local Alternating Stress",
    canonicalTex: "\\sigma_a = K_f \\sigma_{a0}",
    formula: "sigma_a = K_f * sigma_a0"
  }),
  defineRelation({
    id: "eq_stress_fat_loc_m",
    name: "Local Mean Stress",
    canonicalTex: "\\sigma_m = K_f \\sigma_{m0}",
    formula: "sigma_m = K_f * sigma_m0"
  }),
  defineRelation({
    id: "eq_stress_fat_amp",
    name: "Alternating Stress from Max & Min",
    canonicalTex: "\\sigma_a = \\frac{\\sigma_{max} - \\sigma_{min}}{2}",
    formula: "sigma_a = (sigma_max - sigma_min) / 2"
  }),
  defineRelation({
    id: "eq_stress_fat_mean",
    name: "Mean Stress from Max & Min",
    canonicalTex: "\\sigma_m = \\frac{\\sigma_{max} + \\sigma_{min}}{2}",
    formula: "sigma_m = (sigma_max + sigma_min) / 2"
  }),
  defineRelation({
    id: "eq_stress_fat_range",
    name: "Cyclic Stress Range",
    canonicalTex: "\\Delta\\sigma = \\sigma_{max} - \\sigma_{min}",
    formula: "d_sigma = sigma_max - sigma_min"
  }),
  defineRelation({
    id: "eq_stress_fat_r_ratio",
    name: "Cyclic Stress Ratio",
    canonicalTex: "R = \\frac{\\sigma_{min}}{\\sigma_{max}}",
    formula: "R_s = sigma_min / sigma_max"
  }),
  defineRelation({
    id: "eq_stress_fat_a_ratio",
    name: "Amplitude Ratio",
    canonicalTex: "A = \\frac{\\sigma_a}{\\sigma_m}",
    formula: "A_s = sigma_a / sigma_m"
  }),
  defineRelation({
    id: "eq_stress_fat_uncorrected_se",
    name: "Uncorrected Steel Endurance Limit",
    canonicalTex: "S_e' = 0.5 S_{ut}",
    formula: "S_ep = 0.5 * S_ut"
  }),
  defineRelation({
    id: "eq_stress_fat_ka",
    name: "Marin Surface Finish Factor",
    formula: "k_a = a_s * (S_ut^b_s)",
    canonicalTex: "k_a = a S_{ut}^{b}",
    requiredUnits: { S_ut: "MPa", a_s: "dimless", b_s: "dimless", k_a: "dimless" },
    variants: {
      SI: {
        formula: "k_a = a_s * (S_ut^b_s)",
        canonicalTex: "k_a = a S_{ut}^{b}",
        requiredUnits: { S_ut: "MPa", a_s: "dimless", b_s: "dimless", k_a: "dimless" }
      },
      US: {
        formula: "k_a = a_s * (S_ut^b_s)",
        canonicalTex: "k_a = a S_{ut}^{b}",
        requiredUnits: { S_ut: "ksi", a_s: "dimless", b_s: "dimless", k_a: "dimless" }
      }
    }
  }),
  defineRelation({
    id: "eq_stress_fat_kb",
    name: "Marin Size Factor (Rotating Round Bar)",
    formula: "k_b = 1.24 * (d^(-0.107))",
    canonicalTex: "k_b = 1.24 d^{-0.107}",
    requiredUnits: { d: "mm", k_b: "dimless" },
    variants: {
      SI: {
        formula: "k_b = 1.24 * (d^(-0.107))",
        canonicalTex: "k_b = 1.24 d^{-0.107}",
        requiredUnits: { d: "mm", k_b: "dimless" }
      },
      US: {
        formula: "k_b = 0.879 * (d^(-0.107))",
        canonicalTex: "k_b = 0.879 d^{-0.107}",
        requiredUnits: { d: "in", k_b: "dimless" }
      }
    }
  }),
  defineRelation({
    id: "eq_stress_fat_marin",
    name: "Marin Endurance Limit Equation",
    canonicalTex: "S_e = k_a k_b k_c k_d k_e k_f S_e'",
    formula: "S_e = k_a * k_b * k_c * k_d * k_e * k_f_misc * S_ep"
  }),
  defineRelation({
    id: "eq_stress_fat_basquin_a",
    name: "Basquin S-N Coefficient",
    canonicalTex: "a_f = \\frac{(f S_{ut})^2}{S_e}",
    formula: "a_f = ((f_fat * S_ut)^2) / S_e"
  }),
  defineRelation({
    id: "eq_stress_fat_basquin_b",
    name: "Basquin S-N Exponent",
    canonicalTex: "b_f = -\\frac{\\ln\\left(\\frac{f S_{ut}}{S_e}\\right)}{3 \\ln(10)}",
    formula: "b_f = -ln((f_fat * S_ut) / S_e) / (3 * ln(10))"
  }),
  defineRelation({
    id: "eq_stress_fat_sn_life",
    name: "Basquin Finite-Life Fatigue Strength",
    canonicalTex: "S_f = a_f N^{b_f}",
    formula: "S_f = a_f * (N_c^b_f)"
  }),
  defineRelation({
    id: "eq_stress_fat_soderberg",
    name: "Soderberg Fatigue Criterion",
    canonicalTex: "\\frac{1}{n_S} = \\frac{\\sigma_a}{S_e} + \\frac{\\sigma_m}{S_y}",
    formula: "1 / n_S = sigma_a / S_e + sigma_m / S_y"
  }),
  defineRelation({
    id: "eq_stress_fat_asme_elliptic",
    name: "ASME Elliptic Fatigue Criterion",
    canonicalTex: "\\frac{1}{n_{AE}^2} = \\left(\\frac{\\sigma_a}{S_e}\\right)^2 + \\left(\\frac{\\sigma_m}{S_y}\\right)^2",
    formula: "1 / (n_AE^2) = ((sigma_a / S_e)^2) + ((sigma_m / S_y)^2)"
  }),
  defineRelation({
    id: "eq_stress_fat_gerber",
    name: "Gerber Parabolic Fatigue Criterion",
    canonicalTex: "\\frac{n_{Gb} \\sigma_a}{S_e} + \\left(\\frac{n_{Gb} \\sigma_m}{S_{ut}}\\right)^2 = 1",
    formula: "1 = (n_Gb * sigma_a) / S_e + (((n_Gb * sigma_m) / S_ut)^2)"
  }),
  defineRelation({
    id: "eq_stress_fat_langer",
    name: "Langer First-Cycle Yield Check",
    canonicalTex: "\\frac{1}{n_y} = \\frac{\\sigma_a + \\sigma_m}{S_y}",
    formula: "1 / n_y = (sigma_a + sigma_m) / S_y"
  })
]);
