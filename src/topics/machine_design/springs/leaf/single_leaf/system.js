/**
 * src/topics/machine_design/springs/leaf/single_leaf/system.js
 */
import { SINGLE_LEAF_VARS_DB } from "./schema.js";
import { getLeafBaseParams } from "../leaf_common.js";

export function createSingleLeafSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";
  const { E, eUnit, eBase, lUnit, fUnit, sUnit, kUnit, enUnit, buildVarNames, pickRandom } = getLeafBaseParams(isUS);

  const b = isUS ? pickRandom([3.0, 4.0]) : pickRandom([50, 60, 75]);
  const t = isUS ? pickRandom([0.75, 1.0]) : pickRandom([8, 10, 12]);
  const L = isUS ? pickRandom([18, 24]) : pickRandom([400, 500]);
  const F = isUS ? pickRandom([600, 800, 1000]) : pickRandom([500, 600, 800]);

  const M = F * L;
  const c = t / 2;
  const I = (b * (t ** 3)) / 12;
  const S = (M * c) / I;
  const delta = (4 * F * (L ** 3)) / (eBase * b * (t ** 3));
  const k = F / delta;
  const SPE = isUS ? 0.5 * F * delta : 0.5 * F * (delta / 1000);

  return {
    sys, F, L, b, t, M, c, I, S, E, delta, k, SPE,
    _names: buildVarNames(SINGLE_LEAF_VARS_DB),
    _u: {
      F: fUnit, L: lUnit, b: lUnit, t: lUnit, c: lUnit, delta: lUnit,
      M: isUS ? "lb-in" : "N-mm", I: isUS ? "in^4" : "mm^4",
      S: sUnit, E: eUnit, k: kUnit, SPE: enUnit
    }
  };
}
