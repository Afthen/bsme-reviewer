/**
 * src/topics/registry.js
 * Universal Topic Registry (DOM-free).
 * Single source of truth for all engineering subjects.
 */

import { spurGearsTopic } from "./machine_design/spur_gears/index.js";
import { helicalGearsTopic } from "./machine_design/helical_gears/index.js";

export const TOPICS = Object.freeze({
  spur_gears: spurGearsTopic,
  helical_gears: helicalGearsTopic
});

export const ALL_TOPICS = Object.values(TOPICS);
