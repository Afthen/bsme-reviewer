/**
 * src/topics/machine_design/stress/shear_and_bearing/system.js
 * Ground-truth generator for Direct Shear, Bearing & Plate Connections.
 * Reference: Hibbeler, Mechanics of Materials, Sec. 1.3–1.6; Shigley's MED, Sec. 1.
 */

import { SHEAR_BEARING_VARS_DB } from "./schema.js";

export function createShearBearingSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let F, d, n_s, n_f, t, w, e_edge, A_s, tau, A_b, sigma_br;
  let A_net, sigma_net, A_tear, tau_tear, S_y, S_sy, S_yc;
  let n_sh, n_br, n_tn, n_tr, _u;

  if (isUS) {
    d = 0.75; // in
    n_s = 2; // double shear
    n_f = 2; // two pins/rivets
    t = 0.5; // in
    w = 5.0; // in
    e_edge = 1.5; // in
    F = 18.0; // kip
    S_y = 36.0; // ksi
    S_sy = 21.0; // ksi
    S_yc = 50.0; // ksi

    A_s = (Math.PI * d * d) / 4; // in^2
    tau = F / (n_s * n_f * A_s); // ksi
    A_b = t * d; // in^2
    sigma_br = F / (n_f * A_b); // ksi
    A_net = (w - n_f * d) * t; // in^2
    sigma_net = F / A_net; // ksi
    A_tear = 2 * e_edge * t; // in^2
    tau_tear = F / (n_f * A_tear); // ksi

    n_sh = S_sy / tau;
    n_br = S_yc / sigma_br;
    n_tn = S_y / sigma_net;
    n_tr = S_sy / tau_tear;

    _u = {
      F: "kip", d: "in", n_s: "dimless", n_f: "dimless",
      t: "in", w: "in", e_edge: "in",
      A_s: "in^2", tau: "ksi", A_b: "in^2", sigma_br: "ksi",
      A_net: "in^2", sigma_net: "ksi", A_tear: "in^2", tau_tear: "ksi",
      S_y: "ksi", S_sy: "ksi", S_yc: "ksi",
      n_sh: "dimless", n_br: "dimless", n_tn: "dimless", n_tr: "dimless"
    };
  } else {
    d = 20.0; // mm
    n_s = 2;
    n_f = 2;
    t = 12.0; // mm
    w = 120.0; // mm
    e_edge = 35.0; // mm
    F = 80.0; // kN
    S_y = 250.0; // MPa
    S_sy = 145.0; // MPa
    S_yc = 350.0; // MPa

    A_s = (Math.PI * d * d) / 4; // mm^2
    tau = (F * 1000) / (n_s * n_f * A_s); // MPa
    A_b = t * d; // mm^2
    sigma_br = (F * 1000) / (n_f * A_b); // MPa
    A_net = (w - n_f * d) * t; // mm^2
    sigma_net = (F * 1000) / A_net; // MPa
    A_tear = 2 * e_edge * t; // mm^2
    tau_tear = (F * 1000) / (n_f * A_tear); // MPa

    n_sh = S_sy / tau;
    n_br = S_yc / sigma_br;
    n_tn = S_y / sigma_net;
    n_tr = S_sy / tau_tear;

    _u = {
      F: "kN", d: "mm", n_s: "dimless", n_f: "dimless",
      t: "mm", w: "mm", e_edge: "mm",
      A_s: "mm^2", tau: "MPa", A_b: "mm^2", sigma_br: "MPa",
      A_net: "mm^2", sigma_net: "MPa", A_tear: "mm^2", tau_tear: "MPa",
      S_y: "MPa", S_sy: "MPa", S_yc: "MPa",
      n_sh: "dimless", n_br: "dimless", n_tn: "dimless", n_tr: "dimless"
    };
  }

  const _names = {};
  for (const [key, meta] of Object.entries(SHEAR_BEARING_VARS_DB)) {
    _names[key] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    F, d, n_s, n_f, t, w, e_edge, A_s, tau, A_b, sigma_br,
    A_net, sigma_net, A_tear, tau_tear, S_y, S_sy, S_yc,
    n_sh, n_br, n_tn, n_tr,
    _names, _u
  };
}
