/**
 * src/topics/powerplant_design/diesel_heat_balance/system.js
 * Ground truth generator for diesel engine thermal balance distribution.
 */

import { DIESEL_HEAT_BALANCE_VARS_DB } from "./schema.js";

export function createDieselHeatBalanceSystem({ sys = "SI" } = {}) {
  const Q_f = [4000, 5000, 6000, 7000][Math.floor(Math.random() * 4)];
  
  // Typical heat balance percentages for a diesel engine
  const pct_ip = [35, 36, 38, 40][Math.floor(Math.random() * 4)];
  const pct_cw = [25, 26, 28, 30][Math.floor(Math.random() * 4)];
  const pct_exh = [20, 22, 24, 26][Math.floor(Math.random() * 4)];
  const pct_rad = 100 - (pct_ip + pct_cw + pct_exh);

  // Convert percentages to fractions for heat calculations
  const Q_ip = Q_f * (pct_ip / 100);
  const Q_cw = Q_f * (pct_cw / 100);
  const Q_exh = Q_f * (pct_exh / 100);
  const Q_rad = Q_f * (pct_rad / 100);

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

  return { sys: "SI", Q_f, Q_ip, Q_cw, Q_exh, Q_rad, m_cw, dT_cw, cp_w, pct_cw, pct_exh, pct_rad, _names, _u };
}