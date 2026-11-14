/**
 * src/topics/machine_design/springs/index.js
 * Fractal barrel export aggregating all spring subtopics upward to Machine Design.
 */

import { helicalCoilTopic } from "./helical_coil/index.js";
import { SPRING_SYSTEMS_TOPICS } from "./systems/index.js";
import { cantileverLeafTopic } from "./cantilever_leaf/index.js";
import { periodFrequencyTopic } from "./period_frequency/index.js";

export const SPRINGS_TOPICS = Object.freeze({
  springs_helical_coil: helicalCoilTopic,
  ...SPRING_SYSTEMS_TOPICS,
  springs_cantilever_leaf: cantileverLeafTopic,
  springs_period_frequency: periodFrequencyTopic
});
