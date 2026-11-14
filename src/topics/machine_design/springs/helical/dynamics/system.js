/**
 * src/topics/machine_design/springs/helical/dynamics/system.js
 */
import { DYNAMICS_VARS_DB } from "./schema.js";
import { buildVarNames, pickRandom } from "../../common/spring_system_utils.js";

export function createDynamicsSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";
  const _names = buildVarNames(DYNAMICS_VARS_DB);

  if (isUS) {
    const m = pickRandom([100, 150, 200]); // lbm
    const k = pickRandom([25, 40, 50]);    // lbf/in
    const g = 32.2;                        // ft/s^2
    const mKg = m * 0.45359237;
    const kNpm = k * (4.4482216 / 0.0254);
    const gMps2 = g * 0.3048;
    const T = 2 * Math.PI * Math.sqrt(mKg / kNpm);
    const f = 1 / T;
    const L = (gMps2 * (mKg / kNpm)) / 0.3048; // ft

    return {
      sys, T, f, m, k, L, g,
      _names,
      _u: { T: "s", f: "Hz", m: "lb", k: "lb/in", L: "ft", g: "ft/s^2" }
    };
  }

  const m = pickRandom([20, 40, 60]);       // kg
  const k = pickRandom([1000, 2000, 4000]); // N/m
  const g = 9.81;                           // m/s^2
  const T = 2 * Math.PI * Math.sqrt(m / k);
  const f = 1 / T;
  const L = g * (m / k);                    // m

  return {
    sys, T, f, m, k, L, g,
    _names,
    _u: { T: "s", f: "Hz", m: "kg", k: "N/m", L: "m", g: "m/s^2" }
  };
}
