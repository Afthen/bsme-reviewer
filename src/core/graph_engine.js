// ========================================================
// graph_engine.js — Universal Engineering Knowledge Graph Engine
// ========================================================

const PHI_INV2_GRAPH = 0.3819660113;

/**
 * Universal numerical formatter for KaTeX strings and explanations.
 * Defaults to 2 decimal places to maintain consistency with standard calculations.
 */
function fmt(n, maxDec = 2) {
  if (n === undefined || n === null) return "";
  if (typeof n !== "number") n = Number(n);
  if (isNaN(n)) return "";
  const factor = Math.pow(10, maxDec);
  const rounded = Math.round(n * factor) / factor;
  return rounded.toString();
}

/**
 * Resolves localized / randomized variable name from system state or database.
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
// 1. BIPARTITE DAG PROPAGATION SOLVER
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
// 2. CONTEXT CAROUSEL QUERY
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
// 3. DYNAMIC CAS & KNOWLEDGE GRAPH DERIVATION ENGINE
// ========================================================

/**
 * Normalizes variable tokens for Nerdamer processing.
 */
function toCasToken(v) {
  return (v || "").replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Formats variable tokens back into standard KaTeX notation.
 */
function toLatexToken(token, varsDb = null) {
  const db = varsDb || (window.CURRENT_TOPIC && window.CURRENT_TOPIC.varsDb) || (typeof GEAR_VARS_DB !== "undefined" ? GEAR_VARS_DB : {});
  if (db[token] && db[token].symbol) return db[token].symbol;

  if (token === "phi") return "\\phi";
  if (token === "pi") return "\\pi";
  if (token === "Pd" || token === "P_d") return "P_d";
  if (token === "Ft" || token === "F_t" || token === "Wt" || token === "W_t") return "F_t";
  if (token === "Fn" || token === "F_n" || token === "W") return "F_n";
  if (token === "Fr" || token === "F_r" || token === "Wr" || token === "W_r") return "F_r";
  if (token === "Do" || token === "D_o") return "D_o";
  if (token === "VR" || token === "SR") return "\\text{VR}";
  if (token === "Vm" || token === "V_m") return "v";
  if (token === "Mt" || token === "M_t") return "T";

  const m = token.match(/^([A-Za-z]+)_?(\d+)$/);
  if (m) return `${m[1]}_{${m[2]}}`;

  return token;
}

/**
 * Converts a symbolic CAS expression to formatted KaTeX.
 */
function casToLatex(exprStr, varsDb = null) {
  if (typeof nerdamer !== "undefined") {
    try {
      let tex = nerdamer(exprStr).toTeX();
      tex = tex.replace(/\b([A-Za-z]+)(\d+)\b/g, "$1_{$2}");
      tex = tex.replace(/\bPd\b/g, "P_d");
      tex = tex.replace(/\bFt\b/g, "F_t");
      tex = tex.replace(/\bFn\b/g, "F_n");
      tex = tex.replace(/\bFr\b/g, "F_r");
      tex = tex.replace(/\bDo\b/g, "D_o");
      tex = tex.replace(/\\cdot/g, " ");
      return tex;
    } catch (e) {
      // Fallback
    }
  }
  return exprStr;
}

/**
 * Simplifies a symbolic expression using Nerdamer CAS.
 */
function casSimplifyExpression(exprStr) {
  if (typeof nerdamer !== "undefined") {
    try {
      return nerdamer(`simplify(${exprStr})`).text();
    } catch (e) {
      return exprStr;
    }
  }
  return exprStr;
}

/**
 * Isolates a target variable from an equation string using Nerdamer CAS.
 */
function casIsolateVariable(lhsStr, rhsStr, targetVar) {
  const tToken = toCasToken(targetVar);
  if (toCasToken(lhsStr) === tToken) {
    return { isolatedLhs: targetVar, isolatedRhs: rhsStr };
  }

  if (typeof nerdamer !== "undefined") {
    try {
      const eqStr = `${lhsStr} = ${rhsStr}`;
      const solutions = nerdamer.solveEquations(eqStr, tToken);
      if (solutions && solutions.length > 0) {
        let sol = solutions[0];
        if (typeof sol.text === "function") sol = sol.text();
        return { isolatedLhs: targetVar, isolatedRhs: sol.toString() };
      }
    } catch (e) {
      // Fallback
    }
  }
  return { isolatedLhs: targetVar, isolatedRhs: rhsStr };
}

/**
 * Universal Step Derivation Engine:
 * Always puts the canonical equation on top, applies Graph substitution and CAS
 * simplification for faded ancestor variables, isolates the target variable,
 * and renders clean numerical substitution with unit cancellations.
 */
function buildStepDerivation(step, S, allSteps = [], givens = [], currentTopic = null) {
  const top = currentTopic || window.CURRENT_TOPIC || {
    relations: typeof GEAR_RELATION_GRAPH !== "undefined" ? GEAR_RELATION_GRAPH : [],
    varsDb: typeof GEAR_VARS_DB !== "undefined" ? GEAR_VARS_DB : {}
  };
  const relations = top.relations || [];
  const varsDb = top.varsDb || {};

  const eq = relations.find(r => r.id === step.eqId);
  const targetVar = step.targetVar;
  const isSI = S.sys === "SI" || unitOf(S, "V_m", varsDb) === "m/s" || unitOf(S, "D_P1", varsDb) === "mm";

  const fadedAncestors = (step.ancestorIndices || [])
    .map(i => allSteps[i])
    .filter(s => s && s.isFaded);

  // 1. Resolve Canonical Equation for this relation
  let canonicalLhs = "";
  let canonicalRhs = "";
  let canonicalTex = "";

  if (eq && eq.canonical) {
    canonicalLhs = eq.canonical.lhs;
    canonicalRhs = eq.canonical.rhs;
    canonicalTex = eq.canonical.tex || `${toLatexToken(canonicalLhs, varsDb)} = ${casToLatex(canonicalRhs, varsDb)}`;
  } else if (eq && eq.baseFormula) {
    canonicalTex = eq.baseFormula;
    const parts = eq.baseFormula.split("=");
    canonicalLhs = (parts[0] || "").trim();
    canonicalRhs = (parts[1] || "").trim();
  } else {
    canonicalTex = step.equation ? step.equation.split("=")[0].trim() : `${toLatexToken(targetVar, varsDb)}`;
    canonicalLhs = targetVar;
    canonicalRhs = targetVar;
  }

  // 2. Alternating Graph Substitution -> CAS Simplification
  const substitutionHistory = [];
  let currentExpr = canonicalRhs;
  let currentLhs = canonicalLhs;

  if (fadedAncestors.length > 0) {
    fadedAncestors.forEach(fStep => {
      const fVar = fStep.targetVar;
      const fToken = toCasToken(fVar);

      const fEq = relations.find(r => r.id === fStep.eqId);
      let subFormula = null;
      let subLatex = null;

      if (fVar === "D_P1" || fVar === "D_1") {
        if (fEq && fEq.id === "eq_pitch_vel") {
          subFormula = isSI ? "(60000*v)/(pi*n1)" : "(12*Vm)/(pi*n1)";
          subLatex = isSI ? "\\frac{60000 v}{\\pi n_1}" : "\\frac{12 V_m}{\\pi n_1}";
        } else if (fEq && (fEq.id === "eq_dp_teeth_1" || fEq.id === "eq_dp1" || fEq.id === "eq_pd")) {
          subFormula = "T1/Pd";
          subLatex = "\\frac{T_1}{P_d}";
        }
      } else if (fVar === "D_P2" || fVar === "D_2") {
        subFormula = "T2/Pd";
        subLatex = "\\frac{T_2}{P_d}";
      } else if (fVar === "W_t" || fVar === "F_t") {
        if (fEq && (fEq.id === "eq_fn_ft" || fEq.id === "eq_w_normal")) {
          subFormula = "Fn*cos(phi)";
          subLatex = "F_n \\cos\\phi";
        }
      }

      if (subFormula) {
        if (typeof nerdamer !== "undefined") {
          try {
            const subsObj = {};
            subsObj[fToken] = subFormula;
            currentExpr = nerdamer(currentExpr, subsObj).text();
          } catch (e) {
            currentExpr = currentExpr.split(fToken).join(`(${subFormula})`);
          }
        } else {
          currentExpr = currentExpr.split(fToken).join(`(${subFormula})`);
        }

        currentExpr = casSimplifyExpression(currentExpr);

        substitutionHistory.push({
          replacedVar: fVar,
          subLatex,
          simplifiedLatex: casToLatex(currentExpr, varsDb)
        });
      }
    });
  }

  // 3. Isolate the target variable using CAS
  let isolatedFormulaLatex = "";
  if (toCasToken(currentLhs) !== toCasToken(targetVar)) {
    const isolated = casIsolateVariable(currentLhs, currentExpr, targetVar);
    isolatedFormulaLatex = `${toLatexToken(targetVar, varsDb)} = ${casToLatex(isolated.isolatedRhs, varsDb)}`;
  } else {
    isolatedFormulaLatex = `${toLatexToken(targetVar, varsDb)} = ${casToLatex(currentExpr, varsDb)}`;
  }

  // 4. Construct Clean KaTeX Derivation Blocks (Canonical always on top)
  let derivationBlock = canonicalTex;

  if (substitutionHistory.length > 0) {
    derivationBlock += ` \\\\[4pt]\n\\implies ${isolatedFormulaLatex}`;
  } else if (canonicalTex !== isolatedFormulaLatex && isolatedFormulaLatex !== "") {
    derivationBlock += ` \\\\[4pt]\n\\implies ${isolatedFormulaLatex}`;
  }

  // 5. Numerical Substitution & Unit Cancellation (using units.js helpers)
  let numericalBlock = "";
  const unitStr = unitOf(S, targetVar, varsDb);
  const targetMeta = varsDb[targetVar] || {};
  const isInteger = !!targetMeta.isInteger;
  const prec = isInteger ? 0 : 2;
  const finalValStr = fmt(step.expectedVal, prec);

  if (targetVar === "P_d" && (S.T_1 !== undefined && S.T_2 !== undefined && S.C !== undefined)) {
    numericalBlock = `P_d = \\frac{${fmt(S.T_1, 0)} + ${fmt(S.T_2, 0)}}{2(${fmt(S.C, 1)}\\,${cancelUnit("mm")})} \\cdot ${window.formatConversionWithCancellation("in_to_mm_cancel_mm")} = \\mathbf{${finalValStr}\\text{ teeth/in}}`;
  } else if ((targetVar === "D_P1" || targetVar === "D_1") && S.V_m !== undefined && S.n_1 !== undefined) {
    if (isSI) {
      numericalBlock = `D_1 = \\frac{60(${fmt(S.V_m, 2)}\\,${cancelUnit("m")}/\\cancel{\\text{s}})}{\\pi (${fmt(S.n_1, 0)}\\,\\text{rev}/\\cancel{\\text{min}} \\cdot \\frac{1\\,\\cancel{\\text{min}}}{60\\,\\cancel{\\text{s}}})} \\cdot ${window.formatConversionWithCancellation("m_to_mm_cancel_m")} = \\mathbf{${finalValStr}\\text{ mm}}`;
    } else {
      numericalBlock = `D_1 = \\frac{${fmt(S.V_m, 1)}\\,${cancelUnit("ft")}/\\cancel{\\text{min}}}{\\pi (${fmt(S.n_1, 0)}\\,\\text{rev}/\\cancel{\\text{min}})} \\cdot ${window.formatConversionWithCancellation("ft_to_in_cancel_ft")} = \\mathbf{${finalValStr}\\text{ in}}`;
    }
  } else if ((targetVar === "M_t" || targetVar === "T") && S.W !== undefined && S.phi !== undefined) {
    const dVal = S.D_P1 || S.D_1 || 60;
    numericalBlock = `T = (${fmt(S.W, 0)}\\text{ N})\\cos(${fmt(S.phi, 0)}^\\circ) \\times \\frac{${fmt(dVal, 0)}\\,${cancelUnit("mm")} \\cdot ${window.formatConversionWithCancellation("mm_to_m_cancel_mm")}}{2} = \\mathbf{${finalValStr}\\text{ N}\\cdot\\text{m}}`;
  } else if (step.equation && step.equation.includes("=")) {
    let cleanEq = step.equation.replace(/cancel\s*mm/g, `\\,${cancelUnit("mm")}`);
    cleanEq = cleanEq.replace(/\\cancel\s*mm/g, `\\,${cancelUnit("mm")}`);
    numericalBlock = cleanEq;
  } else {
    numericalBlock = `${toLatexToken(targetVar, varsDb)} = \\mathbf{${finalValStr}\\text{ ${unitStr}}}`;
  }

  const fullMathHtml = `\\[ \\begin{aligned} ${derivationBlock} \\\\[6pt] ${numericalBlock} \\end{aligned} \\]`;

  return {
    title: step.text || `Calculation for ${getVarName(S, targetVar, varsDb)}`,
    mathHtml: fullMathHtml,
    derivationBlock,
    finalBlock: numericalBlock
  };
}

/**
 * Backward-compatible wrapper delegating to buildStepDerivation.
 */
function buildCompoundDerivation(step, S, allSteps) {
  return buildStepDerivation(step, S, allSteps, [], window.CURRENT_TOPIC);
}

// ========================================================
// 4. SEED LIBRARY & TOPIC PROBLEM GENERATOR
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
