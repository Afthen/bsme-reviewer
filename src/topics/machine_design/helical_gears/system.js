/**
 * src/topics/machine_design/helical_gears/system.js
 * Clean ground truth helical gear system generator (SI and US Imperial).
 * Populates transverse and normal module across both unit branches.
 */

import { HELICAL_VARS_DB } from "./schema.js";

const Y_TABLE = Object.freeze({
  15: 0.245, 17: 0.264, 19: 0.277, 21: 0.289, 23: 0.300
});

export function createGroundTruthHelicalSystem() {
  const isSI = Math.random() < 0.5;
  const sys = isSI ? "SI" : "US";

  const psi = [15, 20, 25, 30][Math.floor(Math.random() * 4)];
  const phi_n = [14.5, 20][Math.floor(Math.random() * 2)];
  const psiRad = (psi * Math.PI) / 180;
  const phinRad = (phi_n * Math.PI) / 180;

  const tanPhi = Math.tan(phinRad) / Math.cos(psiRad);
  const phi = (Math.atan(tanPhi) * 180) / Math.PI;

  const T_1 = [15, 17, 19, 21, 23][Math.floor(Math.random() * 5)];
  const VR_target = [2, 2.5, 3, 4][Math.floor(Math.random() * 4)];
  const T_2 = Math.round(T_1 * VR_target);
  const VR = T_2 / T_1;
  const T_v = T_1 / Math.pow(Math.cos(psiRad), 3);
  const Y = Y_TABLE[T_1] || 0.280;
  const k_f = 1.45;
  const Q = (2 * T_2) / (T_1 + T_2);

  const _names = {};
  for (const [k, meta] of Object.entries(HELICAL_VARS_DB)) {
    _names[k] = meta.aliases?.[0] || meta.name;
  }

  let S = {};

  if (isSI) {
    const m_n = [2, 2.5, 3, 4, 5][Math.floor(Math.random() * 5)];
    const m = m_n / Math.cos(psiRad);
    const P_cn = Math.PI * m_n;
    const P_c = P_cn / Math.cos(psiRad);
    const P_a = P_c / Math.tan(psiRad);
    const P_d = 25.4 / m;
    const P_dn = 25.4 / m_n;

    const D_P1 = T_1 * m;
    const D_P2 = T_2 * m;
    const C = (D_P1 + D_P2) / 2;
    const b = 10 * m_n;

    const L_lead = (Math.PI * D_P1) / Math.tan(psiRad);
    const m_F = b / P_a;

    const n_1 = [900, 1150, 1200, 1750, 1800][Math.floor(Math.random() * 5)];
    const n_2 = n_1 / VR;
    const V_m = (Math.PI * (D_P1 / 1000) * n_1) / 60;

    const P = [10, 15, 25, 40][Math.floor(Math.random() * 4)];
    const W_t = (1000 * P) / V_m;
    const M_t = (W_t * (D_P1 / 1000)) / 2;
    const F_a = W_t * Math.tan(psiRad);
    const W_r = W_t * tanPhi;
    const W = Math.sqrt(W_t ** 2 + W_r ** 2 + F_a ** 2);

    const s = 140;
    const F_s = (s * b * Y) / (k_f * (P_dn / 25.4));
    const C_d = 400;
    const k_buck = 21;
    const F_D = W_t + (k_buck * V_m * (W_t + b * C_d * (Math.cos(psiRad) ** 2)) * Math.cos(psiRad)) /
                      (k_buck * V_m + Math.sqrt(W_t + b * C_d * (Math.cos(psiRad) ** 2)));
    const K_w = 0.55;
    const F_w = (D_P1 * b * Q * K_w) / (Math.cos(psiRad) ** 2);

    const _u = {
      D_P1: "mm", D_P2: "mm", C: "mm", P_c: "mm", P_cn: "mm", P_a: "mm", L_lead: "mm", b: "mm",
      m: "mm", m_n: "mm", V_m: "m/s", P: "kW", M_t: "N-m", W_t: "N", W_r: "N", F_a: "N", W: "N",
      s: "MPa", F_s: "N", F_D: "N", C_d: "N", F_w: "N", K_w: "MPa",
      phi: "°", phi_n: "°", psi: "°", n_1: "rpm", n_2: "rpm", P_d: "teeth/in", P_dn: "teeth/in",
      T_1: "teeth", T_2: "teeth", T: "teeth", T_v: "teeth"
    };

    S = {
      sys, psi, phi_n, phi, T_1, T_2, T_v, VR, n_1, n_2, D_P1, D_P2, C,
      m, m_n, P_d, P_dn, P_c, P_cn, P_a, L_lead, m_F, b, V_m, P, W_t, M_t, F_a, W_r, W,
      s, Y, k_f, F_s, F_D, C_d, Q, K_w, F_w, _u, _names
    };
  } else {
    const P_dn = [8, 10, 12, 16][Math.floor(Math.random() * 4)];
    const P_d = P_dn * Math.cos(psiRad);
    const m_n = 25.4 / P_dn;
    const m = 25.4 / P_d;
    const P_c = Math.PI / P_d;
    const P_cn = P_c * Math.cos(psiRad);
    const P_a = P_c / Math.tan(psiRad);

    const D_P1 = T_1 / P_d;
    const D_P2 = T_2 / P_d;
    const C = (D_P1 + D_P2) / 2;
    const b = 2.0;

    const L_lead = (Math.PI * D_P1) / Math.tan(psiRad);
    const m_F = b / P_a;

    const n_1 = [900, 1150, 1200, 1750, 1800][Math.floor(Math.random() * 5)];
    const n_2 = n_1 / VR;
    const V_m = Math.PI * (D_P1 / 12) * n_1;

    const P = [10, 20, 30, 50][Math.floor(Math.random() * 4)];
    const W_t = (33000 * P) / V_m;
    const M_t = (W_t * D_P1) / 2;
    const F_a = W_t * Math.tan(psiRad);
    const W_r = W_t * tanPhi;
    const W = Math.sqrt(W_t ** 2 + W_r ** 2 + F_a ** 2);

    const s = 25000;
    const F_s = (s * b * Y) / (k_f * P_dn);
    const C_d = 400;
    const k_buck = 0.05;
    const F_D = W_t + (k_buck * V_m * (W_t + b * C_d * (Math.cos(psiRad) ** 2)) * Math.cos(psiRad)) /
                      (k_buck * V_m + Math.sqrt(W_t + b * C_d * (Math.cos(psiRad) ** 2)));
    const K_w = 80;
    const F_w = (D_P1 * b * Q * K_w) / (Math.cos(psiRad) ** 2);

    const _u = {
      D_P1: "in", D_P2: "in", C: "in", P_c: "in", P_cn: "in", P_a: "in", L_lead: "in", b: "in",
      m: "mm", m_n: "mm", P_d: "teeth/in", P_dn: "teeth/in", V_m: "ft/min", P: "hp", M_t: "lb-in",
      W_t: "lb", W_r: "lb", F_a: "lb", W: "lb", s: "psi", F_s: "lb", F_D: "lb", C_d: "lb", F_w: "lb", K_w: "psi",
      phi: "°", phi_n: "°", psi: "°", n_1: "rpm", n_2: "rpm",
      T_1: "teeth", T_2: "teeth", T: "teeth", T_v: "teeth"
    };

    S = {
      sys, psi, phi_n, phi, T_1, T_2, T_v, VR, n_1, n_2, D_P1, D_P2, C,
      m, m_n, P_d, P_dn, P_c, P_cn, P_a, L_lead, m_F, b, V_m, P, W_t, M_t, F_a, W_r, W,
      s, Y, k_f, F_s, F_D, C_d, Q, K_w, F_w, _u, _names
    };
  }

  return S;
}
