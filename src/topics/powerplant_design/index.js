import { dieselCycleTopic } from "./diesel_cycle/index.js";
import { dieselEngineTopic } from "./diesel_engine/index.js";
import { dieselHeatBalanceTopic } from "./diesel_heat_balance/index.js";

export const POWERPLANT_DESIGN_TOPICS = Object.freeze({
  powerplant_design_diesel_cycle: dieselCycleTopic,
  powerplant_design_diesel_engine: dieselEngineTopic,
  powerplant_design_diesel_heat_balance: dieselHeatBalanceTopic
});