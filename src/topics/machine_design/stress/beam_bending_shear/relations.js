/**
 * src/topics/machine_design/stress/beam_bending_shear/relations.js
 * Relations for Simply Supported Rectangular Beam Bending, Parallel-Axis Theorem & Transverse Shear.
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";
import {
  EQ_BASE_FLEXURE_STRESS,
  EQ_BASE_SECTION_MODULUS,
  EQ_BASE_FLEXURE_Z
} from "../../common/stress_base_relations.js";

export const BEAM_BENDING_RELATIONS = compileRelations([
  EQ_BASE_FLEXURE_STRESS,
  EQ_BASE_SECTION_MODULUS,
  EQ_BASE_FLEXURE_Z,

  defineRelation({
    id: "eq_stress_beam_mid_shear",
    name: "Simply Supported Center-Load Shear Force",
    canonicalTex: "V = \\frac{F}{2}",
    formula: "V = F / 2"
  }),
  defineRelation({
    id: "eq_stress_beam_mid_moment",
    name: "Simply Supported Center-Load Bending Moment",
    canonicalTex: "M = \\frac{F L}{4}",
    formula: "M = (F * L) / 4"
  }),
  defineRelation({
    id: "eq_stress_beam_rect_area",
    name: "Rectangular Cross-Section Area",
    canonicalTex: "A = b h",
    formula: "A = b * h"
  }),
  defineRelation({
    id: "eq_stress_beam_half_depth",
    name: "Extreme Fiber Distance",
    canonicalTex: "c = \\frac{h}{2}",
    formula: "c = h / 2"
  }),
  defineRelation({
    id: "eq_stress_beam_rect_inertia",
    name: "Rectangular Moment of Inertia",
    canonicalTex: "I = \\frac{b h^3}{12}",
    formula: "I = (b * (h^3)) / 12"
  }),
  defineRelation({
    id: "eq_stress_beam_rect_z",
    name: "Rectangular Section Modulus",
    canonicalTex: "Z = \\frac{b h^2}{6}",
    formula: "Z = (b * (h^2)) / 6"
  }),
  defineRelation({
    id: "eq_stress_beam_rect_q",
    name: "First Moment of Area (Rectangular NA)",
    canonicalTex: "Q = \\frac{b h^2}{8}",
    formula: "Q_max = (b * (h^2)) / 8"
  }),
  defineRelation({
    id: "eq_stress_beam_parallel_axis",
    name: "Parallel-Axis Theorem",
    canonicalTex: "I_{off} = I + A d_y^2",
    formula: "I_off = I + A * (d_y^2)"
  }),
  defineRelation({
    id: "eq_stress_beam_tau_avg",
    name: "Average Beam Shear Stress",
    canonicalTex: "\\tau_{avg} = \\frac{V}{A}",
    formula: "tau_avg = V / A"
  }),
  defineRelation({
    id: "eq_stress_beam_tau_rect_max",
    name: "Maximum Rectangular Shear Stress",
    canonicalTex: "\\tau_{max} = 1.5 \\tau_{avg}",
    formula: "tau_max = 1.5 * tau_avg"
  }),
  defineRelation({
    id: "eq_stress_beam_shear_flow",
    name: "Beam Shear Flow",
    canonicalTex: "q = \\frac{V Q}{I}",
    formula: "q_flow = (V * Q_max) / I"
  }),
  defineRelation({
    id: "eq_stress_beam_tau_flow",
    name: "Transverse Shear Stress from Shear Flow",
    canonicalTex: "\\tau_{max} = \\frac{q}{b}",
    formula: "tau_max = q_flow / b"
  }),
  defineRelation({
    id: "eq_stress_beam_tau_vqib",
    name: "General Transverse Shear Formula",
    canonicalTex: "\\tau_{max} = \\frac{V Q}{I b}",
    formula: "tau_max = (V * Q_max) / (I * b)"
  }),
  defineRelation({
    id: "eq_stress_beam_fos",
    name: "Bending Factor of Safety",
    canonicalTex: "n_b = \\frac{S_y}{\\sigma_b}",
    formula: "n_b = S_y / sigma_b"
  })
]);
