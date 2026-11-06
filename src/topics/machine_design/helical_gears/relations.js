/**
 * src/topics/machine_design/helical_gears/relations.js
 * Complete Helical Gear Knowledge Graph based on Prime's Pocket Reference Manual.
 */

export const HELICAL_RELATION_GRAPH = [
  // ========================================================
  // 1. 3D PITCHES & ANGULAR RELATIONS
  // ========================================================
  {
    id: "eq_helical_pcn",
    name: "Normal Circular Pitch",
    canonicalTex: "P_{cn} = P_c \\cos\\psi",
    baseFormula: "Pcn = Pc * cos(psi)",
    nodes: ["P_cn", "P_c", "psi"]
  },
  {
    id: "eq_helical_pdn",
    name: "Normal Diametral Pitch",
    canonicalTex: "P_{dn} = \\frac{P_d}{\\cos\\psi}",
    baseFormula: "Pdn = Pd / cos(psi)",
    nodes: ["P_dn", "P_d", "psi"]
  },
  {
    id: "eq_helical_axial_pitch",
    name: "Axial Pitch from Circular Pitch",
    canonicalTex: "P_a = \\frac{P_c}{\\tan\\psi}",
    baseFormula: "Pa = Pc / tan(psi)",
    nodes: ["P_a", "P_c", "psi"]
  },
  {
    id: "eq_helical_axial_pcn",
    name: "Axial Pitch from Normal Pitch",
    canonicalTex: "P_a = \\frac{P_{cn}}{\\sin\\psi}",
    baseFormula: "Pa = Pcn / sin(psi)",
    nodes: ["P_a", "P_cn", "psi"]
  },
  {
    id: "eq_helical_pitch_inv_norm",
    name: "Normal Pitch Identity",
    canonicalTex: "P_{cn} P_{dn} = \\pi",
    baseFormula: "Pcn * Pdn = pi",
    nodes: ["P_cn", "P_dn"]
  },
  {
    id: "eq_helical_pitch_inv_trans",
    name: "Transverse Pitch Identity",
    canonicalTex: "P_c P_d = \\pi",
    baseFormula: "Pc * Pd = pi",
    nodes: ["P_c", "P_d"]
  },
  {
    id: "eq_helical_pressure_angle",
    name: "Normal Pressure Angle Relation",
    canonicalTex: "\\tan\\phi_n = \\tan\\phi \\cos\\psi",
    baseFormula: "tan(phin) = tan(phi) * cos(psi)",
    nodes: ["phi_n", "phi", "psi"]
  },
  {
    id: "eq_helical_lead",
    name: "Tooth Lead Relation",
    canonicalTex: "L = \\frac{\\pi D_1}{\\tan\\psi}",
    baseFormula: "L_lead = (pi * D1) / tan(psi)",
    nodes: ["L_lead", "D_P1", "psi"]
  },
  {
    id: "eq_helical_face_contact_ratio",
    name: "Face Contact Ratio",
    canonicalTex: "m_F = \\frac{b}{P_a}",
    baseFormula: "mF = b / Pa",
    nodes: ["m_F", "b", "P_a"]
  },
  {
    id: "eq_helical_formative_teeth",
    name: "Formative Number of Teeth",
    canonicalTex: "T_v = \\frac{T_1}{\\cos^3\\psi}",
    baseFormula: "Tv = T1 / (cos(psi)^3)",
    nodes: ["T_v", "T_1", "psi"]
  },

  // ========================================================
  // 2. DIAMETERS & CENTER DISTANCES
  // ========================================================
  {
    id: "eq_helical_dp1",
    name: "Pinion Pitch Diameter from Transverse Pitch",
    canonicalTex: "D_1 = \\frac{T_1}{P_d}",
    baseFormula: "D1 = T1 / Pd",
    nodes: ["D_P1", "T_1", "P_d"]
  },
  {
    id: "eq_helical_dp1_norm",
    name: "Pinion Pitch Diameter from Normal Pitch",
    canonicalTex: "D_1 = \\frac{T_1}{P_{dn} \\cos\\psi}",
    baseFormula: "D1 = T1 / (Pdn * cos(psi))",
    nodes: ["D_P1", "T_1", "P_dn", "psi"]
  },
  {
    id: "eq_helical_dp2",
    name: "Gear Pitch Diameter from Transverse Pitch",
    canonicalTex: "D_2 = \\frac{T_2}{P_d}",
    baseFormula: "D2 = T2 / Pd",
    nodes: ["D_P2", "T_2", "P_d"]
  },
  {
    id: "eq_helical_center_dist_trans",
    name: "Center Distance from Diameters",
    canonicalTex: "C = \\frac{D_1 + D_2}{2}",
    baseFormula: "C = (D1 + D2) / 2",
    nodes: ["C", "D_P1", "D_P2"]
  },
  {
    id: "eq_helical_center_dist_teeth",
    name: "Center Distance from Normal Pitch",
    canonicalTex: "C = \\frac{T_1 + T_2}{2 P_{dn} \\cos\\psi}",
    baseFormula: "C = (T1 + T2) / (2 * Pdn * cos(psi))",
    nodes: ["C", "T_1", "T_2", "P_dn", "psi"]
  },

  // ========================================================
  // 3. KINEMATICS & VELOCITY
  // ========================================================
  {
    id: "eq_helical_vr_speed",
    name: "Speed Ratio from Rotational Speeds",
    canonicalTex: "\\text{SR} = \\frac{N_1}{N_2}",
    baseFormula: "SR = n1 / n2",
    nodes: ["VR", "n_1", "n_2"]
  },
  {
    id: "eq_helical_vr_teeth",
    name: "Speed Ratio from Teeth",
    canonicalTex: "\\text{SR} = \\frac{T_2}{T_1}",
    baseFormula: "SR = T2 / T1",
    nodes: ["VR", "T_1", "T_2"]
  },
  {
    id: "eq_helical_pitch_vel",
    name: "Pitch Line Velocity",
    canonicalTex: "v = \\pi D_1 N_1",
    baseFormula: "v = pi * D1 * n1",
    nodes: ["V_m", "D_P1", "n_1"]
  },

  // ========================================================
  // 4. 3D FORCES & POWER
  // ========================================================
  {
    id: "eq_helical_wt_torque",
    name: "Tangential Load from Torque",
    canonicalTex: "T = \\frac{F_t D_1}{2}",
    baseFormula: "T = Ft * D1 / 2",
    nodes: ["M_t", "W_t", "D_P1"]
  },
  {
    id: "eq_helical_torque_power",
    name: "Rotational Power & Torque",
    canonicalTex: "P = 2\\pi N_1 T",
    baseFormula: "P = 2 * pi * n1 * T",
    nodes: ["P", "n_1", "M_t"]
  },
  {
    id: "eq_helical_axial_force",
    name: "Axial Thrust Load",
    canonicalTex: "F_a = F_t \\tan\\psi",
    baseFormula: "Fa = Ft * tan(psi)",
    nodes: ["F_a", "W_t", "psi"]
  },
  {
    id: "eq_helical_radial_force",
    name: "Radial Force from Tangential",
    canonicalTex: "F_r = F_t \\tan\\phi",
    baseFormula: "Fr = Ft * tan(phi)",
    nodes: ["W_r", "W_t", "phi"]
  },
  {
    id: "eq_helical_radial_normal",
    name: "Radial Force from Normal Contact Force",
    canonicalTex: "F_r = F_n \\sin\\phi",
    baseFormula: "Fr = Fn * sin(phi)",
    nodes: ["W_r", "W", "phi"]
  },
  {
    id: "eq_helical_fn_3d",
    name: "Resultant 3D Normal Tooth Load",
    canonicalTex: "F_n = \\sqrt{F_t^2 + F_r^2 + F_a^2}",
    baseFormula: "Fn = sqrt(Ft^2 + Fr^2 + Fa^2)",
    nodes: ["W", "W_t", "W_r", "F_a"]
  },

  // ========================================================
  // 5. FATIGUE STRENGTH, DYNAMIC & WEAR LOADS
  // ========================================================
  {
    id: "eq_helical_lewis_fatigue",
    name: "Beam Fatigue Strength (Helical)",
    canonicalTex: "F_s = \\frac{s b Y}{k_f P_{dn}}",
    baseFormula: "Fs = (s * b * Y) / (kf * Pdn)",
    nodes: ["F_s", "s", "b", "Y", "k_f", "P_dn"]
  },
  {
    id: "eq_helical_buckingham",
    name: "Buckingham Dynamic Load (Helical)",
    canonicalTex: "F_D = F_t + \\frac{0.05 v (F_t + b C_d \\cos^2\\psi) \\cos\\psi}{0.05 v + \\sqrt{F_t + b C_d \\cos^2\\psi}}",
    baseFormula: "FD = Ft + (0.05 * v * (Ft + b * Cd * cos(psi)^2) * cos(psi)) / (0.05 * v + sqrt(Ft + b * Cd * cos(psi)^2))",
    nodes: ["F_D", "W_t", "V_m", "psi", "b", "C_d"]
  },
  {
    id: "eq_helical_ratio_factor",
    name: "Ratio Factor for Gearing",
    canonicalTex: "Q = \\frac{2 T_2}{T_1 + T_2}",
    baseFormula: "Q = (2 * T2) / (T1 + T2)",
    nodes: ["Q", "T_1", "T_2"]
  },
  {
    id: "eq_helical_wear_load",
    name: "Limiting Wear Load (Helical)",
    canonicalTex: "F_w = \\frac{D_1 b Q K_w}{\\cos^2\\psi}",
    baseFormula: "Fw = (D1 * b * Q * Kw) / (cos(psi)^2)",
    nodes: ["F_w", "D_P1", "b", "Q", "K_w", "psi"]
  }
];