/**
 * src/topics/machine_design/stress/beam_bending_shear/schema.js
 * Schema for Simple Beam Bending, Flexure, Parallel-Axis Theorem & Transverse Shear (Part IV, Sec. 7-9).
 */

import { STRESS_BASE_VARS } from "../../common/stress_base_schema.js";
import { DIMENSIONS } from "../../../../core/dimensions.js";

export const BEAM_BENDING_VARS_DB = Object.freeze({
  F: STRESS_BASE_VARS.F,
  V: STRESS_BASE_VARS.V,
  M: STRESS_BASE_VARS.M,
  I: STRESS_BASE_VARS.I,
  c: STRESS_BASE_VARS.c,
  Z: STRESS_BASE_VARS.Z,
  sigma_b: STRESS_BASE_VARS.sigma_b,
  S_y: STRESS_BASE_VARS.S_y,
  A: STRESS_BASE_VARS.A,

  "L": {
    name: "Beam Span Length",
    symbol: "L",
    dimension: DIMENSIONS.LENGTH,
    unit: "m",
    nameAliases: ["Beam Span Length", "Simply Supported Span"],
    symbolAliases: ["L"],
    aliases: ["Beam Span Length", "Simply Supported Span"]
  },
  "b": {
    name: "Section Width",
    symbol: "b",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Section Width", "Rectangular Beam Width", "Web Width"],
    symbolAliases: ["b", "w"],
    aliases: ["Section Width", "Rectangular Beam Width", "Web Width"]
  },
  "h": {
    name: "Section Depth",
    symbol: "h",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Section Depth", "Rectangular Beam Height"],
    symbolAliases: ["h", "d"],
    aliases: ["Section Depth", "Rectangular Beam Height"]
  },
  "Q_max": {
    name: "First Moment of Area at Neutral Axis",
    symbol: "Q",
    dimension: DIMENSIONS.SECTION_MODULUS,
    unit: "mm^3",
    nameAliases: ["First Moment of Area at Neutral Axis", "Statical Moment of Area"],
    symbolAliases: ["Q", "Q_{max}"],
    aliases: ["First Moment of Area at Neutral Axis", "Statical Moment of Area"]
  },
  "d_y": {
    name: "Parallel-Axis Offset Distance",
    symbol: "d_y",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    nameAliases: ["Parallel-Axis Offset Distance", "Centroidal Shift Distance"],
    symbolAliases: ["d_y", "y_c"],
    aliases: ["Parallel-Axis Offset Distance", "Centroidal Shift Distance"]
  },
  "I_off": {
    name: "Offset Axis Moment of Inertia",
    symbol: "I_{off}",
    dimension: DIMENSIONS.SECOND_MOMENT_OF_AREA,
    unit: "mm^4",
    nameAliases: ["Offset Axis Moment of Inertia", "Shifted-Axis Second Moment of Area"],
    symbolAliases: ["I_{off}", "I'"],
    aliases: ["Offset Axis Moment of Inertia", "Shifted-Axis Second Moment of Area"]
  },
  "tau_avg": {
    name: "Average Transverse Shear Stress",
    symbol: "\\tau_{avg}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Average Transverse Shear Stress", "Mean Section Shear Stress"],
    symbolAliases: ["\\tau_{avg}"],
    aliases: ["Average Transverse Shear Stress", "Mean Section Shear Stress"]
  },
  "tau_max": {
    name: "Maximum Transverse Shear Stress",
    symbol: "\\tau_{max}",
    dimension: DIMENSIONS.STRESS,
    unit: "MPa",
    nameAliases: ["Maximum Transverse Shear Stress", "Neutral-Axis Beam Shear Stress"],
    symbolAliases: ["\\tau_{max}", "\\tau_{NA}"],
    aliases: ["Maximum Transverse Shear Stress", "Neutral-Axis Beam Shear Stress"]
  },
  "q_flow": {
    name: "Shear Flow at Neutral Axis",
    symbol: "q",
    dimension: DIMENSIONS.STIFFNESS,
    unit: "N/mm",
    nameAliases: ["Shear Flow at Neutral Axis", "Beam Shear Flow"],
    symbolAliases: ["q"],
    aliases: ["Shear Flow at Neutral Axis", "Beam Shear Flow"]
  },
  "n_b": {
    name: "Bending Factor of Safety",
    symbol: "n_b",
    dimension: DIMENSIONS.DIMENSIONLESS,
    unit: "dimless",
    nameAliases: ["Bending Factor of Safety", "Flexural Safety Factor"],
    symbolAliases: ["n_b"],
    aliases: ["Bending Factor of Safety", "Flexural Safety Factor"]
  }
});
