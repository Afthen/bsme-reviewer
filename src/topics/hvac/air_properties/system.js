/**
 * src/topics/hvac/air_properties/system.js
 * Deterministic psychrometric ground truth generator.
 * Roots are drawn clean in their planned display unit (see makeDraw); every
 * derived value is computed by hand from them (R9).
 */

import { AIR_PROPERTIES_VARS_DB } from "./schema.js";
import { makeDraw } from "../../../core/unit_sampler.js";

export function createAirPropertiesSystem({ sys = "SI", unitPlan = {} } = {}) {
  const draw = makeDraw(unitPlan, AIR_PROPERTIES_VARS_DB);
  const t_db = draw("t_db");
  const t_wb = draw("t_wb", { hi: t_db - 3 });
  const P_t = 101.325; // kPa standard atmospheric

  // Liley equation at t_db and t_wb
  const P_sat = 100 * Math.exp(14.43509 - 5333.33 / (t_db + 273.15));
  const P_wb = 100 * Math.exp(14.43509 - 5333.33 / (t_wb + 273.15));

  // Carrier's equation
  const P_v = P_wb - (P_t * (t_db - t_wb)) / 1500;

  // Liley equation at dew point: Pv = L(tdp) => invert for t_dp
  const t_dp = 5333.33 / (14.43509 - Math.log(P_v / 100)) - 273.15;

  const W = (0.622 * P_v) / (P_t - P_v);
  const RH = P_v / P_sat;
  const h = 1.0062 * t_db + W * (2501 + 1.88 * t_db);
  const P_a = P_t - P_v;
  const v = (0.287 * (t_db + 273.15)) / (P_t - P_v);

  const Q_s = draw("Q_s");
  const Q_l = draw("Q_l");
  const Q_t = Q_s + Q_l;
  const SHR = Q_s / Q_t;

  const _names = {};
  for (const [k, meta] of Object.entries(AIR_PROPERTIES_VARS_DB)) {
    _names[k] = meta.aliases?.[0] || meta.name;
  }

  const _u = {
    P_v: "kPa", P_sat: "kPa", P_wb: "kPa", P_t: "kPa", P_a: "kPa",
    t_db: "°C", t_wb: "°C", t_dp: "°C",
    W: "dimless", RH: "dimless", h: "kJ/kg", v: "m^3/kg",
    SHR: "dimless", Q_s: "kW", Q_l: "kW", Q_t: "kW"
  };

  return {
    sys: "SI",
    P_v, P_sat, P_wb, P_t, P_a, t_db, t_wb, t_dp, W, RH, h, v,
    SHR, Q_s, Q_l, Q_t, _names, _u
  };
}
