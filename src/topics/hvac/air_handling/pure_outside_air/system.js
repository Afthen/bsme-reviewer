import { PURE_AIR_VARS_DB } from "./schema.js";

export function createPureAirSystem() {
  const m_o = [2.5, 3.0, 4.0, 5.0, 6.0][Math.floor(Math.random() * 5)];
  const h_o = 85.0;
  const h_s = 40.0;
  const q_c = m_o * (h_o - h_s);

  const _names = {};
  for (const [k, meta] of Object.entries(PURE_AIR_VARS_DB)) {
    _names[k] = meta.aliases?.[0] || meta.name;
  }
  const _u = { m_o: "kg/s", h_o: "kJ/kg", h_s: "kJ/kg", q_c: "kW" };

  return { m_o, h_o, h_s, q_c, _names, _u };
}
