/**
 * src/topics/machine_design/springs/helical/round_wire/system.js
 */
import { HELICAL_ROUND_VARS_DB } from "./schema.js";
import { buildVarNames, pickRandom, getSpringSteelModuli } from "../../common/spring_system_utils.js";

const END_TYPES = Object.freeze([
  { n_dead: 0, k_end: 0 }, // Ground
  { n_dead: 0, k_end: 1 }, // Plain
  { n_dead: 2, k_end: 2 }, // Squared & Ground
  { n_dead: 2, k_end: 3 }  // Squared
]);

export function createHelicalRoundSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";
  const { G, unit: gUnit } = getSpringSteelModuli(isUS);
  const gBase = G * 1000;

  const d_w = isUS ? pickRandom([0.375, 0.5, 0.625]) : pickRandom([6, 8, 10]);
  const C = pickRandom([6, 8, 10]);
  const D_m = C * d_w;
  const D_o = D_m + d_w;
  const D_i = D_m - d_w;
  const R_m = D_m / 2;

  const n = pickRandom([8, 10, 12]);
  const p = 2.5 * d_w;
  const alpha = (Math.atan(p / (Math.PI * D_m)) * 180) / Math.PI;
  const L = Math.PI * D_m * n;

  const K_w = (4 * C - 1) / (4 * C - 4) + 0.615 / C;
  const K_b = (4 * C + 2) / (4 * C - 3);
  const K_s = 1 + 1 / (2 * C);
  const K_c = K_w / K_s;

  const { n_dead, k_end } = pickRandom(END_TYPES);
  const n_a = n + n_dead;
  const SL = (n + k_end) * d_w;
  const FL = n * p + k_end * d_w;
  const delta_solid = FL - SL;

  const k = (gBase * d_w) / (8 * (C ** 3) * n);
  const delta = 0.4 * delta_solid;
  const F = k * delta;
  const OL = FL - delta;
  const S_f = (8 * K_w * F * D_m) / (Math.PI * (d_w ** 3));
  const SPE = isUS ? 0.5 * F * delta : 0.5 * F * (delta / 1000);

  const F_1 = 0.4 * F;
  const F_2 = 1.4 * F;
  const delta_1 = F_1 / k;
  const delta_2 = F_2 / k;
  const dF = F_2 - F_1;
  const ddelta = delta_2 - delta_1;
  const OL_1 = FL - delta_1;
  const OL_2 = FL - delta_2;

  const lUnit = isUS ? "in" : "mm";
  const fUnit = isUS ? "lb" : "N";
  const sUnit = isUS ? "psi" : "MPa";
  const kUnit = isUS ? "lb/in" : "N/mm";
  const eUnit = isUS ? "in-lb" : "J";
  const _names = buildVarNames(HELICAL_ROUND_VARS_DB);

  const _u = {
    D_m: lUnit, D_o: lUnit, D_i: lUnit, R_m: lUnit, d_w: lUnit, p: lUnit, L: lUnit,
    delta: lUnit, SL: lUnit, FL: lUnit, OL: lUnit, delta_solid: lUnit,
    delta_1: lUnit, delta_2: lUnit, OL_1: lUnit, OL_2: lUnit, ddelta: lUnit,
    alpha: "°", C: "dimless", n: "dimless", n_a: "dimless", n_dead: "dimless", k_end: "dimless",
    K_w: "dimless", K_b: "dimless", K_s: "dimless", K_c: "dimless",
    F: fUnit, F_1: fUnit, F_2: fUnit, dF: fUnit,
    S_f: sUnit, G: gUnit, k: kUnit, SPE: eUnit
  };

  return {
    sys, D_m, D_o, D_i, R_m, d_w, C, p, alpha, n, L, n_a, n_dead, k_end,
    K_w, K_b, K_s, K_c, S_f, F, delta, G, SL, FL, OL, delta_solid, k, SPE,
    F_1, F_2, delta_1, delta_2, dF, ddelta, OL_1, OL_2, _names, _u
  };
}
