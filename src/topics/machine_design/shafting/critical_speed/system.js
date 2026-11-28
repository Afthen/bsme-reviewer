/**
 * src/topics/machine_design/shafting/critical_speed/system.js
 * Ground-truth generator for Two-Rotor Lateral Critical Speed & Jeffcott Unbalance Whirl.
 */

import { SHAFT_CRITICAL_SPEED_VARS_DB } from "./schema.js";

export function createShaftCriticalSpeedSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let g, m_1, m_2, W_1, delta_1, delta_2, k_1;
  let f_1, f_2, f_D, f_R, omega_D, n_D, n_op, omega, f_op, r_cr, r_1;
  let e_unb, F_u, y_w, F_dyn, _u;

  n_op = 1200.0; // rpm
  omega = (2 * Math.PI * n_op) / 60; // rad/s
  f_op = n_op / 60; // 20 Hz

  if (isUS) {
    g = 32.2; // ft/s^2
    const gc = 32.174049;
    const g_in = g * 12; // in/s^2
    m_1 = 75.0; // lb_m
    m_2 = 55.0; // lb_m
    W_1 = m_1 * (g / gc); // lb_f
    delta_1 = 0.0085; // in
    delta_2 = 0.0055; // in
    k_1 = W_1 / delta_1; // lb_f/in

    f_1 = (1 / (2 * Math.PI)) * Math.sqrt(g_in / delta_1); // Hz
    f_2 = (1 / (2 * Math.PI)) * Math.sqrt(g_in / delta_2); // Hz
    f_D = 1 / Math.hypot(1 / f_1, 1 / f_2); // Hz
    f_R = (1 / (2 * Math.PI)) * Math.sqrt(
      (g_in * (m_1 * delta_1 + m_2 * delta_2)) /
      (m_1 * delta_1 * delta_1 + m_2 * delta_2 * delta_2)
    );
    omega_D = 2 * Math.PI * f_D;
    n_D = f_D * 60; // rpm
    r_cr = n_op / n_D;
    r_1 = f_op / f_1;

    e_unb = 0.0025; // in
    F_u = 4 * Math.PI * Math.PI * (m_1 / (gc * 12)) * e_unb * f_op * f_op; // lb_f
    y_w = (e_unb * r_1 * r_1) / (1 - r_1 * r_1); // in
    F_dyn = k_1 * y_w; // lb_f

    _u = {
      g: "ft/s^2", m_1: "lb_m", m_2: "lb_m", W_1: "lb_f",
      delta_1: "in", delta_2: "in", k_1: "lb_f/in",
      f_1: "Hz", f_2: "Hz", f_D: "Hz", f_R: "Hz",
      omega_D: "rad/s", n_D: "rpm", n_op: "rpm", omega: "rad/s", f_op: "Hz",
      r_cr: "dimless", r_1: "dimless", e_unb: "in", F_u: "lb_f", y_w: "in", F_dyn: "lb_f"
    };
  } else {
    g = 9.81; // m/s^2
    m_1 = 35.0; // kg
    m_2 = 25.0; // kg
    W_1 = m_1 * g; // N
    delta_1 = 0.22; // mm
    delta_2 = 0.14; // mm
    k_1 = W_1 / delta_1; // N/mm

    const d1_m = delta_1 / 1000;
    const d2_m = delta_2 / 1000;
    f_1 = (1 / (2 * Math.PI)) * Math.sqrt(g / d1_m); // Hz
    f_2 = (1 / (2 * Math.PI)) * Math.sqrt(g / d2_m); // Hz
    f_D = 1 / Math.hypot(1 / f_1, 1 / f_2); // Hz
    f_R = (1 / (2 * Math.PI)) * Math.sqrt(
      (g * (m_1 * d1_m + m_2 * d2_m)) /
      (m_1 * d1_m * d1_m + m_2 * d2_m * d2_m)
    );
    omega_D = 2 * Math.PI * f_D;
    n_D = f_D * 60; // rpm
    r_cr = n_op / n_D;
    r_1 = f_op / f_1;

    e_unb = 0.06; // mm (60 um)
    F_u = 4 * Math.PI * Math.PI * m_1 * (e_unb / 1000) * f_op * f_op; // N
    y_w = (e_unb * r_1 * r_1) / (1 - r_1 * r_1); // mm
    F_dyn = k_1 * y_w; // N

    _u = {
      g: "m/s^2", m_1: "kg", m_2: "kg", W_1: "N",
      delta_1: "mm", delta_2: "mm", k_1: "N/mm",
      f_1: "Hz", f_2: "Hz", f_D: "Hz", f_R: "Hz",
      omega_D: "rad/s", n_D: "rpm", n_op: "rpm", omega: "rad/s", f_op: "Hz",
      r_cr: "dimless", r_1: "dimless", e_unb: "mm", F_u: "N", y_w: "mm", F_dyn: "N"
    };
  }

  const _names = {};
  for (const [k, meta] of Object.entries(SHAFT_CRITICAL_SPEED_VARS_DB)) {
    _names[k] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    g, m_1, m_2, W_1, delta_1, delta_2, k_1,
    f_1, f_2, f_D, f_R, omega_D, n_D, n_op, omega, f_op,
    r_cr, r_1, e_unb, F_u, y_w, F_dyn,
    _names, _u
  };
}
