/**
 * src/topics/machine_design/shafting/static_combined_strength/system.js
 * Ground-truth generator for Static Combined Shaft Strength & Equal-Strength Hollow Sizing.
 */

import { SHAFT_STATIC_STRENGTH_VARS_DB } from "./schema.js";

export function createShaftStaticStrengthSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let n_op, omega, P, T, M_h, M_v, M, d, A, Z, Z_p, sigma_b, tau, S_y;
  let T_e, M_e, tau_max, S_sy, n_MSS, sigma_vm, n_DE;
  let d_o, d_i, k_d, A_hol, eta_wt;
  let F_a, sigma_a, sigma_x, sigma_comb, n_comb, _u;

  n_op = 900.0; // rpm
  omega = (2 * Math.PI * n_op) / 60; // rad/s
  n_DE = 2.5;
  k_d = 0.6;

  if (isUS) {
    M_h = 2700.0; // lb_f-in
    M_v = 3600.0; // lb_f-in
    M = Math.hypot(M_h, M_v); // 4500 lb_f-in
    T = 5400.0; // lb_f-in
    P = (T * omega) / (12 * 550); // hp
    S_y = 50000.0; // psi

    Z_p = (n_DE * Math.sqrt(4 * M * M + 3 * T * T)) / S_y; // in^3
    d = Math.cbrt((16 * Z_p) / Math.PI); // in
    A = (Math.PI * d * d) / 4; // in^2
    Z = (Math.PI * Math.pow(d, 3)) / 32; // in^3

    sigma_b = M / Z; // psi
    tau = T / Z_p; // psi
    T_e = Math.hypot(M, T); // lb_f-in
    M_e = 0.5 * (M + T_e); // lb_f-in
    tau_max = T_e / Z_p; // psi
    S_sy = 0.5 * S_y; // psi
    n_MSS = S_sy / tau_max;
    sigma_vm = Math.hypot(sigma_b, Math.sqrt(3) * tau); // psi

    d_o = d / Math.cbrt(1 - Math.pow(k_d, 4));
    d_i = k_d * d_o;
    A_hol = (Math.PI * (d_o * d_o - d_i * d_i)) / 4;
    eta_wt = ((A - A_hol) / A) * 100; // %

    F_a = 3500.0; // lb_f
    sigma_a = F_a / A; // psi
    sigma_x = sigma_a + sigma_b;
    sigma_comb = Math.hypot(sigma_x, Math.sqrt(3) * tau);
    n_comb = S_y / sigma_comb;

    _u = {
      n_op: "rpm", omega: "rad/s", P: "hp", T: "lb_f-in",
      M_h: "lb_f-in", M_v: "lb_f-in", M: "lb_f-in",
      d: "in", A: "in^2", Z: "in^3", Z_p: "in^3",
      sigma_b: "psi", tau: "psi", S_y: "psi",
      T_e: "lb_f-in", M_e: "lb_f-in", tau_max: "psi", S_sy: "psi", n_MSS: "dimless",
      sigma_vm: "psi", n_DE: "dimless",
      d_o: "in", d_i: "in", k_d: "dimless", A_hol: "in^2", eta_wt: "%",
      F_a: "lb_f", sigma_a: "psi", sigma_x: "psi", sigma_comb: "psi", n_comb: "dimless"
    };
  } else {
    M_h = 300.0; // N-m
    M_v = 400.0; // N-m
    M = Math.hypot(M_h, M_v); // 500 N-m
    T = 600.0; // N-m
    P = (T * omega) / 1000; // kW
    S_y = 350.0; // MPa

    Z_p = ((n_DE * Math.sqrt(4 * M * M + 3 * T * T)) / S_y) * 1000; // mm^3
    d = Math.cbrt((16 * Z_p) / Math.PI); // mm
    A = (Math.PI * d * d) / 4; // mm^2
    Z = (Math.PI * Math.pow(d, 3)) / 32; // mm^3

    sigma_b = (M * 1000) / Z; // MPa
    tau = (T * 1000) / Z_p; // MPa
    T_e = Math.hypot(M, T); // N-m
    M_e = 0.5 * (M + T_e); // N-m
    tau_max = (T_e * 1000) / Z_p; // MPa
    S_sy = 0.5 * S_y; // MPa
    n_MSS = S_sy / tau_max;
    sigma_vm = Math.hypot(sigma_b, Math.sqrt(3) * tau); // MPa

    d_o = d / Math.cbrt(1 - Math.pow(k_d, 4));
    d_i = k_d * d_o;
    A_hol = (Math.PI * (d_o * d_o - d_i * d_i)) / 4;
    eta_wt = ((A - A_hol) / A) * 100; // %

    F_a = 15000.0; // N
    sigma_a = F_a / A; // MPa
    sigma_x = sigma_a + sigma_b;
    sigma_comb = Math.hypot(sigma_x, Math.sqrt(3) * tau);
    n_comb = S_y / sigma_comb;

    _u = {
      n_op: "rpm", omega: "rad/s", P: "kW", T: "N-m",
      M_h: "N-m", M_v: "N-m", M: "N-m",
      d: "mm", A: "mm^2", Z: "mm^3", Z_p: "mm^3",
      sigma_b: "MPa", tau: "MPa", S_y: "MPa",
      T_e: "N-m", M_e: "N-m", tau_max: "MPa", S_sy: "MPa", n_MSS: "dimless",
      sigma_vm: "MPa", n_DE: "dimless",
      d_o: "mm", d_i: "mm", k_d: "dimless", A_hol: "mm^2", eta_wt: "%",
      F_a: "N", sigma_a: "MPa", sigma_x: "MPa", sigma_comb: "MPa", n_comb: "dimless"
    };
  }

  const _names = {};
  for (const [k, meta] of Object.entries(SHAFT_STATIC_STRENGTH_VARS_DB)) {
    _names[k] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    n_op, omega, P, T, M_h, M_v, M,
    d, A, Z, Z_p, sigma_b, tau, S_y,
    T_e, M_e, tau_max, S_sy, n_MSS, sigma_vm, n_DE,
    d_o, d_i, k_d, A_hol, eta_wt,
    F_a, sigma_a, sigma_x, sigma_comb, n_comb,
    _names, _u
  };
}
