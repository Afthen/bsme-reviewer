export const COOLING_TOWER_RELATIONS = [
  { id: "eq_ct_range", name: "Cooling Range", canonicalTex: "Range = t_{w1} - t_{w2}", baseFormula: "R_ct = t_w1 - t_w2", nodes: ["R_ct", "t_w1", "t_w2"] },
  { id: "eq_ct_approach", name: "Cooling Approach", canonicalTex: "Approach = t_{w2} - t_{wb1}", baseFormula: "A_ct = t_w2 - t_wb1", nodes: ["A_ct", "t_w2", "t_wb1"] },
  { id: "eq_ct_heat_water", name: "Heat Rejected (Water Side)", canonicalTex: "Q_{rej} = \\dot{m}_w c_{pw} (t_{w1} - t_{w2})", baseFormula: "Q_rej = m_w * c_pw * R_ct", nodes: ["Q_rej", "m_w", "c_pw", "R_ct"] },
  { id: "eq_ct_heat_air", name: "Heat Absorbed (Air Side)", canonicalTex: "Q_{rej} = \\dot{m}_a (h_2 - h_1)", baseFormula: "Q_rej = m_a * (h_2 - h_1)", nodes: ["Q_rej", "m_a", "h_2", "h_1"] },
  { id: "eq_ct_makeup", name: "Make-up Water Requirement", canonicalTex: "\\dot{m}_{mu} = \\dot{m}_a (W_2 - W_1)", baseFormula: "m_mu = m_a * (W_2 - W_1)", nodes: ["m_mu", "m_a", "W_2", "W_1"] }
];
