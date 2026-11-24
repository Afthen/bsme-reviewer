/**
 * src/ui/unit_click_view.js
 * Wires .interactive-unit spans (statement givens/goals and step headers) to the unit card.
 */

import { openUnitCard } from "./unit_card_view.js";
import { CONSTANTS_DB } from "../core/constants_registry.js";

export function attachUnitClicks(problem) {
  const S = problem?.system || {};
  const varsDb = problem?.varsDb || {};
  document.querySelectorAll(".interactive-unit").forEach(el => {
    const varKey = el.dataset?.var;
    if (!varKey) return;
    el.addEventListener("click", e => {
      e.stopPropagation();
      const meta = varsDb[varKey] || CONSTANTS_DB[varKey] || {};
      openUnitCard({
        varKey,
        title: S._displayNames?.[varKey] || meta.name || varKey,
        value: S[varKey],
        unit: S._u?.[varKey] || meta.unit || "",
        dimension: meta.dimension || null
      });
    });
  });
}
