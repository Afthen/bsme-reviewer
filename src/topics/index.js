import { MACHINE_DESIGN_TOPICS } from "./machine_design/index.js";
import { HVAC_TOPICS } from "./hvac/index.js";
import { POWERPLANT_DESIGN_TOPICS } from "./powerplant_design/index.js";

export const TOPICS = Object.freeze({
  ...MACHINE_DESIGN_TOPICS,
  ...HVAC_TOPICS,
  ...POWERPLANT_DESIGN_TOPICS
});

export const ALL_TOPICS = Object.values(TOPICS);