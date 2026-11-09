import { DIESEL_HEAT_BALANCE_VARS_DB } from "./schema.js";

export function createDieselHeatBalanceSystem() {
  const Q_f = [4000, 5000, 6000, 7000][Math.floor(Math.random() * 4)];
  
  // Typical heat balance percentages for a diesel engine
  const pct_ip = [0.35, 0.36, 0.38, 0.40][Math.floor(Math.random() * 4)];
  const pct_cw = [0.25, 0.26, 0.28, 0.30][Math.floor(Math.random() * 4)];
  const pct_exh = [0.20, 0.22, 0.24, 0.26][Math.floor(Math.random() * 4)];
  const pct_rad = 1.0 - (pct_ip + pct_cw + pct_exh);

  const Q_ip = Q_f * pct_ip;
  const Q_cw = Q_f * pct_cw;
  const Q_exh = Q_f * pct_exh;
  const Q_rad = Q_f * pct_rad;

  const cp_w = 4.187;
  const dT_cw = [5, 8, 10, 12][Math.floor(Math.random() * 4)]; 
  const m_cw = Q_cw / (cp_w * dT_cw);

  const _names = {};
  for (const [k_var, meta] of Object.entries(DIESEL_HEAT_BALANCE_VARS_DB)) {
    _names[k_var] = meta.aliases?.[0] || meta.name;
  }

  const _u = {
    Q_f: "kW", Q_ip: "kW", Q_cw: "kW", Q_exh: "kW", Q_rad: "kW",
    m_cw: "kg/s", dT_cw: "K", cp_w: "kJ/kg-K",
    pct_cw: "dimless", pct_exh: "dimless", pct_rad: "dimless"
  };

  return { Q_f, Q_ip, Q_cw, Q_exh, Q_rad, m_cw, dT_cw, cp_w, pct_cw, pct_exh, pct_rad, _names, _u };
}