export const POWERPLANT_DESIGN_RELATIONS = Object.freeze([
  { id: "eq_pd_draft", name: "Theoretical Draft Pressure", canonicalTex: "P_{draft} = g H (\\rho_a - \\rho_g)", baseFormula: "P_draft = g * h_chimney * (rho_air - rho_gas)", nodes: ["P_draft", "g", "h_chimney", "rho_air", "rho_gas"] },
  { id: "eq_pd_rho_gas", name: "Flue Gas Density (Ideal)", canonicalTex: "\\rho_g = \\frac{P_{atm}}{R_g T_g}", baseFormula: "rho_gas = P_atm / (R_g * T_gas)", nodes: ["rho_gas", "P_atm", "R_g", "T_gas"] },
  { id: "eq_pd_hx", name: "Basic Heat Exchanger Eq", canonicalTex: "Q_{HX} = U A LMTD", baseFormula: "Q_HX = U * A_HX * LMTD", nodes: ["Q_HX", "U", "A_HX", "LMTD"] },
  { id: "eq_pd_darcy", name: "Darcy-Weisbach Head Loss", canonicalTex: "h_L = f \\frac{L}{D} \\frac{V^2}{2g}", baseFormula: "h_L = f * (L / D) * (V_fluid^2 / (2 * g))", nodes: ["h_L", "f", "L", "D", "V_fluid", "g"] },
  { id: "eq_pd_vel", name: "Continuity Equation", canonicalTex: "V = \\frac{\\dot{V}}{A_{pipe}}", baseFormula: "V_fluid = Vol_flow / A_pipe", nodes: ["V_fluid", "Vol_flow", "A_pipe"] }
]);