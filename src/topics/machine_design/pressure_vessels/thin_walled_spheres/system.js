/**
 * src/topics/machine_design/pressure_vessels/thin_walled_spheres/system.js
 * Independent ground truth generator for Thin-Walled Spherical Pressure Vessels.
 * Material reference: ASTM A516 Grade 70 (E = 200 GPa / 29000 ksi, Sy = 260 MPa / 38 ksi, nu = 0.30).
 */

import { THIN_WALLED_SPHERES_VARS_DB } from "./schema.js";

export function createThinWalledSpheresSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let D_i, D_o, D_m, r_i, r_o, t, c_a, t_nom, p_i;
  let sigma_s, tau_max, F_sep;
  let E, nu, delta_D;
  let S_y, n_s, sigma_allow, _u;

  if (isUS) {
    E = 29000.0; // ksi
    nu = 0.30;
    S_y = 38.0; // ksi

    D_i = 48.0; // in
    t = 0.50; // in
    c_a = 0.125; // in
    p_i = 500.0; // psi

    r_i = D_i / 2; // 24 in
    r_o = r_i + t; // 24.5 in
    D_o = 2 * r_o; // 49 in
    D_m = (D_i + D_o) / 2; // 48.5 in
    t_nom = t + c_a; // 0.625 in

    sigma_s = (p_i * r_i) / (2 * t); // 12000 psi
    tau_max = sigma_s / 2; // 6000 psi
    F_sep = (p_i * Math.PI * (r_i ** 2)) / 1000.0; // 904.7787 kip

    const sig_s_ksi = sigma_s / 1000.0; // 12 ksi
    delta_D = (D_i * sig_s_ksi * (1 - nu)) / E; // 0.013895 in

    n_s = S_y / sig_s_ksi; // 3.16667
    sigma_allow = S_y / n_s; // 12 ksi

    _u = {
      D_i: "in", D_o: "in", D_m: "in", r_i: "in", r_o: "in",
      t: "in", c_a: "in", t_nom: "in",
      p_i: "psi", sigma_s: "psi", tau_max: "psi", F_sep: "kip",
      E: "ksi", nu: "dimless", delta_D: "in",
      S_y: "ksi", n_s: "dimless", sigma_allow: "ksi"
    };
  } else {
    E = 200.0; // GPa
    nu = 0.30;
    S_y = 260.0; // MPa

    D_i = 1200.0; // mm
    t = 12.0; // mm
    c_a = 3.0; // mm
    p_i = 3.0; // MPa

    r_i = D_i / 2; // 600 mm
    r_o = r_i + t; // 612 mm
    D_o = 2 * r_o; // 1224 mm
    D_m = (D_i + D_o) / 2; // 1212 mm
    t_nom = t + c_a; // 15 mm

    sigma_s = (p_i * r_i) / (2 * t); // 75 MPa
    tau_max = sigma_s / 2; // 37.5 MPa
    F_sep = (p_i * Math.PI * (r_i ** 2)) / 1000.0; // 3392.92 kN

    const E_MPa = E * 1000.0;
    delta_D = (D_i * sigma_s * (1 - nu)) / E_MPa; // 0.315 mm

    n_s = S_y / sigma_s; // 3.46667
    sigma_allow = S_y / n_s; // 75 MPa

    _u = {
      D_i: "mm", D_o: "mm", D_m: "mm", r_i: "mm", r_o: "mm",
      t: "mm", c_a: "mm", t_nom: "mm",
      p_i: "MPa", sigma_s: "MPa", tau_max: "MPa", F_sep: "kN",
      E: "GPa", nu: "dimless", delta_D: "mm",
      S_y: "MPa", n_s: "dimless", sigma_allow: "MPa"
    };
  }

  const _names = {};
  for (const [key, meta] of Object.entries(THIN_WALLED_SPHERES_VARS_DB)) {
    _names[key] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    D_i, D_o, D_m, r_i, r_o, t, c_a, t_nom, p_i,
    sigma_s, tau_max, F_sep,
    E, nu, delta_D,
    S_y, n_s, sigma_allow,
    _names, _u
  };
}
