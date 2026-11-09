/**
 * src/topics/powerplant_design/diesel_engine/system.js
 * Ground truth generator for stationary diesel powerplant machinery.
 */

import { DIESEL_ENGINE_VARS_DB } from "./schema.js";

export function createDieselEngineSystem({ sys = "SI" } = {}) {
  const BP = [1000, 1500, 2000, 2500, 3000][Math.floor(Math.random() * 5)];
  const eta_m = [0.82, 0.85, 0.88, 0.90][Math.floor(Math.random() * 4)];
  const IP = BP / eta_m;
  const FP = IP - BP;
  const HV = [42000, 43000, 44000, 45000][Math.floor(Math.random() * 4)]; // Standard diesel fuel HHV
  const eta_th = [0.35, 0.38, 0.40, 0.42][Math.floor(Math.random() * 4)];
  const Q_f = BP / eta_th;
  const m_f = Q_f / HV;
  const eta_ith = IP / Q_f;
  const bsfc = (m_f * 3600) / BP;
  const isfc = (m_f * 3600) / IP;
  const eta_g = [0.92, 0.94, 0.95, 0.96][Math.floor(Math.random() * 4)];
  const EP = BP * eta_g;

  const _names = {};
  for (const [k, meta] of Object.entries(DIESEL_ENGINE_VARS_DB)) {
    _names[k] = meta.aliases?.[0] || meta.name;
  }
  const _u = {
    BP: "kW", IP: "kW", FP: "kW", EP: "kW", Q_f: "kW",
    m_f: "kg/s", HV: "kJ/kg",
    eta_m: "dimless", eta_th: "dimless", eta_ith: "dimless", eta_g: "dimless",
    bsfc: "kg/kWh", isfc: "kg/kWh"
  };
  return { sys: "SI", BP, IP, FP, EP, Q_f, m_f, HV, eta_m, eta_th, eta_ith, eta_g, bsfc, isfc, _names, _u };
}