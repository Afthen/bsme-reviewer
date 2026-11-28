/**
 * src/topics/machine_design/shafting/fatigue_design/relations.js
 * Rotating Shaft Fatigue Design: Stepped Shoulder Concentration, Marin Endurance Limit,
 * Distortion-Energy Fluctuating Stresses, and DE-Goodman/Soderberg/ASME-Elliptic/Gerber/Langer Sizing.
 * Reference: Shigley's Mechanical Engineering Design, Ch. 6 & Ch. 7 (Eqs. 7-5 to 7-16).
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";
import { EQ_BASE_SHAFT_SOLID_ZP } from "../../common/shaft_base_relations.js";

export const SHAFT_FATIGUE_RELATIONS = compileRelations([
  EQ_BASE_SHAFT_SOLID_ZP,

  defineRelation({
    id: "eq_shaft_fat_dd",
    name: "Shoulder Step Diameter Ratio",
    canonicalTex: "\\frac{D}{d} = \\frac{D}{d}",
    formula: "r_Dd = D_maj / d"
  }),
  defineRelation({
    id: "eq_shaft_fat_rd",
    name: "Shoulder Fillet Radius Ratio",
    canonicalTex: "\\frac{r}{d} = \\frac{r_f}{d}",
    formula: "r_rd = r_f / d"
  }),
  defineRelation({
    id: "eq_shaft_fat_kf",
    name: "Bending Fatigue Concentration Factor",
    canonicalTex: "K_f = 1 + q (K_t - 1)",
    formula: "K_f = 1 + q * (K_t - 1)"
  }),
  defineRelation({
    id: "eq_shaft_fat_kfs",
    name: "Torsional Fatigue Concentration Factor",
    canonicalTex: "K_{fs} = 1 + q_s (K_{ts} - 1)",
    formula: "K_fs = 1 + q_s * (K_ts - 1)"
  }),
  defineRelation({
    id: "eq_shaft_fat_se_prime",
    name: "Uncorrected Steel Endurance Limit",
    canonicalTex: "S_e' = 0.5 S_{ut}",
    formula: "S_ep = 0.5 * S_ut"
  }),
  defineRelation({
    id: "eq_shaft_fat_marin",
    name: "Marin Corrected Endurance Limit",
    canonicalTex: "S_e = k_a k_b k_c k_d k_e S_e'",
    formula: "S_e = k_a * k_b * k_c * k_d_temp * k_e_rel * S_ep"
  }),
  defineRelation({
    id: "eq_shaft_fat_sigma_a",
    name: "Local Alternating Bending Stress",
    canonicalTex: "\\sigma_a = \\frac{32 K_f M_a}{\\pi d^3}",
    formula: "sigma_a = (32 * K_f * M_a) / (pi * (d^3))"
  }),
  defineRelation({
    id: "eq_shaft_fat_sigma_m",
    name: "Local Mean Bending Stress",
    canonicalTex: "\\sigma_m = \\frac{32 K_f M_m}{\\pi d^3}",
    formula: "sigma_m = (32 * K_f * M_m) / (pi * (d^3))"
  }),
  defineRelation({
    id: "eq_shaft_fat_tau_a",
    name: "Local Alternating Torsional Shear Stress",
    canonicalTex: "\\tau_a = \\frac{16 K_{fs} T_a}{\\pi d^3}",
    formula: "tau_a = (16 * K_fs * T_a) / (pi * (d^3))"
  }),
  defineRelation({
    id: "eq_shaft_fat_tau_m",
    name: "Local Mean Torsional Shear Stress",
    canonicalTex: "\\tau_m = \\frac{16 K_{fs} T_m}{\\pi d^3}",
    formula: "tau_m = (16 * K_fs * T_m) / (pi * (d^3))"
  }),
  defineRelation({
    id: "eq_shaft_fat_vm_a",
    name: "Distortion Energy Alternating Stress",
    canonicalTex: "\\sigma'_a = \\sqrt{\\sigma_a^2 + 3 \\tau_a^2}",
    formula: "sigma_vm_a = sqrt((sigma_a^2) + 3 * (tau_a^2))"
  }),
  defineRelation({
    id: "eq_shaft_fat_vm_m",
    name: "Distortion Energy Midrange Stress",
    canonicalTex: "\\sigma'_m = \\sqrt{\\sigma_m^2 + 3 \\tau_m^2}",
    formula: "sigma_vm_m = sqrt((sigma_m^2) + 3 * (tau_m^2))"
  }),
  defineRelation({
    id: "eq_shaft_fat_aeq",
    name: "Shigley Alternating Fatigue Parameter",
    canonicalTex: "A_{eq} = \\sqrt{4 (K_f M_a)^2 + 3 (K_{fs} T_a)^2}",
    formula: "A_eq = sqrt(4 * ((K_f * M_a)^2) + 3 * ((K_fs * T_a)^2))"
  }),
  defineRelation({
    id: "eq_shaft_fat_beq",
    name: "Shigley Midrange Fatigue Parameter",
    canonicalTex: "B_{eq} = \\sqrt{4 (K_f M_m)^2 + 3 (K_{fs} T_m)^2}",
    formula: "B_eq = sqrt(4 * ((K_f * M_m)^2) + 3 * ((K_fs * T_m)^2))"
  }),
  defineRelation({
    id: "eq_shaft_fat_zp_dg",
    name: "DE-Goodman Required Polar Section Modulus",
    canonicalTex: "Z_p = n_{DG} \\left(\\frac{A_{eq}}{S_e} + \\frac{B_{eq}}{S_{ut}}\\right)",
    formula: "Z_p = n_DG * (A_eq / S_e + B_eq / S_ut)"
  }),
  defineRelation({
    id: "eq_shaft_fat_goodman",
    name: "DE-Goodman Shaft Fatigue Check",
    canonicalTex: "\\frac{1}{n_{DG}} = \\frac{\\sigma'_a}{S_e} + \\frac{\\sigma'_m}{S_{ut}}",
    formula: "1 / n_DG = sigma_vm_a / S_e + sigma_vm_m / S_ut"
  }),
  defineRelation({
    id: "eq_shaft_fat_soderberg",
    name: "DE-Soderberg Shaft Fatigue Check",
    canonicalTex: "\\frac{1}{n_{DS}} = \\frac{\\sigma'_a}{S_e} + \\frac{\\sigma'_m}{S_y}",
    formula: "1 / n_DS = sigma_vm_a / S_e + sigma_vm_m / S_y"
  }),
  defineRelation({
    id: "eq_shaft_fat_asme",
    name: "DE-ASME-Elliptic Shaft Fatigue Check",
    canonicalTex: "\\frac{1}{n_{AE}^2} = \\left(\\frac{\\sigma'_a}{S_e}\\right)^2 + \\left(\\frac{\\sigma'_m}{S_y}\\right)^2",
    formula: "1 / (n_AE^2) = ((sigma_vm_a / S_e)^2) + ((sigma_vm_m / S_y)^2)"
  }),
  defineRelation({
    id: "eq_shaft_fat_gerber",
    name: "DE-Gerber Shaft Fatigue Check",
    canonicalTex: "\\frac{n_{Gb} \\sigma'_a}{S_e} + \\left(\\frac{n_{Gb} \\sigma'_m}{S_{ut}}\\right)^2 = 1",
    formula: "1 = (n_Gb * sigma_vm_a) / S_e + (((n_Gb * sigma_vm_m) / S_ut)^2)"
  }),
  defineRelation({
    id: "eq_shaft_fat_langer",
    name: "Langer First-Cycle Static Yield Check",
    canonicalTex: "\\frac{1}{n_y} = \\frac{\\sigma'_a + \\sigma'_m}{S_y}",
    formula: "1 / n_y = (sigma_vm_a + sigma_vm_m) / S_y"
  })
]);
