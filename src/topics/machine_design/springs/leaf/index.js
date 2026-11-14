import { singleLeafTopic } from "./single_leaf/index.js";
import { multiLeafTopic } from "./multi_leaf/index.js";
import { uniformStrengthLeafTopic } from "./uniform_strength/index.js";

export const LEAF_SPRING_TOPICS = Object.freeze({
  [singleLeafTopic.id]: singleLeafTopic,
  [multiLeafTopic.id]: multiLeafTopic,
  [uniformStrengthLeafTopic.id]: uniformStrengthLeafTopic
});
