import { MIXED_AIR_VARS_DB } from "./schema.js";

export function createMixedAirSystem() {
  const m_o = [1.5, 2.0, 2.5][Math.floor(Math.random() * 3)];
  const m_r = [6.0, 7.5, 8.0][Math.floor(Math.random() * 3)];
  const m_m = m_o + m_r;
  const y = m_o / m_m;

  const t_o = 35.0; const t_r = 24.0;
  const t_m = ((m_o * t_o) + (m_r * t_r)) / m_m;

  const h_o = 85.0; const h_r = 50.0;
  const h_m = ((m_o * h_o) + (m_r * h_r)) / m_m;
  
  const h_s = 40.0;
  const q_c = m_m * (h_m - h_s);

  const v_o = 0.89; const V_o = m_o * v_o;
  const v_m = 0.86; const V_m = m_m * v_m;

  const _names = {};
  for (const [k, meta] of Object.entries(MIXED_AIR_VARS_DB)) {
    _names[k] = meta.aliases?.[0] || meta.name;
  }
  const _u = {
    m_o: "kg/s", m_r: "kg/s", m_m: "kg/s", 
    t_o: "°C", t_r: "°C", t_m: "°C",
    h_o: "kJ/kg", h_r: "kJ/kg", h_m: "kJ/kg", h_s: "kJ/kg", q_c: "kW",
    y: "dimless", V_o: "m^3/s", v_o: "m^3/kg", V_m: "m^3/s", v_m: "m^3/kg"
  };

  return { m_o, m_r, m_m, y, t_o, t_r, t_m, h_o, h_r, h_m, h_s, q_c, V_o, v_o, V_m, v_m, _names, _u };
}