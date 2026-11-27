/**
 * src/topics/machine_design/pressure_vessels/asme_shells_and_heads/system.js
 * Independent ground truth generator for ASME Section VIII Div 1 Shells and Heads.
 * Material: ASME SA-516 Grade 70 (Allowable S = 20.0 ksi = 138.0 MPa at design temp <= 500 deg F / 260 deg C).
 */

import { ASME_SHELLS_AND_HEADS_VARS_DB } from "./schema.js";

export function createAsmeShellsAndHeadsSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let P_des, S_allow, E_w, D_i, r_i, c_a, t_nom;
  let t_cyl_h, t_cyl_L, t_hemi, t_ellip, t_tori, L_c;
  let t_cone, alpha, t_flat, C_fac, d_c, _u;

  if (isUS) {
    P_des = 300.0; // psi
    S_allow = 20000.0; // psi (SA-516 Gr 70 allowable)
    E_w = 0.85; // dimless (Spot radiographed, Type 1 butt joint)
    D_i = 48.0; // in
    r_i = D_i / 2; // 24.0 in
    c_a = 0.125; // in
    L_c = D_i; // 48.0 in
    d_c = D_i; // 48.0 in
    alpha = 30.0; // deg
    C_fac = 0.33; // dimless

    const SE = S_allow * E_w; // 17000 psi

    t_cyl_h = (P_des * r_i) / (SE - 0.6 * P_des); // 0.428062 in
    t_nom = t_cyl_h + c_a; // 0.553062 in
    t_cyl_L = (P_des * r_i) / (2 * SE + 0.4 * P_des); // 0.211019 in
    t_hemi = (P_des * r_i) / (2 * SE - 0.2 * P_des); // 0.212145 in
    t_ellip = (P_des * D_i) / (2 * SE - 0.2 * P_des); // 0.424290 in
    t_tori = (0.885 * P_des * L_c) / (SE - 0.1 * P_des); // 0.751149 in

    const cosAlpha = Math.cos((alpha * Math.PI) / 180.0);
    t_cone = (P_des * D_i) / (2 * cosAlpha * (SE - 0.6 * P_des)); // 0.988567 in
    t_flat = d_c * Math.sqrt((C_fac * P_des) / SE); // 3.66205 in

    _u = {
      P_des: "psi", S_allow: "psi", E_w: "dimless",
      D_i: "in", r_i: "in", c_a: "in", t_nom: "in",
      t_cyl_h: "in", t_cyl_L: "in", t_hemi: "in",
      t_ellip: "in", t_tori: "in", L_c: "in",
      t_cone: "in", alpha: "°", t_flat: "in",
      C_fac: "dimless", d_c: "in"
    };
  } else {
    P_des = 2.0; // MPa
    S_allow = 138.0; // MPa
    E_w = 0.85; // dimless
    D_i = 1200.0; // mm
    r_i = D_i / 2; // 600.0 mm
    c_a = 3.0; // mm
    L_c = D_i; // 1200.0 mm
    d_c = D_i; // 1200.0 mm
    alpha = 30.0; // deg
    C_fac = 0.33; // dimless

    const SE = S_allow * E_w; // 117.3 MPa

    t_cyl_h = (P_des * r_i) / (SE - 0.6 * P_des); // 10.3359 mm
    t_nom = t_cyl_h + c_a; // 13.3359 mm
    t_cyl_L = (P_des * r_i) / (2 * SE + 0.4 * P_des); // 5.0977 mm
    t_hemi = (P_des * r_i) / (2 * SE - 0.2 * P_des); // 5.1238 mm
    t_ellip = (P_des * D_i) / (2 * SE - 0.2 * P_des); // 10.2476 mm
    t_tori = (0.885 * P_des * L_c) / (SE - 0.1 * P_des); // 18.1383 mm

    const cosAlpha = Math.cos((alpha * Math.PI) / 180.0);
    t_cone = (P_des * D_i) / (2 * cosAlpha * (SE - 0.6 * P_des)); // 11.9349 mm
    t_flat = d_c * Math.sqrt((C_fac * P_des) / SE); // 90.0128 mm

    _u = {
      P_des: "MPa", S_allow: "MPa", E_w: "dimless",
      D_i: "mm", r_i: "mm", c_a: "mm", t_nom: "mm",
      t_cyl_h: "mm", t_cyl_L: "mm", t_hemi: "mm",
      t_ellip: "mm", t_tori: "mm", L_c: "mm",
      t_cone: "mm", alpha: "°", t_flat: "mm",
      C_fac: "dimless", d_c: "mm"
    };
  }

  const _names = {};
  for (const [key, meta] of Object.entries(ASME_SHELLS_AND_HEADS_VARS_DB)) {
    _names[key] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    P_des, S_allow, E_w, D_i, r_i, c_a, t_nom,
    t_cyl_h, t_cyl_L, t_hemi, t_ellip, t_tori, L_c,
    t_cone, alpha, t_flat, C_fac, d_c,
    _names, _u
  };
}
