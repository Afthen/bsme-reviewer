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
2. Always stay in brainstorm mode first: analyze root causes, design general invariants,
   and confirm alignment. Never write code or emit diffs until given explicit permission
   to proceed.
3. Before coding, state: (a) which Hard Rules (section 2) apply, (b) the files you
   will touch, (c) which tests will prove the change works.
4. Obey the Engineering Philosophy (section 1): fix root causes, write general invariants,
   avoid tunnel vision, and never patch symptoms.
5. Code output convention: When given permission to code, the diff syntax
   (<<<< ==== >>>>) is the canonical way to present code changes, but strictly only when
   the resulting diff syntax is shorter in character count than returning the drop-in
   replacement (that is the tipping point). Documentation (README.md) changes are
   always returned as a full drop-in replacement.
6. Run: node --test test/runtest.js test/runhygiene_test.js
7. Reply with: files changed, a summary of test output, and anything you could
   not verify. Do not claim a test passed unless you ran it.
```

---

## 1. Engineering Philosophy: Root Causes over Symptoms

Software engineering in this repository is governed by physical and mathematical principles, not ad-hoc heuristics:

1. **Fix Root Causes, Never Patch Symptoms (Anti-Whack-a-Mole):**
   When an unexpected value appears, identify the mathematical breakdown at the foundational layer. Never apply per-variable scalar patches, hardcoded string comparison branches, or localized `if (key === '...')` overrides.
2. **Design for General Invariants (Branchless Mathematics):**
   Prefer abstract mathematical representations over nested `if` statements. Units are affine metric spaces $(s, o)$ with 7D dimensional vectors. Scale parity, companion resolutions, and factor-label decompositions must fall out naturally from continuous equations, not system-specific switches.
3. **Avoid Tunnel Vision:**
   Never evaluate a formula in isolation. Ask: *How does this change affect the solution DAG? How does it behave in a MIXED unit problem? Does the derivation reflect the actual arithmetic performed? Will ancestor equations receive reinforcement?*
4. **Anti-Pattern Blacklist:**
   - **No string comparisons for physical scale:** Never do `if (u === "°F")` or `if (sys === "US")` to decide absolute temperature targets. Use affine space definitions.
   - **No hardcoded conversion constants or rounded duplicates:** Never hardcode `2.205`, `3,412.14`, or bespoke test scale arrays. `definitions.js` and `scales.js` are the Single Source of Truth.
   - **No per-variable conversion logic:** All unit conversions route through the semantic unit AST and dimensional registry.
   - **No regex-based syntax assertions on math strings:** Tests must validate structural ASTs, balance, and KaTeX rendering. Do not write catch-all regexes like `!/,/.test()` that falsely reject valid math subscripts like $c_{p,w}$ or $m_{m,w}$.
   - **No fragmentation of coupled state points:** Thermodynamic states of the same working fluid must never be split across incompatible units.
   - **No bespoke solvers:** If an equation cannot be solved by `solveDAG` and `isolateVariable`, fix the algebraic graph, never write a hardcoded solver.

---

## 2. Hard Rules (Non-Negotiable)

### Math and Formulas
- **R1. Formulas are nodes.** Equations are declared as relations; variables are edges. `solveDAG` finds the path dynamically. Never write bespoke "solve for X" functions or hardcoded solution orders.
- **R2. AST only.** All symbolic operations pass through `src/cas/ast.js` and `src/cas/algebra.js`. No regex rewriting of formulas, no `eval` / `new Function`, no runtime CAS dependencies.
- **R3. Obey formula language rules (section 5).** Explicit `*`, parenthesised exponents, exactly one `=`, trig arguments must be a bare angle variable.
- **R4. Case-sensitive canonical keys.** Variable keys match `[A-Za-z][A-Za-z0-9_]*` (`P_d`, `D_P1`, `m_cw`). Never lowercase or normalize keys. LaTeX formatting belongs in `symbol`, never in the canonical key.

### Physical Units & Dimensions
- **R5. Relations are pure physics.** No unit-conversion constants (`25.4`, `1000`, `60`, `3600`, `12`, `1.341`). Coherent base conversions handle scaling automatically.
- **R6. Declare empirical exceptions.**
  - Empirical correlations valid only in specific units: declare `requiredUnits: { token: "unit", targetVar: "unit" }`.
  - Differing mathematical formulations between SI and US: declare `variants.SI` and `variants.US`.
- **R7. Register every unit.** Every unit string must exist in `src/cas/units/definitions.js`. Unknown units fail validation.
- **R8. Thermodynamic Temperature Consistency.**
  - Ideal-gas and isentropic relations requiring absolute temperatures ($T_2 = T_1 r_k^{k-1}$) strictly evaluate in absolute scales ($\text{K}$ in SI, $^\circ\text{R}$ in US).
  - All state point temperatures of a cycle share an identical unit when appearing as deliverables.
  - Affine conversions must use exact offsets ($\pm 273.15$, $\pm 459.67$) and map strictly to their natural absolute companion ($^\circ\text{F} \to ^\circ\text{R}$, $^\circ\text{C} \to \text{K}$).

### Topics and Data Contracts
- **R9. Ground truth is independent.** `system.js` computes true values by hand with explicit arithmetic. It never calls the solver or unit engine.
- **R10. `createSystem` contract.** `createSystem({ sys })` accepts `"SI"` or `"US"`, returns `sys`, `_u` (unit map), and `_names`, and provides values for every non-abstract variable in `varsDb`. SI-only topics ignore `sys` but still return `sys: "SI"`.
- **R11. Globally unique equation IDs** (`eq_<topic>_<name>`).
- **R12. Share, don't copy.** Equations used across multiple subjects live in a common folder with the `eq_base_` prefix.
- **R13. Clean schemas.** Zero orphan variables, zero duplicate formulas within a topic, and zero alias collisions across `varsDb`.
- **R14. Honest engineering data.** Every constant, table value, and coefficient must carry a source comment (textbook, equation/table, page).

### Mastery, Direction-Agnostic Graphs & Cognitive Fading
- **R15. No magic numbers in learning logic.** Use `phi(n)`, `fib(n)`, `FADING_THRESHOLD`, `snapToFibonacci` from `src/mastery/constants.js`.
- **R16. Variant-aware planning.** Graph reachability calls must receive the active system context: `canSolveTarget(givens, goal, relations, S)`.
- **R17. Respect the mastery lookup contract.** `getDecayedMastery(eq, topic)` requires an object with an `id` and `baseFormula`. Steps provide `{ id: step.eqId || step.id, baseFormula: step.baseFormula }`.
- **R18. Direction-Agnostic Problem Solving.** Topics define only the physical network (`varsDb`, `relations`, `createSystem`). There are zero hardcoded starting points, fixed givens, or static goal lists. An engineer must be able to solve problems forwards, backwards, or diagonally.
- **R19. Dynamic Per-Problem Deliverables & Cognitive Fading.** Problem goals are determined dynamically at runtime based on topological distance and mastery level. Mastered intermediate steps ($\text{mastery} \ge \text{FADING\_THRESHOLD}$) are omitted from statement prompts and **literally hidden** from the interactive solution flow, while the active problem's final deliverable always remains active.

### Derivations & Unit Layout (The Visual Invariants)
- **R20. Textbook derivations.**
  - **Native Degree Symbol:** Native `°` only, never `\circ`, `^\circ`, or `^{\circ}`.
  - **Zero Leading Space in `\text{}`:** Use `\text{kW}`, never `\text{ kW}`.
  - **Strict `\,` Spacing:** Numbers and variables are separated from units by LaTeX thin spacing (`5{,}186{,}450 \, \cfrac{\cancel{\text{Btu}}}{\cancel{\text{h}}}`), including inside compound fraction bars. Zero commas before physical units.
  - **Universal Percent Mirroring:** Percentages render strictly as `\text{\%}` (and `\cancel{\text{\%}}` when cancelled), mirroring all other text units. Never write raw `%`.
  - **Additive Factoring:** Like-unit sums and differences factor outside parentheses: $(a \pm b) \, \text{unit}$ (e.g. $(10 + 20) \, \text{kW}$). Mismatched terms convert in-situ to the target unit before evaluation.
  - **In-Situ Conversion Default:** Unit conversions are placed immediately adjacent to the token being converted by default.
  - **The Hard 4-Row Fraction Tower Cap:** A compound fraction tower may not exceed 4 vertical visual rows (2 in numerator, 2 in denominator). Stepping down to the main line ($A/B \cdot E/F$) occurs *only* if in-situ placement would exceed 4 rows, or for single-dimension Option B scaling that preserves an intact compound target unit.
  - **The "Omit 1" Rule:** Never write a coefficient of $1$ before a unit token ($\cfrac{\text{kg}}{2.20462 \, \cancel{\text{lb}}}$, $\cfrac{\text{kW}}{1{,}000 \, \cancel{\text{W}}}$, $\cfrac{\cancel{\text{h}}}{60 \, \cancel{\text{min}}}$).
  - **Scalar Multiplier Placement:** Scalar multipliers sit outside the unit fraction: $60 \, \cfrac{\cancel{\text{h}}}{\cancel{\text{min}}}$, never $\cfrac{60 \, \cancel{\text{h}}}{\cancel{\text{min}}}$.
  - **Cancellation Hierarchy:** Wrap the highest possible AST node with `\cancel{}`. Whole-unit cancellation ($\cancel{\cfrac{\text{kJ}}{\text{s}}}$) is canonical; component-level cancellation ($\cfrac{\cancel{\text{Btu}}}{\cancel{\text{h}}}$) is used only as fallback when components cancel in separate places.
- **R21. Specific Energy Notation.** Quantities per unit mass ($\text{kJ/kg}$, $\text{Btu/lb}$) strictly use lowercase symbols ($q_A, q_R, w_{net}, h$), reserving uppercase ($Q, W, P$) for total energy or power.
- **R22. Number formatting.** Measured values pass through `fmtSigFig` (up to 6 significant figures, max 3 decimal places). Unit conversion scale factors pass through `fmtScale` (6 significant figures without the 3-decimal-place truncation cap).

### AI Collaboration, Testing & Process
- **R23. Never make a red test invisible.** No renaming, skipping, narrowing globs, loosening tolerances, or deleting tests. Fix the root cause.
- **R24. Bug fixes ship with regression tests.** Tests that touch mastery use real mastery functions (`recordAttempt`, `getDecayedMastery`), not constant stubs.
- **R25. Report honestly.** State files changed, test output, and anything that could not be verified.
- **R26. Brainstorm mode by default.** Always operate in brainstorm mode first to analyze root causes, establish mathematical invariants, and verify alignment. Never write code or emit diffs until given explicit permission to proceed.
- **R27. Canonical diff syntax & tipping point.** When authorized to write code, the diff syntax (`<<<< ==== >>>>`) is the canonical method, strictly when the resulting diff is shorter in character count than returning the drop-in replacement. Documentation (`README.md`) edits are always returned as full drop-in replacements.

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
    latex.js                 AST to LaTeX serializer with explicit spacing
    units/
      definitions.js         AffineScale model, 7D dimensional vectors, BASE_UNITS, unitToCancelledTex
      scales.js              Single Source of Truth: 6-sig-fig scale computation & factor-label decomposition
      analysis.js            solveUnitAlgebra: token inspection, 4-row tower enforcement, in-situ cancellations
      evaluator.js           evaluatePhysicalAST: coherent base evaluation & empirical target scaling
  core/
    graph_solver.js          solveDAG, canSolveTarget, pruneSolutionPath (cognitive fading)
    problem_gen.js           generateProblem: autonomous graph unrolling, neatness pass, statement builder
    unit_sampler.js          40/40/20 distribution, coupled variable coherence, inverse-token probability
    derivation.js            buildAlignedDerivation: no-comma spacing, additive unit factoring, factor-labels
    dimensions.js            DIMENSIONS, fmtSigFig, formatGivenValue, cancelUnit, textUnit
    topic_mix.js             Tournament targeting over multi-topic review pools
  mastery/                   constants.js (phi, fib), engine.js, storage.js
  topics/
    <subject>/<topic>/       index.js, schema.js, relations.js, system.js
test/
  validator.js               Topic schema, dual-system AST inversion, and numerical fidelity harness
  run_test.js                Universal property invariants, alien scale detector, derivation rendering
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
| `noun` | No | `string` | Reads: "A/An {noun} operates with the following specifications...". |
| `varsDb` | Yes | `object` | Variable schema dictionary (section 4.2). |
| `relations` | Yes | `Array` | Array of relation objects (section 4.3). |
| `createSystem` | Yes | `Function` | Ground truth generator: `({ sys }) => SystemState` (section 4.4). |

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

### 6.1 The AffineScale Invariant Model
All physical evaluation rests on branchless affine transformations and 7D dimensional vectors:
$$\phi_u(x) = s_u \cdot (x + o_u)$$
$$\phi_u^{-1}(y) = \frac{y}{s_u} - o_u$$

- **Coherent Base Magnitudes:** Every physical state has an invariant representation in coherent SI units ($\text{m}, \text{s}, \text{kg}, \text{N}, \text{K}, \text{W}, \text{J}$).
- **Linear Units ($o_u = 0$):** Multiplicative scale only ($y = s_u \cdot x$).
- **Affine Units ($o_u \neq 0$):** Exact offsets ($\pm 273.15$, $\pm 459.67$). The absolute companion unit is resolved mathematically by matching scale $s$ in thermal dimension $\Theta$ where $o = 0$:
  - $^\circ\text{F}$ ($s = 5/9, o = 459.67$) $\implies ^\circ\text{R}$ ($s = 5/9, o = 0$)
  - $^\circ\text{C}$ ($s = 1.0, o = 273.15$) $\implies \text{K}$ ($s = 1.0, o = 0$)
- **Scale Parity ($|\Delta| < 10^{-6}$):** If two units in a ratio share 7D dimensions and $|s_A - s_B| < 10^{-6}$ (e.g. $\text{kW}$ vs $\text{kJ/s}$), they are physically equal. No conversion factor is emitted; both cancel directly.
- **Empirical Target Scaling:** When a relation specifies `requiredUnits`, the formula evaluates in those required units; the result then scales to `targetUnit` via `numericConversionFactor = scale(reqTargetU) / scale(targetUnit)`.

### 6.2 `scales.js`: Single Source of Truth & 6-Sig-Fig Precision
`src/cas/units/scales.js` computes all conversion scalars directly from `BASE_UNITS` and `PREFIXES` in `definitions.js` using `fmtScale` (6 significant figures without the 3-decimal truncation cap):
- **Single-Dimension Scaling (Option B):** When an expression evaluates to a single dimension differing from `targetUnit` (e.g. $\text{hp} \to \text{ft}\cdot\text{lb/s}$), `scales.js` preserves the target unit intact on the main line:
  $$BP = \cfrac{EP}{\eta_g} = \cfrac{1{,}850.61 \, \cancel{\text{hp}}}{0.92} \cdot 550 \, \cfrac{\cfrac{\text{ft}\cdot\text{lb}}{\text{s}}}{\cancel{\text{hp}}} = \boxed{1{,}106{,}340 \, \cfrac{\text{ft}\cdot\text{lb}}{\text{s}}}$$
- **Compound Ratio Decomposition:** Compound unit conversions (e.g. $\frac{\text{lb/min}}{\text{Btu/h}} \to \frac{\text{kg}}{\text{kWh}}$) are never lumped into unfamiliar decimals (like $92{,}863.4$). `scales.js` decomposes them into atomic dimension pairs (`60`, `2.20462`, `3,412.14`) applied in-situ.
- **AST-Driven Mismatches:** Ratios with differing unit scales (e.g. $\text{Btu/h}$ vs $\text{Btu/min}$) extract the exact differing atomic pair from the unit AST.

### 6.3 Factor-Label Derivations & The 4-Row Cap
Derivations default to **in-situ conversions** placed directly beside the converted token.

A compound fraction has 4 vertical visual row slots:
$$\cfrac{\text{Row 1}}{\text{Row 2}} \Bigg/ \cfrac{\text{Row 3}}{\text{Row 4}}$$

Because conversion factors multiply horizontally beside variables in the numerator (Rows 1 & 2) and denominator (Rows 3 & 4), they preserve the 4-row limit:
$$\%_{ip} = \cfrac{Q_{ip}}{Q_f} = \cfrac{5{,}186{,}450 \, \cfrac{\cancel{\text{Btu}}}{\cancel{\text{h}}} \cdot 60 \, \cfrac{\cancel{\text{h}}}{\cancel{\text{min}}}}{227{,}476 \, \cfrac{\cancel{\text{Btu}}}{\cancel{\text{min}}}} = \boxed{38 \, \text{\%}}$$

- **Stepping Down:** Stepping down to the main line ($A/B \cdot E/F$) is an overflow valve used *only* if an expression itself already contains nested fractions that would push visual height $\ge 5$ rows, or under Option B single-dimension scaling.

### 6.4 Multi-System Sampling & Coupled State Coherence
- **Problem Distribution:** 40% Pure SI / 40% Pure US / 20% MIXED.
- **Coupled Variable Coherence:** State deliverables of the same fluid or cycle share an identical unit when requested as outputs; boundary givens roll freely to test multi-unit fluency.
- **Significant Figure Retention:** Conversions to alternative units must retain $\ge 3$ significant figures under the 3-decimal-place limit ($|v| \ge 0.100$).
- **Compound Decomposition:** Decomposed unit options (e.g. $\text{W} \to \text{J/s} \to \text{N}\cdot\text{m/s} \to \text{kg}\cdot\text{m}^2/\text{s}^3$) are sampled with probability inversely proportional to token count: $w_i = 1/t_i$.

---

## 7. Direction-Agnostic Synthesis & Natural Cognitive Fading

### 7.1 Direction-Agnostic Graph Unrolling
Topics have no fixed starting or ending variables. The generator treats every relation network as an undirected bipartite graph:
- `generateAutonomousProblem` prioritizes the learner's weakest relations and samples any valid variable as the dynamic deliverable (`goalVar`).
- `determineGraphDistance(mastery)` scales chain length monotonically via Fibonacci hops (`0` $\to$ `1` $\to$ `2` $\to$ `3` $\to$ `5` $\to$ `8` $\to$ `21`) as mastery increases.
- `solveDAG` resolves paths forwards, backwards, or diagonally from the minimal pruned givens.

### 7.2 Cognitive Fading Step Hiding
- **Beginner ($< \text{FADING\_THRESHOLD} \approx 76.4\%$):** Short 0–1 hop problems; every intermediate step is actively prompted.
- **Advanced ($\ge \text{FADING\_THRESHOLD}$):** Multi-hop interconnected chains; mastered intermediate steps are **literally hidden** from the solution steps and omitted from statement prompts. The learner calculates intermediate states independently to solve the dynamic active deliverable.
- **Ancestry Propagation:** Submitting a correct active step reinforces all its faded ancestor equations. Failing or revealing an active step penalizes faded ancestors so scaffolding reappears on future problems.

---

## 8. Derivations & UI Typesetting

- **Canonical Cancellation Hierarchy:**
  - **Whole-Unit (Canonical):** Wrap the entire unit block when cancelling identical scales or whole terms:
    $$\cfrac{1{,}440 \, \cancel{\text{kW}}}{4{,}000 \, \cancel{\cfrac{\text{kJ}}{\text{s}}}} = \boxed{36 \, \text{\%}}$$
  - **Component-Level (Fallback):** Cancel individual sub-tokens *only* when components cancel against separate factors ($\cfrac{\cancel{\text{Btu}}}{\cancel{\text{h}}} \cdot 60 \, \cfrac{\cancel{\text{h}}}{\cancel{\text{min}}}$).
- **Omit 1:** Write $\cfrac{\text{kg}}{2.20462 \, \cancel{\text{lb}}}$, never $\cfrac{1 \, \text{kg}}{\dots}$.
- **Scalars Outside:** Write $60 \, \cfrac{\cancel{\text{h}}}{\cancel{\text{min}}}$, never $\cfrac{60 \, \cancel{\text{h}}}{\cancel{\text{min}}}$.
- **Percent Symbol:** Always `\text{\%}` (and `\cancel{\text{\%}}`), mirrored across all unit pipelines.
- **Zero-Comma Spacing:** Units are separated from numbers by LaTeX thin spacing (`\,`), never literal commas.
- **Additive Unit Grouping:** Like-unit sums and differences factor outside parentheses: $(a \pm b) \, \text{unit}$. Mismatched additive terms convert in-situ to the target unit.
- **Perceptual Mastery Gradient:** Formula mastery bars interpolate continuously in Oklab color space from danger red (`oklab(0.63 0.22 0.12)`) through warm amber (`oklab(0.75 0.06 0.16)`) to emerald green (`oklab(0.72 -0.17 0.14)`), sorted ascending.

---

## 9. Authoring Guide & Blueprint for New Topics & Subjects

Every topic follows a strict **4-File Domain Architecture** under `src/topics/<subject>/<topic_name>/`. New material must be mathematically closed, unit-coherent, and independently verifiable against textbook ground truth.

```text
src/topics/<subject>/<topic_name>/
├── index.js       # Topic manifest, categorization, and engine wiring
├── schema.js      # Scoped variable dictionary (dimensions, units, aliases)
├── relations.js   # Invertible physics relations (nodes, baseFormula, canonicalTex)
└── system.js      # Independent ground truth generator ({ sys } => SystemState)
```

### 9.1 Topic Manifest Blueprint (`index.js`)

```javascript
/**
 * src/topics/<subject>/<topic>/index.js
 */
import { MY_TOPIC_VARS_DB } from "./schema.js";
import { MY_TOPIC_RELATIONS } from "./relations.js";
import { createMyTopicSystem } from "./system.js";

export const myTopic = Object.freeze({
  id: "<subject>_<topic_name>",             // Globally unique key, matching TOPICS export
  title: "Topic Display Title",             // Level 3 dropdown label
  subject: "Subject Name",                  // Level 1 dropdown category (e.g. "Powerplant Design")
  category: "Subcategory Name",             // Level 2 folder (or null if standalone under subject)
  noun: "specific mechanical equipment",    // Reads: "A/An {noun} operates with the following..."
  varsDb: MY_TOPIC_VARS_DB,                 // Schema dictionary
  relations: MY_TOPIC_RELATIONS,           // Pure physics relation graph
  createSystem: createMyTopicSystem         // Independent ground truth generator
  // Note: Zero hardcoded givens or goal lists. All paths are resolved dynamically at runtime.
});
```

### 9.2 Variable Schema Blueprint (`schema.js`)

```javascript
/**
 * src/topics/<subject>/<topic>/schema.js
 */
import { DIMENSIONS } from "../../../core/dimensions.js";

export const MY_TOPIC_VARS_DB = Object.freeze({
  "P_out": {
    name: "Output Power",
    symbol: "P_{out}",
    dimension: DIMENSIONS.POWER,
    unit: "kW",                             // Registered unit from definitions.js
    nameAliases: ["Output Power", "Delivered Brake Power", "Power Capacity"],
    symbolAliases: ["P_{out}", "P_b", "\\text{BHP}"],
    aliases: ["Output Power", "Delivered Brake Power", "Power Capacity", "P_out", "P_b"]
  },
  "N_teeth": {
    name: "Tooth Count",
    symbol: "T",
    dimension: DIMENSIONS.COUNT,
    unit: "teeth",
    isInteger: true,                        // Enforces ±0.5 integer tolerance checks
    aliases: ["Tooth Count", "Number of Teeth"]
  },
  "c_p": {
    name: "Specific Heat",
    symbol: "c_p",
    dimension: DIMENSIONS.SPECIFIC_ENERGY,
    unit: "kJ/kg-K",
    isConstant: true,                       // Tags physical constants for high-mastery recall mode
    display: 1.0062,                        // Tabulated textbook academic display
    aliases: ["Specific Heat at Constant Pressure", "c_p"]
  }
});
```

#### Schema Invariants:
1. **Registered Units:** The `unit` string must exist in `src/cas/units/definitions.js`.
2. **Native Degree:** Use native `°` in all symbols and units (`°C`, `°F`, `°R`, `°`). Never use `\circ`.
3. **No Collision Rule:** No alias may be claimed by two different variables across the subject schema.
4. **Specific Energy:** Always use lowercase symbols for specific energy ($q_A, q_R, w_{net}, h$). Reserve uppercase ($Q, W, P$) for total power/energy.

### 9.3 Relations Graph Blueprint (`relations.js`)

```javascript
/**
 * src/topics/<subject>/<topic>/relations.js
 */
export const MY_TOPIC_RELATIONS = Object.freeze([
  {
    id: "eq_<topic>_power_flow",
    name: "Power from Mass Flow and Work",
    canonicalTex: "P = \\dot{m} w_{net}",
    baseFormula: "P = m_flow * w_net",      // Explicit '*', parenthesized exponents
    nodes: ["P", "m_flow", "w_net"]
  },
  {
    id: "eq_<topic>_bending_stress",
    name: "Tooth Bending Stress",
    variants: {
      SI: {
        canonicalTex: "s = \\frac{F_t}{b m Y}",
        baseFormula: "s = W_t / (b * m * Y)",
        nodes: ["s", "W_t", "b", "m", "Y"]
      },
      US: {
        canonicalTex: "s = \\frac{F_t P_d}{b Y}",
        baseFormula: "s = (W_t * P_d) / (b * Y)",
        nodes: ["s", "W_t", "P_d", "b", "Y"]
      }
    },
    canonicalTex: "s = \\frac{F_t}{b m Y}",
    baseFormula: "s = W_t / (b * m * Y)",
    nodes: ["s", "W_t", "b", "m", "Y"]
  },
  {
    id: "eq_<topic>_empirical_flow",
    name: "Empirical Heat Loss Correlation",
    canonicalTex: "q_{loss} = 0.05 v^{0.8} \\Delta T",
    baseFormula: "q_loss = 0.05 * (v^0.8) * dT",
    nodes: ["q_loss", "v", "dT"],
    requiredUnits: { v: "m/s", dT: "K", q_loss: "kW" }
  }
]);
```

#### Relation Invariants:
1. **Prefix Convention:** Common equations shared across multiple subjects live in `common/` and use the `eq_base_` prefix. Unique topic equations use `eq_<topic>_<name>`.
2. **Pure Physics:** Never bake conversion constants into formulas.

### 9.4 Ground Truth Generator Blueprint (`system.js`)

```javascript
/**
 * src/topics/<subject>/<topic>/system.js
 */
import { MY_TOPIC_VARS_DB } from "./schema.js";

export function createMyTopicSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  const m_flow = isUS ? 50.0 : 25.0;        // lb/s vs kg/s
  const w_net = isUS ? 120.0 : 280.0;       // Btu/lb vs kJ/kg
  const P = m_flow * w_net;                 // Pure hand arithmetic

  const _names = {};
  for (const [k, meta] of Object.entries(MY_TOPIC_VARS_DB)) {
    _names[k] = meta.nameAliases?.[0] || meta.name;
  }

  const _u = isUS
    ? { m_flow: "lb/s", w_net: "Btu/lb", P: "Btu/s" }
    : { m_flow: "kg/s", w_net: "kJ/kg", P: "kW" };

  return { sys, m_flow, w_net, P, _names, _u };
}
```

### 9.5 Subject Export Registration

1. Export the topic in `src/topics/<subject>/index.js`.
2. Confirm the topic `id` matches its dictionary key in `TOPICS`.
3. Run `node --test test/run_test.js test/run_hygiene_test.js` and verify 0 failures across dual-system inversion ($< 0.1\%$), zero schema orphans, zero alias collisions, and canonical scale verification.

---

## 10. Testing & Invariant Verification Suite

Run both test suites:

```bash
node --test test/run_test.js test/run_hygiene_test.js
```

| Suite | Invariant Verified |
|---|---|
| `test/run_test.js` | **Universal Round-Trip Invariant:** $u \to \text{base} \to u$ identity across all registered units. <br>**100-Problem Stress Invariant:** 100 randomized problems (SI, US, MIXED) verify physical conservation ($< 0.05\%$), valid boxed answers, and error-free KaTeX rendering. <br>**Alien Scale Factor Detector:** Queries `scales.js` (`isCanonicalScaleFactor`) to reject any lumped or unfamiliar conversion scalars without bespoke test lists. <br>**Direction-Agnostic Synthesis:** Dynamic longest-path generation at high mastery, natural step hiding, 4-row tower cap, and encompassing cancellations. |
| `test/run_hygiene_test.js` | Zero legacy shadows, exact $\phi$/Fibonacci progressions, zero schema orphan variables, zero duplicate formulas within topics, zero alias collisions across `varsDb`, cross-subject commonality rules, and native `°` symbols (no `\circ`). |

---

## 11. Definition of Done (Checklist before submitting code)

- [ ] Stayed in brainstorm mode until explicit permission to code was granted.
- [ ] Addressed the root cause rather than patching a symptom.
- [ ] No Hard Rules in Section 2 are violated.
- [ ] Any new unit is registered in `definitions.js` with consistent atomic base scales and 7D dimensional vectors.
- [ ] New formulas are pure physics; empirical exceptions declare `requiredUnits`.
- [ ] `system.js` is independent of the solver and honors `{ sys }`.
- [ ] Unit conversions default to in-situ, respect the 4-row fraction tower cap, omit coefficients of 1, keep scalars outside unit ratios, and use canonical encompassing `\cancel`.
- [ ] Percentages render as `\text{\%}` and degree symbols use native `°`.
- [ ] Code changes use canonical diff syntax (`<<<< ==== >>>>`) unless shorter as a drop-in replacement; `README.md` edits use full drop-in replacement.
- [ ] `node --test test/run_test.js test/run_hygiene_test.js` was run and passed with 0 failures.
- [ ] Derivation output passes KaTeX rendering and contains no literal commas before units.
- [ ] No tests were renamed, skipped, loosened, or deleted.
- [ ] LF line endings, header comment on every new file, no dead code, and no new duplication.
