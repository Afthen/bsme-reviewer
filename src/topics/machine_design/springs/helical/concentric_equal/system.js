import { createConcentricSystem } from "../../common/concentric_helper.js";
import { CONCENTRIC_EQUAL_VARS_DB } from "./schema.js";
export function createConcentricEqualSystem({ sys = "SI" } = {}) {
  return createConcentricSystem({ sys, mode: "equal", varsDb: CONCENTRIC_EQUAL_VARS_DB });
}
