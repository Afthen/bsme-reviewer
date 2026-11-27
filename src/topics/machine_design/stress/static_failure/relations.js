/**
 * src/topics/machine_design/stress/static_failure/relations.js
 * Static failure criteria for ductile (Tresca, von Mises, Saint-Venant, Beltrami-Haigh)
 * and brittle (Rankine, Coulomb-Mohr, Modified Mohr) materials plus allowable stress design.
 * Reference: Shigley's MED, Ch. 5; Norton, Machine Design, Ch. 5; Ugural & Fenster.
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";
import {
  EQ_BASE_ALLOWABLE_STRESS,
  EQ_BASE_VON_MISES_PRINCIPAL
} from "../../common/stress_base_relations.js";

export const STATIC_FAILURE_RELATIONS = compileRelations([
  EQ_BASE_VON_MISES_PRINCIPAL,
  EQ_BASE_ALLOWABLE_STRESS,

  defineRelation({
    id: "eq_stress_fail_tau_max",
    name: "Maximum Shear Stress (Opposite-Sign Principals)",
    canonicalTex: "\\tau_{max} = \\frac{\\sigma_1 - \\sigma_2}{2}",
    formula: "tau_max = (sigma_1 - sigma_2) / 2"
  }),
  defineRelation({
    id: "eq_stress_fail_ssy_mss",
    name: "Tresca Shear Yield Strength",
    canonicalTex: "S_{sy,MSS} = 0.5 S_y",
    formula: "S_sy_MSS = 0.5 * S_y"
  }),
  defineRelation({
    id: "eq_stress_fail_nmss",
    name: "Maximum Shear Stress Theory (Tresca)",
    canonicalTex: "n_{MSS} = \\frac{S_{sy,MSS}}{\\tau_{max}}",
    formula: "n_MSS = S_sy_MSS / tau_max"
  }),
  defineRelation({
    id: "eq_stress_fail_ssy_de",
    name: "Distortion Energy Shear Yield Strength",
    canonicalTex: "S_{sy,DE} = \\frac{S_y}{\\sqrt{3}}",
    formula: "S_sy_DE = S_y / sqrt(3)"
  }),
  defineRelation({
    id: "eq_stress_fail_nde",
    name: "Distortion Energy Theory (von Mises)",
    canonicalTex: "n_{DE} = \\frac{S_y}{\\sigma'}",
    formula: "n_DE = S_y / sigma_vm"
  }),
  defineRelation({
    id: "eq_stress_fail_sv_stress",
    name: "Saint-Venant Equivalent Stress (Governing Principal Strain)",
    canonicalTex: "\\sigma_{SV} = \\nu \\sigma_1 - \\sigma_2",
    formula: "sigma_SV = nu * sigma_1 - sigma_2"
  }),
  defineRelation({
    id: "eq_stress_fail_nsv",
    name: "Maximum Principal Strain Theory (Saint-Venant)",
    canonicalTex: "n_{SV} = \\frac{S_y}{\\sigma_{SV}}",
    formula: "n_SV = S_y / sigma_SV"
  }),
  defineRelation({
    id: "eq_stress_fail_bh_stress",
    name: "Beltrami-Haigh Total Strain Energy Equivalent Stress",
    canonicalTex: "\\sigma_{BH} = \\sqrt{\\sigma_1^2 - 2 \\nu \\sigma_1 \\sigma_2 + \\sigma_2^2}",
    formula: "sigma_BH = sqrt((sigma_1^2) - 2 * nu * sigma_1 * sigma_2 + (sigma_2^2))"
  }),
  defineRelation({
    id: "eq_stress_fail_nbh",
    name: "Maximum Total Strain Energy Theory (Beltrami-Haigh)",
    canonicalTex: "n_{BH} = \\frac{S_y}{\\sigma_{BH}}",
    formula: "n_BH = S_y / sigma_BH"
  }),
  defineRelation({
    id: "eq_stress_fail_rankine",
    name: "Maximum Principal Stress Theory (Rankine)",
    canonicalTex: "n_{MPS} = \\frac{S_{ut}}{\\sigma_1}",
    formula: "n_MPS = S_ut / sigma_1"
  }),
  defineRelation({
    id: "eq_stress_fail_coulomb_mohr",
    name: "Brittle Coulomb-Mohr Theory",
    canonicalTex: "\\frac{1}{n_{CM}} = \\frac{\\sigma_1}{S_{ut}} - \\frac{\\sigma_2}{S_{uc}}",
    formula: "1 / n_CM = sigma_1 / S_ut - sigma_2 / S_uc"
  }),
  defineRelation({
    id: "eq_stress_fail_modified_mohr",
    name: "Modified Mohr Theory (Second Branch)",
    canonicalTex: "\\frac{1}{n_{MM}} = \\frac{\\sigma_1}{S_{ut}} - \\frac{\\sigma_1 + \\sigma_2}{S_{uc}}",
    formula: "1 / n_MM = sigma_1 / S_ut - (sigma_1 + sigma_2) / S_uc"
  }),
  defineRelation({
    id: "eq_stress_fail_tau_allow",
    name: "Allowable Shear Stress (Distortion Energy)",
    canonicalTex: "\\tau_{allow} = \\frac{S_{sy,DE}}{n_{des}}",
    formula: "tau_allow = S_sy_DE / n_des"
  }),
  defineRelation({
    id: "eq_stress_fail_area_req",
    name: "Minimum Required Cross-Sectional Area",
    canonicalTex: "A_{req} = \\frac{F}{\\sigma_{allow}}",
    formula: "A_req = F / sigma_allow"
  })
]);
