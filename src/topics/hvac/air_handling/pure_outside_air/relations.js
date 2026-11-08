export const PURE_AIR_RELATIONS = [
  { 
    id: "eq_pure_cooling_load", 
    name: "Cooling Coil Load (100% Make-up Air)", 
    canonicalTex: "q_c = \\dot{m}_o (h_o - h_s)", 
    baseFormula: "q_c = m_o * (h_o - h_s)", 
    nodes: ["q_c", "m_o", "h_o", "h_s"] 
  }
];
