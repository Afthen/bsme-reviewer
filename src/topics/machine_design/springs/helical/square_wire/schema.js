/**
 * src/topics/machine_design/springs/helical/square_wire/schema.js
 */
import { SPRING_BASE_VARS } from "../../common/spring_base_schema.js";

export const SQUARE_WIRE_VARS_DB = Object.freeze({
  D_m: SPRING_BASE_VARS.D_m,
  b: { ...SPRING_BASE_VARS.b, name: "Square Wire Side", aliases: ["Square Wire Side", "Wire Side Width"] },
  C: SPRING_BASE_VARS.C,
  n: SPRING_BASE_VARS.n,
  L: SPRING_BASE_VARS.L,
  K_w: SPRING_BASE_VARS.K_w,
  K_b: SPRING_BASE_VARS.K_b,
  K_s: SPRING_BASE_VARS.K_s,
  K_c: SPRING_BASE_VARS.K_c,
  S: SPRING_BASE_VARS.S,
  F: SPRING_BASE_VARS.F,
  delta: SPRING_BASE_VARS.delta,
  G: SPRING_BASE_VARS.G,
  k: SPRING_BASE_VARS.k,
  SPE: SPRING_BASE_VARS.SPE
});
