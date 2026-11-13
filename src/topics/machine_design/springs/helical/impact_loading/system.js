/**
 * src/topics/machine_design/springs/helical/impact_loading/system.js
 */
import { IMPACT_VARS_DB } from "./schema.js";
import { buildVarNames, pickRandom } from "../../common/spring_system_utils.js";

export function createImpactSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";
  const k = isUS ? pickRandom([80, 120, 160]) : pickRandom([10, 15, 20]);
  const W_drop = isUS ? pickRandom([40, 60, 80]) : pickRandom([100, 150, 200]);
  const delta_st = W_drop / k;

  // Choose h = m * delta_st so (1 + 2*m) is a clean square: 1.5->I_f=3, 4->4, 12->6
  const mult = pickRandom([1.5, 4, 12]);
  const h = mult * delta_st;
  const I_f = 1 + Math.sqrt(1 + (2 * h) / delta_st);
  const delta = I_f * delta_st;
  const F = I_f * W_drop;
  const SPE = isUS ? 0.5 * F * delta : 0.5 * F * (delta / 1000);

  const lUnit = isUS ? "in" : "mm";
  const fUnit = isUS ? "lb" : "N";
  const kUnit = isUS ? "lb/in" : "N/mm";
  const eUnit = isUS ? "in-lb" : "J";

  return {
    sys, W_drop, h, delta_st, I_f, F, delta, k, SPE,
    _names: buildVarNames(IMPACT_VARS_DB),
    _u: { W_drop: fUnit, F: fUnit, h: lUnit, delta_st: lUnit, delta: lUnit, k: kUnit, SPE: eUnit, I_f: "dimless" }
  };
}
