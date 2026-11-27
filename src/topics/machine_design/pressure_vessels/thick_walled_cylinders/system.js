/**
 * src/topics/machine_design/pressure_vessels/thick_walled_cylinders/system.js
 * Independent ground truth generator for Thick-Walled Cylinders (Lamé Theory).
 * Material reference: High-Strength Alloy Steel (E = 205 GPa / 29500 ksi, Sy = 450 MPa / 65 ksi).
 */

import { THICK_WALLED_CYLINDERS_VARS_DB } from "./schema.js";

export function createThickWalledCylindersSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let D_i, D_o, r_i, r_o, t, p_i;
  let sigma_t_i, sigma_t_o, sigma_r_i, sigma_L, tau_max_i;
  let E, u_o, delta_D_o;
  let S_y, n_s, sigma_allow, _u;

  if (isUS) {
    E = 29500.0; // ksi
    S_y = 65.0; // ksi

    r_i = 4.0; // in
    r_o = 8.0; // in
    p_i = 10000.0; // psi (10 ksi)

    D_i = 2 * r_i; // 8 in
    D_o = 2 * r_o; // 16 in
    t = r_o - r_i; // 4 in

    const ro2 = r_o ** 2; // 64
    const ri2 = r_i ** 2; // 16
    const diff = ro2 - ri2; // 48
    const sum = ro2 + ri2; // 80

    sigma_t_i = (p_i * sum) / diff; // 16666.67 psi
    sigma_t_o = (2 * p_i * ri2) / diff; // 6666.67 psi
    sigma_r_i = p_i; // 10000 psi
    sigma_L = (p_i * ri2) / diff; // 3333.33 psi
    tau_max_i = (sigma_t_i + sigma_r_i) / 2; // 13333.33 psi

    const sig_to_ksi = sigma_t_o / 1000.0; // 6.66667 ksi
    u_o = (r_o * sig_to_ksi) / E; // 0.0018079 in
    delta_D_o = 2 * u_o; // 0.0036158 in

    const sig_ti_ksi = sigma_t_i / 1000.0; // 16.66667 ksi
    n_s = S_y / sig_ti_ksi; // 3.90
    sigma_allow = S_y / n_s; // 16.66667 ksi

    _u = {
      D_i: "in", D_o: "in", r_i: "in", r_o: "in", t: "in",
      p_i: "psi", sigma_t_i: "psi", sigma_t_o: "psi",
      sigma_r_i: "psi", sigma_L: "psi", tau_max_i: "psi",
      E: "ksi", u_o: "in", delta_D_o: "in",
      S_y: "ksi", n_s: "dimless", sigma_allow: "ksi"
    };
  } else {
    E = 205.0; // GPa
    S_y = 450.0; // MPa

    r_i = 100.0; // mm
    r_o = 200.0; // mm
    p_i = 60.0; // MPa

    D_i = 2 * r_i; // 200 mm
    D_o = 2 * r_o; // 400 mm
    t = r_o - r_i; // 100 mm

    const ro2 = r_o ** 2; // 40000
    const ri2 = r_i ** 2; // 10000
    const diff = ro2 - ri2; // 30000
    const sum = ro2 + ri2; // 50000

    sigma_t_i = (p_i * sum) / diff; // 100 MPa
    sigma_t_o = (2 * p_i * ri2) / diff; // 40 MPa
    sigma_r_i = p_i; // 60 MPa
    sigma_L = (p_i * ri2) / diff; // 20 MPa
    tau_max_i = (sigma_t_i + sigma_r_i) / 2; // 80 MPa

    const E_MPa = E * 1000.0; // 205000 MPa
    u_o = (r_o * sigma_t_o) / E_MPa; // 0.039024 mm
    delta_D_o = 2 * u_o; // 0.078049 mm

    n_s = S_y / sigma_t_i; // 4.50
    sigma_allow = S_y / n_s; // 100 MPa

    _u = {
      D_i: "mm", D_o: "mm", r_i: "mm", r_o: "mm", t: "mm",
      p_i: "MPa", sigma_t_i: "MPa", sigma_t_o: "MPa",
      sigma_r_i: "MPa", sigma_L: "MPa", tau_max_i: "MPa",
      E: "GPa", u_o: "mm", delta_D_o: "mm",
      S_y: "MPa", n_s: "dimless", sigma_allow: "MPa"
    };
  }

  const _names = {};
  for (const [key, meta] of Object.entries(THICK_WALLED_CYLINDERS_VARS_DB)) {
    _names[key] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    D_i, D_o, r_i, r_o, t, p_i,
    sigma_t_i, sigma_t_o, sigma_r_i, sigma_L, tau_max_i,
    E, u_o, delta_D_o,
    S_y, n_s, sigma_allow,
    _names, _u
  };
}
