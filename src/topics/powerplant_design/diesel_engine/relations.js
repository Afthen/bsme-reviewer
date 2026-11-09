/**
 * src/topics/powerplant/diesel_engine/relations.js
 * Empirical relations bounded with unit-contracts via requiredUnits to 
 * maintain kg/kWh formatting while natively evaluating in standard SI blocks.
 */
export const DIESEL_ENGINE_RELATIONS = Object.freeze([
  { id: "eq_de_power_bal", name: "Engine Power Balance", canonicalTex: "IP = BP + FP", baseFormula: "IP = BP + FP", nodes: ["IP", "BP", "FP"] },
  { id: "eq_de_etam", name: "Mechanical Efficiency", canonicalTex: "\\eta_m = \\frac{BP}{IP}", baseFormula: "eta_m = BP / IP", nodes: ["eta_m", "BP", "IP"] },
  { id: "eq_de_qf", name: "Heat Supplied by Fuel", canonicalTex: "Q_f = \\dot{m}_f HV", baseFormula: "Q_f = m_f * HV", nodes: ["Q_f", "m_f", "HV"] },
  { id: "eq_de_etath", name: "Brake Thermal Efficiency", canonicalTex: "\\eta_{th} = \\frac{BP}{Q_f}", baseFormula: "eta_th = BP / Q_f", nodes: ["eta_th", "BP", "Q_f"] },
  { id: "eq_de_etaith", name: "Indicated Thermal Efficiency", canonicalTex: "\\eta_{ith} = \\frac{IP}{Q_f}", baseFormula: "eta_ith = IP / Q_f", nodes: ["eta_ith", "IP", "Q_f"] },
  
  // Notice requiredUnits ensures the unit analysis tree injects the correct factor-label conversions.
  { 
    id: "eq_de_bsfc", 
    name: "Brake Specific Fuel Consumption", 
    canonicalTex: "bsfc = \\frac{\\dot{m}_f \\cdot 3600}{BP}", 
    baseFormula: "bsfc = (m_f * 3600) / BP", 
    nodes: ["bsfc", "m_f", "BP"],
    requiredUnits: { bsfc: "kg/kWh", m_f: "kg/s", BP: "kW" }
  },
  { 
    id: "eq_de_isfc", 
    name: "Indicated Specific Fuel Consumption", 
    canonicalTex: "isfc = \\frac{\\dot{m}_f \\cdot 3600}{IP}", 
    baseFormula: "isfc = (m_f * 3600) / IP", 
    nodes: ["isfc", "m_f", "IP"],
    requiredUnits: { isfc: "kg/kWh", m_f: "kg/s", IP: "kW" }
  },
  { id: "eq_de_ep", name: "Generator Electrical Power", canonicalTex: "EP = BP \\eta_g", baseFormula: "EP = BP * eta_g", nodes: ["EP", "BP", "eta_g"] }
]);