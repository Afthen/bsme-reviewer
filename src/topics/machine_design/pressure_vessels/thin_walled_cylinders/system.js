/**
 * src/topics/machine_design/pressure_vessels/thin_walled_cylinders/system.js
 * Independent ground truth generator for Thin-Walled Cylindrical Pressure Vessels.
 * Material reference: ASTM A516 Grade 70 Carbon Steel (E = 200 GPa / 29000 ksi, Sy = 260 MPa / 38 ksi, nu = 0.30).
 */

import { THIN_WALLED_CYLINDERS_VARS_DB } from "./schema.js";

export function createThinWalledCylindersSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let D_i, D_o, D_m, r_i, r_o, t, L, c_a, t_nom, p_i;
  let sigma_h, sigma_L, tau_max_in, tau_max, F_L;
  let E, nu, delta_D, delta_L;
  let S_y, n_s, sigma_allow, _u;

  if (isUS) {
    E = 29000.0; // ksi
    nu = 0.30; // dimless
    S_y = 38.0; // ksi (ASTM A516 Gr 70)

    D_i = 72.0; // in
    t = 0.50; // in
    c_a = 0.125; // in
    L = 240.0; // in
    p_i = 300.0; // psi

    r_i = D_i / 2; // 36 in
    r_o = r_i + t; // 36.5 in
    D_o = 2 * r_o; // 73 in
    D_m = (D_i + D_o) / 2; // 72.5 in
    t_nom = t + c_a; // 0.625 in

    sigma_h = (p_i * r_i) / t; // 21600 psi
    sigma_L = (p_i * r_i) / (2 * t); // 10800 psi
    tau_max_in = (sigma_h - sigma_L) / 2; // 5400 psi
    tau_max = sigma_h / 2; // 10800 psi
    F_L = (p_i * Math.PI * (r_i ** 2)) / 1000.0; // 1221.45 kip

    const sig_h_ksi = sigma_h / 1000.0; // 21.6 ksi
    const sig_L_ksi = sigma_L / 1000.0; // 10.8 ksi

    delta_D = (D_i * (sig_h_ksi - nu * sig_L_ksi)) / E; // 0.045583 in
    delta_L = (L * (sig_L_ksi - nu * sig_h_ksi)) / E; // 0.035752 in

    n_s = S_y / sig_h_ksi; // 1.75926
    sigma_allow = S_y / n_s; // 21.6 ksi

    _u = {
      D_i: "in", D_o: "in", D_m: "in", r_i: "in", r_o: "in",
      t: "in", L: "in", c_a: "in", t_nom: "in",
      p_i: "psi", sigma_h: "psi", sigma_L: "psi",
      tau_max_in: "psi", tau_max: "psi", F_L: "kip",
      E: "ksi", nu: "dimless", delta_D: "in", delta_L: "in",
      S_y: "ksi", n_s: "dimless", sigma_allow: "ksi"
    };
  } else {
    E = 200.0; // GPa
    nu = 0.30; // dimless
    S_y = 260.0; // MPa (ASTM A516 Gr 70)

    D_i = 2000.0; // mm
    t = 12.0; // mm
    c_a = 3.0; // mm
    L = 6000.0; // mm
    p_i = 1.8; // MPa

    r_i = D_i / 2; // 1000 mm
    r_o = r_i + t; // 1012 mm
    D_o = 2 * r_o; // 2024 mm
    D_m = (D_i + D_o) / 2; // 2012 mm
    t_nom = t + c_a; // 15 mm

    sigma_h = (p_i * r_i) / t; // 150 MPa
    sigma_L = (p_i * r_i) / (2 * t); // 75 MPa
    tau_max_in = (sigma_h - sigma_L) / 2; // 37.5 MPa
    tau_max = sigma_h / 2; // 75 MPa

    F_L = (p_i * Math.PI * (r_i ** 2)) / 1000.0; // 5654.867 kN

    const E_MPa = E * 1000.0;
    delta_D = (D_i * (sigma_h - nu * sigma_L)) / E_MPa; // 1.275 mm
    delta_L = (L * (sigma_L - nu * sigma_h)) / E_MPa; // 0.900 mm

    n_s = S_y / sigma_h; // 1.73333
    sigma_allow = S_y / n_s; // 150 MPa

    _u = {
      D_i: "mm", D_o: "mm", D_m: "mm", r_i: "mm", r_o: "mm",
      t: "mm", L: "mm", c_a: "mm", t_nom: "mm",
      p_i: "MPa", sigma_h: "MPa", sigma_L: "MPa",
      tau_max_in: "MPa", tau_max: "MPa", F_L: "kN",
      E: "GPa", nu: "dimless", delta_D: "mm", delta_L: "mm",
      S_y: "MPa", n_s: "dimless", sigma_allow: "MPa"
    };
  }

  const _names = {};
  for (const [key, meta] of Object.entries(THIN_WALLED_CYLINDERS_VARS_DB)) {
    _names[key] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    D_i, D_o, D_m, r_i, r_o, t, L, c_a, t_nom, p_i,
    sigma_h, sigma_L, tau_max_in, tau_max, F_L,
    E, nu, delta_D, delta_L,
    S_y, n_s, sigma_allow,
    _names, _u
  };
}
