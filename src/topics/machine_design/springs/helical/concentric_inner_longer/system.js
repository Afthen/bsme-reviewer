import { createConcentricSystem } from "../../common/concentric_helper.js";
import { CONCENTRIC_INNER_VARS_DB } from "./schema.js";
export function createConcentricInnerSystem({ sys = "SI" } = {}) {
  return createConcentricSystem({ sys, mode: "inner_longer", varsDb: CONCENTRIC_INNER_VARS_DB });
}
