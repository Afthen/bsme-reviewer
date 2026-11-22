/**
 * src/topics/hvac/cooling_tower/relations.js
 * Pure physics relations for induced/forced draft cooling towers.
 */

export const COOLING_TOWER_RELATIONS = Object.freeze([
  { id: "eq_ct_range", name: "Cooling Range", canonicalTex: "Range = t_{w1} - t_{w2}", baseFormula: "R_ct = t_w1 - t_w2", nodes: ["R_ct", "t_w1", "t_w2"] },
  { id: "eq_ct_approach", name: "Cooling Approach", canonicalTex: "Approach = t_{w2} - t_{wb1}", baseFormula: "A_ct = t_w2 - t_wb1", nodes: ["A_ct", "t_w2", "t_wb1"] },
  { id: "eq_ct_efficiency", name: "Cooling Tower Efficiency", canonicalTex: "\\eta_{ct} = \\frac{Range}{Range + Approach}", baseFormula: "eta_ct = R_ct / (R_ct + A_ct)", nodes: ["eta_ct", "R_ct", "A_ct"] },
  { id: "eq_ct_heat_water", name: "Heat Rejected (Water Side)", canonicalTex: "Q_{rej} = \\dot{m}_w c_{pw} (t_{w1} - t_{w2})", baseFormula: "Q_rej = m_w * c_pw * R_ct", nodes: ["Q_rej", "m_w", "c_pw", "R_ct"] },
  { id: "eq_ct_heat_air", name: "Heat Absorbed (Air Side)", canonicalTex: "Q_{rej} = \\dot{m}_a (h_2 - h_1)", baseFormula: "Q_rej = m_a * (h_2 - h_1)", nodes: ["Q_rej", "m_a", "h_2", "h_1"] },
  { id: "eq_ct_lg_ratio", name: "Liquid-to-Gas Ratio", canonicalTex: "L/G = \\frac{\\dot{m}_w}{\\dot{m}_a}", baseFormula: "LG = m_w / m_a", nodes: ["LG", "m_w", "m_a"] },
  { id: "eq_ct_evap", name: "Evaporation Loss", canonicalTex: "\\dot{m}_{evap} = \\dot{m}_a (W_2 - W_1)", baseFormula: "m_evap = m_a * (W_2 - W_1)", nodes: ["m_evap", "m_a", "W_2", "W_1"] },
  { id: "eq_ct_drift", name: "Drift Loss", canonicalTex: "\\dot{m}_{drift} = f_{drift} \\dot{m}_w", baseFormula: "m_drift = f_drift * m_w", nodes: ["m_drift", "f_drift", "m_w"] },
  { id: "eq_ct_coc", name: "Cycles of Concentration", canonicalTex: "\\text{COC} = 1 + \\frac{\\dot{m}_{evap}}{\\dot{m}_{bd}}", baseFormula: "COC = 1 + m_evap / m_bd", nodes: ["COC", "m_evap", "m_bd"] },
  { id: "eq_ct_makeup", name: "Total Make-up Water", canonicalTex: "\\dot{m}_{mu} = \\dot{m}_{evap} + \\dot{m}_{bd} + \\dot{m}_{drift}", baseFormula: "m_mu = m_evap + m_bd + m_drift", nodes: ["m_mu", "m_evap", "m_bd", "m_drift"] },
  { id: "eq_ct_air_vol", name: "Entering Air Volume Flow", canonicalTex: "V_a = \\dot{m}_a v_1", baseFormula: "V_a = m_a * v_1", nodes: ["V_a", "m_a", "v_1"] },
  { id: "eq_ct_water_vol", name: "Circulating Water Volume Flow", canonicalTex: "V_w = \\frac{\\dot{m}_w}{\\rho_w}", baseFormula: "V_w = m_w / rho_w", nodes: ["V_w", "m_w", "rho_w"] }
]);
