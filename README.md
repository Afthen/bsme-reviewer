# BSME Reviewer

A graph-based engineering problem generator, symbolic solver, and spaced-repetition reviewer for Mechanical Engineering board-exam subjects (Machine Design, Air Conditioning / HVAC, and Powerplant Design). Every equation is a node in a graph. The engine chains equations into multi-step problems, checks numerical answers, renders textbook-grade derivations, and models cognitive memory curves using golden-ratio ($\phi$) and Fibonacci decay functions.

- **Stack:** Native ES modules, no bundler, KaTeX (CDN). State persists in `localStorage`.
- **Run:** Serve statically (`python3 -m http.server`) and open `index.html` (ES modules require HTTP/S).
- **Test:** `node --test test/run_test.js test/run_hygiene_test.js` (Node 22).

---

## 0. Using this file with an AI model

When modifying this repository, prompt the model with:

```text
You are modifying the BSME Reviewer repository.
1. Read README.md completely before writing any code. It overrides your defaults.
2. Before coding, state: (a) which Hard Rules (section 2) apply, (b) the files you
   will touch, (c) which tests will prove the change works.
3. Obey the Engineering Philosophy (section 1): fix root causes, write general invariants,
   avoid tunnel vision, and never patch symptoms.
4. Write code that satisfies every rule in section 2. If a rule conflicts with my
   request, stop and ask instead of choosing.
5. Run: node --test test/run_test.js test/run_hygiene_test.js
6. Reply with: files changed, a summary of test output, and anything you could
   not verify. Do not claim a test passed unless you ran it.
```

---

## 1. Engineering Philosophy: Root Causes over Symptoms

Software engineering in this repository is governed by physical and mathematical principles, not ad-hoc heuristics:

1. **Fix Root Causes, Never Patch Symptoms (Anti-Whack-a-Mole):**
   When an unexpected value appears (e.g. an answer off by a factor of 1000, or a temperature that appears to be Rankine labeled as Fahrenheit), identify the mathematical breakdown at the foundational layer. Never apply per-variable scalar patches, hardcoded exception branches, or localized `if (key === '...')` overrides.
2. **Design for General Invariants (Think Ahead for Scaling):**
   Whether adding an Otto cycle, a refrigeration loop, or spur gear contact stresses, the engine must handle the physics automatically. If an equation has 10 inputs or is converted between 5 systems, the existing dimensional engine should resolve it without topic-specific shims.
3. **Avoid Tunnel Vision:**
   Never evaluate a formula in isolation. Ask: *How does this change affect the solution DAG? How does it behave in a MIXED unit problem? Does the derivation reflect the actual arithmetic performed? Will ancestor equations receive reinforcement?*
4. **Anti-Pattern Blacklist:**
   - **No per-variable conversion logic:** All unit changes must route through the dimensional registry and coherent base projections.
   - **No regex-based syntax assertions on math strings:** Tests must validate structural ASTs, balance, and KaTeX rendering. Do not write catch-all regexes like `!/,/.test()` that falsely reject valid math subscripts like $c_{p,w}$ or $m_{m,w}$.
   - **No fragmentation of coupled state points:** Thermodynamic states of the same working fluid must never be split across incompatible units.
   - **No bespoke solvers:** If an equation cannot be solved by `solveDAG` and `isolateVariable`, fix the algebraic graph or declare `solvable`, but never write a hardcoded solver.

---

## 2. Hard Rules (Non-Negotiable)

### Math and Formulas
- **R1. Formulas are nodes.** Equations are declared as relations; variables are edges. `solveDAG` finds the path dynamically. Never write bespoke "solve for X" functions or hardcoded solution orders.
- **R2. AST only.** All symbolic operations pass through `src/cas/ast.js` and `src/cas/algebra.js`. No regex rewriting of formulas, no `eval` / `new Function`, no runtime CAS dependencies.
- **R3. Obey formula language rules (section 5).** Explicit `*`, parenthesised exponents, exactly one `=`, trig arguments must be a bare angle variable.
- **R4. Case-sensitive canonical keys.** Variable keys match `[A-Za-z][A-Za-z0-9_]*` (`P_d`, `D_P1`, `m_cw`). Never lowercase or normalize keys. LaTeX formatting belongs in `symbol`, never in the canonical key.

### Physical Units & Dimensions
- **R5. Relations are pure physics.** No unit-conversion constants (`25.4`, `1000`, `60`, `3600`, `12`, ...). Coherent base conversions handle scaling automatically.
- **R6. Declare empirical exceptions.**
  - Empirical correlations valid only in specific units: declare `requiredUnits: { token: "unit", targetVar: "unit" }`.
  - Differing mathematical formulations between SI and US: declare `variants.SI` and `variants.US`.
  - Non-invertible transcendental/exponential equations: declare `solvable: ["target"]`.
- **R7. Register every unit.** Every unit string must exist in `src/cas/units/definitions.js`. Unknown units fail validation.
- **R8. Thermodynamic Temperature Consistency.**
  - Ideal-gas and isentropic relations requiring absolute temperatures ($T_2 = T_1 r_k^{k-1}$) must evaluate in absolute scales ($\text{K}$ in SI, $\text{°R}$ in US).
  - All state point temperatures of a cycle must share an identical unit.
  - Affine conversions ($T_K \leftrightarrow T_{^\circ\text{C}} \leftrightarrow T_{^\circ\text{F}} \leftrightarrow T_{\text{R}}$) must use exact offsets ($\pm 273.15$, $\pm 459.67$).

### Topics and Data Contracts
- **R9. Ground truth is independent.** `system.js` computes true values by hand with explicit arithmetic. It never calls the solver or unit engine.
- **R10. `createSystem` contract.** `createSystem({ sys })` accepts `"SI"` or `"US"`, returns `sys`, `_u` (unit map), and `_names`, and provides values for every non-abstract variable in `varsDb`. SI-only topics ignore `sys` but still return `sys: "SI"`.
- **R11. Globally unique equation IDs** (`eq_<topic>_<name>`).
- **R12. Share, don't copy.** Equations used across multiple subjects live in a common folder with the `eq_base_` prefix.
- **R13. Clean schemas.** Zero orphan variables, zero duplicate formulas within a topic, and zero alias collisions across `varsDb`.
- **R14. Honest engineering data.** Every constant, table value, and coefficient must carry a source comment (textbook, equation/table, page).

### Mastery, Cycles & Cognitive Fading
- **R15. No magic numbers in learning logic.** Use `phi(n)`, `fib(n)`, `FADING_THRESHOLD`, `snapToFibonacci` from `src/mastery/constants.js`.
- **R16. Variant-aware planning.** Graph reachability calls must receive the active system context: `canSolveTarget(givens, goal, relations, S)`.
- **R17. Respect the mastery lookup contract.** `getDecayedMastery(eq, topic)` requires an object with an `id` and `baseFormula`. Steps provide `{ id: step.eqId || step.id, baseFormula: step.baseFormula }`.
- **R18. Cognitive fading step hiding.** Mastered intermediate steps ($\text{mastery} \ge \text{FADING\_THRESHOLD}$) are omitted from problem statement prompts and **literally hidden** from the interactive solution flow. The learner must synthesize the intermediate steps independently.
- **R19. Terminal goals never fade.** Primary equipment loads and overall cycle efficiencies (`topic.terminalGoals`) are protected terminal goals that remain active questions for the student.

### Typesetting & Output
- **R20. Textbook derivations.** Native `°`, never `\circ`. Zero commas before physical units (use `\,` LaTeX spacing: `100\,\text{kN}`, $\boxed{50\,\text{mm}}$). Like-unit sums and differences must factor outside parentheses: $(a \pm b)\,\text{unit}$.
- **R21. Specific Energy Notation.** Quantities per unit mass ($\text{kJ/kg}$, $\text{Btu/lb}$) strictly use lowercase symbols ($q_A, q_R, w_{net}, h$), reserving uppercase ($Q, W, P$) for total energy or power.
- **R22. Number formatting.** Number display passes through `fmtSigFig` (up to 6 significant figures, maximum 3 decimal places).

### Testing & Process
- **R23. Never make a red test invisible.** No renaming, skipping, narrowing globs, loosening tolerances, or deleting tests. Fix the root cause.
- **R24. Bug fixes ship with regression tests.** Tests that touch mastery use real mastery functions (`recordAttempt`, `getDecayedMastery`), not constant stubs.
- **R25. Report honestly.** State files changed, test output, and anything that could not be verified.

---

## 3. Architecture

```text
app.js                       Application shell, 3-tier checklist dropdown, storage & event wiring
index.html                   DOM structure, KaTeX CDN loader
styles/                      base.css, components.css, problem.css, modals.css
src/
  cas/
    ast.js                   Lexer, parser, AST walkers, evalAST
    algebra.js               isolateVariable (onion peeler + linear-rational factoring)
    latex.js                 AST to LaTeX serializer
    units/
      definitions.js         Registry (ATOMIC_BASE_UNITS, COMPOUND_UNITS), formatValueInUnit, valueToCoherentBase
      analysis.js            solveUnitAlgebra: dimensional analysis, atomic cancellation, empirical target projection
      evaluator.js           evaluatePhysicalAST: coherent base evaluation & empirical target scaling
  core/
    graph_solver.js          solveDAG, canSolveTarget, pruneSolutionPath (cognitive fading)
    problem_gen.js           generateProblem: whole-cycle synthesis, neatness pass, statement builder
    unit_sampler.js          40/40/20 distribution, coupled variable coherence, inverse-token probability
    derivation.js            buildAlignedDerivation: no-comma spacing, additive unit grouping, factor-labels
    dimensions.js            DIMENSIONS, fmtSigFig, formatGivenValue
    topic_mix.js             Tournament targeting over multi-topic review pools
  mastery/                   constants.js (phi, fib), engine.js, storage.js
  topics/
    <subject>/<topic>/       index.js, schema.js, relations.js, system.js
test/
  validator.js               Topic schema, dual-system AST inversion, and numerical fidelity harness
  run_test.js                Universal property invariants, whole-cycle synthesis, derivation rendering
  run_hygiene_test.js        In-tree dead code, invariants, schema orphans, duplicates, alias collisions
```

---

## 4. Data Contracts

### 4.1 Topic Object (`<topic>/index.js`)

| Field | Required | Type | Meaning |
|---|---|---|---|
| `id` | Yes | `string` | Unique identifier; must equal its export key in `<SUBJECT>_TOPICS`. |
| `title` | Yes | `string` | Dropdown label. |
| `subject` | Yes | `string` | Dropdown level 1 (e.g. `"Powerplant Design"`). |
| `category` | No | `string|null` | Dropdown level 2 subfolder, or `null` if standalone under subject. |
| `noun` | No | `string` | Reads: "A {noun} operates with the following specifications...". |
| `varsDb` | Yes | `object` | Variable schema dictionary (section 4.2). |
| `relations` | Yes | `Array` | Array of relation objects (section 4.3). |
| `createSystem` | Yes | `Function` | Ground truth generator: `({ sys }) => SystemState` (section 4.4). |
| `cycleGivens` | Cycle topics | `Array<string>` | Boundary specification keys provided as givens (e.g. `["T_1", "r_k", "r_c", ...]`). |
| `primaryGoals` | Cycle topics | `Array<string>` | Full ordered sequence of state points and outputs to solve. |
| `terminalGoals` | Cycle topics | `Array<string>` | Ultimate engineering goals that **never fade** (e.g. `["e_th", "w_net"]`). |

Export the topic frozen: `export const myTopic = Object.freeze({...});`.

### 4.2 `varsDb` Entry

```javascript
"T_2": {
  name: "Temperature after Compression",
  symbol: "T_2",
  dimension: DIMENSIONS.TEMPERATURE,
  unit: "K",
  nameAliases: ["Temperature after Compression", "State 2 Temperature", "Discharge Temp"],
  symbolAliases: ["T_2", "T_c"],
  aliases: ["Temperature after Compression", "Discharge Temperature", "T_2"]
}
```

- `dimension`: One of `DIMENSIONS.*` (`LENGTH`, `FORCE`, `PRESSURE`, `POWER`, `TEMPERATURE`, etc.).
- `unit`: Registered unit string from `definitions.js`.
- `nameAliases` / `symbolAliases`: Pools sampled at runtime for statement variety while derivations maintain canonical notation.
- `isConstant`: Tags fundamental physical constants (e.g. $c_{pa}$, $c_{pw}$, $g$) for recall-mode omission at high mastery.
- `isInteger`: Answer checking uses $\pm 0.5$ tolerance and the neatness pass rounds to integer.
- `isAbstract`: Tags category parents (e.g. `D_P`, `T`); exempt from orphan audits.

### 4.3 Relation Object

```javascript
{
  id: "eq_diesel_t2",
  name: "Isentropic Compression Temp",
  canonicalTex: "T_2 = T_1 r_k^{k-1}",
  baseFormula: "T_2 = T_1 * (r_k^(k - 1))",
  nodes: ["T_2", "T_1", "r_k", "k"],
  solvable: ["T_2", "T_1", "r_k"], // optional: variables that can be algebraically inverted
  requiredUnits: null              // or { tok: "unit", targetVar: "unit" } for empirical correlations
}
```

### 4.4 `createSystem({ sys })` Contract

```javascript
export function createMySystem({ sys = "SI" } = {}) {
  // 1. Generate independent ground truth using textbook-friendly inputs
  // 2. Perform explicit arithmetic by hand (never invoke solveDAG or unit engine)
  // 3. Return sys, _names, _u, and numerical values for all non-abstract varsDb keys
  return {
    sys: "SI",
    T_1: 300,
    T_2: 1027,
    _names: { T_1: "Intake Temperature", ... },
    _u: { T_1: "K", T_2: "K", ... }
  };
}
```

---

## 5. Formula Language (`baseFormula`)

The parser grammar enforces standard infix mathematical notation:
- Numbers, canonical variable keys, operators `+ - * / ^`, parentheses, unary minus.
- Functions: `sin cos tan asin acos atan sqrt exp ln log abs`, plus constants `pi` and `e`.
- Exactly one `=` separating LHS and RHS.

| Allowed | Forbidden | Failure Mode | Rule |
|---|---|---|---|
| `2 * a` | `2a` | **Silent Drop** (`2a` parses as `2`) | Always include explicit multiplication `*`. |
| `P_sat` | `P_{sat}` | **Silent Truncation** (truncates to `P_`) | No LaTeX braces in variable keys or formulas. |
| `x^(k - 1)` | `x^k-1` | Evaluates as $(x^k) - 1$ | Always parenthesise complex exponents. |
| `a / (b * c)` | `a / b / c` | Left-associative: $(a/b)/c$ | Always parenthesise compound denominators. |
| `sin(phi)` | `sin(2 * phi)` | **Silent Radian Corruption** | Trig arguments must be a bare angle variable. |

---

## 6. Physical Units & Dimensional Architecture

### 6.1 The Universal Invariant Model
All physical evaluation rests on a single invariant:
1. **Coherent Base Magnitudes:** Every physical state has an invariant representation in coherent SI units ($\text{m}, \text{s}, \text{kg}, \text{N}, \text{K}, \text{W}, \text{J}$).
2. **Universal Projections:** Any unit $u$ maps to and from base units using:
   - `valueToCoherentBase(val, u)`: Projects from unit $u$ into coherent SI base.
   - `formatValueInUnit(valBase, u)`: Projects from coherent SI base into unit $u$.
3. **Pure Physics AST Evaluation:** Pure physics relations convert all inputs to coherent SI base units, evaluate the mathematical AST in coherent base, and project the result into `targetUnit`. This prevents raw number summation across mismatched units ($BP_{\text{hp}} + FP_{\text{W}}$).
4. **Empirical Target Scaling:** When a relation specifies `requiredUnits`, the formula evaluates in those required units; the result then scales to `targetUnit` via `numericConversionFactor = scale(reqTargetU) / scale(targetUnit)`.

### 6.2 Temperature: Affine Offsets & Absolute Invariants
- **Exact Affine Offsets:** Temperature is an affine space ($y = s \cdot x + b$). `definitions.js` implements exact offsets:
  - $T_K = T_{^\circ\text{C}} + 273.15$
  - $T_K = (T_{^\circ\text{F}} + 459.67) \cdot \frac{5}{9}$
  - $T_K = T_{\text{R}} \cdot \frac{5}{9}$
- **Ideal Gas Cycle Invariant:** Relations governed by $P v = R T$ or isentropic compression ($T_2 = T_1 r_k^{k-1}$) strictly require **absolute temperature**. They must evaluate in $\text{K}$ (SI) or $\text{°R}$ (US). Never evaluate ideal-gas ratios directly in gauge scales ($^\circ\text{C}$ or $^\circ\text{F}$).

### 6.3 Multi-System Sampling & Coupled State Coherence
- **Problem Distribution:** 40% Pure SI / 40% Pure US / 20% MIXED.
- **Coupled Variable Coherence:** State points of the same fluid or cycle belong to an indivisible group and **must share an identical unit**:
  - Cycle state temperatures: `[T_1, T_2, T_3, T_4]` or `[t_o, t_r, t_m, t_s, t_{adp}, t_{rh}]`
  - Cycle state enthalpies/heats: `[q_A, q_R, w_{net}]` or `[h_o, h_r, h_m, h_s]`
  - *Rule:* Never scramble state temperatures within a cycle (e.g. $T_1$ in °C, $T_2$ in °F). In MIXED mode, the entire coupled group lands in the same system and unit.
- **Significant Figure Retention:** Conversions to alternative units must retain $\ge 3$ significant figures under the 3-decimal-place limit ($|v| \ge 0.100$). Conversions that round to zero or lose precision (e.g. kilometers for gear diameter) are rejected.
- **Compound Decomposition:** Decomposed unit options (e.g. $\text{W} \to \text{J/s} \to \text{N}\cdot\text{m/s} \to \text{kg}\cdot\text{m}^2/\text{s}^3$) are sampled with probability inversely proportional to token count: $w_i = 1/t_i$.

---

## 7. Whole-Cycle Synthesis & Natural Cognitive Fading

### 7.1 Whole-Cycle Problem Generation
For thermodynamic cycles and complex fluid systems (Diesel Cycle, Air Handling with Bypass, Outside Air with Return, Pure Air, Cooling Towers, Diesel Machinery, Diesel Heat Balance):
- The problem generator initializes with `topic.cycleGivens` (boundary specifications).
- `solveDAG` synthesizes the entire sequence of state points and outputs in topological order (e.g. Point 1 $\to$ Point 2 $\to$ Point 3 $\to$ Point 4 $\to$ Heat added $\to$ Net work $\to$ Efficiency).

### 7.2 Cognitive Fading Step Hiding
- **Beginner ($< \text{FADING\_THRESHOLD} \approx 76.4\%$):** The problem statement prompts the learner for every state point: "Determine: (1) Point 2 Temp, (2) Point 3 Temp, (3) Heat Added, (4) Net Work, (5) Efficiency." The interactive UI renders active input steps for each.
- **Advanced ($\ge \text{FADING\_THRESHOLD}$):** Mastered intermediate steps are **literally hidden** from the solution steps and omitted from statement prompts. Faded steps are not pre-answered prompts. The learner must calculate intermediate steps independently on scratch paper to solve the active terminal goals.
- **Terminal Goals:** Primary equipment capacities and overall efficiencies (`topic.terminalGoals`) are protected terminal goals that never fade.
- **Ancestry Propagation:** Submitting a correct active step reinforces all its faded ancestor equations. Failing or revealing an active step penalizes faded ancestors, lowering their mastery so scaffolding reappears on future problems.

---

## 8. Derivations & UI Typesetting

- **Zero-Comma Spacing:** Units are separated from numbers by LaTeX thin spacing (`\,`), never literal commas:
  - *Correct:* `1200\,\cfrac{\text{kJ}}{\text{s}}`, $\boxed{3.796\,\text{kip}}$, `(1 + 2)\,\text{m}`.
  - *Forbidden:* `1200,\text{kJ}`, `\boxed{3.796,kip}`.
- **Additive Unit Grouping:** Sums and differences sharing units factor outside parentheses: $(a \pm b)\,\text{unit}$.
- **Structural LaTeX Validation:** Automated tests validate syntax, brace depth, and KaTeX rendering. Never use catch-all comma regexes that fail on valid mathematical subscripts like $c_{p,w}$ or $m_{m,w}$.
- **Perceptual Mastery Gradient:** Formula mastery bars interpolate continuously in Oklab color space from danger red (`oklab(0.63 0.22 0.12)`) through warm amber (`oklab(0.75 0.06 0.16)`) to emerald green (`oklab(0.72 -0.17 0.14)`), sorted ascending (weakest equations on top).

---

## 9. Testing & Invariant Verification Suite

Run both test suites:

```bash
node --test test/run_test.js test/run_hygiene_test.js
```

| Suite | Invariant Verified |
|---|---|
| `test/run_test.js` | **Universal Round-Trip Invariant:** $u \to \text{base} \to u$ identity across all registered units. <br>**100-Problem Invariant:** 100 randomized problems (SI, US, MIXED) across all topics verify physical conservation ($< 0.05\%$), valid boxed answers, and error-free KaTeX rendering. <br>**Whole-Cycle Synthesis:** Full state point generation for beginners, natural step hiding at high mastery. <br>**Deterministic Validation:** Dual-system AST inversion and 0.1% ground truth reproduction across all topics. |
| `test/run_hygiene_test.js` | Zero legacy shadows, exact $\phi$/Fibonacci progressions, zero schema orphan variables, zero duplicate formulas within topics, zero alias collisions across `varsDb`, cross-subject commonality rules, and native `°` symbols (no `\circ`). |

---

## 10. Known Gaps and Traps

1. **[RESOLVED] Test Runner Script:** `package.json` points directly to `test/run_hygiene_test.js`.
2. **[RESOLVED] Hygiene Suite:** 0 orphan variables, 0 duplicate formulas, 0 alias collisions across all 10 topics.
3. **[RESOLVED] Fading Step Hiding:** Faded steps are excluded from interactive solution steps; answer checking reinforces/penalizes ancestors.
4. **[RESOLVED] Affine Temperature Offsets:** Exact offsets ($\pm 273.15$, $\pm 459.67$) implemented in `formatValueInUnit` and `valueToCoherentBase`.
5. **[RESOLVED] Coherent Multi-Unit Evaluation:** Pure physics expressions evaluate in coherent SI base units before projecting into `targetUnit`.
6. **[RESOLVED] Empirical Target-Side Scaling:** Relations with `requiredUnits` scale output from formula units to problem target units.
7. **[RESOLVED] Coupled State Variable Coherence:** Cycle temperatures and enthalpies are bound to unified units per problem.
8. **Trig Argument Constraint:** Trigonometric arguments must remain a bare angle variable (`sin(phi)`). Compound arguments (`sin(2 * phi)`) require an auxiliary variable.

---

## 11. Definition of Done (Checklist before submitting code)

- [ ] I read Section 1 (Engineering Philosophy) and addressed the root cause rather than patching a symptom.
- [ ] No Hard Rules in Section 2 are violated.
- [ ] Any new unit is registered in `definitions.js` with consistent atomic base scales.
- [ ] New formulas are pure physics; empirical exceptions declare `requiredUnits` and `solvable`.
- [ ] `system.js` is independent of the solver and honors `{ sys }`.
- [ ] Cycle topics define `cycleGivens`, `primaryGoals`, and `terminalGoals`.
- [ ] `node --test test/run_test.js test/run_hygiene_test.js` was run and passed with 0 failures.
- [ ] Derivation output passes KaTeX rendering and contains no literal commas before units.
- [ ] No tests were renamed, skipped, loosened, or deleted.
- [ ] LF line endings, header comment on every new file, no dead code, and no new duplication.
```
