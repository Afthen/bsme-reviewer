/**
 * src/topics/machine_design/shafting/rigidity_torsion/system.js
 * Ground-truth generator for 3-Segment Stepped Shaft Torsional Rigidity vs. Shear Strength.
 */

import { SHAFT_RIGIDITY_TORSION_VARS_DB } from "./schema.js";

export function createShaftRigidityTorsionSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let n_op, omega, P, T, G;
  let L_1, L_2, L_3, L_tot, d_1, d_2, d_3, J_1, J_2, J_3;
  let theta_1, theta_2, theta_3, theta_tot, k_t, J_eq, d_eq;
  let theta_allow, J_rig, d_rig_T, tau_allow, Z_p_str, d_str_T, n_theta, _u;

  n_op = 750.0; // rpm
  omega = (2 * Math.PI * n_op) / 60; // rad/s
  theta_allow = 0.025; // rad (~1.43° across stepped span)

  if (isUS) {
    P = 60.0; // hp
    T = (P * 550 * 12) / omega; // lb_f-in
    G = 11500.0; // ksi
    const G_psi = G * 1000;

    L_1 = 12.0; // in
    L_2 = 20.0; // in
    L_3 = 16.0; // in
    L_tot = L_1 + L_2 + L_3; // 48.0 in

    d_1 = 1.65; // in
    d_2 = 2.05; // in
    d_3 = 1.75; // in
    J_1 = (Math.PI * Math.pow(d_1, 4)) / 32;
    J_2 = (Math.PI * Math.pow(d_2, 4)) / 32;
    J_3 = (Math.PI * Math.pow(d_3, 4)) / 32;

    theta_1 = (T * L_1) / (G_psi * J_1);
    theta_2 = (T * L_2) / (G_psi * J_2);
    theta_3 = (T * L_3) / (G_psi * J_3);
    theta_tot = theta_1 + theta_2 + theta_3;
    k_t = T / theta_tot; // lb_f-in/rad

    J_eq = (T * L_tot) / (G_psi * theta_tot);
    d_eq = Math.pow((32 * J_eq) / Math.PI, 0.25);

    J_rig = (T * L_tot) / (G_psi * theta_allow);
    d_rig_T = Math.pow((32 * J_rig) / Math.PI, 0.25);

    tau_allow = 8700.0; // psi
    Z_p_str = T / tau_allow;
    d_str_T = Math.cbrt((16 * Z_p_str) / Math.PI);
    n_theta = theta_allow / theta_tot;

    _u = {
      n_op: "rpm", omega: "rad/s", P: "hp", T: "lb_f-in", G: "ksi",
      L_1: "in", L_2: "in", L_3: "in", L_tot: "in",
      d_1: "in", d_2: "in", d_3: "in", J_1: "in^4", J_2: "in^4", J_3: "in^4",
      theta_1: "rad", theta_2: "rad", theta_3: "rad", theta_tot: "rad",
      k_t: "lb_f-in/rad", J_eq: "in^4", d_eq: "in",
      theta_allow: "rad", J_rig: "in^4", d_rig_T: "in",
      tau_allow: "psi", Z_p_str: "in^3", d_str_T: "in", n_theta: "dimless"
    };
  } else {
    P = 45.0; // kW
    T = (P * 1000) / omega; // N-m
    G = 80.0; // GPa
    const G_mpa = G * 1000;

    L_1 = 300.0; // mm
    L_2 = 500.0; // mm
    L_3 = 400.0; // mm
    L_tot = L_1 + L_2 + L_3; // 1200.0 mm

    d_1 = 42.0; // mm
    d_2 = 52.0; // mm
    d_3 = 45.0; // mm
    J_1 = (Math.PI * Math.pow(d_1, 4)) / 32;
    J_2 = (Math.PI * Math.pow(d_2, 4)) / 32;
    J_3 = (Math.PI * Math.pow(d_3, 4)) / 32;

    const T_nmm = T * 1000;
    theta_1 = (T_nmm * L_1) / (G_mpa * J_1);
    theta_2 = (T_nmm * L_2) / (G_mpa * J_2);
    theta_3 = (T_nmm * L_3) / (G_mpa * J_3);
    theta_tot = theta_1 + theta_2 + theta_3;
    k_t = T / theta_tot; // N-m/rad

    J_eq = (T_nmm * L_tot) / (G_mpa * theta_tot);
    d_eq = Math.pow((32 * J_eq) / Math.PI, 0.25);

    J_rig = (T_nmm * L_tot) / (G_mpa * theta_allow);
    d_rig_T = Math.pow((32 * J_rig) / Math.PI, 0.25);

    tau_allow = 60.0; // MPa
    Z_p_str = T_nmm / tau_allow; // mm^3
    d_str_T = Math.cbrt((16 * Z_p_str) / Math.PI);
    n_theta = theta_allow / theta_tot;

    _u = {
      n_op: "rpm", omega: "rad/s", P: "kW", T: "N-m", G: "GPa",
      L_1: "mm", L_2: "mm", L_3: "mm", L_tot: "mm",
      d_1: "mm", d_2: "mm", d_3: "mm", J_1: "mm^4", J_2: "mm^4", J_3: "mm^4",
      theta_1: "rad", theta_2: "rad", theta_3: "rad", theta_tot: "rad",
      k_t: "N-m/rad", J_eq: "mm^4", d_eq: "mm",
      theta_allow: "rad", J_rig: "mm^4", d_rig_T: "mm",
      tau_allow: "MPa", Z_p_str: "mm^3", d_str_T: "mm", n_theta: "dimless"
    };
  }

  const _names = {};
  for (const [k, meta] of Object.entries(SHAFT_RIGIDITY_TORSION_VARS_DB)) {
    _names[k] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    n_op, omega, P, T, G,
    L_1, L_2, L_3, L_tot, d_1, d_2, d_3, J_1, J_2, J_3,
    theta_1, theta_2, theta_3, theta_tot, k_t, J_eq, d_eq,
    theta_allow, J_rig, d_rig_T, tau_allow, Z_p_str, d_str_T, n_theta,
    _names, _u
  };
}
