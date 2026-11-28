/**
 * src/topics/machine_design/shafting/power_and_loads/system.js
 * Ground-truth generator for a simply supported rotating shaft carrying a helical gear (at a_1)
 * and a belt pulley (at a_2 > a_1), with orthogonal W_t (vertical) and (W_r, F_b) (horizontal).
 */

import { SHAFT_POWER_LOADS_VARS_DB } from "./schema.js";

export function createShaftPowerLoadsSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let P_in, eta_m, P_out, P_loss, K_s, P_des, n_op, omega, T;
  let D_g, phi_g, psi_g, W_t, W_r, F_ax;
  let D_p, F_1, F_2, k_b_tens, F_b;
  let L, a_1, b_1, a_2, b_2;
  let R_Av, R_Bv, R_Ah, R_Bh, R_A, R_B;
  let M_v1, M_h1, M_1, M_v2, M_h2, M_2, _u;

  eta_m = 94.0; // %
  K_s = 1.25;
  phi_g = 20.0; // °
  psi_g = 15.0; // °
  k_b_tens = 2.5;
  n_op = 600.0; // rpm
  omega = (2 * Math.PI * n_op) / 60; // rad/s

  const tanPhi = Math.tan((phi_g * Math.PI) / 180);
  const tanPsi = Math.tan((psi_g * Math.PI) / 180);

  if (isUS) {
    P_in = 25.0; // hp
    P_out = (eta_m / 100) * P_in;
    P_loss = P_in - P_out;
    P_des = K_s * P_in; // 31.25 hp
    T = (P_des * 550 * 12) / omega; // lb_f-in

    D_g = 8.0; // in
    W_t = (2 * T) / D_g; // lb_f
    W_r = W_t * tanPhi;
    F_ax = W_t * tanPsi;

    D_p = 12.0; // in
    F_2 = ((2 * T) / D_p) / (k_b_tens - 1);
    F_1 = k_b_tens * F_2;
    F_b = F_1 + F_2;

    L = 40.0; // in
    a_1 = 10.0;
    b_1 = L - a_1; // 30.0 in
    a_2 = 28.0;
    b_2 = L - a_2; // 12.0 in

    R_Av = (W_t * b_1) / L;
    R_Bv = (W_t * a_1) / L;
    R_Ah = (W_r * b_1 + F_b * b_2) / L;
    R_Bh = (W_r * a_1 + F_b * a_2) / L;
    R_A = Math.hypot(R_Av, R_Ah);
    R_B = Math.hypot(R_Bv, R_Bh);

    M_v1 = R_Av * a_1;
    M_h1 = R_Ah * a_1;
    M_1 = Math.hypot(M_v1, M_h1);
    M_v2 = R_Bv * b_2;
    M_h2 = R_Bh * b_2;
    M_2 = Math.hypot(M_v2, M_h2);

    _u = {
      P_in: "hp", eta_m: "%", P_out: "hp", P_loss: "hp", K_s: "dimless", P_des: "hp",
      n_op: "rpm", omega: "rad/s", T: "lb_f-in",
      D_g: "in", phi_g: "°", psi_g: "°", W_t: "lb_f", W_r: "lb_f", F_ax: "lb_f",
      D_p: "in", F_1: "lb_f", F_2: "lb_f", k_b_tens: "dimless", F_b: "lb_f",
      L: "in", a_1: "in", b_1: "in", a_2: "in", b_2: "in",
      R_Av: "lb_f", R_Bv: "lb_f", R_Ah: "lb_f", R_Bh: "lb_f", R_A: "lb_f", R_B: "lb_f",
      M_v1: "lb_f-in", M_h1: "lb_f-in", M_1: "lb_f-in",
      M_v2: "lb_f-in", M_h2: "lb_f-in", M_2: "lb_f-in"
    };
  } else {
    P_in = 20.0; // kW
    P_out = (eta_m / 100) * P_in; // 18.8 kW
    P_loss = P_in - P_out; // 1.2 kW
    P_des = K_s * P_in; // 25.0 kW
    T = (P_des * 1000) / omega; // N-m

    D_g = 200.0; // mm
    W_t = (2 * T) / (D_g / 1000); // N
    W_r = W_t * tanPhi;
    F_ax = W_t * tanPsi;

    D_p = 300.0; // mm
    F_2 = ((2 * T) / (D_p / 1000)) / (k_b_tens - 1);
    F_1 = k_b_tens * F_2;
    F_b = F_1 + F_2;

    L = 1000.0; // mm
    a_1 = 250.0;
    b_1 = L - a_1; // 750.0 mm
    a_2 = 700.0;
    b_2 = L - a_2; // 300.0 mm

    R_Av = (W_t * b_1) / L;
    R_Bv = (W_t * a_1) / L;
    R_Ah = (W_r * b_1 + F_b * b_2) / L;
    R_Bh = (W_r * a_1 + F_b * a_2) / L;
    R_A = Math.hypot(R_Av, R_Ah);
    R_B = Math.hypot(R_Bv, R_Bh);

    M_v1 = R_Av * (a_1 / 1000); // N-m
    M_h1 = R_Ah * (a_1 / 1000);
    M_1 = Math.hypot(M_v1, M_h1);
    M_v2 = R_Bv * (b_2 / 1000);
    M_h2 = R_Bh * (b_2 / 1000);
    M_2 = Math.hypot(M_v2, M_h2);

    _u = {
      P_in: "kW", eta_m: "%", P_out: "kW", P_loss: "kW", K_s: "dimless", P_des: "kW",
      n_op: "rpm", omega: "rad/s", T: "N-m",
      D_g: "mm", phi_g: "°", psi_g: "°", W_t: "N", W_r: "N", F_ax: "N",
      D_p: "mm", F_1: "N", F_2: "N", k_b_tens: "dimless", F_b: "N",
      L: "mm", a_1: "mm", b_1: "mm", a_2: "mm", b_2: "mm",
      R_Av: "N", R_Bv: "N", R_Ah: "N", R_Bh: "N", R_A: "N", R_B: "N",
      M_v1: "N-m", M_h1: "N-m", M_1: "N-m",
      M_v2: "N-m", M_h2: "N-m", M_2: "N-m"
    };
  }

  const _names = {};
  for (const [k, meta] of Object.entries(SHAFT_POWER_LOADS_VARS_DB)) {
    _names[k] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    P_in, eta_m, P_out, P_loss, K_s, P_des, n_op, omega, T,
    D_g, phi_g, psi_g, W_t, W_r, F_ax,
    D_p, F_1, F_2, k_b_tens, F_b,
    L, a_1, b_1, a_2, b_2,
    R_Av, R_Bv, R_Ah, R_Bh, R_A, R_B,
    M_v1, M_h1, M_1, M_v2, M_h2, M_2,
    _names, _u
  };
}
