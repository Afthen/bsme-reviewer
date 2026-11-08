/**
 * src/cas/units/definitions.js
 * Atomic units dictionary and unified compound definitions.
 * Units with natural 1:1 derivative forms omit factor and declare substituteTex.
 */

export const BASE_DIMENSIONS = Object.freeze({
  L: "Length", T: "Time", F: "Force", M: "Mass", Th: "Temperature", C: "Count"
});

export const ATOMIC_BASE_UNITS = Object.freeze({
  m:     { dim: "L", scale: 1.0, tex: "\\text{m}" },
  mm:    { dim: "L", scale: 0.001, tex: "\\text{mm}" },
  cm:    { dim: "L", scale: 0.01, tex: "\\text{cm}" },
  in:    { dim: "L", scale: 0.0254, tex: "\\text{in}" },
  ft:    { dim: "L", scale: 0.3048, tex: "\\text{ft}" },
  yd:    { dim: "L", scale: 0.9144, tex: "\\text{yd}" },
  s:     { dim: "T", scale: 1.0, tex: "\\text{s}" },
  min:   { dim: "T", scale: 60.0, tex: "\\text{min}" },
  h:     { dim: "T", scale: 3600.0, tex: "\\text{h}" },
  hr:    { dim: "T", scale: 3600.0, tex: "\\text{h}" },
  N:     { dim: "F", scale: 1.0, tex: "\\text{N}" },
  kN:    { dim: "F", scale: 1000.0, tex: "\\text{kN}" },
  lb:    { dim: "F", scale: 4.4482216, tex: "\\text{lb}" },
  kg:    { dim: "M", scale: 1.0, tex: "\\text{kg}" },
  g:     { dim: "M", scale: 0.001, tex: "\\text{g}" },
  lb_m:  { dim: "M", scale: 0.45359237, tex: "\\text{lb}_m" },
  K:     { dim: "Th", scale: 1.0, tex: "\\text{K}" },
  "°C":  { dim: "Th", scale: 1.0, tex: "^\\circ\\text{C}" },
  "°F":  { dim: "Th", scale: 5 / 9, tex: "^\\circ\\text{F}" },
  "°R":  { dim: "Th", scale: 5 / 9, tex: "^\\circ\\text{R}" },
  teeth: { dim: "C", scale: 1.0, tex: "\\text{teeth}" },
  rad:   { dim: "C", scale: 1.0, tex: "\\text{rad}" },
  rev:   { dim: "C", scale: 1.0, tex: "\\text{rev}" },
  "°":   { dim: "C", scale: Math.PI / 180, tex: "°" },
  deg:   { dim: "C", scale: Math.PI / 180, tex: "°" },
  "%":   { dim: "C", scale: 0.01, tex: "\\%" }
});

export const COMPOUND_UNITS = Object.freeze({
  // --- Pressure & Stress ---
  psi:        { atoms: { lb: 1, in: -2 }, displayTex: "\\text{psi}" },
  psf:        { atoms: { lb: 1, ft: -2 }, displayTex: "\\text{psf}" },
  MPa:        { atoms: { N: 1, mm: -2 }, displayTex: "\\text{MPa}", substituteTex: "\\cfrac{\\text{N}}{\\text{mm}^2}" },
  Pa:         { atoms: { N: 1, m: -2 }, displayTex: "\\text{Pa}", substituteTex: "\\cfrac{\\text{N}}{\\text{m}^2}" },
  kPa:        { atoms: { kN: 1, m: -2 }, displayTex: "\\text{kPa}", substituteTex: "\\cfrac{\\text{kN}}{\\text{m}^2}" },
  bar:        { factor: 100000, atoms: { N: 1, m: -2 }, displayTex: "\\text{bar}" },

  // --- Torque & Work ---
  "N-m":      { atoms: { N: 1, m: 1 }, displayTex: "\\text{N}\\cdot\\text{m}" },
  "N*m":      { atoms: { N: 1, m: 1 }, displayTex: "\\text{N}\\cdot\\text{m}" },
  "kN-m":     { atoms: { kN: 1, m: 1 }, displayTex: "\\text{kN}\\cdot\\text{m}" },
  "lb-in":    { atoms: { lb: 1, in: 1 }, displayTex: "\\text{lb}\\cdot\\text{in}" },
  "lb-ft":    { atoms: { lb: 1, ft: 1 }, displayTex: "\\text{lb}\\cdot\\text{ft}" },
  J:          { atoms: { N: 1, m: 1 }, displayTex: "\\text{J}" },
  kJ:         { atoms: { kN: 1, m: 1 }, displayTex: "\\text{kJ}" },

  // --- Power (1:1 Drop-in derivative forms) ---
  W:          { atoms: { N: 1, m: 1, s: -1 }, displayTex: "\\text{W}", substituteTex: "\\cfrac{\\text{J}}{\\text{s}}" },
  kW:         { atoms: { kN: 1, m: 1, s: -1 }, displayTex: "\\text{kW}", substituteTex: "\\cfrac{\\text{kJ}}{\\text{s}}" },
  MW:         { factor: 1e6, atoms: { N: 1, m: 1, s: -1 }, displayTex: "\\text{MW}" },
  hp:         { factor: 33000, atoms: { ft: 1, lb: 1, min: -1 }, displayTex: "\\text{hp}" },

  // --- Area & Volume ---
  "m^2":      { atoms: { m: 2 }, displayTex: "\\text{m}^2" },
  "mm^2":     { atoms: { mm: 2 }, displayTex: "\\text{mm}^2" },
  "in^2":     { atoms: { in: 2 }, displayTex: "\\text{in}^2" },
  "cm^2":     { atoms: { cm: 2 }, displayTex: "\\text{cm}^2" },
  "ft^2":     { atoms: { ft: 2 }, displayTex: "\\text{ft}^2" },

  "m^3":      { atoms: { m: 3 }, displayTex: "\\text{m}^3" },
  "cm^3":     { atoms: { cm: 3 }, displayTex: "\\text{cm}^3" },
  "in^3":     { atoms: { in: 3 }, displayTex: "\\text{in}^3" },
  "ft^3":     { atoms: { ft: 3 }, displayTex: "\\text{ft}^3" },
  L:          { factor: 0.001, atoms: { m: 3 }, displayTex: "\\text{L}" },
  cfm:        { factor: 0.3048 ** 3 / 60, atoms: { m: 3, s: -1 }, displayTex: "\\text{cfm}" },

  // --- Density ---
  "kg/m^3":   { atoms: { kg: 1, m: -3 }, displayTex: "\\cfrac{\\text{kg}}{\\text{m}^3}" },
  "kg/L":     { factor: 1000, atoms: { kg: 1, m: -3 }, displayTex: "\\cfrac{\\text{kg}}{\\text{L}}" },
  "g/cm^3":   { factor: 1000, atoms: { kg: 1, m: -3 }, displayTex: "\\cfrac{\\text{g}}{\\text{cm}^3}" },
  "lb/ft^3":  { atoms: { lb_m: 1, ft: -3 }, displayTex: "\\cfrac{\\text{lb}}{\\text{ft}^3}" },

  // --- Specific Energy & Heat ---
  "kJ/kg":    { atoms: { kN: 1, m: 1, kg: -1 }, displayTex: "\\cfrac{\\text{kJ}}{\\text{kg}}" },
  Btu:        { factor: 1055.05585, atoms: { N: 1, m: 1 }, displayTex: "\\text{Btu}" },
  "Btu/lb":   { factor: 2326, atoms: { N: 1, m: 1, kg: -1 }, displayTex: "\\cfrac{\\text{Btu}}{\\text{lb}}" },
  "Btu/min":  { factor: 1055.05585 / 60, atoms: { N: 1, m: 1, s: -1 }, displayTex: "\\cfrac{\\text{Btu}}{\\text{min}}" },
  "Btu/h":    { factor: 1055.05585 / 3600, atoms: { N: 1, m: 1, s: -1 }, displayTex: "\\cfrac{\\text{Btu}}{\\text{h}}" },
  "Btu/hr":   { factor: 1055.05585 / 3600, atoms: { N: 1, m: 1, s: -1 }, displayTex: "\\cfrac{\\text{Btu}}{\\text{h}}" },

  kWh:        { factor: 3.6e6, atoms: { N: 1, m: 1 }, displayTex: "\\text{kWh}" },
  "kg/kWh":   { factor: 1 / 3.6e6, atoms: { kg: 1, N: -1, m: -1 }, displayTex: "\\cfrac{\\text{kg}}{\\text{kWh}}" },
  "g/kWh":    { factor: 0.001 / 3.6e6, atoms: { g: 1, N: -1, m: -1 }, displayTex: "\\cfrac{\\text{g}}{\\text{kWh}}" },
  "lb/hp-h":  { factor: 0.45359237 / (745.69987 * 3600), atoms: { kg: 1, N: -1, m: -1 }, displayTex: "\\cfrac{\\text{lb}}{\\text{hp}\\cdot\\text{h}}" },
  "lb/hp-hr": { factor: 0.45359237 / (745.69987 * 3600), atoms: { kg: 1, N: -1, m: -1 }, displayTex: "\\cfrac{\\text{lb}}{\\text{hp}\\cdot\\text{h}}" },

  // --- Velocities & Flow Rates ---
  "m/s":      { atoms: { m: 1, s: -1 }, displayTex: "\\cfrac{\\text{m}}{\\text{s}}" },
  "ft/min":   { atoms: { ft: 1, min: -1 }, displayTex: "\\cfrac{\\text{ft}}{\\text{min}}" },
  "kg/s":     { atoms: { kg: 1, s: -1 }, displayTex: "\\cfrac{\\text{kg}}{\\text{s}}" },
  "g/s":      { atoms: { g: 1, s: -1 }, displayTex: "\\cfrac{\\text{g}}{\\text{s}}" },
  "kg/min":   { atoms: { kg: 1, min: -1 }, displayTex: "\\cfrac{\\text{kg}}{\\text{min}}" },
  "lb/min":   { atoms: { lb_m: 1, min: -1 }, displayTex: "\\cfrac{\\text{lb}}{\\text{min}}" },
  "lb/s":     { atoms: { lb_m: 1, s: -1 }, displayTex: "\\cfrac{\\text{lb}}{\\text{s}}" },

  // --- Rotational & Gearing ---
  "teeth/in": { atoms: { teeth: 1, in: -1 }, displayTex: "\\cfrac{\\text{teeth}}{\\text{in}}" },
  rpm:        { atoms: { min: -1 }, displayTex: "\\text{rpm}" },
  "rev/s":    { atoms: { s: -1 }, displayTex: "\\cfrac{\\text{rev}}{\\text{s}}" },
  "rev/min":  { atoms: { min: -1 }, displayTex: "\\cfrac{\\text{rev}}{\\text{min}}" },
  "strokes/min": { atoms: { min: -1 }, displayTex: "\\text{strokes/min}" },

  // --- Specific Heat ---
  "kJ/(kg*K)":{ factor: 1000, atoms: { N: 1, m: 1, kg: -1, K: -1 }, displayTex: "\\cfrac{\\text{kJ}}{\\text{kg}\\cdot\\text{K}}" },
  "kJ/kg-K":  { factor: 1000, atoms: { N: 1, m: 1, kg: -1, K: -1 }, displayTex: "\\cfrac{\\text{kJ}}{\\text{kg}\\cdot\\text{K}}" },
  "Btu/(lb*F)":{ factor: 4186.8, atoms: { N: 1, m: 1, kg: -1, K: -1 }, displayTex: "\\cfrac{\\text{Btu}}{\\text{lb}\\cdot^\\circ\\text{F}}" },
  "Btu/lb-F": { factor: 4186.8, atoms: { N: 1, m: 1, kg: -1, K: -1 }, displayTex: "\\cfrac{\\text{Btu}}{\\text{lb}\\cdot^\\circ\\text{F}}" }
});

export function getUnitAtomBag(uName) {
  if (!uName || uName === "dimless" || uName === "ratio") {
    return { factor: 1.0, atoms: {}, dimMap: {}, scale: 1.0, isDimensionless: true };
  }
  if (uName === "%") {
    return { factor: 1.0, atoms: { "%": 1 }, dimMap: { C: 1 }, scale: 0.01, isDimensionless: false, displayTex: "\\%" };
  }
  if (COMPOUND_UNITS[uName]) {
    const c = COMPOUND_UNITS[uName];
    const factor = c.factor || 1.0;
    const atoms = { ...c.atoms };
    let scale = factor;
    const dimMap = {};
    for (const [aName, p] of Object.entries(atoms)) {
      const b = ATOMIC_BASE_UNITS[aName];
      if (b) {
        dimMap[b.dim] = (dimMap[b.dim] || 0) + p;
        scale *= Math.pow(b.scale, p);
      }
    }
    return {
      factor,
      atoms,
      dimMap,
      scale,
      isDimensionless: false,
      displayTex: c.displayTex,
      substituteTex: c.substituteTex
    };
  }
  if (ATOMIC_BASE_UNITS[uName]) {
    const b = ATOMIC_BASE_UNITS[uName];
    return { factor: 1.0, atoms: { [uName]: 1 }, dimMap: { [b.dim]: 1 }, scale: b.scale, isDimensionless: false, displayTex: b.tex };
  }
  return { factor: 1.0, atoms: {}, dimMap: {}, scale: 1.0, isDimensionless: false, isUnknown: true, rawUnit: uName };
}

export function isDimEqual(aMap, bMap) {
  const all = new Set([...Object.keys(aMap || {}), ...Object.keys(bMap || {})]);
  for (const d of all) if ((aMap?.[d] || 0) !== (bMap?.[d] || 0)) return false;
  return true;
}
