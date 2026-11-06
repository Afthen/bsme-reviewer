// ========================================================
// graph_engine.js — Universal Engineering Knowledge Graph Engine
// ========================================================

const PHI_INV2_GRAPH = 0.3819660113;

/**
 * Universal numerical formatter for KaTeX strings and explanations
 */
function fmt(n, maxDec = 3) {
  if (n === undefined || n === null) return "";
  if (typeof n !== "number") n = Number(n);
  if (isNaN(n)) return "";
  const factor = Math.pow(10, maxDec);
  const rounded = Math.round(n * factor) / factor;
  return rounded.toString();
}

/**
 * Target label formatting with unit awareness
 */
function targetLabel(name, token, u) {
  if (!u || u === "dimless" || u === "ratio" || u === "teeth") {
    return `${name} (${token})`;
  }
  if (u === "deg") {
    return `${name} (${token}) in °`;
  }
  return `${name} (${token}) in $\\text{${u}}$`;
}

/**
 * Resolves localized / randomized variable name from system state or database
 */
function getVarName(S, k, varsDb = null) {
  if (S && S._names && S._names[k]) return S._names[k];
  const db = varsDb || (window.CURRENT_TOPIC && window.CURRENT_TOPIC.varsDb) || (typeof GEAR_VARS_DB !== "undefined" ? GEAR_VARS_DB : {});
  const meta = db[k];
  return meta ? (meta.name || k) : k;
}

function dbUnit(k, varsDb = null) {
  const db = varsDb || (window.CURRENT_TOPIC && window.CURRENT_TOPIC.varsDb) || (typeof GEAR_VARS_DB !== "undefined" ? GEAR_VARS_DB : {});
  return (db[k] || {}).unit || "dimless";
}

function unitOf(S, k, varsDb = null) {
  return (S && S._u && S._u[k]) || dbUnit(k, varsDb);
}

// ========================================================
// BIPARTITE DAG PROPAGATION SOLVER
// ========================================================
function solveProblemOnGraph(givensArray, S, relationGraph = null) {
  const graph = relationGraph || (window.CURRENT_TOPIC && window.CURRENT_TOPIC.relations) || (typeof GEAR_RELATION_GRAPH !== "undefined" ? GEAR_RELATION_GRAPH : []);
  const known = new Set(givensArray);
  const solutionSteps = [];
  const usedEquations = new Set();
  let keepPropagating = true;
  const producedBy = {};

  while (keepPropagating) {
    keepPropagating = false;
    for (const eq of graph) {
      if (usedEquations.has(eq.id)) continue;
      const unknowns = eq.nodes.filter(n => !known.has(n));
      if (unknowns.length === 1) {
        const targetVar = unknowns[0];
        const solved = eq.solve(targetVar, S);
        if (solved) {
          known.add(targetVar);
          usedEquations.add(eq.id);

          const inputVars = eq.nodes.filter(n => n !== targetVar);
          const parentStepIndices = [];
          inputVars.forEach(v => {
            if (producedBy[v] !== undefined) {
              parentStepIndices.push(producedBy[v]);
            }
          });

          const ancestorSet = new Set();
          function traceAncestors(pIdx) {
            ancestorSet.add(pIdx);
            const pStep = solutionSteps[pIdx];
            if (pStep && pStep.parentIndices) {
              pStep.parentIndices.forEach(gpIdx => traceAncestors(gpIdx));
            }
          }
          parentStepIndices.forEach(pIdx => traceAncestors(pIdx));

          const newStepIndex = solutionSteps.length;
          solutionSteps.push({
            stepIdx: newStepIndex,
            target: solved.target,
            text: solved.text,
            equation: solved.eq,
            targetVar,
            eqId: eq.id,
            nodes: eq.nodes,
            expectedVal: solved.val,
            parentIndices: parentStepIndices,
            ancestorIndices: Array.from(ancestorSet),
            isFaded: false
          });

          producedBy[targetVar] = newStepIndex;
          keepPropagating = true;
        }
      }
    }
  }
  return solutionSteps;
}

// ========================================================
// CONTEXT CAROUSEL QUERY
// ========================================================
function getGraphCardsForVariable(rawVarKey, activeProblem = null, relationGraph = null, varsDb = null) {
  const graph = relationGraph || (window.CURRENT_TOPIC && window.CURRENT_TOPIC.relations) || (typeof GEAR_RELATION_GRAPH !== "undefined" ? GEAR_RELATION_GRAPH : []);
  const db = varsDb || (window.CURRENT_TOPIC && window.CURRENT_TOPIC.varsDb) || (typeof GEAR_VARS_DB !== "undefined" ? GEAR_VARS_DB : {});

  const familyMap = {
    "T":   ["T", "T_1", "T_2"],
    "T_1": ["T_1", "T", "T_2"],
    "T_2": ["T_2", "T", "T_1"],
    "D_P":  ["D_P", "D_P1", "D_P2"],
    "D_P1": ["D_P1", "D_P", "D_P2"],
    "D_P2": ["D_P2", "D_P", "D_P1"],
    "n":   ["n", "n_1", "n_2"],
    "n_1": ["n_1", "n"],
    "n_2": ["n_2", "n"],
    "W_t": ["W_t", "F_t"],
    "W_r": ["W_r", "F_r"],
    "W":   ["W", "F_n"],
    "M_t": ["M_t", "T"],
    "V_m": ["V_m", "v"],
    "VR":  ["VR", "SR"]
  };

  const lookupKeys = familyMap[rawVarKey] || [rawVarKey];
  const meta = db[rawVarKey];
  if (meta && meta.baseVar && !lookupKeys.includes(meta.baseVar)) {
    lookupKeys.push(meta.baseVar);
  }

  const cards = [];
  const visitedFormulas = new Set();

  graph.forEach(eq => {
    const involvesVar = eq.nodes.some(n => lookupKeys.includes(n));
    if (!involvesVar) return;

    if (eq.baseFormula && !visitedFormulas.has(eq.baseFormula)) {
      visitedFormulas.add(eq.baseFormula);
      cards.push({
        eqId: eq.id,
        isBase: true,
        targetVar: rawVarKey,
        formula: eq.baseFormula,
        notes: `${eq.name} (Canonical Equation)`,
        vars: eq.nodes.filter(n => n !== rawVarKey),
        usedInProblem: false
      });
    }

    const matchKey = lookupKeys.find(k => eq.forms && eq.forms[k]);
    if (matchKey && eq.forms[matchKey]) {
      const form = eq.forms[matchKey];
      if (!visitedFormulas.has(form.formula)) {
        visitedFormulas.add(form.formula);
        cards.push({
          eqId: eq.id,
          isBase: false,
          targetVar: matchKey,
          formula: form.formula,
          notes: `${eq.name}: ${form.notes}`,
          vars: eq.nodes.filter(n => n !== matchKey),
          usedInProblem: false
        });
      }
    }
  });

  if (activeProblem && activeProblem.solution) {
    const directStep = activeProblem.solution.find(s => lookupKeys.includes(s.targetVar));
    if (directStep) {
      const idx = cards.findIndex(c => c.eqId === directStep.eqId && c.isBase);
      if (idx >= 0) {
        cards[idx].usedInProblem = true;
        const [targetCard] = cards.splice(idx, 1);
        cards.unshift(targetCard);
      }
    }
  }

  return cards;
}

// ========================================================
// COMPOUND LEAPFROG DERIVATION BUILDER
// ========================================================
/**
 * Assembles a multi-step algebraic substitution chain when intermediate
 * scaffolding steps have been faded due to high student mastery.
 */
function buildCompoundDerivation(step, S, allSteps) {
  if (!S || !step || !step.parentIndices || step.parentIndices.length === 0) return null;

  // Topic-level override hook
  if (window.CURRENT_TOPIC && typeof window.CURRENT_TOPIC.buildCompoundDerivation === "function") {
    const customResult = window.CURRENT_TOPIC.buildCompoundDerivation(step, S, allSteps);
    if (customResult) return customResult;
  }

  // Check if any ancestor step was faded
  const hasFadedAncestor = (step.ancestorIndices || []).some(aIdx => allSteps[aIdx] && allSteps[aIdx].isFaded);
  if (!hasFadedAncestor) return null;

  const t = step.targetVar;
  const isSI = S.sys === "SI" || unitOf(S, "V_m") === "m/s" || unitOf(S, "D_P1") === "mm";

  // CASE 1: Pinion Teeth (T_1) from Pitch Velocity, Diameter, and Driven Speed
  if (t === "T_1" && step.eqId === "eq_vr_teeth") {
    const vrStep = allSteps.find(s => s.targetVar === "VR" && s.isFaded);
    const n1Step = allSteps.find(s => s.targetVar === "n_1" && s.isFaded);

    if (vrStep && n1Step) {
      // 3-step leapfrog: v + D_1 -> n_1, n_1 + n_2 -> SR, SR + T_2 -> T_1
      const derivationBlock = isSI
        ? `\\begin{aligned}
T_1 &= \\frac{T_2}{SR} = \\frac{T_2}{\\left(\\dfrac{N_1}{N_2}\\right)} = \\frac{T_2 \\cdot N_2}{N_1} \\\\[6pt]
    &= \\frac{T_2 \\cdot N_2}{\\left(\\dfrac{60000 v}{\\pi D_1}\\right)} = \\frac{\\pi D_1 N_2 T_2}{60000 v}
\\end{aligned}`
        : `\\begin{aligned}
T_1 &= \\frac{T_2}{SR} = \\frac{T_2}{\\left(\\dfrac{N_1}{N_2}\\right)} = \\frac{T_2 \\cdot N_2}{N_1} \\\\[6pt]
    &= \\frac{T_2 \\cdot N_2}{\\left(\\dfrac{12 v}{\\pi D_1}\\right)} = \\frac{\\pi D_1 N_2 T_2}{12 v}
\\end{aligned}`;

      const finalBlock = isSI
        ? `T_1 = \\frac{\\pi (${fmt(S.D_P1, 1)}) (${fmt(S.n_2, 1)}) (${fmt(S.T_2, 0)})}{60000 (${fmt(S.V_m, 2)})} = \\mathbf{${fmt(step.expectedVal, 0)}\\text{ teeth}}`
        : `T_1 = \\frac{\\pi (${fmt(S.D_P1, 3)}) (${fmt(S.n_2, 1)}) (${fmt(S.T_2, 0)})}{12 (${fmt(S.V_m, 1)})} = \\mathbf{${fmt(step.expectedVal, 0)}\\text{ teeth}}`;

      return { type: "compound_leapfrog", derivationBlock, finalBlock, note: "Synthesized from Velocity, Speed Ratio, and Tooth Balance" };
    } else if (vrStep) {
      // 2-step leapfrog: n_1 + n_2 -> SR, SR + T_2 -> T_1
      const derivationBlock = `\\begin{aligned}
T_1 &= \\frac{T_2}{SR} = \\frac{T_2}{\\left(\\dfrac{N_1}{N_2}\\right)} = \\frac{T_2 \\cdot N_2}{N_1}
\\end{aligned}`;
      const finalBlock = `T_1 = \\frac{(${fmt(S.T_2, 0)}) (${fmt(S.n_2, 1)})}{${fmt(S.n_1, 0)}} = \\mathbf{${fmt(step.expectedVal, 0)}\\text{ teeth}}`;
      return { type: "compound_leapfrog", derivationBlock, finalBlock, note: "Synthesized from Speed Ratio definition" };
    }
  }

  // CASE 2: Power (P) from Radial Force, Diameter, and RPM
  if (t === "P" && step.eqId === "eq_wt_power_vel") {
    const derivationBlock = `\\begin{aligned}
W_t &= \\frac{33000 P}{V_m} = \\frac{33000 P}{\\left(\\dfrac{\\pi D_{1} n_1}{12}\\right)} = \\frac{12(33000) P}{\\pi D_{1} n_1} \\\\[6pt]
\\frac{F_r}{\\tan\\phi} &= \\frac{12(33000) P}{\\pi D_{1} n_1} \\implies P = \\frac{F_r \\pi D_{1} n_1}{12(33000) \\tan\\phi}
\\end{aligned}`;
    const finalBlock = `P = \\frac{(${fmt(S.W_r, 0)})\\pi(${fmt(S.D_P1, 3)})(${fmt(S.n_1, 0)})}{12(33000)\\tan(${fmt(S.phi, 1)}°)} = \\mathbf{${fmt(step.expectedVal, 2)}\\text{ hp}}`;
    return { type: "compound_leapfrog", derivationBlock, finalBlock, note: "Synthesized from Pitch Velocity and Pressure Angle Force Vectors" };
  }

  // CASE 3: Blank Diameter (D_o) from Tooth Count and Diametral Pitch
  if (t === "D_o" && step.eqId === "eq_do") {
    const derivationBlock = `\\begin{aligned}
D_o &= D_{1} + 2a = \\frac{T_1}{P_d} + 2\\left(\\frac{1}{P_d}\\right) = \\frac{T_1 + 2}{P_d}
\\end{aligned}`;
    const finalBlock = `D_o = \\frac{${fmt(S.T_1, 0)} + 2}{${fmt(S.P_d, 2)}} = \\mathbf{${fmt(step.expectedVal, 3)}\\text{ in}}`;
    return { type: "compound_leapfrog", derivationBlock, finalBlock, note: "Synthesized from Pitch Diameter and Addendum proportions" };
  }

  // CASE 4: Pitch Line Velocity (V_m) from Teeth, Diametral Pitch, and RPM
  if (t === "V_m" && step.eqId === "eq_pitch_vel") {
    const derivationBlock = `\\begin{aligned}
V_m &= \\frac{\\pi D_{1} n_1}{12} = \\frac{\\pi \\left(\\dfrac{T_1}{P_d}\\right) n_1}{12} = \\frac{\\pi T_1 n_1}{12 P_d}
\\end{aligned}`;
    const finalBlock = `V_m = \\frac{\\pi(${fmt(S.T_1, 0)})(${fmt(S.n_1, 0)})}{12(${fmt(S.P_d, 2)})} = \\mathbf{${fmt(step.expectedVal, 1)}\\text{ ft/min}}`;
    return { type: "compound_leapfrog", derivationBlock, finalBlock, note: "Synthesized from Pitch Diameter definition" };
  }

  // Generic Fallback Derivation Generator
  const fadedNames = (step.ancestorIndices || [])
    .map(i => allSteps[i])
    .filter(s => s && s.isFaded)
    .map(s => getVarName(S, s.targetVar));

  return {
    type: "compound_leapfrog",
    derivationBlock: `\\begin{aligned}
\\text{[Synthesized Step]} &\\quad \\text{Direct resolution substituting mastered relations (${fadedNames.join(", ")}):} \\\\[4pt]
${step.equation}
\\end{aligned}`,
    finalBlock: "",
    note: `Intermediate steps for ${fadedNames.join(", ")} were synthesized into this derivation based on your mastery profile.`
  };
}

// ========================================================
// SEED LIBRARY & TOPIC PROBLEM GENERATOR
// ========================================================
function buildGeneratedSeeds(topic = null, attemptsPerTarget = 8) {
  const currentTopic = topic || window.CURRENT_TOPIC || {
    relations: typeof GEAR_RELATION_GRAPH !== "undefined" ? GEAR_RELATION_GRAPH : [],
    varsDb: typeof GEAR_VARS_DB !== "undefined" ? GEAR_VARS_DB : {},
    createSystem: typeof createGroundTruthSystem !== "undefined" ? createGroundTruthSystem : null
  };
  if (!currentTopic.createSystem) return [];

  const S = currentTopic.createSystem();
  const found = new Map();
  const graph = currentTopic.relations;
  const solversOf = v => graph.filter(e => e.nodes.includes(v) && e.solve(v, S));

  const expand = (v, depth, banned) => {
    const opts = solversOf(v).filter(e => !banned.has(e.id));
    if (depth <= 0 || opts.length === 0 || Math.random() < PHI_INV2_GRAPH) return [v];
    const e2 = opts[Math.floor(Math.random() * opts.length)];
    const nb = new Set([...banned, e2.id]);
    return e2.nodes.filter(n => n !== v).flatMap(n => expand(n, depth - 1, nb));
  };

  graph.forEach(eq => {
    eq.nodes.filter(t => eq.solve(t, S)).forEach(goal => {
      for (let k = 0; k < attemptsPerTarget; k++) {
        const banned = new Set([eq.id]);
        const givens = [...new Set(eq.nodes.filter(n => n !== goal).flatMap(n => expand(n, 2, banned)))].sort();
        if (givens.includes(goal) || givens.length > 6) continue;
        const key = `${givens.join(",")}>${goal}`;
        if (found.has(key)) continue;

        const steps = solveProblemOnGraph(givens, S, graph);
        const gi = steps.findIndex(s => s.targetVar === goal);
        if (gi < 0) continue;
        const req = [gi, ...steps[gi].ancestorIndices];
        if (!req.some(i => steps[i].eqId === eq.id)) continue;
        if (givens.some(g => solveProblemOnGraph(givens.filter(x => x !== g), S, graph).some(s => s.targetVar === goal))) continue;

        found.set(key, {
          name: `${eq.name} → ${getVarName(S, goal, currentTopic.varsDb)}`,
          topic: eq.topic, givens, goal, key
        });
      }
    });
  });

  return [...found.values()];
}

let _seedCandidatesCache = {};
function getSeedCandidates(topic = null) {
  const currentTopic = topic || window.CURRENT_TOPIC || {
    id: "spur_gears",
    relations: typeof GEAR_RELATION_GRAPH !== "undefined" ? GEAR_RELATION_GRAPH : [],
    varsDb: typeof GEAR_VARS_DB !== "undefined" ? GEAR_VARS_DB : {},
    seeds: typeof ORGANIC_SEED_PATTERNS !== "undefined" ? ORGANIC_SEED_PATTERNS : [],
    createSystem: typeof createGroundTruthSystem !== "undefined" ? createGroundTruthSystem : null
  };

  const topicKey = currentTopic.id || "default";
  if (_seedCandidatesCache[topicKey]) return _seedCandidatesCache[topicKey];

  const list = [];
  (currentTopic.seeds || []).forEach(p => {
    (p.goals || []).forEach(g => {
      list.push({ name: p.name, topic: p.topic, givens: p.givens, goal: g, key: `${p.name}>${g}` });
    });
  });

  _seedCandidatesCache[topicKey] = list.concat(buildGeneratedSeeds(currentTopic));
  return _seedCandidatesCache[topicKey];
}
