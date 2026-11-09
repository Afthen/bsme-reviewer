export const DIESEL_HEAT_BALANCE_RELATIONS = Object.freeze([
  { id: "eq_dhb_balance", name: "First Law Heat Balance", canonicalTex: "Q_f = Q_{ip} + Q_{cw} + Q_{exh} + Q_{rad}", baseFormula: "Q_f = Q_ip + Q_cw + Q_exh + Q_rad", nodes: ["Q_f", "Q_ip", "Q_cw", "Q_exh", "Q_rad"] },
  { id: "eq_dhb_cw", name: "Cooling Water Heat Transfer", canonicalTex: "Q_{cw} = \\dot{m}_{cw} c_{p,w} \\Delta T_{cw}", baseFormula: "Q_cw = m_cw * cp_w * dT_cw", nodes: ["Q_cw", "m_cw", "cp_w", "dT_cw"] },
  { id: "eq_dhb_pct_cw", name: "Cooling Water Percentage", canonicalTex: "\\%_{cw} = \\frac{Q_{cw}}{Q_f} \\times 100", baseFormula: "pct_cw = (Q_cw / Q_f) * 100", nodes: ["pct_cw", "Q_cw", "Q_f"] },
  { id: "eq_dhb_pct_exh", name: "Exhaust Heat Percentage", canonicalTex: "\\%_{exh} = \\frac{Q_{exh}}{Q_f} \\times 100", baseFormula: "pct_exh = (Q_exh / Q_f) * 100", nodes: ["pct_exh", "Q_exh", "Q_f"] },
  { id: "eq_dhb_pct_rad", name: "Unaccounted Heat Percentage", canonicalTex: "\\%_{rad} = \\frac{Q_{rad}}{Q_f} \\times 100", baseFormula: "pct_rad = (Q_rad / Q_f) * 100", nodes: ["pct_rad", "Q_rad", "Q_f"] }
]);