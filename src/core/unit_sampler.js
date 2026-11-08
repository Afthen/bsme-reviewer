/**
 * src/core/unit_sampler.js
 * 40% SI / 40% US / 20% Mixed Unit Sampler with 50/50 dimensional variable split.
 */

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
    "Length": ["in", "ft"],
    "Force": ["lb"],
    "Pressure / Stress": ["psi", "psf"],
    "Power": ["hp", "Btu/min"],
    "Specific Energy / Enthalpy": ["Btu/lb"],
    "Mass Flow Rate": ["lb/s", "lb/min"],
    "Temperature": ["°F"]
  }
});

/**
 * Samples overall system mode:
 * 40% Pure SI, 40% Pure US, 20% Mixed
 */
export function sampleSystemMode(requestedSys = null) {
  if (requestedSys === "SI" || requestedSys === "US" || requestedSys === "MIXED") {
    return requestedSys;
  }
  const r = Math.random();
  if (r < 0.40) return "SI";
  if (r < 0.80) return "US";
  return "MIXED";
}

/**
 * Samples randomized units for a system:
 * In MIXED mode, guarantees an EXACT 50/50 split of dimensional variables between SI and US.
 */
export function sampleUnitMap(varsDb = {}, forcedSys = null) {
  const mode = sampleSystemMode(forcedSys);
  const _u = {};

  // Filter variables that possess a real physical dimension
  const dimensionalKeys = Object.keys(varsDb).filter(k => {
    const meta = varsDb[k] || {};
    return meta.dimension && meta.dimension !== "Dimensionless" && !meta.isAbstract;
  });

  if (mode === "MIXED") {
    // Shuffle dimensional variables
    const shuffled = [...dimensionalKeys].sort(() => Math.random() - 0.5);
    const halfCount = Math.floor(shuffled.length / 2);
    const siKeys = new Set(shuffled.slice(0, halfCount));
    const usKeys = new Set(shuffled.slice(halfCount));

    dimensionalKeys.forEach(k => {
      const meta = varsDb[k] || {};
      const targetSys = siKeys.has(k) ? "SI" : "US";
      const palette = DIMENSION_PALETTES[targetSys][meta.dimension];
      _u[k] = palette ? palette[Math.floor(Math.random() * palette.length)] : (meta.unit || "dimless");
    });
  } else {
    // Pure SI or Pure US with sensible palette randomization
    const sys = mode;
    dimensionalKeys.forEach(k => {
      const meta = varsDb[k] || {};
      const palette = DIMENSION_PALETTES[sys]?.[meta.dimension];
      _u[k] = palette ? palette[Math.floor(Math.random() * palette.length)] : (meta.unit || "dimless");
    });
  }

  // Dimensionless variables remain dimensionless
  Object.keys(varsDb).forEach(k => {
    if (!_u[k]) _u[k] = varsDb[k]?.unit || "dimless";
  });

  return { mode, _u };
}
