/**
 * src/topics/machine_design/springs/torsion/rectangular_spiral/system.js
 */
import { RECT_SPIRAL_VARS_DB } from "./schema.js";
import { buildVarNames, pickRandom, getSpringSteelModuli } from "../../common/spring_system_utils.js";

export function createRectSpiralSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";
  const { E, unit: eUnit } = getSpringSteelModuli(isUS);
  const eBase = E * 1000;

  const b = isUS ? pickRandom([0.5, 0.75]) : pickRandom([10, 12, 15]);
  const t = isUS ? pickRandom([0.1, 0.125]) : pickRandom([2, 2.5, 3]);
  const L = isUS ? pickRandom([24, 36]) : pickRandom([600, 800]);
  const L_a = isUS ? pickRandom([2.0, 2.5]) : pickRandom([40, 50]);
  const F = isUS ? pickRandom([10, 12, 16]) : pickRandom([30, 40, 50]);

  const M = F * L_a;
  const delta = (12 * F * L * (L_a ** 2)) / (eBase * b * (t ** 3));
  const k = F / delta;
  const SPE = isUS ? 0.5 * F * delta : 0.5 * F * (delta / 1000);

  const lUnit = isUS ? "in" : "mm";
  const fUnit = isUS ? "lb" : "N";
  const kUnit = isUS ? "lb/in" : "N/mm";
  const enUnit = isUS ? "in-lb" : "J";

  return {
    sys, b, t, L, L_a, F, M, E, delta, k, SPE,
    _names: buildVarNames(RECT_SPIRAL_VARS_DB),
    _u: {
      b: lUnit, t: lUnit, L: lUnit, L_a: lUnit, delta: lUnit,
      F: fUnit, M: isUS ? "lb-in" : "N-mm", E: eUnit, k: kUnit, SPE: enUnit
    }
  };
}
