/**
 * src/topics/machine_design/springs/leaf/multi_leaf/system.js
 */
import { MULTI_LEAF_VARS_DB } from "./schema.js";
import { getLeafBaseParams } from "../leaf_common.js";

export function createMultiLeafSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";
  const { E, eUnit, eBase, lUnit, fUnit, sUnit, kUnit, enUnit, buildVarNames, pickRandom } = getLeafBaseParams(isUS);

  const b = isUS ? pickRandom([2.5, 3.0, 3.5]) : pickRandom([50, 60, 75]);
  const t = isUS ? pickRandom([0.375, 0.5]) : pickRandom([6, 8, 10]);
  const L = isUS ? pickRandom([20, 24]) : pickRandom([500, 600]);
  const n_g = pickRandom([4, 6, 8]);
  const n_f = pickRandom([1, 2, 3]);
  const F = isUS ? pickRandom([800, 1000, 1200]) : pickRandom([2000, 2400, 3000]);

  const S = (18 * F * L) / (b * (t ** 2) * (2 * n_g + 3 * n_f));
  const delta = (12 * F * (L ** 3)) / (eBase * b * (t ** 3) * (2 * n_g + 3 * n_f));
  const k = F / delta;
  const SPE = isUS ? 0.5 * F * delta : 0.5 * F * (delta / 1000);

  return {
    sys, F, L, b, t, n_g, n_f, S, E, delta, k, SPE,
    _names: buildVarNames(MULTI_LEAF_VARS_DB),
    _u: {
      F: fUnit, L: lUnit, b: lUnit, t: lUnit, delta: lUnit,
      n_g: "dimless", n_f: "dimless", S: sUnit, E: eUnit, k: kUnit, SPE: enUnit
    }
  };
}
