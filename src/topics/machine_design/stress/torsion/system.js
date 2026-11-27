/**
 * src/topics/machine_design/stress/torsion/system.js
 * Ground-truth generator for Solid & Hollow Circular Torsion Members.
 * Reference: Beer & Johnston, Mechanics of Materials, Ch. 3 (Steel G ≈ 80 GPa / 11.5 Mpsi; Al G ≈ 28 GPa / 4 Mpsi).
 */

import { TORSION_VARS_DB } from "./schema.js";

export function createTorsionSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let P, T_0, n, omega, d_1, r_1, L_1, G_1, J_1, Z_p1, k_t1, T_1, tau_1;
  let D_o, D_i, r_o, k_d, L_2, G_2, J_2, Z_p2, k_t2, T_2, tau_2;
  let k_teq, theta, k_tser, theta_ser, S_sy, n_t1, _u;

  if (isUS) {
    n = 1200; // rpm
    omega = (2 * Math.PI * n) / 60; // rad/s
    T_0 = 5000.0; // lb_f-in
    P = (T_0 * omega) / (12 * 550); // hp

    d_1 = 1.25; // in
    r_1 = d_1 / 2;
    L_1 = 30.0; // in
    G_1 = 11500.0; // ksi
    J_1 = (Math.PI * Math.pow(d_1, 4)) / 32; // in^4
    Z_p1 = (Math.PI * Math.pow(d_1, 3)) / 16; // in^3
    k_t1 = (G_1 * 1000 * J_1) / L_1; // lb_f-in/rad

    D_o = 2.0; // in
    D_i = 1.25; // in
    r_o = D_o / 2;
    k_d = D_i / D_o;
    L_2 = 40.0; // in
    G_2 = 4000.0; // ksi
    J_2 = (Math.PI * (Math.pow(D_o, 4) - Math.pow(D_i, 4))) / 32; // in^4
    Z_p2 = J_2 / r_o; // in^3
    k_t2 = (G_2 * 1000 * J_2) / L_2; // lb_f-in/rad

    k_teq = k_t1 + k_t2;
    theta = T_0 / k_teq; // rad
    T_1 = k_t1 * theta;
    T_2 = k_t2 * theta;
    tau_1 = (T_1 * r_1) / J_1; // psi
    tau_2 = (T_2 * r_o) / J_2; // psi

    k_tser = 1 / (1 / k_t1 + 1 / k_t2);
    theta_ser = T_0 / k_tser; // rad
    S_sy = 21000.0; // psi
    n_t1 = S_sy / tau_1;

    _u = {
      P: "hp", T_0: "lb_f-in", n: "rpm", omega: "rad/s",
      d_1: "in", r_1: "in", L_1: "in", G_1: "ksi", J_1: "in^4", Z_p1: "in^3",
      k_t1: "lb_f-in/rad", T_1: "lb_f-in", tau_1: "psi",
      D_o: "in", D_i: "in", r_o: "in", k_d: "dimless", L_2: "in", G_2: "ksi",
      J_2: "in^4", Z_p2: "in^3", k_t2: "lb_f-in/rad", T_2: "lb_f-in", tau_2: "psi",
      k_teq: "lb_f-in/rad", theta: "rad", k_tser: "lb_f-in/rad", theta_ser: "rad",
      S_sy: "psi", n_t1: "dimless"
    };
  } else {
    n = 1200; // rpm
    omega = (2 * Math.PI * n) / 60; // rad/s
    T_0 = 600.0; // N-m
    P = (T_0 * omega) / 1000; // kW

    d_1 = 30.0; // mm
    r_1 = d_1 / 2;
    L_1 = 800.0; // mm
    G_1 = 80.0; // GPa
    J_1 = (Math.PI * Math.pow(d_1, 4)) / 32; // mm^4
    Z_p1 = (Math.PI * Math.pow(d_1, 3)) / 16; // mm^3
    k_t1 = (G_1 * J_1) / L_1; // (kN/mm^2 * mm^4) / mm = kN-mm = N-m/rad

    D_o = 48.0; // mm
    D_i = 30.0; // mm
    r_o = D_o / 2;
    k_d = D_i / D_o;
    L_2 = 1000.0; // mm
    G_2 = 28.0; // GPa
    J_2 = (Math.PI * (Math.pow(D_o, 4) - Math.pow(D_i, 4))) / 32; // mm^4
    Z_p2 = J_2 / r_o; // mm^3
    k_t2 = (G_2 * J_2) / L_2; // N-m/rad

    k_teq = k_t1 + k_t2;
    theta = T_0 / k_teq; // rad
    T_1 = k_t1 * theta; // N-m
    T_2 = k_t2 * theta; // N-m
    tau_1 = (T_1 * 1000 * r_1) / J_1; // MPa
    tau_2 = (T_2 * 1000 * r_o) / J_2; // MPa

    k_tser = 1 / (1 / k_t1 + 1 / k_t2);
    theta_ser = T_0 / k_tser; // rad
    S_sy = 145.0; // MPa
    n_t1 = S_sy / tau_1;

    _u = {
      P: "kW", T_0: "N-m", n: "rpm", omega: "rad/s",
      d_1: "mm", r_1: "mm", L_1: "mm", G_1: "GPa", J_1: "mm^4", Z_p1: "mm^3",
      k_t1: "N-m/rad", T_1: "N-m", tau_1: "MPa",
      D_o: "mm", D_i: "mm", r_o: "mm", k_d: "dimless", L_2: "mm", G_2: "GPa",
      J_2: "mm^4", Z_p2: "mm^3", k_t2: "N-m/rad", T_2: "N-m", tau_2: "MPa",
      k_teq: "N-m/rad", theta: "rad", k_tser: "N-m/rad", theta_ser: "rad",
      S_sy: "MPa", n_t1: "dimless"
    };
  }

  const _names = {};
  for (const [key, meta] of Object.entries(TORSION_VARS_DB)) {
    _names[key] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    P, T_0, n, omega, d_1, r_1, L_1, G_1, J_1, Z_p1, k_t1, T_1, tau_1,
    D_o, D_i, r_o, k_d, L_2, G_2, J_2, Z_p2, k_t2, T_2, tau_2,
    k_teq, theta, k_tser, theta_ser, S_sy, n_t1,
    _names, _u
  };
}
