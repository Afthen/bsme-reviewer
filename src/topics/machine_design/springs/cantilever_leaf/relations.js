/**
 * src/topics/machine_design/springs/cantilever_leaf/relations.js
 * Invertible Cantilever Leaf Spring relations (Video Problem 4).
 */

import { defineRelation, compileRelations } from "../../../../core/relation_builder.js";

export const CANTILEVER_LEAF_RELATIONS = compileRelations([
  defineRelation({
    id: "eq_cantilever_leaf_deflection",
    name: "Cantilever Leaf Deflection",
    canonicalTex: "\\delta = \\frac{S L^2}{t E}",
    formula: "delta = (S * (L^2)) / (t * E)"
  }),
  defineRelation({
    id: "eq_cantilever_leaf_stress",
    name: "Cantilever Leaf Bending Stress",
    canonicalTex: "S = \\frac{6 F L}{n b t^2}",
    formula: "S = (6 * F * L) / (n_leaves * b * (t^2))"
  }),
  defineRelation({
    id: "eq_cantilever_leaf_rate",
    name: "Leaf Spring Rate",
    canonicalTex: "k = \\frac{F}{\\delta}",
    formula: "k = F / delta"
  })
]);
