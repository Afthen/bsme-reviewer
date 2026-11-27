/**
 * src/topics/machine_design/stress/static_failure/system.js
 * Ground-truth generator comparing ductile and brittle static failure theories
 * at a critical fourth-quadrant stress state (σ1 > 0 > σ2, |σ2| > σ1).
 */

import { STATIC_FAILURE_VARS_DB } from "./schema.js";

export function createStaticFailureSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let sigma_1, sigma_2, S_y, nu, S_ut, S_uc;
  let tau_max, S_sy_MSS, n_MSS, sigma_vm, S_sy_DE, n_DE;
  let sigma_SV, n_SV, sigma_BH, n_BH, n_MPS, n_CM, n_MM;
  let n_des, sigma_allow, tau_allow, F, A_req, _u;

  nu = 0.30;
  n_des = 2.0;

  if (isUS) {
    sigma_1 = 12.0; // ksi
    sigma_2 = -18.0; // ksi
    S_y = 48.0; // ksi
    S_ut = 30.0; // ksi
    S_uc = 90.0; // ksi
    F = 24.0; // kip
    A_req = F / (S_y / n_des); // in^2

    _u = {
      sigma_1: "ksi", sigma_2: "ksi", S_y: "ksi", nu: "dimless",
      S_ut: "ksi", S_uc: "ksi",
      tau_max: "ksi", S_sy_MSS: "ksi", n_MSS: "dimless",
      sigma_vm: "ksi", S_sy_DE: "ksi", n_DE: "dimless",
      sigma_SV: "ksi", n_SV: "dimless", sigma_BH: "ksi", n_BH: "dimless",
      n_MPS: "dimless", n_CM: "dimless", n_MM: "dimless",
      n_des: "dimless", sigma_allow: "ksi", tau_allow: "ksi",
      F: "kip", A_req: "in^2"
    };
  } else {
    sigma_1 = 80.0; // MPa
    sigma_2 = -120.0; // MPa
    S_y = 320.0; // MPa
    S_ut = 200.0; // MPa
    S_uc = 600.0; // MPa
    F = 120.0; // kN
    A_req = (F * 1000) / (S_y / n_des); // mm^2

    _u = {
      sigma_1: "MPa", sigma_2: "MPa", S_y: "MPa", nu: "dimless",
      S_ut: "MPa", S_uc: "MPa",
      tau_max: "MPa", S_sy_MSS: "MPa", n_MSS: "dimless",
      sigma_vm: "MPa", S_sy_DE: "MPa", n_DE: "dimless",
      sigma_SV: "MPa", n_SV: "dimless", sigma_BH: "MPa", n_BH: "dimless",
      n_MPS: "dimless", n_CM: "dimless", n_MM: "dimless",
      n_des: "dimless", sigma_allow: "MPa", tau_allow: "MPa",
      F: "kN", A_req: "mm^2"
    };
  }

  tau_max = (sigma_1 - sigma_2) / 2;
  S_sy_MSS = 0.5 * S_y;
  n_MSS = S_sy_MSS / tau_max;

  sigma_vm = Math.sqrt(sigma_1 * sigma_1 - sigma_1 * sigma_2 + sigma_2 * sigma_2);
  S_sy_DE = S_y / Math.sqrt(3);
  n_DE = S_y / sigma_vm;

  sigma_SV = nu * sigma_1 - sigma_2;
  n_SV = S_y / sigma_SV;

  sigma_BH = Math.sqrt(sigma_1 * sigma_1 - 2 * nu * sigma_1 * sigma_2 + sigma_2 * sigma_2);
  n_BH = S_y / sigma_BH;

  n_MPS = S_ut / sigma_1;
  n_CM = 1 / (sigma_1 / S_ut - sigma_2 / S_uc);
  n_MM = 1 / (sigma_1 / S_ut - (sigma_1 + sigma_2) / S_uc);

  sigma_allow = S_y / n_des;
  tau_allow = S_sy_DE / n_des;

  const _names = {};
  for (const [key, meta] of Object.entries(STATIC_FAILURE_VARS_DB)) {
    _names[key] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    sigma_1, sigma_2, S_y, nu, S_ut, S_uc,
    tau_max, S_sy_MSS, n_MSS, sigma_vm, S_sy_DE, n_DE,
    sigma_SV, n_SV, sigma_BH, n_BH, n_MPS, n_CM, n_MM,
    n_des, sigma_allow, tau_allow, F, A_req,
    _names, _u
  };
}
