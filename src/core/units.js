/**
 * src/core/units.js
 * Unit formatting, conversion factors, and KaTeX cancellation renderer.
 */

const CONVERSIONS = {
  mm_to_in: { factor: 1 / 25.4, latex: '\\frac{1\\text{ in}}{25.4\\text{ mm}}' },
  in_to_mm: { factor: 25.4, latex: '\\frac{25.4\\text{ mm}}{1\\text{ in}}' },
  m_to_mm: { factor: 1000, latex: '\\frac{1000\\text{ mm}}{1\\text{ m}}' },
  mm_to_m: { factor: 1 / 1000, latex: '\\frac{1\\text{ m}}{1000\\text{ mm}}' },
  min_to_s: { factor: 60, latex: '\\frac{60\\text{ s}}{1\\text{ min}}' },
  s_to_min: { factor: 1 / 60, latex: '\\frac{1\\text{ min}}{60\\text{ s}}' }
};

/**
 * Returns a KaTeX string with proper double-escaped \cancel macro.
 */
function cancelUnit(unitStr) {
  return `\\cancel{\\text{${unitStr}}}`;
}

/**
 * Formats a unit nicely wrapped in KaTeX \text{...}
 */
function textUnit(unitStr) {
  return `\\text{${unitStr}}`;
}

/**
 * Formats standard dimensional conversion fractions with canceled tokens.
 */
function formatConversionWithCancellation(type) {
  switch (type) {
    case 'in_to_mm_cancel_mm':
      return `\\frac{25.4\\,\\cancel{\\text{mm}}}{1\\text{ in}}`;
    case 'mm_to_in_cancel_mm':
      return `\\frac{1\\text{ in}}{25.4\\,\\cancel{\\text{mm}}}`;
    case 'mm_to_m_cancel_mm':
      return `\\frac{1\\text{ m}}{1000\\,\\cancel{\\text{mm}}}`;
    case 'm_to_mm_cancel_m':
      return `\\frac{1000\\text{ mm}}{1\\,\\cancel{\\text{m}}}`;
    case 'min_to_s_cancel_min':
      return `\\frac{1\\,\\cancel{\\text{min}}}{60\\,\\cancel{\\text{s}}}`;
    default:
      return '';
  }
}

// Global scope export for non-module index.html scripts
if (typeof window !== 'undefined') {
  window.CONVERSIONS = CONVERSIONS;
  window.cancelUnit = cancelUnit;
  window.textUnit = textUnit;
  window.formatConversionWithCancellation = formatConversionWithCancellation;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONVERSIONS, cancelUnit, textUnit, formatConversionWithCancellation };
}
