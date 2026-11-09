/**
 * src/topics/powerplant_design/diesel_cycle/system.js
 * Ground truth generator for ideal air-standard Diesel cycle.
 */

import { DIESEL_CYCLE_VARS_DB } from "./schema.js";

export function createDieselCycleSystem({ sys = "SI" } = {}) {
  const r_k = [14.0, 16.0, 18.0, 20.0, 22.0][Math.floor(Math.random() * 5)];
  const r_c = [1.5, 2.0, 2.5, 3.0][Math.floor(Math.random() * 4)];
  const r_e = r_k / r_c;
  const k = 1.4;
  const c_p = 1.0062;
  const c_v = 0.7186;
  const T_1 = 300.0; // Standard 300 K intake
  const T_2 = T_1 * Math.pow(r_k, k - 1);
  const T_3 = T_2 * r_c;
  const T_4 = T_3 / Math.pow(r_e, k - 1);
  const Q_A = c_p * (T_3 - T_2);
  const Q_R = c_v * (T_4 - T_1);
  const W_net = Q_A - Q_R;
  const e_th = W_net / Q_A;

  const _names = {};
  for (const [k_var, meta] of Object.entries(DIESEL_CYCLE_VARS_DB)) {
    _names[k_var] = meta.aliases?.[0] || meta.name;
  }
  const _u = {
    r_k: "dimless", r_c: "dimless", r_e: "dimless", k: "dimless",
    T_1: "K", T_2: "K", T_3: "K", T_4: "K",
    c_p: "kJ/kg-K", c_v: "kJ/kg-K",
    Q_A: "kJ/kg", Q_R: "kJ/kg", W_net: "kJ/kg", e_th: "dimless"
  };
  return { sys: "SI", r_k, r_c, r_e, k, T_1, T_2, T_3, T_4, c_p, c_v, Q_A, Q_R, W_net, e_th, _names, _u };
}