/**
 * src/topics/machine_design/shafting/asme_design/system.js
 * Ground-truth generator for ASME B17c-1927 Transmission Shafting Design.
 * Material: Cold-drawn AISI 1045 Steel (S_ut = 625 MPa / 91 ksi, S_y = 530 MPa / 77 ksi -> 0.18 S_ut governs).
 * Service: Rotating shaft with suddenly applied minor shock (K_m = 1.5, K_t = 1.0) and keyway (k_key = 0.75).
 */

import { SHAFT_ASME_VARS_DB } from "./schema.js";

export function createShaftAsmeSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let n_op, omega, P, T, M_h, M_v, M;
  let S_y, S_ut, S_sy_lim, S_s0, k_key, S_s;
  let C_m, C_t, M_f, T_f, T_e, M_e, Z_p, d, d_o, d_i, k_d;
  let tau_nom, sigma_nom, _u;

  n_op = 1150.0; // rpm
  omega = (2 * Math.PI * n_op) / 60; // rad/s
  C_m = 1.5;
  C_t = 1.0;
  k_key = 0.75;
  k_d = 0.5;

  if (isUS) {
    S_ut = 91000.0; // psi
    S_y = 77000.0; // psi
    S_sy_lim = 0.30 * S_y; // 23100 psi
    S_s0 = 0.18 * S_ut; // 16380 psi (governs since 16380 < 23100)
    S_s = k_key * S_s0; // 12285 psi

    M_h = 3000.0; // lb_f-in
    M_v = 4000.0; // lb_f-in
    M = Math.hypot(M_h, M_v); // 5000 lb_f-in
    T = 6500.0; // lb_f-in
    P = (T * omega) / (12 * 550); // hp

    M_f = C_m * M; // 7500 lb_f-in
    T_f = C_t * T; // 6500 lb_f-in
    T_e = Math.hypot(M_f, T_f); // lb_f-in
    M_e = 0.5 * (M_f + T_e);

    Z_p = T_e / S_s; // in^3
    d = Math.cbrt((16 * Z_p) / Math.PI); // in
    d_o = d / Math.cbrt(1 - Math.pow(k_d, 4));
    d_i = k_d * d_o;

    tau_nom = T / Z_p;
    sigma_nom = (32 * M) / (Math.PI * Math.pow(d, 3));

    _u = {
      n_op: "rpm", omega: "rad/s", P: "hp", T: "lb_f-in",
      M_h: "lb_f-in", M_v: "lb_f-in", M: "lb_f-in",
      S_y: "psi", S_ut: "psi", S_sy_lim: "psi", S_s0: "psi", k_key: "dimless", S_s: "psi",
      C_m: "dimless", C_t: "dimless", M_f: "lb_f-in", T_f: "lb_f-in", T_e: "lb_f-in", M_e: "lb_f-in",
      Z_p: "in^3", d: "in", d_o: "in", d_i: "in", k_d: "dimless",
      tau_nom: "psi", sigma_nom: "psi"
    };
  } else {
    S_ut = 625.0; // MPa
    S_y = 530.0; // MPa
    S_sy_lim = 0.30 * S_y; // 159 MPa
    S_s0 = 0.18 * S_ut; // 112.5 MPa (governs since 112.5 < 159)
    S_s = k_key * S_s0; // 84.375 MPa

    M_h = 360.0; // N-m
    M_v = 480.0; // N-m
    M = Math.hypot(M_h, M_v); // 600 N-m
    T = 750.0; // N-m
    P = (T * omega) / 1000; // kW

    M_f = C_m * M; // 900 N-m
    T_f = C_t * T; // 750 N-m
    T_e = Math.hypot(M_f, T_f); // N-m
    M_e = 0.5 * (M_f + T_e);

    Z_p = (T_e / S_s) * 1000; // mm^3
    d = Math.cbrt((16 * Z_p) / Math.PI); // mm
    d_o = d / Math.cbrt(1 - Math.pow(k_d, 4));
    d_i = k_d * d_o;

    tau_nom = (T * 1000) / Z_p; // MPa
    sigma_nom = (32 * M * 1000) / (Math.PI * Math.pow(d, 3)); // MPa

    _u = {
      n_op: "rpm", omega: "rad/s", P: "kW", T: "N-m",
      M_h: "N-m", M_v: "N-m", M: "N-m",
      S_y: "MPa", S_ut: "MPa", S_sy_lim: "MPa", S_s0: "MPa", k_key: "dimless", S_s: "MPa",
      C_m: "dimless", C_t: "dimless", M_f: "N-m", T_f: "N-m", T_e: "N-m", M_e: "N-m",
      Z_p: "mm^3", d: "mm", d_o: "mm", d_i: "mm", k_d: "dimless",
      tau_nom: "MPa", sigma_nom: "MPa"
    };
  }

  const _names = {};
  for (const [k, meta] of Object.entries(SHAFT_ASME_VARS_DB)) {
    _names[k] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    n_op, omega, P, T, M_h, M_v, M,
    S_y, S_ut, S_sy_lim, S_s0, k_key, S_s,
    C_m, C_t, M_f, T_f, T_e, M_e, Z_p, d, d_o, d_i, k_d,
    tau_nom, sigma_nom,
    _names, _u
  };
}
