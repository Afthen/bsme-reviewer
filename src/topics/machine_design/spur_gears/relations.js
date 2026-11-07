/**
 * src/topics/machine_design/spur_gears/relations.js
 * Spur Gear Relations with empirical requiredUnits and SI/US variants.
 */

import { BASE_GEAR_RELATIONS } from "../common/gear_base_relations.js";

export const GEAR_RELATION_GRAPH = [
  ...BASE_GEAR_RELATIONS,

  { id: "eq_working_depth", name: "Working Depth", canonicalTex: "W_r = 2a", baseFormula: "h_k = 2*a", nodes: ["h_k", "a"] },
  { id: "eq_whole_depth_sum", name: "Whole Depth (Addendum + Dedendum)", canonicalTex: "W = a + d", baseFormula: "h = a + d", nodes: ["h", "a", "d"] },
  { id: "eq_clearance", name: "Tooth Clearance Definition", canonicalTex: "c = d - a", baseFormula: "c = d - a", nodes: ["c", "d", "a"] },
  { id: "eq_root_diameter", name: "Root Circle Diameter", canonicalTex: "D_r = D_1 - 2d", baseFormula: "D_r = D_P1 - 2*d", nodes: ["D_r", "D_P1", "d"] },
  { id: "eq_addendum", name: "Full-Depth Addendum", canonicalTex: "a = \\frac{1}{P_d}", baseFormula: "a = 1 / P_d", nodes: ["a", "P_d"] },
  { id: "eq_do", name: "Outside Blank Diameter", canonicalTex: "D_o = D_1 + 2a", baseFormula: "D_o = D_P1 + 2*a", nodes: ["D_o", "D_P1", "a"] },
  { id: "eq_thick", name: "Circular Tooth Thickness", canonicalTex: "t = \\frac{P_c}{2}", baseFormula: "t = P_c / 2", nodes: ["t", "P_c"] },
  { id: "eq_module_def", name: "Module Definition", canonicalTex: "m = \\frac{D_1}{T_1}", baseFormula: "m = D_P1 / T_1", nodes: ["m", "D_P1", "T_1"] },
  { id: "eq_dp1", name: "Pinion Pitch Definition", canonicalTex: "D_1 = \\frac{T_1}{P_d}", baseFormula: "D_P1 = T_1 / P_d", nodes: ["D_P1", "T_1", "P_d"] },
  { id: "eq_dp2", name: "Gear Pitch Definition", canonicalTex: "D_2 = \\frac{T_2}{P_d}", baseFormula: "D_P2 = T_2 / P_d", nodes: ["D_P2", "T_2", "P_d"] },
  { id: "eq_c_teeth_sum", name: "Center Distance from Teeth Sum", canonicalTex: "C = \\frac{T_1 + T_2}{2 P_d}", baseFormula: "C = (T_1 + T_2) / (2 * P_d)", nodes: ["C", "T_1", "T_2", "P_d"] },
  { id: "eq_wr_wt", name: "Radial Force Relation", canonicalTex: "F_r = F_t \\tan\\phi", baseFormula: "W_r = W_t * tan(phi)", nodes: ["W_r", "W_t", "phi"] },
  { id: "eq_w_normal", name: "Normal Contact Load Resolution", canonicalTex: "F_t = F_n \\cos\\phi", baseFormula: "W_t = W * cos(phi)", nodes: ["W_t", "W", "phi"] },
  { id: "eq_resultant_vector", name: "Resultant Tooth Force Vector", canonicalTex: "F_n = \\sqrt{F_t^2 + F_r^2}", baseFormula: "W = sqrt(W_t^2 + W_r^2)", nodes: ["W", "W_t", "W_r"] },
  { id: "eq_lewis", name: "Lewis Beam Bending Strength", canonicalTex: "s = \\frac{F_t P_d}{b Y}", baseFormula: "s = (W_t * P_d) / (b * Y)", nodes: ["s", "W_t", "P_d", "b", "Y"] },
  { id: "eq_beam_fatigue_strength", name: "Beam Fatigue Strength (Modified Lewis)", canonicalTex: "F_s = \\frac{S_n b Y}{k_f P_d}", baseFormula: "F_s = (S_n * b * Y) / (k_f * P_d)", nodes: ["F_s", "S_n", "b", "Y", "k_f", "P_d"] },
  { 
    id: "eq_spur_buckingham", 
    name: "Buckingham Dynamic Tooth Load", 
    solvable: ["F_D"],
    nodes: ["F_D", "W_t", "V_m", "b", "C_d"],
    variants: {
      US: {
        canonicalTex: "F_D = F_t + \\frac{0.05 v (b C_d + F_t)}{0.05 v + \\sqrt{b C_d + F_t}}",
        baseFormula: "F_D = W_t + (0.05 * V_m * (b * C_d + W_t)) / (0.05 * V_m + sqrt(b * C_d + W_t))",
        requiredUnits: { V_m: "ft/min", b: "in", W_t: "lb", C_d: "lb", F_D: "lb" }
      },
      SI: {
        canonicalTex: "F_D = F_t + \\frac{21 v (b C_d + F_t)}{21 v + \\sqrt{b C_d + F_t}}",
        baseFormula: "F_D = W_t + (21 * V_m * (b * C_d + W_t)) / (21 * V_m + sqrt(b * C_d + W_t))",
        requiredUnits: { V_m: "m/s", b: "mm", W_t: "N", C_d: "N", F_D: "N" }
      }
    },
    canonicalTex: "F_D = F_t + \\frac{0.05 v (b C_d + F_t)}{0.05 v + \\sqrt{b C_d + F_t}}",
    baseFormula: "F_D = W_t + (0.05 * V_m * (b * C_d + W_t)) / (0.05 * V_m + sqrt(b * C_d + W_t))",
    requiredUnits: { V_m: "ft/min", b: "in", W_t: "lb", C_d: "lb", F_D: "lb" }
  },
  { id: "eq_ratio_factor_q", name: "Ratio Factor for Gearing", canonicalTex: "Q = \\frac{2 T_2}{T_1 + T_2}", baseFormula: "Q = (2 * T_2) / (T_1 + T_2)", nodes: ["Q", "T_1", "T_2"] },
  { id: "eq_wear_load", name: "Limiting Wear Load", canonicalTex: "F_w = D_1 b Q K_w", baseFormula: "F_w = D_P1 * b * Q * K_w", nodes: ["F_w", "D_P1", "b", "Q", "K_w"] },
  { id: "eq_fatigue_safety_factor", name: "Safety Factor for Fatigue", canonicalTex: "N_{sf} = \\frac{F_s}{F_D}", baseFormula: "N_sf = F_s / F_D", nodes: ["N_sf", "F_s", "F_D"] }
];
