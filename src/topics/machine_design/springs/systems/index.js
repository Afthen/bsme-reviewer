/**
 * src/topics/machine_design/springs/systems/index.js
 * Fractal barrel export aggregating spring systems topics upward.
 */

import { springSeriesTopic } from "./series/index.js";
import { springParallelTopic } from "./parallel/index.js";

export const SPRING_SYSTEMS_TOPICS = Object.freeze({
  springs_series: springSeriesTopic,
  springs_parallel: springParallelTopic
});
