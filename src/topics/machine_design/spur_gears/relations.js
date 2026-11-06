/**
 * src/topics/machine_design/spur_gears/relations.js
 * Comprehensive Spur Gear Knowledge Graph including geometry, proportions,
 * kinematics, 2D force equilibrium, and Buckingham dynamic load.
 */

export const GEAR_RELATION_GRAPH = [
  // ========================================================
  // 1. TOOTH PROPORTIONS & DEPTHS
  // ========================================================
  // Working Depth (Slide 6)
  {
    id: "eq_working_depth",
    name: "Working Depth",
    canonicalTex: "W_r = 2a",
    baseFormula: "hk = 2*a",
    nodes: ["h_k", "a"]
  },

  // Whole Depth as Sum of Addendum and Dedendum (Slide 6, 7)
  {
    id: "eq_whole_depth_sum",
    name: "Whole Depth (Addendum + Dedendum)",
    canonicalTex: "W = d + a",
    baseFormula: "h = d + a",
    nodes: ["h", "d", "a"]
  },

  // Whole Depth from Working Depth and Clearance (Slide 6)
  {
    id: "eq_whole_depth_clearance",
    name: "Whole Depth from Clearance",
    canonicalTex: "W = 2a + c",
    baseFormula: "h = 2*a + c",
    nodes: ["h", "a", "c"]
  },

  // Clearance Definition (Slide 6, 7, 19)
  {
    id: "eq_clearance",
    name: "Tooth Clearance",
    canonicalTex: "c = d - a",
    baseFormula: "c = d - a",
    nodes: ["c", "d", "a"]
  },

  // Root Diameter (Slide 5)
  {
    id: "eq_root_diameter",
    name: "Root (Dedendum) Diameter",
    canonicalTex: "D_r = D_1 - 2d",
    baseFormula: "Dr = D1 - 2*d",
    nodes: ["D_r", "D_P1", "d"]
  },

  // Full-Depth Addendum (Slide 12, 18)
  {
    id: "eq_addendum",
    name: "Full-Depth Addendum",
    canonicalTex: "a = \\frac{1}{P_d}",
    baseFormula: "a = 1 / Pd",
    nodes: ["a", "P_d"]
  },

  // Outside Blank Diameter from Addendum (Slide 5, 6)
  {
    id: "eq_do",
    name: "Outside Blank Diameter",
    canonicalTex: "D_o = D_1 + 2a",
    baseFormula: "Do = D1 + 2*a",
    nodes: ["D_o", "D_P1", "a"]
  },

  // Outside Blank Diameter Directly from Teeth (Slide 5, 20)
  {
    id: "eq_do_teeth",
    name: "Blank Diameter from Teeth",
    canonicalTex: "D_o = \\frac{T_1 + 2}{P_d}",
    baseFormula: "Do = (T1 + 2) / Pd",
    nodes: ["D_o", "T_1", "P_d"]
  },

  // Tooth Thickness (Slide 6, 12, 20)
  {
    id: "eq_thick",
    name: "Circular Tooth Thickness",
    canonicalTex: "t = \\frac{P_c}{2}",
    baseFormula: "t = Pc / 2",
    nodes: ["t", "P_c"]
  },

  // Average Backlash (Slide 12)
  {
    id: "eq_backlash_avg",
    name: "Average Tooth Backlash",
    canonicalTex: "B = \\frac{0.035}{P_d}",
    baseFormula: "B = 0.035 / Pd",
    nodes: ["B", "P_d"]
  },

  // Base Circle Diameter (Slide 14)
  {
    id: "eq_db",
    name: "Base Circle Diameter",
    canonicalTex: "D_b = D_1 \\cos\\phi",
    baseFormula: "Db = D1 * cos(phi)",
    nodes: ["D_b", "D_P1", "phi"]
  },

  // Base Pitch
  {
    id: "eq_base_pitch",
    name: "Base Pitch",
    canonicalTex: "p_b = P_c \\cos\\phi",
    baseFormula: "pb = Pc * cos(phi)",
    nodes: ["p_b", "P_c", "phi"]
  },

  // ========================================================
  // 2. PITCHES & CENTER DISTANCE
  // ========================================================
  // Metric Module Definition (Slide 8)
  {
    id: "eq_module_def",
    name: "Metric Module Definition",
    canonicalTex: "m = \\frac{D_1}{T_1}",
    baseFormula: "m = D1 / T1",
    nodes: ["m", "D_P1", "T_1"]
  },

  // Circular Pitch from Module (Slide 8)
  {
    id: "eq_pc_module",
    name: "Circular Pitch from Module",
    canonicalTex: "P_c = \\pi m",
    baseFormula: "Pc = pi * m",
    nodes: ["P_c", "m"]
  },

  // Pitch Reciprocal Identity (Slide 8)
  {
    id: "eq_pitch_inv",
    name: "Pitch Reciprocal Identity",
    canonicalTex: "P_c P_d = \\pi",
    baseFormula: "Pc * Pd = pi",
    nodes: ["P_c", "P_d"]
  },

  // Pinion Pitch Definition (Slide 8)
  {
    id: "eq_dp1",
    name: "Pinion Pitch Definition",
    canonicalTex: "D_1 = \\frac{T_1}{P_d}",
    baseFormula: "D1 = T1 / Pd",
    nodes: ["D_P1", "T_1", "P_d"]
  },

  // Gear Pitch Definition (Slide 8)
  {
    id: "eq_dp2",
    name: "Gear Pitch Definition",
    canonicalTex: "D_2 = \\frac{T_2}{P_d}",
    baseFormula: "D2 = T2 / Pd",
    nodes: ["D_P2", "T_2", "P_d"]
  },

  // Center Distance from Radii/Diameters (Slide 9)
  {
    id: "eq_center_dist",
    name: "Center Distance (Radii Sum)",
    canonicalTex: "C = \\frac{D_1 + D_2}{2}",
    baseFormula: "C = (D1 + D2) / 2",
    nodes: ["C", "D_P1", "D_P2"]
  },

  // Center Distance from Teeth Sum (Slide 10)
  {
    id: "eq_c_teeth_sum",
    name: "Center Distance from Teeth Sum",
    canonicalTex: "C = \\frac{T_1 + T_2}{2 P_d}",
    baseFormula: "C = (T1 + T2) / (2 * Pd)",
    nodes: ["C", "T_1", "T_2", "P_d"]
  },

  // Center Distance from Circular Pitch (Slide 10, 21)
  {
    id: "eq_c_pc_sum",
    name: "Center Distance from Circular Pitch",
    canonicalTex: "C = \\frac{P_c (T_1 + T_2)}{2\\pi}",
    baseFormula: "C = (Pc * (T1 + T2)) / (2 * pi)",
    nodes: ["C", "P_c", "T_1", "T_2"]
  },

  // ========================================================
  // 3. KINEMATICS & SPEED RATIO
  // ========================================================
  // Speed Ratio from Rotational Speeds (Slide 13)
  {
    id: "eq_vr_speed",
    name: "Speed Reduction Ratio",
    canonicalTex: "\\text{SR} = \\frac{N_1}{N_2}",
    baseFormula: "SR = n1 / n2",
    nodes: ["VR", "n_1", "n_2"]
  },

  // Speed Ratio from Teeth (Slide 13)
  {
    id: "eq_vr_teeth",
    name: "Teeth Ratio",
    canonicalTex: "\\text{SR} = \\frac{T_2}{T_1}",
    baseFormula: "SR = T2 / T1",
    nodes: ["VR", "T_1", "T_2"]
  },

  // Speed Ratio from Diameters (Slide 13)
  {
    id: "eq_vr_diameters",
    name: "Diameter Ratio",
    canonicalTex: "\\text{SR} = \\frac{D_2}{D_1}",
    baseFormula: "SR = D2 / D1",
    nodes: ["VR", "D_P1", "D_P2"]
  },

  // Tooth-Speed Balance (Slide 13)
  {
    id: "eq_speed_teeth_direct",
    name: "Tooth-Speed Balance",
    canonicalTex: "T_1 N_1 = T_2 N_2",
    baseFormula: "T1 * n1 = T2 * n2",
    nodes: ["T_1", "n_1", "T_2", "n_2"]
  },

  // Pitch Line Velocity (Slide 13)
  {
    id: "eq_pitch_vel",
    name: "Pitch Line Velocity",
    canonicalTex: "v = \\pi D_1 N_1",
    baseFormula: "v = pi * D1 * n1",
    nodes: ["V_m", "D_P1", "n_1"]
  },

  // ========================================================
  // 4. FORCES, TORQUE, POWER & LEWIS STRENGTH
  // ========================================================
  // Tangential Load & Shaft Torque (Slide 14, 22)
  {
    id: "eq_wt_torque",
    name: "Tangential Load from Torque",
    canonicalTex: "T = \\frac{F_t D_1}{2}",
    baseFormula: "T = Ft * D1 / 2",
    nodes: ["M_t", "W_t", "D_P1"]
  },

  // Rotational Power (Slide 15)
  {
    id: "eq_torque_power",
    name: "Rotational Power & Torque",
    canonicalTex: "P = 2\\pi N_1 T",
    baseFormula: "P = 2 * pi * n1 * T",
    nodes: ["P", "n_1", "M_t"]
  },

  // Transmitted Power from Linear Load & Velocity (Slide 15, 23)
  {
    id: "eq_wt_power_vel",
    name: "Transmitted Power from Load & Speed",
    canonicalTex: "P = F_t v",
    baseFormula: "P = Ft * v",
    nodes: ["P", "W_t", "V_m"]
  },

  // Radial Separating Force (Slide 14, 22)
  {
    id: "eq_wr_wt",
    name: "Radial Force Relation",
    canonicalTex: "F_r = F_t \\tan\\phi",
    baseFormula: "Fr = Ft * tan(phi)",
    nodes: ["W_r", "W_t", "phi"]
  },

  // Normal Contact Force Vector Resolution (Slide 14)
  {
    id: "eq_w_normal",
    name: "Normal Contact Load Resolution",
    canonicalTex: "F_t = F_n \\cos\\phi",
    baseFormula: "Ft = Fn * cos(phi)",
    nodes: ["W_t", "W", "phi"]
  },

  // Resultant Contact Force Vector (Slide 14)
  {
    id: "eq_resultant_vector",
    name: "Resultant Tooth Force Vector",
    canonicalTex: "F_n = \\sqrt{F_t^2 + F_r^2}",
    baseFormula: "Fn = sqrt(Ft^2 + Fr^2)",
    nodes: ["W", "W_t", "W_r"]
  },

  // Lewis Form Factor Relation (Slide 16)
  {
    id: "eq_lewis_form_factor",
    name: "Form Factor Relationship",
    canonicalTex: "Y = \\pi y",
    baseFormula: "Y = pi * yform",
    nodes: ["Y", "y_form"]
  },

  // Lewis Beam Bending Stress (Slide 16)
  {
    id: "eq_lewis",
    name: "Lewis Beam Bending Strength",
    canonicalTex: "s = \\frac{F_t P_d}{b Y}",
    baseFormula: "s = (Ft * Pd) / (b * Y)",
    nodes: ["s", "W_t", "P_d", "b", "Y"]
  },

  // Buckingham Dynamic Tooth Load (Slide 17, 23)
  {
    id: "eq_spur_buckingham",
    name: "Buckingham Dynamic Tooth Load",
    canonicalTex: "F_D = F_t + \\frac{k v (b C_d + F_t)}{k v + \\sqrt{b C_d + F_t}}",
    baseFormula: "FD = Ft + (0.05 * v * (b * Cd + Ft)) / (0.05 * v + sqrt(b * Cd + Ft))",
    nodes: ["F_D", "W_t", "V_m", "b", "C_d"]
  }
];
