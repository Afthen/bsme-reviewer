import { fmtSigFig } from "./dimensions.js";

export function buildProblemStatement(givens, visibleGoals, S, varsDb = {}, topicTitle = "Gear") {
  const parts = givens.map(v => {
    const val = S[v];
    const u = S._u?.[v] || varsDb[v]?.unit || "";
    const meta = varsDb[v] || {};
    const sym = meta.symbol || v;
    const name = meta.name || v;

    // Format all specifications to 6 significant figures (trims trailing zeroes)
    const formattedNum = fmtSigFig(val, 6);
    let valWithUnit = `$${formattedNum}$`;
    if (u && u !== "dimless" && u !== "ratio") {
      valWithUnit = u === "deg" ? `$${formattedNum}^\\circ$` : `$${formattedNum}\\text{ ${u}}$`;
    }

    return `${name}&nbsp;<span class="math-token">(<span class="interactive-var" data-var="${v}">$${sym}$</span> = ${valWithUnit})</span>`;
  });

  const goalStrings = visibleGoals.map((gVar, idx) => {
    const meta = varsDb[gVar] || {};
    const sym = meta.symbol || gVar;
    const name = meta.name || gVar;
    const u = S._u?.[gVar] || meta.unit || "";

    let uStr = "";
    if (u && u !== "dimless" && u !== "ratio") {
      uStr = u === "deg" ? " in °" : ` in $\\text{${u}}$`;
    }

    const prefix = visibleGoals.length > 1 ? `(${idx + 1}) ` : "";
    return `${prefix}<strong>${name}</strong>&nbsp;<span class="math-token">(<span class="interactive-var" data-var="${gVar}">$${sym}$</span>)</span>${uStr}`;
  });

  const driveType = topicTitle.toLowerCase().replace(/s$/, "");
  return `A ${driveType} drive operates with the following specifications: ${parts.join(", ")}. Determine: ${goalStrings.join(", and ")}.`;
}