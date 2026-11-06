// ========================================================
// spur_gears.js — Spur Gear Topic Definition & First-Principles Physics
// ========================================================

// ========================================================
// 1. VARIABLE DATABASE & METADATA
// ========================================================
const GEAR_VARS_DB = {
  "D_P": {
    name: "Pitch Diameter",
    symbol: "D",
    aliases: ["Pitch Diameter", "Pitch Circle Diameter"],
    unit: "in", baseVar: "D_P"
  },
  "D_P1": {
    name: "Pinion Pitch Diameter",
    symbol: "D_1",
    aliases: ["Pinion Pitch Diameter", "Driver Pitch Diameter", "Pinion Diameter"],
    unit: "in", baseVar: "D_P"
  },
  "D_P2": {
    name: "Gear Pitch Diameter",
    symbol: "D_2",
    aliases: ["Gear Pitch Diameter", "Driven Pitch Diameter", "Wheel Pitch Diameter"],
    unit: "in", baseVar: "D_P"
  },
  "P_d": {
    name: "Diametral Pitch",
    symbol: "P_d",
    aliases: ["Diametral Pitch", "DP"],
    unit: "teeth/in", baseVar: "P_d"
  },
  "P_c": {
    name: "Circular Pitch",
    symbol: "P_c",
    aliases: ["Circular Pitch", "Tooth Spacing on Pitch Circle"],
    unit: "in", baseVar: "P_c"
  },
  "C": {
    name: "Center Distance",
    symbol: "C",
    aliases: ["Center Distance", "Shaft Center Distance", "Operating Center Distance"],
    unit: "in", baseVar: "C"
  },
  "W_t": {
    name: "Transmitted Load",
    symbol: "F_t",
    aliases: ["Transmitted Load", "Tangential Load", "Driving Force", "Useful Tooth Force", "Tangential Force"],
    unit: "lb", baseVar: "W_t"
  },
  "W_r": {
    name: "Radial Load",
    symbol: "F_r",
    aliases: ["Radial Load", "Separating Force", "Radial Force", "Radial Thrust Force"],
    unit: "lb", baseVar: "W_r"
  },
  "W": {
    name: "Normal Contact Force",
    symbol: "F_n",
    aliases: ["Normal Contact Force", "Tooth Pressure", "Total Tooth Load", "Resultant Contact Force", "Normal Force"],
    unit: "lb", baseVar: "W"
  },
  "M_t": {
    name: "Shaft Torque",
    symbol: "T",
    aliases: ["Shaft Torque", "Twisting Moment", "Pinion Torque", "Torque", "Torsional Moment"],
    unit: "lb-in", baseVar: "M_t"
  },
  "V_m": {
    name: "Pitch Line Velocity",
    symbol: "v",
    aliases: ["Pitch Line Velocity", "Pitch Line Speed", "Peripheral Speed", "Linear Pitch Velocity"],
    unit: "ft/min", baseVar: "V_m"
  },
  "a": {
    name: "Addendum",
    symbol: "a",
    aliases: ["Addendum", "Radial Height Above Pitch Circle"],
    unit: "in", baseVar: "a"
  },
  "d": {
    name: "Dedendum",
    symbol: "d",
    aliases: ["Dedendum", "Root Depth Below Pitch Circle"],
    unit: "in", baseVar: "d"
  },
  "c": {
    name: "Tooth Clearance",
    symbol: "c",
    aliases: ["Tooth Clearance", "Radial Clearance", "Clearance"],
    unit: "in", baseVar: "c"
  },
  "D_o": {
    name: "Outside Blank Diameter",
    symbol: "D_o",
    aliases: ["Outside Blank Diameter", "Outside Diameter", "Blank Diameter", "Tip Diameter"],
    unit: "in", baseVar: "D_o"
  },
  "D_b": {
    name: "Base Circle Diameter",
    symbol: "D_b",
    aliases: ["Base Circle Diameter", "Base Diameter"],
    unit: "in", baseVar: "D_b"
  },
  "s": {
    name: "Bending Stress",
    symbol: "s",
    aliases: ["Bending Stress", "Lewis Bending Stress", "Induced Root Stress", "Tooth Bending Stress"],
    unit: "psi", baseVar: "s"
  },
  "b": {
    name: "Face Width",
    symbol: "b",
    aliases: ["Face Width", "Tooth Width"],
    unit: "in", baseVar: "b"
  },
  "T": {
    name: "Tooth Count",
    symbol: "T",
    aliases: ["Tooth Count", "Number of Teeth"],
    unit: "teeth", baseVar: "T", isInteger: true
  },
  "T_1": {
    name: "Pinion Teeth",
    symbol: "T_1",
    aliases: ["Pinion Teeth", "Number of Pinion Teeth", "Driver Teeth"],
    unit: "teeth", baseVar: "T", isInteger: true
  },
  "T_2": {
    name: "Gear Teeth",
    symbol: "T_2",
    aliases: ["Gear Teeth", "Number of Gear Teeth", "Driven Teeth"],
    unit: "teeth", baseVar: "T", isInteger: true
  },
  "n": {
    name: "Rotational Speed",
    symbol: "n",
    aliases: ["Rotational Speed", "Speed", "RPM"],
    unit: "rpm", baseVar: "n"
  },
  "n_1": {
    name: "Driver Speed",
    symbol: "n_1",
    aliases: ["Driver Speed", "Pinion Speed", "Input Speed"],
    unit: "rpm", baseVar: "n"
  },
  "n_2": {
    name: "Driven Speed",
    symbol: "n_2",
    aliases: ["Driven Speed", "Gear Speed", "Output Speed"],
    unit: "rpm", baseVar: "n"
  },
  "VR": {
    name: "Speed Ratio",
    symbol: "SR",
    aliases: ["Speed Ratio", "Velocity Ratio", "Speed Reduction Ratio", "Gear Ratio"],
    unit: "ratio", baseVar: "VR"
  },
  "P": {
    name: "Transmitted Power",
    symbol: "P",
    aliases: ["Transmitted Power", "Power Transmitted", "Motor Power", "Delivered Power"],
    unit: "hp", baseVar: "P"
  },
  "phi": {
    name: "Pressure Angle",
    symbol: "\\phi",
    aliases: ["Pressure Angle", "Angle of Obliquity"],
    unit: "deg", baseVar: "phi"
  },
  "Y": {
    name: "Lewis Form Factor",
    symbol: "Y",
    aliases: ["Lewis Form Factor", "Tooth Form Factor"],
    unit: "dimless", baseVar: "Y"
  },
  "t": {
    name: "Tooth Thickness",
    symbol: "t",
    aliases: ["Tooth Thickness", "Circular Tooth Thickness", "Arc Tooth Thickness"],
    unit: "in", baseVar: "t"
  },
  "h": {
    name: "Whole Depth",
    symbol: "h",
    aliases: ["Whole Depth", "Total Tooth Depth"],
    unit: "in", baseVar: "h"
  },
  "F_D": {
    name: "Dynamic Tooth Load",
    symbol: "F_D",
    aliases: ["Dynamic Tooth Load", "Maximum Dynamic Load", "Buckingham Dynamic Load"],
    unit: "lb", baseVar: "F_D"
  },
  "C_d": {
    name: "Dynamic Deformation Factor",
    symbol: "C_d",
    aliases: ["Dynamic Deformation Factor", "Deformation Factor", "Dynamic Factor C"],
    unit: "lb/in", baseVar: "C_d"
  },
  "h_k": {
    name: "Working Depth",
    symbol: "h_k",
    aliases: ["Working Depth", "Operating Tooth Depth"],
    unit: "in", baseVar: "h_k"
  },
  "B": {
    name: "Tooth Backlash",
    symbol: "B",
    aliases: ["Tooth Backlash", "Backlash"],
    unit: "in", baseVar: "B"
  },
  "p_b": {
    name: "Base Pitch",
    symbol: "p_b",
    aliases: ["Base Pitch", "Normal Base Pitch"],
    unit: "in", baseVar: "p_b"
  },
  "m": {
    name: "Metric Module",
    symbol: "m",
    aliases: ["Metric Module", "Module"],
    unit: "mm", baseVar: "m"
  },
  "C_i": {
    name: "Center Distance to Idler",
    symbol: "C_i",
    aliases: ["Center Distance to Idler", "Idler Center Distance"],
    unit: "in", baseVar: "C_i"
  }
};

// ========================================================
// 2. KNOWLEDGE GRAPH WITH FIRST-PRINCIPLES FORMULAS
// ========================================================
const GEAR_RELATION_GRAPH = [
  // 1. Buckingham Dynamic Load
  {
    id: "eq_buckingham",
    name: "Buckingham Dynamic Load",
    canonical: { lhs: "F_D", rhs: "F_t + (k*v*(b*C_d + F_t))/(k*v + sqrt(b*C_d + F_t))", tex: "F_D = F_t + \\cfrac{k v (b C_d + F_t)}{k v + \\sqrt{b C_d + F_t}}" },
    baseFormula: "F_D = F_t + \\cfrac{k v (b C_d + F_t)}{k v + \\sqrt{b C_d + F_t}}",
    nodes: ["F_D", "W_t", "V_m", "b", "C_d"],
    topic: "forces_torque",
    termsCount: 5,
    forms: {
      F_D: { formula: "F_D = F_t + \\cfrac{k v (b C_d + F_t)}{k v + \\sqrt{b C_d + F_t}}", notes: "Maximum dynamic load (k = 0.05 English, k = 21 SI)" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "F_D");
      const isSI = S.sys === "SI" || unitOf(S, "V_m") === "m/s";
      const k = isSI ? 21 : 0.05;
      const bc = S.b * S.C_d + S.W_t;
      const num = k * S.V_m * bc;
      const den = k * S.V_m + Math.sqrt(bc);
      const val = S.W_t + num / den;

      if (target === "F_D") {
        return {
          target: targetLabel(getVarName(S, "F_D"), "{{F_D}}", u),
          text: `Applying Buckingham dynamic load equation ($k = ${k}$):`,
          eq: `F_D = F_t + \\cfrac{${k} v (b C_d + F_t)}{${k} v + \\sqrt{b C_d + F_t}} = ${fmt(S.W_t, 0)} + \\cfrac{${k}(${fmt(S.V_m, 1)})[(${fmt(S.b, 2)})(${fmt(S.C_d, 0)}) + ${fmt(S.W_t, 0)}]}{${k}(${fmt(S.V_m, 1)}) + \\sqrt{(${fmt(S.b, 2)})(${fmt(S.C_d, 0)}) + ${fmt(S.W_t, 0)}}} = \\mathbf{${fmt(val, 1)}\\text{ ${u}}}`,
          val: parseFloat(val.toFixed(1))
        };
      }
    }
  },

  // 2. Working Depth
  {
    id: "eq_working_depth",
    name: "Working Depth",
    canonical: { lhs: "h_k", rhs: "2*a", tex: "h_k = 2a" },
    baseFormula: "h_k = 2a",
    nodes: ["h_k", "a"],
    topic: "pitch_geometry",
    termsCount: 2,
    forms: {
      h_k: { formula: "h_k = 2a", notes: "Working depth is twice the addendum" },
      a:   { formula: "a = \\cfrac{h_k}{2}", notes: "Addendum is half the working depth" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "h_k");
      if (target === "h_k") {
        return {
          target: targetLabel(getVarName(S, "h_k"), "{{h_k}}", u),
          text: `Working depth is twice the addendum ($h_k = 2a$):`,
          eq: `h_k = 2a = 2(${fmt(S.a, 3)}) = \\mathbf{${fmt(S.h_k, 3)}\\text{ ${u}}}`,
          val: S.h_k
        };
      }
      if (target === "a") {
        return {
          target: targetLabel(getVarName(S, "a"), "{{a}}", u),
          text: `Addendum is half the working depth ($a = \\cfrac{h_k}{2}$):`,
          eq: `a = \\cfrac{h_k}{2} = \\cfrac{${fmt(S.h_k, 3)}}{2} = \\mathbf{${fmt(S.a, 3)}\\text{ ${u}}}`,
          val: S.a
        };
      }
    }
  },

  // 3. Dedendum Proportion
  {
    id: "eq_dedendum",
    name: "Dedendum Proportion",
    canonical: { lhs: "d", rhs: "(1 + k_c)/P_d", tex: "d = \\cfrac{1 + k_c}{P_d}" },
    baseFormula: "d = \\cfrac{1 + k_c}{P_d}",
    nodes: ["d", "P_d", "phi"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      d: { formula: "d = (1 + k_c) m \\quad\\text{or}\\quad \\cfrac{1 + k_c}{P_d}", notes: "Standard dedendum including clearance" }
    },
    solve: (target, S) => {
      const factor = S.phi === 14.5 ? 1.157 : 1.25;
      const u = unitOf(S, "d");
      const isSI = S.sys === "SI" || u === "mm";
      if (target === "d") {
        return {
          target: targetLabel(getVarName(S, "d"), "{{d}}", u),
          text: `Standard dedendum for ${fmt(S.phi, 1)}° teeth:`,
          eq: isSI
            ? `d = ${factor} m = ${factor}(${fmt(S.m, 2)}) = \\mathbf{${fmt(S.d, 3)}\\text{ mm}}`
            : `d = \\cfrac{${factor}}{P_d} = \\cfrac{${factor}}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.d, 4)}\\text{ in}}`,
          val: S.d
        };
      }
    }
  },

  // 4. Backlash
  {
    id: "eq_backlash",
    name: "Tooth Backlash",
    canonical: { lhs: "B", rhs: "0.035 / P_d", tex: "B = \\cfrac{0.035}{P_d}" },
    baseFormula: "B = \\cfrac{0.035}{P_d}",
    nodes: ["B", "P_d"],
    topic: "pitch_geometry",
    termsCount: 2,
    forms: {
      B: { formula: "B = 0.035 m \\quad\\text{or}\\quad \\cfrac{0.035}{P_d}", notes: "Average backlash on pitch circle" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "B");
      const isSI = S.sys === "SI" || u === "mm";
      if (target === "B") {
        return {
          target: targetLabel(getVarName(S, "B"), "{{B}}", u),
          text: "Standard average backlash on pitch circle:",
          eq: isSI
            ? `B = 0.035 m = 0.035(${fmt(S.m, 2)}) = \\mathbf{${fmt(S.B, 3)}\\text{ mm}}`
            : `B = \\cfrac{0.035}{P_d} = \\cfrac{0.035}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.B, 4)}\\text{ in}}`,
          val: S.B
        };
      }
    }
  },

  // 5. Base Pitch
  {
    id: "eq_base_pitch",
    name: "Base Pitch",
    canonical: { lhs: "p_b", rhs: "P_c * cos(phi)", tex: "p_b = P_c \\cos\\phi" },
    baseFormula: "p_b = P_c \\cos\\phi",
    nodes: ["p_b", "P_c", "phi"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      p_b: { formula: "p_b = P_c \\cos\\phi", notes: "Circular spacing of teeth on base cylinder" },
      P_c: { formula: "P_c = \\cfrac{p_b}{\\cos\\phi}", notes: "Circular pitch from base pitch" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "p_b");
      if (target === "p_b") {
        return {
          target: targetLabel(getVarName(S, "p_b"), "{{p_b}}", u),
          text: `Base pitch along base circle ($p_b = P_c \\cos\\phi$):`,
          eq: `p_b = P_c \\cos(${fmt(S.phi, 1)}°) = ${fmt(S.P_c, 3)} \\times \\cos(${fmt(S.phi, 1)}°) = \\mathbf{${fmt(S.p_b, 3)}\\text{ ${u}}}`,
          val: S.p_b
        };
      }
      if (target === "P_c") {
        return {
          target: targetLabel(getVarName(S, "P_c"), "{{P_c}}", u),
          text: `Circular pitch from base pitch ($P_c = \\cfrac{p_b}{\\cos\\phi}$):`,
          eq: `P_c = \\cfrac{p_b}{\\cos(${fmt(S.phi, 1)}°)} = \\cfrac{${fmt(S.p_b, 3)}}{\\cos(${fmt(S.phi, 1)}°)} = \\mathbf{${fmt(S.P_c, 3)}\\text{ ${u}}}`,
          val: S.P_c
        };
      }
    }
  },

  // 6. Metric Module & Diametral Pitch Conversion
  {
    id: "eq_module",
    name: "Module & Pitch Dimensional Identity",
    canonical: { lhs: "m", rhs: "25.4 / P_d", tex: "m \\cdot P_d = 25.4" },
    baseFormula: "m \\cdot P_d = 25.4",
    nodes: ["m", "P_d"],
    topic: "pitch_geometry",
    termsCount: 2,
    forms: {
      m:   { formula: "m = \\cfrac{25.4}{P_d}", notes: "Module in mm from diametral pitch" },
      P_d: { formula: "P_d = \\cfrac{25.4}{m}", notes: "Diametral pitch from module" }
    },
    solve: (target, S) => {
      if (target === "m") {
        return {
          target: targetLabel(getVarName(S, "m"), "{{m}}", "mm"),
          text: "Metric module from diametral pitch through dimensional inch-to-mm conversion:",
          eq: `m = \\cfrac{1}{P_d} = \\cfrac{1}{${fmt(S.P_d, 2)}\\cfrac{\\text{teeth}}{\\cancel{\\text{in}}}} \\cdot \\cfrac{25.4\\text{ mm}}{1\\cancel{\\text{ in}}} = \\mathbf{${fmt(S.m, 2)}\\text{ mm}}`,
          val: S.m
        };
      }
      if (target === "P_d") {
        return {
          target: targetLabel(getVarName(S, "P_d"), "{{P_d}}", "teeth/in"),
          text: "Diametral pitch from module through dimensional mm-to-inch conversion:",
          eq: `P_d = \\cfrac{1}{m} = \\cfrac{1}{${fmt(S.m, 2)}\\cancel{\\text{ mm}}} \\cdot \\cfrac{25.4\\cancel{\\text{ mm}}}{1\\text{ in}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ teeth/in}}`,
          val: S.P_d
        };
      }
    }
  },

  // 7. Internal Gearing with Idler
  {
    id: "eq_internal_idler",
    name: "Internal Gear with Idler",
    canonical: { lhs: "D_2", rhs: "4*C_i - D_1", tex: "D_2 = 4 C_i - D_1" },
    baseFormula: "D_2 = 4 C_i - D_1",
    nodes: ["D_P2", "D_P1", "C_i"],
    topic: "speed_center",
    termsCount: 3,
    forms: {
      D_P2: { formula: "D_2 = 2(R_1 + 2 R_i) = 4 C_i - D_1", notes: "Inside pitch diameter of driven internal gear" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "D_P1");
      if (target === "D_P2") {
        const R1 = S.D_P1 / 2;
        const Ri = S.C_i - R1;
        const D2 = 2 * (R1 + 2 * Ri);
        return {
          target: targetLabel(getVarName(S, "D_P2"), "{{D_2|D_P2}}", u),
          text: `Idler radius $R_i = C_i - R_1 = ${fmt(S.C_i, 1)} - ${fmt(R1, 1)} = ${fmt(Ri, 1)}\\text{ ${u}}$. Inside diameter ($D_2 = 4 C_i - D_1$):`,
          eq: `D_2 = 4(${fmt(S.C_i, 1)}) - ${fmt(S.D_P1, 1)} = \\mathbf{${fmt(D2, 1)}\\text{ ${u}}}`,
          val: D2
        };
      }
    }
  },

  // 8. Resultant Normal Tooth Load
  {
    id: "eq_resultant_vector",
    name: "Vector Resultant Tooth Force",
    canonical: { lhs: "F_n", rhs: "sqrt(F_t^2 + F_r^2)", tex: "F_n = \\sqrt{F_t^2 + F_r^2}" },
    baseFormula: "F_n = \\sqrt{F_t^2 + F_r^2}",
    nodes: ["W", "W_t", "W_r"],
    topic: "forces_torque",
    termsCount: 3,
    forms: {
      W: { formula: "F_n = \\sqrt{F_t^2 + F_r^2}", notes: "Resultant normal force from orthogonal components" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "W");
      if (target === "W") {
        const val = Math.sqrt(S.W_t * S.W_t + S.W_r * S.W_r);
        return {
          target: targetLabel(getVarName(S, "W"), "{{F_n|W}}", u),
          text: "Total normal contact force from orthogonal force vectors ($F_n = \\sqrt{F_t^2 + F_r^2}$):",
          eq: `F_n = \\sqrt{F_t^2 + F_r^2} = \\sqrt{(${fmt(S.W_t, 0)})^2 + (${fmt(S.W_r, 0)})^2} = \\mathbf{${fmt(val, 0)}\\text{ ${u}}}`,
          val: parseFloat(val.toFixed(1))
        };
      }
    }
  },

  // 9. Speed Ratio from Diameters
  {
    id: "eq_vr_diameters",
    name: "Speed Ratio from Pitch Diameters",
    canonical: { lhs: "SR", rhs: "D_2 / D_1", tex: "SR = \\cfrac{D_2}{D_1}" },
    baseFormula: "SR = \\cfrac{D_2}{D_1}",
    nodes: ["VR", "D_P1", "D_P2"],
    topic: "speed_center",
    termsCount: 3,
    forms: {
      VR:   { formula: "SR = \\cfrac{D_2}{D_1}", notes: "Speed ratio of pitch diameters" },
      D_P2: { formula: "D_2 = D_1 \\cdot SR", notes: "Driven gear diameter from speed ratio" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "D_P1");
      if (target === "VR") {
        return {
          target: targetLabel(getVarName(S, "VR"), "{{SR|VR}}", "ratio"),
          text: "Ratio of driven to driver pitch diameter ($SR = \\cfrac{D_2}{D_1}$):",
          eq: `SR = \\cfrac{D_2}{D_1} = \\cfrac{${fmt(S.D_P2, 2)}}{${fmt(S.D_P1, 2)}} = \\mathbf{${fmt(S.VR, 2)}}`,
          val: S.VR
        };
      }
      if (target === "D_P2") {
        return {
          target: targetLabel(getVarName(S, "D_P2"), "{{D_2|D_P2}}", u),
          text: "Driven gear pitch diameter ($D_2 = D_1 \\cdot SR$):",
          eq: `D_2 = D_1 \\cdot SR = ${fmt(S.D_P1, 2)} \\times ${fmt(S.VR, 2)} = \\mathbf{${fmt(S.D_P2, 2)}\\text{ ${u}}}`,
          val: S.D_P2
        };
      }
    }
  },

  // 10. Direct Speed-Teeth Ratio
  {
    id: "eq_speed_teeth_direct",
    name: "Tooth-Speed Balance",
    canonical: { lhs: "T_1 * N_1", rhs: "T_2 * N_2", tex: "T_1 N_1 = T_2 N_2" },
    baseFormula: "T_1 N_1 = T_2 N_2",
    nodes: ["T_1", "n_1", "T_2", "n_2"],
    topic: "speed_center",
    termsCount: 4,
    forms: {
      n_2: { formula: "N_2 = \\cfrac{T_1 N_1}{T_2}", notes: "Driven speed directly from tooth balance" },
      T_2: { formula: "T_2 = \\cfrac{T_1 N_1}{N_2}", notes: "Driven teeth directly from speeds" }
    },
    solve: (target, S) => {
      if (target === "n_2") {
        return {
          target: targetLabel(getVarName(S, "n_2"), "{{N_2|n_2}}", "rpm"),
          text: "From speed-teeth balance ($T_1 N_1 = T_2 N_2$):",
          eq: `N_2 = \\cfrac{T_1 N_1}{T_2} = \\cfrac{${fmt(S.T_1, 0)} \\times ${fmt(S.n_1, 0)}}{${fmt(S.T_2, 0)}} = \\mathbf{${fmt(S.n_2, 1)}\\text{ rpm}}`,
          val: S.n_2
        };
      }
      if (target === "T_2") {
        return {
          target: targetLabel(getVarName(S, "T_2"), "{{T_2|T}}", "teeth"),
          text: "From speed-teeth balance ($T_2 = \\cfrac{T_1 N_1}{N_2}$):",
          eq: `T_2 = \\cfrac{T_1 N_1}{N_2} = \\cfrac{${fmt(S.T_1, 0)} \\times ${fmt(S.n_1, 0)}}{${fmt(S.n_2, 1)}} = \\mathbf{${fmt(S.T_2, 0)}\\text{ teeth}}`,
          val: S.T_2
        };
      }
    }
  },

  // 11. Pitch Reciprocal Identity
  {
    id: "eq_pitch_inv",
    name: "Pitch Reciprocal Identity",
    canonical: { lhs: "P_c * P_d", rhs: "pi", tex: "P_c \\cdot P_d = \\pi" },
    baseFormula: "P_c \\cdot P_d = \\pi",
    nodes: ["P_c", "P_d"],
    topic: "pitch_geometry",
    termsCount: 2,
    forms: {
      P_d: { formula: "P_d = \\cfrac{\\pi}{P_c}", notes: "Diametral pitch from circular pitch" },
      P_c: { formula: "P_c = \\cfrac{\\pi}{P_d}", notes: "Circular spacing from diametral pitch" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "P_c");
      const isSI = S.sys === "SI" || u === "mm";
      if (target === "P_d") {
        return {
          target: targetLabel(getVarName(S, "P_d"), "{{P_d}}", "teeth/in"),
          text: isSI
            ? "From circular pitch with mm-to-inch conversion:"
            : "From pitch reciprocal identity ($P_c \\cdot P_d = \\pi$):",
          eq: isSI
            ? `P_d = \\cfrac{\\pi}{P_c} = \\cfrac{\\pi}{${fmt(S.P_c, 3)}\\cancel{\\text{ mm}}} \\cdot \\cfrac{25.4\\cancel{\\text{ mm}}}{1\\text{ in}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ teeth/in}}`
            : `P_d = \\cfrac{\\pi}{P_c} = \\cfrac{\\pi}{${fmt(S.P_c, 4)}\\text{ in}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ teeth/in}}`,
          val: S.P_d
        };
      }
      if (target === "P_c") {
        return {
          target: targetLabel(getVarName(S, "P_c"), "{{P_c}}", u),
          text: isSI
            ? "From diametral pitch ($P_c = \\pi m$):"
            : "From diametral pitch ($P_c = \\cfrac{\\pi}{P_d}$):",
          eq: isSI
            ? `P_c = \\pi m = \\pi (${fmt(S.m, 2)}) = \\mathbf{${fmt(S.P_c, 3)}\\text{ mm}}`
            : `P_c = \\cfrac{\\pi}{P_d} = \\cfrac{\\pi}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.P_c, 4)}\\text{ in}}`,
          val: S.P_c
        };
      }
    }
  },

  // 12. Pinion Pitch Definition
  {
    id: "eq_dp1",
    name: "Pinion Pitch Definition",
    canonical: { lhs: "D_1", rhs: "T_1 / P_d", tex: "D_1 = \\cfrac{T_1}{P_d}" },
    baseFormula: "D_{P1} = \\cfrac{T_1}{P_d}",
    nodes: ["D_P1", "T_1", "P_d"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      D_P1: { formula: "D_1 = T_1 m \\quad\\text{or}\\quad \\cfrac{T_1}{P_d}", notes: "Pitch diameter from teeth and pitch" },
      P_d:  { formula: "P_d = \\cfrac{T_1}{D_1}", notes: "Pitch from diameter and teeth" },
      T_1:  { formula: "T_1 = D_1 \\cdot P_d", notes: "Teeth from diameter and pitch" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "D_P1");
      const isSI = S.sys === "SI" || u === "mm";
      if (target === "D_P1") {
        return {
          target: targetLabel(getVarName(S, "D_P1"), "{{D_1|D_P1}}", u),
          text: isSI
            ? `From teeth and module ($D_1 = T_1 m$):`
            : `From teeth and diametral pitch ($D_1 = \\cfrac{T_1}{P_d}$):`,
          eq: isSI
            ? `D_1 = T_1 \\cdot m = ${fmt(S.T_1, 0)} \\times ${fmt(S.m, 2)}\\text{ mm} = \\mathbf{${fmt(S.D_P1, 1)}\\text{ mm}}`
            : `D_1 = \\cfrac{T_1}{P_d} = \\cfrac{${fmt(S.T_1, 0)}}{${fmt(S.P_d, 2)}\\text{ teeth/in}} = \\mathbf{${fmt(S.D_P1, 3)}\\text{ in}}`,
          val: S.D_P1
        };
      }
      if (target === "P_d") {
        return {
          target: targetLabel(getVarName(S, "P_d"), "{{P_d}}", "teeth/in"),
          text: isSI
            ? "From teeth and diameter with dimensional inch conversion:"
            : "From pitch diameter and teeth ($P_d = \\cfrac{T_1}{D_1}$):",
          eq: isSI
            ? `P_d = \\cfrac{T_1}{D_1} = \\cfrac{${fmt(S.T_1, 0)}}{${fmt(S.D_P1, 1)}\\cancel{\\text{ mm}}} \\cdot \\cfrac{25.4\\cancel{\\text{ mm}}}{1\\text{ in}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ teeth/in}}`
            : `P_d = \\cfrac{T_1}{D_1} = \\cfrac{${fmt(S.T_1, 0)}}{${fmt(S.D_P1, 3)}\\text{ in}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ teeth/in}}`,
          val: S.P_d
        };
      }
      if (target === "T_1") {
        return {
          target: targetLabel(getVarName(S, "T_1"), "{{T_1|T}}", "teeth"),
          text: isSI
            ? `From pitch diameter and module ($T_1 = \\cfrac{D_1}{m}$):`
            : `From pitch diameter and diametral pitch ($T_1 = D_1 P_d$):`,
          eq: isSI
            ? `T_1 = \\cfrac{D_1}{m} = \\cfrac{${fmt(S.D_P1, 1)}\\cancel{\\text{ mm}}}{${fmt(S.m, 2)}\\cancel{\\text{ mm}}} = \\mathbf{${fmt(S.T_1, 0)}\\text{ teeth}}`
            : `T_1 = D_1 \\cdot P_d = ${fmt(S.D_P1, 3)}\\cancel{\\text{ in}} \\times ${fmt(S.P_d, 2)}\\cfrac{\\text{teeth}}{\\cancel{\\text{in}}} = \\mathbf{${fmt(S.T_1, 0)}\\text{ teeth}}`,
          val: S.T_1
        };
      }
    }
  },

  // 13. Gear Pitch Definition
  {
    id: "eq_dp2",
    name: "Gear Pitch Definition",
    canonical: { lhs: "D_2", rhs: "T_2 / P_d", tex: "D_2 = \\cfrac{T_2}{P_d}" },
    baseFormula: "D_{P2} = \\cfrac{T_2}{P_d}",
    nodes: ["D_P2", "T_2", "P_d"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      D_P2: { formula: "D_2 = T_2 m \\quad\\text{or}\\quad \\cfrac{T_2}{P_d}", notes: "Gear pitch diameter from teeth" },
      T_2:  { formula: "T_2 = D_2 \\cdot P_d", notes: "Gear teeth from diameter and pitch" },
      P_d:  { formula: "P_d = \\cfrac{T_2}{D_2}", notes: "Pitch from gear diameter and teeth" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "D_P2");
      const isSI = S.sys === "SI" || u === "mm";
      if (target === "D_P2") {
        return {
          target: targetLabel(getVarName(S, "D_P2"), "{{D_2|D_P2}}", u),
          text: isSI
            ? `From gear teeth and module ($D_2 = T_2 m$):`
            : `From gear teeth and pitch ($D_2 = \\cfrac{T_2}{P_d}$):`,
          eq: isSI
            ? `D_2 = T_2 \\cdot m = ${fmt(S.T_2, 0)} \\times ${fmt(S.m, 2)}\\text{ mm} = \\mathbf{${fmt(S.D_P2, 1)}\\text{ mm}}`
            : `D_2 = \\cfrac{T_2}{P_d} = \\cfrac{${fmt(S.T_2, 0)}}{${fmt(S.P_d, 2)}\\text{ teeth/in}} = \\mathbf{${fmt(S.D_P2, 3)}\\text{ in}}`,
          val: S.D_P2
        };
      }
      if (target === "T_2") {
        return {
          target: targetLabel(getVarName(S, "T_2"), "{{T_2|T}}", "teeth"),
          text: isSI
            ? `From gear diameter and module ($T_2 = \\cfrac{D_2}{m}$):`
            : `From gear diameter and pitch ($T_2 = D_2 P_d$):`,
          eq: isSI
            ? `T_2 = \\cfrac{D_2}{m} = \\cfrac{${fmt(S.D_P2, 1)}\\cancel{\\text{ mm}}}{${fmt(S.m, 2)}\\cancel{\\text{ mm}}} = \\mathbf{${fmt(S.T_2, 0)}\\text{ teeth}}`
            : `T_2 = D_2 \\cdot P_d = ${fmt(S.D_P2, 3)}\\cancel{\\text{ in}} \\times ${fmt(S.P_d, 2)}\\cfrac{\\text{teeth}}{\\cancel{\\text{in}}} = \\mathbf{${fmt(S.T_2, 0)}\\text{ teeth}}`,
          val: S.T_2
        };
      }
      if (target === "P_d") {
        return {
          target: targetLabel(getVarName(S, "P_d"), "{{P_d}}", "teeth/in"),
          text: isSI
            ? "From gear diameter and teeth with dimensional inch conversion:"
            : "From gear diameter and teeth ($P_d = \\cfrac{T_2}{D_2}$):",
          eq: isSI
            ? `P_d = \\cfrac{T_2}{D_2} = \\cfrac{${fmt(S.T_2, 0)}}{${fmt(S.D_P2, 1)}\\cancel{\\text{ mm}}} \\cdot \\cfrac{25.4\\cancel{\\text{ mm}}}{1\\text{ in}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ teeth/in}}`
            : `P_d = \\cfrac{T_2}{D_2} = \\cfrac{${fmt(S.T_2, 0)}}{${fmt(S.D_P2, 2)}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ teeth/in}}`,
          val: S.P_d
        };
      }
    }
  },

  // 14. Center Distance (External)
  {
    id: "eq_center_dist",
    name: "Center Distance (External)",
    canonical: { lhs: "C", rhs: "(D_1 + D_2) / 2", tex: "C = \\cfrac{D_1 + D_2}{2}" },
    baseFormula: "C = \\cfrac{D_1 + D_2}{2}",
    nodes: ["C", "D_P1", "D_P2"],
    topic: "speed_center",
    termsCount: 3,
    forms: {
      C:    { formula: "C = \\cfrac{D_1 + D_2}{2}", notes: "Sum of pitch radii" },
      D_P2: { formula: "D_2 = 2C - D_1", notes: "Gear diameter from center distance" },
      D_P1: { formula: "D_1 = 2C - D_2", notes: "Pinion diameter from center distance" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "C");
      if (target === "C") {
        return {
          target: targetLabel(getVarName(S, "C"), "{{C}}", u),
          text: "Sum of pitch radii for external mesh ($C = \\cfrac{D_1 + D_2}{2}$):",
          eq: `C = \\cfrac{D_1 + D_2}{2} = \\cfrac{${fmt(S.D_P1, 2)} + ${fmt(S.D_P2, 2)}}{2} = \\mathbf{${fmt(S.C, 2)}\\text{ ${u}}}`,
          val: S.C
        };
      }
      if (target === "D_P2") {
        return {
          target: targetLabel(getVarName(S, "D_P2"), "{{D_2|D_P2}}", u),
          text: "From center distance and pinion diameter ($D_2 = 2C - D_1$):",
          eq: `D_2 = 2C - D_1 = 2(${fmt(S.C, 2)}) - ${fmt(S.D_P1, 2)} = \\mathbf{${fmt(S.D_P2, 2)}\\text{ ${u}}}`,
          val: S.D_P2
        };
      }
      if (target === "D_P1") {
        return {
          target: targetLabel(getVarName(S, "D_P1"), "{{D_1|D_P1}}", u),
          text: "From center distance and gear diameter ($D_1 = 2C - D_2$):",
          eq: `D_1 = 2C - D_2 = 2(${fmt(S.C, 2)}) - ${fmt(S.D_P2, 2)} = \\mathbf{${fmt(S.D_P1, 2)}\\text{ ${u}}}`,
          val: S.D_P1
        };
      }
    }
  },

  // 15. Center Distance Ratio Formula
  {
    id: "eq_c_vr_teeth",
    name: "Center Distance Ratio Formula",
    canonical: { lhs: "C", rhs: "(T_1 * (1 + SR))/(2 * P_d)", tex: "C = \\cfrac{T_1 (1 + SR)}{2 P_d}" },
    baseFormula: "C = \\cfrac{T_1 (1 + SR)}{2 P_d}",
    nodes: ["C", "T_1", "VR", "P_d"],
    topic: "speed_center",
    termsCount: 4,
    forms: {
      T_1: { formula: "T_1 = \\cfrac{2 C \\cdot P_d}{1 + SR}", notes: "Pinion teeth from center distance and ratio" },
      C:   { formula: "C = \\cfrac{T_1 (1 + SR)}{2 P_d}", notes: "Center distance from pinion teeth and ratio" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "C");
      const isSI = S.sys === "SI" || u === "mm";
      if (target === "T_1") {
        return {
          target: targetLabel(getVarName(S, "T_1"), "{{T_1|T}}", "teeth"),
          text: "From center distance and speed ratio:",
          eq: isSI
            ? `T_1 = \\cfrac{2 C}{m(1 + SR)} = \\cfrac{2(${fmt(S.C, 1)})}{${fmt(S.m, 2)}(1 + ${fmt(S.VR, 2)})} = \\mathbf{${fmt(S.T_1, 0)}\\text{ teeth}}`
            : `T_1 = \\cfrac{2 C \\cdot P_d}{1 + SR} = \\cfrac{2(${fmt(S.C, 3)})(${fmt(S.P_d, 2)})}{1 + ${fmt(S.VR, 2)}} = \\mathbf{${fmt(S.T_1, 0)}\\text{ teeth}}`,
          val: S.T_1
        };
      }
      if (target === "C") {
        return {
          target: targetLabel(getVarName(S, "C"), "{{C}}", u),
          text: "From pinion teeth and speed ratio:",
          eq: isSI
            ? `C = \\cfrac{m T_1 (1 + SR)}{2} = \\cfrac{${fmt(S.m, 2)}(${fmt(S.T_1, 0)})(1 + ${fmt(S.VR, 2)})}{2} = \\mathbf{${fmt(S.C, 1)}\\text{ mm}}`
            : `C = \\cfrac{T_1 (1 + SR)}{2 P_d} = \\cfrac{${fmt(S.T_1, 0)}(1 + ${fmt(S.VR, 2)})}{2(${fmt(S.P_d, 2)})} = \\mathbf{${fmt(S.C, 3)}\\text{ in}}`,
          val: S.C
        };
      }
    }
  },

  // 16. Center Distance from Teeth Sum
  {
    id: "eq_c_teeth_sum",
    name: "Center Distance from Teeth Sum",
    canonical: { lhs: "C", rhs: "(T_1 + T_2)/(2 * P_d)", tex: "C = \\cfrac{T_1 + T_2}{2 P_d}" },
    baseFormula: "C = \\cfrac{T_1 + T_2}{2 P_d}",
    nodes: ["C", "T_1", "T_2", "P_d"],
    topic: "speed_center",
    termsCount: 4,
    forms: {
      C:   { formula: "C = \\cfrac{T_1 + T_2}{2 P_d}", notes: "Center distance from total tooth count" },
      P_d: { formula: "P_d = \\cfrac{T_1 + T_2}{2C}", notes: "Pitch from teeth sum and distance" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "C");
      const isSI = S.sys === "SI" || u === "mm";
      if (target === "C") {
        return {
          target: targetLabel(getVarName(S, "C"), "{{C}}", u),
          text: "Center distance from total teeth in mesh:",
          eq: isSI
            ? `C = \\cfrac{m(T_1 + T_2)}{2} = \\cfrac{${fmt(S.m, 2)}(${fmt(S.T_1, 0)} + ${fmt(S.T_2, 0)})}{2} = \\mathbf{${fmt(S.C, 1)}\\text{ mm}}`
            : `C = \\cfrac{T_1 + T_2}{2 P_d} = \\cfrac{${fmt(S.T_1, 0)} + ${fmt(S.T_2, 0)}}{2(${fmt(S.P_d, 2)})} = \\mathbf{${fmt(S.C, 3)}\\text{ in}}`,
          val: S.C
        };
      }
      if (target === "P_d") {
        return {
          target: targetLabel(getVarName(S, "P_d"), "{{P_d}}", "teeth/in"),
          text: isSI
            ? `Pitch from teeth sum and distance with dimensional conversion:`
            : `Pitch from total teeth and center distance:`,
          eq: isSI
            ? `P_d = \\cfrac{T_1 + T_2}{2C} = \\cfrac{${fmt(S.T_1, 0)} + ${fmt(S.T_2, 0)}}{2(${fmt(S.C, 1)})\\,\\cancel{\\text{mm}}} \\cdot \\cfrac{25.4\\,\\cancel{\\text{mm}}}{1\\text{ in}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ teeth/in}}`
            : `P_d = \\cfrac{T_1 + T_2}{2C} = \\cfrac{${fmt(S.T_1, 0)} + ${fmt(S.T_2, 0)}}{2(${fmt(S.C, 3)})} = \\mathbf{${fmt(S.P_d, 2)}\\text{ teeth/in}}`,
          val: S.P_d
        };
      }
    }
  },

  // 17. Speed Reduction Ratio
  {
    id: "eq_vr_speed",
    name: "Speed Reduction Ratio",
    canonical: { lhs: "SR", rhs: "N_1 / N_2", tex: "SR = \\cfrac{N_1}{N_2}" },
    baseFormula: "SR = \\cfrac{N_1}{N_2}",
    nodes: ["VR", "n_1", "n_2"],
    topic: "speed_center",
    termsCount: 3,
    forms: {
      VR:  { formula: "SR = \\cfrac{N_1}{N_2}", notes: "Speed reduction ratio" },
      n_2: { formula: "N_2 = \\cfrac{N_1}{SR}", notes: "Driven speed through reduction" },
      n_1: { formula: "N_1 = N_2 \\cdot SR", notes: "Driver speed from driven speed and ratio" }
    },
    solve: (target, S) => {
      if (target === "VR") {
        return {
          target: targetLabel(getVarName(S, "VR"), "{{SR|VR}}", "ratio"),
          text: "From rotational speed ratio ($SR = \\cfrac{N_1}{N_2}$):",
          eq: `SR = \\cfrac{N_1}{N_2} = \\cfrac{${fmt(S.n_1, 0)}\\cancel{\\text{ rpm}}}{${fmt(S.n_2, 1)}\\cancel{\\text{ rpm}}} = \\mathbf{${fmt(S.VR, 2)}}`,
          val: S.VR
        };
      }
      if (target === "n_2") {
        return {
          target: targetLabel(getVarName(S, "n_2"), "{{N_2|n_2}}", "rpm"),
          text: "Driven speed through reduction ratio ($N_2 = \\cfrac{N_1}{SR}$):",
          eq: `N_2 = \\cfrac{N_1}{SR} = \\cfrac{${fmt(S.n_1, 0)}}{${fmt(S.VR, 2)}} = \\mathbf{${fmt(S.n_2, 1)}\\text{ rpm}}`,
          val: S.n_2
        };
      }
      if (target === "n_1") {
        return {
          target: targetLabel(getVarName(S, "n_1"), "{{N_1|n_1}}", "rpm"),
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
    canonical: { lhs: "SR", rhs: "T_2 / T_1", tex: "SR = \\cfrac{T_2}{T_1}" },
    baseFormula: "SR = \\cfrac{T_2}{T_1}",
    nodes: ["VR", "T_1", "T_2"],
    topic: "speed_center",
    termsCount: 3,
    forms: {
      T_2: { formula: "T_2 = T_1 \\cdot SR", notes: "Driven teeth from ratio" },
      T_1: { formula: "T_1 = \\cfrac{T_2}{SR}", notes: "Driver teeth from ratio" },
      VR:  { formula: "SR = \\cfrac{T_2}{T_1}", notes: "Speed ratio from tooth count" }
    },
    solve: (target, S) => {
      if (target === "T_2") {
        return {
          target: targetLabel(getVarName(S, "T_2"), "{{T_2|T}}", "teeth"),
          text: "From speed ratio and pinion teeth ($T_2 = T_1 \\cdot SR$):",
          eq: `T_2 = T_1 \\cdot SR = ${fmt(S.T_1, 0)} \\times ${fmt(S.VR, 2)} = \\mathbf{${fmt(S.T_2, 0)}\\text{ teeth}}`,
          val: S.T_2
        };
      }
      if (target === "T_1") {
        return {
          target: targetLabel(getVarName(S, "T_1"), "{{T_1|T}}", "teeth"),
          text: "From gear teeth and speed ratio ($T_1 = \\cfrac{T_2}{SR}$):",
          eq: `T_1 = \\cfrac{T_2}{SR} = \\cfrac{${fmt(S.T_2, 0)}}{${fmt(S.VR, 2)}} = \\mathbf{${fmt(S.T_1, 0)}\\text{ teeth}}`,
          val: S.T_1
        };
      }
      if (target === "VR") {
        return {
          target: targetLabel(getVarName(S, "VR"), "{{SR|VR}}", "ratio"),
          text: "Tooth count ratio of gear to pinion ($SR = \\cfrac{T_2}{T_1}$):",
          eq: `SR = \\cfrac{T_2}{T_1} = \\cfrac{${fmt(S.T_2, 0)}}{${fmt(S.T_1, 0)}} = \\mathbf{${fmt(S.VR, 2)}}`,
          val: S.VR
        };
      }
    }
  },

  // 19. Pitch Line Velocity — Pure Physics: v = r · ω = π · D · N
  {
    id: "eq_pitch_vel",
    name: "Pitch Line Velocity",
    canonical: { lhs: "v", rhs: "(pi * D_1 * n_1) / 60000", tex: "v = \\pi D_1 N_1" },
    baseFormula: "v = \\pi D_1 N_1",
    nodes: ["V_m", "D_P1", "n_1"],
    topic: "speed_center",
    termsCount: 3,
    forms: {
      V_m:  { formula: "v = \\pi D_1 N_1", notes: "Tangential peripheral speed of pitch cylinder" },
      D_P1: { formula: "D_1 = \\cfrac{v}{\\pi N_1}", notes: "Pitch diameter from peripheral velocity" },
      n_1:  { formula: "N_1 = \\cfrac{v}{\\pi D_1}", notes: "Rotational speed from pitch speed" }
    },
    solve: (target, S) => {
      const isSI = S.sys === "SI" || unitOf(S, "V_m") === "m/s" || unitOf(S, "D_P1") === "mm";
      const u_v = unitOf(S, "V_m");
      const u_D = unitOf(S, "D_P1");

      if (target === "V_m") {
        if (isSI) {
          return {
            target: targetLabel(getVarName(S, "V_m"), "{{v|V_m}}", u_v),
            text: "Linear velocity at pitch circle ($v = \\pi D_1 N_1$) with dimensional unit conversion:",
            eq: `v = \\pi D_1 N_1 = \\pi \\left(${fmt(S.D_P1, 1)}\\cancel{\\text{ mm}} \\cdot \\cfrac{1\\text{ m}}{1000\\cancel{\\text{ mm}}}\\right) \\left(${fmt(S.n_1, 0)}\\cfrac{\\cancel{\\text{rev}}}{\\cancel{\\text{min}}} \\cdot \\cfrac{1\\cancel{\\text{ min}}}{60\\text{ s}}\\right) = \\mathbf{${fmt(S.V_m, 2)}\\text{ m/s}}`,
            val: S.V_m
          };
        }
        return {
          target: targetLabel(getVarName(S, "V_m"), "{{v|V_m}}", u_v),
          text: "Linear velocity at pitch circle ($v = \\pi D_1 N_1$) converting inches to feet:",
          eq: `v = \\pi D_1 N_1 = \\pi \\left(${fmt(S.D_P1, 3)}\\cancel{\\text{ in}} \\cdot \\cfrac{1\\text{ ft}}{12\\cancel{\\text{ in}}}\\right) \\left(${fmt(S.n_1, 0)}\\cfrac{\\text{rev}}{\\text{min}}\\right) = \\mathbf{${fmt(S.V_m, 1)}\\text{ ft/min}}`,
          val: S.V_m
        };
      }
      if (target === "D_P1") {
        if (isSI) {
          return {
            target: targetLabel(getVarName(S, "D_P1"), "{{D_1|D_P1}}", u_D),
            text: "Pitch diameter from pitch speed ($D_1 = \\cfrac{v}{\\pi N_1}$) converting meters to mm:",
            eq: `D_1 = \\cfrac{v}{\\pi N_1} = \\cfrac{${fmt(S.V_m, 2)}\\cfrac{\\cancel{\\text{m}}}{\\cancel{\\text{s}}}}{\\pi \\cdot ${fmt(S.n_1, 0)}\\cfrac{\\cancel{\\text{rev}}}{\\cancel{\\text{min}}} \\cdot \\cfrac{1\\cancel{\\text{ min}}}{60\\cancel{\\text{ s}}}} \\cdot \\cfrac{1000\\text{ mm}}{1\\cancel{\\text{ m}}} = \\mathbf{${fmt(S.D_P1, 1)}\\text{ mm}}`,
            val: S.D_P1
          };
        }
        return {
          target: targetLabel(getVarName(S, "D_P1"), "{{D_1|D_P1}}", u_D),
          text: "Pitch diameter from pitch speed ($D_1 = \\cfrac{v}{\\pi N_1}$) converting feet to inches:",
          eq: `D_1 = \\cfrac{v}{\\pi N_1} = \\cfrac{${fmt(S.V_m, 1)}\\cfrac{\\cancel{\\text{ft}}}{\\cancel{\\text{min}}}}{\\pi \\cdot ${fmt(S.n_1, 0)}\\cfrac{\\text{rev}}{\\cancel{\\text{min}}}} \\cdot \\cfrac{12\\text{ in}}{1\\cancel{\\text{ ft}}} = \\mathbf{${fmt(S.D_P1, 3)}\\text{ in}}`,
          val: S.D_P1
        };
      }
      if (target === "n_1") {
        if (isSI) {
          return {
            target: targetLabel(getVarName(S, "n_1"), "{{N_1|n_1}}", "rpm"),
            text: "Rotational speed from pitch speed ($N_1 = \\cfrac{v}{\\pi D_1}$):",
            eq: `N_1 = \\cfrac{v}{\\pi D_1} = \\cfrac{${fmt(S.V_m, 2)}\\cfrac{\\cancel{\\text{m}}}{\\cancel{\\text{s}}}}{\\pi \\left(${fmt(S.D_P1, 1)}\\cancel{\\text{ mm}} \\cdot \\cfrac{1\\cancel{\\text{ m}}}{1000\\cancel{\\text{ mm}}}\\right)} \\cdot \\cfrac{60\\cancel{\\text{ s}}}{1\\text{ min}} = \\mathbf{${fmt(S.n_1, 0)}\\text{ rpm}}`,
            val: S.n_1
          };
        }
        return {
          target: targetLabel(getVarName(S, "n_1"), "{{N_1|n_1}}", "rpm"),
          text: "Rotational speed from pitch speed ($N_1 = \\cfrac{v}{\\pi D_1}$):",
          eq: `N_1 = \\cfrac{v}{\\pi D_1} = \\cfrac{${fmt(S.V_m, 1)}\\cfrac{\\cancel{\\text{ft}}}{\\text{min}}}{\\pi \\left(${fmt(S.D_P1, 3)}\\cancel{\\text{ in}} \\cdot \\cfrac{1\\cancel{\\text{ ft}}}{12\\cancel{\\text{ in}}}\\right)} = \\mathbf{${fmt(S.n_1, 0)}\\text{ rpm}}`,
          val: S.n_1
        };
      }
    }
  },

  // 20. Rotational Power & Shaft Torque — Pure Physics: P = T · ω = 2π N T
  {
    id: "eq_torque_power",
    name: "Rotational Power & Torque",
    canonical: { lhs: "P", rhs: "2 * pi * N_1 * T", tex: "P = 2\\pi N_1 T" },
    baseFormula: "P = 2\\pi N_1 T",
    nodes: ["M_t", "P", "n_1"],
    topic: "forces_torque",
    termsCount: 3,
    forms: {
      M_t: { formula: "T = \\cfrac{P}{\\omega} = \\cfrac{P}{2\\pi N_1}", notes: "Torque derived from rotational power definition" },
      P:   { formula: "P = T \\cdot \\omega = 2\\pi N_1 T", notes: "Rotational power from torque and angular speed" },
      n_1: { formula: "N_1 = \\cfrac{P}{2\\pi T}", notes: "Rotational speed from power and torque" }
    },
    solve: (target, S) => {
      const isSI = S.sys === "SI" || unitOf(S, "P") === "kW" || unitOf(S, "M_t") === "N-m";
      const u_T = unitOf(S, "M_t");
      const u_P = unitOf(S, "P");

      if (target === "M_t") {
        if (isSI) {
          return {
            target: targetLabel(getVarName(S, "M_t"), "{{T|M_t}}", u_T),
            text: "Shaft torque from physical power definition ($T = \\cfrac{P}{\\omega} = \\cfrac{P}{2\\pi N_1}$) with unit analysis:",
            eq: `T = \\cfrac{P}{2\\pi N_1} = \\cfrac{${fmt(S.P, 2)}\\cancel{\\text{ kW}} \\cdot \\cfrac{1000\\text{ N}\\cdot\\text{m}}{\\cancel{\\text{s}}\\cdot 1\\cancel{\\text{ kW}}}}{2\\pi \\cdot ${fmt(S.n_1, 0)}\\cfrac{\\cancel{\\text{rev}}}{\\cancel{\\text{min}}} \\cdot \\cfrac{1\\cancel{\\text{ min}}}{60\\cancel{\\text{ s}}}} = \\mathbf{${fmt(S.M_t, 2)}\\text{ N}\\cdot\\text{m}}`,
            val: S.M_t
          };
        }
        return {
          target: targetLabel(getVarName(S, "M_t"), "{{T|M_t}}", u_T),
          text: "Shaft torque from horsepower ($T = \\cfrac{P}{2\\pi N_1}$) using dimensional analysis:",
          eq: `T = \\cfrac{P}{2\\pi N_1} = \\cfrac{${fmt(S.P, 2)}\\cancel{\\text{ hp}} \\cdot \\left(\\cfrac{33000\\cancel{\\text{ ft}}\\cdot\\text{lb}}{\\cancel{\\text{min}}\\cdot 1\\cancel{\\text{ hp}}}\\right) \\cdot \\left(\\cfrac{12\\text{ in}}{1\\cancel{\\text{ ft}}}\\right)}{2\\pi \\cdot ${fmt(S.n_1, 0)}\\cfrac{\\text{rev}}{\\cancel{\\text{min}}}} = \\mathbf{${fmt(S.M_t, 2)}\\text{ lb}\\cdot\\text{in}}`,
          val: S.M_t
        };
      }
      if (target === "P") {
        if (isSI) {
          return {
            target: targetLabel(getVarName(S, "P"), "{{P}}", u_P),
            text: "Transmitted power from torque and angular speed ($P = T \\cdot \\omega = 2\\pi N_1 T$):",
            eq: `P = 2\\pi N_1 T = \\left(2\\pi \\cdot ${fmt(S.n_1, 0)}\\cfrac{\\cancel{\\text{rev}}}{\\cancel{\\text{min}}} \\cdot \\cfrac{1\\cancel{\\text{ min}}}{60\\text{ s}}\\right) (${fmt(S.M_t, 2)}\\text{ N}\\cdot\\text{m}) \\cdot \\cfrac{1\\text{ kW}}{1000\\text{ N}\\cdot\\text{m/s}} = \\mathbf{${fmt(S.P, 2)}\\text{ kW}}`,
            val: S.P
          };
        }
        return {
          target: targetLabel(getVarName(S, "P"), "{{P}}", u_P),
          text: "Horsepower from torque and rpm ($P = 2\\pi N_1 T$):",
          eq: `P = 2\\pi N_1 T = \\left(2\\pi \\cdot ${fmt(S.n_1, 0)}\\cfrac{\\text{rev}}{\\cancel{\\text{min}}}\\right) \\left(${fmt(S.M_t, 2)}\\cancel{\\text{ lb}}\\cdot\\cancel{\\text{in}} \\cdot \\cfrac{1\\cancel{\\text{ ft}}}{12\\cancel{\\text{ in}}}\\right) \\cdot \\cfrac{1\\text{ hp}}{33000\\cancel{\\text{ ft}}\\cdot\\cancel{\\text{lb}}/\\cancel{\\text{min}}} = \\mathbf{${fmt(S.P, 2)}\\text{ hp}}`,
          val: S.P
        };
      }
      if (target === "n_1") {
        if (isSI) {
          return {
            target: targetLabel(getVarName(S, "n_1"), "{{N_1|n_1}}", "rpm"),
            text: "Rotational speed from power and torque ($N_1 = \\cfrac{P}{2\\pi T}$):",
            eq: `N_1 = \\cfrac{P}{2\\pi T} = \\cfrac{${fmt(S.P, 2)}\\cancel{\\text{ kW}} \\cdot \\cfrac{1000\\cancel{\\text{ N}\\cdot\\text{m}}}{\\cancel{\\text{s}}\\cdot 1\\cancel{\\text{ kW}}}}{2\\pi \\cdot ${fmt(S.M_t, 2)}\\cancel{\\text{ N}\\cdot\\text{m}}} \\cdot \\cfrac{60\\cancel{\\text{ s}}}{1\\text{ min}} = \\mathbf{${fmt(S.n_1, 0)}\\text{ rpm}}`,
            val: S.n_1
          };
        }
        return {
          target: targetLabel(getVarName(S, "n_1"), "{{N_1|n_1}}", "rpm"),
          text: "Rotational speed from power and torque ($N_1 = \\cfrac{P}{2\\pi T}$):",
          eq: `N_1 = \\cfrac{P}{2\\pi T} = \\cfrac{${fmt(S.P, 2)}\\cancel{\\text{ hp}} \\cdot \\left(\\cfrac{33000\\cancel{\\text{ ft}}\\cdot\\cancel{\\text{lb}}}{\\text{min}\\cdot 1\\cancel{\\text{ hp}}}\\right) \\cdot \\left(\\cfrac{12\\cancel{\\text{ in}}}{1\\cancel{\\text{ ft}}}\\right)}{2\\pi (${fmt(S.M_t, 2)}\\cancel{\\text{ lb}}\\cdot\\cancel{\\text{in}})} = \\mathbf{${fmt(S.n_1, 0)}\\text{ rpm}}`,
          val: S.n_1
        };
      }
    }
  },

  // 21. Tangential Load from Torque — Pure Physics: T = F_t · r = F_t · (D_1 / 2)
  {
    id: "eq_wt_torque",
    name: "Tangential Load from Torque",
    canonical: { lhs: "T", rhs: "F_t * (D_1 / 2)", tex: "T = F_t \\cdot \\cfrac{D_1}{2}" },
    baseFormula: "F_t = \\cfrac{2T}{D_1}",
    nodes: ["W_t", "M_t", "D_P1"],
    topic: "forces_torque",
    termsCount: 3,
    forms: {
      W_t:  { formula: "F_t = \\cfrac{2T}{D_1}", notes: "Tangential tooth load from torque and pitch diameter" },
      M_t:  { formula: "T = F_t \\cdot \\cfrac{D_1}{2}", notes: "Shaft torque from tooth load and pitch radius" },
      D_P1: { formula: "D_1 = \\cfrac{2T}{F_t}", notes: "Pitch diameter from torque and tangential load" }
    },
    solve: (target, S) => {
      const isSI = S.sys === "SI" || unitOf(S, "W_t") === "N" || unitOf(S, "D_P1") === "mm";
      const u_F = unitOf(S, "W_t");
      const u_T = unitOf(S, "M_t");
      const u_D = unitOf(S, "D_P1");

      if (target === "W_t") {
        if (isSI) {
          return {
            target: targetLabel(getVarName(S, "W_t"), "{{F_t|W_t}}", u_F),
            text: "Tangential force from torque and pitch radius ($F_t = \\cfrac{2T}{D_1}$) with unit conversion:",
            eq: `F_t = \\cfrac{2T}{D_1} = \\cfrac{2(${fmt(S.M_t, 2)}\\text{ N}\\cdot\\cancel{\\text{m}})}{${fmt(S.D_P1, 1)}\\cancel{\\text{ mm}} \\cdot \\cfrac{1\\cancel{\\text{ m}}}{1000\\cancel{\\text{ mm}}}} = \\mathbf{${fmt(S.W_t, 0)}\\text{ N}}`,
            val: S.W_t
          };
        }
        return {
          target: targetLabel(getVarName(S, "W_t"), "{{F_t|W_t}}", u_F),
          text: "Tangential force from shaft torque and pitch radius ($F_t = \\cfrac{2T}{D_1}$):",
          eq: `F_t = \\cfrac{2T}{D_1} = \\cfrac{2(${fmt(S.M_t, 2)}\\text{ lb}\\cdot\\cancel{\\text{in}})}{${fmt(S.D_P1, 3)}\\cancel{\\text{ in}}} = \\mathbf{${fmt(S.W_t, 0)}\\text{ lb}}`,
          val: S.W_t
        };
      }
      if (target === "M_t") {
        if (isSI) {
          return {
            target: targetLabel(getVarName(S, "M_t"), "{{T|M_t}}", u_T),
            text: "Torque from tooth load and pitch radius ($T = F_t \\cdot \\cfrac{D_1}{2}$) converting mm to m:",
            eq: `T = F_t \\cdot \\cfrac{D_1}{2} = ${fmt(S.W_t, 0)}\\text{ N} \\times \\cfrac{${fmt(S.D_P1, 1)}\\cancel{\\text{ mm}} \\cdot \\cfrac{1\\text{ m}}{1000\\cancel{\\text{ mm}}}}{2} = \\mathbf{${fmt(S.M_t, 2)}\\text{ N}\\cdot\\text{m}}`,
            val: S.M_t
          };
        }
        return {
          target: targetLabel(getVarName(S, "M_t"), "{{T|M_t}}", u_T),
          text: "Shaft torque from tooth load and pitch radius ($T = F_t \\cdot \\cfrac{D_1}{2}$):",
          eq: `T = F_t \\cdot \\cfrac{D_1}{2} = ${fmt(S.W_t, 0)}\\text{ lb} \\times \\cfrac{${fmt(S.D_P1, 3)}\\text{ in}}{2} = \\mathbf{${fmt(S.M_t, 2)}\\text{ lb}\\cdot\\text{in}}`,
          val: S.M_t
        };
      }
      if (target === "D_P1") {
        if (isSI) {
          return {
            target: targetLabel(getVarName(S, "D_P1"), "{{D_1|D_P1}}", u_D),
            text: "Pitch diameter from torque and tangential load ($D_1 = \\cfrac{2T}{F_t}$) in mm:",
            eq: `D_1 = \\cfrac{2T}{F_t} = \\cfrac{2(${fmt(S.M_t, 2)}\\cancel{\\text{ N}}\\cdot\\text{m})}{${fmt(S.W_t, 0)}\\cancel{\\text{ N}}} \\cdot \\cfrac{1000\\text{ mm}}{1\\text{ m}} = \\mathbf{${fmt(S.D_P1, 1)}\\text{ mm}}`,
            val: S.D_P1
          };
        }
        return {
          target: targetLabel(getVarName(S, "D_P1"), "{{D_1|D_P1}}", u_D),
          text: "Pitch diameter from torque and tangential load ($D_1 = \\cfrac{2T}{F_t}$):",
          eq: `D_1 = \\cfrac{2T}{F_t} = \\cfrac{2(${fmt(S.M_t, 2)}\\cancel{\\text{ lb}}\\cdot\\text{in})}{${fmt(S.W_t, 0)}\\cancel{\\text{ lb}}} = \\mathbf{${fmt(S.D_P1, 3)}\\text{ in}}`,
          val: S.D_P1
        };
      }
    }
  },

  // 22. Tangential Load from Power — Pure Physics: P = F_t · v
  {
    id: "eq_wt_power_vel",
    name: "Tangential Load from Power & Speed",
    canonical: { lhs: "P", rhs: "F_t * v", tex: "P = F_t \\cdot v" },
    baseFormula: "P = F_t \\cdot v",
    nodes: ["W_t", "P", "V_m"],
    topic: "forces_torque",
    termsCount: 3,
    forms: {
      W_t: { formula: "F_t = \\cfrac{P}{v}", notes: "Tangential load from power and linear velocity" },
      P:   { formula: "P = F_t \\cdot v", notes: "Power from load and velocity" },
      V_m: { formula: "v = \\cfrac{P}{F_t}", notes: "Pitch velocity from power and load" }
    },
    solve: (target, S) => {
      const isSI = S.sys === "SI" || unitOf(S, "P") === "kW" || unitOf(S, "W_t") === "N";
      const u_F = unitOf(S, "W_t");
      const u_P = unitOf(S, "P");
      const u_v = unitOf(S, "V_m");

      if (target === "W_t") {
        if (isSI) {
          return {
            target: targetLabel(getVarName(S, "W_t"), "{{F_t|W_t}}", u_F),
            text: "Tangential load from transmitted power ($F_t = \\cfrac{P}{v}$) with unit analysis:",
            eq: `F_t = \\cfrac{P}{v} = \\cfrac{${fmt(S.P, 2)}\\cancel{\\text{ kW}} \\cdot \\cfrac{1000\\text{ N}\\cdot\\cancel{\\text{m}}/\\cancel{\\text{s}}}{1\\cancel{\\text{ kW}}}}{${fmt(S.V_m, 2)}\\cancel{\\text{ m}}/\\cancel{\\text{s}}} = \\mathbf{${fmt(S.W_t, 0)}\\text{ N}}`,
            val: S.W_t
          };
        }
        return {
          target: targetLabel(getVarName(S, "W_t"), "{{F_t|W_t}}", u_F),
          text: "Tangential load from horsepower and pitch speed ($F_t = \\cfrac{P}{v}$) converting hp to ft-lb/min:",
          eq: `F_t = \\cfrac{P}{v} = \\cfrac{${fmt(S.P, 2)}\\cancel{\\text{ hp}} \\cdot \\cfrac{33000\\text{ lb}\\cdot\\cancel{\\text{ft}}/\\cancel{\\text{min}}}{1\\cancel{\\text{ hp}}}}{${fmt(S.V_m, 1)}\\cancel{\\text{ ft}}/\\cancel{\\text{min}}} = \\mathbf{${fmt(S.W_t, 0)}\\text{ lb}}`,
          val: S.W_t
        };
      }
      if (target === "P") {
        if (isSI) {
          return {
            target: targetLabel(getVarName(S, "P"), "{{P}}", u_P),
            text: "Power in kW from tangential load and pitch velocity ($P = F_t \\cdot v$):",
            eq: `P = F_t \\cdot v = (${fmt(S.W_t, 0)}\\text{ N})(${fmt(S.V_m, 2)}\\text{ m/s}) \\cdot \\cfrac{1\\text{ kW}}{1000\\text{ N}\\cdot\\text{m/s}} = \\mathbf{${fmt(S.P, 2)}\\text{ kW}}`,
            val: S.P
          };
        }
        return {
          target: targetLabel(getVarName(S, "P"), "{{P}}", u_P),
          text: "Horsepower from tangential load and pitch velocity ($P = \\cfrac{F_t v}{33000}$):",
          eq: `P = F_t \\cdot v = (${fmt(S.W_t, 0)}\\text{ lb})(${fmt(S.V_m, 1)}\\text{ ft/min}) \\cdot \\cfrac{1\\text{ hp}}{33000\\text{ ft}\\cdot\\text{lb/min}} = \\mathbf{${fmt(S.P, 2)}\\text{ hp}}`,
          val: S.P
        };
      }
      if (target === "V_m") {
        if (isSI) {
          return {
            target: targetLabel(getVarName(S, "V_m"), "{{v|V_m}}", u_v),
            text: "Pitch speed from power and load ($v = \\cfrac{P}{F_t}$):",
            eq: `v = \\cfrac{P}{F_t} = \\cfrac{${fmt(S.P, 2)}\\cancel{\\text{ kW}} \\cdot \\cfrac{1000\\text{ N}\\cdot\\text{m/s}}{1\\cancel{\\text{ kW}}}}{${fmt(S.W_t, 0)}\\text{ N}} = \\mathbf{${fmt(S.V_m, 2)}\\text{ m/s}}`,
            val: S.V_m
          };
        }
        return {
          target: targetLabel(getVarName(S, "V_m"), "{{v|V_m}}", u_v),
          text: "Pitch speed from power and load ($v = \\cfrac{P}{F_t}$):",
          eq: `v = \\cfrac{P}{F_t} = \\cfrac{${fmt(S.P, 2)}\\cancel{\\text{ hp}} \\cdot \\cfrac{33000\\text{ lb}\\cdot\\text{ft/min}}{1\\cancel{\\text{ hp}}}}{${fmt(S.W_t, 0)}\\text{ lb}} = \\mathbf{${fmt(S.V_m, 1)}\\text{ ft/min}}`,
          val: S.V_m
        };
      }
    }
  },

  // 23. Radial Force Relation
  {
    id: "eq_wr_wt",
    name: "Radial Force Relation",
    canonical: { lhs: "F_r", rhs: "F_t * tan(phi)", tex: "F_r = F_t \\tan\\phi" },
    baseFormula: "F_r = F_t \\tan\\phi",
    nodes: ["W_r", "W_t", "phi"],
    topic: "forces_torque",
    termsCount: 3,
    forms: {
      W_r: { formula: "F_r = F_t \\tan\\phi", notes: "Separating radial force pushing shafts apart" },
      W_t: { formula: "F_t = \\cfrac{F_r}{\\tan\\phi}", notes: "Tangential drive force derived from radial reaction" },
      phi: { formula: "\\phi = \\tan^{-1}\\left(\\cfrac{F_r}{F_t}\\right)", notes: "Operating pressure angle from force vector components" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "W_r");
      if (target === "W_r") {
        return {
          target: targetLabel(getVarName(S, "W_r"), "{{F_r|W_r}}", u),
          text: `Separating force toward shaft center ($F_r = F_t \\tan\\phi$):`,
          eq: `F_r = F_t \\tan(${fmt(S.phi, 1)}°) = ${fmt(S.W_t, 0)} \\times \\tan(${fmt(S.phi, 1)}°) = \\mathbf{${fmt(S.W_r, 0)}\\text{ ${u}}}`,
          val: S.W_r
        };
      }
      if (target === "W_t") {
        return {
          target: targetLabel(getVarName(S, "W_t"), "{{F_t|W_t}}", u),
          text: `Drive force derived from radial reaction ($F_t = \\cfrac{F_r}{\\tan\\phi}$):`,
          eq: `F_t = \\cfrac{F_r}{\\tan(${fmt(S.phi, 1)}°)} = \\cfrac{${fmt(S.W_r, 0)}}{\\tan(${fmt(S.phi, 1)}°)} = \\mathbf{${fmt(S.W_t, 0)}\\text{ ${u}}}`,
          val: S.W_t
        };
      }
      if (target === "phi") {
        return {
          target: targetLabel(getVarName(S, "phi"), "{{\\phi|phi}}", "deg"),
          text: "Pressure angle from radial and tangential forces:",
          eq: `\\phi = \\tan^{-1}\\left(\\cfrac{F_r}{F_t}\\right) = \\tan^{-1}\\left(\\cfrac{${fmt(S.W_r, 0)}}{${fmt(S.W_t, 0)}}\\right) = \\mathbf{${fmt(S.phi, 1)}°}`,
          val: S.phi
        };
      }
    }
  },

  // 24. Normal Contact Load Vector
  {
    id: "eq_w_normal",
    name: "Normal Contact Load Vector",
    canonical: { lhs: "F_t", rhs: "F_n * cos(phi)", tex: "F_t = F_n \\cos\\phi" },
    baseFormula: "F_n = \\cfrac{F_t}{\\cos\\phi}",
    nodes: ["W", "W_t", "phi"],
    topic: "forces_torque",
    termsCount: 3,
    forms: {
      W:   { formula: "F_n = \\cfrac{F_t}{\\cos\\phi}", notes: "Total normal load acting along line of action" },
      W_t: { formula: "F_t = F_n \\cos\\phi", notes: "Drive force resolved from normal contact force" },
      phi: { formula: "\\phi = \\cos^{-1}\\left(\\cfrac{F_t}{F_n}\\right)", notes: "Pressure angle from normal force resolution" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "W");
      if (target === "W") {
        return {
          target: targetLabel(getVarName(S, "W"), "{{F_n|W}}", u),
          text: `Total force transmitted along line of action ($F_n = \\cfrac{F_t}{\\cos\\phi}$):`,
          eq: `F_n = \\cfrac{F_t}{\\cos(${fmt(S.phi, 1)}°)} = \\cfrac{${fmt(S.W_t, 0)}}{\\cos(${fmt(S.phi, 1)}°)} = \\mathbf{${fmt(S.W, 0)}\\text{ ${u}}}`,
          val: S.W
        };
      }
      if (target === "W_t") {
        return {
          target: targetLabel(getVarName(S, "W_t"), "{{F_t|W_t}}", u),
          text: `Tangential load resolved from contact normal load ($F_t = F_n \\cos\\phi$):`,
          eq: `F_t = F_n \\cos(${fmt(S.phi, 1)}°) = ${fmt(S.W, 0)} \\times \\cos(${fmt(S.phi, 1)}°) = \\mathbf{${fmt(S.W_t, 0)}\\text{ ${u}}}`,
          val: S.W_t
        };
      }
      if (target === "phi") {
        return {
          target: targetLabel(getVarName(S, "phi"), "{{\\phi|phi}}", "deg"),
          text: "Pressure angle from contact normal and drive force:",
          eq: `\\phi = \\cos^{-1}\\left(\\cfrac{F_t}{F_n}\\right) = \\cos^{-1}\\left(\\cfrac{${fmt(S.W_t, 0)}}{${fmt(S.W_t, 0)}}\\right) = \\mathbf{${fmt(S.phi, 1)}°}`,
          val: S.phi
        };
      }
    }
  },

  // 25. Full-Depth Addendum
  {
    id: "eq_addendum",
    name: "Full-Depth Addendum",
    canonical: { lhs: "a", rhs: "1 / P_d", tex: "a = \\cfrac{1}{P_d}" },
    baseFormula: "a = \\cfrac{1}{P_d}",
    nodes: ["a", "P_d"],
    topic: "pitch_geometry",
    termsCount: 2,
    forms: {
      a:   { formula: "a = m \\quad\\text{or}\\quad \\cfrac{1}{P_d}", notes: "Standard full-depth tooth addendum" },
      P_d: { formula: "P_d = \\cfrac{1}{a}", notes: "Diametral pitch from tooth addendum" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "a");
      const isSI = S.sys === "SI" || u === "mm";
      if (target === "a") {
        return {
          target: targetLabel(getVarName(S, "a"), "{{a}}", u),
          text: isSI
            ? `Standard full-depth addendum equals module ($a = m$):`
            : `Standard full-depth addendum proportion ($a = \\cfrac{1}{P_d}$):`,
          eq: isSI
            ? `a = m = \\mathbf{${fmt(S.a, 3)}\\text{ mm}}`
            : `a = \\cfrac{1}{P_d} = \\cfrac{1}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.a, 4)}\\text{ in}}`,
          val: S.a
        };
      }
      if (target === "P_d") {
        return {
          target: targetLabel(getVarName(S, "P_d"), "{{P_d}}", "teeth/in"),
          text: isSI
            ? `From metric addendum with inch conversion:`
            : `From standard full-depth addendum ($P_d = \\cfrac{1}{a}$):`,
          eq: isSI
            ? `P_d = \\cfrac{1}{a} = \\cfrac{1}{${fmt(S.a, 2)}\\cancel{\\text{ mm}}} \\cdot \\cfrac{25.4\\cancel{\\text{ mm}}}{1\\text{ in}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ teeth/in}}`
            : `P_d = \\cfrac{1}{a} = \\cfrac{1}{${fmt(S.a, 4)}\\text{ in}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ teeth/in}}`,
          val: S.P_d
        };
      }
    }
  },

  // 26. Tooth Clearance Proportion
  {
    id: "eq_clearance",
    name: "Tooth Clearance Proportion",
    canonical: { lhs: "c", rhs: "k_c / P_d", tex: "c = \\cfrac{k_c}{P_d}" },
    baseFormula: "c = \\cfrac{k_c}{P_d}",
    nodes: ["c", "P_d", "phi"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      c:   { formula: "c = k_c m \\quad\\text{or}\\quad \\cfrac{k_c}{P_d}", notes: "Clearance: k_c = 0.157 (14.5°) or 0.25 (20°)" },
      P_d: { formula: "P_d = \\cfrac{k_c}{c}", notes: "Diametral pitch from clearance" }
    },
    solve: (target, S) => {
      const factor = S.phi === 14.5 ? 0.157 : 0.25;
      const u = unitOf(S, "c");
      const isSI = S.sys === "SI" || u === "mm";
      if (target === "c") {
        return {
          target: targetLabel(getVarName(S, "c"), "{{c}}", u),
          text: `Standard clearance for ${fmt(S.phi, 1)}° teeth:`,
          eq: isSI
            ? `c = ${factor} m = ${factor}(${fmt(S.m, 2)}) = \\mathbf{${fmt(S.c, 3)}\\text{ mm}}`
            : `c = \\cfrac{${factor}}{P_d} = \\cfrac{${factor}}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.c, 4)}\\text{ in}}`,
          val: S.c
        };
      }
      if (target === "P_d") {
        return {
          target: targetLabel(getVarName(S, "P_d"), "{{P_d}}", "teeth/in"),
          text: isSI
            ? `Pitch from metric clearance with inch conversion:`
            : `Pitch from clearance proportion:`,
          eq: isSI
            ? `P_d = \\cfrac{${factor}}{c} = \\cfrac{${factor}}{${fmt(S.c, 3)}\\cancel{\\text{ mm}}} \\cdot \\cfrac{25.4\\cancel{\\text{ mm}}}{1\\text{ in}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ teeth/in}}`
            : `P_d = \\cfrac{${factor}}{c} = \\cfrac{${factor}}{${fmt(S.c, 4)}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ teeth/in}}`,
          val: S.P_d
        };
      }
    }
  },

  // 27. Outside Blank Diameter
  {
    id: "eq_do",
    name: "Outside Blank Diameter",
    canonical: { lhs: "D_o", rhs: "D_1 + 2*a", tex: "D_o = D_1 + 2a" },
    baseFormula: "D_o = D_1 + 2a",
    nodes: ["D_o", "D_P1", "a"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      D_o:  { formula: "D_o = D_1 + 2a", notes: "Outside cylinder diameter adding twice addendum" },
      D_P1: { formula: "D_1 = D_o - 2a", notes: "Pitch diameter from blank outside diameter" },
      a:    { formula: "a = \\cfrac{D_o - D_1}{2}", notes: "Addendum from blank diameter" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "D_o");
      if (target === "D_o") {
        return {
          target: targetLabel(getVarName(S, "D_o"), "{{D_o}}", u),
          text: "Blank outer diameter adding twice addendum ($D_o = D_1 + 2a$):",
          eq: `D_o = D_1 + 2a = ${fmt(S.D_P1, 2)} + 2(${fmt(S.a, 3)}) = \\mathbf{${fmt(S.D_o, 2)}\\text{ ${u}}}`,
          val: S.D_o
        };
      }
      if (target === "D_P1") {
        return {
          target: targetLabel(getVarName(S, "D_P1"), "{{D_1|D_P1}}", u),
          text: "Pitch diameter from blank diameter ($D_1 = D_o - 2a$):",
          eq: `D_1 = D_o - 2a = ${fmt(S.D_o, 2)} - 2(${fmt(S.a, 3)}) = \\mathbf{${fmt(S.D_P1, 2)}\\text{ ${u}}}`,
          val: S.D_P1
        };
      }
      if (target === "a") {
        return {
          target: targetLabel(getVarName(S, "a"), "{{a}}", u),
          text: "Addendum from outer and pitch diameters ($a = \\cfrac{D_o - D_1}{2}$):",
          eq: `a = \\cfrac{D_o - D_1}{2} = \\cfrac{${fmt(S.D_o, 2)} - ${fmt(S.D_P1, 2)}}{2} = \\mathbf{${fmt(S.a, 3)}\\text{ ${u}}}`,
          val: S.a
        };
      }
    }
  },

  // 28. Blank Diameter from Teeth
  {
    id: "eq_do_teeth",
    name: "Blank Diameter from Teeth",
    canonical: { lhs: "D_o", rhs: "(T_1 + 2)/P_d", tex: "D_o = \\cfrac{T_1 + 2}{P_d}" },
    baseFormula: "D_o = \\cfrac{T_1 + 2}{P_d}",
    nodes: ["D_o", "T_1", "P_d"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      D_o: { formula: "D_o = m(T_1 + 2) \\quad\\text{or}\\quad \\cfrac{T_1 + 2}{P_d}", notes: "Blank diameter directly from teeth" },
      P_d: { formula: "P_d = \\cfrac{T_1 + 2}{D_o}", notes: "Diametral pitch from teeth and blank diameter" },
      T_1: { formula: "T_1 = D_o P_d - 2", notes: "Tooth count from blank diameter and pitch" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "D_o");
      const isSI = S.sys === "SI" || u === "mm";
      if (target === "D_o") {
        return {
          target: targetLabel(getVarName(S, "D_o"), "{{D_o}}", u),
          text: isSI
            ? `Blank outer diameter from teeth and module ($D_o = m(T_1 + 2)$):`
            : `Blank outer diameter from teeth count ($D_o = \\cfrac{T_1 + 2}{P_d}$):`,
          eq: isSI
            ? `D_o = m(T_1 + 2) = ${fmt(S.m, 2)}(${fmt(S.T_1, 0)} + 2) = \\mathbf{${fmt(S.D_o, 1)}\\text{ mm}}`
            : `D_o = \\cfrac{T_1 + 2}{P_d} = \\cfrac{${fmt(S.T_1, 0)} + 2}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(S.D_o, 3)}\\text{ in}}`,
          val: S.D_o
        };
      }
      if (target === "P_d") {
        return {
          target: targetLabel(getVarName(S, "P_d"), "{{P_d}}", "teeth/in"),
          text: isSI
            ? `Pitch from teeth and metric blank diameter with dimensional conversion:`
            : `Pitch from teeth and outside blank diameter ($P_d = \\cfrac{T_1 + 2}{D_o}$):`,
          eq: isSI
            ? `P_d = \\cfrac{T_1 + 2}{D_o} = \\cfrac{${fmt(S.T_1, 0)} + 2}{${fmt(S.D_o, 1)}\\cancel{\\text{ mm}}} \\cdot \\cfrac{25.4\\cancel{\\text{ mm}}}{1\\text{ in}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ teeth/in}}`
            : `P_d = \\cfrac{T_1 + 2}{D_o} = \\cfrac{${fmt(S.T_1, 0)} + 2}{${fmt(S.D_o, 3)}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ teeth/in}}`,
          val: S.P_d
        };
      }
      if (target === "T_1") {
        return {
          target: targetLabel(getVarName(S, "T_1"), "{{T_1|T}}", "teeth"),
          text: isSI
            ? `Teeth count from blank diameter ($T_1 = \\cfrac{D_o}{m} - 2$):`
            : `Teeth count from blank diameter ($T_1 = D_o P_d - 2$):`,
          eq: isSI
            ? `T_1 = \\cfrac{D_o}{m} - 2 = \\cfrac{${fmt(S.D_o, 1)}}{${fmt(S.m, 2)}} - 2 = \\mathbf{${fmt(S.T_1, 0)}\\text{ teeth}}`
            : `T_1 = D_o \\cdot P_d - 2 = (${fmt(S.D_o, 3)} \\times ${fmt(S.P_d, 2)}) - 2 = \\mathbf{${fmt(S.T_1, 0)}\\text{ teeth}}`,
          val: S.T_1
        };
      }
    }
  },

  // 29. Base Circle Diameter
  {
    id: "eq_db",
    name: "Base Circle Diameter",
    canonical: { lhs: "D_b", rhs: "D_1 * cos(phi)", tex: "D_b = D_1 \\cos\\phi" },
    baseFormula: "D_b = D_1 \\cos\\phi",
    nodes: ["D_b", "D_P1", "phi"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      D_b:  { formula: "D_b = D_1 \\cos\\phi", notes: "Base diameter generating the tooth involute" },
      D_P1: { formula: "D_1 = \\cfrac{D_b}{\\cos\\phi}", notes: "Pitch diameter from base diameter" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "D_b");
      if (target === "D_b") {
        return {
          target: targetLabel(getVarName(S, "D_b"), "{{D_b}}", u),
          text: `Base circle diameter generating tooth involute ($D_b = D_1 \\cos\\phi$):`,
          eq: `D_b = D_1 \\cos(${fmt(S.phi, 1)}°) = ${fmt(S.D_P1, 2)} \\times \\cos(${fmt(S.phi, 1)}°) = \\mathbf{${fmt(S.D_b, 2)}\\text{ ${u}}}`,
          val: S.D_b
        };
      }
      if (target === "D_P1") {
        return {
          target: targetLabel(getVarName(S, "D_P1"), "{{D_1|D_P1}}", u),
          text: `Pitch diameter from base circle diameter ($D_1 = \\cfrac{D_b}{\\cos\\phi}$):`,
          eq: `D_1 = \\cfrac{D_b}{\\cos(${fmt(S.phi, 1)}°)} = \\cfrac{${fmt(S.D_b, 2)}}{\\cos(${fmt(S.phi, 1)}°)} = \\mathbf{${fmt(S.D_P1, 2)}\\text{ ${u}}}`,
          val: S.D_P1
        };
      }
    }
  },

  // 30. Lewis Beam Bending Strength — Pure Mechanics: s = F_t / (b · m · Y)
  {
    id: "eq_lewis",
    name: "Lewis Beam Bending Strength",
    canonical: { lhs: "s", rhs: "(F_t * P_d) / (b * Y)", tex: "s = \\cfrac{F_t P_d}{b Y}" },
    baseFormula: "s = \\cfrac{F_t}{b \\cdot m \\cdot Y}",
    nodes: ["s", "W_t", "P_d", "b", "Y"],
    topic: "lewis_strength",
    termsCount: 5,
    forms: {
      s:   { formula: "s = \\cfrac{F_t}{b \\cdot m \\cdot Y} \\quad\\text{or}\\quad \\cfrac{F_t P_d}{b Y}", notes: "Induced tensile bending stress at tooth root" },
      W_t: { formula: "F_t = s \\cdot b \\cdot m \\cdot Y", notes: "Permissible transmitted load capacity" },
      P_d: { formula: "P_d = \\cfrac{s \\cdot b \\cdot Y}{F_t}", notes: "Required diametral pitch" },
      b:   { formula: "b = \\cfrac{F_t}{s \\cdot m \\cdot Y}", notes: "Minimum required face width" }
    },
    solve: (target, S) => {
      const u_s = unitOf(S, "s");
      const u_F = unitOf(S, "W_t");
      const u_b = unitOf(S, "b");
      const isSI = S.sys === "SI" || u_s === "MPa";

      if (target === "s") {
        return {
          target: targetLabel(getVarName(S, "s"), "{{s}}", u_s),
          text: isSI
            ? `Applying the Lewis formula in SI ($1\\text{ N/mm}^2 = 1\\text{ MPa}$):`
            : `Applying the Lewis beam bending stress formula ($s = \\cfrac{F_t P_d}{b Y}$):`,
          eq: isSI
            ? `s = \\cfrac{F_t}{b \\cdot m \\cdot Y} = \\cfrac{${fmt(S.W_t, 0)}\\text{ N}}{(${fmt(S.b, 1)}\\text{ mm}) (${fmt(S.m, 2)}\\text{ mm}) (${fmt(S.Y, 3)})} = \\cfrac{${fmt(S.W_t, 0)}}{${fmt(S.b * S.m * S.Y, 2)}}\\cfrac{\\text{N}}{\\text{mm}^2} = \\mathbf{${fmt(S.s, 0)}\\text{ MPa}}`
            : `s = \\cfrac{F_t \\cdot P_d}{b \\cdot Y} = \\cfrac{(${fmt(S.W_t, 0)}\\text{ lb}) (${fmt(S.P_d, 2)}\\text{ in}^{-1})}{(${fmt(S.b, 2)}\\text{ in}) (${fmt(S.Y, 3)})} = \\mathbf{${fmt(S.s, 0)}\\text{ psi}}`,
          val: S.s
        };
      }
      if (target === "W_t") {
        return {
          target: targetLabel(getVarName(S, "W_t"), "{{F_t|W_t}}", u_F),
          text: "Tangential load capacity from allowable stress limit:",
          eq: isSI
            ? `F_t = s \\cdot b \\cdot m \\cdot Y = \\left(${fmt(S.s, 0)}\\cfrac{\\text{N}}{\\cancel{\\text{mm}^2}}\\right) (${fmt(S.b, 1)}\\cancel{\\text{ mm}}) (${fmt(S.m, 2)}\\cancel{\\text{ mm}}) (${fmt(S.Y, 3)}) = \\mathbf{${fmt(S.W_t, 0)}\\text{ N}}`
            : `F_t = \\cfrac{s \\cdot b \\cdot Y}{P_d} = \\cfrac{(${fmt(S.s, 0)}\\text{ psi}) (${fmt(S.b, 2)}\\text{ in}) (${fmt(S.Y, 3)})}{${fmt(S.P_d, 2)}\\text{ in}^{-1}} = \\mathbf{${fmt(S.W_t, 0)}\\text{ lb}}`,
          val: S.W_t
        };
      }
      if (target === "b") {
        return {
          target: targetLabel(getVarName(S, "b"), "{{b}}", u_b),
          text: "Minimum face width to sustain induced bending stress:",
          eq: isSI
            ? `b = \\cfrac{F_t}{s \\cdot m \\cdot Y} = \\cfrac{${fmt(S.W_t, 0)}\\cancel{\\text{ N}}}{\\left(${fmt(S.s, 0)}\\cfrac{\\cancel{\\text{N}}}{\\text{mm}^{\\cancel{2}}}\\right) (${fmt(S.m, 2)}\\cancel{\\text{ mm}}) (${fmt(S.Y, 3)})} = \\mathbf{${fmt(S.b, 1)}\\text{ mm}}`
            : `b = \\cfrac{F_t \\cdot P_d}{s \\cdot Y} = \\cfrac{(${fmt(S.W_t, 0)}) (${fmt(S.P_d, 2)})}{(${fmt(S.s, 0)}) (${fmt(S.Y, 3)})} = \\mathbf{${fmt(S.b, 2)}\\text{ in}}`,
          val: S.b
        };
      }
      if (target === "P_d") {
        if (isSI) {
          const calc_m = parseFloat((S.W_t / (S.s * S.b * S.Y)).toFixed(3));
          return {
            target: targetLabel(getVarName(S, "P_d"), "{{P_d}}", "teeth/in"),
            text: `Solve for metric module $m = \\cfrac{F_t}{s \\cdot b \\cdot Y}$ then convert to diametral pitch:`,
            eq: `m = \\cfrac{${fmt(S.W_t, 0)}}{(${fmt(S.s, 0)})(${fmt(S.b, 1)})(${fmt(S.Y, 3)})} = ${calc_m}\\text{ mm} \\implies P_d = \\cfrac{25.4}{${calc_m}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ teeth/in}}`,
            val: S.P_d
          };
        }
        return {
          target: targetLabel(getVarName(S, "P_d"), "{{P_d}}", "teeth/in"),
          text: "Diametral pitch from Lewis stress balance ($P_d = \\cfrac{s b Y}{F_t}$):",
          eq: `P_d = \\cfrac{s \\cdot b \\cdot Y}{F_t} = \\cfrac{(${fmt(S.s, 0)}) (${fmt(S.b, 2)}) (${fmt(S.Y, 3)})}{${fmt(S.W_t, 0)}} = \\mathbf{${fmt(S.P_d, 2)}\\text{ teeth/in}}`,
          val: S.P_d
        };
      }
    }
  },

  // 31. Circular Tooth Thickness
  {
    id: "eq_thick",
    name: "Circular Tooth Thickness",
    canonical: { lhs: "t", rhs: "P_c / 2", tex: "t = \\cfrac{P_c}{2}" },
    baseFormula: "t = \\cfrac{P_c}{2} = \\cfrac{\\pi}{2 P_d}",
    nodes: ["t", "P_c"],
    topic: "pitch_geometry",
    termsCount: 2,
    forms: {
      t:   { formula: "t = \\cfrac{P_c}{2}", notes: "Tooth thickness on pitch circle" },
      P_c: { formula: "P_c = 2t", notes: "Circular pitch from tooth thickness" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "t");
      if (target === "t") {
        return {
          target: targetLabel(getVarName(S, "t"), "{{t}}", u),
          text: "Tooth thickness on pitch circle is half circular pitch ($t = \\cfrac{P_c}{2}$):",
          eq: `t = \\cfrac{P_c}{2} = \\cfrac{${fmt(S.P_c, 3)}}{2} = \\mathbf{${fmt(S.t, 3)}\\text{ ${u}}}`,
          val: S.t
        };
      }
      if (target === "P_c") {
        return {
          target: targetLabel(getVarName(S, "P_c"), "{{P_c}}", u),
          text: "Circular pitch from tooth thickness ($P_c = 2t$):",
          eq: `P_c = 2t = 2(${fmt(S.t, 3)}) = \\mathbf{${fmt(S.P_c, 3)}\\text{ ${u}}}`,
          val: S.P_c
        };
      }
    }
  },

  // 32. Whole Depth
  {
    id: "eq_whole",
    name: "Whole Depth",
    canonical: { lhs: "h", rhs: "2*a + c", tex: "h = 2a + c" },
    baseFormula: "h = 2a + c",
    nodes: ["h", "a", "c"],
    topic: "pitch_geometry",
    termsCount: 3,
    forms: {
      h: { formula: "h = 2a + c", notes: "Total tooth depth adding twice addendum plus clearance" },
      c: { formula: "c = h - 2a", notes: "Clearance from whole depth" },
      a: { formula: "a = \\cfrac{h - c}{2}", notes: "Addendum from whole depth" }
    },
    solve: (target, S) => {
      const u = unitOf(S, "h");
      if (target === "h") {
        return {
          target: targetLabel(getVarName(S, "h"), "{{h}}", u),
          text: "Total tooth depth adding twice addendum plus clearance ($h = 2a + c$):",
          eq: `h = 2a + c = 2(${fmt(S.a, 3)}) + ${fmt(S.c, 3)} = \\mathbf{${fmt(S.h, 3)}\\text{ ${u}}}`,
          val: S.h
        };
      }
      if (target === "c") {
        return {
          target: targetLabel(getVarName(S, "c"), "{{c}}", u),
          text: "Clearance subtracting twice addendum from whole depth ($c = h - 2a$):",
          eq: `c = h - 2a = ${fmt(S.h, 3)} - 2(${fmt(S.a, 3)}) = \\mathbf{${fmt(S.c, 3)}\\text{ ${u}}}`,
          val: S.c
        };
      }
    }
  }
];

// ========================================================
// 3. GROUND TRUTH GENERATOR (40% US, 40% SI, 20% MIXED)
// ========================================================
function createGroundTruthSystem() {
  const modeRoll = Math.random();
  const sys = modeRoll < 0.40 ? "US" : (modeRoll < 0.80 ? "SI" : "MIXED");
  const phi = [14.5, 20][Math.floor(Math.random() * 2)];
  const kc = phi === 14.5 ? 0.157 : 0.25;
  const T_1 = [16, 18, 20, 24, 25, 28, 30, 32][Math.floor(Math.random() * 8)];
  const VR_target = [2, 2.5, 3, 4][Math.floor(Math.random() * 4)];
  const T_2 = Math.round(T_1 * VR_target);
  const VR = parseFloat((T_2 / T_1).toFixed(2));
  const Y_TABLE = { 16: 0.255, 18: 0.270, 20: 0.284, 24: 0.305, 25: 0.310, 28: 0.325, 30: 0.330, 32: 0.340 };
  const Y = Y_TABLE[T_1] || 0.300;

  const _names = {};
  Object.keys(GEAR_VARS_DB).forEach(k => {
    const meta = GEAR_VARS_DB[k];
    if (meta.aliases && meta.aliases.length > 0) {
      _names[k] = meta.aliases[Math.floor(Math.random() * meta.aliases.length)];
    } else {
      _names[k] = meta.name;
    }
  });

  let S = {};

  if (sys === "SI" || (sys === "MIXED" && Math.random() < 0.5)) {
    const m = [2, 2.5, 3, 4, 5, 6, 8][Math.floor(Math.random() * 7)];
    const P_d = parseFloat((25.4 / m).toFixed(2));
    const n_1 = [350, 600, 900, 1150, 1200, 1750, 1800][Math.floor(Math.random() * 7)];
    const n_2 = parseFloat((n_1 / VR).toFixed(1));
    const D_P1 = parseFloat((T_1 * m).toFixed(1));
    const D_P2 = parseFloat((T_2 * m).toFixed(1));
    const C = parseFloat(((D_P1 + D_P2) / 2).toFixed(1));
    const P_c = parseFloat((Math.PI * m).toFixed(3));
    const a = parseFloat((1.0 * m).toFixed(3));
    const c = parseFloat((kc * m).toFixed(3));
    const d = parseFloat((a + c).toFixed(3));
    const D_o = parseFloat((D_P1 + 2 * a).toFixed(1));
    const D_b = parseFloat((D_P1 * Math.cos((phi * Math.PI) / 180)).toFixed(1));
    const t = parseFloat((P_c / 2).toFixed(3));
    const h = parseFloat((2 * a + c).toFixed(3));
    const h_k = parseFloat((2 * a).toFixed(3));
    const B = parseFloat((0.035 * m).toFixed(3));
    const p_b = parseFloat((P_c * Math.cos((phi * Math.PI) / 180)).toFixed(3));
    const b = parseFloat((10 * m).toFixed(1));
    const C_i = parseFloat((2 * D_P1).toFixed(1));

    const V_m = parseFloat(((Math.PI * (D_P1 / 1000) * n_1) / 60).toFixed(2)); // m/s
    const P = [5, 10, 15, 20, 25, 30, 45, 55, 75][Math.floor(Math.random() * 9)]; // kW
    const W_t = Math.round((1000 * P) / V_m); // N
    const M_t = parseFloat(((W_t * (D_P1 / 1000)) / 2).toFixed(2)); // N*m (Standard 2 decimals)
    const W_r = parseFloat((W_t * Math.tan((phi * Math.PI) / 180)).toFixed(1));
    const W = parseFloat((W_t / Math.cos((phi * Math.PI) / 180)).toFixed(1));
    const s = Math.round(W_t / (b * m * Y)); // MPa
    const C_d = [140, 210, 280, 350][Math.floor(Math.random() * 4)]; // N/mm
    const k_buck = 21;
    const num_fd = k_buck * V_m * (b * C_d + W_t);
    const den_fd = k_buck * V_m + Math.sqrt(b * C_d + W_t);
    const F_D = parseFloat((W_t + num_fd / den_fd).toFixed(1));

    const _u = {
      D_P1: "mm", D_P2: "mm", C: "mm", a: "mm", d: "mm", c: "mm", h: "mm", t: "mm",
      D_o: "mm", D_b: "mm", b: "mm", h_k: "mm", B: "mm", p_b: "mm", C_i: "mm", P_c: "mm",
      V_m: "m/s", P: "kW", M_t: "N-m", W_t: "N", W_r: "N", W: "N", F_D: "N",
      C_d: "N/mm", s: "MPa", m: "mm", phi: "deg", n_1: "rpm", n_2: "rpm", P_d: "teeth/in"
    };

    if (sys === "MIXED") {
      _u["P"] = "hp";
    }

    S = {
      sys, P_d, phi, T_1, T_2, VR, n_1, n_2,
      P: _u["P"] === "hp" ? parseFloat((P * 1.341).toFixed(1)) : P,
      P_c, D_P1, D_P2, C, V_m, M_t, W_t, W_r, W, a, d, c, D_o, D_b, Y, b, s, t, h,
      F_D, C_d, h_k, B, p_b, m, C_i, _u, _names
    };
  } else {
    const P_d = [2, 3, 4, 5, 6, 8, 10, 12][Math.floor(Math.random() * 8)];
    const n_1 = [350, 600, 900, 1150, 1200, 1750, 1800, 3600][Math.floor(Math.random() * 8)];
    const n_2 = parseFloat((n_1 / VR).toFixed(1));
    const b = [1.5, 1.75, 2.0, 2.25, 2.5, 3.0][Math.floor(Math.random() * 6)];
    const D_P1 = parseFloat((T_1 / P_d).toFixed(3));
    const D_P2 = parseFloat((T_2 / P_d).toFixed(3));
    const C = parseFloat(((D_P1 + D_P2) / 2).toFixed(3));
    const P_c = parseFloat((Math.PI / P_d).toFixed(4));
    const a = parseFloat((1 / P_d).toFixed(4));
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

    const V_m = Math.round((Math.PI * (D_P1 / 12) * n_1)); // ft/min
    const W_t_seed = [120, 150, 180, 200, 250, 300, 350, 400, 500, 600, 750, 900][Math.floor(Math.random() * 12)];
    const raw_s = (W_t_seed * P_d) / (b * Y);
    const s = Math.round(raw_s / 25) * 25;
    const W_t = parseFloat(((s * b * Y) / P_d).toFixed(1)); // lb
    const M_t = parseFloat(((W_t * D_P1) / 2).toFixed(2)); // lb-in (Standard 2 decimals)
    const P = parseFloat(((W_t * V_m) / 33000).toFixed(2)); // hp
    const W_r = parseFloat((W_t * Math.tan((phi * Math.PI) / 180)).toFixed(1));
    const W = parseFloat((W_t / Math.cos((phi * Math.PI) / 180)).toFixed(1));
    const C_d = [800, 1200, 1600, 2000][Math.floor(Math.random() * 4)];
    const k_buck = 0.05;
    const num_fd = k_buck * V_m * (b * C_d + W_t);
    const den_fd = k_buck * V_m + Math.sqrt(b * C_d + W_t);
    const F_D = parseFloat((W_t + num_fd / den_fd).toFixed(1));

    const _u = {
      D_P1: "in", D_P2: "in", C: "in", a: "in", d: "in", c: "in", h: "in", t: "in",
      D_o: "in", D_b: "in", b: "in", h_k: "in", B: "in", p_b: "in", C_i: "in", P_c: "in",
      V_m: "ft/min", P: "hp", M_t: "lb-in", W_t: "lb", W_r: "lb", W: "lb", F_D: "lb",
      C_d: "lb/in", s: "psi", m: "mm", phi: "deg", n_1: "rpm", n_2: "rpm", P_d: "teeth/in"
    };

    if (sys === "MIXED") {
      _u["D_P1"] = "mm";
    }

    S = {
      sys, P_d, phi, T_1, T_2, VR, n_1, n_2, P, P_c,
      D_P1: _u["D_P1"] === "mm" ? parseFloat((D_P1 * 25.4).toFixed(1)) : D_P1,
      D_P2, C, V_m, M_t, W_t, W_r, W, a, d, c, D_o, D_b, Y, b, s, t, h,
      F_D, C_d, h_k, B, p_b, m, C_i, _u, _names
    };
  }

  return S;
}

// ========================================================
// 4. SEED LIBRARY & CLASS SAMPLE PROBLEM ARCHETYPES
// ========================================================
const ORGANIC_SEED_PATTERNS = [
  { name: "Buckingham Maximum Dynamic Load", givens: ["W_t", "V_m", "b", "C_d"], topic: "forces_torque", goals: ["F_D"] },
  { name: "Tooth Thickness with Exam Distractors (Slide 6)", givens: ["P_c", "h", "phi"], topic: "pitch_geometry", goals: ["t"] },
  { name: "Tooth Clearance from Pitch", givens: ["P_d", "phi"], topic: "pitch_geometry", goals: ["c"] },
  { name: "Internal Gearing with Idler Gear", givens: ["D_P1", "C_i"], topic: "speed_center", goals: ["D_P2"] },
  { name: "Base Pitch from Involute Geometry", givens: ["P_c", "phi"], topic: "pitch_geometry", goals: ["p_b"] },
  { name: "Tooth Proportions Suite", givens: ["P_d", "phi"], topic: "pitch_geometry", goals: ["h_k", "d", "B", "m"] },
  { name: "Motor Power to Shaft Torque & Load", givens: ["P", "n_1", "D_P1", "phi"], topic: "forces_torque", goals: ["M_t", "W_r", "W", "D_b"] },
  { name: "Shaft Torque and RPM to Motor Power", givens: ["M_t", "n_1", "D_P1"], topic: "forces_torque", goals: ["P", "W_t", "V_m"] },
  { name: "Reverse Dynamics: Contact Load to Power", givens: ["W", "phi", "V_m", "n_1"], topic: "forces_torque", goals: ["P", "W_r", "M_t", "D_b"] },
  { name: "Radial Reaction to Pinion Torque", givens: ["W_r", "phi", "D_P1", "n_1"], topic: "forces_torque", goals: ["M_t", "P", "W", "D_b"] },
  { name: "Lewis Limit to Gear Blank", givens: ["s", "b", "Y", "W_t", "T_1"], topic: "lewis_strength", goals: ["P_d", "D_P1", "D_o", "M_t"] },
  { name: "Center Distance to Pitch Line Speed", givens: ["C", "VR", "P_d", "n_1"], topic: "speed_center", goals: ["V_m", "D_P1", "T_2", "n_2"] }
];

// ========================================================
// 5. UNIFIED TOPIC DEFINITION (EXPORT TO ENGINE)
// ========================================================
window.CURRENT_TOPIC = {
  id: "spur_gears",
  title: "Spur Gears",
  varsDb: GEAR_VARS_DB,
  relations: GEAR_RELATION_GRAPH,
  seeds: ORGANIC_SEED_PATTERNS,
  createSystem: createGroundTruthSystem
};
