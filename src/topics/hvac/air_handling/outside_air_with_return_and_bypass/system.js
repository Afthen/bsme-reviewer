import { BYPASS_AIR_VARS_DB } from "./schema.js";

export function createBypassAirSystem() {
  const m_o = 2.0; const m_r = 8.0; const m_m = m_o + m_r;
  const t_o = 35.0; const t_r = 24.0; const t_m = ((m_o * t_o) + (m_r * t_r)) / m_m;
  const h_o = 85.0; const h_r = 50.0; const h_m = ((m_o * h_o) + (m_r * h_r)) / m_m;

  const t_adp = 10.0; const h_adp = 30.0;
  const BF = [0.1, 0.15, 0.2, 0.25][Math.floor(Math.random() * 4)];
  const CF = 1 - BF;
  
  const t_s = t_adp + BF * (t_m - t_adp);
  const h_s = h_adp + BF * (h_m - h_adp);
  const q_c = m_m * (h_m - h_s);

  const _names = {};
  for (const [k, meta] of Object.entries(BYPASS_AIR_VARS_DB)) {
    _names[k] = meta.aliases?.[0] || meta.name;
  }
  
  const _u = {
    m_o: "kg/s", m_r: "kg/s", m_m: "kg/s", 
    t_o: "°C", t_r: "°C", t_m: "°C", t_s: "°C", t_adp: "°C",
    h_o: "kJ/kg", h_r: "kJ/kg", h_m: "kJ/kg", h_s: "kJ/kg", h_adp: "kJ/kg", 
    q_c: "kW", BF: "dimless", CF: "dimless"
  };

  return { m_o, m_r, m_m, t_o, t_r, t_m, t_s, t_adp, h_o, h_r, h_m, h_s, h_adp, BF, CF, q_c, _names, _u };
}
