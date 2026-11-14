/**
 * src/topics/machine_design/springs/torsion/round_wire/system.js
 */
import { TORSION_ROUND_VARS_DB } from "./schema.js";
import { buildVarNames, pickRandom, getSpringSteelModuli } from "../../common/spring_system_utils.js";

export function createTorsionRoundSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";
  const { E, unit: eUnit } = getSpringSteelModuli(isUS);
  const eBase = E * 1000;

  const d_w = isUS ? pickRandom([0.2, 0.25, 0.375]) : pickRandom([4, 5, 6]);
  const C = pickRandom([6, 8, 10]);
  const D_m = C * d_w;
  const n = pickRandom([5, 6, 8]);
  const L = Math.PI * D_m * n;
  const L_a = isUS ? pickRandom([2.5, 3.0, 4.0]) : pickRandom([50, 60, 80]);
  const F = isUS ? pickRandom([20, 25, 35]) : pickRandom([60, 80, 100]);

  const M = F * L_a;
  const k_1 = (4 * (C ** 2) - C - 1) / (4 * C * (C - 1));
  const S = (k_1 * 32 * M) / (Math.PI * (d_w ** 3));
  const delta = (64 * F * D_m * (L_a ** 2) * n) / (eBase * (d_w ** 4));
  const k = F / delta;
  const SPE = isUS ? 0.5 * F * delta : 0.5 * F * (delta / 1000);

  const lUnit = isUS ? "in" : "mm";
  const fUnit = isUS ? "lb" : "N";
  const sUnit = isUS ? "psi" : "MPa";
  const kUnit = isUS ? "lb/in" : "N/mm";
  const enUnit = isUS ? "in-lb" : "J";

  return {
    sys, D_m, d_w, C, n, L, L_a, F, M, k_1, S, E, delta, k, SPE,
    _names: buildVarNames(TORSION_ROUND_VARS_DB),
    _u: {
      D_m: lUnit, d_w: lUnit, L: lUnit, L_a: lUnit, delta: lUnit,
      C: "dimless", n: "dimless", k_1: "dimless",
      F: fUnit, M: isUS ? "lb-in" : "N-mm", S: sUnit, E: eUnit, k: kUnit, SPE: enUnit
    }
  };
}
