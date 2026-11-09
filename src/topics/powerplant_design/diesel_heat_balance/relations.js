/**
 * src/topics/powerplant_design/diesel_heat_balance/relations.js
 * First-law heat balance relations with pure physical scaling (zero conversion constants).
 */

export const DIESEL_HEAT_BALANCE_RELATIONS = Object.freeze([
  { id: "eq_dhb_balance", name: "First Law Heat Balance", canonicalTex: "Q_f = Q_{ip} + Q_{cw} + Q_{exh} + Q_{rad}", baseFormula: "Q_f = Q_ip + Q_cw + Q_exh + Q_rad", nodes: ["Q_f", "Q_ip", "Q_cw", "Q_exh", "Q_rad"] },
  { id: "eq_dhb_cw", name: "Cooling Water Heat Transfer", canonicalTex: "Q_{cw} = \\dot{m}_{cw} c_{p,w} \\Delta T_{cw}", baseFormula: "Q_cw = m_cw * cp_w * dT_cw", nodes: ["Q_cw", "m_cw", "cp_w", "dT_cw"] },
  { id: "eq_dhb_pct_ip", name: "Indicated Power Heat Percentage", canonicalTex: "\\%_{ip} = \\frac{Q_{ip}}{Q_f}", baseFormula: "pct_ip = Q_ip / Q_f", nodes: ["pct_ip", "Q_ip", "Q_f"] },
  { id: "eq_dhb_pct_cw", name: "Cooling Water Percentage", canonicalTex: "\\%_{cw} = \\frac{Q_{cw}}{Q_f}", baseFormula: "pct_cw = Q_cw / Q_f", nodes: ["pct_cw", "Q_cw", "Q_f"] },
  { id: "eq_dhb_pct_exh", name: "Exhaust Heat Percentage", canonicalTex: "\\%_{exh} = \\frac{Q_{exh}}{Q_f}", baseFormula: "pct_exh = Q_exh / Q_f", nodes: ["pct_exh", "Q_exh", "Q_f"] },
  { id: "eq_dhb_pct_rad", name: "Unaccounted Heat Percentage", canonicalTex: "\\%_{rad} = \\frac{Q_{rad}}{Q_f}", baseFormula: "pct_rad = Q_rad / Q_f", nodes: ["pct_rad", "Q_rad", "Q_f"] }
]);
