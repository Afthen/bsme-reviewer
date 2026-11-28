/**
 * src/topics/machine_design/shafting/rigidity_deflection/system.js
 * Ground-truth generator for Lateral Shaft Rigidity vs. Strength Design.
 * Demonstrates realistic gear-mesh deflection (< 0.25 mm) and bearing slope (< 0.001 rad)
 * governing shaft diameter (d_rig > d_str).
 */

import { SHAFT_RIGIDITY_DEFLECTION_VARS_DB } from "./schema.js";

export function createShaftRigidityDeflectionSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let L, a, b, F_v, F_h, F, d, E, I, Z;
  let delta_v, delta_h, delta, theta_A, theta_B, U_b;
  let M, sigma_b, sigma_allow, Z_str, d_str;
  let delta_allow, I_rig, d_rig, theta_allow, I_slope;
  let n_delta, n_theta, n_str, _u;

  theta_allow = 0.001; // rad (Shigley Table 7-2 deep-groove ball bearing limit)

  if (isUS) {
    L = 24.0; // in
    a = 14.4; // in
    b = 9.6; // in (a > b => theta_B > theta_A)
    F_v = 900.0; // lb_f
    F_h = 340.0; // lb_f
    F = Math.hypot(F_v, F_h);
    d = 2.25; // in
    E = 29000.0; // ksi
    const E_psi = E * 1000;

    I = (Math.PI * Math.pow(d, 4)) / 64; // in^4
    Z = (Math.PI * Math.pow(d, 3)) / 32; // in^3

    delta_v = (F_v * a * a * b * b) / (3 * E_psi * I * L); // in
    delta_h = (F_h * a * a * b * b) / (3 * E_psi * I * L); // in
    delta = Math.hypot(delta_v, delta_h); // in
    theta_A = (F * a * b * (L + b)) / (6 * E_psi * I * L); // rad
    theta_B = (F * a * b * (L + a)) / (6 * E_psi * I * L); // rad
    U_b = 0.5 * F * delta; // in-lb_f

    M = (F * a * b) / L; // lb_f-in
    sigma_b = M / Z; // psi
    sigma_allow = 18000.0; // psi
    Z_str = M / sigma_allow; // in^3
    d_str = Math.cbrt((32 * Z_str) / Math.PI); // in

    delta_allow = 0.010; // in
    I_rig = (F * a * a * b * b) / (3 * E_psi * L * delta_allow);
    d_rig = Math.pow((64 * I_rig) / Math.PI, 0.25);
    I_slope = (F * a * b * (L + a)) / (6 * E_psi * L * theta_allow);

    n_delta = delta_allow / delta;
    n_theta = theta_allow / theta_B;
    n_str = sigma_allow / sigma_b;

    _u = {
      L: "in", a: "in", b: "in", F_v: "lb_f", F_h: "lb_f", F: "lb_f",
      d: "in", E: "ksi", I: "in^4", Z: "in^3",
      delta_v: "in", delta_h: "in", delta: "in",
      theta_A: "rad", theta_B: "rad", U_b: "in-lb_f",
      M: "lb_f-in", sigma_b: "psi", sigma_allow: "psi", Z_str: "in^3", d_str: "in",
      delta_allow: "in", I_rig: "in^4", d_rig: "in", theta_allow: "rad", I_slope: "in^4",
      n_delta: "dimless", n_theta: "dimless", n_str: "dimless"
    };
  } else {
    L = 600.0; // mm
    a = 360.0; // mm
    b = 240.0; // mm
    F_v = 4000.0; // N
    F_h = 1500.0; // N
    F = Math.hypot(F_v, F_h);
    d = 58.0; // mm
    E = 200.0; // GPa
    const E_mpa = E * 1000; // N/mm^2

    I = (Math.PI * Math.pow(d, 4)) / 64; // mm^4
    Z = (Math.PI * Math.pow(d, 3)) / 32; // mm^3

    delta_v = (F_v * a * a * b * b) / (3 * E_mpa * I * L); // mm
    delta_h = (F_h * a * a * b * b) / (3 * E_mpa * I * L); // mm
    delta = Math.hypot(delta_v, delta_h); // mm
    theta_A = (F * a * b * (L + b)) / (6 * E_mpa * I * L); // rad
    theta_B = (F * a * b * (L + a)) / (6 * E_mpa * I * L); // rad
    U_b = 0.5 * F * (delta / 1000); // J

    M = ((F * a * b) / L) / 1000; // N-m
    sigma_b = (M * 1000) / Z; // MPa
    sigma_allow = 120.0; // MPa
    Z_str = (M * 1000) / sigma_allow; // mm^3
    d_str = Math.cbrt((32 * Z_str) / Math.PI); // mm

    delta_allow = 0.25; // mm
    I_rig = (F * a * a * b * b) / (3 * E_mpa * L * delta_allow);
    d_rig = Math.pow((64 * I_rig) / Math.PI, 0.25);
    I_slope = (F * a * b * (L + a)) / (6 * E_mpa * L * theta_allow);

    n_delta = delta_allow / delta;
    n_theta = theta_allow / theta_B;
    n_str = sigma_allow / sigma_b;

    _u = {
      L: "mm", a: "mm", b: "mm", F_v: "N", F_h: "N", F: "N",
      d: "mm", E: "GPa", I: "mm^4", Z: "mm^3",
      delta_v: "mm", delta_h: "mm", delta: "mm",
      theta_A: "rad", theta_B: "rad", U_b: "J",
      M: "N-m", sigma_b: "MPa", sigma_allow: "MPa", Z_str: "mm^3", d_str: "mm",
      delta_allow: "mm", I_rig: "mm^4", d_rig: "mm", theta_allow: "rad", I_slope: "mm^4",
      n_delta: "dimless", n_theta: "dimless", n_str: "dimless"
    };
  }

  const _names = {};
  for (const [k, meta] of Object.entries(SHAFT_RIGIDITY_DEFLECTION_VARS_DB)) {
    _names[k] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    L, a, b, F_v, F_h, F, d, E, I, Z,
    delta_v, delta_h, delta, theta_A, theta_B, U_b,
    M, sigma_b, sigma_allow, Z_str, d_str,
    delta_allow, I_rig, d_rig, theta_allow, I_slope,
    n_delta, n_theta, n_str,
    _names, _u
  };
}
