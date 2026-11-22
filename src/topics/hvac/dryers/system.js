/**
 * src/topics/hvac/dryers/system.js
 * Independent Ground Truth Generator for Industrial Air Dryers (SI and US).
 */

import { DRYER_VARS_DB } from "./schema.js";

export function createDryerSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let m_f, M_w1, M_w2, X_1, X_2, m_s, m_p, m_w;
  let W_1, W_2, m_a, v_1, V_a, t_a1, t_a2, c_pa, Q_h, h_fg, Q_evap, eta_d, _u;

  M_w1 = [55.0, 60.0, 65.0][Math.floor(Math.random() * 3)]; // %
  M_w2 = [10.0, 12.0, 15.0][Math.floor(Math.random() * 3)]; // %

  const w1Frac = M_w1 / 100;
  const w2Frac = M_w2 / 100;
  X_1 = w1Frac / (1 - w1Frac);
  X_2 = w2Frac / (1 - w2Frac);

  W_1 = 0.012; // dimless
  W_2 = 0.032; // dimless

  if (isUS) {
    m_f = [100.0, 120.0, 150.0][Math.floor(Math.random() * 3)]; // lb/min
    m_s = m_f * (1 - w1Frac);                                    // lb/min
    m_p = m_s / (1 - w2Frac);                                    // lb/min
    m_w = m_f - m_p;                                             // lb/min

    m_a = m_w / (W_2 - W_1);                                     // lb/min
    v_1 = 13.9;                                                  // ft^3/lbm
    V_a = m_a * v_1;                                             // cfm

    t_a1 = 80.0;                                                 // °F
    t_a2 = [185.0, 200.0, 220.0][Math.floor(Math.random() * 3)]; // °F
    c_pa = 0.24;                                                 // Btu/(lb-°F)
    Q_h = m_a * c_pa * (t_a2 - t_a1);                            // Btu/min

    h_fg = 1030.0;                                               // Btu/lb
    Q_evap = m_w * h_fg;                                         // Btu/min
    eta_d = (Q_evap / Q_h) * 100;                                // %

    _u = {
      m_f: "lb_m/min", m_p: "lb_m/min", m_s: "lb_m/min", m_w: "lb_m/min",
      M_w1: "%", M_w2: "%", X_1: "dimless", X_2: "dimless",
      m_a: "lb_m/min", W_1: "dimless", W_2: "dimless", v_1: "ft^3/lb_m", V_a: "cfm",
      t_a1: "°F", t_a2: "°F", c_pa: "Btu/(lb_m*F)",
      Q_h: "Btu/min", h_fg: "Btu/lb_m", Q_evap: "Btu/min", eta_d: "%"
    };
  } else {
    m_f = [1.0, 1.5, 2.0][Math.floor(Math.random() * 3)];        // kg/s
    m_s = m_f * (1 - w1Frac);                                    // kg/s
    m_p = m_s / (1 - w2Frac);                                    // kg/s
    m_w = m_f - m_p;                                             // kg/s

    m_a = m_w / (W_2 - W_1);                                     // kg/s
    v_1 = 0.87;                                                  // m^3/kg
    V_a = m_a * v_1;                                             // m^3/s

    t_a1 = 28.0;                                                 // °C
    t_a2 = [85.0, 95.0, 105.0][Math.floor(Math.random() * 3)];   // °C
    c_pa = 1.0062;                                               // kJ/kg-K
    Q_h = m_a * c_pa * (t_a2 - t_a1);                            // kW

    h_fg = 2400.0;                                               // kJ/kg
    Q_evap = m_w * h_fg;                                         // kW
    eta_d = (Q_evap / Q_h) * 100;                                // %

    _u = {
      m_f: "kg/s", m_p: "kg/s", m_s: "kg/s", m_w: "kg/s",
      M_w1: "%", M_w2: "%", X_1: "dimless", X_2: "dimless",
      m_a: "kg/s", W_1: "dimless", W_2: "dimless", v_1: "m^3/kg", V_a: "m^3/s",
      t_a1: "°C", t_a2: "°C", c_pa: "kJ/kg-K",
      Q_h: "kW", h_fg: "kJ/kg", Q_evap: "kW", eta_d: "%"
    };
  }

  const _names = {};
  for (const [k, meta] of Object.entries(DRYER_VARS_DB)) {
    _names[k] = meta.aliases?.[0] || meta.name;
  }

  return {
    sys: isUS ? "US" : "SI",
    m_f, m_p, m_s, m_w, M_w1, M_w2, X_1, X_2,
    m_a, W_1, W_2, v_1, V_a, t_a1, t_a2, c_pa,
    Q_h, h_fg, Q_evap, eta_d,
    _names, _u
  };
}
