/**
 * src/topics/machine_design/stress/fatigue/system.js
 * Ground-truth generator for Fatigue Strength, Marin Equation & Fluctuating Stress Criteria.
 * Reference: Shigley's Mechanical Engineering Design, Ch. 6 (Machined steel bar: a_SI=4.51, a_US=2.70, b=-0.265).
 */

import { FATIGUE_VARS_DB } from "./schema.js";

export function createFatigueSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let d, S_ut, S_y, K_t, q, K_f, sigma_a0, sigma_m0, sigma_a, sigma_m;
  let sigma_max, sigma_min, d_sigma, R_s, A_s, S_ep, a_s, b_s;
  let k_a, k_b, k_c, k_d, k_e, k_f_misc, S_e, f_fat, a_f, b_f, N_c, S_f;
  let n_G, n_S, n_AE, n_Gb, n_y, _u;

  K_t = 1.8;
  q = 0.85;
  K_f = 1 + q * (K_t - 1); // 1.68

  b_s = -0.265;
  k_c = 1.0; // bending
  k_d = 0.97; // moderate elevated temp
  k_e = 0.814; // 99% reliability
  k_f_misc = 0.95; // miscellaneous factor
  f_fat = 0.85;
  N_c = 100000;

  if (isUS) {
    d = 1.0; // in
    S_ut = 100.0; // ksi
    S_y = 80.0; // ksi
    sigma_a0 = 8.0; // ksi
    sigma_m0 = 11.0; // ksi
    a_s = 2.70; // machined steel (ksi)
    k_a = a_s * Math.pow(S_ut, b_s);
    k_b = 0.879 * Math.pow(d, -0.107);

    _u = {
      S_ut: "ksi", S_y: "ksi", S_e: "ksi", sigma_a: "ksi", sigma_m: "ksi",
      d: "in", K_t: "dimless", q: "dimless", K_f: "dimless",
      sigma_a0: "ksi", sigma_m0: "ksi", sigma_max: "ksi", sigma_min: "ksi", d_sigma: "ksi",
      R_s: "dimless", A_s: "dimless", S_ep: "ksi", a_s: "dimless", b_s: "dimless",
      k_a: "dimless", k_b: "dimless", k_c: "dimless", k_d: "dimless", k_e: "dimless", k_f_misc: "dimless",
      f_fat: "dimless", a_f: "ksi", b_f: "dimless", N_c: "dimless", S_f: "ksi",
      n_G: "dimless", n_S: "dimless", n_AE: "dimless", n_Gb: "dimless", n_y: "dimless"
    };
  } else {
    d = 25.0; // mm
    S_ut = 700.0; // MPa
    S_y = 560.0; // MPa
    sigma_a0 = 55.0; // MPa
    sigma_m0 = 75.0; // MPa
    a_s = 4.51; // machined steel (MPa)
    k_a = a_s * Math.pow(S_ut, b_s);
    k_b = 1.24 * Math.pow(d, -0.107);

    _u = {
      S_ut: "MPa", S_y: "MPa", S_e: "MPa", sigma_a: "MPa", sigma_m: "MPa",
      d: "mm", K_t: "dimless", q: "dimless", K_f: "dimless",
      sigma_a0: "MPa", sigma_m0: "MPa", sigma_max: "MPa", sigma_min: "MPa", d_sigma: "MPa",
      R_s: "dimless", A_s: "dimless", S_ep: "MPa", a_s: "dimless", b_s: "dimless",
      k_a: "dimless", k_b: "dimless", k_c: "dimless", k_d: "dimless", k_e: "dimless", k_f_misc: "dimless",
      f_fat: "dimless", a_f: "MPa", b_f: "dimless", N_c: "dimless", S_f: "MPa",
      n_G: "dimless", n_S: "dimless", n_AE: "dimless", n_Gb: "dimless", n_y: "dimless"
    };
  }

  sigma_a = K_f * sigma_a0;
  sigma_m = K_f * sigma_m0;
  sigma_max = sigma_m + sigma_a;
  sigma_min = sigma_m - sigma_a;
  d_sigma = sigma_max - sigma_min;
  R_s = sigma_min / sigma_max;
  A_s = sigma_a / sigma_m;

  S_ep = 0.5 * S_ut;
  S_e = k_a * k_b * k_c * k_d * k_e * k_f_misc * S_ep;

  a_f = Math.pow(f_fat * S_ut, 2) / S_e;
  b_f = -Math.log((f_fat * S_ut) / S_e) / (3 * Math.log(10));
  S_f = a_f * Math.pow(N_c, b_f);

  n_G = 1 / (sigma_a / S_e + sigma_m / S_ut);
  n_S = 1 / (sigma_a / S_e + sigma_m / S_y);
  n_AE = 1 / Math.sqrt(Math.pow(sigma_a / S_e, 2) + Math.pow(sigma_m / S_y, 2));

  const Ag = sigma_a / S_e;
  const Bg = Math.pow(sigma_m / S_ut, 2);
  n_Gb = (-Ag + Math.sqrt(Ag * Ag + 4 * Bg)) / (2 * Bg);
  n_y = S_y / (sigma_a + sigma_m);

  const _names = {};
  for (const [key, meta] of Object.entries(FATIGUE_VARS_DB)) {
    _names[key] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    S_ut, S_y, S_e, sigma_a, sigma_m, d, K_t, q, K_f,
    sigma_a0, sigma_m0, sigma_max, sigma_min, d_sigma, R_s, A_s,
    S_ep, a_s, b_s, k_a, k_b, k_c, k_d, k_e, k_f_misc,
    f_fat, a_f, b_f, N_c, S_f,
    n_G, n_S, n_AE, n_Gb, n_y,
    _names, _u
  };
}
