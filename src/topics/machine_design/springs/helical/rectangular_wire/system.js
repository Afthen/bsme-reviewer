/**
 * src/topics/machine_design/springs/helical/rectangular_wire/system.js
 */
import { RECT_WIRE_VARS_DB } from "./schema.js";
import { buildVarNames, pickRandom, getSpringSteelModuli } from "../../common/spring_system_utils.js";

export function createRectWireSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";
  const { G, unit: gUnit } = getSpringSteelModuli(isUS);
  const gBase = G * 1000;

  const t = isUS ? pickRandom([0.25, 0.375, 0.5]) : pickRandom([5, 6, 8]);
  const b = 2 * t;
  const C = pickRandom([8, 10, 12]);
  const D_m = C * t;
  const n = pickRandom([8, 10, 12]);
  const L = Math.PI * D_m * n;

  const K_w = (4 * C - 1) / (4 * C - 4) + 0.615 / C;
  const K_b = (4 * C + 2) / (4 * C - 3);
  const K_s = 1 + 1 / (2 * C);
  const K_c = K_w / K_s;

  const F = isUS ? pickRandom([250, 350, 500]) : pickRandom([600, 900, 1200]);
  const S = (K_w * F * D_m * (3 * b + 1.8 * t)) / (2 * (b ** 2) * (t ** 2));
  const delta = (2.5 * F * (D_m ** 3) * n) / (gBase * (t ** 3) * (b - 0.56 * t));
  const k = F / delta;
  const SPE = isUS ? 0.5 * F * delta : 0.5 * F * (delta / 1000);

  const lUnit = isUS ? "in" : "mm";
  const fUnit = isUS ? "lb" : "N";
  const sUnit = isUS ? "psi" : "MPa";
  const kUnit = isUS ? "lb/in" : "N/mm";
  const eUnit = isUS ? "in-lb" : "J";

  return {
    sys, D_m, b, t, C, n, L, K_w, K_b, K_s, K_c, S, F, delta, G, k, SPE,
    _names: buildVarNames(RECT_WIRE_VARS_DB),
    _u: {
      D_m: lUnit, b: lUnit, t: lUnit, L: lUnit, delta: lUnit,
      C: "dimless", n: "dimless", K_w: "dimless", K_b: "dimless", K_s: "dimless", K_c: "dimless",
      S: sUnit, F: fUnit, G: gUnit, k: kUnit, SPE: eUnit
    }
  };
}
