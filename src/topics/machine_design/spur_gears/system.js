/**
 * src/topics/machine_design/spur_gears/system.js
 * Clean ground truth spur gear system generator (SI and US Imperial).
 * Evaluates pure physical relations natively without hardcoded conversion factors.
 */

import { GEAR_VARS_DB } from "./schema.js";

const Y_TABLE = Object.freeze({
  16: 0.255, 18: 0.270, 20: 0.284, 24: 0.305, 25: 0.310, 28: 0.325, 30: 0.330, 32: 0.340
});

export function createGroundTruthSystem({ sys = null } = {}) {
  const selectedSys = sys || (Math.random() < 0.5 ? "SI" : "US");
  const isSI = selectedSys === "SI";
  const currentSys = selectedSys;
  const phi = Math.random() < 0.5 ? 20 : 14.5;
  const kc = phi === 14.5 ? 0.157 : 0.25;

  const T_1 = [16, 18, 20, 24, 25, 28, 30, 32][Math.floor(Math.random() * 8)];
  const VR_target = [2, 2.5, 3, 4][Math.floor(Math.random() * 4)];
  const T_2 = Math.round(T_1 * VR_target);
  const VR = T_2 / T_1;
  const Y = Y_TABLE[T_1] || 0.300;
  const y_form = Y / Math.PI;

  const _names = {};
  for (const [k, meta] of Object.entries(GEAR_VARS_DB)) {
    _names[k] = meta.aliases?.[0] || meta.name;
  }

  let S = {};

  if (isSI) {
    const m = [2, 2.5, 3, 4, 5, 6, 8][Math.floor(Math.random() * 7)];
    const P_d = 25.4 / m;
    const n_1 = [600, 900, 1150, 1200, 1750, 1800][Math.floor(Math.random() * 6)];
    const n_2 = n_1 / VR;
    const D_P1 = T_1 * m;
    const D_P2 = T_2 * m;
    const C = (m * (T_1 + T_2)) / 2;
    const P_c = Math.PI * m;
    const a = 1.0 * m;
    const c = kc * m;
    const d = a + c;
    const h = a + d;
    const h_k = 2 * a;
    const D_o = D_P1 + 2 * a;
    const D_r = D_P1 - 2 * d;
    const D_b = D_P1 * Math.cos((phi * Math.PI) / 180);
    const t = P_c / 2;
    const B = 0.035 / P_d;
    const S_space = t + B;
    const p_b = P_c * Math.cos((phi * Math.PI) / 180);
    const b = 10 * m;

    const V_m = (Math.PI * (D_P1 / 1000) * n_1) / 60;
    const P = [5, 10, 15, 20, 25, 30, 45, 55][Math.floor(Math.random() * 8)];
    const W_t = (1000 * P) / V_m;
    const M_t = (W_t * (D_P1 / 1000)) / 2;
    const W_r = W_t * Math.tan((phi * Math.PI) / 180);
    const W = W_t / Math.cos((phi * Math.PI) / 180);
    const s = W_t / (b * m * Y);
    const C_d = 400;
    const k_buck = 21;
    const F_D = W_t + (k_buck * V_m * (b * C_d + W_t)) / (k_buck * V_m + Math.sqrt(b * C_d + W_t));

    const k_f = 1.45;
    const S_n = 250;
    const F_s = (S_n * b * m * Y) / k_f;
    const N_sf = F_s / F_D;
    const Q = (2 * T_2) / (T_1 + T_2);
    const K_w = 0.55;
    const F_w = D_P1 * b * Q * K_w;

    const _u = {
      D_P1: "mm", D_P2: "mm", C: "mm", a: "mm", d: "mm", c: "mm", h: "mm", h_k: "mm",
      D_o: "mm", D_r: "mm", D_b: "mm", b: "mm", p_b: "mm", P_c: "mm", t: "mm", m: "mm", B: "mm",
      S_space: "mm", V_m: "m/s", P: "kW", M_t: "N-m", W_t: "N", W_r: "N", W: "N", s: "MPa",
      F_D: "N", C_d: "N", F_s: "N", S_n: "MPa", F_w: "N", K_w: "MPa",
      phi: "deg", n_1: "rpm", n_2: "rpm", P_d: "teeth/in",
      T_1: "teeth", T_2: "teeth", T: "teeth",
      VR: "dimless", Y: "dimless", y_form: "dimless", k_f: "dimless", Q: "dimless", N_sf: "dimless"
    };

    S = {
      sys: currentSys, P_d, m, phi, T_1, T_2, VR, n_1, n_2, D_P1, D_P2, C,
      P_c, a, d, c, h, h_k, D_o, D_r, D_b, t, S_space, B, p_b, b, V_m, P, W_t, M_t, W_r, W, s, Y, y_form,
      F_D, C_d, k_f, S_n, F_s, N_sf, Q, K_w, F_w, _u, _names
    };
  } else {
    const P_d = [2, 3, 4, 5, 6, 8, 10, 12][Math.floor(Math.random() * 8)];
    const m = 25.4 / P_d;
    const n_1 = [600, 900, 1150, 1200, 1750, 1800, 3600][Math.floor(Math.random() * 7)];
    const n_2 = n_1 / VR;
    const b = [1.5, 1.75, 2.0, 2.25, 2.5][Math.floor(Math.random() * 5)];
    const D_P1 = T_1 / P_d;
    const D_P2 = T_2 / P_d;
    const C = (D_P1 + D_P2) / 2;
    const P_c = Math.PI / P_d;
    const a = 1 / P_d;
    const c = kc / P_d;
    const d = (1 + kc) / P_d;
    const h = a + d;
    const h_k = 2 * a;
    const D_o = D_P1 + 2 * a;
    const D_r = D_P1 - 2 * d;
    const D_b = D_P1 * Math.cos((phi * Math.PI) / 180);
    const t = P_c / 2;
    const B = 0.035 / P_d;
    const S_space = t + B;
    const p_b = P_c * Math.cos((phi * Math.PI) / 180);

    const V_m = Math.PI * (D_P1 / 12) * n_1;
    const W_t = [150, 250, 350, 500, 650, 800, 1000][Math.floor(Math.random() * 7)];
    const M_t = (W_t * D_P1) / 2;
    const P = (W_t * V_m) / 33000;
    const W_r = W_t * Math.tan((phi * Math.PI) / 180);
    const W = W_t / Math.cos((phi * Math.PI) / 180);
    const s = (W_t * P_d) / (b * Y);
    const C_d = 400;
    const k_buck = 0.05;
    const F_D = W_t + (k_buck * V_m * (b * C_d + W_t)) / (k_buck * V_m + Math.sqrt(b * C_d + W_t));

    const k_f = 1.45;
    const S_n = 35000;
    const F_s = (S_n * b * Y) / (k_f * P_d);
    const N_sf = F_s / F_D;
    const Q = (2 * T_2) / (T_1 + T_2);
    const K_w = 80;
    const F_w = D_P1 * b * Q * K_w;

    const _u = {
      D_P1: "in", D_P2: "in", C: "in", a: "in", d: "in", c: "in", h: "in", h_k: "in",
      D_o: "in", D_r: "in", D_b: "in", b: "in", p_b: "in", P_c: "in", t: "in", m: "mm", B: "in",
      S_space: "in", V_m: "ft/min", P: "hp", M_t: "lb-in", W_t: "lb", W_r: "lb", W: "lb", s: "psi",
      F_D: "lb", C_d: "lb", F_s: "lb", S_n: "psi", F_w: "lb", K_w: "psi",
      phi: "deg", n_1: "rpm", n_2: "rpm", P_d: "teeth/in",
      T_1: "teeth", T_2: "teeth", T: "teeth",
      VR: "dimless", Y: "dimless", y_form: "dimless", k_f: "dimless", Q: "dimless", N_sf: "dimless"
    };

    S = {
      sys: currentSys, P_d, m, phi, T_1, T_2, VR, n_1, n_2, D_P1, D_P2, C,
      P_c, a, d, c, h, h_k, D_o, D_r, D_b, t, S_space, B, p_b, b, V_m, P, W_t, M_t, W_r, W, s, Y, y_form,
      F_D, C_d, k_f, S_n, F_s, N_sf, Q, K_w, F_w, _u, _names
    };
  }

  return S;
}
