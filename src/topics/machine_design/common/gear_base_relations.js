/**
 * src/topics/machine_design/common/gear_base_relations.js
 * Universal kinematic, dynamic, and power relations shared by all gear topics.
 */

export const BASE_GEAR_RELATIONS = Object.freeze([
  {
    id: "eq_base_vr_speed",
    name: "Speed Reduction Ratio",
    canonicalTex: "\\text{SR} = \\frac{N_1}{N_2}",
    baseFormula: "VR = n_1 / n_2",
    nodes: ["VR", "n_1", "n_2"]
  },
  {
    id: "eq_base_vr_teeth",
    name: "Teeth Ratio",
    canonicalTex: "\\text{SR} = \\frac{T_2}{T_1}",
    baseFormula: "VR = T_2 / T_1",
    nodes: ["VR", "T_1", "T_2"]
  },
  {
    id: "eq_base_vr_diameters",
    name: "Diameter Ratio",
    canonicalTex: "\\text{SR} = \\frac{D_2}{D_1}",
    baseFormula: "VR = D_P2 / D_P1",
    nodes: ["VR", "D_P1", "D_P2"]
  },
  {
    id: "eq_base_pitch_vel",
    name: "Pitch Line Velocity",
    canonicalTex: "v = \\pi D_1 N_1",
    baseFormula: "V_m = pi * D_P1 * n_1",
    nodes: ["V_m", "D_P1", "n_1"]
  },
  {
    id: "eq_base_wt_torque",
    name: "Tangential Load from Torque",
    canonicalTex: "T = \\frac{F_t D_1}{2}",
    baseFormula: "M_t = W_t * D_P1 / 2",
    nodes: ["M_t", "W_t", "D_P1"]
  },
  {
    id: "eq_base_torque_power",
    name: "Rotational Power & Torque",
    canonicalTex: "P = 2\\pi N_1 T",
    baseFormula: "P = 2 * pi * n_1 * M_t",
    nodes: ["P", "n_1", "M_t"]
  },
  {
    id: "eq_base_wt_power_vel",
    name: "Transmitted Power from Load & Speed",
    canonicalTex: "P = F_t v",
    baseFormula: "P = W_t * V_m",
    nodes: ["P", "W_t", "V_m"]
  },
  {
    id: "eq_base_center_dist",
    name: "Center Distance from Diameters",
    canonicalTex: "C = \\frac{D_1 + D_2}{2}",
    baseFormula: "C = (D_P1 + D_P2) / 2",
    nodes: ["C", "D_P1", "D_P2"]
  }
]);