import { torsionRoundTopic } from "./round_wire/index.js";
import { rectSpiralTorsionTopic } from "./rectangular_spiral/index.js";

export const TORSION_SPRING_TOPICS = Object.freeze({
  [torsionRoundTopic.id]: torsionRoundTopic,
  [rectSpiralTorsionTopic.id]: rectSpiralTorsionTopic
});
