/**
 * src/topics/machine_design/stress/beam_bending_shear/system.js
 * Ground-truth generator for Simply Supported Rectangular Beam Bending & Transverse Shear.
 * Reference: Beer & Johnston, Mechanics of Materials, Ch. 4 & 6; Hibbeler, Ch. 6 & 7.
 */

import { BEAM_BENDING_VARS_DB } from "./schema.js";

export function createBeamBendingSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let F, V, M, I, c, Z, sigma_b, S_y, L, b, h, A, Q_max, d_y, I_off;
  let tau_avg, tau_max, q_flow, n_b, _u;

  if (isUS) {
    b = 2.0; // in
    h = 4.0; // in
    L = 72.0; // in
    F = 3000.0; // lb_f
    d_y = 2.5; // in
    S_y = 36000.0; // psi

    V = F / 2; // 1500 lb_f
    M = (F * L) / 4; // 54000 lb_f-in
    A = b * h; // 8 in^2
    c = h / 2; // 2 in
    I = (b * Math.pow(h, 3)) / 12; // 10.6667 in^4
    Z = I / c; // 5.3333 in^3
    Q_max = (b * Math.pow(h, 2)) / 8; // 4.0 in^3
    I_off = I + A * d_y * d_y; // 60.6667 in^4

    sigma_b = M / Z; // 10125 psi
    tau_avg = V / A; // 187.5 psi
    tau_max = 1.5 * tau_avg; // 281.25 psi
    q_flow = (V * Q_max) / I; // 562.5 lb_f/in
    n_b = S_y / sigma_b;

    _u = {
      F: "lb_f", V: "lb_f", M: "lb_f-in", I: "in^4", c: "in", Z: "in^3",
      sigma_b: "psi", S_y: "psi", L: "in", b: "in", h: "in", A: "in^2",
      Q_max: "in^3", d_y: "in", I_off: "in^4",
      tau_avg: "psi", tau_max: "psi", q_flow: "lb_f/in", n_b: "dimless"
    };
  } else {
    b = 40.0; // mm
    h = 80.0; // mm
    L = 1.8; // m
    F = 12.0; // kN
    d_y = 45.0; // mm
    S_y = 250.0; // MPa

    V = F / 2; // 6 kN
    M = (F * L) / 4; // 5.4 kN-m
    A = b * h; // 3200 mm^2
    c = h / 2; // 40 mm
    I = (b * Math.pow(h, 3)) / 12; // 1.70667e6 mm^4
    Z = I / c; // 42666.7 mm^3
    Q_max = (b * Math.pow(h, 2)) / 8; // 32000 mm^3
    I_off = I + A * d_y * d_y; // 8.18667e6 mm^4

    const M_Nmm = M * 1e6;
    sigma_b = (M_Nmm * c) / I; // 126.5625 MPa
    const V_N = V * 1000;
    tau_avg = V_N / A; // 1.875 MPa
    tau_max = 1.5 * tau_avg; // 2.8125 MPa
    q_flow = (V_N * Q_max) / I; // 112.5 N/mm
    n_b = S_y / sigma_b;

    _u = {
      F: "kN", V: "kN", M: "kN-m", I: "mm^4", c: "mm", Z: "mm^3",
      sigma_b: "MPa", S_y: "MPa", L: "m", b: "mm", h: "mm", A: "mm^2",
      Q_max: "mm^3", d_y: "mm", I_off: "mm^4",
      tau_avg: "MPa", tau_max: "MPa", q_flow: "N/mm", n_b: "dimless"
    };
  }

  const _names = {};
  for (const [key, meta] of Object.entries(BEAM_BENDING_VARS_DB)) {
    _names[key] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    F, V, M, I, c, Z, sigma_b, S_y, L, b, h, A, Q_max, d_y, I_off,
    tau_avg, tau_max, q_flow, n_b,
    _names, _u
  };
}
