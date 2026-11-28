/**
 * src/topics/machine_design/shafting/overhung_design/system.js
 * Ground-truth generator for Overhung Shaft Design across all three distinct checks:
 * Strength (n_DE), Rigidity (delta_tip, theta_B), and Dynamics (f_cr, n_cr, r_cr).
 */

import { SHAFT_OVERHUNG_VARS_DB } from "./schema.js";

export function createShaftOverhungSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let g, m, W, L, a, L_tot, R_A, R_B, M_B;
  let d, I, Z, Z_p, E, S_y, n_op, omega, P, T;
  let sigma_b, tau, sigma_vm, n_DE;
  let delta_tip, theta_B, theta_tip, delta_allow, theta_allow, n_delta, n_theta;
  let f_cr, omega_cr, n_cr, r_cr, _u;

  n_op = 1200.0; // rpm
  omega = (2 * Math.PI * n_op) / 60; // rad/s
  theta_allow = 0.001; // rad

  if (isUS) {
    g = 32.2; // ft/s^2
    const gc = 32.174049;
    const g_in = g * 12; // in/s^2
    m = 260.0; // lb_m
    W = m * (g / gc); // lb_f

    L = 20.0; // in
    a = 10.0; // in
    L_tot = L + a; // 30.0 in
    R_A = (W * a) / L; // lb_f
    R_B = (W * L_tot) / L; // lb_f
    M_B = W * a; // lb_f-in

    d = 1.50; // in
    I = (Math.PI * Math.pow(d, 4)) / 64; // in^4
    Z = (Math.PI * Math.pow(d, 3)) / 32; // in^3
    Z_p = (Math.PI * Math.pow(d, 3)) / 16; // in^3
    E = 29000.0; // ksi
    const E_psi = E * 1000;
    S_y = 52000.0; // psi

    T = 3500.0; // lb_f-in
    P = (T * omega) / (12 * 550); // hp

    sigma_b = M_B / Z; // psi
    tau = T / Z_p; // psi
    sigma_vm = Math.hypot(sigma_b, Math.sqrt(3) * tau); // psi
    n_DE = S_y / sigma_vm;

    delta_tip = (W * a * a * L_tot) / (3 * E_psi * I); // in
    theta_B = (W * a * L) / (3 * E_psi * I); // rad
    theta_tip = (W * a * (2 * L + 3 * a)) / (6 * E_psi * I); // rad
    delta_allow = 0.006; // in
    n_delta = delta_allow / delta_tip;
    n_theta = theta_allow / theta_B;

    f_cr = (1 / (2 * Math.PI)) * Math.sqrt(g_in / delta_tip); // Hz
    omega_cr = 2 * Math.PI * f_cr; // rad/s
    n_cr = f_cr * 60; // rpm
    r_cr = n_op / n_cr;

    _u = {
      g: "ft/s^2", m: "lb_m", W: "lb_f", L: "in", a: "in", L_tot: "in",
      R_A: "lb_f", R_B: "lb_f", M_B: "lb_f-in",
      d: "in", I: "in^4", Z: "in^3", Z_p: "in^3", E: "ksi", S_y: "psi",
      n_op: "rpm", omega: "rad/s", P: "hp", T: "lb_f-in",
      sigma_b: "psi", tau: "psi", sigma_vm: "psi", n_DE: "dimless",
      delta_tip: "in", theta_B: "rad", theta_tip: "rad",
      delta_allow: "in", theta_allow: "rad", n_delta: "dimless", n_theta: "dimless",
      f_cr: "Hz", omega_cr: "rad/s", n_cr: "rpm", r_cr: "dimless"
    };
  } else {
    g = 9.81; // m/s^2
    m = 120.0; // kg
    W = m * g; // 1177.2 N

    L = 500.0; // mm
    a = 250.0; // mm
    L_tot = L + a; // 750.0 mm
    R_A = (W * a) / L; // N
    R_B = (W * L_tot) / L; // N
    M_B = (W * a) / 1000; // N-m

    d = 38.0; // mm
    I = (Math.PI * Math.pow(d, 4)) / 64; // mm^4
    Z = (Math.PI * Math.pow(d, 3)) / 32; // mm^3
    Z_p = (Math.PI * Math.pow(d, 3)) / 16; // mm^3
    E = 200.0; // GPa
    const E_mpa = E * 1000;
    S_y = 360.0; // MPa

    T = 400.0; // N-m
    P = (T * omega) / 1000; // kW

    sigma_b = (M_B * 1000) / Z; // MPa
    tau = (T * 1000) / Z_p; // MPa
    sigma_vm = Math.hypot(sigma_b, Math.sqrt(3) * tau); // MPa
    n_DE = S_y / sigma_vm;

    delta_tip = (W * a * a * L_tot) / (3 * E_mpa * I); // mm
    theta_B = (W * a * L) / (3 * E_mpa * I); // rad
    theta_tip = (W * a * (2 * L + 3 * a)) / (6 * E_mpa * I); // rad
    delta_allow = 0.15; // mm
    n_delta = delta_allow / delta_tip;
    n_theta = theta_allow / theta_B;

    f_cr = (1 / (2 * Math.PI)) * Math.sqrt(g / (delta_tip / 1000)); // Hz
    omega_cr = 2 * Math.PI * f_cr; // rad/s
    n_cr = f_cr * 60; // rpm
    r_cr = n_op / n_cr;

    _u = {
      g: "m/s^2", m: "kg", W: "N", L: "mm", a: "mm", L_tot: "mm",
      R_A: "N", R_B: "N", M_B: "N-m",
      d: "mm", I: "mm^4", Z: "mm^3", Z_p: "mm^3", E: "GPa", S_y: "MPa",
      n_op: "rpm", omega: "rad/s", P: "kW", T: "N-m",
      sigma_b: "MPa", tau: "MPa", sigma_vm: "MPa", n_DE: "dimless",
      delta_tip: "mm", theta_B: "rad", theta_tip: "rad",
      delta_allow: "mm", theta_allow: "rad", n_delta: "dimless", n_theta: "dimless",
      f_cr: "Hz", omega_cr: "rad/s", n_cr: "rpm", r_cr: "dimless"
    };
  }

  const _names = {};
  for (const [k, meta] of Object.entries(SHAFT_OVERHUNG_VARS_DB)) {
    _names[k] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    g, m, W, L, a, L_tot, R_A, R_B, M_B,
    d, I, Z, Z_p, E, S_y, n_op, omega, P, T,
    sigma_b, tau, sigma_vm, n_DE,
    delta_tip, theta_B, theta_tip, delta_allow, theta_allow, n_delta, n_theta,
    f_cr, omega_cr, n_cr, r_cr,
    _names, _u
  };
}
