/**
 * src/topics/machine_design/shafting/rigidity_deflection/relations.js
 * Lateral Shaft Rigidity: Simply-Supported Deflection, Bearing Slopes, Strain Energy,
 * and Explicit Comparison of Strength-Controlled vs. Rigidity-Controlled Sizing.
 * References: Shigley (Ch. 4 & Table A-9-6, Table 7-2), Mott (Ch. 12).
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";
import { EQ_BASE_FLEXURE_Z } from "../../common/stress_base_relations.js";
import { EQ_BASE_SHAFT_SOLID_I, EQ_BASE_SHAFT_SOLID_Z } from "../../common/shaft_base_relations.js";

export const SHAFT_RIGIDITY_DEFLECTION_RELATIONS = compileRelations([
  EQ_BASE_SHAFT_SOLID_I,
  EQ_BASE_SHAFT_SOLID_Z,
  EQ_BASE_FLEXURE_Z,

  defineRelation({
    id: "eq_shaft_rdef_span",
    name: "Shaft Bearing Span Partition",
    canonicalTex: "L = a + b",
    formula: "L = a + b"
  }),
  defineRelation({
    id: "eq_shaft_rdef_force_res",
    name: "Resultant Transverse Load",
    canonicalTex: "F = \\sqrt{F_v^2 + F_h^2}",
    formula: "F = sqrt((F_v^2) + (F_h^2))"
  }),
  defineRelation({
    id: "eq_shaft_rdef_dv",
    name: "Vertical Plane Deflection at Load",
    canonicalTex: "\\delta_v = \\frac{F_v a^2 b^2}{3 E I L}",
    formula: "delta_v = (F_v * (a^2) * (b^2)) / (3 * E * I * L)"
  }),
  defineRelation({
    id: "eq_shaft_rdef_dh",
    name: "Horizontal Plane Deflection at Load",
    canonicalTex: "\\delta_h = \\frac{F_h a^2 b^2}{3 E I L}",
    formula: "delta_h = (F_h * (a^2) * (b^2)) / (3 * E * I * L)"
  }),
  defineRelation({
    id: "eq_shaft_rdef_dres",
    name: "Resultant Shaft Deflection",
    canonicalTex: "\\delta = \\sqrt{\\delta_v^2 + \\delta_h^2}",
    formula: "delta = sqrt((delta_v^2) + (delta_h^2))"
  }),
  defineRelation({
    id: "eq_shaft_rdef_theta_a",
    name: "Slope at Bearing A",
    canonicalTex: "\\theta_A = \\frac{F a b (L + b)}{6 E I L}",
    formula: "theta_A = (F * a * b * (L + b)) / (6 * E * I * L)"
  }),
  defineRelation({
    id: "eq_shaft_rdef_theta_b",
    name: "Slope at Bearing B",
    canonicalTex: "\\theta_B = \\frac{F a b (L + a)}{6 E I L}",
    formula: "theta_B = (F * a * b * (L + a)) / (6 * E * I * L)"
  }),
  defineRelation({
    id: "eq_shaft_rdef_energy",
    name: "Flexural Strain Energy (Castigliano / Clapeyron)",
    canonicalTex: "U_b = \\frac{1}{2} F \\delta",
    formula: "U_b = 0.5 * F * delta"
  }),
  defineRelation({
    id: "eq_shaft_rdef_moment",
    name: "Peak Bending Moment at Load",
    canonicalTex: "M = \\frac{F a b}{L}",
    formula: "M = (F * a * b) / L"
  }),
  defineRelation({
    id: "eq_shaft_rdef_zstr",
    name: "Strength-Required Section Modulus",
    canonicalTex: "Z_{str} = \\frac{M}{\\sigma_{allow}}",
    formula: "Z_str = M / sigma_allow"
  }),
  defineRelation({
    id: "eq_shaft_rdef_dstr",
    name: "Strength-Governed Shaft Diameter",
    canonicalTex: "Z_{str} = \\frac{\\pi d_{str}^3}{32}",
    formula: "Z_str = (pi * (d_str^3)) / 32"
  }),
  defineRelation({
    id: "eq_shaft_rdef_irig",
    name: "Deflection-Required Moment of Inertia",
    canonicalTex: "I_{rig} = \\frac{F a^2 b^2}{3 E L \\delta_{allow}}",
    formula: "I_rig = (F * (a^2) * (b^2)) / (3 * E * L * delta_allow)"
  }),
  defineRelation({
    id: "eq_shaft_rdef_drig",
    name: "Deflection-Governed Shaft Diameter",
    canonicalTex: "I_{rig} = \\frac{\\pi d_{rig}^4}{64}",
    formula: "I_rig = (pi * (d_rig^4)) / 64"
  }),
  defineRelation({
    id: "eq_shaft_rdef_islope",
    name: "Bearing Slope-Required Moment of Inertia",
    canonicalTex: "I_{\\theta} = \\frac{F a b (L + a)}{6 E L \\theta_{allow}}",
    formula: "I_slope = (F * a * b * (L + a)) / (6 * E * L * theta_allow)"
  }),
  defineRelation({
    id: "eq_shaft_rdef_ndelta",
    name: "Lateral Deflection Rigidity Margin",
    canonicalTex: "n_{\\delta} = \\frac{\\delta_{allow}}{\\delta}",
    formula: "n_delta = delta_allow / delta"
  }),
  defineRelation({
    id: "eq_shaft_rdef_ntheta",
    name: "Bearing Alignment Margin",
    canonicalTex: "n_{\\theta} = \\frac{\\theta_{allow}}{\\theta_B}",
    formula: "n_theta = theta_allow / theta_B"
  }),
  defineRelation({
    id: "eq_shaft_rdef_nstr",
    name: "Bending Strength Margin",
    canonicalTex: "n_{str} = \\frac{\\sigma_{allow}}{\\sigma_b}",
    formula: "n_str = sigma_allow / sigma_b"
  })
]);
