/**
 * src/topics/machine_design/shafting/torsional_vibration/system.js
 * Ground-truth generator for Two-Rotor Stepped-Shaft Torsional Vibration.
 */

import { SHAFT_TORSIONAL_VIB_VARS_DB } from "./schema.js";

export function createShaftTorsionalVibSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let m_1, m_2, R_1, R_2, I_m1, I_m2, I_eq;
  let G, d_1, d_2, L_1, L_2, L_tot, J_1, J_2, L_eq;
  let k_t1, k_t2, k_teq, f_nt, omega_nt, n_ct, L_n1, L_n2;
  let theta_osc, T_osc, tau_osc, _u;

  theta_osc = 0.008; // rad

  if (isUS) {
    const gc = 32.174049;
    m_1 = 130.0; // lb_m
    m_2 = 90.0; // lb_m
    R_1 = 0.85; // ft
    R_2 = 0.65; // ft
    I_m1 = 0.5 * m_1 * R_1 * R_1; // lb_m*ft^2
    I_m2 = 0.5 * m_2 * R_2 * R_2; // lb_m*ft^2
    I_eq = 1 / (1 / I_m1 + 1 / I_m2);

    G = 11500.0; // ksi
    const G_psi = G * 1000;
    d_1 = 1.6; // in
    d_2 = 2.2; // in
    L_1 = 24.0; // in
    L_2 = 20.0; // in
    L_tot = L_1 + L_2;

    J_1 = (Math.PI * Math.pow(d_1, 4)) / 32; // in^4
    J_2 = (Math.PI * Math.pow(d_2, 4)) / 32; // in^4
    L_eq = L_1 + L_2 * (J_1 / J_2); // in

    k_t1 = (G_psi * J_1) / L_1; // lb_f-in/rad
    k_t2 = (G_psi * J_2) / L_2; // lb_f-in/rad
    k_teq = 1 / (1 / k_t1 + 1 / k_t2); // lb_f-in/rad

    // Convert I_eq (lb_m*ft^2) to lb_f-in*s^2: * 144 / (gc * 12) = * 12 / gc
    const I_eq_lbf_in_s2 = (I_eq * 12) / gc;
    f_nt = (1 / (2 * Math.PI)) * Math.sqrt((G_psi * J_1) / (L_eq * I_eq_lbf_in_s2)); // Hz
    omega_nt = 2 * Math.PI * f_nt; // rad/s
    n_ct = f_nt * 60; // rpm

    L_n1 = (L_tot * I_m2) / (I_m1 + I_m2); // in
    L_n2 = L_tot - L_n1; // in

    T_osc = k_teq * theta_osc; // lb_f-in
    tau_osc = (16 * T_osc) / (Math.PI * Math.pow(d_1, 3)); // psi

    _u = {
      m_1: "lb_m", m_2: "lb_m", R_1: "ft", R_2: "ft",
      I_m1: "lb_m*ft^2", I_m2: "lb_m*ft^2", I_eq: "lb_m*ft^2",
      G: "ksi", d_1: "in", d_2: "in", L_1: "in", L_2: "in", L_tot: "in",
      J_1: "in^4", J_2: "in^4", L_eq: "in",
      k_t1: "lb_f-in/rad", k_t2: "lb_f-in/rad", k_teq: "lb_f-in/rad",
      f_nt: "Hz", omega_nt: "rad/s", n_ct: "rpm",
      L_n1: "in", L_n2: "in", theta_osc: "rad", T_osc: "lb_f-in", tau_osc: "psi"
    };
  } else {
    m_1 = 60.0; // kg
    m_2 = 40.0; // kg
    R_1 = 0.25; // m
    R_2 = 0.20; // m
    I_m1 = 0.5 * m_1 * R_1 * R_1; // kg*m^2
    I_m2 = 0.5 * m_2 * R_2 * R_2; // kg*m^2
    I_eq = 1 / (1 / I_m1 + 1 / I_m2); // kg*m^2

    G = 80.0; // GPa
    const G_pa = G * 1e9;
    const G_mpa = G * 1000;
    d_1 = 40.0; // mm
    d_2 = 55.0; // mm
    L_1 = 600.0; // mm
    L_2 = 500.0; // mm
    L_tot = L_1 + L_2; // 1100 mm

    J_1 = (Math.PI * Math.pow(d_1, 4)) / 32; // mm^4
    J_2 = (Math.PI * Math.pow(d_2, 4)) / 32; // mm^4
    L_eq = L_1 + L_2 * (J_1 / J_2); // mm

    k_t1 = (G_mpa * J_1) / (L_1 * 1000); // N-m/rad
    k_t2 = (G_mpa * J_2) / (L_2 * 1000); // N-m/rad
    k_teq = 1 / (1 / k_t1 + 1 / k_t2); // N-m/rad

    const J1_m4 = J_1 * 1e-12;
    const Leq_m = L_eq / 1000;
    f_nt = (1 / (2 * Math.PI)) * Math.sqrt((G_pa * J1_m4) / (Leq_m * I_eq)); // Hz
    omega_nt = 2 * Math.PI * f_nt; // rad/s
    n_ct = f_nt * 60; // rpm

    L_n1 = (L_tot * I_m2) / (I_m1 + I_m2); // mm
    L_n2 = L_tot - L_n1; // mm

    T_osc = k_teq * theta_osc; // N-m
    tau_osc = (16 * T_osc * 1000) / (Math.PI * Math.pow(d_1, 3)); // MPa

    _u = {
      m_1: "kg", m_2: "kg", R_1: "m", R_2: "m",
      I_m1: "kg*m^2", I_m2: "kg*m^2", I_eq: "kg*m^2",
      G: "GPa", d_1: "mm", d_2: "mm", L_1: "mm", L_2: "mm", L_tot: "mm",
      J_1: "mm^4", J_2: "mm^4", L_eq: "mm",
      k_t1: "N-m/rad", k_t2: "N-m/rad", k_teq: "N-m/rad",
      f_nt: "Hz", omega_nt: "rad/s", n_ct: "rpm",
      L_n1: "mm", L_n2: "mm", theta_osc: "rad", T_osc: "N-m", tau_osc: "MPa"
    };
  }

  const _names = {};
  for (const [k, meta] of Object.entries(SHAFT_TORSIONAL_VIB_VARS_DB)) {
    _names[k] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    m_1, m_2, R_1, R_2, I_m1, I_m2, I_eq,
    G, d_1, d_2, L_1, L_2, L_tot, J_1, J_2, L_eq,
    k_t1, k_t2, k_teq, f_nt, omega_nt, n_ct,
    L_n1, L_n2, theta_osc, T_osc, tau_osc,
    _names, _u
  };
}
