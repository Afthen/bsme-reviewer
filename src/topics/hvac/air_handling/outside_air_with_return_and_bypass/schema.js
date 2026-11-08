import { HVAC_BASE_VARS } from "../../common/hvac_base_schema.js";
import { DIMENSIONS } from "../../../../core/dimensions.js";

export const BYPASS_AIR_VARS_DB = Object.freeze({
  ...HVAC_BASE_VARS,
  "t_adp": { name: "Apparatus Dew Point", symbol: "t_{adp}", dimension: DIMENSIONS.TEMPERATURE, unit: "°C", aliases: ["Apparatus Dew Point", "Coil Surface Temperature", "Effective Surface Temp", "Cooling Coil Dew Point", "ADP"] },
  "h_adp": { name: "ADP Enthalpy", symbol: "h_{adp}", dimension: DIMENSIONS.SPECIFIC_ENERGY, unit: "kJ/kg", aliases: ["Apparatus Dew Point Enthalpy", "Saturation Enthalpy at ADP"] },
  "BF": { name: "Bypass Factor", symbol: "BF", dimension: DIMENSIONS.DIMENSIONLESS, aliases: ["Bypass Factor", "Coil Bypass Factor", "Bypass Fraction", "Uncontacted Fraction"] },
  "CF": { name: "Contact Factor", symbol: "CF", dimension: DIMENSIONS.DIMENSIONLESS, aliases: ["Contact Factor", "Coil Efficiency", "Contact Efficiency", "1 - BF"] }
});
