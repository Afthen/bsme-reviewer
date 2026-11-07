/**
 * src/topics/machine_design/helical_gears/relations.js
 * Helical Gear Relations extending Base Gear Relations.
 */

import { BASE_GEAR_RELATIONS } from "../common/gear_base_relations.js";

export const HELICAL_RELATION_GRAPH = [
  ...BASE_GEAR_RELATIONS,

  { id: "eq_helical_pcn", name: "Normal Circular Pitch", canonicalTex: "P_{cn} = P_c \\cos\\psi", baseFormula: "P_cn = P_c * cos(psi)", nodes: ["P_cn", "P_c", "psi"] },
  { id: "eq_helical_pdn", name: "Normal Diametral Pitch", canonicalTex: "P_{dn} = \\frac{P_d}{\\cos\\psi}", baseFormula: "P_dn = P_d / cos(psi)", nodes: ["P_dn", "P_d", "psi"] },
  { id: "eq_helical_axial_pitch", name: "Axial Pitch from Circular Pitch", canonicalTex: "P_a = \\frac{P_c}{\\tan\\psi}", baseFormula: "P_a = P_c / tan(psi)", nodes: ["P_a", "P_c", "psi"] },
  { id: "eq_helical_pressure_angle", name: "Normal Pressure Angle Relation", canonicalTex: "\\tan\\phi_n = \\tan\\phi \\cos\\psi", baseFormula: "tan(phi_n) = tan(phi) * cos(psi)", nodes: ["phi_n", "phi", "psi"] },
  { id: "eq_helical_formative_teeth", name: "Formative Number of Teeth", canonicalTex: "T_v = \\frac{T_1}{\\cos^3\\psi}", baseFormula: "T_v = T_1 / (cos(psi)^3)", nodes: ["T_v", "T_1", "psi"] },
  { id: "eq_helical_dp1", name: "Pinion Pitch Diameter from Transverse Pitch", canonicalTex: "D_1 = \\frac{T_1}{P_d}", baseFormula: "D_P1 = T_1 / P_d", nodes: ["D_P1", "T_1", "P_d"] },
  { id: "eq_helical_dp2", name: "Gear Pitch Diameter from Transverse Pitch", canonicalTex: "D_2 = \\frac{T_2}{P_d}", baseFormula: "D_P2 = T_2 / P_d", nodes: ["D_P2", "T_2", "P_d"] },
  { id: "eq_helical_center_dist_teeth", name: "Center Distance from Normal Pitch", canonicalTex: "C = \\frac{T_1 + T_2}{2 P_{dn} \\cos\\psi}", baseFormula: "C = (T_1 + T_2) / (2 * P_dn * cos(psi))", nodes: ["C", "T_1", "T_2", "P_dn", "psi"] },
  { id: "eq_helical_axial_force", name: "Axial Thrust Load", canonicalTex: "F_a = F_t \\tan\\psi", baseFormula: "F_a = W_t * tan(psi)", nodes: ["F_a", "W_t", "psi"] },
  { id: "eq_helical_radial_force", name: "Radial Force from Tangential", canonicalTex: "F_r = F_t \\tan\\phi", baseFormula: "W_r = W_t * tan(phi)", nodes: ["W_r", "W_t", "phi"] },
  { id: "eq_helical_fn_3d", name: "Resultant 3D Normal Tooth Load", canonicalTex: "F_n = \\sqrt{F_t^2 + F_r^2 + F_a^2}", baseFormula: "W = sqrt(W_t^2 + W_r^2 + F_a^2)", nodes: ["W", "W_t", "W_r", "F_a"] },
  { id: "eq_helical_lewis_fatigue", name: "Beam Fatigue Strength (Helical)", canonicalTex: "F_s = \\frac{s b Y}{k_f P_{dn}}", baseFormula: "F_s = (s * b * Y) / (k_f * P_dn)", nodes: ["F_s", "s", "b", "Y", "k_f", "P_dn"] },
  { 
    id: "eq_helical_buckingham", 
    name: "Buckingham Dynamic Load (Helical)", 
    canonicalTex: "F_D = F_t + \\frac{0.05 v (F_t + b C_d \\cos^2\\psi) \\cos\\psi}{0.05 v + \\sqrt{F_t + b C_d \\cos^2\\psi}}", 
    baseFormula: "F_D = W_t + (0.05 * V_m * (W_t + b * C_d * cos(psi)^2) * cos(psi)) / (0.05 * V_m + sqrt(W_t + b * C_d * cos(psi)^2))", 
    nodes: ["F_D", "W_t", "V_m", "psi", "b", "C_d"],
    solvable: ["F_D"] // Protected empirical equation
  },
  { id: "eq_helical_ratio_factor", name: "Ratio Factor for Gearing", canonicalTex: "Q = \\frac{2 T_2}{T_1 + T_2}", baseFormula: "Q = (2 * T_2) / (T_1 + T_2)", nodes: ["Q", "T_1", "T_2"] },
  { id: "eq_helical_wear_load", name: "Limiting Wear Load (Helical)", canonicalTex: "F_w = \\frac{D_1 b Q K_w}{\\cos^2\\psi}", baseFormula: "F_w = (D_P1 * b * Q * K_w) / (cos(psi)^2)", nodes: ["F_w", "D_P1", "b", "Q", "K_w", "psi"] }
];