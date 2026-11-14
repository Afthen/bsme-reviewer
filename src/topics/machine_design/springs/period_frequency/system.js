/**
 * src/topics/machine_design/springs/period_frequency/system.js
 * Ground truth generator for spring & pendulum period/frequency.
 */

import { PERIOD_FREQUENCY_VARS_DB } from "./schema.js";

export function createPeriodFrequencySystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  let T_period, f, m, k, L_p, g, _u;

  if (isUS) {
    m = 10.0; // lb (pound_mass)
    k = 50.0; // lb/ft
    g = 32.2; // ft/s^2
    const gc = 32.174049;

    // T = 2*pi * sqrt(m / (k * gc))
    T_period = 2 * Math.PI * Math.sqrt(m / (k * gc)); // ~0.495388 s
    f = 1 / T_period; // ~2.0186 Hz
    L_p = g * Math.pow(T_period / (2 * Math.PI), 2); // ~0.20016 ft

    _u = {
      T_period: "s", f: "Hz", m: "lb", k: "lb/ft", L_p: "ft", g: "ft/s^2"
    };
  } else {
    m = 2.5; // kg
    k = 1000.0; // N/m
    g = 9.81; // m/s^2

    T_period = 2 * Math.PI * Math.sqrt(m / k); // 0.314159 s
    f = 1 / T_period; // 3.1831 Hz
    L_p = g * Math.pow(T_period / (2 * Math.PI), 2); // 0.024525 m

    _u = {
      T_period: "s", f: "Hz", m: "kg", k: "N/m", L_p: "m", g: "m/s^2"
    };
  }

  const _names = {};
  for (const [key, meta] of Object.entries(PERIOD_FREQUENCY_VARS_DB)) {
    _names[key] = meta.nameAliases?.[0] || meta.name;
  }

  return { sys, T_period, f, m, k, L_p, g, _names, _u };
}
