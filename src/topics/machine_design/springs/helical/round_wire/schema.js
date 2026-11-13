/**
 * src/topics/machine_design/springs/helical/round_wire/schema.js
 */
import { DIMENSIONS } from "../../../../../core/dimensions.js";
import { SPRING_BASE_VARS } from "../../common/spring_base_schema.js";

export const HELICAL_ROUND_VARS_DB = Object.freeze({
  D_m: SPRING_BASE_VARS.D_m,
  D_o: SPRING_BASE_VARS.D_o,
  D_i: SPRING_BASE_VARS.D_i,
  R_m: SPRING_BASE_VARS.R_m,
  d_w: SPRING_BASE_VARS.d_w,
  C: SPRING_BASE_VARS.C,
  p: SPRING_BASE_VARS.p,
  alpha: SPRING_BASE_VARS.alpha,
  n: SPRING_BASE_VARS.n,
  L: SPRING_BASE_VARS.L,
  n_a: { name: "Actual Total Coils", symbol: "n_a", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Actual Total Coils", "Total Coils", "n_a"] },
  n_dead: { name: "Inactive End Coils", symbol: "n_{dead}", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", isInteger: true, aliases: ["Inactive End Coils", "Dead Coils"] },
  k_end: { name: "End Solid-Length Allowance Coils", symbol: "k_{end}", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", isInteger: true, aliases: ["End Solid-Length Allowance Coils", "End Allowance Factor"] },
  K_w: SPRING_BASE_VARS.K_w,
  K_b: SPRING_BASE_VARS.K_b,
  K_s: SPRING_BASE_VARS.K_s,
  K_c: SPRING_BASE_VARS.K_c,
  S_f: SPRING_BASE_VARS.S_f,
  F: SPRING_BASE_VARS.F,
  delta: SPRING_BASE_VARS.delta,
  G: SPRING_BASE_VARS.G,
  SL: SPRING_BASE_VARS.SL,
  FL: SPRING_BASE_VARS.FL,
  OL: SPRING_BASE_VARS.OL,
  delta_solid: SPRING_BASE_VARS.delta_solid,
  k: SPRING_BASE_VARS.k,
  SPE: SPRING_BASE_VARS.SPE,
  F_1: { name: "Initial Load (State 1)", symbol: "F_1", dimension: DIMENSIONS.FORCE, unit: "N", aliases: ["Initial Load", "Preload Force", "F_1"] },
  F_2: { name: "Final Load (State 2)", symbol: "F_2", dimension: DIMENSIONS.FORCE, unit: "N", aliases: ["Final Load", "Test Load 2", "F_2"] },
  delta_1: { name: "Initial Deflection (State 1)", symbol: "\\delta_1", dimension: DIMENSIONS.LENGTH, unit: "mm", aliases: ["Initial Deflection", "Deflection at State 1"] },
  delta_2: { name: "Final Deflection (State 2)", symbol: "\\delta_2", dimension: DIMENSIONS.LENGTH, unit: "mm", aliases: ["Final Deflection", "Deflection at State 2"] },
  OL_1: { name: "Initial Operating Length", symbol: "OL_1", dimension: DIMENSIONS.LENGTH, unit: "mm", aliases: ["Initial Operating Length", "Length at Load 1", "OL_1"] },
  OL_2: { name: "Final Operating Length", symbol: "OL_2", dimension: DIMENSIONS.LENGTH, unit: "mm", aliases: ["Final Operating Length", "Length at Load 2", "OL_2"] },
  dF: { name: "Load Increment", symbol: "\\Delta F", dimension: DIMENSIONS.FORCE, unit: "N", aliases: ["Load Increment", "Force Difference", "Delta F"] },
  ddelta: { name: "Deflection Increment", symbol: "\\Delta\\delta", dimension: DIMENSIONS.LENGTH, unit: "mm", aliases: ["Deflection Increment", "Travel Increment", "Delta delta"] }
});
