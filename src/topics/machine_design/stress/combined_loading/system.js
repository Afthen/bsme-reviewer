/**
 * src/topics/machine_design/stress/combined_loading/system.js
 * Ground-truth generator for Combined Axial, Eccentric Bending & Torsion Loading.
 * Reference: Hibbeler, Mechanics of Materials, Ch. 8; Shigley's MED, Sec. 3-12.
 */

import { COMBINED_LOADING_VARS_DB } from "./schema.js";

export function createCombinedLoadingSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let d, A, c, I, Z, J, Z_p, P, e_ecc, M, V, T;
  let sigma_a, sigma_b, sigma_x, sigma_opp, tau_t, tau_v;
  let sigma_avg, tau_max, sigma_1, sigma_2, sigma_vm, S_y, n_DE, n_MSS, _u;

  if (isUS) {
    d = 1.5; // in
    P = 10.0; // kip
    e_ecc = 1.2; // in
    M = P * e_ecc; // 12 kip-in
    V = 2.5; // kip
    T = 8.0; // kip-in
    S_y = 48.0; // ksi

    A = (Math.PI * d * d) / 4; // in^2
    c = d / 2; // in
    I = (Math.PI * Math.pow(d, 4)) / 64; // in^4
    Z = I / c; // in^3
    J = (Math.PI * Math.pow(d, 4)) / 32; // in^4
    Z_p = (Math.PI * Math.pow(d, 3)) / 16; // in^3

    sigma_a = P / A; // ksi
    sigma_b = M / Z; // ksi
    sigma_x = sigma_a + sigma_b; // ksi
    sigma_opp = sigma_a - sigma_b; // ksi
    tau_t = T / Z_p; // ksi
    tau_v = (4 * V) / (3 * A); // ksi

    sigma_avg = sigma_x / 2;
    tau_max = Math.sqrt(Math.pow(sigma_x / 2, 2) + Math.pow(tau_t, 2));
    sigma_1 = sigma_avg + tau_max;
    sigma_2 = sigma_avg - tau_max;
    sigma_vm = Math.sqrt(Math.pow(sigma_x, 2) + 3 * Math.pow(tau_t, 2));
    n_DE = S_y / sigma_vm;
    n_MSS = S_y / (2 * tau_max);

    _u = {
      d: "in", A: "in^2", c: "in", I: "in^4", Z: "in^3", J: "in^4", Z_p: "in^3",
      P: "kip", e_ecc: "in", M: "lb_f-in", V: "kip", T: "lb_f-in",
      sigma_a: "ksi", sigma_b: "ksi", sigma_x: "ksi", sigma_opp: "ksi",
      tau_t: "ksi", tau_v: "ksi", sigma_avg: "ksi", tau_max: "ksi",
      sigma_1: "ksi", sigma_2: "ksi", sigma_vm: "ksi", S_y: "ksi",
      n_DE: "dimless", n_MSS: "dimless"
    };
    // Keep M and T in lb_f-in (consistent with _u) while retaining exact values
    M = M * 1000;
    T = T * 1000;
  } else {
    d = 40.0; // mm
    P = 45.0; // kN
    e_ecc = 30.0; // mm
    M = P * e_ecc; // 1350 N-m (kN * mm = N-m)
    V = 12.0; // kN
    T = 900.0; // N-m
    S_y = 320.0; // MPa

    A = (Math.PI * d * d) / 4; // mm^2
    c = d / 2; // mm
    I = (Math.PI * Math.pow(d, 4)) / 64; // mm^4
    Z = I / c; // mm^3
    J = (Math.PI * Math.pow(d, 4)) / 32; // mm^4
    Z_p = (Math.PI * Math.pow(d, 3)) / 16; // mm^3

    sigma_a = (P * 1000) / A; // MPa
    sigma_b = (M * 1000) / Z; // MPa
    sigma_x = sigma_a + sigma_b; // MPa
    sigma_opp = sigma_a - sigma_b; // MPa
    tau_t = (T * 1000) / Z_p; // MPa
    tau_v = (4 * V * 1000) / (3 * A); // MPa

    sigma_avg = sigma_x / 2;
    tau_max = Math.sqrt(Math.pow(sigma_x / 2, 2) + Math.pow(tau_t, 2));
    sigma_1 = sigma_avg + tau_max;
    sigma_2 = sigma_avg - tau_max;
    sigma_vm = Math.sqrt(Math.pow(sigma_x, 2) + 3 * Math.pow(tau_t, 2));
    n_DE = S_y / sigma_vm;
    n_MSS = S_y / (2 * tau_max);

    _u = {
      d: "mm", A: "mm^2", c: "mm", I: "mm^4", Z: "mm^3", J: "mm^4", Z_p: "mm^3",
      P: "kN", e_ecc: "mm", M: "N-m", V: "kN", T: "N-m",
      sigma_a: "MPa", sigma_b: "MPa", sigma_x: "MPa", sigma_opp: "MPa",
      tau_t: "MPa", tau_v: "MPa", sigma_avg: "MPa", tau_max: "MPa",
      sigma_1: "MPa", sigma_2: "MPa", sigma_vm: "MPa", S_y: "MPa",
      n_DE: "dimless", n_MSS: "dimless"
    };
  }

  const _names = {};
  for (const [key, meta] of Object.entries(COMBINED_LOADING_VARS_DB)) {
    _names[key] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    d, A, c, I, Z, J, Z_p, P, e_ecc, M, V, T,
    sigma_a, sigma_b, sigma_x, sigma_opp, tau_t, tau_v,
    sigma_avg, tau_max, sigma_1, sigma_2, sigma_vm, S_y, n_DE, n_MSS,
    _names, _u
  };
}
