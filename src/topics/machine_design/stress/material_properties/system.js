/**
 * src/topics/machine_design/stress/material_properties/system.js
 * Ground-truth generator for Material Properties & Elastic Constants (Ti-6Al-4V reference alloy).
 * Reference properties: Shigley's MED, Table A-5 (E ≈ 114 GPa / 16.5 Mpsi, ν ≈ 0.34, Sy ≈ 880 MPa / 128 ksi).
 */

import { MATERIAL_PROPERTIES_VARS_DB } from "./schema.js";

export function createMaterialPropertiesSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let d_0, A_0, L_0, E, nu, G, K, S_y, eps_y, u_r, sigma, F, n_s, epsilon, delta;
  let epsilon_lat, delta_d, tau, gamma, p_h, eps_v, L_f, d_f, A_f, pct_EL, pct_RA;
  let eps_f_true, eps_t, sigma_t, _u;

  if (isUS) {
    d_0 = 3.0; // in
    A_0 = (Math.PI * d_0 * d_0) / 4; // in^2
    L_0 = 8.0; // in
    E = 16500; // ksi
    nu = 0.34;
    G = E / (2 * (1 + nu)); // ksi
    K = E / (3 * (1 - 2 * nu)); // ksi
    S_y = 128; // ksi
    eps_y = S_y / E;
    u_r = 0.5 * S_y * eps_y * 1000; // psi
    sigma = 66; // ksi
    F = sigma * A_0; // kip
    n_s = S_y / sigma;
    epsilon = sigma / E; // 0.004
    delta = epsilon * L_0; // 0.032 in
    epsilon_lat = nu * epsilon; // 0.00136
    delta_d = epsilon_lat * d_0; // 0.00408 in
    tau = 25; // ksi
    gamma = tau / G;
    p_h = 30; // ksi
    eps_v = p_h / K;
    L_f = 9.12; // in
    d_f = 2.6; // in
    A_f = (Math.PI * d_f * d_f) / 4; // in^2
    pct_EL = ((L_f - L_0) / L_0) * 100;
    pct_RA = ((A_0 - A_f) / A_0) * 100;
    eps_f_true = Math.log(A_0 / A_f);
    eps_t = Math.log(1 + epsilon);
    sigma_t = sigma * (1 + epsilon);

    _u = {
      F: "kip", sigma: "ksi", tau: "ksi", E: "ksi", G: "ksi", K: "ksi",
      nu: "dimless", epsilon: "dimless", gamma: "dimless", S_y: "ksi", n_s: "dimless",
      d_0: "in", A_0: "in^2", L_0: "in", delta: "in",
      epsilon_lat: "dimless", delta_d: "in", p_h: "ksi", eps_v: "dimless",
      eps_y: "dimless", u_r: "psi", L_f: "in", d_f: "in", A_f: "in^2",
      pct_EL: "%", pct_RA: "%", eps_f_true: "dimless", eps_t: "dimless", sigma_t: "ksi"
    };
  } else {
    d_0 = 80; // mm
    A_0 = (Math.PI * d_0 * d_0) / 4; // mm^2
    L_0 = 200; // mm
    E = 114; // GPa
    nu = 0.34;
    G = E / (2 * (1 + nu)); // GPa
    K = E / (3 * (1 - 2 * nu)); // GPa
    S_y = 880; // MPa
    eps_y = S_y / (E * 1000);
    u_r = 0.5 * S_y * eps_y; // MPa
    sigma = 456; // MPa
    F = (sigma * A_0) / 1000; // kN
    n_s = S_y / sigma;
    epsilon = sigma / (E * 1000); // 0.004
    delta = epsilon * L_0; // 0.8 mm
    epsilon_lat = nu * epsilon; // 0.00136
    delta_d = epsilon_lat * d_0; // 0.1088 mm
    tau = 170; // MPa
    gamma = tau / (G * 1000);
    p_h = 200; // MPa
    eps_v = p_h / (K * 1000);
    L_f = 228; // mm
    d_f = 70; // mm
    A_f = (Math.PI * d_f * d_f) / 4; // mm^2
    pct_EL = ((L_f - L_0) / L_0) * 100;
    pct_RA = ((A_0 - A_f) / A_0) * 100;
    eps_f_true = Math.log(A_0 / A_f);
    eps_t = Math.log(1 + epsilon);
    sigma_t = sigma * (1 + epsilon);

    _u = {
      F: "kN", sigma: "MPa", tau: "MPa", E: "GPa", G: "GPa", K: "GPa",
      nu: "dimless", epsilon: "dimless", gamma: "dimless", S_y: "MPa", n_s: "dimless",
      d_0: "mm", A_0: "mm^2", L_0: "mm", delta: "mm",
      epsilon_lat: "dimless", delta_d: "mm", p_h: "MPa", eps_v: "dimless",
      eps_y: "dimless", u_r: "MPa", L_f: "mm", d_f: "mm", A_f: "mm^2",
      pct_EL: "%", pct_RA: "%", eps_f_true: "dimless", eps_t: "dimless", sigma_t: "MPa"
    };
  }

  const _names = {};
  for (const [key, meta] of Object.entries(MATERIAL_PROPERTIES_VARS_DB)) {
    _names[key] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    F, sigma, tau, E, G, K, nu, epsilon, gamma, S_y, n_s,
    d_0, A_0, L_0, delta, epsilon_lat, delta_d, p_h, eps_v,
    eps_y, u_r, L_f, d_f, A_f, pct_EL, pct_RA, eps_f_true, eps_t, sigma_t,
    _names, _u
  };
}
