/**
 * src/topics/spur_gears/system.js
 * Ground truth spur gear system generator (SI and US Imperial).
 */

import { GEAR_VARS_DB } from "./schema.js";

const Y_TABLE = Object.freeze({
  16: 0.255, 18: 0.270, 20: 0.284, 24: 0.305, 25: 0.310, 28: 0.325, 30: 0.330, 32: 0.340
});

export function createGroundTruthSystem() {
  const isSI = Math.random() < 0.5;
  const sys = isSI ? "SI" : "US";
  const phi = Math.random() < 0.5 ? 20 : 14.5;
  const kc = phi === 14.5 ? 0.157 : 0.25;

  const T_1 = [16, 18, 20, 24, 25, 28, 30, 32][Math.floor(Math.random() * 8)];
  const VR_target = [2, 2.5, 3, 4][Math.floor(Math.random() * 4)];
  const T_2 = Math.round(T_1 * VR_target);
  const VR = parseFloat((T_2 / T_1).toFixed(2));
  const Y = Y_TABLE[T_1] || 0.300;

  // Resolve randomized aliases
  const _names = {};
  for (const [k, meta] of Object.entries(GEAR_VARS_DB)) {
    if (meta.aliases && meta.aliases.length > 0) {
      _names[k] = meta.aliases[Math.floor(Math.random() * meta.aliases.length)];
    } else {
      _names[k] = meta.name;
    }
  }

  let S = {};

  if (isSI) {
    const m = [2, 2.5, 3, 4, 5, 6, 8][Math.floor(Math.random() * 7)];
    const P_d = parseFloat((25.4 / m).toFixed(2));
    const n_1 = [600, 900, 1150, 1200, 1750, 1800][Math.floor(Math.random() * 6)];
    const n_2 = parseFloat((n_1 / VR).toFixed(1));
    const D_P1 = parseFloat((T_1 * m).toFixed(1));
    const D_P2 = parseFloat((T_2 * m).toFixed(1));
    const C = parseFloat(((D_P1 + D_P2) / 2).toFixed(1));
    const P_c = parseFloat((Math.PI * m).toFixed(3));
    const a = parseFloat((1.0 * m).toFixed(3));
    const c = parseFloat((kc * m).toFixed(3));
    const d = parseFloat((a + c).toFixed(3));
    const h = parseFloat((2 * a + c).toFixed(3));
    const h_k = parseFloat((2 * a).toFixed(3));
    const D_o = parseFloat((D_P1 + 2 * a).toFixed(1));
    const D_b = parseFloat((D_P1 * Math.cos((phi * Math.PI) / 180)).toFixed(1));
    const t = parseFloat((P_c / 2).toFixed(3));
    const p_b = parseFloat((P_c * Math.cos((phi * Math.PI) / 180)).toFixed(3));
    const b = parseFloat((10 * m).toFixed(1));

    const V_m = parseFloat(((Math.PI * (D_P1 / 1000) * n_1) / 60).toFixed(2)); // m/s
    const P = [5, 10, 15, 20, 25, 30, 45, 55][Math.floor(Math.random() * 8)]; // kW
    const W_t = Math.round((1000 * P) / V_m); // N
    const M_t = parseFloat(((W_t * (D_P1 / 1000)) / 2).toFixed(2)); // N*m (exact 2 decimals)
    const W_r = parseFloat((W_t * Math.tan((phi * Math.PI) / 180)).toFixed(1)); // N
    const W = parseFloat((W_t / Math.cos((phi * Math.PI) / 180)).toFixed(1)); // N
    const s = Math.round(W_t / (b * m * Y)); // MPa

    const _u = {
      D_P1: "mm", D_P2: "mm", C: "mm", a: "mm", d: "mm", c: "mm", h: "mm", h_k: "mm",
      D_o: "mm", D_b: "mm", b: "mm", p_b: "mm", P_c: "mm", t: "mm", m: "mm",
      V_m: "m/s", P: "kW", M_t: "N-m", W_t: "N", W_r: "N", W: "N", s: "MPa",
      phi: "deg", n_1: "rpm", n_2: "rpm", P_d: "teeth/in"
    };

    S = {
      sys, P_d, m, phi, T_1, T_2, VR, n_1, n_2, D_P1, D_P2, C,
      P_c, a, d, c, h, h_k, D_o, D_b, t, p_b, b, V_m, P, W_t, M_t, W_r, W, s, Y,
      _u, _names
    };
  } else {
    const P_d = [2, 3, 4, 5, 6, 8, 10, 12][Math.floor(Math.random() * 8)];
    const m = parseFloat((25.4 / P_d).toFixed(3));
    const n_1 = [600, 900, 1150, 1200, 1750, 1800, 3600][Math.floor(Math.random() * 7)];
    const n_2 = parseFloat((n_1 / VR).toFixed(1));
    const b = [1.5, 1.75, 2.0, 2.25, 2.5][Math.floor(Math.random() * 5)];
    const D_P1 = parseFloat((T_1 / P_d).toFixed(3));
    const D_P2 = parseFloat((T_2 / P_d).toFixed(3));
    const C = parseFloat(((D_P1 + D_P2) / 2).toFixed(3));
    const P_c = parseFloat((Math.PI / P_d).toFixed(4));
    const a = parseFloat((1 / P_d).toFixed(4));
    const c = parseFloat((kc / P_d).toFixed(4));
    const d = parseFloat(((1 + kc) / P_d).toFixed(4));
    const h = parseFloat((2 * a + c).toFixed(4));
    const h_k = parseFloat((2 * a).toFixed(4));
    const D_o = parseFloat((D_P1 + 2 * a).toFixed(3));
    const D_b = parseFloat((D_P1 * Math.cos((phi * Math.PI) / 180)).toFixed(3));
    const t = parseFloat((P_c / 2).toFixed(4));
    const p_b = parseFloat((P_c * Math.cos((phi * Math.PI) / 180)).toFixed(4));

    const V_m = Math.round(Math.PI * (D_P1 / 12) * n_1); // ft/min
    const W_t = [150, 250, 350, 500, 650, 800, 1000][Math.floor(Math.random() * 7)]; // lb
    const M_t = parseFloat(((W_t * D_P1) / 2).toFixed(2)); // lb-in (exact 2 decimals)
    const P = parseFloat(((W_t * V_m) / 33000).toFixed(2)); // hp
    const W_r = parseFloat((W_t * Math.tan((phi * Math.PI) / 180)).toFixed(1)); // lb
    const W = parseFloat((W_t / Math.cos((phi * Math.PI) / 180)).toFixed(1)); // lb
    const s = Math.round((W_t * P_d) / (b * Y)); // psi

    const _u = {
      D_P1: "in", D_P2: "in", C: "in", a: "in", d: "in", c: "in", h: "in", h_k: "in",
      D_o: "in", D_b: "in", b: "in", p_b: "in", P_c: "in", t: "in", m: "mm",
      V_m: "ft/min", P: "hp", M_t: "lb-in", W_t: "lb", W_r: "lb", W: "lb", s: "psi",
      phi: "deg", n_1: "rpm", n_2: "rpm", P_d: "teeth/in"
    };

    S = {
      sys, P_d, m, phi, T_1, T_2, VR, n_1, n_2, D_P1, D_P2, C,
      P_c, a, d, c, h, h_k, D_o, D_b, t, p_b, b, V_m, P, W_t, M_t, W_r, W, s, Y,
      _u, _names
    };
  }

  return S;
}
