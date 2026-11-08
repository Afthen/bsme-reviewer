export const MIXED_AIR_RELATIONS = [
  { id: "eq_mixed_mass_balance", name: "Air Mass Balance", canonicalTex: "\\dot{m}_m = \\dot{m}_o + \\dot{m}_r", baseFormula: "m_m = m_o + m_r", nodes: ["m_m", "m_o", "m_r"] },
  { id: "eq_mixed_enthalpy_bal", name: "Enthalpy Balance (Mixing)", canonicalTex: "\\dot{m}_m h_m = \\dot{m}_o h_o + \\dot{m}_r h_r", baseFormula: "m_m * h_m = m_o * h_o + m_r * h_r", nodes: ["m_m", "h_m", "m_o", "h_o", "m_r", "h_r"] },
  { id: "eq_mixed_temp_bal", name: "Temperature Balance (Mixing)", canonicalTex: "\\dot{m}_m t_m = \\dot{m}_o t_o + \\dot{m}_r t_r", baseFormula: "m_m * t_m = m_o * t_o + m_r * t_r", nodes: ["m_m", "t_m", "m_o", "t_o", "m_r", "t_r"] },
  { id: "eq_mixed_cooling_load", name: "Cooling Coil Load (Mixed Air)", canonicalTex: "q_c = \\dot{m}_m (h_m - h_s)", baseFormula: "q_c = m_m * (h_m - h_s)", nodes: ["q_c", "m_m", "h_m", "h_s"] }
];
