import { TORSION_ROUND_VARS_DB } from "./schema.js";
import { TORSION_ROUND_RELATIONS } from "./relations.js";
import { createTorsionRoundSystem } from "./system.js";

export const torsionRoundTopic = Object.freeze({
  id: "md_springs_torsion_round",
  title: "Round Wire (Helical & Spiral)",
  subject: "Machine Design",
  category: "Springs / Torsion Springs",
  noun: "round-wire torsion spring",
  varsDb: TORSION_ROUND_VARS_DB,
  relations: TORSION_ROUND_RELATIONS,
  createSystem: createTorsionRoundSystem
});
