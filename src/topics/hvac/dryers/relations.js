/**
 * src/topics/hvac/dryers/relations.js
 * Pure physics relations for continuous/batch air dryers.
 */

export const DRYER_RELATIONS = Object.freeze([
  { id: "eq_dryer_mass_bal", name: "Overall Moisture Balance", canonicalTex: "\\dot{m}_f = \\dot{m}_p + \\dot{m}_w", baseFormula: "m_f = m_p + m_w", nodes: ["m_f", "m_p", "m_w"] },
  { id: "eq_dryer_solid_feed", name: "Bone-Dry Solids (Feed)", canonicalTex: "\\dot{m}_s = \\dot{m}_f (1 - M_{w1})", baseFormula: "m_s = m_f * (1 - M_w1)", nodes: ["m_s", "m_f", "M_w1"] },
  { id: "eq_dryer_solid_prod", name: "Bone-Dry Solids (Product)", canonicalTex: "\\dot{m}_s = \\dot{m}_p (1 - M_{w2})", baseFormula: "m_s = m_p * (1 - M_w2)", nodes: ["m_s", "m_p", "M_w2"] },
  { id: "eq_dryer_dry_basis_1", name: "Initial Dry-Basis Moisture", canonicalTex: "X_1 = \\frac{M_{w1}}{1 - M_{w1}}", baseFormula: "X_1 = M_w1 / (1 - M_w1)", nodes: ["X_1", "M_w1"] },
  { id: "eq_dryer_dry_basis_2", name: "Final Dry-Basis Moisture", canonicalTex: "X_2 = \\frac{M_{w2}}{1 - M_{w2}}", baseFormula: "X_2 = M_w2 / (1 - M_w2)", nodes: ["X_2", "M_w2"] },
  { id: "eq_dryer_evap_dry_basis", name: "Evaporation (Dry-Basis)", canonicalTex: "\\dot{m}_w = \\dot{m}_s (X_1 - X_2)", baseFormula: "m_w = m_s * (X_1 - X_2)", nodes: ["m_w", "m_s", "X_1", "X_2"] },
  { id: "eq_dryer_air_moisture", name: "Air-Side Moisture Balance", canonicalTex: "\\dot{m}_w = \\dot{m}_a (W_2 - W_1)", baseFormula: "m_w = m_a * (W_2 - W_1)", nodes: ["m_w", "m_a", "W_2", "W_1"] },
  { id: "eq_dryer_air_vol", name: "Entering Air Volume Flow", canonicalTex: "V_a = \\dot{m}_a v_1", baseFormula: "V_a = m_a * v_1", nodes: ["V_a", "m_a", "v_1"] },
  { id: "eq_dryer_heater", name: "Air Heater Heat Input", canonicalTex: "Q_h = \\dot{m}_a c_{pa} (t_{a2} - t_{a1})", baseFormula: "Q_h = m_a * c_pa * (t_a2 - t_a1)", nodes: ["Q_h", "m_a", "c_pa", "t_a2", "t_a1"] },
  { id: "eq_dryer_evap_heat", name: "Evaporative Heat Load", canonicalTex: "Q_{evap} = \\dot{m}_w h_{fg}", baseFormula: "Q_evap = m_w * h_fg", nodes: ["Q_evap", "m_w", "h_fg"] },
  { id: "eq_dryer_efficiency", name: "Dryer Thermal Efficiency", canonicalTex: "\\eta_d = \\frac{Q_{evap}}{Q_h}", baseFormula: "eta_d = Q_evap / Q_h", nodes: ["eta_d", "Q_evap", "Q_h"] }
]);
