import { DIMENSIONS } from "../../../core/dimensions.js";

export const PLANT_ECONOMICS_VARS = Object.freeze({
  "Avg_Load": { name: "Average Load", symbol: "P_{avg}", dimension: DIMENSIONS.POWER, unit: "kW" },
  "Max_Load": { name: "Peak / Maximum Load", symbol: "P_{max}", dimension: DIMENSIONS.POWER, unit: "kW" },
  "Rated_Cap": { name: "Rated Plant Capacity", symbol: "C_{rated}", dimension: DIMENSIONS.POWER, unit: "kW" },
  "E_total": { name: "Total Energy Generated", symbol: "E_{total}", dimension: DIMENSIONS.ENERGY, unit: "kWh" },
  "Hours_Op": { name: "Hours of Operation", symbol: "t_{op}", dimension: DIMENSIONS.TIME, unit: "hr" },
  "Sum_Max_Loads": { name: "Sum of Max Demands", symbol: "\\sum P_{max,i}", dimension: DIMENSIONS.POWER, unit: "kW" },
  "P_total_max": { name: "Coincident Max Demand", symbol: "P_{total,max}", dimension: DIMENSIONS.POWER, unit: "kW" },
  "LF": { name: "Load Factor", symbol: "LF", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless" },
  "CF": { name: "Capacity Factor", symbol: "CF", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless" },
  "DF": { name: "Diversity Factor", symbol: "DF", dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless" }
});