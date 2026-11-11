/**
 * src/topics/powerplant/diesel_engine/relations.js
 * Physical relations for stationary diesel engine machinery.
 * Pure physical definitions without hardcoded unit conversion factors.
 */
export const DIESEL_ENGINE_RELATIONS = Object.freeze([
  { id: "eq_de_power_bal", name: "Engine Power Balance", canonicalTex: "IP = BP + FP", baseFormula: "IP = BP + FP", nodes: ["IP", "BP", "FP"] },
  { id: "eq_de_etam", name: "Mechanical Efficiency", canonicalTex: "\\eta_m = \\frac{BP}{IP}", baseFormula: "eta_m = BP / IP", nodes: ["eta_m", "BP", "IP"] },
  { id: "eq_de_qf", name: "Heat Supplied by Fuel", canonicalTex: "Q_f = \\dot{m}_f HV", baseFormula: "Q_f = m_f * HV", nodes: ["Q_f", "m_f", "HV"] },
  { id: "eq_de_etath", name: "Brake Thermal Efficiency", canonicalTex: "\\eta_{th} = \\frac{BP}{Q_f}", baseFormula: "eta_th = BP / Q_f", nodes: ["eta_th", "BP", "Q_f"] },
  { id: "eq_de_etaith", name: "Indicated Thermal Efficiency", canonicalTex: "\\eta_{ith} = \\frac{IP}{Q_f}", baseFormula: "eta_ith = IP / Q_f", nodes: ["eta_ith", "IP", "Q_f"] },
  
  // Pure physical definitions: unit conversions are handled by the dimensional analysis engine
  { 
    id: "eq_de_bsfc", 
    name: "Brake Specific Fuel Consumption", 
    canonicalTex: "bsfc = \\frac{\\dot{m}_f}{BP}", 
    baseFormula: "bsfc = m_f / BP", 
    nodes: ["bsfc", "m_f", "BP"]
  },
  { 
    id: "eq_de_isfc", 
    name: "Indicated Specific Fuel Consumption", 
    canonicalTex: "isfc = \\frac{\\dot{m}_f}{IP}", 
    baseFormula: "isfc = m_f / IP", 
    nodes: ["isfc", "m_f", "IP"]
  },
  { id: "eq_de_ep", name: "Generator Electrical Power", canonicalTex: "EP = BP \\eta_g", baseFormula: "EP = BP * eta_g", nodes: ["EP", "BP", "eta_g"] }
]);
