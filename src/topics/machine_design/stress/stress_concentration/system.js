/**
 * src/topics/machine_design/stress/stress_concentration/system.js
 * Ground-truth generator for Stress Concentration & Notch Sensitivity on a Stepped Circular Bar.
 * Reference: Shigley's MED, Sec. 3-13 & 6-10; Peterson's Stress Concentration Factors.
 */

import { STRESS_CONCENTRATION_VARS_DB } from "./schema.js";

export function createStressConcentrationSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let D_maj, d_min, r_fil, ratio_Dd, ratio_rd, A_min, Z_pmin;
  let F, T, F_a, T_a, K_t, K_ts, q, q_s, K_f, K_fs;
  let sigma_0, sigma_max, tau_0, tau_max, sigma_a0, sigma_a_loc, tau_a0, tau_a_loc;
  let sigma_vm_max, S_y, n_loc, _u;

  K_t = 1.85;
  K_ts = 1.45;
  q = 0.80;
  q_s = 0.85;
  K_f = 1 + q * (K_t - 1);
  K_fs = 1 + q_s * (K_ts - 1);

  if (isUS) {
    D_maj = 2.0; // in
    d_min = 1.25; // in
    r_fil = 0.15; // in
    ratio_Dd = D_maj / d_min;
    ratio_rd = r_fil / d_min; // 0.12

    A_min = (Math.PI * d_min * d_min) / 4; // in^2
    Z_pmin = (Math.PI * Math.pow(d_min, 3)) / 16; // in^3

    F = 14.0; // kip
    T = 3600.0; // lb_f-in
    F_a = 5.6; // kip
    T_a = 1440.0; // lb_f-in
    S_y = 65.0; // ksi

    sigma_0 = F / A_min; // ksi
    sigma_max = K_t * sigma_0; // ksi
    tau_0 = T / (1000 * Z_pmin); // ksi
    tau_max = K_ts * tau_0; // ksi

    sigma_a0 = F_a / A_min; // ksi
    sigma_a_loc = K_f * sigma_a0; // ksi
    tau_a0 = T_a / (1000 * Z_pmin); // ksi
    tau_a_loc = K_fs * tau_a0; // ksi

    sigma_vm_max = Math.sqrt(sigma_max * sigma_max + 3 * tau_max * tau_max);
    n_loc = S_y / sigma_vm_max;

    _u = {
      F: "kip", T: "lb_f-in", S_y: "ksi",
      D_maj: "in", d_min: "in", r_fil: "in",
      ratio_Dd: "dimless", ratio_rd: "dimless",
      A_min: "in^2", Z_pmin: "in^3",
      F_a: "kip", T_a: "lb_f-in",
      K_t: "dimless", K_ts: "dimless", q: "dimless", q_s: "dimless", K_f: "dimless", K_fs: "dimless",
      sigma_0: "ksi", sigma_max: "ksi", tau_0: "ksi", tau_max: "ksi",
      sigma_a0: "ksi", sigma_a_loc: "ksi", tau_a0: "ksi", tau_a_loc: "ksi",
      sigma_vm_max: "ksi", n_loc: "dimless"
    };
  } else {
    D_maj = 50.0; // mm
    d_min = 32.0; // mm
    r_fil = 4.0; // mm
    ratio_Dd = D_maj / d_min;
    ratio_rd = r_fil / d_min; // 0.125

    A_min = (Math.PI * d_min * d_min) / 4; // mm^2
    Z_pmin = (Math.PI * Math.pow(d_min, 3)) / 16; // mm^3

    F = 60.0; // kN
    T = 400.0; // N-m
    F_a = 24.0; // kN
    T_a = 160.0; // N-m
    S_y = 450.0; // MPa

    sigma_0 = (F * 1000) / A_min; // MPa
    sigma_max = K_t * sigma_0; // MPa
    tau_0 = (T * 1000) / Z_pmin; // MPa
    tau_max = K_ts * tau_0; // MPa

    sigma_a0 = (F_a * 1000) / A_min; // MPa
    sigma_a_loc = K_f * sigma_a0; // MPa
    tau_a0 = (T_a * 1000) / Z_pmin; // MPa
    tau_a_loc = K_fs * tau_a0; // MPa

    sigma_vm_max = Math.sqrt(sigma_max * sigma_max + 3 * tau_max * tau_max);
    n_loc = S_y / sigma_vm_max;

    _u = {
      F: "kN", T: "N-m", S_y: "MPa",
      D_maj: "mm", d_min: "mm", r_fil: "mm",
      ratio_Dd: "dimless", ratio_rd: "dimless",
      A_min: "mm^2", Z_pmin: "mm^3",
      F_a: "kN", T_a: "N-m",
      K_t: "dimless", K_ts: "dimless", q: "dimless", q_s: "dimless", K_f: "dimless", K_fs: "dimless",
      sigma_0: "MPa", sigma_max: "MPa", tau_0: "MPa", tau_max: "MPa",
      sigma_a0: "MPa", sigma_a_loc: "MPa", tau_a0: "MPa", tau_a_loc: "MPa",
      sigma_vm_max: "MPa", n_loc: "dimless"
    };
  }

  const _names = {};
  for (const [key, meta] of Object.entries(STRESS_CONCENTRATION_VARS_DB)) {
    _names[key] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    F, T, S_y, D_maj, d_min, r_fil, ratio_Dd, ratio_rd, A_min, Z_pmin,
    F_a, T_a, K_t, K_ts, q, q_s, K_f, K_fs,
    sigma_0, sigma_max, tau_0, tau_max, sigma_a0, sigma_a_loc, tau_a0, tau_a_loc,
    sigma_vm_max, n_loc,
    _names, _u
  };
}
