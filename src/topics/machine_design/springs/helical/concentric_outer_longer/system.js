import { createConcentricSystem } from "../../common/concentric_helper.js";
import { CONCENTRIC_OUTER_VARS_DB } from "./schema.js";
export function createConcentricOuterSystem({ sys = "SI" } = {}) {
  return createConcentricSystem({ sys, mode: "outer_longer", varsDb: CONCENTRIC_OUTER_VARS_DB });
}
