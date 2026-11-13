/**
 * src/topics/machine_design/springs/helical/square_wire/system.js
 */
import { SQUARE_WIRE_VARS_DB } from "./schema.js";
import { buildVarNames, pickRandom, getSpringSteelModuli } from "../../common/spring_system_utils.js";

export function createSquareWireSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";
  const { G, unit: gUnit } = getSpringSteelModuli(isUS);
  const gBase = G * 1000;

  const b = isUS ? pickRandom([0.375, 0.5, 0.625]) : pickRandom([6, 8, 10]);
  const C = pickRandom([6, 8, 10]);
  const D_m = C * b;
  const n = pickRandom([8, 10, 12]);
  const L = Math.PI * D_m * n;

  const K_w = (4 * C - 1) / (4 * C - 4) + 0.615 / C;
  const K_b = (4 * C + 2) / (4 * C - 3);
  const K_s = 1 + 1 / (2 * C);
  const K_c = K_w / K_s;

  const F = isUS ? pickRandom([200, 250, 350]) : pickRandom([500, 750, 1000]);
  const S = (2.4 * K_w * F * D_m) / (b ** 3);
  const delta = (5.575 * F * (D_m ** 3) * n) / (gBase * (b ** 4));
  const k = F / delta;
  const SPE = isUS ? 0.5 * F * delta : 0.5 * F * (delta / 1000);

  const lUnit = isUS ? "in" : "mm";
  const fUnit = isUS ? "lb" : "N";
  const sUnit = isUS ? "psi" : "MPa";
  const kUnit = isUS ? "lb/in" : "N/mm";
  const eUnit = isUS ? "in-lb" : "J";

  return {
    sys, D_m, b, C, n, L, K_w, K_b, K_s, K_c, S, F, delta, G, k, SPE,
    _names: buildVarNames(SQUARE_WIRE_VARS_DB),
    _u: {
      D_m: lUnit, b: lUnit, L: lUnit, delta: lUnit,
      C: "dimless", n: "dimless", K_w: "dimless", K_b: "dimless", K_s: "dimless", K_c: "dimless",
      S: sUnit, F: fUnit, G: gUnit, k: kUnit, SPE: eUnit
    }
  };
}
