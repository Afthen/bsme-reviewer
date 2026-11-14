/**
 * src/topics/machine_design/springs/helical/dynamics/schema.js
 */
import { DIMENSIONS } from "../../../../../core/dimensions.js";
import { SPRING_BASE_VARS } from "../../common/spring_base_schema.js";

export const DYNAMICS_VARS_DB = Object.freeze({
  T: SPRING_BASE_VARS.T,
  f: SPRING_BASE_VARS.f,
  m: { name: "Oscillating Mass", symbol: "m", dimension: DIMENSIONS.MASS, unit: "kg", aliases: ["Oscillating Mass", "Attached Mass", "Body Mass"] },
  k: SPRING_BASE_VARS.k,
  L: { ...SPRING_BASE_VARS.L, name: "Pendulum Length", aliases: ["Pendulum Length", "Cord Length", "Simple Pendulum Length"] },
  g: SPRING_BASE_VARS.g
});
