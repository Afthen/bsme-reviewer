/**
 * src/core/unit_sampler.js
 * 40% SI / 40% US / 20% Mixed Unit Sampler with phi(-3) Intra-System Unit Variation Trap.
 */

import { phi } from "../mastery/index.js";

export const DIMENSION_PALETTES = Object.freeze({
  SI: {
    "Length": ["mm", "cm", "m"],
    "Force": ["N", "kN"],
    "Pressure / Stress": ["kPa", "bar", "MPa"],
    "Power": ["kW", "W"],
    "Specific Energy / Enthalpy": ["kJ/kg"],
    "Mass Flow Rate": ["kg/s", "kg/min"],
    "Temperature": ["°C"]
  },
  US: {
    "Length": ["in", "ft", "yd"],
    "Force": ["lb"],
    "Pressure / Stress": ["psi", "psf"],
    "Power": ["hp", "Btu/min"],
    "Specific Energy / Enthalpy": ["Btu/lb"],
    "Mass Flow Rate": ["lb/s", "lb/min"],
    "Temperature": ["°F"]
  }
});

export function sampleSystemMode(requestedSys = null) {
  if (requestedSys === "SI" || requestedSys === "US" || requestedSys === "MIXED") {
    return requestedSys;
  }
  const r = Math.random();
  if (r < 0.40) return "SI";
  if (r < 0.80) return "US";
  return "MIXED";
}

export function sampleUnitMap(varsDb = {}, forcedSys = null) {
  const mode = sampleSystemMode(forcedSys);
  const _u = {};

  const dimensionalKeys = Object.keys(varsDb).filter(k => {
    const meta = varsDb[k] || {};
    return meta.dimension && meta.dimension !== "Dimensionless" && !meta.isAbstract;
  });

  let siKeys = new Set();
  let usKeys = new Set();

  if (mode === "MIXED") {
    const shuffled = [...dimensionalKeys].sort(() => Math.random() - 0.5);
    const halfCount = Math.floor(shuffled.length / 2);
    siKeys = new Set(shuffled.slice(0, halfCount));
    usKeys = new Set(shuffled.slice(halfCount));
  }

  dimensionalKeys.forEach(k => {
    const meta = varsDb[k] || {};
    const targetSys = (mode === "MIXED") ? (siKeys.has(k) ? "SI" : "US") : mode;
    const palette = DIMENSION_PALETTES[targetSys]?.[meta.dimension] || [meta.unit].filter(Boolean);
    const defaultUnit = meta.unit || palette[0] || "dimless";

    // INTRA-SYSTEM UNIT TRAP: phi(-3) (~23.6%) chance to trigger an alternative unit from the same system palette
    if (palette.length > 1 && Math.random() < phi(-3)) {
      const alternates = palette.filter(u => u !== defaultUnit);
      _u[k] = alternates.length > 0 ? alternates[Math.floor(Math.random() * alternates.length)] : defaultUnit;
    } else {
      _u[k] = defaultUnit;
    }
  });

  Object.keys(varsDb).forEach(k => {
    if (!_u[k]) _u[k] = varsDb[k]?.unit || "dimless";
  });

  return { mode, _u };
}
