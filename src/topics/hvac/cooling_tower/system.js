/**
 * src/topics/hvac/cooling_tower/system.js
 * Cooling Tower Ground Truth Generator supporting SI, US Imperial, and Mixed modes.
 */

import { TOWER_VARS_DB } from "./schema.js";
import { sampleSystemMode } from "../../../core/unit_sampler.js";

export function createCoolingTowerSystem({ sys = null } = {}) {
  const mode = sampleSystemMode(sys);
  const isUS = mode === "US";

  let t_w1, t_w2, t_wb1, R_ct, A_ct, eta_ct;
  let h_1, h_2, W_1, W_2, v_1;
  let m_w, c_pw, rho_w, Q_rej, m_a, LG, V_a, V_w;
  let m_evap, f_drift, m_drift, COC, m_bd, m_mu, _u;

  if (isUS) {
    // Pure US Imperial
    t_w1 = [96.0, 100.0, 105.0][Math.floor(Math.random() * 3)]; // °F
    t_w2 = [85.0, 88.0, 90.0][Math.floor(Math.random() * 3)];    // °F
    t_wb1 = 78.0;                                                // °F

    R_ct = t_w1 - t_w2;
    A_ct = t_w2 - t_wb1;
    eta_ct = (R_ct / (R_ct + A_ct)) * 100;                       // %

    h_1 = 41.5; W_1 = 0.015; // Btu/lb, dimless
    h_2 = 58.0; W_2 = 0.028; // Btu/lb, dimless
    v_1 = 14.0;              // ft^3/lbm

    m_w = [8000.0, 10000.0, 12000.0][Math.floor(Math.random() * 3)]; // lb/min
    c_pw = 1.0;   // Btu/(lb-°F)
    rho_w = 62.4; // lb/ft^3 (water at ~85 °F)

    Q_rej = m_w * c_pw * R_ct;                    // Btu/min
    m_a = Q_rej / (h_2 - h_1);                    // lb/min
    LG = m_w / m_a;                               // dimless
    V_a = m_a * v_1;                              // cfm
    V_w = (m_w / rho_w) * (1728 / 231);           // gpm (1 ft^3 = 1728/231 gal)

    m_evap = m_a * (W_2 - W_1);                   // lb/min
    f_drift = 0.2;                                // %
    m_drift = (f_drift / 100) * m_w;              // lb/min
    COC = [3.0, 4.0, 5.0][Math.floor(Math.random() * 3)];
    m_bd = m_evap / (COC - 1);                    // lb/min
    m_mu = m_evap + m_bd + m_drift;               // lb/min

    _u = {
      t_w1: "°F", t_w2: "°F", t_wb1: "°F", R_ct: "°F", A_ct: "°F", eta_ct: "%",
      h_1: "Btu/lb_m", h_2: "Btu/lb_m", W_1: "dimless", W_2: "dimless", v_1: "ft^3/lb_m",
      m_w: "lb_m/min", c_pw: "Btu/(lb_m*F)", rho_w: "lb_m/ft^3",
      Q_rej: "Btu/min", m_a: "lb_m/min", LG: "dimless", V_a: "cfm", V_w: "gpm",
      m_evap: "lb_m/min", f_drift: "%", m_drift: "lb_m/min", COC: "dimless",
      m_bd: "lb_m/min", m_mu: "lb_m/min"
    };
  } else {
    // Pure SI
    t_w1 = [34.0, 36.0, 38.0][Math.floor(Math.random() * 3)]; // °C
    t_w2 = [27.0, 29.0, 30.0][Math.floor(Math.random() * 3)]; // °C
    t_wb1 = 24.0;                                             // °C

    R_ct = t_w1 - t_w2;
    A_ct = t_w2 - t_wb1;
    eta_ct = (R_ct / (R_ct + A_ct)) * 100;                    // %

    h_1 = 72.0; W_1 = 0.014; // kJ/kg, dimless
    h_2 = 95.0; W_2 = 0.027; // kJ/kg, dimless
    v_1 = 0.875;             // m^3/kg

    m_w = [80.0, 100.0, 120.0][Math.floor(Math.random() * 3)]; // kg/s
    c_pw = 4.187;  // kJ/kg-K
    rho_w = 1000.0; // kg/m^3

    Q_rej = m_w * c_pw * R_ct;       // kW
    m_a = Q_rej / (h_2 - h_1);       // kg/s
    LG = m_w / m_a;                  // dimless
    V_a = m_a * v_1;                 // m^3/s
    V_w = (m_w / rho_w) * 1000;      // L/s

    m_evap = m_a * (W_2 - W_1);      // kg/s
    f_drift = 0.2;                   // %
    m_drift = (f_drift / 100) * m_w; // kg/s
    COC = [3.0, 4.0, 5.0][Math.floor(Math.random() * 3)];
    m_bd = m_evap / (COC - 1);       // kg/s
    m_mu = m_evap + m_bd + m_drift;  // kg/s

    _u = {
      t_w1: "°C", t_w2: "°C", t_wb1: "°C", R_ct: "°C", A_ct: "°C", eta_ct: "%",
      h_1: "kJ/kg", h_2: "kJ/kg", W_1: "dimless", W_2: "dimless", v_1: "m^3/kg",
      m_w: "kg/s", c_pw: "kJ/kg-K", rho_w: "kg/m^3",
      Q_rej: "kW", m_a: "kg/s", LG: "dimless", V_a: "m^3/s", V_w: "L/s",
      m_evap: "kg/s", f_drift: "%", m_drift: "kg/s", COC: "dimless",
      m_bd: "kg/s", m_mu: "kg/s"
    };
  }

  const _names = {};
  for (const [k, meta] of Object.entries(TOWER_VARS_DB)) {
    _names[k] = meta.aliases?.[0] || meta.name;
  }

  return {
    sys: mode,
    t_w1, t_w2, t_wb1, R_ct, A_ct, eta_ct,
    h_1, h_2, W_1, W_2, v_1,
    m_w, c_pw, rho_w, Q_rej, m_a, LG, V_a, V_w,
    m_evap, f_drift, m_drift, COC, m_bd, m_mu,
    _names, _u
  };
}
