/**
 * src/topics/machine_design/springs/leaf/uniform_strength/system.js
 */
import { UNIFORM_LEAF_VARS_DB } from "./schema.js";
import { getLeafBaseParams } from "../leaf_common.js";

export function createUniformLeafSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";
  const { E, eUnit, eBase, lUnit, fUnit, sUnit, kUnit, enUnit, buildVarNames, pickRandom } = getLeafBaseParams(isUS);

  const b = isUS ? pickRandom([2.5, 3.0, 4.0]) : pickRandom([50, 60, 80]);
  const t = isUS ? pickRandom([0.5, 0.75]) : pickRandom([8, 10, 12]);
  const L = isUS ? pickRandom([18, 20, 24]) : pickRandom([400, 500]);
  const F = isUS ? pickRandom([500, 600, 800]) : pickRandom([500, 600, 800]);

  const S = (6 * F * L) / (b * (t ** 2));
  const delta = (S * (L ** 2)) / (t * eBase);
  const k = F / delta;
  const SPE = isUS ? 0.5 * F * delta : 0.5 * F * (delta / 1000);

  return {
    sys, F, L, b, t, S, E, delta, k, SPE,
    _names: buildVarNames(UNIFORM_LEAF_VARS_DB),
    _u: { F: fUnit, L: lUnit, b: lUnit, t: lUnit, delta: lUnit, S: sUnit, E: eUnit, k: kUnit, SPE: enUnit }
  };
}
