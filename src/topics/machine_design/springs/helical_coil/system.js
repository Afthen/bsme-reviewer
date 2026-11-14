/**
 * src/topics/machine_design/springs/helical_coil/system.js
 * Independent ground-truth generator for helical coil springs.
 */

import { HELICAL_COIL_VARS_DB } from "./schema.js";

export function createHelicalCoilSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  // End connection: standard Squared & Ground (n_dead = 2, k_end = 2)
  const n_dead = 2;
  const k_end = 2;

  let d_w, C, D_m, R_m, D_o, D_i, p, n_e, n_a, SL, FL, delta_solid, alpha, L_wire;
  let K_w, K_b, K_s, K_c, G, k, F, delta, OL, S_f, SPE;
  let F_1, F_2, dF, delta_1, delta_2, ddelta, OL_1, OL_2;
  let _u;

  if (isUS) {
    d_w = 0.25; // in
    C = 8.0;
    D_m = C * d_w; // 2.0 in
    R_m = D_m / 2; // 1.0 in
    D_o = D_m + d_w; // 2.25 in
    D_i = D_m - d_w; // 1.75 in
    p = 0.6; // in
    n_e = 10.0;
    n_a = n_e + n_dead; // 12.0
    SL = (n_e + k_end) * d_w; // 3.0 in
    FL = n_e * p + k_end * d_w; // 6.5 in
    delta_solid = FL - SL; // 3.5 in
    alpha = Math.atan(p / (Math.PI * D_m)) * (180 / Math.PI); // deg
    L_wire = Math.PI * D_m * n_e; // 62.8319 in

    K_w = (4 * C - 1) / (4 * C - 4) + 0.615 / C; // ~1.184018
    K_b = (4 * C + 2) / (4 * C - 3); // ~1.172414
    K_s = 1 + 1 / (2 * C); // 1.0625
    K_c = K_w / K_s; // ~1.11437

    G = 11.5e6; // psi
    k = (G * d_w) / (8 * Math.pow(C, 3) * n_e); // ~70.19043 lb/in
    F = 100.0; // lb
    delta = F / k; // ~1.4247 in
    OL = FL - delta; // ~5.0753 in
    S_f = (8 * K_w * F * C) / (Math.PI * Math.pow(d_w, 2)); // ~38590.2 psi
    SPE = 0.5 * F * delta; // in-lb

    F_1 = 50.0;
    F_2 = 120.0;
    dF = F_2 - F_1;
    delta_1 = F_1 / k;
    delta_2 = F_2 / k;
    ddelta = delta_2 - delta_1;
    OL_1 = FL - delta_1;
    OL_2 = FL - delta_2;

    _u = {
      F: "lb", delta: "in", k: "lb/in", SPE: "in-lb",
      D_m: "in", D_o: "in", D_i: "in", R_m: "in", d_w: "in", C: "dimless",
      p: "in", alpha: "°", L_wire: "in",
      n_e: "dimless", n_a: "dimless", n_dead: "dimless", k_end: "dimless",
      S_f: "psi", G: "psi", K_w: "dimless", K_b: "dimless", K_s: "dimless", K_c: "dimless",
      FL: "in", SL: "in", OL: "in", delta_solid: "in",
      F_1: "lb", F_2: "lb", dF: "lb",
      delta_1: "in", delta_2: "in", ddelta: "in",
      OL_1: "in", OL_2: "in"
    };
  } else {
    d_w = 10.0; // mm
    C = 8.0;
    D_m = C * d_w; // 80 mm
    R_m = D_m / 2; // 40 mm
    D_o = D_m + d_w; // 90 mm
    D_i = D_m - d_w; // 70 mm
    p = 25.0; // mm
    n_e = 10.0;
    n_a = n_e + n_dead; // 12.0
    SL = (n_e + k_end) * d_w; // 120 mm
    FL = n_e * p + k_end * d_w; // 270 mm
    delta_solid = FL - SL; // 150 mm
    alpha = Math.atan(p / (Math.PI * D_m)) * (180 / Math.PI); // deg
    L_wire = Math.PI * D_m * n_e; // 2513.27 mm

    K_w = (4 * C - 1) / (4 * C - 4) + 0.615 / C; // ~1.184018
    K_b = (4 * C + 2) / (4 * C - 3); // ~1.172414
    K_s = 1 + 1 / (2 * C); // 1.0625
    K_c = K_w / K_s; // ~1.11437

    G = 80.0; // GPa
    // In mm and N: G = 80000 N/mm^2
    const G_mmpa = G * 1000;
    k = (G_mmpa * d_w) / (8 * Math.pow(C, 3) * n_e); // 19.53125 N/mm
    F = 500.0; // N
    delta = F / k; // 25.6 mm
    OL = FL - delta; // 244.4 mm
    S_f = (8 * K_w * F * C) / (Math.PI * Math.pow(d_w, 2)); // ~120.6 MPa
    SPE = (0.5 * F * delta) / 1000; // J (N-m)

    F_1 = 300.0;
    F_2 = 600.0;
    dF = F_2 - F_1;
    delta_1 = F_1 / k;
    delta_2 = F_2 / k;
    ddelta = delta_2 - delta_1;
    OL_1 = FL - delta_1;
    OL_2 = FL - delta_2;

    _u = {
      F: "N", delta: "mm", k: "N/mm", SPE: "J",
      D_m: "mm", D_o: "mm", D_i: "mm", R_m: "mm", d_w: "mm", C: "dimless",
      p: "mm", alpha: "°", L_wire: "mm",
      n_e: "dimless", n_a: "dimless", n_dead: "dimless", k_end: "dimless",
      S_f: "MPa", G: "GPa", K_w: "dimless", K_b: "dimless", K_s: "dimless", K_c: "dimless",
      FL: "mm", SL: "mm", OL: "mm", delta_solid: "mm",
      F_1: "N", F_2: "N", dF: "N",
      delta_1: "mm", delta_2: "mm", ddelta: "mm",
      OL_1: "mm", OL_2: "mm"
    };
  }

  const _names = {};
  for (const [k_key, meta] of Object.entries(HELICAL_COIL_VARS_DB)) {
    _names[k_key] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    F, delta, k, SPE,
    D_m, D_o, D_i, R_m, d_w, C, p, alpha, L_wire,
    n_e, n_a, n_dead, k_end,
    S_f, G, K_w, K_b, K_s, K_c,
    FL, SL, OL, delta_solid,
    F_1, F_2, dF, delta_1, delta_2, ddelta, OL_1, OL_2,
    _names, _u
  };
}
