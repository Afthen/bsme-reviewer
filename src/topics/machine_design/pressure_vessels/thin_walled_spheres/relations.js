/**
 * src/topics/machine_design/pressure_vessels/thin_walled_spheres/relations.js
 * Membrane stresses, hemispherical joint thrust, spherical expansion, and failure criteria.
 * References: Beer & Johnston Sec. 7.9, Hibbeler Sec. 8.1.
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";

export const THIN_WALLED_SPHERES_RELATIONS = compileRelations([
  defineRelation({
    id: "eq_pv_sph_di_ri",
    name: "Inner Diameter and Radius",
    canonicalTex: "D_i = 2 r_i",
    formula: "D_i = 2 * r_i"
  }),
  defineRelation({
    id: "eq_pv_sph_do_ro",
    name: "Outer Diameter and Radius",
    canonicalTex: "D_o = 2 r_o",
    formula: "D_o = 2 * r_o"
  }),
  defineRelation({
    id: "eq_pv_sph_ro_ri_t",
    name: "Outer Radius Geometry",
    canonicalTex: "r_o = r_i + t",
    formula: "r_o = r_i + t"
  }),
  defineRelation({
    id: "eq_pv_sph_do_di_t",
    name: "Outer Diameter Geometry",
    canonicalTex: "D_o = D_i + 2 t",
    formula: "D_o = D_i + 2 * t"
  }),
  defineRelation({
    id: "eq_pv_sph_dm",
    name: "Mean Diameter",
    canonicalTex: "D_m = \\frac{D_i + D_o}{2}",
    formula: "D_m = (D_i + D_o) / 2"
  }),
  defineRelation({
    id: "eq_pv_sph_tnom",
    name: "Nominal Shell Thickness",
    canonicalTex: "t_{nom} = t + c_a",
    formula: "t_nom = t + c_a"
  }),
  defineRelation({
    id: "eq_pv_sph_sigma",
    name: "Spherical Membrane Stress",
    canonicalTex: "\\sigma_s = \\frac{p_i r_i}{2 t}",
    formula: "sigma_s = (p_i * r_i) / (2 * t)"
  }),
  defineRelation({
    id: "eq_pv_sph_tau_max",
    name: "Maximum Absolute Shear Stress",
    canonicalTex: "\\tau_{max} = \\frac{\\sigma_s}{2}",
    formula: "tau_max = sigma_s / 2"
  }),
  defineRelation({
    id: "eq_pv_sph_sep_force",
    name: "Hemispherical Joint Separation Force",
    canonicalTex: "F_{sep} = p_i \\pi r_i^2",
    formula: "F_sep = p_i * pi * (r_i^2)"
  }),
  defineRelation({
    id: "eq_pv_sph_delta_D",
    name: "Spherical Diametral Expansion",
    canonicalTex: "\\Delta D = \\frac{D_i \\sigma_s (1 - \\nu)}{E}",
    formula: "delta_D = (D_i * sigma_s * (1 - nu)) / E"
  }),
  defineRelation({
    id: "eq_pv_sph_safety_factor",
    name: "Spherical Yield Factor of Safety",
    canonicalTex: "n = \\frac{S_y}{\\sigma_s}",
    formula: "n_s = S_y / sigma_s"
  }),
  defineRelation({
    id: "eq_pv_sph_allowable_stress",
    name: "Allowable Stress",
    canonicalTex: "\\sigma_{allow} = \\frac{S_y}{n}",
    formula: "sigma_allow = S_y / n_s"
  })
]);