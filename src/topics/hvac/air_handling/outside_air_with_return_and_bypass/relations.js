import { MIXED_AIR_RELATIONS } from "../outside_air_with_return/relations.js";

export const BYPASS_AIR_RELATIONS = [
  ...MIXED_AIR_RELATIONS,
  { id: "eq_contact_factor", name: "Contact Factor Definition", canonicalTex: "CF = 1 - BF", baseFormula: "CF = 1 - BF", nodes: ["CF", "BF"] },
  { id: "eq_bf_enthalpy", name: "Bypass Factor (Enthalpy)", canonicalTex: "BF = \\frac{h_s - h_{adp}}{h_m - h_{adp}}", baseFormula: "BF = (h_s - h_adp) / (h_m - h_adp)", nodes: ["BF", "h_s", "h_adp", "h_m"] },
  { id: "eq_bf_temp", name: "Bypass Factor (Temperature)", canonicalTex: "BF = \\frac{t_s - t_{adp}}{t_m - t_{adp}}", baseFormula: "BF = (t_s - t_adp) / (t_m - t_adp)", nodes: ["BF", "t_s", "t_adp", "t_m"] },
  { id: "eq_supply_vol", name: "Supply Fan Capacity", canonicalTex: "V_s = \\dot{m}_m v_s", baseFormula: "V_s = m_m * v_s", nodes: ["V_s", "m_m", "v_s"] },
  { id: "eq_reheater_h", name: "Reheater Load (Enthalpy)", canonicalTex: "q_{rh} = \\dot{m}_m (h_{rh} - h_s)", baseFormula: "q_rh = m_m * (h_rh - h_s)", nodes: ["q_rh", "m_m", "h_rh", "h_s"] },
  { id: "eq_reheater_t", name: "Reheater Load (Temperature)", canonicalTex: "q_{rh} = \\dot{m}_m c_{pa} (t_{rh} - t_s)", baseFormula: "q_rh = m_m * c_pa * (t_rh - t_s)", nodes: ["q_rh", "m_m", "c_pa", "t_rh", "t_s"] }
];