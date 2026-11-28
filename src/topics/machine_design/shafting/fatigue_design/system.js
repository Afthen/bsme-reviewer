/**
 * src/topics/machine_design/shafting/fatigue_design/system.js
 * Ground-truth generator for Rotating Shaft Fatigue Design (AISI 1050 CD / 4140 steel shoulder).
 */

import { SHAFT_FATIGUE_VARS_DB } from "./schema.js";

export function createShaftFatigueSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let D_maj, d, r_f, r_Dd, r_rd, K_t, K_ts, q, q_s, K_f, K_fs;
  let S_ut, S_y, S_ep, k_a, k_b, k_c, k_d_temp, k_e_rel, S_e;
  let M_a, M_m, T_a, T_m, sigma_a, sigma_m, tau_a, tau_m, sigma_vm_a, sigma_vm_m;
  let A_eq, B_eq, Z_p, n_DG, n_DS, n_AE, n_Gb, n_y, _u;

  K_t = 1.7;
  K_ts = 1.5;
  q = 0.80;
  q_s = 0.85;
  K_f = 1 + q * (K_t - 1); // 1.56
  K_fs = 1 + q_s * (K_ts - 1); // 1.425

  k_a = 0.85;
  k_b = 0.84;
  k_c = 1.0;
  k_d_temp = 1.0;
  k_e_rel = 0.897; // 90% reliability
  n_DG = 2.0;

  if (isUS) {
    S_ut = 100000.0; // psi
    S_y = 84000.0; // psi
    S_ep = 0.5 * S_ut; // 50000 psi
    S_e = k_a * k_b * k_c * k_d_temp * k_e_rel * S_ep; // ~32022.9 psi

    M_a = 3200.0; // lb_f-in
    M_m = 600.0; // lb_f-in
    T_a = 800.0; // lb_f-in
    T_m = 4000.0; // lb_f-in

    A_eq = Math.sqrt(4 * Math.pow(K_f * M_a, 2) + 3 * Math.pow(K_fs * T_a, 2));
    B_eq = Math.sqrt(4 * Math.pow(K_f * M_m, 2) + 3 * Math.pow(K_fs * T_m, 2));

    Z_p = n_DG * (A_eq / S_e + B_eq / S_ut); // in^3
    d = Math.cbrt((16 * Z_p) / Math.PI); // in
    D_maj = 1.35 * d;
    r_f = 0.08 * d;
    r_Dd = D_maj / d;
    r_rd = r_f / d;

    sigma_a = (32 * K_f * M_a) / (Math.PI * Math.pow(d, 3));
    sigma_m = (32 * K_f * M_m) / (Math.PI * Math.pow(d, 3));
    tau_a = (16 * K_fs * T_a) / (Math.PI * Math.pow(d, 3));
    tau_m = (16 * K_fs * T_m) / (Math.PI * Math.pow(d, 3));
    sigma_vm_a = Math.hypot(sigma_a, Math.sqrt(3) * tau_a);
    sigma_vm_m = Math.hypot(sigma_m, Math.sqrt(3) * tau_m);

    n_DS = 1 / (sigma_vm_a / S_e + sigma_vm_m / S_y);
    n_AE = 1 / Math.hypot(sigma_vm_a / S_e, sigma_vm_m / S_y);
    const aGb = Math.pow(sigma_vm_m / S_ut, 2);
    const bGb = sigma_vm_a / S_e;
    n_Gb = (-bGb + Math.sqrt(bGb * bGb + 4 * aGb)) / (2 * aGb);
    n_y = S_y / (sigma_vm_a + sigma_vm_m);

    _u = {
      D_maj: "in", d: "in", r_f: "in", r_Dd: "dimless", r_rd: "dimless",
      K_t: "dimless", K_ts: "dimless", q: "dimless", q_s: "dimless", K_f: "dimless", K_fs: "dimless",
      S_ut: "psi", S_y: "psi", S_ep: "psi",
      k_a: "dimless", k_b: "dimless", k_c: "dimless", k_d_temp: "dimless", k_e_rel: "dimless", S_e: "psi",
      M_a: "lb_f-in", M_m: "lb_f-in", T_a: "lb_f-in", T_m: "lb_f-in",
      sigma_a: "psi", sigma_m: "psi", tau_a: "psi", tau_m: "psi",
      sigma_vm_a: "psi", sigma_vm_m: "psi", A_eq: "lb_f-in", B_eq: "lb_f-in", Z_p: "in^3",
      n_DG: "dimless", n_DS: "dimless", n_AE: "dimless", n_Gb: "dimless", n_y: "dimless"
    };
  } else {
    S_ut = 690.0; // MPa
    S_y = 580.0; // MPa
    S_ep = 0.5 * S_ut; // 345 MPa
    S_e = k_a * k_b * k_c * k_d_temp * k_e_rel * S_ep;

    M_a = 350.0; // N-m
    M_m = 80.0; // N-m
    T_a = 100.0; // N-m
    T_m = 450.0; // N-m

    A_eq = Math.sqrt(4 * Math.pow(K_f * M_a, 2) + 3 * Math.pow(K_fs * T_a, 2));
    B_eq = Math.sqrt(4 * Math.pow(K_f * M_m, 2) + 3 * Math.pow(K_fs * T_m, 2));

    Z_p = n_DG * (A_eq / S_e + B_eq / S_ut) * 1000; // mm^3
    d = Math.cbrt((16 * Z_p) / Math.PI); // mm
    D_maj = 1.35 * d;
    r_f = 0.08 * d;
    r_Dd = D_maj / d;
    r_rd = r_f / d;

    sigma_a = (32 * K_f * M_a * 1000) / (Math.PI * Math.pow(d, 3));
    sigma_m = (32 * K_f * M_m * 1000) / (Math.PI * Math.pow(d, 3));
    tau_a = (16 * K_fs * T_a * 1000) / (Math.PI * Math.pow(d, 3));
    tau_m = (16 * K_fs * T_m * 1000) / (Math.PI * Math.pow(d, 3));
    sigma_vm_a = Math.hypot(sigma_a, Math.sqrt(3) * tau_a);
    sigma_vm_m = Math.hypot(sigma_m, Math.sqrt(3) * tau_m);

    n_DS = 1 / (sigma_vm_a / S_e + sigma_vm_m / S_y);
    n_AE = 1 / Math.hypot(sigma_vm_a / S_e, sigma_vm_m / S_y);
    const aGb = Math.pow(sigma_vm_m / S_ut, 2);
    const bGb = sigma_vm_a / S_e;
    n_Gb = (-bGb + Math.sqrt(bGb * bGb + 4 * aGb)) / (2 * aGb);
    n_y = S_y / (sigma_vm_a + sigma_vm_m);

    _u = {
      D_maj: "mm", d: "mm", r_f: "mm", r_Dd: "dimless", r_rd: "dimless",
      K_t: "dimless", K_ts: "dimless", q: "dimless", q_s: "dimless", K_f: "dimless", K_fs: "dimless",
      S_ut: "MPa", S_y: "MPa", S_ep: "MPa",
      k_a: "dimless", k_b: "dimless", k_c: "dimless", k_d_temp: "dimless", k_e_rel: "dimless", S_e: "MPa",
      M_a: "N-m", M_m: "N-m", T_a: "N-m", T_m: "N-m",
      sigma_a: "MPa", sigma_m: "MPa", tau_a: "MPa", tau_m: "MPa",
      sigma_vm_a: "MPa", sigma_vm_m: "MPa", A_eq: "N-m", B_eq: "N-m", Z_p: "mm^3",
      n_DG: "dimless", n_DS: "dimless", n_AE: "dimless", n_Gb: "dimless", n_y: "dimless"
    };
  }

  const _names = {};
  for (const [k, meta] of Object.entries(SHAFT_FATIGUE_VARS_DB)) {
    _names[k] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    D_maj, d, r_f, r_Dd, r_rd, K_t, K_ts, q, q_s, K_f, K_fs,
    S_ut, S_y, S_ep, k_a, k_b, k_c, k_d_temp, k_e_rel, S_e,
    M_a, M_m, T_a, T_m, sigma_a, sigma_m, tau_a, tau_m, sigma_vm_a, sigma_vm_m,
    A_eq, B_eq, Z_p, n_DG, n_DS, n_AE, n_Gb, n_y,
    _names, _u
  };
}
