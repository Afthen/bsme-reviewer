/**
 * src/topics/machine_design/common/shaft_base_relations.js
 * Reusable shaft kinematics, power transmission, cross-section, and bending primitives.
 * References: Shigley's Mechanical Engineering Design (Ch. 7), Mott (Ch. 12).
 */

import { defineRelation } from "../../../core/relation_builder.js";

export const EQ_BASE_SHAFT_OMEGA = defineRelation({
  id: "eq_base_shaft_omega",
  name: "Shaft Angular Velocity from RPM",
  canonicalTex: "\\omega = 2\\pi n",
  formula: "omega = 2 * pi * n_op"
});

export const EQ_BASE_SHAFT_POWER = defineRelation({
  id: "eq_base_shaft_power",
  name: "Transmitted Shaft Power",
  canonicalTex: "P = T\\omega",
  formula: "P = T * omega"
});

export const EQ_BASE_SHAFT_MOMENT_RES = defineRelation({
  id: "eq_base_shaft_moment_res",
  name: "Resultant Bending Moment (3D)",
  canonicalTex: "M = \\sqrt{M_h^2 + M_v^2}",
  formula: "M = sqrt((M_h^2) + (M_v^2))"
});

export const EQ_BASE_SHAFT_SOLID_AREA = defineRelation({
  id: "eq_base_shaft_solid_area",
  name: "Solid Circular Shaft Area",
  canonicalTex: "A = \\frac{\\pi d^2}{4}",
  formula: "A = (pi * (d^2)) / 4"
});

export const EQ_BASE_SHAFT_SOLID_I = defineRelation({
  id: "eq_base_shaft_solid_i",
  name: "Solid Circular Area Moment of Inertia",
  canonicalTex: "I = \\frac{\\pi d^4}{64}",
  formula: "I = (pi * (d^4)) / 64"
});

export const EQ_BASE_SHAFT_SOLID_J = defineRelation({
  id: "eq_base_shaft_solid_j",
  name: "Solid Circular Polar Moment of Inertia",
  canonicalTex: "J = \\frac{\\pi d^4}{32}",
  formula: "J = (pi * (d^4)) / 32"
});

export const EQ_BASE_SHAFT_SOLID_Z = defineRelation({
  id: "eq_base_shaft_solid_z",
  name: "Solid Circular Flexural Section Modulus",
  canonicalTex: "Z = \\frac{\\pi d^3}{32}",
  formula: "Z = (pi * (d^3)) / 32"
});

export const EQ_BASE_SHAFT_SOLID_ZP = defineRelation({
  id: "eq_base_shaft_solid_zp",
  name: "Solid Circular Polar Section Modulus",
  canonicalTex: "Z_p = \\frac{\\pi d^3}{16}",
  formula: "Z_p = (pi * (d^3)) / 16"
});

export const EQ_BASE_SHAFT_TORSION_ZP = defineRelation({
  id: "eq_base_shaft_torsion_zp",
  name: "Torsional Shear Stress via Polar Section Modulus",
  canonicalTex: "\\tau = \\frac{T}{Z_p}",
  formula: "tau = T / Z_p"
});

export const EQ_BASE_SHAFT_HOLLOW_RATIO = defineRelation({
  id: "eq_base_shaft_hollow_ratio",
  name: "Hollow Shaft Diameter Ratio",
  canonicalTex: "K = \\frac{d_i}{d_o}",
  formula: "k_d = d_i / d_o"
});
