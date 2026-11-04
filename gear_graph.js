// ========================================================
// gear_graph.js — SSOT Knowledge Graph & Native Unit Solvers
// ========================================================

function fmt(n, maxDec = 3) {
  if (n === undefined || n === null) return "";
  if (typeof n !== "number") n = Number(n);
  if (isNaN(n)) return "";
  const factor = Math.pow(10, maxDec);
  const rounded = Math.round(n * factor) / factor;
  return rounded.toString();
}

const PHI_GRAPH = (1 + Math.sqrt(5)) / 2;              // 1.6180339887...
const PHI_INV_GRAPH = 1 / PHI_GRAPH;                   // 0.6180339887...
const PHI_INV2_GRAPH = PHI_INV_GRAPH * PHI_INV_GRAPH;  // 0.3819660113...

// ========================================================
// 1. VARIABLE DATABASE (Clean Names, No Redundant Symbols)
// ========================================================
const GEAR_VARS_DB = {
  "D_P":  { name: "Pitch Diameter", unit: "in", baseVar: "D_P" },
  "D_P1": { name: "Pinion Pitch Diameter", unit: "in", baseVar: "D_P" },
  "D_P2": { name: "Gear Pitch Diameter", unit: "in", baseVar: "D_P" },
  "P_d":  { name: "Diametral Pitch", unit: "teeth/in", baseVar: "P_d" },
  "P_c":  { name: "Circular Pitch", unit: "in", baseVar: "P_c" },
  "C":    { name: "Center Distance", unit: "in", baseVar: "C" },
  "W_t":  { name: "Transmitted Load", unit: "lb", baseVar: "W_t" },
  "W_r":  { name: "Radial Load", unit: "lb", baseVar: "W_r" },
  "W":    { name: "Normal Contact Force", unit: "lb", baseVar: "W" },
  "M_t":  { name: "Shaft Torque", unit: "lb-in", baseVar: "M_t" },
  "V_m":  { name: "Pitch Line Velocity", unit: "ft/min", baseVar: "V_m" },
  "a":    { name: "Addendum", unit: "in", baseVar: "a" },
  "d":    { name: "Dedendum", unit: "in", baseVar: "d" },
  "c":    { name: "Tooth Clearance", unit: "in", baseVar: "c" },
  "D_o":  { name: "Outside Blank Diameter", unit: "in", baseVar: "D_o" },
  "D_b":  { name: "Base Circle Diameter", unit: "in", baseVar: "D_b" },
  "s":    { name: "Bending Stress", unit: "psi", baseVar: "s" },
  "b":    { name: "Face Width", unit: "in", baseVar: "b" },
  "T":    { name: "Tooth Count", unit: "teeth", baseVar: "T" },
  "T_1":  { name: "Pinion Teeth", unit: "teeth", baseVar: "T" },
  "T_2":  { name: "Gear Teeth", unit: "teeth", baseVar: "T" },
  "n":    { name: "Rotational Speed", unit: "rpm", baseVar: "n" },
  "n_1":  { name: "Driver Speed", unit: "rpm", baseVar: "n" },
  "n_2":  { name: "Driven Speed", unit: "rpm", baseVar: "n" },
  "VR":   { name: "Speed Ratio", unit: "ratio", baseVar: "VR" },
  "P":    { name: "Transmitted Power", unit: "hp", baseVar: "P" },
  "phi":  { name: "Pressure Angle", unit: "deg", baseVar: "phi" },
  "Y":    { name: "Lewis Form Factor", unit: "dimless", baseVar: "Y" },
  "t":    { name: "Tooth Thickness", unit: "in", baseVar: "t" },
  "h":    { name: "Whole Depth", unit: "in", baseVar: "h" },
  "F_D":  { name: "Dynamic Tooth Load", unit: "lb", baseVar: "F_D" },
  "C_d":  { name: "Dynamic Deformation Factor", unit: "lb/in", baseVar: "C_d" },
  "h_k":  { name: "Working Depth", unit: "in", baseVar: "h_k" },
  "B":    { name: "Tooth Backlash", unit: "in", baseVar: "B" },
  "p_b":  { name: "Base Pitch", unit: "in", baseVar: "p_b" },
  "m":    { name: "Metric Module", unit: "mm", baseVar: "m" },
  "C_i":  { name: "Center Distance to Idler", unit: "in", baseVar: "C_i" }
};

const dbUnit = k => (GEAR_VARS_DB[k] || {}).unit || "dimless";
const unitOf = (S, k) => (S && S._u && S._u[k]) || dbUnit(k);

// ========================================================
// 2. KNOWLEDGE GRAPH WITH BASE FORMULAS & NATIVE SOLVERS
// ========================================================
const GEAR_RELATION_GRAPH = [
  // 1. Buckingham Dynamic Load (Slide 1 & Video 58:10)
  {
    id: "eq_buckingham",
    name: "Buckingham Dynamic Load",
    baseFormula: "F_D = F_t + \\frac{0.05 v (b C_d + F_t)}{0.05 v + \\sqrt{b C_d + F_t}}",
    nodes: ["F_D", "W_t", "V_m", "b", "C_d"],
    topic: "forces_torque",
    termsCount: 5,
    forms: {
      F_D: { formula: "F_D = F_t + \\frac{k v (b C + F_t)}{k v + \\sqrt{b C + F_t}}", notes: "Maximum dynamic tooth load (k = 0.05 English, k = 21 SI)" }
    },
    solve: (target, S) => {
      const u = unitOf(S, target);
      const isSI = unitOf(S, "V_m") === "m/s";
      const k = isSI ? 21 : 0.05;
      const bc = S.b * S.C_d + S.W_t;
      const num = k * S.V_m * bc;
      const den = k * S.V_m + Math.sqrt(bc);
      const val = S.W_t + num / den;

      if (target === "F_D") {
        return {
          target: "Dynamic Tooth Load ({{F_D}})",
          text: `Applying Buckingham's equation ($k = ${k}$):`,
          eq: `F_D = F_t + \\frac{${k} v (b C + F_t)}{${k} v + \\sqrt{b C + F_t}} = ${fmt(S.W_t, 0)} + \\frac{${k}(${fmt(S.V_m, 1)})[(${fmt(S.b, 2)})(${fmt(S.C_d, 0)}) + ${fmt(S.W_t, 0)}]}{${k}(${fmt(S.V_m, 1)}) + \\sqrt{(${fmt(S.b, 2)})(${fmt(S.C_d, 0)}) + ${fmt(S.W_t, 0)}}} = \\mathbf{${fmt(val, 1)}\\text{ ${u}}}`,
          val: parseFloat(val.toFixed(1))
        };
      }
    }
  },

  // 2. Working Depth (Slide 5 & Video 20:40)
  {
    id: "eq_working_depth",
    name: "Working Depth",
    baseFormula: "h_k = 2a = \\frac{2}{P_d}",
    nodes: ["h_k", "a", "P_d"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      h_k: { formula: "h_k = 2a = \\frac{2}{P_d}", notes: "Standard working depth is twice the addendum" },
      a:   { formula: "a = \\frac{h_k}{2}", notes: "Addendum is half the working depth" }
    },
    solve: (target, S) => {
      if (target === "h_k") {
        return {
          target: "Working Depth ({{h_k}})",
          text: "Working depth is twice the addendum ($h_k = 2a = \\frac{2}{P_d}$):",
          eq: `h_k = \\frac{2}{P_d} = \\frac{2}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.h_k, 4)}\\text{ in}}`,
          val: S.h_k
        };
      }
      if (target === "a") {
        return {
          target: "Addendum ({{a}})",
          text: "Addendum is half the working depth ($a = \\frac{h_k}{2}$):",
          eq: `a = \\frac{h_k}{2} = \\frac{${fmt(S.h_k, 4)}}{2} = \\mathbf{${fmt(S.a, 4)}\\text{ in}}`,
          val: S.a
        };
      }
    }
  },

  // 3. Dedendum Proportion (Slide 5 & Video 21:00)
  {
    id: "eq_dedendum",
    name: "Dedendum Proportion",
    baseFormula: "d = \\frac{1 + k_c}{P_d}",
    nodes: ["d", "P_d", "phi"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      d: { formula: "d = \\frac{1.157}{P_d} \\text{ (for } 14.5^\\circ) \\text{ or } \\frac{1.25}{P_d} \\text{ (for } 20^\\circ)", notes: "Standard dedendum proportion including tooth clearance" }
    },
    solve: (target, S) => {
      const factor = S.phi === 14.5 ? 1.157 : 1.25;
      if (target === "d") {
        return {
          target: "Dedendum ({{d}})",
          text: `Standard dedendum for ${fmt(S.phi, 1)}° teeth ($d = \\frac{${factor}}{P_d}$):`,
          eq: `d = \\frac{${factor}}{P_d} = \\frac{${factor}}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.d, 4)}\\text{ in}}`,
          val: S.d
        };
      }
    }
  },

  // 4. Backlash (Slide 5 & Video 43:40)
  {
    id: "eq_backlash",
    name: "Tooth Backlash",
    baseFormula: "B = \\frac{0.035}{P_d}",
    nodes: ["B", "P_d"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      B: { formula: "B = \\frac{0.035}{P_d}", notes: "Standard average backlash (range 0.03/P_d to 0.04/P_d)" }
    },
    solve: (target, S) => {
      if (target === "B") {
        return {
          target: "Tooth Backlash ({{B}})",
          text: "Standard average backlash on pitch circle ($B = \\frac{0.035}{P_d}$):",
          eq: `B = \\frac{0.035}{P_d} = \\frac{0.035}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.B, 4)}\\text{ in}}`,
          val: S.B
        };
      }
    }
  },

  // 5. Base Pitch (Video 15:50)
  {
    id: "eq_base_pitch",
    name: "Base Pitch",
    baseFormula: "p_b = P_c \\cos\\phi = \\frac{\\pi \\cos\\phi}{P_d}",
    nodes: ["p_b", "P_c", "phi"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      p_b: { formula: "p_b = P_c \\cos\\phi", notes: "Circular spacing of teeth on base cylinder" },
      P_c: { formula: "P_c = \\frac{p_b}{\\cos\\phi}", notes: "Circular pitch from base pitch" }
    },
    solve: (target, S) => {
      if (target === "p_b") {
        return {
          target: "Base Pitch ({{p_b}})",
          text: "Base pitch along base circle ($p_b = P_c \\cos\\phi$):",
          eq: `p_b = P_c \\cos\\phi = ${fmt(S.P_c, 4)} \\times \\cos(${fmt(S.phi, 1)}^\\circ) = \\mathbf{${fmt(S.p_b, 4)}\\text{ in}}`,
          val: S.p_b
        };
      }
      if (target === "P_c") {
        return {
          target: "Circular Pitch ({{P_c}})",
          text: "Circular pitch from base pitch ($P_c = \\frac{p_b}{\\cos\\phi}$):",
          eq: `P_c = \\frac{p_b}{\\cos\\phi} = \\frac{${fmt(S.p_b, 4)}}{\\cos(${fmt(S.phi, 1)}^\\circ)} = \\mathbf{${fmt(S.P_c, 4)}\\text{ in}}`,
          val: S.P_c
        };
      }
    }
  },

  // 6. Metric Module (Slide 5 & Video 19:10)
  {
    id: "eq_module",
    name: "Metric Module",
    baseFormula: "m = \\frac{25.4}{P_d} = \\frac{D}{T}",
    nodes: ["m", "P_d"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      m:   { formula: "m = \\frac{25.4}{P_d}", notes: "Module in mm (pitch diameter divided by teeth)" },
      P_d: { formula: "P_d = \\frac{25.4}{m}", notes: "Diametral pitch from module" }
    },
    solve: (target, S) => {
      if (target === "m") {
        return {
          target: "Metric Module ({{m}})",
          text: "Metric module from diametral pitch ($m = \\frac{25.4}{P_d}$):",
          eq: `m = \\frac{25.4}{P_d} = \\frac{25.4}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.m, 3)}\\text{ mm}}`,
          val: S.m
        };
      }
    }
  },

  // 7. Internal Gearing with Idler (Video 59:40 / Problem 4)
  {
    id: "eq_internal_idler",
    name: "Internal Gear with Idler",
    baseFormula: "D_2 = 4 C_i - D_1",
    nodes: ["D_P2", "D_P1", "C_i"],
    topic: "speed_center",
    termsCount: 3,
    forms: {
      D_P2: { formula: "D_2 = 2(R_1 + 2 R_i) = 4 C_i - D_1", notes: "Inside pitch diameter of driven internal gear" }
    },
    solve: (target, S) => {
      if (target === "D_P2") {
        const R1 = S.D_P1 / 2;
        const Ri = S.C_i - R1;
        const D2 = 2 * (R1 + 2 * Ri);
        return {
          target: "Internal Gear Diameter ({{D_2|D_P2}})",
          text: `Idler radius $R_i = C_i - R_1 = ${fmt(S.C_i, 1)} - ${fmt(R1, 1)} = ${fmt(Ri, 1)}\\text{ in}$. Inside diameter ($D_2 = 2[R_1 + 2 R_i]$):`,
          eq: `D_2 = 2(${fmt(R1, 1)} + 2(${fmt(Ri, 1)})) = \\mathbf{${fmt(D2, 1)}\\text{ in}}`,
          val: D2
        };
      }
    }
  },

  // 8. Resultant Normal Tooth Load (Slide 4 & Video 48:20)
  {
    id: "eq_resultant_vector",
    name: "Vector Resultant Tooth Force",
    baseFormula: "F_n = \\sqrt{F_t^2 + F_r^2}",
    nodes: ["W", "W_t", "W_r"],
    topic: "forces_torque",
    termsCount: 3,
    forms: {
      W: { formula: "F_n = \\sqrt{F_t^2 + F_r^2}", notes: "Resultant normal force from orthogonal vector components" }
    },
    solve: (target, S) => {
      if (target === "W") {
        const val = Math.sqrt(S.W_t * S.W_t + S.W_r * S.W_r);
        return {
          target: "Normal Contact Force ({{F_n|W}})",
          text: "Total normal force from tangential and radial vectors ($F_n = \\sqrt{F_t^2 + F_r^2}$):",
          eq: `F_n = \\sqrt{F_t^2 + F_r^2} = \\sqrt{(${fmt(S.W_t, 0)})^2 + (${fmt(S.W_r, 0)})^2} = \\mathbf{${fmt(val, 0)}\\text{ lb}}`,
          val: parseFloat(val.toFixed(1))
        };
      }
    }
  },

  // 9. Speed Ratio from Diameters (Slide 2 & Video 02:20)
  {
    id: "eq_vr_diameters",
    name: "Speed Ratio from Pitch Diameters",
    baseFormula: "SR = \\frac{D_2}{D_1}",
    nodes: ["VR", "D_P1", "D_P2"],
    topic: "speed_center",
    termsCount: 3,
    forms: {
      VR:   { formula: "SR = \\frac{D_2}{D_1}", notes: "Speed ratio of pitch diameters" },
      D_P2: { formula: "D_2 = D_1 \\cdot SR", notes: "Driven gear diameter from speed ratio" }
    },
    solve: (target, S) => {
      if (target === "VR") {
        return {
          target: "Speed Ratio ({{SR|VR}})",
          text: "Ratio of driven to driver pitch diameter ($SR = \\frac{D_2}{D_1}$):",
          eq: `SR = \\frac{D_2}{D_1} = \\frac{${fmt(S.D_P2, 3)}}{${fmt(S.D_P1, 3)}} = \\mathbf{${fmt(S.VR, 2)}}`,
          val: S.VR
        };
      }
      if (target === "D_P2") {
        return {
          target: "Gear Pitch Diameter ({{D_2|D_P2}})",
          text: "Driven gear pitch diameter ($D_2 = D_1 \\cdot SR$):",
          eq: `D_2 = D_1 \\cdot SR = ${fmt(S.D_P1, 3)} \\times ${fmt(S.VR, 2)} = \\mathbf{${fmt(S.D_P2, 3)}\\text{ in}}`,
          val: S.D_P2
        };
      }
    }
  },

  // 10. Direct Speed-Teeth Ratio (Slide 2: T1 N1 = T2 N2)
  {
    id: "eq_speed_teeth_direct",
    name: "Tooth-Speed Balance",
    baseFormula: "T_1 N_1 = T_2 N_2",
    nodes: ["T_1", "n_1", "T_2", "n_2"],
    topic: "speed_center",
    termsCount: 4,
    forms: {
      n_2: { formula: "N_2 = \\frac{T_1 N_1}{T_2}", notes: "Driven speed directly from tooth counts" },
      T_2: { formula: "T_2 = \\frac{T_1 N_1}{N_2}", notes: "Driven teeth directly from speeds" }
    },
    solve: (target, S) => {
      if (target === "n_2") {
        return {
          target: "Driven Speed ({{N_2|n_2}})",
          text: "From speed-teeth balance ($T_1 N_1 = T_2 N_2$):",
          eq: `N_2 = \\frac{T_1 N_1}{T_2} = \\frac{${fmt(S.T_1, 0)} \\times ${fmt(S.n_1, 0)}}{${fmt(S.T_2, 0)}} = \\mathbf{${fmt(S.n_2, 1)}\\text{ rpm}}`,
          val: S.n_2
        };
      }
      if (target === "T_2") {
        return {
          target: "Gear Teeth ({{T_2|T}})",
          text: "From speed-teeth balance ($T_2 = \\frac{T_1 N_1}{N_2}$):",
          eq: `T_2 = \\frac{T_1 N_1}{N_2} = \\frac{${fmt(S.T_1, 0)} \\times ${fmt(S.n_1, 0)}}{${fmt(S.n_2, 1)}} = \\mathbf{${fmt(S.T_2, 0)}\\text{ teeth}}`,
          val: S.T_2
        };
      }
    }
  },

  // 11. Pitch Reciprocal Identity
  {
    id: "eq_pitch_inv",
    name: "Pitch Reciprocal Identity",
    baseFormula: "P_c \\cdot P_d = \\pi",
    nodes: ["P_c", "P_d"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      P_d: { formula: "P_d = \\frac{\\pi}{P_c}", notes: "Diametral pitch from circular pitch" },
      P_c: { formula: "P_c = \\frac{\\pi}{P_d}", notes: "Circular spacing from diametral pitch" }
    },
    solve: (target, S) => {
      if (target === "P_d") {
        return {
          target: "Diametral Pitch ({{P_d}})",
          text: "From pitch reciprocal relation ($P_c \\cdot P_d = \\pi$):",
          eq: `P_d = \\frac{\\pi}{P_c} = \\frac{\\pi}{${fmt(S.P_c, 4)}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ in}^{-1}}`,
          val: S.P_d
        };
      }
      if (target === "P_c") {
        return {
          target: "Circular Pitch ({{P_c}})",
          text: "From diametral pitch ($P_c \\cdot P_d = \\pi$):",
          eq: `P_c = \\frac{\\pi}{P_d} = \\frac{\\pi}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.P_c, 4)}\\text{ in}}`,
          val: S.P_c
        };
      }
    }
  },

  // 12. Pinion Pitch Definition
  {
    id: "eq_dp1",
    name: "Pinion Pitch Definition",
    baseFormula: "D_{P1} = \\frac{T_1}{P_d}",
    nodes: ["D_P1", "T_1", "P_d"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      D_P1: { formula: "D_1 = \\frac{T_1}{P_d}", notes: "Pitch diameter from teeth and pitch" },
      P_d:  { formula: "P_d = \\frac{T_1}{D_1}", notes: "Pitch from diameter and teeth" },
      T_1:  { formula: "T_1 = D_1 \\cdot P_d", notes: "Teeth from diameter and pitch" }
    },
    solve: (target, S) => {
      if (target === "D_P1") {
        return {
          target: "Pinion Pitch Diameter ({{D_1|D_P1}})",
          text: "From teeth count and diametral pitch ($D_1 = \\frac{T_1}{P_d}$):",
          eq: `D_1 = \\frac{T_1}{P_d} = \\frac{${fmt(S.T_1, 0)}}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.D_P1, 3)}\\text{ in}}`,
          val: S.D_P1
        };
      }
      if (target === "P_d") {
        return {
          target: "Diametral Pitch ({{P_d}})",
          text: "From pitch diameter and teeth ($P_d = \\frac{T_1}{D_1}$):",
          eq: `P_d = \\frac{T_1}{D_1} = \\frac{${fmt(S.T_1, 0)}}{${fmt(S.D_P1, 3)}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ in}^{-1}}`,
          val: S.P_d
        };
      }
      if (target === "T_1") {
        return {
          target: "Pinion Teeth ({{T_1|T}})",
          text: "From pitch diameter and diametral pitch ($T_1 = D_1 P_d$):",
          eq: `T_1 = D_1 \\cdot P_d = ${fmt(S.D_P1, 3)} \\times ${fmt(S.P_d, 2)} = \\mathbf{${fmt(S.T_1, 0)}\\text{ teeth}}`,
          val: S.T_1
        };
      }
    }
  },

  // 13. Gear Pitch Definition
  {
    id: "eq_dp2",
    name: "Gear Pitch Definition",
    baseFormula: "D_{P2} = \\frac{T_2}{P_d}",
    nodes: ["D_P2", "T_2", "P_d"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      D_P2: { formula: "D_2 = \\frac{T_2}{P_d}", notes: "Gear pitch diameter from gear teeth" },
      T_2:  { formula: "T_2 = D_2 \\cdot P_d", notes: "Gear tooth count from diameter" },
      P_d:  { formula: "P_d = \\frac{T_2}{D_2}", notes: "Pitch from gear diameter and teeth" }
    },
    solve: (target, S) => {
      if (target === "D_P2") {
        return {
          target: "Gear Pitch Diameter ({{D_2|D_P2}})",
          text: "From gear teeth count and diametral pitch ($D_2 = \\frac{T_2}{P_d}$):",
          eq: `D_2 = \\frac{T_2}{P_d} = \\frac{${fmt(S.T_2, 0)}}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.D_P2, 3)}\\text{ in}}`,
          val: S.D_P2
        };
      }
      if (target === "T_2") {
        return {
          target: "Gear Teeth ({{T_2|T}})",
          text: "From gear diameter and diametral pitch ($T_2 = D_2 P_d$):",
          eq: `T_2 = D_2 \\cdot P_d = ${fmt(S.D_P2, 3)} \\times ${fmt(S.P_d, 2)} = \\mathbf{${fmt(S.T_2, 0)}\\text{ teeth}}`,
          val: S.T_2
        };
      }
      if (target === "P_d") {
        return {
          target: "Diametral Pitch ({{P_d}})",
          text: "From gear diameter and teeth ($P_d = \\frac{T_2}{D_2}$):",
          eq: `P_d = \\frac{T_2}{D_2} = \\frac{${fmt(S.T_2, 0)}}{${fmt(S.D_P2, 3)}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ in}^{-1}}`,
          val: S.P_d
        };
      }
    }
  },

  // 14. Center Distance (External)
  {
    id: "eq_center_dist",
    name: "Center Distance (External)",
    baseFormula: "C = \\frac{D_1 + D_2}{2}",
    nodes: ["C", "D_P1", "D_P2"],
    topic: "speed_center",
    termsCount: 4,
    forms: {
      C:    { formula: "C = \\frac{D_1 + D_2}{2}", notes: "Sum of pitch radii" },
      D_P2: { formula: "D_2 = 2C - D_1", notes: "Gear diameter from center distance" },
      D_P1: { formula: "D_1 = 2C - D_2", notes: "Pinion diameter from center distance" }
    },
    solve: (target, S) => {
      if (target === "C") {
        return {
          target: "Center Distance ({{C}})",
          text: "Sum of pitch radii for external mesh ($C = \\frac{D_1 + D_2}{2}$):",
          eq: `C = \\frac{D_1 + D_2}{2} = \\frac{${fmt(S.D_P1, 3)} + ${fmt(S.D_P2, 3)}}{2} = \\mathbf{${fmt(S.C, 3)}\\text{ in}}`,
          val: S.C
        };
      }
      if (target === "D_P2") {
        return {
          target: "Gear Pitch Diameter ({{D_2|D_P2}})",
          text: "From center distance and pinion diameter ($D_2 = 2C - D_1$):",
          eq: `D_2 = 2C - D_1 = 2(${fmt(S.C, 3)}) - ${fmt(S.D_P1, 3)} = \\mathbf{${fmt(S.D_P2, 3)}\\text{ in}}`,
          val: S.D_P2
        };
      }
      if (target === "D_P1") {
        return {
          target: "Pinion Pitch Diameter ({{D_1|D_P1}})",
          text: "From center distance and gear diameter ($D_1 = 2C - D_2$):",
          eq: `D_1 = 2C - D_2 = 2(${fmt(S.C, 3)}) - ${fmt(S.D_P2, 3)} = \\mathbf{${fmt(S.D_P1, 3)}\\text{ in}}`,
          val: S.D_P1
        };
      }
    }
  },

  // 15. Center Distance Ratio Formula
  {
    id: "eq_c_vr_teeth",
    name: "Center Distance Ratio Formula",
    baseFormula: "C = \\frac{T_1 (1 + SR)}{2 P_d}",
    nodes: ["C", "T_1", "VR", "P_d"],
    topic: "speed_center",
    termsCount: 5,
    forms: {
      T_1: { formula: "T_1 = \\frac{2 C \\cdot P_d}{1 + SR}", notes: "Pinion teeth from center distance and ratio" },
      C:   { formula: "C = \\frac{T_1 (1 + SR)}{2 P_d}", notes: "Center distance from pinion teeth and ratio" }
    },
    solve: (target, S) => {
      if (target === "T_1") {
        return {
          target: "Pinion Teeth ({{T_1|T}})",
          text: "From center distance and speed ratio ($T_1 = \\frac{2 C P_d}{1 + SR}$):",
          eq: `T_1 = \\frac{2 C \\cdot P_d}{1 + SR} = \\frac{2(${fmt(S.C, 3)})(${fmt(S.P_d, 2)})}{1 + ${fmt(S.VR, 2)}} = \\mathbf{${fmt(S.T_1, 0)}\\text{ teeth}}`,
          val: S.T_1
        };
      }
      if (target === "C") {
        return {
          target: "Center Distance ({{C}})",
          text: "From pinion teeth and speed ratio ($C = \\frac{T_1 (1 + SR)}{2 P_d}$):",
          eq: `C = \\frac{T_1 (1 + SR)}{2 P_d} = \\frac{${fmt(S.T_1, 0)}(1 + ${fmt(S.VR, 2)})}{2(${fmt(S.P_d, 2)})} = \\mathbf{${fmt(S.C, 3)}\\text{ in}}`,
          val: S.C
        };
      }
    }
  },

  // 16. Center Distance from Teeth Sum
  {
    id: "eq_c_teeth_sum",
    name: "Center Distance from Teeth Sum",
    baseFormula: "C = \\frac{T_1 + T_2}{2 P_d}",
    nodes: ["C", "T_1", "T_2", "P_d"],
    topic: "speed_center",
    termsCount: 4,
    forms: {
      C:   { formula: "C = \\frac{T_1 + T_2}{2 P_d}", notes: "Center distance from total tooth count" },
      P_d: { formula: "P_d = \\frac{T_1 + T_2}{2C}", notes: "Diametral pitch from teeth sum and distance" }
    },
    solve: (target, S) => {
      if (target === "C") {
        return {
          target: "Center Distance ({{C}})",
          text: "Center distance from total teeth in mesh ($C = \\frac{T_1 + T_2}{2 P_d}$):",
          eq: `C = \\frac{T_1 + T_2}{2 P_d} = \\frac{${fmt(S.T_1, 0)} + ${fmt(S.T_2, 0)}}{2(${fmt(S.P_d, 2)})} = \\mathbf{${fmt(S.C, 3)}\\text{ in}}`,
          val: S.C
        };
      }
      if (target === "P_d") {
        return {
          target: "Diametral Pitch ({{P_d}})",
          text: "Pitch from total teeth and center distance ($P_d = \\frac{T_1 + T_2}{2C}$):",
          eq: `P_d = \\frac{T_1 + T_2}{2C} = \\frac{${fmt(S.T_1, 0)} + ${fmt(S.T_2, 0)}}{2(${fmt(S.C, 3)})} = \\mathbf{${fmt(S.P_d, 2)}\\text{ in}^{-1}}`,
          val: S.P_d
        };
      }
    }
  },

  // 17. Speed Reduction Ratio
  {
    id: "eq_vr_speed",
    name: "Speed Reduction Ratio",
    baseFormula: "SR = \\frac{N_1}{N_2}",
    nodes: ["VR", "n_1", "n_2"],
    topic: "speed_center",
    termsCount: 3,
    forms: {
      VR:  { formula: "SR = \\frac{N_1}{N_2}", notes: "Speed reduction ratio" },
      n_2: { formula: "N_2 = \\frac{N_1}{SR}", notes: "Driven speed through reduction" },
      n_1: { formula: "N_1 = N_2 \\cdot SR", notes: "Driver speed from driven speed and ratio" }
    },
    solve: (target, S) => {
      if (target === "VR") {
        return {
          target: "Speed Ratio ({{SR|VR}})",
          text: "From rotational speed ratio ($SR = \\frac{N_1}{N_2}$):",
          eq: `SR = \\frac{N_1}{N_2} = \\frac{${fmt(S.n_1, 0)}}{${fmt(S.n_2, 1)}} = \\mathbf{${fmt(S.VR, 2)}}`,
          val: S.VR
        };
      }
      if (target === "n_2") {
        return {
          target: "Driven Speed ({{N_2|n_2}})",
          text: "Driven speed through reduction ratio ($N_2 = \\frac{N_1}{SR}$):",
          eq: `N_2 = \\frac{N_1}{SR} = \\frac{${fmt(S.n_1, 0)}}{${fmt(S.VR, 2)}} = \\mathbf{${fmt(S.n_2, 1)}\\text{ rpm}}`,
          val: S.n_2
        };
      }
      if (target === "n_1") {
        return {
          target: "Driver Speed ({{N_1|n_1}})",
          text: "Driver speed from driven speed and ratio ($N_1 = N_2 \\cdot SR$):",
          eq: `N_1 = N_2 \\cdot SR = ${fmt(S.n_2, 1)} \\times ${fmt(S.VR, 2)} = \\mathbf{${fmt(S.n_1, 0)}\\text{ rpm}}`,
          val: S.n_1
        };
      }
    }
  },

  // 18. Teeth Ratio
  {
    id: "eq_vr_teeth",
    name: "Teeth Ratio",
    baseFormula: "SR = \\frac{T_2}{T_1}",
    nodes: ["VR", "T_1", "T_2"],
    topic: "speed_center",
    termsCount: 3,
    forms: {
      T_2: { formula: "T_2 = T_1 \\cdot SR", notes: "Driven teeth from ratio" },
      T_1: { formula: "T_1 = \\frac{T_2}{SR}", notes: "Driver teeth from ratio" },
      VR:  { formula: "SR = \\frac{T_2}{T_1}", notes: "Speed ratio from tooth count" }
    },
    solve: (target, S) => {
      if (target === "T_2") {
        return {
          target: "Gear Teeth ({{T_2|T}})",
          text: "From speed ratio and pinion teeth ($T_2 = T_1 \\cdot SR$):",
          eq: `T_2 = T_1 \\cdot SR = ${fmt(S.T_1, 0)} \\times ${fmt(S.VR, 2)} = \\mathbf{${fmt(S.T_2, 0)}\\text{ teeth}}`,
          val: S.T_2
        };
      }
      if (target === "T_1") {
        return {
          target: "Pinion Teeth ({{T_1|T}})",
          text: "From gear teeth and speed ratio ($T_1 = \\frac{T_2}{SR}$):",
          eq: `T_1 = \\frac{T_2}{SR} = \\frac{${fmt(S.T_2, 0)}}{${fmt(S.VR, 2)}} = \\mathbf{${fmt(S.T_1, 0)}\\text{ teeth}}`,
          val: S.T_1
        };
      }
      if (target === "VR") {
        return {
          target: "Speed Ratio ({{SR|VR}})",
          text: "Tooth count ratio of gear to pinion ($SR = \\frac{T_2}{T_1}$):",
          eq: `SR = \\frac{T_2}{T_1} = \\frac{${fmt(S.T_2, 0)}}{${fmt(S.T_1, 0)}} = \\mathbf{${fmt(S.VR, 2)}}`,
          val: S.VR
        };
      }
    }
  },

  // 19. Pitch Line Velocity
  {
    id: "eq_pitch_vel",
    name: "Pitch Line Velocity",
    baseFormula: "v = \\frac{\\pi D_1 N_1}{12}",
    nodes: ["V_m", "D_P1", "n_1"],
    topic: "speed_center",
    termsCount: 4,
    forms: {
      V_m:  { formula: "v = \\frac{\\pi D_1 N_1}{12}", notes: "Linear pitch speed (ft/min)" },
      D_P1: { formula: "D_1 = \\frac{12 v}{\\pi N_1}", notes: "Pitch diameter from pitch speed" },
      n_1:  { formula: "N_1 = \\frac{12 v}{\\pi D_1}", notes: "Rotational speed from pitch speed" }
    },
    solve: (target, S) => {
      if (target === "V_m") {
        return {
          target: "Pitch Line Velocity ({{v|V_m}})",
          text: "Linear velocity at pitch circle ($v = \\frac{\\pi D_1 N_1}{12}$):",
          eq: `v = \\frac{\\pi D_1 N_1}{12} = \\frac{\\pi (${fmt(S.D_P1, 3)})(${fmt(S.n_1, 0)})}{12} = \\mathbf{${fmt(S.V_m, 1)}\\text{ ft/min}}`,
          val: S.V_m
        };
      }
      if (target === "D_P1") {
        return {
          target: "Pinion Pitch Diameter ({{D_1|D_P1}})",
          text: "From pitch line velocity and rpm ($D_1 = \\frac{12 v}{\\pi N_1}$):",
          eq: `D_1 = \\frac{12 v}{\\pi N_1} = \\frac{12 (${fmt(S.V_m, 1)})}{\\pi (${fmt(S.n_1, 0)})} = \\mathbf{${fmt(S.D_P1, 3)}\\text{ in}}`,
          val: S.D_P1
        };
      }
      if (target === "n_1") {
        return {
          target: "Driver Speed ({{N_1|n_1}})",
          text: "From pitch velocity and diameter ($N_1 = \\frac{12 v}{\\pi D_1}$):",
          eq: `N_1 = \\frac{12 v}{\\pi D_1} = \\frac{12(${fmt(S.V_m, 1)})}{\\pi (${fmt(S.D_P1, 3)})} = \\mathbf{${fmt(S.n_1, 0)}\\text{ rpm}}`,
          val: S.n_1
        };
      }
    }
  },

  // 20. Shaft Torque-Horsepower
  {
    id: "eq_torque_power",
    name: "Shaft Torque-Horsepower",
    baseFormula: "P = \\frac{T \\cdot N_1}{63025}",
    nodes: ["M_t", "P", "n_1"],
    topic: "forces_torque",
    termsCount: 4,
    forms: {
      M_t: { formula: "T = \\frac{63025 \\cdot P}{N_1}", notes: "Shaft torque in lb-in from horsepower and rpm" },
      P:   { formula: "P = \\frac{T \\cdot N_1}{63025}", notes: "Horsepower from torque and rpm" },
      n_1: { formula: "N_1 = \\frac{63025 \\cdot P}{T}", notes: "Speed from torque and horsepower" }
    },
    solve: (target, S) => {
      if (target === "M_t") {
        return {
          target: "Shaft Torque ({{T|M_t}})",
          text: "Shaft torque from horsepower ($T = \\frac{63025 P}{N_1}$):",
          eq: `T = \\frac{63025 \\cdot P}{N_1} = \\frac{63025 \\times ${fmt(S.P, 2)}}{${fmt(S.n_1, 0)}} = \\mathbf{${fmt(S.M_t, 1)}\\text{ lb}\\cdot\\text{in}}`,
          val: S.M_t
        };
      }
      if (target === "P") {
        return {
          target: "Transmitted Power ({{P}})",
          text: "Horsepower from torque and rpm ($P = \\frac{T N_1}{63025}$):",
          eq: `P = \\frac{T \\cdot N_1}{63025} = \\frac{${fmt(S.M_t, 1)} \\times ${fmt(S.n_1, 0)}}{63025} = \\mathbf{${fmt(S.P, 2)}\\text{ hp}}`,
          val: S.P
        };
      }
      if (target === "n_1") {
        return {
          target: "Driver Speed ({{N_1|n_1}})",
          text: "Rotational speed from power and torque ($N_1 = \\frac{63025 P}{T}$):",
          eq: `N_1 = \\frac{63025 P}{T} = \\frac{63025(${fmt(S.P, 2)})}{${fmt(S.M_t, 1)}} = \\mathbf{${fmt(S.n_1, 0)}\\text{ rpm}}`,
          val: S.n_1
        };
      }
    }
  },

  // 21. Tangential Load from Torque
  {
    id: "eq_wt_torque",
    name: "Tangential Load from Torque",
    baseFormula: "F_t = \\frac{2T}{D_1}",
    nodes: ["W_t", "M_t", "D_P1"],
    topic: "forces_torque",
    termsCount: 3,
    forms: {
      W_t:  { formula: "F_t = \\frac{2T}{D_1}", notes: "Tangential tooth load from shaft torque and pitch diameter" },
      M_t:  { formula: "T = F_t \\cdot \\frac{D_1}{2}", notes: "Shaft torque from tooth load and pitch radius" },
      D_P1: { formula: "D_1 = \\frac{2T}{F_t}", notes: "Pitch diameter from torque and tangential load" }
    },
    solve: (target, S) => {
      if (target === "W_t") {
        return {
          target: "Tangential Load ({{F_t|W_t}})",
          text: "Tangential force from shaft torque and pitch radius ($F_t = \\frac{2T}{D_1}$):",
          eq: `F_t = \\frac{2T}{D_1} = \\frac{2(${fmt(S.M_t, 1)})}{${fmt(S.D_P1, 3)}} = \\mathbf{${fmt(S.W_t, 0)}\\text{ lb}}`,
          val: S.W_t
        };
      }
      if (target === "M_t") {
        return {
          target: "Shaft Torque ({{T|M_t}})",
          text: "Shaft torque from tangential tooth load and pitch radius ($T = F_t \\frac{D_1}{2}$):",
          eq: `T = F_t \\cdot \\frac{D_1}{2} = ${fmt(S.W_t, 0)} \\times \\frac{${fmt(S.D_P1, 3)}}{2} = \\mathbf{${fmt(S.M_t, 1)}\\text{ lb}\\cdot\\text{in}}`,
          val: S.M_t
        };
      }
      if (target === "D_P1") {
        return {
          target: "Pinion Pitch Diameter ({{D_1|D_P1}})",
          text: "Pitch diameter from torque and tangential load ($D_1 = \\frac{2T}{F_t}$):",
          eq: `D_1 = \\frac{2T}{F_t} = \\frac{2(${fmt(S.M_t, 1)})}{${fmt(S.W_t, 0)}} = \\mathbf{${fmt(S.D_P1, 3)}\\text{ in}}`,
          val: S.D_P1
        };
      }
    }
  },

  // 22. Tangential Load from Power
  {
    id: "eq_wt_power_vel",
    name: "Tangential Load from Power",
    baseFormula: "P = \\frac{F_t \\cdot v}{33000}",
    nodes: ["W_t", "P", "V_m"],
    topic: "forces_torque",
    termsCount: 4,
    forms: {
      W_t: { formula: "F_t = \\frac{33000 \\cdot P}{v}", notes: "Tangential load from horsepower and pitch speed (ft/min)" },
      P:   { formula: "P = \\frac{F_t \\cdot v}{33000}", notes: "Transmitted horsepower from load and speed" },
      V_m: { formula: "v = \\frac{33000 \\cdot P}{F_t}", notes: "Pitch velocity from power and load" }
    },
    solve: (target, S) => {
      if (target === "W_t") {
        return {
          target: "Tangential Load ({{F_t|W_t}})",
          text: "Tangential load from horsepower and pitch speed ($F_t = \\frac{33000 P}{v}$):",
          eq: `F_t = \\frac{33000 \\cdot P}{v} = \\frac{33000 \\times ${fmt(S.P, 2)}}{${fmt(S.V_m, 1)}} = \\mathbf{${fmt(S.W_t, 0)}\\text{ lb}}`,
          val: S.W_t
        };
      }
      if (target === "P") {
        return {
          target: "Transmitted Power ({{P}})",
          text: "Horsepower from tangential load and pitch velocity ($P = \\frac{F_t v}{33000}$):",
          eq: `P = \\frac{F_t \\cdot v}{33000} = \\frac{${fmt(S.W_t, 0)} \\times ${fmt(S.V_m, 1)}}{33000} = \\mathbf{${fmt(S.P, 2)}\\text{ hp}}`,
          val: S.P
        };
      }
      if (target === "V_m") {
        return {
          target: "Pitch Line Velocity ({{v|V_m}})",
          text: "Pitch speed from transmitted power and load ($v = \\frac{33000 P}{F_t}$):",
          eq: `v = \\frac{33000 \\cdot P}{F_t} = \\frac{33000(${fmt(S.P, 2)})}{${fmt(S.W_t, 0)}} = \\mathbf{${fmt(S.V_m, 1)}\\text{ ft/min}}`,
          val: S.V_m
        };
      }
    }
  },

  // 23. Radial Force Relation
  {
    id: "eq_wr_wt",
    name: "Radial Force Relation",
    baseFormula: "F_r = F_t \\tan\\phi",
    nodes: ["W_r", "W_t", "phi"],
    topic: "forces_torque",
    termsCount: 3,
    forms: {
      W_r: { formula: "F_r = F_t \\tan\\phi", notes: "Separating radial force pushing shafts apart" },
      W_t: { formula: "F_t = \\frac{F_r}{\\tan\\phi}", notes: "Tangential drive force derived from radial reaction" },
      phi: { formula: "\\phi = \\tan^{-1}\\left(\\frac{F_r}{F_t}\\right)", notes: "Operating pressure angle from force vector components" }
    },
    solve: (target, S) => {
      if (target === "W_r") {
        return {
          target: "Radial Load ({{F_r|W_r}})",
          text: "Separating force toward shaft center ($F_r = F_t \\tan\\phi$):",
          eq: `F_r = F_t \\tan\\phi = ${fmt(S.W_t, 0)} \\times \\tan(${fmt(S.phi, 1)}^\\circ) = \\mathbf{${fmt(S.W_r, 0)}\\text{ lb}}`,
          val: S.W_r
        };
      }
      if (target === "W_t") {
        return {
          target: "Tangential Load ({{F_t|W_t}})",
          text: "Drive force derived from radial reaction ($F_t = \\frac{F_r}{\\tan\\phi}$):",
          eq: `F_t = \\frac{F_r}{\\tan\\phi} = \\frac{${fmt(S.W_r, 0)}}{\\tan(${fmt(S.phi, 1)}^\\circ)} = \\mathbf{${fmt(S.W_t, 0)}\\text{ lb}}`,
          val: S.W_t
        };
      }
      if (target === "phi") {
        return {
          target: "Pressure Angle ({{\\phi|phi}})",
          text: "Pressure angle from radial and tangential forces:",
          eq: `\\phi = \\tan^{-1}\\left(\\frac{F_r}{F_t}\\right) = \\tan^{-1}\\left(\\frac{${fmt(S.W_r, 0)}}{${fmt(S.W_t, 0)}}\\right) = \\mathbf{${fmt(S.phi, 1)}^\\circ}`,
          val: S.phi
        };
      }
    }
  },

  // 24. Normal Contact Load Vector
  {
    id: "eq_w_normal",
    name: "Normal Contact Load Vector",
    baseFormula: "F_n = \\frac{F_t}{\\cos\\phi}",
    nodes: ["W", "W_t", "phi"],
    topic: "forces_torque",
    termsCount: 3,
    forms: {
      W:   { formula: "F_n = \\frac{F_t}{\\cos\\phi}", notes: "Total normal load acting along line of action" },
      W_t: { formula: "F_t = F_n \\cos\\phi", notes: "Drive force resolved from normal contact force" },
      phi: { formula: "\\phi = \\cos^{-1}\\left(\\frac{F_t}{F_n}\\right)", notes: "Pressure angle from normal force resolution" }
    },
    solve: (target, S) => {
      if (target === "W") {
        return {
          target: "Normal Contact Force ({{F_n|W}})",
          text: "Total force transmitted along line of action ($F_n = \\frac{F_t}{\\cos\\phi}$):",
          eq: `F_n = \\frac{F_t}{\\cos\\phi} = \\frac{${fmt(S.W_t, 0)}}{\\cos(${fmt(S.phi, 1)}^\\circ)} = \\mathbf{${fmt(S.W, 0)}\\text{ lb}}`,
          val: S.W
        };
      }
      if (target === "W_t") {
        return {
          target: "Tangential Load ({{F_t|W_t}})",
          text: "Tangential load resolved from contact normal load ($F_t = F_n \\cos\\phi$):",
          eq: `F_t = F_n \\cos\\phi = ${fmt(S.W, 0)} \\times \\cos(${fmt(S.phi, 1)}^\\circ) = \\mathbf{${fmt(S.W_t, 0)}\\text{ lb}}`,
          val: S.W_t
        };
      }
      if (target === "phi") {
        return {
          target: "Pressure Angle ({{\\phi|phi}})",
          text: "Pressure angle from contact normal and drive force:",
          eq: `\\phi = \\cos^{-1}\\left(\\frac{F_t}{F_n}\\right) = \\cos^{-1}\\left(\\frac{${fmt(S.W_t, 0)}}{${fmt(S.W, 0)}}\\right) = \\mathbf{${fmt(S.phi, 1)}^\\circ}`,
          val: S.phi
        };
      }
    }
  },

  // 25. Full-Depth Addendum
  {
    id: "eq_addendum",
    name: "Full-Depth Addendum",
    baseFormula: "a = \\frac{1}{P_d}",
    nodes: ["a", "P_d"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      a:   { formula: "a = \\frac{1}{P_d}", notes: "Standard full-depth tooth addendum" },
      P_d: { formula: "P_d = \\frac{1}{a}", notes: "Diametral pitch from measured tooth addendum" }
    },
    solve: (target, S) => {
      if (target === "a") {
        return {
          target: "Addendum ({{a}})",
          text: "Standard full-depth addendum proportion ($a = \\frac{1}{P_d}$):",
          eq: `a = \\frac{1}{P_d} = \\frac{1}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.a, 4)}\\text{ in}}`,
          val: S.a
        };
      }
      if (target === "P_d") {
        return {
          target: "Diametral Pitch ({{P_d}})",
          text: "From standard full-depth addendum ($P_d = \\frac{1}{a}$):",
          eq: `P_d = \\frac{1}{a} = \\frac{1}{${fmt(S.a, 4)}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ in}^{-1}}`,
          val: S.P_d
        };
      }
    }
  },

  // 26. Tooth Clearance Proportion
  {
    id: "eq_clearance",
    name: "Tooth Clearance Proportion",
    baseFormula: "c = \\frac{k_c}{P_d}",
    nodes: ["c", "P_d", "phi"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      c:   { formula: "c = \\frac{k_c}{P_d}", notes: "Clearance: k_c = 0.157 (for 14.5°) or 0.25 (for 20°)" },
      P_d: { formula: "P_d = \\frac{k_c}{c}", notes: "Diametral pitch from clearance" }
    },
    solve: (target, S) => {
      const factor = S.phi === 14.5 ? 0.157 : 0.25;
      if (target === "c") {
        return {
          target: "Tooth Clearance ({{c}})",
          text: `Standard clearance for ${fmt(S.phi, 1)}° full-depth teeth ($c = \\frac{${factor}}{P_d}$):`,
          eq: `c = \\frac{${factor}}{P_d} = \\frac{${factor}}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.c, 4)}\\text{ in}}`,
          val: S.c
        };
      }
      if (target === "P_d") {
        return {
          target: "Diametral Pitch ({{P_d}})",
          text: "Pitch from clearance proportion ($P_d = \\frac{k_c}{c}$):",
          eq: `P_d = \\frac{${factor}}{c} = \\frac{${factor}}{${fmt(S.c, 4)}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ in}^{-1}}`,
          val: S.P_d
        };
      }
    }
  },

  // 27. Outside Blank Diameter
  {
    id: "eq_do",
    name: "Outside Blank Diameter",
    baseFormula: "D_o = D_1 + 2a",
    nodes: ["D_o", "D_P1", "a"],
    topic: "pitch_geometry",
    termsCount: 4,
    forms: {
      D_o:  { formula: "D_o = D_1 + 2a", notes: "Outside cylinder diameter adding twice the addendum" },
      D_P1: { formula: "D_1 = D_o - 2a", notes: "Pitch diameter from blank outside diameter" },
      a:    { formula: "a = \\frac{D_o - D_1}{2}", notes: "Addendum from blank diameter" }
    },
    solve: (target, S) => {
      if (target === "D_o") {
        return {
          target: "Outside Diameter ({{D_o}})",
          text: "Blank outer diameter adding twice addendum ($D_o = D_1 + 2a$):",
          eq: `D_o = D_1 + 2a = ${fmt(S.D_P1, 3)} + 2(${fmt(S.a, 4)}) = \\mathbf{${fmt(S.D_o, 3)}\\text{ in}}`,
          val: S.D_o
        };
      }
      if (target === "D_P1") {
        return {
          target: "Pinion Pitch Diameter ({{D_1|D_P1}})",
          text: "Pitch diameter from blank diameter ($D_1 = D_o - 2a$):",
          eq: `D_1 = D_o - 2a = ${fmt(S.D_o, 3)} - 2(${fmt(S.a, 4)}) = \\mathbf{${fmt(S.D_P1, 3)}\\text{ in}}`,
          val: S.D_P1
        };
      }
      if (target === "a") {
        return {
          target: "Addendum ({{a}})",
          text: "Addendum from outer and pitch diameters ($a = \\frac{D_o - D_1}{2}$):",
          eq: `a = \\frac{D_o - D_1}{2} = \\frac{${fmt(S.D_o, 3)} - ${fmt(S.D_P1, 3)}}{2} = \\mathbf{${fmt(S.a, 4)}\\text{ in}}`,
          val: S.a
        };
      }
    }
  },

  // 28. Blank Diameter from Teeth
  {
    id: "eq_do_teeth",
    name: "Blank Diameter from Teeth",
    baseFormula: "D_o = \\frac{T_1 + 2}{P_d}",
    nodes: ["D_o", "T_1", "P_d"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      D_o: { formula: "D_o = \\frac{T_1 + 2}{P_d}", notes: "Outside cylinder diameter directly from teeth and pitch" },
      P_d: { formula: "P_d = \\frac{T_1 + 2}{D_o}", notes: "Diametral pitch from teeth and blank diameter" },
      T_1: { formula: "T_1 = D_o \\cdot P_d - 2", notes: "Tooth count from blank diameter and pitch" }
    },
    solve: (target, S) => {
      if (target === "D_o") {
        return {
          target: "Outside Diameter ({{D_o}})",
          text: "Blank outer diameter from teeth count ($D_o = \\frac{T_1 + 2}{P_d}$):",
          eq: `D_o = \\frac{T_1 + 2}{P_d} = \\frac{${fmt(S.T_1, 0)} + 2}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.D_o, 3)}\\text{ in}}`,
          val: S.D_o
        };
      }
      if (target === "P_d") {
        return {
          target: "Diametral Pitch ({{P_d}})",
          text: "Pitch from teeth and outside blank diameter ($P_d = \\frac{T_1 + 2}{D_o}$):",
          eq: `P_d = \\frac{T_1 + 2}{D_o} = \\frac{${fmt(S.T_1, 0)} + 2}{${fmt(S.D_o, 3)}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ in}^{-1}}`,
          val: S.P_d
        };
      }
      if (target === "T_1") {
        return {
          target: "Pinion Teeth ({{T_1|T}})",
          text: "Teeth count from outside blank diameter ($T_1 = D_o P_d - 2$):",
          eq: `T_1 = D_o \\cdot P_d - 2 = (${fmt(S.D_o, 3)} \\times ${fmt(S.P_d, 2)}) - 2 = \\mathbf{${fmt(S.T_1, 0)}\\text{ teeth}}`,
          val: S.T_1
        };
      }
    }
  },

  // 29. Base Circle Diameter
  {
    id: "eq_db",
    name: "Base Circle Diameter",
    baseFormula: "D_b = D_1 \\cos\\phi",
    nodes: ["D_b", "D_P1", "phi"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      D_b:  { formula: "D_b = D_1 \\cos\\phi", notes: "Base diameter generating the tooth involute" },
      D_P1: { formula: "D_1 = \\frac{D_b}{\\cos\\phi}", notes: "Pitch diameter from base diameter" }
    },
    solve: (target, S) => {
      if (target === "D_b") {
        return {
          target: "Base Circle Diameter ({{D_b}})",
          text: "Base circle diameter generating the tooth involute ($D_b = D_1 \\cos\\phi$):",
          eq: `D_b = D_1 \\cos\\phi = ${fmt(S.D_P1, 3)} \\times \\cos(${fmt(S.phi, 1)}^\\circ) = \\mathbf{${fmt(S.D_b, 3)}\\text{ in}}`,
          val: S.D_b
        };
      }
      if (target === "D_P1") {
        return {
          target: "Pinion Pitch Diameter ({{D_1|D_P1}})",
          text: "Pitch diameter from base circle diameter ($D_1 = \\frac{D_b}{\\cos\\phi}$):",
          eq: `D_1 = \\frac{D_b}{\\cos\\phi} = \\frac{${fmt(S.D_b, 3)}}{\\cos(${fmt(S.phi, 1)}^\\circ)} = \\mathbf{${fmt(S.D_P1, 3)}\\text{ in}}`,
          val: S.D_P1
        };
      }
    }
  },

  // 30. Lewis Beam Bending Strength
  {
    id: "eq_lewis",
    name: "Lewis Beam Bending Strength",
    baseFormula: "s = \\frac{F_t \\cdot P_d}{b \\cdot Y}",
    nodes: ["s", "W_t", "P_d", "b", "Y"],
    topic: "lewis_strength",
    termsCount: 5,
    forms: {
      s:   { formula: "s = \\frac{F_t \\cdot P_d}{b \\cdot Y}", notes: "Induced tensile bending stress at tooth root" },
      W_t: { formula: "F_t = \\frac{s \\cdot b \\cdot Y}{P_d}", notes: "Permissible transmitted load from allowable stress" },
      P_d: { formula: "P_d = \\frac{s \\cdot b \\cdot Y}{F_t}", notes: "Required diametral pitch to resist tooth breakage" },
      b:   { formula: "b = \\frac{F_t \\cdot P_d}{s \\cdot Y}", notes: "Minimum required face width" }
    },
    solve: (target, S) => {
      if (target === "s") {
        return {
          target: "Induced Bending Stress ({{s}})",
          text: "Applying the Lewis beam bending stress formula ($s = \\frac{F_t P_d}{b Y}$):",
          eq: `s = \\frac{F_t \\cdot P_d}{b \\cdot Y} = \\frac{${fmt(S.W_t, 0)} \\times ${fmt(S.P_d, 2)}}{${fmt(S.b, 2)} \\times ${fmt(S.Y, 3)}} = \\mathbf{${fmt(S.s, 0)}\\text{ psi}}`,
          val: S.s
        };
      }
      if (target === "W_t") {
        return {
          target: "Permissible Tangential Load ({{F_t|W_t}})",
          text: "Tangential load capacity from allowable stress limit ($F_t = \\frac{s b Y}{P_d}$):",
          eq: `F_t = \\frac{s \\cdot b \\cdot Y}{P_d} = \\frac{${fmt(S.s, 0)} \\times ${fmt(S.b, 2)} \\times ${fmt(S.Y, 3)}}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.W_t, 0)}\\text{ lb}}`,
          val: S.W_t
        };
      }
      if (target === "b") {
        return {
          target: "Required Face Width ({{b}})",
          text: "Minimum face width to sustain induced bending stress ($b = \\frac{F_t P_d}{s Y}$):",
          eq: `b = \\frac{F_t \\cdot P_d}{s \\cdot Y} = \\frac{${fmt(S.W_t, 0)} \\times ${fmt(S.P_d, 2)}}{${fmt(S.s, 0)} \\times ${fmt(S.Y, 3)}} = \\mathbf{${fmt(S.b, 2)}\\text{ in}}`,
          val: S.b
        };
      }
      if (target === "P_d") {
        return {
          target: "Diametral Pitch ({{P_d}})",
          text: "Diametral pitch from Lewis stress balance ($P_d = \\frac{s b Y}{F_t}$):",
          eq: `P_d = \\frac{s \\cdot b \\cdot Y}{F_t} = \\frac{${fmt(S.s, 0)} \\times ${fmt(S.b, 2)} \\times ${fmt(S.Y, 3)}}{${fmt(S.W_t, 0)}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ in}^{-1}}`,
          val: S.P_d
        };
      }
    }
  },

  // 31. Circular Tooth Thickness
  {
    id: "eq_thick",
    name: "Circular Tooth Thickness",
    baseFormula: "t = \\frac{P_c}{2} = \\frac{\\pi}{2 P_d}",
    nodes: ["t", "P_c"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      t:   { formula: "t = \\frac{P_c}{2}", notes: "Tooth thickness along standard pitch circle" },
      P_c: { formula: "P_c = 2t", notes: "Circular pitch from measured tooth thickness" }
    },
    solve: (target, S) => {
      if (target === "t") {
        return {
          target: "Tooth Thickness ({{t}})",
          text: "Tooth thickness on pitch circle is half circular pitch ($t = \\frac{P_c}{2}$):",
          eq: `t = \\frac{P_c}{2} = \\frac{${fmt(S.P_c, 4)}}{2} = \\mathbf{${fmt(S.t, 4)}\\text{ in}}`,
          val: S.t
        };
      }
      if (target === "P_c") {
        return {
          target: "Circular Pitch ({{P_c}})",
          text: "Circular pitch from tooth thickness ($P_c = 2t$):",
          eq: `P_c = 2t = 2(${fmt(S.t, 4)}) = \\mathbf{${fmt(S.P_c, 4)}\\text{ in}}`,
          val: S.P_c
        };
      }
    }
  },

  // 32. Whole Depth
  {
    id: "eq_whole",
    name: "Whole Depth",
    baseFormula: "h = a + d = 2a + c",
    nodes: ["h", "a", "c"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      h: { formula: "h = 2a + c", notes: "Total tooth depth including addendum and clearance" },
      c: { formula: "c = h - 2a", notes: "Clearance from whole depth" },
      a: { formula: "a = \\frac{h - c}{2}", notes: "Addendum from whole depth" }
    },
    solve: (target, S) => {
      if (target === "h") {
        return {
          target: "Whole Depth ({{h}})",
          text: "Total tooth depth adding twice addendum plus clearance ($h = 2a + c$):",
          eq: `h = 2a + c = 2(${fmt(S.a, 4)}) + ${fmt(S.c, 4)} = \\mathbf{${fmt(S.h, 4)}\\text{ in}}`,
          val: S.h
        };
      }
      if (target === "c") {
        return {
          target: "Tooth Clearance ({{c}})",
          text: "Clearance by subtracting twice addendum from whole depth ($c = h - 2a$):",
          eq: `c = h - 2a = ${fmt(S.h, 4)} - 2(${fmt(S.a, 4)}) = \\mathbf{${fmt(S.c, 4)}\\text{ in}}`,
          val: S.c
        };
      }
    }
  }
];

// Context Carousel Query
function getGraphCardsForVariable(rawVarKey, activeProblem = null) {
  const familyMap = {
    "T":   ["T", "T_1", "T_2"],
    "T_1": ["T_1", "T", "T_2"],
    "T_2": ["T_2", "T", "T_1"],
    "D_P":  ["D_P", "D_P1", "D_P2"],
    "D_P1": ["D_P1", "D_P", "D_P2"],
    "D_P2": ["D_P2", "D_P", "D_P1"],
    "n":   ["n", "n_1", "n_2"],
    "n_1": ["n_1", "n"],
    "n_2": ["n_2", "n"],
    "W_t": ["W_t", "F_t"],
    "W_r": ["W_r", "F_r"],
    "W":   ["W", "F_n"],
    "M_t": ["M_t", "T"],
    "V_m": ["V_m", "v"],
    "VR":  ["VR", "SR"]
  };

  const lookupKeys = familyMap[rawVarKey] || [rawVarKey];
  const meta = GEAR_VARS_DB[rawVarKey];
  if (meta && meta.baseVar && !lookupKeys.includes(meta.baseVar)) {
    lookupKeys.push(meta.baseVar);
  }

  const cards = [];
  const visitedFormulas = new Set();

  GEAR_RELATION_GRAPH.forEach(eq => {
    const involvesVar = eq.nodes.some(n => lookupKeys.includes(n));
    if (!involvesVar) return;

    if (eq.baseFormula && !visitedFormulas.has(eq.baseFormula)) {
      visitedFormulas.add(eq.baseFormula);
      cards.push({
        eqId: eq.id,
        isBase: true,
        targetVar: rawVarKey,
        formula: eq.baseFormula,
        notes: `${eq.name} (Canonical Equation)`,
        vars: eq.nodes.filter(n => n !== rawVarKey),
        usedInProblem: false
      });
    }

    const matchKey = lookupKeys.find(k => eq.forms && eq.forms[k]);
    if (matchKey && eq.forms[matchKey]) {
      const form = eq.forms[matchKey];
      if (!visitedFormulas.has(form.formula)) {
        visitedFormulas.add(form.formula);
        cards.push({
          eqId: eq.id,
          isBase: false,
          targetVar: matchKey,
          formula: form.formula,
          notes: `${eq.name}: ${form.notes}`,
          vars: eq.nodes.filter(n => n !== matchKey),
          usedInProblem: false
        });
      }
    }
  });

  if (activeProblem && activeProblem.solution) {
    const directStep = activeProblem.solution.find(s => lookupKeys.includes(s.targetVar));
    if (directStep) {
      const idx = cards.findIndex(c => c.eqId === directStep.eqId && c.isBase);
      if (idx >= 0) {
        cards[idx].usedInProblem = true;
        const [targetCard] = cards.splice(idx, 1);
        cards.unshift(targetCard);
      }
    }
  }

  return cards;
}

// ========================================================
// 3. CLEAN GROUND TRUTH SYSTEM GENERATOR
// ========================================================
function createGroundTruthSystem() {
  const P_d = [2, 3, 4, 5, 6, 8, 10, 12][Math.floor(Math.random() * 8)];
  const phi = [14.5, 20][Math.floor(Math.random() * 2)];

  const T_1 = [16, 18, 20, 24, 25, 28, 30, 32][Math.floor(Math.random() * 8)];
  const VR_target = [2, 2.5, 3, 4][Math.floor(Math.random() * 4)];
  const T_2 = Math.round(T_1 * VR_target);
  const VR = parseFloat((T_2 / T_1).toFixed(2));

  const n_1 = [350, 600, 900, 1150, 1200, 1750, 1800, 3600][Math.floor(Math.random() * 8)];
  const n_2 = parseFloat((n_1 / VR).toFixed(1));

  const b = [1.5, 1.75, 2.0, 2.25, 2.5, 3.0][Math.floor(Math.random() * 6)];

  const Y_TABLE = { 16: 0.255, 18: 0.270, 20: 0.284, 24: 0.305, 25: 0.310, 28: 0.325, 30: 0.330, 32: 0.340 };
  const Y = Y_TABLE[T_1] || 0.300;

  const D_P1 = parseFloat((T_1 / P_d).toFixed(3));
  const D_P2 = parseFloat((T_2 / P_d).toFixed(3));
  const C = parseFloat(((D_P1 + D_P2) / 2).toFixed(3));

  const P_c = parseFloat((Math.PI / P_d).toFixed(4));
  const a = parseFloat((1 / P_d).toFixed(4));
  const kc = phi === 14.5 ? 0.157 : 0.25;
  const c = parseFloat((kc / P_d).toFixed(4));
  const d = parseFloat(((1 + kc) / P_d).toFixed(4));
  const D_o = parseFloat((D_P1 + 2 * a).toFixed(3));
  const D_b = parseFloat((D_P1 * Math.cos((phi * Math.PI) / 180)).toFixed(3));
  const t = parseFloat((P_c / 2).toFixed(4));
  const h = parseFloat((2 * a + c).toFixed(4));
  const h_k = parseFloat((2 * a).toFixed(4));
  const B = parseFloat((0.035 / P_d).toFixed(4));
  const p_b = parseFloat((P_c * Math.cos((phi * Math.PI) / 180)).toFixed(4));
  const m = parseFloat((25.4 / P_d).toFixed(3));
  const C_i = 20.0;

  const V_m = Math.round((Math.PI * D_P1 * n_1) / 12);
  const W_t_seed = [120, 150, 180, 200, 250, 300, 350, 400, 500, 600, 750, 900][Math.floor(Math.random() * 12)];

  const raw_s = (W_t_seed * P_d) / (b * Y);
  const s = Math.round(raw_s / 25) * 25;
  const W_t_exact = parseFloat(((s * b * Y) / P_d).toFixed(1));

  const M_t = parseFloat(((W_t_exact * D_P1) / 2).toFixed(1));
  const P = parseFloat(((W_t_exact * V_m) / 33000).toFixed(2));
  const W_r = parseFloat((W_t_exact * Math.tan((phi * Math.PI) / 180)).toFixed(1));
  const W = parseFloat((W_t_exact / Math.cos((phi * Math.PI) / 180)).toFixed(1));

  // Buckingham Equation Values
  const C_d = [800, 1200, 1600, 2000][Math.floor(Math.random() * 4)];
  const k_buck = 0.05;
  const num_fd = k_buck * V_m * (b * C_d + W_t_exact);
  const den_fd = k_buck * V_m + Math.sqrt(b * C_d + W_t_exact);
  const F_D = parseFloat((W_t_exact + num_fd / den_fd).toFixed(1));

  return {
    P_d, phi, T_1, T_2, VR, n_1, n_2, P, P_c, D_P1, D_P2, C,
    V_m, M_t, W_t: W_t_exact, W_r, W, a, d, c, D_o, D_b, Y, b, s, t, h,
    F_D, C_d, h_k, B, p_b, m, C_i
  };
}

// ========================================================
// 4. BIPARTITE DAG PROPAGATION SOLVER
// ========================================================
function solveProblemOnGraph(givensArray, S) {
  const known = new Set(givensArray);
  const solutionSteps = [];
  const usedEquations = new Set();
  let keepPropagating = true;
  const producedBy = {};

  while (keepPropagating) {
    keepPropagating = false;
    for (const eq of GEAR_RELATION_GRAPH) {
      if (usedEquations.has(eq.id)) continue;
      const unknowns = eq.nodes.filter(n => !known.has(n));
      if (unknowns.length === 1) {
        const targetVar = unknowns[0];
        const solved = eq.solve(targetVar, S);
        if (solved) {
          known.add(targetVar);
          usedEquations.add(eq.id);

          const inputVars = eq.nodes.filter(n => n !== targetVar);
          const parentStepIndices = [];
          inputVars.forEach(v => {
            if (producedBy[v] !== undefined) {
              parentStepIndices.push(producedBy[v]);
            }
          });

          const ancestorSet = new Set();
          function traceAncestors(pIdx) {
            ancestorSet.add(pIdx);
            const pStep = solutionSteps[pIdx];
            if (pStep && pStep.parentIndices) {
              pStep.parentIndices.forEach(gpIdx => traceAncestors(gpIdx));
            }
          }
          parentStepIndices.forEach(pIdx => traceAncestors(pIdx));

          const newStepIndex = solutionSteps.length;
          solutionSteps.push({
            target: solved.target,
            text: solved.text,
            equation: solved.eq,
            targetVar,
            eqId: eq.id,
            expectedVal: solved.val,
            parentIndices: parentStepIndices,
            ancestorIndices: Array.from(ancestorSet)
          });

          producedBy[targetVar] = newStepIndex;
          keepPropagating = true;
        }
      }
    }
  }
  return solutionSteps;
}

// ========================================================
// 5. COMPOUND LEAPFROG DERIVATION BUILDER
// ========================================================
function buildCompoundDerivation(step, S, allSteps) {
  if (!S || !step || !step.parentIndices || step.parentIndices.length === 0) return null;

  const hasBypassedAncestor = step.parentIndices.some(pIdx => {
    const parentStep = allSteps[pIdx];
    return parentStep && parentStep.isFaded;
  });

  if (!hasBypassedAncestor) return null;

  const t = step.targetVar;

  if (t === "P" && step.eqId === "eq_wt_power_vel") {
    const derivationBlock = `\\begin{alignedat}{2}
W_t &= \\frac{33000 P}{V_m} \\\\
W_t &= \\frac{33000 P}{\\left(\\dfrac{\\pi D_{P1} n_1}{12}\\right)}
    &&= \\frac{12(33000) P}{\\pi D_{P1} n_1} \\\\
    &&\\mathllap{\\frac{W_r}{\\tan\\phi}}
    &= \\frac{12(33000) P}{\\pi D_{P1} n_1}
\\end{alignedat}`;
    const finalBlock = `P = \\frac{W_r \\pi D_{P1} n_1}{12(33000) \\tan\\phi} = \\frac{(${fmt(S.W_r, 0)})\\pi(${fmt(S.D_P1, 3)})(${fmt(S.n_1, 0)})}{12(33000)\\tan(${fmt(S.phi, 1)}^\\circ)} = \\mathbf{${fmt(step.expectedVal, 2)}\\text{ hp}}`;
    return { type: "alignedat_dual", derivationBlock, finalBlock };
  }

  if (t === "D_o" && step.eqId === "eq_do") {
    const derivationBlock = `\\begin{aligned}
D_o &= D_{P1} + 2a \\\\
D_o &= \\frac{T_1}{P_d} + 2\\left(\\frac{1}{P_d}\\right) = \\frac{T_1 + 2}{P_d}
\\end{aligned}`;
    const finalBlock = `D_o = \\frac{${fmt(S.T_1, 0)} + 2}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(step.expectedVal, 3)}\\text{ in}}`;
    return { type: "aligned_dual", derivationBlock, finalBlock };
  }

  if (t === "V_m" && step.eqId === "eq_pitch_vel") {
    const derivationBlock = `\\begin{aligned}
V_m &= \\frac{\\pi D_{P1} n_1}{12} \\\\
V_m &= \\frac{\\pi \\left(\\dfrac{T_1}{P_d}\\right) n_1}{12} = \\frac{\\pi T_1 n_1}{12 P_d}
\\end{aligned}`;
    const finalBlock = `V_m = \\frac{\\pi(${fmt(S.T_1, 0)})(${fmt(S.n_1, 0)})}{12(${fmt(S.P_d, 2)})} = \\mathbf{${fmt(step.expectedVal, 1)}\\text{ ft/min}}`;
    return { type: "aligned_dual", derivationBlock, finalBlock };
  }

  return null;
}

// ========================================================
// 6. SEED LIBRARY & CLASS SAMPLE PROBLEM ARCHETYPES
// ========================================================
const ORGANIC_SEED_PATTERNS = [
  // Class Slide 1 & Video 58:10: Buckingham Dynamic Load
  { name: "Buckingham Maximum Dynamic Load", givens: ["W_t", "V_m", "b", "C_d"], topic: "forces_torque", goals: ["F_D"] },

  // Class Slide 6 Problem: Tooth Thickness with Distractors (Whole Depth & Pressure Angle)
  { name: "Tooth Thickness with Exam Distractors (Slide 6)", givens: ["P_c", "h", "phi"], topic: "pitch_geometry", goals: ["t"] },

  // Class Video 63:00 Problem: Clearance
  { name: "Tooth Clearance from Pitch (Video 63:00)", givens: ["P_d", "phi"], topic: "pitch_geometry", goals: ["c"] },

  // Class Video 59:40 Problem: Internal Gear with Idler
  { name: "Internal Gearing with Idler Gear (Video 59:40)", givens: ["D_P1", "C_i"], topic: "speed_center", goals: ["D_P2"] },

  // Class Video 15:50 Problem: Base Pitch
  { name: "Base Pitch from Involute Geometry (Video 15:50)", givens: ["P_c", "phi"], topic: "pitch_geometry", goals: ["p_b"] },

  // Class Slide 5: Tooth Proportions Suite
  { name: "Tooth Proportions Suite", givens: ["P_d", "phi"], topic: "pitch_geometry", goals: ["h_k", "d", "B", "m"] },

  // Standard Drivers & Force Vectors
  { name: "Motor Power to Shaft Torque & Load", givens: ["P", "n_1", "D_P1", "phi"], topic: "forces_torque", goals: ["M_t", "W_r", "W", "D_b"] },
  { name: "Shaft Torque and RPM to Motor Power", givens: ["M_t", "n_1", "D_P1"], topic: "forces_torque", goals: ["P", "W_t", "V_m"] },
  { name: "Reverse Dynamics: Contact Load to Power", givens: ["W", "phi", "V_m", "n_1"], topic: "forces_torque", goals: ["P", "W_r", "M_t", "D_b"] },
  { name: "Radial Reaction to Pinion Torque", givens: ["W_r", "phi", "D_P1", "n_1"], topic: "forces_torque", goals: ["M_t", "P", "W", "D_b"] },
  { name: "Lewis Limit to Gear Blank", givens: ["s", "b", "Y", "W_t", "T_1"], topic: "lewis_strength", goals: ["P_d", "D_P1", "D_o", "M_t"] },
  { name: "Center Distance to Pitch Line Speed", givens: ["C", "VR", "P_d", "n_1"], topic: "speed_center", goals: ["V_m", "D_P1", "T_2", "n_2"] }
];

function buildGeneratedSeeds(attemptsPerTarget = 8) {
  const S = createGroundTruthSystem();
  const found = new Map();
  const solversOf = v => GEAR_RELATION_GRAPH.filter(e => e.nodes.includes(v) && e.solve(v, S));

  const expand = (v, depth, banned) => {
    const opts = solversOf(v).filter(e => !banned.has(e.id));
    if (depth <= 0 || opts.length === 0 || Math.random() < PHI_INV2_GRAPH) return [v];
    const e2 = opts[Math.floor(Math.random() * opts.length)];
    const nb = new Set([...banned, e2.id]);
    return e2.nodes.filter(n => n !== v).flatMap(n => expand(n, depth - 1, nb));
  };

  GEAR_RELATION_GRAPH.forEach(eq => {
    eq.nodes.filter(t => eq.solve(t, S)).forEach(goal => {
      for (let k = 0; k < attemptsPerTarget; k++) {
        const banned = new Set([eq.id]);
        const givens = [...new Set(eq.nodes.filter(n => n !== goal).flatMap(n => expand(n, 2, banned)))].sort();
        if (givens.includes(goal) || givens.length > 6) continue;
        const key = `${givens.join(",")}>${goal}`;
        if (found.has(key)) continue;

        const steps = solveProblemOnGraph(givens, S);
        const gi = steps.findIndex(s => s.targetVar === goal);
        if (gi < 0) continue;
        const req = [gi, ...steps[gi].ancestorIndices];
        if (!req.some(i => steps[i].eqId === eq.id)) continue;
        if (givens.some(g => solveProblemOnGraph(givens.filter(x => x !== g), S).some(s => s.targetVar === goal))) continue;

        found.set(key, {
          name: `${eq.name} → ${(GEAR_VARS_DB[goal] || {}).name || goal}`,
          topic: eq.topic, givens, goal, key
        });
      }
    });
  });

  return [...found.values()];
}

let _seedCandidates = null;
function getSeedCandidates() {
  if (_seedCandidates) return _seedCandidates;
  const list = [];
  ORGANIC_SEED_PATTERNS.forEach(p => {
    (p.goals || []).forEach(g => {
      list.push({ name: p.name, topic: p.topic, givens: p.givens, goal: g, key: `${p.name}>${g}` });
    });
  });
  _seedCandidates = list.concat(buildGeneratedSeeds());
  return _seedCandidates;
}
