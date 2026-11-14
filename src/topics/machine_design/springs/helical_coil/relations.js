/**
 * src/topics/machine_design/springs/helical_coil/relations.js
 * Invertible Helical Coil Spring relations (Lecture Video sections 1-4).
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";
import { SPRING_BASE_RELATIONS } from "../common/index.js";

export const HELICAL_COIL_RELATIONS = compileRelations([
  ...SPRING_BASE_RELATIONS,

  // Geometric Relations
  defineRelation({
    id: "eq_spring_dm_avg",
    name: "Mean Diameter from Outer & Inner",
    canonicalTex: "D_m = \\frac{D_o + D_i}{2}",
    formula: "D_m = (D_o + D_i) / 2"
  }),
  defineRelation({
    id: "eq_spring_dm_outer",
    name: "Mean Diameter from Outer",
    canonicalTex: "D_m = D_o - d_w",
    formula: "D_m = D_o - d_w"
  }),
  defineRelation({
    id: "eq_spring_dm_inner",
    name: "Mean Diameter from Inner",
    canonicalTex: "D_m = D_i + d_w",
    formula: "D_m = D_i + d_w"
  }),
  defineRelation({
    id: "eq_spring_dm_radius",
    name: "Mean Diameter from Mean Radius",
    canonicalTex: "D_m = 2 R_m",
    formula: "D_m = 2 * R_m"
  }),
  defineRelation({
    id: "eq_spring_index",
    name: "Spring Index Definition",
    canonicalTex: "C = \\frac{D_m}{d_w}",
    formula: "C = D_m / d_w"
  }),
  defineRelation({
    id: "eq_spring_pitch_angle",
    name: "Helix Pitch Angle",
    canonicalTex: "\\tan\\alpha = \\frac{p}{\\pi D_m}",
    formula: "tan(alpha) = p / (pi * D_m)"
  }),
  defineRelation({
    id: "eq_spring_wire_length",
    name: "Active Wire Length",
    canonicalTex: "L = \\pi D_m n_e",
    formula: "L_wire = pi * D_m * n_e"
  }),

  // Stress Factors (Wahl, Bergsträsser, Direct Shear, Curvature)
  defineRelation({
    id: "eq_spring_wahl_factor",
    name: "Wahl Stress Factor",
    canonicalTex: "K_w = \\frac{4C - 1}{4C - 4} + \\frac{0.615}{C}",
    formula: "K_w = (4 * C - 1) / (4 * C - 4) + 0.615 / C"
  }),
  defineRelation({
    id: "eq_spring_bergstrasser",
    name: "Bergsträsser Factor",
    canonicalTex: "K_b = \\frac{4C + 2}{4C - 3}",
    formula: "K_b = (4 * C + 2) / (4 * C - 3)"
  }),
  defineRelation({
    id: "eq_spring_direct_shear",
    name: "Direct Shear Factor",
    canonicalTex: "K_s = 1 + \\frac{1}{2C}",
    formula: "K_s = 1 + 1 / (2 * C)"
  }),
  defineRelation({
    id: "eq_spring_curvature_factor",
    name: "Curvature Correction Factor",
    canonicalTex: "K_c = \\frac{K_w}{K_s}",
    formula: "K_c = K_w / K_s"
  }),

  // Shear Stress (Dm and C variants)
  defineRelation({
    id: "eq_spring_stress_dm",
    name: "Torsional Shear Stress (Mean Diameter)",
    canonicalTex: "S_f = \\frac{8 K_w F D_m}{\\pi d_w^3}",
    formula: "S_f = (8 * K_w * F * D_m) / (pi * (d_w^3))"
  }),
  defineRelation({
    id: "eq_spring_stress_c",
    name: "Torsional Shear Stress (Spring Index)",
    canonicalTex: "S_f = \\frac{8 K_w F C}{\\pi d_w^2}",
    formula: "S_f = (8 * K_w * F * C) / (pi * (d_w^2))"
  }),

  // Deflection (Dm and C variants)
  defineRelation({
    id: "eq_spring_deflection_dm",
    name: "Spring Deflection (Mean Diameter)",
    canonicalTex: "\\delta = \\frac{8 F D_m^3 n_e}{G d_w^4}",
    formula: "delta = (8 * F * (D_m^3) * n_e) / (G * (d_w^4))"
  }),
  defineRelation({
    id: "eq_spring_deflection_c",
    name: "Spring Deflection (Spring Index)",
    canonicalTex: "\\delta = \\frac{8 F C^3 n_e}{G d_w}",
    formula: "delta = (8 * F * (C^3) * n_e) / (G * d_w)"
  }),

  // Length Relations
  defineRelation({
    id: "eq_spring_fl_solid",
    name: "Free Length from Solid Length",
    canonicalTex: "FL = SL + \\delta_{solid}",
    formula: "FL = SL + delta_solid"
  }),
  defineRelation({
    id: "eq_spring_fl_operating",
    name: "Free Length from Operating Length",
    canonicalTex: "FL = OL + \\delta",
    formula: "FL = OL + delta"
  }),
  defineRelation({
    id: "eq_spring_solid_length",
    name: "Solid Length from Coils",
    canonicalTex: "SL = (n_e + k_{end}) d_w",
    formula: "SL = (n_e + k_end) * d_w"
  }),
  defineRelation({
    id: "eq_spring_free_length_pitch",
    name: "Free Length from Pitch",
    canonicalTex: "FL = n_e p + k_{end} d_w",
    formula: "FL = n_e * p + k_end * d_w"
  }),
  defineRelation({
    id: "eq_spring_active_total_coils",
    name: "Actual Coils from Active and Dead",
    canonicalTex: "n_a = n_e + n_{dead}",
    formula: "n_a = n_e + n_dead"
  }),

  // Multi-Load Dual States
  defineRelation({
    id: "eq_spring_load_change",
    name: "Force Increment",
    canonicalTex: "\\Delta F = F_2 - F_1",
    formula: "dF = F_2 - F_1"
  }),
  defineRelation({
    id: "eq_spring_deflection_change",
    name: "Deflection Increment",
    canonicalTex: "\\Delta \\delta = \\delta_2 - \\delta_1",
    formula: "ddelta = delta_2 - delta_1"
  }),
  defineRelation({
    id: "eq_spring_rate_increment",
    name: "Spring Rate from Increments",
    canonicalTex: "k = \\frac{\\Delta F}{\\Delta \\delta}",
    formula: "k = dF / ddelta"
  }),
  defineRelation({
    id: "eq_spring_rate_state1",
    name: "Spring Rate at State 1",
    canonicalTex: "k = \\frac{F_1}{\\delta_1}",
    formula: "k = F_1 / delta_1"
  }),
  defineRelation({
    id: "eq_spring_rate_state2",
    name: "Spring Rate at State 2",
    canonicalTex: "k = \\frac{F_2}{\\delta_2}",
    formula: "k = F_2 / delta_2"
  }),
  defineRelation({
    id: "eq_spring_ol1",
    name: "Operating Length 1",
    canonicalTex: "OL_1 = FL - \\delta_1",
    formula: "OL_1 = FL - delta_1"
  }),
  defineRelation({
    id: "eq_spring_ol2",
    name: "Operating Length 2",
    canonicalTex: "OL_2 = FL - \\delta_2",
    formula: "OL_2 = FL - delta_2"
  }),
  defineRelation({
    id: "eq_spring_ddelta_ol",
    name: "Deflection Increment from Operating Lengths",
    canonicalTex: "\\Delta \\delta = OL_1 - OL_2",
    formula: "ddelta = OL_1 - OL_2"
  })
]);
