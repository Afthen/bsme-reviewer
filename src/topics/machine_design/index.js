import { spurGearsTopic } from "./spur_gears/index.js";
import { helicalGearsTopic } from "./helical_gears/index.js";
import { SPRINGS_TOPICS } from "./springs/index.js";

export const MACHINE_DESIGN_TOPICS = Object.freeze({
  spur_gears: spurGearsTopic,
  helical_gears: helicalGearsTopic,
  ...SPRINGS_TOPICS
});
