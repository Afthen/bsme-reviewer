/**
 * src/topics/machine_design/springs/common/spring_base_relations.js
 * Shared eq_base_* physical laws composed across Springs subtopics.
 */

import { defineRelation } from "../../../../core/relation_builder.js";

export const SPRING_INDEX_REL = defineRelation({
  id: "eq_base_spring_index",
  name: "Spring Index",
  formula: "C = D_m / d_w"
});

export const SPRING_WIRE_LEN_REL = defineRelation({
  id: "eq_base_spring_wire_length",
  name: "Active Wire Length",
  formula: "L = pi * D_m * n"
});

export const SPRING_WAHL_REL = defineRelation({
  id: "eq_base_spring_wahl",
  name: "Wahl Stress Correction Factor",
  canonicalTex: "K_w = \\cfrac{4C - 1}{4C - 4} + \\cfrac{0.615}{C}",
  formula: "K_w = (4 * C - 1) / (4 * C - 4) + 0.615 / C"
});

export const SPRING_BERGSTRASSER_REL = defineRelation({
  id: "eq_base_spring_bergstrasser",
  name: "Bergsträsser Factor",
  formula: "K_b = (4 * C + 2) / (4 * C - 3)"
});

export const SPRING_DIRECT_SHEAR_REL = defineRelation({
  id: "eq_base_spring_direct_shear",
  name: "Direct Shear Factor",
  formula: "K_s = 1 + 1 / (2 * C)"
});

export const SPRING_CURVATURE_REL = defineRelation({
  id: "eq_base_spring_curvature",
  name: "Curvature Correction Factor",
  formula: "K_c = K_w / K_s"
});

export const SPRING_RATE_REL = defineRelation({
  id: "eq_base_spring_rate",
  name: "Spring Rate (Stiffness)",
  formula: "k = F / delta"
});

export const SPRING_SPE_FD_REL = defineRelation({
  id: "eq_base_spring_spe_fd",
  name: "Spring Potential Energy (Load-Deflection)",
  formula: "SPE = 0.5 * F * delta"
});

export const SPRING_SPE_KD2_REL = defineRelation({
  id: "eq_base_spring_spe_kd2",
  name: "Spring Potential Energy (Rate-Deflection)",
  formula: "SPE = 0.5 * k * (delta^2)"
});

export const SPRING_SPE_F2K_REL = defineRelation({
  id: "eq_base_spring_spe_f2k",
  name: "Spring Potential Energy (Load-Rate)",
  formula: "SPE = (F^2) / (2 * k)"
});

export const SPRING_RATE_ENERGY_RELS = Object.freeze([
  SPRING_RATE_REL,
  SPRING_SPE_FD_REL,
  SPRING_SPE_KD2_REL,
  SPRING_SPE_F2K_REL
]);

export const SPRING_STRESS_FACTORS_RELS = Object.freeze([
  SPRING_WAHL_REL,
  SPRING_BERGSTRASSER_REL,
  SPRING_DIRECT_SHEAR_REL,
  SPRING_CURVATURE_REL
]);

export const SPRING_FREE_SOLID_REL = defineRelation({
  id: "eq_base_spring_fl_solid",
  name: "Free Length & Solid Length",
  formula: "FL = SL + delta_solid"
});

export const SPRING_FREE_OP_REL = defineRelation({
  id: "eq_base_spring_fl_op",
  name: "Free Length & Operating Length",
  formula: "FL = OL + delta"
});

export const SPRING_PERIOD_FREQ_REL = defineRelation({
  id: "eq_base_period_freq",
  name: "Period and Frequency",
  formula: "T = 1 / f"
});

export const SPRING_TORSION_MOMENT_REL = defineRelation({
  id: "eq_base_spring_torsion_moment",
  name: "Torsion Bending Moment",
  formula: "M = F * L_a"
});
