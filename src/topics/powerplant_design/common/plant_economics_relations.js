export const PLANT_ECONOMICS_RELATIONS = Object.freeze([
  { id: "eq_pe_lf", name: "Load Factor", canonicalTex: "LF = \\frac{P_{avg}}{P_{max}}", baseFormula: "LF = Avg_Load / Max_Load", nodes: ["LF", "Avg_Load", "Max_Load"] },
  { id: "eq_pe_cf", name: "Capacity Factor", canonicalTex: "CF = \\frac{P_{avg}}{C_{rated}}", baseFormula: "CF = Avg_Load / Rated_Cap", nodes: ["CF", "Avg_Load", "Rated_Cap"] },
  { id: "eq_pe_df", name: "Diversity Factor", canonicalTex: "DF = \\frac{\\sum P_{max,i}}{P_{total,max}}", baseFormula: "DF = Sum_Max_Loads / P_total_max", nodes: ["DF", "Sum_Max_Loads", "P_total_max"] },
  { id: "eq_pe_avg", name: "Average Load from Energy", canonicalTex: "P_{avg} = \\frac{E_{total}}{t_{op}}", baseFormula: "Avg_Load = E_total / Hours_Op", nodes: ["Avg_Load", "E_total", "Hours_Op"] }
]);