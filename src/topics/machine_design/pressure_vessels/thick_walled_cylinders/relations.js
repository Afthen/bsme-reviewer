/**
 * src/topics/machine_design/pressure_vessels/thick_walled_cylinders/relations.js
 * Canonical Lamé equations for thick cylinders under internal pressure (p_o = 0).
 * Reference: Shigley's Mechanical Engineering Design Sec. 3.16.
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";

export const THICK_WALLED_CYLINDERS_RELATIONS = compileRelations([
  defineRelation({
    id: "eq_pv_thk_di_ri",
    name: "Inner Diameter and Radius",
    canonicalTex: "D_i = 2 r_i",
    formula: "D_i = 2 * r_i"
  }),
  defineRelation({
    id: "eq_pv_thk_do_ro",
    name: "Outer Diameter and Radius",
    canonicalTex: "D_o = 2 r_o",
    formula: "D_o = 2 * r_o"
  }),
  defineRelation({
    id: "eq_pv_thk_t",
    name: "Wall Thickness Definition",
    canonicalTex: "t = r_o - r_i",
    formula: "t = r_o - r_i"
  }),
  defineRelation({
    id: "eq_pv_thk_do_di_t",
    name: "Outer Diameter Geometry",
    canonicalTex: "D_o = D_i + 2 t",
    formula: "D_o = D_i + 2 * t"
  }),
  defineRelation({
    id: "eq_pv_thk_sigma_t_i",
    name: "Lamé Inner Surface Tangential Stress",
    canonicalTex: "\\sigma_{t,i} = p_i \\frac{r_o^2 + r_i^2}{r_o^2 - r_i^2}",
    formula: "sigma_t_i = (p_i * ((r_o^2) + (r_i^2))) / ((r_o^2) - (r_i^2))"
  }),
  defineRelation({
    id: "eq_pv_thk_sigma_t_o",
    name: "Lamé Outer Surface Tangential Stress",
    canonicalTex: "\\sigma_{t,o} = \\frac{2 p_i r_i^2}{r_o^2 - r_i^2}",
    formula: "sigma_t_o = (2 * p_i * (r_i^2)) / ((r_o^2) - (r_i^2))"
  }),
  defineRelation({
    id: "eq_pv_thk_sigma_r_i",
    name: "Inner Surface Radial Stress Magnitude",
    canonicalTex: "\\sigma_{r,i} = p_i",
    formula: "sigma_r_i = p_i"
  }),
  defineRelation({
    id: "eq_pv_thk_sigma_L",
    name: "Closed-End Longitudinal Stress",
    canonicalTex: "\\sigma_L = \\frac{p_i r_i^2}{r_o^2 - r_i^2}",
    formula: "sigma_L = (p_i * (r_i^2)) / ((r_o^2) - (r_i^2))"
  }),
  defineRelation({
    id: "eq_pv_thk_stress_ratio",
    name: "Outer Tangential to Longitudinal Ratio",
    canonicalTex: "\\sigma_{t,o} = 2 \\sigma_L",
    formula: "sigma_t_o = 2 * sigma_L"
  }),
  defineRelation({
    id: "eq_pv_thk_tau_max_i",
    name: "Inner Bore Maximum Shear Stress",
    canonicalTex: "\\tau_{max,i} = \\frac{\\sigma_{t,i} + \\sigma_{r,i}}{2}",
    formula: "tau_max_i = (sigma_t_i + sigma_r_i) / 2"
  }),
  defineRelation({
    id: "eq_pv_thk_u_o",
    name: "Outer Surface Radial Displacement",
    canonicalTex: "u_o = \\frac{r_o \\sigma_{t,o}}{E}",
    formula: "u_o = (r_o * sigma_t_o) / E"
  }),
  defineRelation({
    id: "eq_pv_thk_delta_D_o",
    name: "Outer Diametral Expansion",
    canonicalTex: "\\Delta D_o = 2 u_o",
    formula: "delta_D_o = 2 * u_o"
  }),
  defineRelation({
    id: "eq_pv_thk_safety_factor",
    name: "Inner Bore Yield Factor of Safety",
    canonicalTex: "n = \\frac{S_y}{\\sigma_{t,i}}",
    formula: "n_s = S_y / sigma_t_i"
  }),
  defineRelation({
    id: "eq_pv_thk_allowable_stress",
    name: "Allowable Stress",
    canonicalTex: "\\sigma_{allow} = \\frac{S_y}{n}",
    formula: "sigma_allow = S_y / n_s"
  })
]);
