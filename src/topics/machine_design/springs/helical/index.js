import { helicalRoundTopic } from "./round_wire/index.js";
import { squareWireTopic } from "./square_wire/index.js";
import { rectangularWireTopic } from "./rectangular_wire/index.js";
import { impactLoadingTopic } from "./impact_loading/index.js";
import { seriesSpringsTopic } from "./series/index.js";
import { parallelSpringsTopic } from "./parallel/index.js";
import { concentricEqualTopic } from "./concentric_equal/index.js";
import { concentricOuterTopic } from "./concentric_outer_longer/index.js";
import { concentricInnerTopic } from "./concentric_inner_longer/index.js";
import { springDynamicsTopic } from "./dynamics/index.js";

export const HELICAL_SPRING_TOPICS = Object.freeze({
  [helicalRoundTopic.id]: helicalRoundTopic,
  [squareWireTopic.id]: squareWireTopic,
  [rectangularWireTopic.id]: rectangularWireTopic,
  [impactLoadingTopic.id]: impactLoadingTopic,
  [seriesSpringsTopic.id]: seriesSpringsTopic,
  [parallelSpringsTopic.id]: parallelSpringsTopic,
  [concentricEqualTopic.id]: concentricEqualTopic,
  [concentricOuterTopic.id]: concentricOuterTopic,
  [concentricInnerTopic.id]: concentricInnerTopic,
  [springDynamicsTopic.id]: springDynamicsTopic
});
