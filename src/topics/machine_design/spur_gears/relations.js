/**
 * src/topics/machine_design/spur_gears/relations.js
 * Declarative Knowledge Graph relations based on first-principles physics.
 */

export const GEAR_RELATION_GRAPH = [
  // 1. Working Depth
  {
    id: "eq_working_depth",
    name: "Working Depth",
    canonicalTex: "h_k = 2a",
    baseFormula: "hk = 2*a",
    nodes: ["h_k", "a"]
  },

  // 2. Whole Depth
  {
    id: "eq_whole_depth",
    name: "Whole Depth",
    canonicalTex: "h = 2a + c",
    baseFormula: "h = 2*a + c",
    nodes: ["h", "a", "c"]
  },

  // 3. Center Distance (External Mesh)
  {
    id: "eq_center_dist",
    name: "Center Distance (Radii Sum)",
    canonicalTex: "C = \\frac{D_1 + D_2}{2}",
    baseFormula: "C = (D1 + D2) / 2",
    nodes: ["C", "D_P1", "D_P2"]
  },

  // 4. Center Distance from Teeth
  {
    id: "eq_c_teeth_sum",
    name: "Center Distance from Teeth Sum",
    canonicalTex: "C = \\frac{T_1 + T_2}{2 P_d}",
    baseFormula: "C = (T1 + T2) / (2 * Pd)",
    nodes: ["C", "T_1", "T_2", "P_d"]
  },

  // 5. Pinion Pitch Definition
  {
    id: "eq_dp1",
    name: "Pinion Pitch Definition",
    canonicalTex: "D_1 = \\frac{T_1}{P_d}",
    baseFormula: "D1 = T1 / Pd",
    nodes: ["D_P1", "T_1", "P_d"]
  },

  // 6. Gear Pitch Definition
  {
    id: "eq_dp2",
    name: "Gear Pitch Definition",
    canonicalTex: "D_2 = \\frac{T_2}{P_d}",
    baseFormula: "D2 = T2 / Pd",
    nodes: ["D_P2", "T_2", "P_d"]
  },

  // 7. Speed Ratio from Rotational Speeds
  {
    id: "eq_vr_speed",
    name: "Speed Reduction Ratio",
    canonicalTex: "\\text{SR} = \\frac{N_1}{N_2}",
    baseFormula: "SR = n1 / n2",
    nodes: ["VR", "n_1", "n_2"]
  },

  // 8. Speed Ratio from Teeth
  {
    id: "eq_vr_teeth",
    name: "Teeth Ratio",
    canonicalTex: "\\text{SR} = \\frac{T_2}{T_1}",
    baseFormula: "SR = T2 / T1",
    nodes: ["VR", "T_1", "T_2"]
  },

  // 9. Speed Ratio from Diameters
  {
    id: "eq_vr_diameters",
    name: "Diameter Ratio",
    canonicalTex: "\\text{SR} = \\frac{D_2}{D_1}",
    baseFormula: "SR = D2 / D1",
    nodes: ["VR", "D_P1", "D_P2"]
  },

  // 10. Tooth-Speed Balance
  {
    id: "eq_speed_teeth_direct",
    name: "Tooth-Speed Balance",
    canonicalTex: "T_1 N_1 = T_2 N_2",
    baseFormula: "T1 * n1 = T2 * n2",
    nodes: ["T_1", "n_1", "T_2", "n_2"]
  },

  // 11. Pitch Line Velocity (Pure Physics: v = π D N)
  {
    id: "eq_pitch_vel",
    name: "Pitch Line Velocity",
    canonicalTex: "v = \\pi D_1 N_1",
    baseFormula: "v = pi * D1 * n1",
    nodes: ["V_m", "D_P1", "n_1"]
  },

  // 12. Tangential Force & Shaft Torque (Pure Physics: T = F_t · r)
  {
    id: "eq_wt_torque",
    name: "Tangential Load from Torque",
    canonicalTex: "T = \\frac{F_t D_1}{2}",
    baseFormula: "T = Ft * D1 / 2",
    nodes: ["M_t", "W_t", "D_P1"]
  },

  // 13. Rotational Power (Pure Physics: P = T · ω)
  {
    id: "eq_torque_power",
    name: "Rotational Power & Torque",
    canonicalTex: "P = 2\\pi N_1 T",
    baseFormula: "P = 2 * pi * n1 * T",
    nodes: ["P", "n_1", "M_t"]
  },

  // 14. Transmitted Power from Linear Force (Pure Physics: P = F_t · v)
  {
    id: "eq_wt_power_vel",
    name: "Transmitted Power from Load & Speed",
    canonicalTex: "P = F_t v",
    baseFormula: "P = Ft * v",
    nodes: ["P", "W_t", "V_m"]
  },

  // 15. Radial Separating Force
  {
    id: "eq_wr_wt",
    name: "Radial Force Relation",
    canonicalTex: "F_r = F_t \\tan\\phi",
    baseFormula: "Fr = Ft * tan(phi)",
    nodes: ["W_r", "W_t", "phi"]
  },

  // 16. Normal Contact Force Vector Resolution
  {
    id: "eq_w_normal",
    name: "Normal Contact Load Resolution",
    canonicalTex: "F_t = F_n \\cos\\phi",
    baseFormula: "Ft = Fn * cos(phi)",
    nodes: ["W_t", "W", "phi"]
  },

  // 17. Resultant Contact Force Vector
  {
    id: "eq_resultant_vector",
    name: "Resultant Tooth Force Vector",
    canonicalTex: "F_n = \\sqrt{F_t^2 + F_r^2}",
    baseFormula: "Fn = sqrt(Ft^2 + Fr^2)",
    nodes: ["W", "W_t", "W_r"]
  },

  // 18. Full-Depth Addendum
  {
    id: "eq_addendum",
    name: "Full-Depth Addendum",
    canonicalTex: "a = \\frac{1}{P_d}",
    baseFormula: "a = 1 / Pd",
    nodes: ["a", "P_d"]
  },

  // 19. Outside Blank Diameter (from Addendum)
  {
    id: "eq_do",
    name: "Outside Blank Diameter",
    canonicalTex: "D_o = D_1 + 2a",
    baseFormula: "Do = D1 + 2*a",
    nodes: ["D_o", "D_P1", "a"]
  },

  // 20. Outside Blank Diameter (Directly from Teeth)
  {
    id: "eq_do_teeth",
    name: "Blank Diameter from Teeth",
    canonicalTex: "D_o = \\frac{T_1 + 2}{P_d}",
    baseFormula: "Do = (T1 + 2) / Pd",
    nodes: ["D_o", "T_1", "P_d"]
  },

  // 21. Base Circle Diameter
  {
    id: "eq_db",
    name: "Base Circle Diameter",
    canonicalTex: "D_b = D_1 \\cos\\phi",
    baseFormula: "Db = D1 * cos(phi)",
    nodes: ["D_b", "D_P1", "phi"]
  },

  // 22. Base Pitch
  {
    id: "eq_base_pitch",
    name: "Base Pitch",
    canonicalTex: "p_b = P_c \\cos\\phi",
    baseFormula: "pb = Pc * cos(phi)",
    nodes: ["p_b", "P_c", "phi"]
  },

  // 23. Pitch Reciprocal Identity
  {
    id: "eq_pitch_inv",
    name: "Pitch Reciprocal Identity",
    canonicalTex: "P_c P_d = \\pi",
    baseFormula: "Pc * Pd = pi",
    nodes: ["P_c", "P_d"]
  },

  // 24. Circular Tooth Thickness
  {
    id: "eq_thick",
    name: "Circular Tooth Thickness",
    canonicalTex: "t = \\frac{P_c}{2}",
    baseFormula: "t = Pc / 2",
    nodes: ["t", "P_c"]
  },

  // 25. Lewis Beam Bending Stress
  {
    id: "eq_lewis",
    name: "Lewis Beam Bending Strength",
    canonicalTex: "s = \\frac{F_t P_d}{b Y}",
    baseFormula: "s = (Ft * Pd) / (b * Y)",
    nodes: ["s", "W_t", "P_d", "b", "Y"]
  }
];
