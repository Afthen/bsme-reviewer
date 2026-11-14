/**
 * src/topics/machine_design/springs/torsion/rectangular_spiral/schema.js
 */
import { SPRING_BASE_VARS } from "../../common/spring_base_schema.js";

export const RECT_SPIRAL_VARS_DB = Object.freeze({
  b: { ...SPRING_BASE_VARS.b, name: "Strip Width", aliases: ["Strip Width", "Rectangular Strip Width"] },
  t: { ...SPRING_BASE_VARS.t, name: "Strip Thickness", aliases: ["Strip Thickness", "Rectangular Strip Thickness"] },
  L: { ...SPRING_BASE_VARS.L, name: "Spiral Strip Length", aliases: ["Spiral Strip Length", "Total Strip Length"] },
  L_a: SPRING_BASE_VARS.L_a,
  F: SPRING_BASE_VARS.F,
  M: SPRING_BASE_VARS.M,
  E: SPRING_BASE_VARS.E,
  delta: { ...SPRING_BASE_VARS.delta, name: "Arm Tip Deflection", aliases: ["Arm Tip Deflection", "Spiral Deflection"] },
  k: SPRING_BASE_VARS.k,
  SPE: SPRING_BASE_VARS.SPE
});
