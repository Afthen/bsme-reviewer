/**
 * src/topics/machine_design/stress/axial_members/system.js
 * Ground-truth generator for Stepped & Statically Indeterminate Axial Bars.
 * Reference: Beer & Johnston, Mechanics of Materials, Ch. 2 (Steel E=200 GPa / 29e3 ksi; Al E=70 GPa / 10e3 ksi).
 */

import { AXIAL_MEMBERS_VARS_DB } from "./schema.js";

export function createAxialMembersSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let P, R_1, R_2, A_1, A_2, L_1, L_2, L_tot, E_1, E_2;
  let k_1, k_2, k_par, k_ser, delta_j, sigma_1, sigma_2, eps_1, eps_2;
  let delta_1_ser, delta_2_ser, delta_ser, _u;

  if (isUS) {
    A_1 = 1.2; // in^2
    L_1 = 48.0; // in
    E_1 = 29000; // ksi (structural steel)
    A_2 = 1.8; // in^2
    L_2 = 32.0; // in
    E_2 = 10000; // ksi (aluminum)

    L_tot = L_1 + L_2; // 80 in
    k_1 = (A_1 * E_1) / L_1; // 725 kip/in
    k_2 = (A_2 * E_2) / L_2; // 562.5 kip/in
    k_par = k_1 + k_2; // 1287.5 kip/in
    k_ser = 1 / (1 / k_1 + 1 / k_2);

    P = 90.0; // kip
    delta_j = P / k_par; // in
    R_1 = k_1 * delta_j;
    R_2 = k_2 * delta_j;
    sigma_1 = R_1 / A_1;
    sigma_2 = R_2 / A_2;
    eps_1 = delta_j / L_1;
    eps_2 = delta_j / L_2;
    delta_1_ser = P / k_1;
    delta_2_ser = P / k_2;
    delta_ser = delta_1_ser + delta_2_ser;

    _u = {
      P: "kip", R_1: "kip", R_2: "kip",
      A_1: "in^2", A_2: "in^2", L_1: "in", L_2: "in", L_tot: "in",
      E_1: "ksi", E_2: "ksi",
      k_1: "kip/in", k_2: "kip/in", k_par: "kip/in", k_ser: "kip/in",
      delta_j: "in", sigma_1: "ksi", sigma_2: "ksi",
      eps_1: "dimless", eps_2: "dimless",
      delta_1_ser: "in", delta_2_ser: "in", delta_ser: "in"
    };
  } else {
    A_1 = 800.0; // mm^2
    L_1 = 1200.0; // mm
    E_1 = 200.0; // GPa
    A_2 = 1200.0; // mm^2
    L_2 = 800.0; // mm
    E_2 = 70.0; // GPa

    L_tot = L_1 + L_2; // 2000 mm
    // 1 GPa = 1 kN/mm^2, so (A[mm^2] * E[GPa]) / L[mm] yields kN/mm directly
    k_1 = (A_1 * E_1) / L_1; // 133.333 kN/mm
    k_2 = (A_2 * E_2) / L_2; // 105 kN/mm
    k_par = k_1 + k_2; // 238.333 kN/mm
    k_ser = 1 / (1 / k_1 + 1 / k_2);

    P = 400.0; // kN
    delta_j = P / k_par; // mm
    R_1 = k_1 * delta_j; // kN
    R_2 = k_2 * delta_j; // kN
    sigma_1 = (R_1 * 1000) / A_1; // MPa
    sigma_2 = (R_2 * 1000) / A_2; // MPa
    eps_1 = delta_j / L_1;
    eps_2 = delta_j / L_2;
    delta_1_ser = P / k_1;
    delta_2_ser = P / k_2;
    delta_ser = delta_1_ser + delta_2_ser;

    _u = {
      P: "kN", R_1: "kN", R_2: "kN",
      A_1: "mm^2", A_2: "mm^2", L_1: "mm", L_2: "mm", L_tot: "mm",
      E_1: "GPa", E_2: "GPa",
      k_1: "kN/mm", k_2: "kN/mm", k_par: "kN/mm", k_ser: "kN/mm",
      delta_j: "mm", sigma_1: "MPa", sigma_2: "MPa",
      eps_1: "dimless", eps_2: "dimless",
      delta_1_ser: "mm", delta_2_ser: "mm", delta_ser: "mm"
    };
  }

  const _names = {};
  for (const [key, meta] of Object.entries(AXIAL_MEMBERS_VARS_DB)) {
    _names[key] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    P, R_1, R_2, A_1, A_2, L_1, L_2, L_tot, E_1, E_2,
    k_1, k_2, k_par, k_ser, delta_j, sigma_1, sigma_2, eps_1, eps_2,
    delta_1_ser, delta_2_ser, delta_ser,
    _names, _u
  };
}
