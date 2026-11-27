/**
 * src/topics/machine_design/stress/thermal_stress/system.js
 * Ground-truth generator for Thermal Stress & Combined Thermal-Mechanical Loading.
 * Reference: Beer & Johnston, Mechanics of Materials, Sec. 2.5 (Steel α ≈ 12 um/(m·°C), Al α ≈ 23 um/(m·°C)).
 */

import { THERMAL_STRESS_VARS_DB } from "./schema.js";

export function createThermalStressSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let T_i, T_f, dT, alpha_1, alpha_2, d_alpha, L, A, E, k_b;
  let eps_th, delta_th, sigma_th, P_th, delta_gap, delta_res, eps_res, sigma_part;
  let k_s, k_comb, P_el, delta_sp, sigma_el, P_app, delta_mech, delta_tot;
  let k_2, k_comp, P_comp, _u;

  if (isUS) {
    T_i = 70.0; // °F
    T_f = 320.0; // °F
    dT = T_f - T_i; // 250 Δ°F
    alpha_1 = 6.5; // uin/(in*Δ°F)
    alpha_2 = 12.8; // uin/(in*Δ°F)
    d_alpha = alpha_2 - alpha_1; // 6.3 uin/(in*Δ°F)

    L = 80.0; // in
    A = 1.5; // in^2
    E = 29000; // ksi
    k_b = (A * E) / L; // 543.75 kip/in

    eps_th = alpha_1 * 1e-6 * dT; // 0.001625
    delta_th = eps_th * L; // 0.13 in
    sigma_th = E * eps_th; // 47.125 ksi
    P_th = A * sigma_th; // 70.6875 kip

    delta_gap = 0.03; // in
    delta_res = delta_th - delta_gap; // 0.10 in
    eps_res = delta_res / L; // 0.00125
    sigma_part = E * eps_res; // 36.25 ksi

    k_s = 700.0; // kip/in
    k_comb = 1 / (1 / k_b + 1 / k_s);
    P_el = k_comb * delta_th; // kip
    delta_sp = P_el / k_s; // in
    sigma_el = P_el / A; // ksi

    P_app = 21.75; // kip
    delta_mech = P_app / k_b; // 0.04 in
    delta_tot = delta_mech + delta_th; // 0.17 in

    k_2 = 400.0; // kip/in
    k_comp = 1 / (1 / k_b + 1 / k_2);
    P_comp = k_comp * d_alpha * 1e-6 * L * dT; // kip

    _u = {
      T_i: "°F", T_f: "°F", dT: "Δ°F",
      alpha_1: "uin/(in*Δ°F)", alpha_2: "uin/(in*Δ°F)", d_alpha: "uin/(in*Δ°F)",
      L: "in", A: "in^2", E: "ksi", k_b: "kip/in",
      eps_th: "dimless", delta_th: "in", sigma_th: "ksi", P_th: "kip",
      delta_gap: "in", delta_res: "in", eps_res: "dimless", sigma_part: "ksi",
      k_s: "kip/in", k_comb: "kip/in", P_el: "kip", delta_sp: "in", sigma_el: "ksi",
      P_app: "kip", delta_mech: "in", delta_tot: "in",
      k_2: "kip/in", k_comp: "kip/in", P_comp: "kip"
    };
  } else {
    T_i = 20.0; // °C
    T_f = 170.0; // °C
    dT = T_f - T_i; // 150 Δ°C
    alpha_1 = 12.0; // um/(m*Δ°C)
    alpha_2 = 23.0; // um/(m*Δ°C)
    d_alpha = alpha_2 - alpha_1; // 11.0 um/(m*Δ°C)

    L = 2.0; // m
    const L_mm = L * 1000; // 2000 mm
    A = 1000.0; // mm^2
    E = 200.0; // GPa
    k_b = (A * E) / L_mm; // 100 kN/mm

    eps_th = alpha_1 * 1e-6 * dT; // 0.0018
    delta_th = eps_th * L_mm; // 3.6 mm
    sigma_th = (E * 1000) * eps_th; // 360 MPa
    P_th = (A * sigma_th) / 1000; // 360 kN

    delta_gap = 0.6; // mm
    delta_res = delta_th - delta_gap; // 3.0 mm
    eps_res = delta_res / L_mm; // 0.0015
    sigma_part = (E * 1000) * eps_res; // 300 MPa

    k_s = 150.0; // kN/mm
    k_comb = 1 / (1 / k_b + 1 / k_s); // 60 kN/mm
    P_el = k_comb * delta_th; // 216 kN
    delta_sp = P_el / k_s; // 1.44 mm
    sigma_el = (P_el * 1000) / A; // 216 MPa

    P_app = 120.0; // kN
    delta_mech = P_app / k_b; // 1.2 mm
    delta_tot = delta_mech + delta_th; // 4.8 mm

    k_2 = 80.0; // kN/mm
    k_comp = 1 / (1 / k_b + 1 / k_2); // 44.4444 kN/mm
    P_comp = k_comp * (d_alpha * 1e-6 * L_mm * dT); // kN

    _u = {
      T_i: "°C", T_f: "°C", dT: "Δ°C",
      alpha_1: "um/(m*Δ°C)", alpha_2: "um/(m*Δ°C)", d_alpha: "um/(m*Δ°C)",
      L: "m", A: "mm^2", E: "GPa", k_b: "kN/mm",
      eps_th: "dimless", delta_th: "mm", sigma_th: "MPa", P_th: "kN",
      delta_gap: "mm", delta_res: "mm", eps_res: "dimless", sigma_part: "MPa",
      k_s: "kN/mm", k_comb: "kN/mm", P_el: "kN", delta_sp: "mm", sigma_el: "MPa",
      P_app: "kN", delta_mech: "mm", delta_tot: "mm",
      k_2: "kN/mm", k_comp: "kN/mm", P_comp: "kN"
    };
  }

  const _names = {};
  for (const [key, meta] of Object.entries(THERMAL_STRESS_VARS_DB)) {
    _names[key] = meta.nameAliases?.[0] || meta.name;
  }

  return {
    sys,
    T_i, T_f, dT, alpha_1, alpha_2, d_alpha, L, A, E, k_b,
    eps_th, delta_th, sigma_th, P_th, delta_gap, delta_res, eps_res, sigma_part,
    k_s, k_comb, P_el, delta_sp, sigma_el, P_app, delta_mech, delta_tot,
    k_2, k_comp, P_comp,
    _names, _u
  };
}
