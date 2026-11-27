/**
 * src/topics/machine_design/pressure_vessels/thin_walled_cylinders/relations.js
 * Membrane stresses, end-closure thrust, biaxial elastic deformations, and failure criteria.
 * References: Beer & Johnston Mechanics of Materials Sec. 7.9, Shigley Sec. 3.15.
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";

export const THIN_WALLED_CYLINDERS_RELATIONS = compileRelations([
  defineRelation({
    id: "eq_pv_cyl_di_ri",
    name: "Inner Diameter and Radius",
    canonicalTex: "D_i = 2 r_i",
    formula: "D_i = 2 * r_i"
  }),
  defineRelation({
    id: "eq_pv_cyl_do_ro",
    name: "Outer Diameter and Radius",
    canonicalTex: "D_o = 2 r_o",
    formula: "D_o = 2 * r_o"
  }),
  defineRelation({
    id: "eq_pv_cyl_ro_ri_t",
    name: "Outer Radius Geometry",
    canonicalTex: "r_o = r_i + t",
    formula: "r_o = r_i + t"
  }),
  defineRelation({
    id: "eq_pv_cyl_do_di_t",
    name: "Outer Diameter Geometry",
    canonicalTex: "D_o = D_i + 2 t",
    formula: "D_o = D_i + 2 * t"
  }),
  defineRelation({
    id: "eq_pv_cyl_dm",
    name: "Mean Diameter",
    canonicalTex: "D_m = \\frac{D_i + D_o}{2}",
    formula: "D_m = (D_i + D_o) / 2"
  }),
  defineRelation({
    id: "eq_pv_cyl_tnom",
    name: "Nominal Shell Thickness",
    canonicalTex: "t_{nom} = t + c_a",
    formula: "t_nom = t + c_a"
  }),
  defineRelation({
    id: "eq_pv_cyl_sigma_h",
    name: "Circumferential (Hoop) Stress",
    canonicalTex: "\\sigma_h = \\frac{p_i r_i}{t}",
    formula: "sigma_h = (p_i * r_i) / t"
  }),
  defineRelation({
    id: "eq_pv_cyl_sigma_L",
    name: "Longitudinal (Axial) Stress",
    canonicalTex: "\\sigma_L = \\frac{p_i r_i}{2 t}",
    formula: "sigma_L = (p_i * r_i) / (2 * t)"
  }),
  defineRelation({
    id: "eq_pv_cyl_stress_ratio",
    name: "Hoop to Longitudinal Stress Ratio",
    canonicalTex: "\\sigma_h = 2 \\sigma_L",
    formula: "sigma_h = 2 * sigma_L"
  }),
  defineRelation({
    id: "eq_pv_cyl_tau_max_in",
    name: "Maximum In-Plane Shear Stress",
    canonicalTex: "\\tau_{max,in} = \\frac{\\sigma_h - \\sigma_L}{2}",
    formula: "tau_max_in = (sigma_h - sigma_L) / 2"
  }),
  defineRelation({
    id: "eq_pv_cyl_tau_max",
    name: "Maximum Absolute Shear Stress",
    canonicalTex: "\\tau_{max} = \\frac{\\sigma_h}{2}",
    formula: "tau_max = sigma_h / 2"
  }),
  defineRelation({
    id: "eq_pv_cyl_blowoff_force",
    name: "Axial End-Cap Blowoff Thrust",
    canonicalTex: "F_L = p_i \\pi r_i^2",
    formula: "F_L = p_i * pi * (r_i^2)"
  }),
  defineRelation({
    id: "eq_pv_cyl_delta_D",
    name: "Diametral Expansion (Biaxial Hooke's Law)",
    canonicalTex: "\\Delta D = \\frac{D_i (\\sigma_h - \\nu \\sigma_L)}{E}",
    formula: "delta_D = (D_i * (sigma_h - nu * sigma_L)) / E"
  }),
  defineRelation({
    id: "eq_pv_cyl_delta_L",
    name: "Longitudinal Elongation (Biaxial Hooke's Law)",
    canonicalTex: "\\Delta L = \\frac{L (\\sigma_L - \\nu \\sigma_h)}{E}",
    formula: "delta_L = (L * (sigma_L - nu * sigma_h)) / E"
  }),
  defineRelation({
    id: "eq_pv_cyl_safety_factor",
    name: "Hoop Yield Factor of Safety",
    canonicalTex: "n = \\frac{S_y}{\\sigma_h}",
    formula: "n_s = S_y / sigma_h"
  }),
  defineRelation({
    id: "eq_pv_cyl_allowable_stress",
    name: "Allowable Stress",
    canonicalTex: "\\sigma_{allow} = \\frac{S_y}{n}",
    formula: "sigma_allow = S_y / n_s"
  })
]);
