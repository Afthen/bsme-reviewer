/**
 * src/cas/units/definitions.js
 * Comprehensive engineering unit registry with compound scale definitions.
 * Single source for unit TeX (unitToTex) and unit-aware value formatting.
 */

export const BASE_DIMENSIONS = Object.freeze({
  L: "Length", T: "Time", F: "Force", M: "Mass", Th: "Temperature", C: "Count", E: "Energy"
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
  kip:   { dim: "F", scale: 4448.2216, tex: "\\text{kip}" },
  kg:    { dim: "M", scale: 1.0, tex: "\\text{kg}" },
  g:     { dim: "M", scale: 0.001, tex: "\\text{g}" },
  lb_m:  { dim: "M", scale: 0.45359237, tex: "\\text{lb}_m" },
  K:     { dim: "Th", scale: 1.0, tex: "\\text{K}" },
  "°C":  { dim: "Th", scale: 1.0, offset: 273.15, tex: "°\\text{C}" },
  "°F":  { dim: "Th", scale: 5 / 9, offset: 459.67, tex: "°\\text{F}" },
  "°R":  { dim: "Th", scale: 5 / 9, tex: "°\\text{R}" },
  Btu:   { dim: "E", scale: 1.0, tex: "\\text{Btu}" },
  teeth: { dim: "C", scale: 1.0, tex: "\\text{teeth}" },
  rad:   { dim: "C", scale: 1.0, tex: "\\text{rad}" },
  rev:   { dim: "C", scale: 1.0, tex: "\\text{rev}" },
  "°":   { dim: "C", scale: Math.PI / 180, tex: "°" },
  deg:   { dim: "C", scale: Math.PI / 180, tex: "°" }
});

export const COMPOUND_UNITS = Object.freeze({
  psi:        { atoms: { lb: 1, in: -2 }, displayTex: "\\text{psi}" },
  psf:        { atoms: { lb: 1, ft: -2 }, displayTex: "\\text{psf}" },
  ksi:        { factor: 6894757.29, atoms: { N: 1, m: -2 }, displayTex: "\\text{ksi}" },
  MPa:        { atoms: { N: 1, mm: -2 }, displayTex: "\\text{MPa}", substituteTex: "\\cfrac{\\text{N}}{\\text{mm}^2}" },
  Pa:         { atoms: { N: 1, m: -2 }, displayTex: "\\text{Pa}", substituteTex: "\\cfrac{\\text{N}}{\\text{m}^2}" },
  kPa:        { atoms: { kN: 1, m: -2 }, displayTex: "\\text{kPa}", substituteTex: "\\cfrac{\\text{kN}}{\\text{m}^2}" },
  bar:        { factor: 100000, atoms: { N: 1, m: -2 }, displayTex: "\\text{bar}" },

  // Decomposed Pressure Formulations
  "N/m^2":    { atoms: { N: 1, m: -2 }, displayTex: "\\cfrac{\\text{N}}{\\text{m}^2}" },
  "kN/m^2":   { atoms: { kN: 1, m: -2 }, displayTex: "\\cfrac{\\text{kN}}{\\text{m}^2}" },
  "N/mm^2":   { atoms: { N: 1, mm: -2 }, displayTex: "\\cfrac{\\text{N}}{\\text{mm}^2}" },
  "lb/in^2":  { atoms: { lb: 1, in: -2 }, displayTex: "\\cfrac{\\text{lb}}{\\text{in}^2}" },
  "lb/ft^2":  { atoms: { lb: 1, ft: -2 }, displayTex: "\\cfrac{\\text{lb}}{\\text{ft}^2}" },

  "N-m":      { atoms: { N: 1, m: 1 }, displayTex: "\\text{N}\\cdot\\text{m}" },
  "N*m":      { atoms: { N: 1, m: 1 }, displayTex: "\\text{N}\\cdot\\text{m}" },
  "kN-m":     { atoms: { kN: 1, m: 1 }, displayTex: "\\text{kN}\\cdot\\text{m}" },
  "lb-in":    { atoms: { lb: 1, in: 1 }, displayTex: "\\text{lb}\\cdot\\text{in}" },
  "lb-ft":    { atoms: { lb: 1, ft: 1 }, displayTex: "\\text{lb}\\cdot\\text{ft}" },
  J:          { atoms: { N: 1, m: 1 }, displayTex: "\\text{J}" },
  kJ:         { atoms: { kN: 1, m: 1 }, displayTex: "\\text{kJ}" },

  W:          { atoms: { N: 1, m: 1, s: -1 }, displayTex: "\\text{W}", substituteTex: "\\cfrac{\\text{J}}{\\text{s}}" },
  kW:         { atoms: { kN: 1, m: 1, s: -1 }, displayTex: "\\text{kW}", substituteTex: "\\cfrac{\\text{kJ}}{\\text{s}}" },
  MW:         { factor: 1e6, atoms: { N: 1, m: 1, s: -1 }, displayTex: "\\text{MW}" },
  hp:         { factor: 33000, atoms: { ft: 1, lb: 1, min: -1 }, displayTex: "\\text{hp}" },

  // Decomposed Power Formulations
  "J/s":          { atoms: { N: 1, m: 1, s: -1 }, displayTex: "\\cfrac{\\text{J}}{\\text{s}}" },
  "kJ/s":         { atoms: { kN: 1, m: 1, s: -1 }, displayTex: "\\cfrac{\\text{kJ}}{\\text{s}}" },
  "N-m/s":        { atoms: { N: 1, m: 1, s: -1 }, displayTex: "\\cfrac{\\text{N}\\cdot\\text{m}}{\\text{s}}" },
  "N*m/s":        { atoms: { N: 1, m: 1, s: -1 }, displayTex: "\\cfrac{\\text{N}\\cdot\\text{m}}{\\text{s}}" },
  "kN-m/s":       { atoms: { kN: 1, m: 1, s: -1 }, displayTex: "\\cfrac{\\text{kN}\\cdot\\text{m}}{\\text{s}}" },
  "kg*m^2/s^3":   { atoms: { kg: 1, m: 2, s: -3 }, displayTex: "\\cfrac{\\text{kg}\\cdot\\text{m}^2}{\\text{s}^3}" },
  "kg-m^2/s^3":   { atoms: { kg: 1, m: 2, s: -3 }, displayTex: "\\cfrac{\\text{kg}\\cdot\\text{m}^2}{\\text{s}^3}" },
  "ft-lb/s":      { atoms: { ft: 1, lb: 1, s: -1 }, displayTex: "\\cfrac{\\text{ft}\\cdot\\text{lb}}{\\text{s}}" },
  "ft-lb/min":    { atoms: { ft: 1, lb: 1, min: -1 }, displayTex: "\\cfrac{\\text{ft}\\cdot\\text{lb}}{\\text{min}}" },

  // Decomposed Force Formulations
  "kg*m/s^2":     { atoms: { kg: 1, m: 1, s: -2 }, displayTex: "\\cfrac{\\text{kg}\\cdot\\text{m}}{\\text{s}^2}" },
  "kg-m/s^2":     { atoms: { kg: 1, m: 1, s: -2 }, displayTex: "\\cfrac{\\text{kg}\\cdot\\text{m}}{\\text{s}^2}" },

  "m^2":      { atoms: { m: 2 }, displayTex: "\\text{m}^2" },
  "in^2":     { atoms: { in: 2 }, displayTex: "\\text{in}^2" },
  "m^3":      { atoms: { m: 3 }, displayTex: "\\text{m}^3" },
  L:          { factor: 0.001, atoms: { m: 3 }, displayTex: "\\text{L}" },
  "m^3/s":    { atoms: { m: 3, s: -1 }, displayTex: "\\cfrac{\\text{m}^3}{\\text{s}}" },
  "m^3/h":    { atoms: { m: 3, h: -1 }, displayTex: "\\cfrac{\\text{m}^3}{\\text{h}}" },
  "L/h":      { factor: 0.001 / 3600, atoms: { m: 3, s: -1 }, displayTex: "\\cfrac{\\text{L}}{\\text{h}}" },
  cfm:        { factor: 0.3048 ** 3 / 60, atoms: { m: 3, s: -1 }, displayTex: "\\text{cfm}" },

  "kg/m^3":   { atoms: { kg: 1, m: -3 }, displayTex: "\\cfrac{\\text{kg}}{\\text{m}^3}" },
  "m^3/kg":   { atoms: { m: 3, kg: -1 }, displayTex: "\\cfrac{\\text{m}^3}{\\text{kg}}" },
  "lb/ft^3":  { atoms: { lb_m: 1, ft: -3 }, displayTex: "\\cfrac{\\text{lb}}{\\text{ft}^3}" },
  "ft^3/lb":  { atoms: { ft: 3, lb_m: -1 }, displayTex: "\\cfrac{\\text{ft}^3}{\\text{lb}}" },

  "kJ/kg":    { atoms: { kN: 1, m: 1, kg: -1 }, displayTex: "\\cfrac{\\text{kJ}}{\\text{kg}}" },
  "Btu/lb":   { atoms: { Btu: 1, lb_m: -1 }, substituteTex: "\\cfrac{\\text{Btu}}{\\text{lb}}" },
  "Btu/min":  { atoms: { Btu: 1, min: -1 }, substituteTex: "\\cfrac{\\text{Btu}}{\\text{min}}" },
  "Btu/h":    { atoms: { Btu: 1, h: -1 }, substituteTex: "\\cfrac{\\text{Btu}}{\\text{h}}" },
  "Btu/hr":   { atoms: { Btu: 1, h: -1 }, substituteTex: "\\cfrac{\\text{Btu}}{\\text{h}}" },

  kWh:        { factor: 3.6e6, atoms: { N: 1, m: 1 }, displayTex: "\\text{kWh}" },
  "kg/kWh":   { factor: 1 / 3.6e6, atoms: { kg: 1, N: -1, m: -1 }, displayTex: "\\cfrac{\\text{kg}}{\\text{kWh}}" },
  "g/kWh":    { factor: 0.001 / 3.6e6, atoms: { g: 1, N: -1, m: -1 }, displayTex: "\\cfrac{\\text{g}}{\\text{kWh}}" },
  "kg/h":     { factor: 1 / 3600, atoms: { kg: 1, s: -1 }, displayTex: "\\cfrac{\\text{kg}}{\\text{h}}" },
  "lb/hp-h":  { factor: 0.45359237 / (745.69987 * 3600), atoms: { kg: 1, N: -1, m: -1 }, displayTex: "\\cfrac{\\text{lb}}{\\text{hp}\\cdot\\text{h}}" },
  "lb/hp-hr": { factor: 0.45359237 / (745.69987 * 3600), atoms: { kg: 1, N: -1, m: -1 }, displayTex: "\\cfrac{\\text{lb}}{\\text{hp}\\cdot\\text{h}}" },

  "m/s":      { atoms: { m: 1, s: -1 }, displayTex: "\\cfrac{\\text{m}}{\\text{s}}" },
  "m/min":    { factor: 1 / 60, atoms: { m: 1, s: -1 }, displayTex: "\\cfrac{\\text{m}}{\\text{min}}" },
  "ft/min":   { atoms: { ft: 1, min: -1 }, displayTex: "\\cfrac{\\text{ft}}{\\text{min}}" },
  "ft/s":     { atoms: { ft: 1, s: -1 }, displayTex: "\\cfrac{\\text{ft}}{\\text{s}}" },
  "kg/s":     { atoms: { kg: 1, s: -1 }, displayTex: "\\cfrac{\\text{kg}}{\\text{s}}" },
  "g/s":      { atoms: { g: 1, s: -1 }, displayTex: "\\cfrac{\\text{g}}{\\text{s}}" },
  "kg/min":   { atoms: { kg: 1, min: -1 }, displayTex: "\\cfrac{\\text{kg}}{\\text{min}}" },
  "lb/min":   { atoms: { lb_m: 1, min: -1 }, displayTex: "\\cfrac{\\text{lb}}{\\text{min}}" },
  "lb/s":     { atoms: { lb_m: 1, s: -1 }, displayTex: "\\cfrac{\\text{lb}}{\\text{s}}" },
  "lb/h":     { factor: 1 / 3600, atoms: { lb_m: 1, s: -1 }, displayTex: "\\cfrac{\\text{lb}}{\\text{h}}" },
  "lb/hr":    { factor: 1 / 3600, atoms: { lb_m: 1, s: -1 }, displayTex: "\\cfrac{\\text{lb}}{\\text{h}}" },

  "teeth/in": { atoms: { teeth: 1, in: -1 }, displayTex: "\\cfrac{\\text{teeth}}{\\text{in}}" },
  rpm:        { atoms: { min: -1 }, displayTex: "\\text{rpm}" },
  "rev/s":    { atoms: { s: -1 }, displayTex: "\\cfrac{\\text{rev}}{\\text{s}}" },
  "rev/min":  { atoms: { min: -1 }, displayTex: "\\cfrac{\\text{rev}}{\\text{min}}" },
  "strokes/min": { atoms: { min: -1 }, displayTex: "\\text{strokes/min}" },

  "kJ/(kg*K)":{ factor: 1000, atoms: { N: 1, m: 1, kg: -1, K: -1 }, displayTex: "\\cfrac{\\text{kJ}}{\\text{kg}\\cdot\\text{K}}" },
  "kJ/kg-K":  { factor: 1000, atoms: { N: 1, m: 1, kg: -1, K: -1 }, displayTex: "\\cfrac{\\text{kJ}}{\\text{kg}\\cdot\\text{K}}" },
  "Btu/(lb*F)":{ atoms: { Btu: 1, lb_m: -1, "°F": -1 }, substituteTex: "\\cfrac{\\text{Btu}}{\\text{lb}\\cdot°\\text{F}}" },
  "Btu/lb-F":  { atoms: { Btu: 1, lb_m: -1, "°F": -1 }, substituteTex: "\\cfrac{\\text{Btu}}{\\text{lb}\\cdot°\\text{F}}" }
});

export function getUnitAtomBag(uName) {
  if (!uName || uName === "dimless" || uName === "ratio") {
    return { factor: 1.0, atoms: {}, dimMap: {}, scale: 1.0, isDimensionless: true };
  }
  if (uName === "%") {
    return {
      factor: 0.01, atoms: {}, dimMap: {}, scale: 0.01,
      isDimensionless: true, scaledDimensionless: true, displayTex: "\\%"
    };
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
    return { factor, atoms, dimMap, scale, isDimensionless: false, displayTex: c.displayTex, substituteTex: c.substituteTex };
  }
  if (ATOMIC_BASE_UNITS[uName]) {
    const b = ATOMIC_BASE_UNITS[uName];
    return { factor: 1.0, atoms: { [uName]: 1 }, dimMap: { [b.dim]: 1 }, scale: b.scale, offset: b.offset || 0, isDimensionless: false, displayTex: b.tex };
  }
  return { factor: 1.0, atoms: {}, dimMap: {}, scale: 1.0, isDimensionless: false, isUnknown: true, rawUnit: uName };
}

export function isDimEqual(aMap, bMap) {
  const all = new Set([...Object.keys(aMap || {}), ...Object.keys(bMap || {})]);
  for (const d of all) if ((aMap?.[d] || 0) !== (bMap?.[d] || 0)) return false;
  return true;
}

const UNIT_TEX_ALIASES = Object.freeze({ "%": "\\%", "°": "^{\\circ}" });

export function unitToTex(unitName = "") {
  const cleaned = String(unitName || "").trim();
  if (!cleaned || cleaned === "dimless" || cleaned === "ratio") return "";
  if (UNIT_TEX_ALIASES[cleaned]) return UNIT_TEX_ALIASES[cleaned];

  const [numPart = "", denPart = ""] = cleaned.split("/");
  const parse = part => part.split(/[·* ]+/).filter(Boolean).map(tok => {
    const m = tok.match(/^([A-Za-z°%_]+)(?:\^(-?\d+))?$/);
    if (!m) return `\\text{${tok}}`;
    const base = UNIT_TEX_ALIASES[m[1]] || `\\text{${m[1]}}`;
    return m[2] ? `${base}^{${m[2]}}` : base;
  });

  const num = parse(numPart);
  const den = parse(denPart);
  if (!den.length) return num.join("\\,");
  if (!num.length) return `\\cfrac{1}{${den.join("\\cdot ")}}`;
  return `\\cfrac{${num.join("\\cdot ")}}{${den.join("\\cdot ")}}`;
}

/** Converts numeric value from internal coherent base to target unit. */
export function formatValueInUnit(value, unitName = "") {
  const bag = getUnitAtomBag(unitName);
  const scale = bag?.scale || 1.0;
  return scale ? value / scale : value;
}

/** Converts numeric value in given unit back to internal coherent base. */
export function valueToCoherentBase(value, unitName = "") {
  const bag = getUnitAtomBag(unitName);
  const scale = bag?.scale || 1.0;
  return value * scale;
}