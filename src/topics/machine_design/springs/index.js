import { HELICAL_SPRING_TOPICS } from "./helical/index.js";
import { LEAF_SPRING_TOPICS } from "./leaf/index.js";
import { TORSION_SPRING_TOPICS } from "./torsion/index.js";

export const SPRINGS_TOPICS = Object.freeze({
  ...HELICAL_SPRING_TOPICS,
  ...LEAF_SPRING_TOPICS,
  ...TORSION_SPRING_TOPICS
});
