/**
 * src/topics/machine_design/stress/stress_concentration/relations.js
 * Relations for Geometric Stress Concentration (Kt, Kts), Notch Sensitivity (q, Kf, Kfs),
 * and Local Peak Combined Stress.
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";

export const STRESS_CONCENTRATION_RELATIONS = compileRelations([
  defineRelation({
    id: "eq_stress_sc_dd_ratio",
    name: "Shoulder Diameter Ratio",
    canonicalTex: "\\left(\\frac{D}{d}\\right) = \\frac{D}{d}",
    formula: "ratio_Dd = D_maj / d_min"
  }),
  defineRelation({
    id: "eq_stress_sc_rd_ratio",
    name: "Fillet-to-Diameter Ratio",
    canonicalTex: "\\left(\\frac{r}{d}\\right) = \\frac{r}{d}",
    formula: "ratio_rd = r_fil / d_min"
  }),
  defineRelation({
    id: "eq_stress_sc_area",
    name: "Minimum Circular Section Area",
    canonicalTex: "A_{min} = \\frac{\\pi d^2}{4}",
    formula: "A_min = (pi * (d_min^2)) / 4"
  }),
  defineRelation({
    id: "eq_stress_sc_zp",
    name: "Minimum Polar Section Modulus",
    canonicalTex: "Z_{p,min} = \\frac{\\pi d^3}{16}",
    formula: "Z_pmin = (pi * (d_min^3)) / 16"
  }),
  defineRelation({
    id: "eq_stress_sc_nom_axial",
    name: "Nominal Axial Stress",
    canonicalTex: "\\sigma_0 = \\frac{F}{A_{min}}",
    formula: "sigma_0 = F / A_min"
  }),
  defineRelation({
    id: "eq_stress_sc_max_axial",
    name: "Maximum Local Normal Stress",
    canonicalTex: "\\sigma_{max} = K_t \\sigma_0",
    formula: "sigma_max = K_t * sigma_0"
  }),
  defineRelation({
    id: "eq_stress_sc_nom_shear",
    name: "Nominal Torsional Shear Stress",
    canonicalTex: "\\tau_0 = \\frac{T}{Z_{p,min}}",
    formula: "tau_0 = T / Z_pmin"
  }),
  defineRelation({
    id: "eq_stress_sc_max_shear",
    name: "Maximum Local Shear Stress",
    canonicalTex: "\\tau_{max} = K_{ts} \\tau_0",
    formula: "tau_max = K_ts * tau_0"
  }),
  defineRelation({
    id: "eq_stress_sc_kf",
    name: "Fatigue Stress Concentration Factor (Normal)",
    canonicalTex: "K_f = 1 + q (K_t - 1)",
    formula: "K_f = 1 + q * (K_t - 1)"
  }),
  defineRelation({
    id: "eq_stress_sc_kfs",
    name: "Fatigue Stress Concentration Factor (Shear)",
    canonicalTex: "K_{fs} = 1 + q_s (K_{ts} - 1)",
    formula: "K_fs = 1 + q_s * (K_ts - 1)"
  }),
  defineRelation({
    id: "eq_stress_sc_nom_alt_axial",
    name: "Nominal Alternating Normal Stress",
    canonicalTex: "\\sigma_{a0} = \\frac{F_a}{A_{min}}",
    formula: "sigma_a0 = F_a / A_min"
  }),
  defineRelation({
    id: "eq_stress_sc_loc_alt_axial",
    name: "Local Cyclic Normal Stress",
    canonicalTex: "\\sigma_{a,loc} = K_f \\sigma_{a0}",
    formula: "sigma_a_loc = K_f * sigma_a0"
  }),
  defineRelation({
    id: "eq_stress_sc_nom_alt_shear",
    name: "Nominal Alternating Shear Stress",
    canonicalTex: "\\tau_{a0} = \\frac{T_a}{Z_{p,min}}",
    formula: "tau_a0 = T_a / Z_pmin"
  }),
  defineRelation({
    id: "eq_stress_sc_loc_alt_shear",
    name: "Local Cyclic Shear Stress",
    canonicalTex: "\\tau_{a,loc} = K_{fs} \\tau_{a0}",
    formula: "tau_a_loc = K_fs * tau_a0"
  }),
  defineRelation({
    id: "eq_stress_sc_peak_vm",
    name: "Peak Local von Mises Stress",
    canonicalTex: "\\sigma'_{max} = \\sqrt{\\sigma_{max}^2 + 3 \\tau_{max}^2}",
    formula: "sigma_vm_max = sqrt((sigma_max^2) + 3 * (tau_max^2))"
  }),
  defineRelation({
    id: "eq_stress_sc_fos",
    name: "Local Yield Safety Factor",
    canonicalTex: "n_{loc} = \\frac{S_y}{\\sigma'_{max}}",
    formula: "n_loc = S_y / sigma_vm_max"
  })
]);
