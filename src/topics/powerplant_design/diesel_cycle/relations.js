/**
 * src/topics/powerplant_design/diesel_cycle/relations.js
 * Invertible Air-Standard Diesel relations using lowercase notation for specific energy.
 */

export const DIESEL_CYCLE_RELATIONS = Object.freeze([
  {
    id: "eq_diesel_rk",
    name: "Ratio Relationship",
    canonicalTex: "r_k = r_c r_e",
    baseFormula: "r_k = r_c * r_e",
    nodes: ["r_k", "r_c", "r_e"]
  },
  {
    id: "eq_diesel_t2",
    name: "Isentropic Compression Temp",
    canonicalTex: "T_2 = T_1 r_k^{k-1}",
    baseFormula: "T_2 = T_1 * (r_k^(k - 1))",
    nodes: ["T_2", "T_1", "r_k", "k"],
    solvable: ["T_2", "T_1", "r_k"]
  },
  {
    id: "eq_diesel_t3",
    name: "Isobaric Heat Addition Temp",
    canonicalTex: "T_3 = T_2 r_c",
    baseFormula: "T_3 = T_2 * r_c",
    nodes: ["T_3", "T_2", "r_c"]
  },
  {
    id: "eq_diesel_t4",
    name: "Isentropic Expansion Temp",
    canonicalTex: "T_4 = \\frac{T_3}{r_e^{k-1}}",
    baseFormula: "T_4 = T_3 / (r_e^(k - 1))",
    nodes: ["T_4", "T_3", "r_e", "k"],
    solvable: ["T_4", "T_3", "r_e"]
  },
  {
    id: "eq_diesel_qa",
    name: "Heat Added (Isobaric)",
    canonicalTex: "q_A = c_p (T_3 - T_2)",
    baseFormula: "Q_A = c_p * (T_3 - T_2)",
    nodes: ["Q_A", "c_p", "T_3", "T_2"]
  },
  {
    id: "eq_diesel_qr",
    name: "Heat Rejected (Isometric)",
    canonicalTex: "q_R = c_v (T_4 - T_1)",
    baseFormula: "Q_R = c_v * (T_4 - T_1)",
    nodes: ["Q_R", "c_v", "T_4", "T_1"]
  },
  {
    id: "eq_diesel_wnet",
    name: "Net Work",
    canonicalTex: "w_{net} = q_A - q_R",
    baseFormula: "W_net = Q_A - Q_R",
    nodes: ["W_net", "Q_A", "Q_R"]
  },
  {
    id: "eq_diesel_eth_basic",
    name: "Thermal Efficiency (Basic)",
    canonicalTex: "e_{th} = \\frac{w_{net}}{q_A}",
    baseFormula: "e_th = W_net / Q_A",
    nodes: ["e_th", "W_net", "Q_A"]
  },
  {
    id: "eq_diesel_eth_full",
    name: "Thermal Efficiency (Air-Standard)",
    canonicalTex: "e_{th} = 1 - \\frac{1}{r_k^{k-1}} \\left[ \\frac{r_c^k - 1}{k(r_c - 1)} \\right]",
    baseFormula: "e_th = 1 - (1 / (r_k^(k - 1))) * ((r_c^k - 1) / (k * (r_c - 1)))",
    solvable: ["e_th"],
    nodes: ["e_th", "r_k", "r_c", "k"]
  }
]);