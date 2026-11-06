/**
 * src/core/units.js
 * Unit formatting, conversion factors, dimensional cancellation, and target label generator.
 */

// ========================================================
// 1. STANDARD CONVERSION FACTORS & LATEX FRACTIONS
// ========================================================
const CONVERSIONS = {
  mm_to_in: { factor: 1 / 25.4, latex: '\\frac{1\\text{ in}}{25.4\\text{ mm}}' },
  in_to_mm: { factor: 25.4, latex: '\\frac{25.4\\text{ mm}}{1\\text{ in}}' },
  m_to_mm: { factor: 1000, latex: '\\frac{1000\\text{ mm}}{1\\text{ m}}' },
  mm_to_m: { factor: 1 / 1000, latex: '\\frac{1\\text{ m}}{1000\\text{ mm}}' },
  min_to_s: { factor: 60, latex: '\\frac{60\\text{ s}}{1\\text{ min}}' },
  s_to_min: { factor: 1 / 60, latex: '\\frac{1\\text{ min}}{60\\text{ s}}' },
  ft_to_in: { factor: 12, latex: '\\frac{12\\text{ in}}{1\\text{ ft}}' },
  in_to_ft: { factor: 1 / 12, latex: '\\frac{1\\text{ ft}}{12\\text{ in}}' }
};

// ========================================================
// 2. KATEX CANCELLATION & TEXT MACRO HELPERS
// ========================================================

/**
 * Returns a KaTeX string with proper double-escaped \cancel macro.
 * e.g., cancelUnit('mm') -> \cancel{\text{mm}}
 */
function cancelUnit(unitStr) {
  if (!unitStr) return '';
  return `\\cancel{\\text{${unitStr}}}`;
}

/**
 * Formats a unit wrapped in KaTeX \text{...}
 */
function textUnit(unitStr) {
  if (!unitStr) return '';
  return `\\text{${unitStr}}`;
}

/**
 * Formats dimensional conversion fractions with canceled tokens.
 */
function formatConversionWithCancellation(type) {
  switch (type) {
    case 'in_to_mm_cancel_mm':
      return '\\frac{25.4\\,\\cancel{\\text{mm}}}{1\\text{ in}}';
    case 'mm_to_in_cancel_mm':
      return '\\frac{1\\text{ in}}{25.4\\,\\cancel{\\text{mm}}}';
    case 'mm_to_m_cancel_mm':
      return '\\frac{1\\text{ m}}{1000\\,\\cancel{\\text{mm}}}';
    case 'm_to_mm_cancel_m':
      return '\\frac{1000\\text{ mm}}{1\\,\\cancel{\\text{m}}}';
    case 'min_to_s_cancel_min':
      return '\\frac{1\\,\\cancel{\\text{min}}}{60\\,\\cancel{\\text{s}}}';
    case 's_to_min_cancel_s':
      return '\\frac{60\\,\\cancel{\\text{s}}}{1\\text{ min}}';
    case 'ft_to_in_cancel_ft':
      return '\\frac{12\\text{ in}}{1\\,\\cancel{\\text{ft}}}';
    case 'in_to_ft_cancel_in':
      return '\\frac{1\\text{ ft}}{12\\,\\cancel{\\text{in}}}';
    case 'kW_to_W_cancel_kW':
      return '\\frac{1000\\text{ N}\\cdot\\text{m}/\\text{s}}{1\\,\\cancel{\\text{kW}}}';
    case 'hp_to_ftlb_cancel_hp':
      return '\\frac{33000\\text{ ft}\\cdot\\text{lb}/\\text{min}}{1\\,\\cancel{\\text{hp}}}';
    default:
      return '';
  }
}

// ========================================================
// 3. TARGET LABEL RESOLVER (FIXES REFERENCE ERROR)
// ========================================================

/**
 * Formats step targets into parseable tokens with physical units.
 * e.g., targetLabel("Pinion Pitch Diameter", "{{D_1|D_P1}}", "mm")
 * -> "Pinion Pitch Diameter ({{D_1|D_P1}}) in mm"
 */
function targetLabel(name, token, unit) {
  if (!unit || unit === "dimless" || unit === "ratio" || unit === "teeth") {
    return `${name} (${token})`;
  }
  if (unit === "deg") {
    return `${name} (${token}) in °`;
  }
  return `${name} (${token}) in ${unit}`;
}

// ========================================================
// 4. ENVIRONMENT EXPORTS
// ========================================================

// Browser global scope attachment (loaded via regular <script> tags)
if (typeof window !== 'undefined') {
  window.CONVERSIONS = CONVERSIONS;
  window.cancelUnit = cancelUnit;
  window.textUnit = textUnit;
  window.targetLabel = targetLabel;
  window.formatConversionWithCancellation = formatConversionWithCancellation;
}

// CommonJS export fallback for test environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONVERSIONS,
    cancelUnit,
    textUnit,
    targetLabel,
    formatConversionWithCancellation
  };
}
