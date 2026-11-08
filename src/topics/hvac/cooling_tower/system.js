import { TOWER_VARS_DB } from "./schema.js";

export function createCoolingTowerSystem() {
  const t_w1 = [32.0, 35.0, 38.0][Math.floor(Math.random() * 3)];
  const t_w2 = [27.0, 29.0, 30.0][Math.floor(Math.random() * 3)];
  const t_wb1 = 24.0;
  
  const R_ct = t_w1 - t_w2;
  const A_ct = t_w2 - t_wb1;
  
  const h_1 = 72.0; const W_1 = 0.014;
  const h_2 = 95.0; const W_2 = 0.027;
  
  const m_w = [40.0, 50.0, 60.0][Math.floor(Math.random() * 3)];
  const c_pw = 4.187;

  const q_rej = m_w * c_pw * R_ct;
  const m_a = q_rej / (h_2 - h_1);
  const m_mu = m_a * (W_2 - W_1);

  const _names = {};
  for (const [k, meta] of Object.entries(TOWER_VARS_DB)) {
    _names[k] = meta.aliases?.[0] || meta.name;
  }

  const _u = {
    t_w1: "°C", t_w2: "°C", t_wb1: "°C", R_ct: "°C", A_ct: "°C",
    h_1: "kJ/kg", h_2: "kJ/kg", m_w: "kg/s", c_pw: "kJ/kg-K",
    q_rej: "kW", m_a: "kg/s", m_mu: "kg/s", W_1: "dimless", W_2: "dimless"
  };

  return { t_w1, t_w2, t_wb1, R_ct, A_ct, h_1, h_2, W_1, W_2, m_w, c_pw, q_rej, m_a, m_mu, _names, _u };
}
