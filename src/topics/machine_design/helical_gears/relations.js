export const HELICAL_RELATION_GRAPH = [
  // 1. Axial Pitch from Circular Pitch & Helix Angle (Slide 25)
  {
    id: "eq_helical_axial_pitch",
    name: "Axial Pitch Relation",
    canonicalTex: "\\tan\\psi = \\frac{P_c}{P_a}",
    baseFormula: "tan(psi) = Pc / Pa",
    nodes: ["psi", "P_c", "P_a"]
  },

  // 2. Normal Circular Pitch (Slide 25)
  {
    id: "eq_helical_pcn",
    name: "Normal Circular Pitch",
    canonicalTex: "P_{cn} = P_c \\cos\\psi",
    baseFormula: "Pcn = Pc * cos(psi)",
    nodes: ["P_cn", "P_c", "psi"]
  },

  // 3. Normal Diametral Pitch (Slide 25)
  {
    id: "eq_helical_pdn",
    name: "Normal Diametral Pitch",
    canonicalTex: "P_d = P_{dn} \\cos\\psi",
    baseFormula: "Pd = Pdn * cos(psi)",
    nodes: ["P_d", "P_dn", "psi"]
  },

  // 4. Normal Pitch Reciprocal Identity (Slide 25)
  {
    id: "eq_helical_pitch_inv",
    name: "Normal Pitch Identity",
    canonicalTex: "P_{cn} P_{dn} = \\pi",
    baseFormula: "Pcn * Pdn = pi",
    nodes: ["P_cn", "P_dn"]
  },

  // 5. Center Distance from Helical Teeth (Slide 38)
  {
    id: "eq_helical_center_dist",
    name: "Center Distance from Normal Pitch",
    canonicalTex: "C = \\frac{T_1 + T_2}{2 P_{dn} \\cos\\psi}",
    baseFormula: "C = (T1 + T2) / (2 * Pdn * cos(psi))",
    nodes: ["C", "T_1", "T_2", "P_dn", "psi"]
  },

  // 6. Tangential to Normal Pressure Angle (Slide 30-31)
  {
    id: "eq_helical_pressure_angle",
    name: "Normal Pressure Angle Relation",
    canonicalTex: "\\tan\\phi_n = \\tan\\phi \\cos\\psi",
    baseFormula: "tan(phin) = tan(phi) * cos(psi)",
    nodes: ["phi_n", "phi", "psi"]
  },

  // 7. Axial (Thrust) Force from Tangential Load (Slide 28)
  {
    id: "eq_helical_axial_force",
    name: "Axial Thrust Load",
    canonicalTex: "F_a = F_t \\tan\\psi",
    baseFormula: "Fa = Ft * tan(psi)",
    nodes: ["F_a", "W_t", "psi"]
  },

  // 8. Radial Force from Tangential Load (Slide 27)
  {
    id: "eq_helical_radial_force",
    name: "Radial Separating Force",
    canonicalTex: "F_r = F_t \\tan\\phi",
    baseFormula: "Fr = Ft * tan(phi)",
    nodes: ["W_r", "W_t", "phi"]
  },

  // 9. Radial to Axial Force Direct Ratio (Slide 33)
  {
    id: "eq_helical_radial_axial_ratio",
    name: "Radial to Axial Force Ratio",
    canonicalTex: "\\frac{F_r}{F_a} = \\frac{\\tan\\phi}{\\tan\\psi}",
    baseFormula: "Fr / Fa = tan(phi) / tan(psi)",
    nodes: ["W_r", "F_a", "phi", "psi"]
  },

  // 10. Resultant 3D Tooth Normal Force (Slide 32)
  {
    id: "eq_helical_fn_3d",
    name: "Total 3D Contact Force",
    canonicalTex: "F_n = \\sqrt{F_t^2 + F_r^2 + F_a^2}",
    baseFormula: "Fn = sqrt(Ft^2 + Fr^2 + Fa^2)",
    nodes: ["W", "W_t", "W_r", "F_a"]
  },

  // 11. Normal Force from Radial Angle (Slide 29)
  {
    id: "eq_helical_fn_radial",
    name: "Normal Force from Normal Pressure Angle",
    canonicalTex: "F_r = F_n \\sin\\phi_n",
    baseFormula: "Fr = Fn * sin(phin)",
    nodes: ["W_r", "W", "phi_n"]
  },

  // 12. Lewis Bending Strength for Helical Teeth (Slide 34)
  {
    id: "eq_helical_lewis",
    name: "Helical Lewis Beam Strength",
    canonicalTex: "F_t = \\frac{s b Y}{k P_{dn}}",
    baseFormula: "Ft = (s * b * Y) / (k * Pdn)",
    nodes: ["W_t", "s", "b", "Y", "P_dn"]
  },

  // 13. Buckingham Dynamic Load for Helical Gears (Slide 35)
  {
    id: "eq_helical_buckingham",
    name: "Helical Dynamic Load (Buckingham)",
    canonicalTex: "F_D = F_t + \\frac{k v \\cos\\psi (b C_d \\cos^2\\psi + F_t)}{k v + \\sqrt{b C_d \\cos^2\\psi + F_t}}",
    baseFormula: "FD = Ft + (k * v * cos(psi) * (b * Cd * cos(psi)^2 + Ft)) / (k * v + sqrt(b * Cd * cos(psi)^2 + Ft))",
    nodes: ["F_D", "W_t", "V_m", "psi", "b", "C_d"]
  }
];
