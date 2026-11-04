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

const PHI_INV2_GRAPH = 0.3819660113;

// ========================================================
// 1. VARIABLE DATABASE
// ========================================================
const GEAR_VARS_DB = {
  "D_P":  { name: "Pitch Diameter", unit: "in", baseVar: "D_P" },
  "D_P1": { name: "Pinion Pitch Diameter", unit: "in", baseVar: "D_P" },
  "D_P2": { name: "Gear Pitch Diameter", unit: "in", baseVar: "D_P" },
  "P_d":  { name: "Diametral Pitch", unit: "teeth/in", baseVar: "P_d" },
  "P_c":  { name: "Circular Pitch", unit: "in", baseVar: "P_c" },
  "C":    { name: "Center Distance", unit: "in", baseVar: "C" },
  "W_t":  { name: "Transmitted Load (Tangential)", unit: "lb", baseVar: "W_t" },
  "W_r":  { name: "Radial Load", unit: "lb", baseVar: "W_r" },
  "W":    { name: "Resultant Load (Normal)", unit: "lb", baseVar: "W" },
  "M_t":  { name: "Shaft Torque", unit: "lb-in", baseVar: "M_t" },
  "V_m":  { name: "Pitch Line Velocity", unit: "ft/min", baseVar: "V_m" },
  "a":    { name: "Addendum", unit: "in", baseVar: "a" },
  "d":    { name: "Dedendum", unit: "in", baseVar: "d" },
  "c":    { name: "Tooth Clearance", unit: "in", baseVar: "c" },
  "D_o":  { name: "Outside Blank Diameter", unit: "in", baseVar: "D_o" },
  "D_b":  { name: "Base Circle Diameter", unit: "in", baseVar: "D_b" },
  "s":    { name: "Bending Stress (Lewis)", unit: "psi", baseVar: "s" },
  "b":    { name: "Face Width", unit: "in", baseVar: "b" },
  "T":    { name: "Tooth Count", unit: "teeth", baseVar: "T" },
  "T_1":  { name: "Pinion Teeth", unit: "teeth", baseVar: "T" },
  "T_2":  { name: "Gear Teeth", unit: "teeth", baseVar: "T" },
  "n":    { name: "Rotational Speed", unit: "rpm", baseVar: "n" },
  "n_1":  { name: "Driver Speed", unit: "rpm", baseVar: "n" },
  "n_2":  { name: "Driven Speed", unit: "rpm", baseVar: "n" },
  "VR":   { name: "Velocity Ratio", unit: "ratio", baseVar: "VR" },
  "P":    { name: "Transmitted Power", unit: "hp", baseVar: "P" },
  "phi":  { name: "Pressure Angle", unit: "deg", baseVar: "phi" },
  "Y":    { name: "Lewis Form Factor", unit: "dimless", baseVar: "Y" },
  "t":    { name: "Circular Tooth Thickness", unit: "in", baseVar: "t" },
  "h":    { name: "Whole Depth", unit: "in", baseVar: "h" }
};

const dbUnit = k => (GEAR_VARS_DB[k] || {}).unit || "dimless";
const unitOf = (S, k) => (S && S._u && S._u[k]) || dbUnit(k);

// ========================================================
// 2. KNOWLEDGE GRAPH WITH BASE FORMULAS & NATIVE SOLVERS
// ========================================================
const GEAR_RELATION_GRAPH = [
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
      const u = unitOf(S, target);
      if (target === "P_d") {
        return {
          target: `Diametral Pitch ({{P_d}})${u !== "teeth/in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "From pitch reciprocal relation ($P_c \\cdot P_d = \\pi$):",
          eq: `P_d = \\frac{\\pi}{P_c} = \\frac{\\pi}{${fmt(S.P_c, 4)}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ in}^{-1}}`,
          val: S.P_d
        };
      }
      if (target === "P_c") {
        return {
          target: `Circular Pitch ({{P_c}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "From diametral pitch ($P_c \\cdot P_d = \\pi$):",
          eq: `P_c = \\frac{\\pi}{P_d} = \\frac{\\pi}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.P_c, 4)}\\text{ in}}`,
          val: S.P_c
        };
      }
    }
  },
  {
    id: "eq_dp1",
    name: "Pinion Pitch Definition",
    baseFormula: "D_{P1} = \\frac{T_1}{P_d}",
    nodes: ["D_P1", "T_1", "P_d"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      D_P1: { formula: "D_{P1} = \\frac{T_1}{P_d}", notes: "Pitch diameter from teeth and pitch" },
      P_d:  { formula: "P_d = \\frac{T_1}{D_{P1}}", notes: "Pitch from diameter and teeth" },
      T_1:  { formula: "T_1 = D_{P1} \\cdot P_d", notes: "Teeth from diameter and pitch" }
    },
    solve: (target, S) => {
      const u = unitOf(S, target);
      if (target === "D_P1") {
        return {
          target: `Pinion Pitch Diameter ({{D_{P1}|D_P}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "From teeth count and diametral pitch ($D_{P1} = \\frac{T_1}{P_d}$):",
          eq: `D_{P1} = \\frac{T_1}{P_d} = \\frac{${fmt(S.T_1, 0)}}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.D_P1, 3)}\\text{ in}}`,
          val: S.D_P1
        };
      }
      if (target === "P_d") {
        return {
          target: `Diametral Pitch ({{P_d}})${u !== "teeth/in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "From pitch diameter and teeth ($P_d = \\frac{T_1}{D_{P1}}$):",
          eq: `P_d = \\frac{T_1}{D_{P1}} = \\frac{${fmt(S.T_1, 0)}}{${fmt(S.D_P1, 3)}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ in}^{-1}}`,
          val: S.P_d
        };
      }
      if (target === "T_1") {
        return {
          target: "Pinion Teeth ({{T_1|T}})",
          text: "From pitch diameter and diametral pitch ($T_1 = D_{P1} P_d$):",
          eq: `T_1 = D_{P1} \\cdot P_d = ${fmt(S.D_P1, 3)} \\times ${fmt(S.P_d, 2)} = \\mathbf{${fmt(S.T_1, 0)}\\text{ teeth}}`,
          val: S.T_1
        };
      }
    }
  },
  {
    id: "eq_dp2",
    name: "Gear Pitch Definition",
    baseFormula: "D_{P2} = \\frac{T_2}{P_d}",
    nodes: ["D_P2", "T_2", "P_d"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      D_P2: { formula: "D_{P2} = \\frac{T_2}{P_d}", notes: "Gear pitch diameter from gear teeth" },
      T_2:  { formula: "T_2 = D_{P2} \\cdot P_d", notes: "Gear tooth count from diameter" },
      P_d:  { formula: "P_d = \\frac{T_2}{D_{P2}}", notes: "Pitch from gear diameter and teeth" }
    },
    solve: (target, S) => {
      const u = unitOf(S, target);
      if (target === "D_P2") {
        return {
          target: `Gear Pitch Diameter ({{D_{P2}|D_P}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "From gear teeth count and diametral pitch ($D_{P2} = \\frac{T_2}{P_d}$):",
          eq: `D_{P2} = \\frac{T_2}{P_d} = \\frac{${fmt(S.T_2, 0)}}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.D_P2, 3)}\\text{ in}}`,
          val: S.D_P2
        };
      }
      if (target === "T_2") {
        return {
          target: "Gear Teeth ({{T_2|T}})",
          text: "From gear diameter and diametral pitch ($T_2 = D_{P2} P_d$):",
          eq: `T_2 = D_{P2} \\cdot P_d = ${fmt(S.D_P2, 3)} \\times ${fmt(S.P_d, 2)} = \\mathbf{${fmt(S.T_2, 0)}\\text{ teeth}}`,
          val: S.T_2
        };
      }
      if (target === "P_d") {
        return {
          target: `Diametral Pitch ({{P_d}})${u !== "teeth/in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "From gear diameter and teeth ($P_d = \\frac{T_2}{D_{P2}}$):",
          eq: `P_d = \\frac{T_2}{D_{P2}} = \\frac{${fmt(S.T_2, 0)}}{${fmt(S.D_P2, 3)}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ in}^{-1}}`,
          val: S.P_d
        };
      }
    }
  },
  {
    id: "eq_center_dist",
    name: "Center Distance (External)",
    baseFormula: "C = \\frac{D_{P1} + D_{P2}}{2}",
    nodes: ["C", "D_P1", "D_P2"],
    topic: "speed_center",
    termsCount: 4,
    forms: {
      C:    { formula: "C = \\frac{D_{P1} + D_{P2}}{2}", notes: "Sum of pitch radii" },
      D_P2: { formula: "D_{P2} = 2C - D_{P1}", notes: "Gear diameter from center distance" },
      D_P1: { formula: "D_{P1} = 2C - D_{P2}", notes: "Pinion diameter from center distance" }
    },
    solve: (target, S) => {
      const u = unitOf(S, target);
      if (target === "C") {
        return {
          target: `Center Distance ({{C}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Sum of pitch radii for external mesh ($C = \\frac{D_{P1} + D_{P2}}{2}$):",
          eq: `C = \\frac{D_{P1} + D_{P2}}{2} = \\frac{${fmt(S.D_P1, 3)} + ${fmt(S.D_P2, 3)}}{2} = \\mathbf{${fmt(S.C, 3)}\\text{ in}}`,
          val: S.C
        };
      }
      if (target === "D_P2") {
        return {
          target: `Gear Pitch Diameter ({{D_{P2}|D_P}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "From center distance and pinion diameter ($D_{P2} = 2C - D_{P1}$):",
          eq: `D_{P2} = 2C - D_{P1} = 2(${fmt(S.C, 3)}) - ${fmt(S.D_P1, 3)} = \\mathbf{${fmt(S.D_P2, 3)}\\text{ in}}`,
          val: S.D_P2
        };
      }
      if (target === "D_P1") {
        return {
          target: `Pinion Pitch Diameter ({{D_{P1}|D_P}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "From center distance and gear diameter ($D_{P1} = 2C - D_{P2}$):",
          eq: `D_{P1} = 2C - D_{P2} = 2(${fmt(S.C, 3)}) - ${fmt(S.D_P2, 3)} = \\mathbf{${fmt(S.D_P1, 3)}\\text{ in}}`,
          val: S.D_P1
        };
      }
    }
  },
  {
    id: "eq_c_vr_teeth",
    name: "Center Distance Ratio Formula",
    baseFormula: "C = \\frac{T_1 (1 + VR)}{2 P_d}",
    nodes: ["C", "T_1", "VR", "P_d"],
    topic: "speed_center",
    termsCount: 5,
    forms: {
      T_1: { formula: "T_1 = \\frac{2 C \\cdot P_d}{1 + VR}", notes: "Pinion teeth from center distance and ratio" },
      C:   { formula: "C = \\frac{T_1 (1 + VR)}{2 P_d}", notes: "Center distance from pinion teeth and ratio" }
    },
    solve: (target, S) => {
      const u = unitOf(S, target);
      if (target === "T_1") {
        return {
          target: "Pinion Teeth ({{T_1|T}})",
          text: "From center distance and velocity ratio ($T_1 = \\frac{2 C P_d}{1 + VR}$):",
          eq: `T_1 = \\frac{2 C \\cdot P_d}{1 + VR} = \\frac{2(${fmt(S.C, 3)})(${fmt(S.P_d, 2)})}{1 + ${fmt(S.VR, 2)}} = \\mathbf{${fmt(S.T_1, 0)}\\text{ teeth}}`,
          val: S.T_1
        };
      }
      if (target === "C") {
        return {
          target: `Center Distance ({{C}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "From pinion teeth and velocity ratio ($C = \\frac{T_1 (1 + VR)}{2 P_d}$):",
          eq: `C = \\frac{T_1 (1 + VR)}{2 P_d} = \\frac{${fmt(S.T_1, 0)}(1 + ${fmt(S.VR, 2)})}{2(${fmt(S.P_d, 2)})} = \\mathbf{${fmt(S.C, 3)}\\text{ in}}`,
          val: S.C
        };
      }
    }
  },
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
      const u = unitOf(S, target);
      if (target === "C") {
        return {
          target: `Center Distance ({{C}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Center distance from total teeth in mesh ($C = \\frac{T_1 + T_2}{2 P_d}$):",
          eq: `C = \\frac{T_1 + T_2}{2 P_d} = \\frac{${fmt(S.T_1, 0)} + ${fmt(S.T_2, 0)}}{2(${fmt(S.P_d, 2)})} = \\mathbf{${fmt(S.C, 3)}\\text{ in}}`,
          val: S.C
        };
      }
      if (target === "P_d") {
        return {
          target: `Diametral Pitch ({{P_d}})${u !== "teeth/in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Pitch from total teeth and center distance ($P_d = \\frac{T_1 + T_2}{2C}$):",
          eq: `P_d = \\frac{T_1 + T_2}{2C} = \\frac{${fmt(S.T_1, 0)} + ${fmt(S.T_2, 0)}}{2(${fmt(S.C, 3)})} = \\mathbf{${fmt(S.P_d, 2)}\\text{ in}^{-1}}`,
          val: S.P_d
        };
      }
    }
  },
  {
    id: "eq_vr_speed",
    name: "Speed Reduction Ratio",
    baseFormula: "VR = \\frac{n_1}{n_2}",
    nodes: ["VR", "n_1", "n_2"],
    topic: "speed_center",
    termsCount: 3,
    forms: {
      VR:  { formula: "VR = \\frac{n_1}{n_2}", notes: "Speed reduction ratio" },
      n_2: { formula: "n_2 = \\frac{n_1}{VR}", notes: "Driven speed through reduction" },
      n_1: { formula: "n_1 = n_2 \\cdot VR", notes: "Driver speed from driven speed and ratio" }
    },
    solve: (target, S) => {
      const u = unitOf(S, target);
      if (target === "VR") {
        return {
          target: "Velocity Ratio (VR)",
          text: "From rotational speed ratio ($VR = \\frac{n_1}{n_2}$):",
          eq: `VR = \\frac{n_1}{n_2} = \\frac{${fmt(S.n_1, 0)}}{${fmt(S.n_2, 1)}} = \\mathbf{${fmt(S.VR, 2)}}`,
          val: S.VR
        };
      }
      if (target === "n_2") {
        return {
          target: `Driven Speed ({{n_2|n}})${u !== "rpm" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Driven speed through reduction ratio ($n_2 = \\frac{n_1}{VR}$):",
          eq: `n_2 = \\frac{n_1}{VR} = \\frac{${fmt(S.n_1, 0)}}{${fmt(S.VR, 2)}} = \\mathbf{${fmt(S.n_2, 1)}\\text{ rpm}}`,
          val: S.n_2
        };
      }
      if (target === "n_1") {
        return {
          target: `Driver Speed ({{n_1|n}})${u !== "rpm" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Driver speed from driven speed and ratio ($n_1 = n_2 \\cdot VR$):",
          eq: `n_1 = n_2 \\cdot VR = ${fmt(S.n_2, 1)} \\times ${fmt(S.VR, 2)} = \\mathbf{${fmt(S.n_1, 0)}\\text{ rpm}}`,
          val: S.n_1
        };
      }
    }
  },
  {
    id: "eq_vr_teeth",
    name: "Teeth Ratio",
    baseFormula: "VR = \\frac{T_2}{T_1}",
    nodes: ["VR", "T_1", "T_2"],
    topic: "speed_center",
    termsCount: 3,
    forms: {
      T_2: { formula: "T_2 = T_1 \\cdot VR", notes: "Driven teeth from ratio" },
      T_1: { formula: "T_1 = \\frac{T_2}{VR}", notes: "Driver teeth from ratio" },
      VR:  { formula: "VR = \\frac{T_2}{T_1}", notes: "Velocity ratio from tooth count" }
    },
    solve: (target, S) => {
      if (target === "T_2") {
        return {
          target: "Gear Teeth ({{T_2|T}})",
          text: "From velocity ratio and pinion teeth ($T_2 = T_1 \\cdot VR$):",
          eq: `T_2 = T_1 \\cdot VR = ${fmt(S.T_1, 0)} \\times ${fmt(S.VR, 2)} = \\mathbf{${fmt(S.T_2, 0)}\\text{ teeth}}`,
          val: S.T_2
        };
      }
      if (target === "T_1") {
        return {
          target: "Pinion Teeth ({{T_1|T}})",
          text: "From gear teeth and velocity ratio ($T_1 = \\frac{T_2}{VR}$):",
          eq: `T_1 = \\frac{T_2}{VR} = \\frac{${fmt(S.T_2, 0)}}{${fmt(S.VR, 2)}} = \\mathbf{${fmt(S.T_1, 0)}\\text{ teeth}}`,
          val: S.T_1
        };
      }
      if (target === "VR") {
        return {
          target: "Velocity Ratio (VR)",
          text: "Tooth count ratio of gear to pinion ($VR = \\frac{T_2}{T_1}$):",
          eq: `VR = \\frac{T_2}{T_1} = \\frac{${fmt(S.T_2, 0)}}{${fmt(S.T_1, 0)}} = \\mathbf{${fmt(S.VR, 2)}}`,
          val: S.VR
        };
      }
    }
  },
  {
    id: "eq_pitch_vel",
    name: "Pitch Line Velocity",
    baseFormula: "V_m = \\frac{\\pi D_{P1} n_1}{12}",
    nodes: ["V_m", "D_P1", "n_1"],
    topic: "speed_center",
    termsCount: 4,
    forms: {
      V_m:  { formula: "V_m = \\frac{\\pi D_{P1} n_1}{12}", notes: "Linear pitch speed (ft/min)" },
      D_P1: { formula: "D_{P1} = \\frac{12 V_m}{\\pi n_1}", notes: "Pitch diameter from pitch speed" },
      n_1:  { formula: "n_1 = \\frac{12 V_m}{\\pi D_{P1}}", notes: "Rotational speed from pitch speed" }
    },
    solve: (target, S) => {
      const u = unitOf(S, target);
      if (target === "V_m") {
        return {
          target: `Pitch Line Velocity ({{V_m}})${u !== "ft/min" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Linear velocity at the pitch diameter ($V_m = \\frac{\\pi D_{P1} n_1}{12}$):",
          eq: `V_m = \\frac{\\pi D_{P1} n_1}{12} = \\frac{\\pi (${fmt(S.D_P1, 3)})(${fmt(S.n_1, 0)})}{12} = \\mathbf{${fmt(S.V_m, 1)}\\text{ ft/min}}`,
          val: S.V_m
        };
      }
      if (target === "D_P1") {
        return {
          target: `Pinion Pitch Diameter ({{D_{P1}|D_P}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "From pitch line velocity and rpm ($D_{P1} = \\frac{12 V_m}{\\pi n_1}$):",
          eq: `D_{P1} = \\frac{12 V_m}{\\pi n_1} = \\frac{12 (${fmt(S.V_m, 1)})}{\\pi (${fmt(S.n_1, 0)})} = \\mathbf{${fmt(S.D_P1, 3)}\\text{ in}}`,
          val: S.D_P1
        };
      }
      if (target === "n_1") {
        return {
          target: `Driver Speed ({{n_1|n}})${u !== "rpm" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "From pitch velocity and diameter ($n_1 = \\frac{12 V_m}{\\pi D_{P1}}$):",
          eq: `n_1 = \\frac{12 V_m}{\\pi D_{P1}} = \\frac{12(${fmt(S.V_m, 1)})}{\\pi (${fmt(S.D_P1, 3)})} = \\mathbf{${fmt(S.n_1, 0)}\\text{ rpm}}`,
          val: S.n_1
        };
      }
    }
  },
  {
    id: "eq_torque_power",
    name: "Shaft Torque-Horsepower",
    baseFormula: "P = \\frac{M_t \\cdot n_1}{63025}",
    nodes: ["M_t", "P", "n_1"],
    topic: "forces_torque",
    termsCount: 4,
    forms: {
      M_t: { formula: "M_t = \\frac{63025 \\cdot P}{n_1}", notes: "Shaft torque in lb-in from horsepower and rpm" },
      P:   { formula: "P = \\frac{M_t \\cdot n_1}{63025}", notes: "Horsepower from torque and rpm" },
      n_1: { formula: "n_1 = \\frac{63025 \\cdot P}{M_t}", notes: "Speed from torque and horsepower" }
    },
    solve: (target, S) => {
      const u = unitOf(S, target);
      if (target === "M_t") {
        return {
          target: `Pinion Torque ({{M_t}})${u !== "lb-in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Shaft torque from horsepower ($M_t = \\frac{63025 P}{n_1}$):",
          eq: `M_t = \\frac{63025 \\cdot P}{n_1} = \\frac{63025 \\times ${fmt(S.P, 2)}}{${fmt(S.n_1, 0)}} = \\mathbf{${fmt(S.M_t, 1)}\\text{ lb}\\cdot\\text{in}}`,
          val: S.M_t
        };
      }
      if (target === "P") {
        return {
          target: `Transmitted Power (P)${u !== "hp" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Horsepower from torque and rpm ($P = \\frac{M_t n_1}{63025}$):",
          eq: `P = \\frac{M_t \\cdot n_1}{63025} = \\frac{${fmt(S.M_t, 1)} \\times ${fmt(S.n_1, 0)}}{63025} = \\mathbf{${fmt(S.P, 2)}\\text{ hp}}`,
          val: S.P
        };
      }
      if (target === "n_1") {
        return {
          target: `Driver Speed ({{n_1|n}})${u !== "rpm" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Rotational speed from power and torque ($n_1 = \\frac{63025 P}{M_t}$):",
          eq: `n_1 = \\frac{63025 P}{M_t} = \\frac{63025(${fmt(S.P, 2)})}{${fmt(S.M_t, 1)}} = \\mathbf{${fmt(S.n_1, 0)}\\text{ rpm}}`,
          val: S.n_1
        };
      }
    }
  },
  {
    id: "eq_wt_torque",
    name: "Tangential Load from Torque",
    baseFormula: "W_t = \\frac{2 M_t}{D_{P1}}",
    nodes: ["W_t", "M_t", "D_P1"],
    topic: "forces_torque",
    termsCount: 3,
    forms: {
      W_t:  { formula: "W_t = \\frac{2 M_t}{D_{P1}}", notes: "Tangential tooth load from shaft torque and pitch diameter" },
      M_t:  { formula: "M_t = W_t \\cdot \\frac{D_{P1}}{2}", notes: "Shaft torque from tooth load and pitch radius" },
      D_P1: { formula: "D_{P1} = \\frac{2 M_t}{W_t}", notes: "Pitch diameter from torque and tangential load" }
    },
    solve: (target, S) => {
      const u = unitOf(S, target);
      if (target === "W_t") {
        return {
          target: `Tangential Load ({{W_t}})${u !== "lb" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Tangential force from shaft torque and pitch radius ($W_t = \\frac{2 M_t}{D_{P1}}$):",
          eq: `W_t = \\frac{2 M_t}{D_{P1}} = \\frac{2(${fmt(S.M_t, 1)})}{${fmt(S.D_P1, 3)}} = \\mathbf{${fmt(S.W_t, 0)}\\text{ lb}}`,
          val: S.W_t
        };
      }
      if (target === "M_t") {
        return {
          target: `Shaft Torque ({{M_t}})${u !== "lb-in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Shaft torque from tangential tooth load and pitch radius ($M_t = W_t \\frac{D_{P1}}{2}$):",
          eq: `M_t = W_t \\cdot \\frac{D_{P1}}{2} = ${fmt(S.W_t, 0)} \\times \\frac{${fmt(S.D_P1, 3)}}{2} = \\mathbf{${fmt(S.M_t, 1)}\\text{ lb}\\cdot\\text{in}}`,
          val: S.M_t
        };
      }
      if (target === "D_P1") {
        return {
          target: `Pinion Pitch Diameter ({{D_{P1}|D_P}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Pitch diameter from torque and tangential load ($D_{P1} = \\frac{2 M_t}{W_t}$):",
          eq: `D_{P1} = \\frac{2 M_t}{W_t} = \\frac{2(${fmt(S.M_t, 1)})}{${fmt(S.W_t, 0)}} = \\mathbf{${fmt(S.D_P1, 3)}\\text{ in}}`,
          val: S.D_P1
        };
      }
    }
  },
  {
    id: "eq_wt_power_vel",
    name: "Tangential Load from Power",
    baseFormula: "P = \\frac{W_t V_m}{33000}",
    nodes: ["W_t", "P", "V_m"],
    topic: "forces_torque",
    termsCount: 4,
    forms: {
      W_t: { formula: "W_t = \\frac{33000 \\cdot P}{V_m}", notes: "Tangential load from horsepower and pitch speed (ft/min)" },
      P:   { formula: "P = \\frac{W_t \\cdot V_m}{33000}", notes: "Transmitted horsepower from load and speed" },
      V_m: { formula: "V_m = \\frac{33000 \\cdot P}{W_t}", notes: "Pitch velocity from power and load" }
    },
    solve: (target, S) => {
      const u = unitOf(S, target);
      if (target === "W_t") {
        return {
          target: `Tangential Load ({{W_t}})${u !== "lb" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Tangential load from horsepower and pitch speed ($W_t = \\frac{33000 P}{V_m}$):",
          eq: `W_t = \\frac{33000 \\cdot P}{V_m} = \\frac{33000 \\times ${fmt(S.P, 2)}}{${fmt(S.V_m, 1)}} = \\mathbf{${fmt(S.W_t, 0)}\\text{ lb}}`,
          val: S.W_t
        };
      }
      if (target === "P") {
        return {
          target: `Power Transmitted (P)${u !== "hp" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Horsepower from tangential load and pitch velocity ($P = \\frac{W_t V_m}{33000}$):",
          eq: `P = \\frac{W_t \\cdot V_m}{33000} = \\frac{${fmt(S.W_t, 0)} \\times ${fmt(S.V_m, 1)}}{33000} = \\mathbf{${fmt(S.P, 2)}\\text{ hp}}`,
          val: S.P
        };
      }
      if (target === "V_m") {
        return {
          target: `Pitch Line Velocity ({{V_m}})${u !== "ft/min" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Pitch speed from transmitted power and load ($V_m = \\frac{33000 P}{W_t}$):",
          eq: `V_m = \\frac{33000 \\cdot P}{W_t} = \\frac{33000(${fmt(S.P, 2)})}{${fmt(S.W_t, 0)}} = \\mathbf{${fmt(S.V_m, 1)}\\text{ ft/min}}`,
          val: S.V_m
        };
      }
    }
  },
  {
    id: "eq_wr_wt",
    name: "Radial Force Relation",
    baseFormula: "W_r = W_t \\tan\\phi",
    nodes: ["W_r", "W_t", "phi"],
    topic: "forces_torque",
    termsCount: 3,
    forms: {
      W_r: { formula: "W_r = W_t \\tan\\phi", notes: "Separating radial force pushing shafts apart" },
      W_t: { formula: "W_t = \\frac{W_r}{\\tan\\phi}", notes: "Tangential drive force derived from radial reaction" },
      phi: { formula: "\\phi = \\tan^{-1}\\left(\\frac{W_r}{W_t}\\right)", notes: "Operating pressure angle from force vector components" }
    },
    solve: (target, S) => {
      const u = unitOf(S, target);
      if (target === "W_r") {
        return {
          target: `Radial Load ({{W_r}})${u !== "lb" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Separating force toward shaft center ($W_r = W_t \\tan\\phi$):",
          eq: `W_r = W_t \\tan\\phi = ${fmt(S.W_t, 0)} \\times \\tan(${fmt(S.phi, 1)}^\\circ) = \\mathbf{${fmt(S.W_r, 0)}\\text{ lb}}`,
          val: S.W_r
        };
      }
      if (target === "W_t") {
        return {
          target: `Tangential Load ({{W_t}})${u !== "lb" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Drive force derived from radial reaction ($W_t = \\frac{W_r}{\\tan\\phi}$):",
          eq: `W_t = \\frac{W_r}{\\tan\\phi} = \\frac{${fmt(S.W_r, 0)}}{\\tan(${fmt(S.phi, 1)}^\\circ)} = \\mathbf{${fmt(S.W_t, 0)}\\text{ lb}}`,
          val: S.W_t
        };
      }
      if (target === "phi") {
        return {
          target: "Pressure Angle (\\phi) in degrees",
          text: "Pressure angle from radial and tangential forces:",
          eq: `\\phi = \\tan^{-1}\\left(\\frac{W_r}{W_t}\\right) = \\tan^{-1}\\left(\\frac{${fmt(S.W_r, 0)}}{${fmt(S.W_t, 0)}}\\right) = \\mathbf{${fmt(S.phi, 1)}^\\circ}`,
          val: S.phi
        };
      }
    }
  },
  {
    id: "eq_w_normal",
    name: "Normal Contact Load Vector",
    baseFormula: "W = \\frac{W_t}{\\cos\\phi}",
    nodes: ["W", "W_t", "phi"],
    topic: "forces_torque",
    termsCount: 3,
    forms: {
      W:   { formula: "W = \\frac{W_t}{\\cos\\phi}", notes: "Total normal load acting along the pressure line" },
      W_t: { formula: "W_t = W \\cos\\phi", notes: "Drive force resolved from normal contact force" },
      phi: { formula: "\\phi = \\cos^{-1}\\left(\\frac{W_t}{W}\\right)", notes: "Pressure angle from normal force resolution" }
    },
    solve: (target, S) => {
      const u = unitOf(S, target);
      if (target === "W") {
        return {
          target: `Resultant Load ({{W}})${u !== "lb" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Total force transmitted along line of action ($W = \\frac{W_t}{\\cos\\phi}$):",
          eq: `W = \\frac{W_t}{\\cos\\phi} = \\frac{${fmt(S.W_t, 0)}}{\\cos(${fmt(S.phi, 1)}^\\circ)} = \\mathbf{${fmt(S.W, 0)}\\text{ lb}}`,
          val: S.W
        };
      }
      if (target === "W_t") {
        return {
          target: `Tangential Load ({{W_t}})${u !== "lb" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Tangential load resolved from resultant normal load ($W_t = W \\cos\\phi$):",
          eq: `W_t = W \\cos\\phi = ${fmt(S.W, 0)} \\times \\cos(${fmt(S.phi, 1)}^\\circ) = \\mathbf{${fmt(S.W_t, 0)}\\text{ lb}}`,
          val: S.W_t
        };
      }
      if (target === "phi") {
        return {
          target: "Pressure Angle (\\phi) in degrees",
          text: "Pressure angle from contact normal and drive force:",
          eq: `\\phi = \\cos^{-1}\\left(\\frac{W_t}{W}\\right) = \\cos^{-1}\\left(\\frac{${fmt(S.W_t, 0)}}{${fmt(S.W, 0)}}\\right) = \\mathbf{${fmt(S.phi, 1)}^\\circ}`,
          val: S.phi
        };
      }
    }
  },
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
      const u = unitOf(S, target);
      if (target === "a") {
        return {
          target: `Addendum ({{a}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Standard full-depth addendum proportion ($a = \\frac{1}{P_d}$):",
          eq: `a = \\frac{1}{P_d} = \\frac{1}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.a, 4)}\\text{ in}}`,
          val: S.a
        };
      }
      if (target === "P_d") {
        return {
          target: `Diametral Pitch ({{P_d}})${u !== "teeth/in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "From standard full-depth addendum ($P_d = \\frac{1}{a}$):",
          eq: `P_d = \\frac{1}{a} = \\frac{1}{${fmt(S.a, 4)}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ in}^{-1}}`,
          val: S.P_d
        };
      }
    }
  },
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
      const u = unitOf(S, target);
      if (target === "c") {
        return {
          target: `Tooth Clearance ({{c}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: `Standard clearance for ${fmt(S.phi, 1)}° full-depth teeth ($c = \\frac{${factor}}{P_d}$):`,
          eq: `c = \\frac{${factor}}{P_d} = \\frac{${factor}}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.c, 4)}\\text{ in}}`,
          val: S.c
        };
      }
      if (target === "P_d") {
        return {
          target: `Diametral Pitch ({{P_d}})${u !== "teeth/in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Pitch from clearance proportion ($P_d = \\frac{k_c}{c}$):",
          eq: `P_d = \\frac{${factor}}{c} = \\frac{${factor}}{${fmt(S.c, 4)}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ in}^{-1}}`,
          val: S.P_d
        };
      }
    }
  },
  {
    id: "eq_do",
    name: "Outside Blank Diameter",
    baseFormula: "D_o = D_{P1} + 2a",
    nodes: ["D_o", "D_P1", "a"],
    topic: "pitch_geometry",
    termsCount: 4,
    forms: {
      D_o:  { formula: "D_o = D_{P1} + 2a", notes: "Outside cylinder diameter adding twice the addendum" },
      D_P1: { formula: "D_{P1} = D_o - 2a", notes: "Pitch diameter from blank outside diameter" },
      a:    { formula: "a = \\frac{D_o - D_{P1}}{2}", notes: "Addendum from blank diameter" }
    },
    solve: (target, S) => {
      const u = unitOf(S, target);
      if (target === "D_o") {
        return {
          target: `Outside Diameter ({{D_o}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Blank outer diameter adding twice addendum ($D_o = D_{P1} + 2a$):",
          eq: `D_o = D_{P1} + 2a = ${fmt(S.D_P1, 3)} + 2(${fmt(S.a, 4)}) = \\mathbf{${fmt(S.D_o, 3)}\\text{ in}}`,
          val: S.D_o
        };
      }
      if (target === "D_P1") {
        return {
          target: `Pinion Pitch Diameter ({{D_{P1}|D_P}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Pitch diameter from blank diameter ($D_{P1} = D_o - 2a$):",
          eq: `D_{P1} = D_o - 2a = ${fmt(S.D_o, 3)} - 2(${fmt(S.a, 4)}) = \\mathbf{${fmt(S.D_P1, 3)}\\text{ in}}`,
          val: S.D_P1
        };
      }
      if (target === "a") {
        return {
          target: `Addendum ({{a}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Addendum from outer and pitch diameters ($a = \\frac{D_o - D_{P1}}{2}$):",
          eq: `a = \\frac{D_o - D_{P1}}{2} = \\frac{${fmt(S.D_o, 3)} - ${fmt(S.D_P1, 3)}}{2} = \\mathbf{${fmt(S.a, 4)}\\text{ in}}`,
          val: S.a
        };
      }
    }
  },
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
      const u = unitOf(S, target);
      if (target === "D_o") {
        return {
          target: `Outside Diameter ({{D_o}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Blank outer diameter from teeth count ($D_o = \\frac{T_1 + 2}{P_d}$):",
          eq: `D_o = \\frac{T_1 + 2}{P_d} = \\frac{${fmt(S.T_1, 0)} + 2}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.D_o, 3)}\\text{ in}}`,
          val: S.D_o
        };
      }
      if (target === "P_d") {
        return {
          target: `Diametral Pitch ({{P_d}})${u !== "teeth/in" ? ` in $${Units.tex(u)}$` : ""}`,
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
  {
    id: "eq_db",
    name: "Base Circle Diameter",
    baseFormula: "D_b = D_{P1} \\cos\\phi",
    nodes: ["D_b", "D_P1", "phi"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      D_b:  { formula: "D_b = D_{P1} \\cos\\phi", notes: "Base diameter generating the tooth involute" },
      D_P1: { formula: "D_{P1} = \\frac{D_b}{\\cos\\phi}", notes: "Pitch diameter from base diameter" }
    },
    solve: (target, S) => {
      const u = unitOf(S, target);
      if (target === "D_b") {
        return {
          target: `Base Circle Diameter ({{D_b}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Base circle diameter generating the tooth involute ($D_b = D_{P1} \\cos\\phi$):",
          eq: `D_b = D_{P1} \\cos\\phi = ${fmt(S.D_P1, 3)} \\times \\cos(${fmt(S.phi, 1)}^\\circ) = \\mathbf{${fmt(S.D_b, 3)}\\text{ in}}`,
          val: S.D_b
        };
      }
      if (target === "D_P1") {
        return {
          target: `Pinion Pitch Diameter ({{D_{P1}|D_P}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Pitch diameter from base circle diameter ($D_{P1} = \\frac{D_b}{\\cos\\phi}$):",
          eq: `D_{P1} = \\frac{D_b}{\\cos\\phi} = \\frac{${fmt(S.D_b, 3)}}{\\cos(${fmt(S.phi, 1)}^\\circ)} = \\mathbf{${fmt(S.D_P1, 3)}\\text{ in}}`,
          val: S.D_P1
        };
      }
    }
  },
  {
    id: "eq_lewis",
    name: "Lewis Beam Bending Strength",
    baseFormula: "s = \\frac{W_t \\cdot P_d}{b \\cdot Y}",
    nodes: ["s", "W_t", "P_d", "b", "Y"],
    topic: "lewis_strength",
    termsCount: 5,
    forms: {
      s:   { formula: "s = \\frac{W_t \\cdot P_d}{b \\cdot Y}", notes: "Induced tensile bending stress at tooth root" },
      W_t: { formula: "W_t = \\frac{s \\cdot b \\cdot Y}{P_d}", notes: "Permissible transmitted load from allowable stress" },
      P_d: { formula: "P_d = \\frac{s \\cdot b \\cdot Y}{W_t}", notes: "Required diametral pitch to resist tooth breakage" },
      b:   { formula: "b = \\frac{W_t \\cdot P_d}{s \\cdot Y}", notes: "Minimum required face width" }
    },
    solve: (target, S) => {
      const u = unitOf(S, target);
      if (target === "s") {
        return {
          target: `Induced Bending Stress ({{s}})${u !== "psi" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Applying the Lewis beam bending stress formula ($s = \\frac{W_t P_d}{b Y}$):",
          eq: `s = \\frac{W_t \\cdot P_d}{b \\cdot Y} = \\frac{${fmt(S.W_t, 0)} \\times ${fmt(S.P_d, 2)}}{${fmt(S.b, 2)} \\times ${fmt(S.Y, 3)}} = \\mathbf{${fmt(S.s, 0)}\\text{ psi}}`,
          val: S.s
        };
      }
      if (target === "W_t") {
        return {
          target: `Permissible Tangential Load ({{W_t}})${u !== "lb" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Tangential load capacity from allowable stress limit ($W_t = \\frac{s b Y}{P_d}$):",
          eq: `W_t = \\frac{s \\cdot b \\cdot Y}{P_d} = \\frac{${fmt(S.s, 0)} \\times ${fmt(S.b, 2)} \\times ${fmt(S.Y, 3)}}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.W_t, 0)}\\text{ lb}}`,
          val: S.W_t
        };
      }
      if (target === "b") {
        return {
          target: `Required Face Width ({{b}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Minimum face width to sustain induced bending stress ($b = \\frac{W_t P_d}{s Y}$):",
          eq: `b = \\frac{W_t \\cdot P_d}{s \\cdot Y} = \\frac{${fmt(S.W_t, 0)} \\times ${fmt(S.P_d, 2)}}{${fmt(S.s, 0)} \\times ${fmt(S.Y, 3)}} = \\mathbf{${fmt(S.b, 2)}\\text{ in}}`,
          val: S.b
        };
      }
      if (target === "P_d") {
        return {
          target: `Diametral Pitch ({{P_d}})${u !== "teeth/in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Diametral pitch from Lewis stress balance ($P_d = \\frac{s b Y}{W_t}$):",
          eq: `P_d = \\frac{s \\cdot b \\cdot Y}{W_t} = \\frac{${fmt(S.s, 0)} \\times ${fmt(S.b, 2)} \\times ${fmt(S.Y, 3)}}{${fmt(S.W_t, 0)}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ in}^{-1}}`,
          val: S.P_d
        };
      }
    }
  },
  {
    id: "eq_thick",
    name: "Circular Tooth Thickness",
    baseFormula: "t = \\frac{P_c}{2}",
    nodes: ["t", "P_c"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      t:   { formula: "t = \\frac{P_c}{2}", notes: "Tooth thickness along standard pitch circle" },
      P_c: { formula: "P_c = 2t", notes: "Circular pitch from measured tooth thickness" }
    },
    solve: (target, S) => {
      const u = unitOf(S, target);
      if (target === "t") {
        return {
          target: `Tooth Thickness ({{t}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Tooth thickness on pitch circle is half circular pitch ($t = \\frac{P_c}{2}$):",
          eq: `t = \\frac{P_c}{2} = \\frac{${fmt(S.P_c, 4)}}{2} = \\mathbf{${fmt(S.t, 4)}\\text{ in}}`,
          val: S.t
        };
      }
      if (target === "P_c") {
        return {
          target: `Circular Pitch ({{P_c}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Circular pitch from tooth thickness ($P_c = 2t$):",
          eq: `P_c = 2t = 2(${fmt(S.t, 4)}) = \\mathbf{${fmt(S.P_c, 4)}\\text{ in}}`,
          val: S.P_c
        };
      }
    }
  },
  {
    id: "eq_whole",
    name: "Whole Depth",
    baseFormula: "h = 2a + c",
    nodes: ["h", "a", "c"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      h: { formula: "h = 2a + c", notes: "Total tooth depth including addendum and clearance" },
      c: { formula: "c = h - 2a", notes: "Clearance from whole depth" },
      a: { formula: "a = \\frac{h - c}{2}", notes: "Addendum from whole depth" }
    },
    solve: (target, S) => {
      const u = unitOf(S, target);
      if (target === "h") {
        return {
          target: `Whole Depth ({{h}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
          text: "Total tooth depth adding twice addendum plus clearance ($h = 2a + c$):",
          eq: `h = 2a + c = 2(${fmt(S.a, 4)}) + ${fmt(S.c, 4)} = \\mathbf{${fmt(S.h, 4)}\\text{ in}}`,
          val: S.h
        };
      }
      if (target === "c") {
        return {
          target: `Tooth Clearance ({{c}})${u !== "in" ? ` in $${Units.tex(u)}$` : ""}`,
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
    "n_2": ["n_2", "n"]
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

    // Card 1 for this equation: Base Formula
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

    // Card 2+: Isolated Forms
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
  const d = parseFloat((a + c).toFixed(4));
  const D_o = parseFloat((D_P1 + 2 * a).toFixed(3));
  const D_b = parseFloat((D_P1 * Math.cos((phi * Math.PI) / 180)).toFixed(3));
  const t = parseFloat((P_c / 2).toFixed(4));
  const h = parseFloat((2 * a + c).toFixed(4));

  const V_m = Math.round((Math.PI * D_P1 * n_1) / 12);
  const W_t_seed = [120, 150, 180, 200, 250, 300, 350, 400, 500, 600, 750, 900][Math.floor(Math.random() * 12)];

  const raw_s = (W_t_seed * P_d) / (b * Y);
  const s = Math.round(raw_s / 25) * 25;
  const W_t_exact = parseFloat(((s * b * Y) / P_d).toFixed(1));

  const M_t = parseFloat(((W_t_exact * D_P1) / 2).toFixed(1));
  const P = parseFloat(((W_t_exact * V_m) / 33000).toFixed(2));
  const W_r = parseFloat((W_t_exact * Math.tan((phi * Math.PI) / 180)).toFixed(1));
  const W = parseFloat((W_t_exact / Math.cos((phi * Math.PI) / 180)).toFixed(1));

  return {
    P_d, phi, T_1, T_2, VR, n_1, n_2, P, P_c, D_P1, D_P2, C,
    V_m, M_t, W_t: W_t_exact, W_r, W, a, d, c, D_o, D_b, Y, b, s, t, h
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

  // Rule: Only leapfrog if at least one parent step was FADED / BYPASSED!
  // If the parent was solved in a visible step, the user simply plugs it in.
  const hasBypassedAncestor = step.parentIndices.some(pIdx => {
    const parentStep = allSteps[pIdx];
    return parentStep && parentStep.isFaded;
  });

  if (!hasBypassedAncestor) return null;

  const t = step.targetVar;
  const knownGivens = new Set(Object.keys(S));

  // Bridge Meeting: Power & Motion meeting Radial Reaction Force at W_t
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

  // Blank Diameter from Teeth and Pitch
  if (t === "D_o" && step.eqId === "eq_do") {
    const derivationBlock = `\\begin{aligned}
D_o &= D_{P1} + 2a \\\\
D_o &= \\frac{T_1}{P_d} + 2\\left(\\frac{1}{P_d}\\right) = \\frac{T_1 + 2}{P_d}
\\end{aligned}`;
    const finalBlock = `D_o = \\frac{${fmt(S.T_1, 0)} + 2}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(step.expectedVal, 3)}\\text{ in}}`;
    return { type: "aligned_dual", derivationBlock, finalBlock };
  }

  // Pitch Line Velocity from Teeth and Pitch
  if (t === "V_m" && step.eqId === "eq_pitch_vel") {
    const derivationBlock = `\\begin{aligned}
V_m &= \\frac{\\pi D_{P1} n_1}{12} \\\\
V_m &= \\frac{\\pi \\left(\\dfrac{T_1}{P_d}\\right) n_1}{12} = \\frac{\\pi T_1 n_1}{12 P_d}
\\end{aligned}`;
    const finalBlock = `V_m = \\frac{\\pi(${fmt(S.T_1, 0)})(${fmt(S.n_1, 0)})}{12(${fmt(S.P_d, 2)})} = \\mathbf{${fmt(step.expectedVal, 1)}\\text{ ft/min}}`;
    return { type: "aligned_dual", derivationBlock, finalBlock };
  }

  // Pinion Pitch Diameter from Center Distance and Ratio
  if (t === "D_P1" && step.eqId === "eq_dp1") {
    const derivationBlock = `\\begin{aligned}
D_{P1} &= \\frac{T_1}{P_d} \\\\
D_{P1} &= \\frac{\\left(\\dfrac{2 C P_d}{1 + VR}\\right)}{P_d} = \\frac{2C}{1 + VR}
\\end{aligned}`;
    const finalBlock = `D_{P1} = \\frac{2(${fmt(S.C, 3)})}{1 + ${fmt(S.VR, 2)}} = \\mathbf{${fmt(step.expectedVal, 3)}\\text{ in}}`;
    return { type: "aligned_dual", derivationBlock, finalBlock };
  }

  // Pinion Teeth from Blank Outer Diameter
  if (t === "T_1" && step.eqId === "eq_dp1") {
    const derivationBlock = `\\begin{aligned}
T_1 &= D_{P1} \\cdot P_d \\\\
T_1 &= (D_o - 2a)P_d = D_o P_d - 2
\\end{aligned}`;
    const finalBlock = `T_1 = (${fmt(S.D_o, 3)} \\times ${fmt(S.P_d, 2)}) - 2 = \\mathbf{${fmt(step.expectedVal, 0)}\\text{ teeth}}`;
    return { type: "aligned_dual", derivationBlock, finalBlock };
  }

  return null;
}

// ========================================================
// 6. SEED LIBRARY & CANDIDATE GENERATOR
// ========================================================
const ORGANIC_SEED_PATTERNS = [
  { name: "Motor Power to Shaft Torque & Load", givens: ["P", "n_1", "D_P1", "phi"], topic: "forces_torque", goals: ["M_t", "W_r", "W", "D_b"] },
  { name: "Shaft Torque and RPM to Motor Power", givens: ["M_t", "n_1", "D_P1"], topic: "forces_torque", goals: ["P", "W_t", "V_m"] },
  { name: "Reverse Dynamics: Contact Load to Power", givens: ["W", "phi", "V_m", "n_1"], topic: "forces_torque", goals: ["P", "W_r", "M_t", "D_b"] },
  { name: "Radial Reaction to Pinion Torque", givens: ["W_r", "phi", "D_P1", "n_1"], topic: "forces_torque", goals: ["M_t", "P", "W", "D_b"] },
  { name: "Shaft Torque to Vector Loadings", givens: ["M_t", "D_P1", "phi"], topic: "forces_torque", goals: ["W_r", "W", "D_b"] },
  { name: "Lewis Limit to Gear Blank", givens: ["s", "b", "Y", "W_t", "T_1"], topic: "lewis_strength", goals: ["P_d", "D_P1", "D_o", "M_t"] },
  { name: "Lewis Stress to Center Distance", givens: ["s", "b", "Y", "W_t", "VR", "T_1"], topic: "lewis_strength", goals: ["C", "D_o", "D_P2", "M_t"] },
  { name: "Power and Pitch Speed to Root Stress", givens: ["P", "V_m", "b", "Y", "P_d"], topic: "lewis_strength", goals: ["s", "W_t"] },
  { name: "Blank Outer Diameter to Pinion Geometry", givens: ["D_o", "c", "phi", "P_c"], topic: "pitch_geometry", goals: ["T_1", "D_P1", "D_b"] },
  { name: "Tooth Spacing & Blank to Base Circle", givens: ["P_c", "D_o", "phi"], topic: "pitch_geometry", goals: ["D_b", "T_1", "c"] },
  { name: "Center Distance to Pitch Line Speed", givens: ["C", "VR", "P_d", "n_1"], topic: "speed_center", goals: ["V_m", "D_P1", "T_2", "n_2"] },
  { name: "Operating Center Distance to Gear Diameters", givens: ["C", "D_P1", "VR", "P_d"], topic: "speed_center", goals: ["D_P2", "T_2", "D_o"] }
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