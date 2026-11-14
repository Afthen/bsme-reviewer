/**
 * src/topics/machine_design/springs/torsion/round_wire/schema.js
 */
import { DIMENSIONS } from "../../../../../core/dimensions.js";
import { SPRING_BASE_VARS } from "../../common/spring_base_schema.js";

export const TORSION_ROUND_VARS_DB = Object.freeze({
  D_m: SPRING_BASE_VARS.D_m,
  d_w: SPRING_BASE_VARS.d_w,
  C: SPRING_BASE_VARS.C,
  n: SPRING_BASE_VARS.n,
  L: SPRING_BASE_VARS.L,
  L_a: SPRING_BASE_VARS.L_a,
  F: SPRING_BASE_VARS.F,
  M: SPRING_BASE_VARS.M,
  k_1: { name: "Bending Stress Concentration Factor", symbol: "k_1", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless", aliases: ["Bending Stress Concentration Factor", "Inner-Fiber Curvature Factor", "k_1"] },
  S: { ...SPRING_BASE_VARS.S, name: "Bending Stress", aliases: ["Bending Stress", "Torsion Wire Bending Stress"] },
  E: SPRING_BASE_VARS.E,
  delta: { ...SPRING_BASE_VARS.delta, name: "Arm Tip Deflection", aliases: ["Arm Tip Deflection", "Tangential Deflection"] },
  k: SPRING_BASE_VARS.k,
  SPE: SPRING_BASE_VARS.SPE
});
