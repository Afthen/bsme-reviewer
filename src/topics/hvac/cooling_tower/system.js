/**
 * src/topics/hvac/cooling_tower/system.js
 * Cooling Tower Ground Truth Generator supporting SI, US Imperial, and Mixed 50/50 modes.
 */

import { TOWER_VARS_DB } from "./schema.js";
import { sampleSystemMode } from "../../../core/unit_sampler.js";

export function createCoolingTowerSystem({ sys = null } = {}) {
  const mode = sampleSystemMode(sys);
  const isUS = mode === "US";

  let t_w1, t_w2, t_wb1, R_ct, A_ct, h_1, h_2, W_1, W_2, m_w, c_pw, q_rej, m_a, m_mu, _u;

  if (isUS) {
    // Pure US Imperial
    t_w1 = [95.0, 100.0, 105.0][Math.floor(Math.random() * 3)]; // °F
    t_w2 = [85.0, 88.0, 90.0][Math.floor(Math.random() * 3)];    // °F
    t_wb1 = 78.0;                                                // °F

    R_ct = t_w1 - t_w2;
    A_ct = t_w2 - t_wb1;

    h_1 = 41.5; const W_1_val = 0.015; // Btu/lb
    h_2 = 58.0; const W_2_val = 0.028; // Btu/lb
    W_1 = W_1_val; W_2 = W_2_val;

    m_w = [6000.0, 7500.0, 9000.0][Math.floor(Math.random() * 3)]; // lb/min
    c_pw = 1.0; // Btu/(lb-°F)

    q_rej = m_w * c_pw * R_ct; // Btu/min
    m_a = q_rej / (h_2 - h_1);  // lb/min
    m_mu = m_a * (W_2 - W_1);   // lb/min

    _u = {
      t_w1: "°F", t_w2: "°F", t_wb1: "°F", R_ct: "°F", A_ct: "°F",
      h_1: "Btu/lb", h_2: "Btu/lb", m_w: "lb/min", c_pw: "Btu/(lb*F)",
      q_rej: "Btu/min", m_a: "lb/min", m_mu: "lb/min", W_1: "dimless", W_2: "dimless"
    };
  } else {
    // Pure SI
    t_w1 = [32.0, 35.0, 38.0][Math.floor(Math.random() * 3)]; // °C
    t_w2 = [27.0, 29.0, 30.0][Math.floor(Math.random() * 3)]; // °C
    t_wb1 = 24.0;                                             // °C

    R_ct = t_w1 - t_w2;
    A_ct = t_w2 - t_wb1;

    h_1 = 72.0; W_1 = 0.014; // kJ/kg
    h_2 = 95.0; W_2 = 0.027; // kJ/kg

    m_w = [40.0, 50.0, 60.0][Math.floor(Math.random() * 3)]; // kg/s
    c_pw = 4.187; // kJ/kg-K

    q_rej = m_w * c_pw * R_ct; // kW
    m_a = q_rej / (h_2 - h_1);  // kg/s
    m_mu = m_a * (W_2 - W_1);   // kg/s

    _u = {
      t_w1: "°C", t_w2: "°C", t_wb1: "°C", R_ct: "°C", A_ct: "°C",
      h_1: "kJ/kg", h_2: "kJ/kg", m_w: "kg/s", c_pw: "kJ/kg-K",
      q_rej: "kW", m_a: "kg/s", m_mu: "kg/s", W_1: "dimless", W_2: "dimless"
    };
  }

  const _names = {};
  for (const [k, meta] of Object.entries(TOWER_VARS_DB)) {
    _names[k] = meta.aliases?.[0] || meta.name;
  }

  return {
    sys: mode, t_w1, t_w2, t_wb1, R_ct, A_ct, h_1, h_2, W_1, W_2,
    m_w, c_pw, q_rej, m_a, m_mu, _names, _u
  };
}
