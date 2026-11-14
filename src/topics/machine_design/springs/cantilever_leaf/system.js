/**
 * src/topics/machine_design/springs/cantilever_leaf/system.js
 * Ground truth generator for Cantilever Leaf Springs (mirrors Video Problem 4).
 */

import { CANTILEVER_LEAF_VARS_DB } from "./schema.js";

export function createCantileverLeafSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let F, L, delta, S, n_leaves, b, t, E, k, _u;

  if (isUS) {
    // Problem 4 exact values: 6-leaf steel, 13 in long, 375 lb, delta = 1.25 in, S = 50,000 psi
    n_leaves = 6;
    L = 13.0; // in
    F = 375.0; // lb
    delta = 1.25; // in
    S = 50000.0; // psi
    E = 30e6; // psi (steel)

    // delta = S*L^2 / (t*E) => t = S*L^2 / (delta*E)
    t = (S * Math.pow(L, 2)) / (delta * E); // 0.22533 in (~0.225 in)
    // S = 6*F*L / (n*b*t^2) => b = 6*F*L / (n*S*t^2)
    b = (6 * F * L) / (n_leaves * S * Math.pow(t, 2)); // ~1.926 in
    k = F / delta; // 300 lb/in

    _u = {
      F: "lb", delta: "in", S: "psi", L: "in",
      b: "in", t: "in", n_leaves: "dimless", E: "psi", k: "lb/in"
    };
  } else {
    // SI metric counterpart
    n_leaves = 6;
    L = 350.0; // mm
    F = 1800.0; // N
    S = 350.0; // MPa
    E = 207.0; // GPa = 207000 MPa
    delta = 30.0; // mm

    const E_mmpa = E * 1000;
    t = (S * Math.pow(L, 2)) / (delta * E_mmpa); // mm
    b = (6 * F * L) / (n_leaves * S * Math.pow(t, 2)); // mm
    k = F / delta; // N/mm

    _u = {
      F: "N", delta: "mm", S: "MPa", L: "mm",
      b: "mm", t: "mm", n_leaves: "dimless", E: "GPa", k: "N/mm"
    };
  }

  const _names = {};
  for (const [key, meta] of Object.entries(CANTILEVER_LEAF_VARS_DB)) {
    _names[key] = meta.nameAliases?.[0] || meta.name;
  }

  return { sys, F, delta, S, L, b, t, n_leaves, E, k, _names, _u };
}
