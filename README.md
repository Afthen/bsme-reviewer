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
   (<<<< ==== >>>>) is the canonical way to present changes, but strictly only when
   the resulting diff syntax is shorter in character count than returning the drop-in
   replacement (that is the tipping point).
6. Run: node --test test/run_test.js test/run_hygiene_test.js
7. Reply with: files changed, a summary of test output, and anything you could
   not verify. Do not claim a test passed unless you ran it.
```

---

## 1. Engineering Philosophy: Root Causes over Symptoms

Software engineering in this repository is governed by physical and mathematical principles, not ad-hoc heuristics:

1. **Fix Root Causes, Never Patch Symptoms (Anti-Whack-a-Mole):**
   When an unexpected value appears, identify the mathematical breakdown at the foundational layer. Never apply per-variable scalar patches, hardcoded string comparison branches, or localized `if (key === '...')` overrides.
2. **Design for General Invariants (Branchless Mathematics):**
   Prefer abstract mathematical representations over nested `if` statements. Units are affine metric spaces $(s, o)$. Scale parity and companion resolutions must fall out naturally from continuous equations, not system-specific switches.
3. **Avoid Tunnel Vision:**
   Never evaluate a formula in isolation. Ask: *How does this change affect the solution DAG? How does it behave in a MIXED unit problem? Does the derivation reflect the actual arithmetic performed? Will ancestor equations receive reinforcement?*
4. **Anti-Pattern Blacklist:**
   - **No string comparisons for physical scale:** Never do `if (u === "°F")` or `if (sys === "US")` to decide absolute temperature targets. Use affine space definitions.
   - **No per-variable conversion logic:** All unit conversions route through the semantic unit AST and dimensional registry.
   - **No regex-based syntax assertions on math strings:** Tests must validate structural ASTs, balance, and KaTeX rendering.
   - **No fragmentation of coupled state points:** Thermodynamic states of the same working fluid must never be split across incompatible units.
   - **No bespoke solvers:** If an equation cannot be solved by `solveDAG` and `isolateVariable`, fix the algebraic graph, but never write a hardcoded solver.

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
  - Affine conversions must use exact offsets ($\pm 273.15$, $\pm 459.67$) and map strictly to their natural absolute companion ($^\circ\text{F} \to ^\circ\text{R}$, $^\circ\text{C} \to \text{K}$).

### Derivations & Unit Layout (The Visual Invariants)
- **R20. Textbook derivations.**
  - **Native Degree Symbol:** Native `°` only, never `\circ`, `^\circ`, or `^{\circ}`.
  - **Zero Leading Space in `\text{}`:** Use `\text{kW}`, never `\text{ kW}`.
  - **Strict `\,` Spacing:** Numbers and variables are separated from units by LaTeX thin spacing (`5{,}186{,}450 \, \cfrac{\cancel{\text{Btu}}}{\cancel{\text{h}}}`). Zero commas before physical units.
  - **Universal Percent Mirroring:** Percentages are rendered strictly as `\text{\%}` (and `\cancel{\text{\%}}` when cancelled). Never write raw `%` (TeX comment crash).
  - **Additive Factoring:** Like-unit sums and differences factor outside parentheses: $(a \pm b) \, \text{unit}$ (e.g. $(10 + 20) \, \text{kW}$). Mismatched terms convert in-situ to the target unit before evaluation.
  - **In-Situ Conversion Default:** Unit conversions are placed immediately adjacent to the token being converted by default.
  - **The Hard 4-Row Fraction Tower Cap:** A compound fraction tower may not exceed 4 vertical visual rows (2 in numerator, 2 in denominator). If an in-situ conversion would force height $\ge 5$ rows, it steps down to the main line ($A/B \cdot E/F$).
  - **The "Omit 1" Rule:** Never write a coefficient of $1$ before a unit token ($\cfrac{\text{kg}}{2.205 \, \cancel{\text{lb}}}$, $\cfrac{\text{kW}}{1{,}000 \, \cancel{\text{W}}}$, $\cfrac{\cancel{\text{h}}}{60 \, \cancel{\text{min}}}$).
  - **Scalar Multiplier Placement:** Scalar multipliers sit outside the unit fraction: $60 \, \cfrac{\cancel{\text{h}}}{\cancel{\text{min}}}$, never $\cfrac{60 \, \cancel{\text{h}}}{\cancel{\text{min}}}$.
  - **Cancellation Hierarchy:** Wrap the highest possible AST node with `\cancel{}`. Whole-unit cancellation ($\cancel{\cfrac{\text{kJ}}{\text{s}}}$) is canonical; component-level cancellation ($\cfrac{\cancel{\text{Btu}}}{\cancel{\text{h}}}$) is used only when components cancel in separate places.
- **R21. Specific Energy Notation.** Quantities per unit mass ($\text{kJ/kg}$, $\text{Btu/lb}$) strictly use lowercase symbols ($q_A, q_R, w_{net}, h$), reserving uppercase ($Q, W, P$) for total energy or power.
- **R22. Number formatting.** Number display passes through `fmtSigFig` (up to 6 significant figures, maximum 3 decimal places).

### AI Collaboration & Process
- **R23. Never make a red test invisible.** No renaming, skipping, narrowing globs, loosening tolerances, or deleting tests. Fix the root cause.
- **R24. Bug fixes ship with regression tests.** Tests that touch mastery use real mastery functions (`recordAttempt`, `getDecayedMastery`), not constant stubs.
- **R25. Report honestly.** State files changed, test output, and anything that could not be verified.
- **R26. Brainstorm mode by default.** Always operate in brainstorm mode first to analyze root causes, establish mathematical invariants, and verify alignment. Never write code or emit diffs until given explicit permission to proceed.
- **R27. Canonical diff syntax & tipping point.** When authorized to write code, the diff syntax (`<<<< ==== >>>>`) is the canonical method, but strictly only when the resulting diff syntax is shorter in character count than simply returning the drop-in replacement (that is the tipping point).

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
      definitions.js         AffineScale model, BASE_UNITS, semanticASTToTex, unitToCancelledTex
      analysis.js            solveUnitAlgebra: token inspection, 4-row tower enforcement, in-situ cancellations
      evaluator.js           evaluatePhysicalAST: coherent base evaluation & empirical target scaling
  core/
    graph_solver.js          solveDAG, canSolveTarget, pruneSolutionPath (cognitive fading)
    problem_gen.js           generateProblem: whole-cycle synthesis, neatness pass, statement builder
    unit_sampler.js          40/40/20 distribution, coupled variable coherence, inverse-token probability
    derivation.js            buildAlignedDerivation: no-comma spacing, additive unit factoring, factor-labels
    dimensions.js            DIMENSIONS, fmtSigFig, formatGivenValue, cancelUnit, textUnit
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

## 4. Physical Units & Dimensional Architecture

### 4.1 The AffineScale Invariant Model
All physical evaluation rests on branchless affine transformations:
$$\phi_u(x) = s_u \cdot (x + o_u)$$
$$\phi_u^{-1}(y) = \frac{y}{s_u} - o_u$$

- **Linear Units ($o_u = 0$):** Multiplicative scale only ($y = s_u \cdot x$).
- **Affine Units ($o_u \neq 0$):** Additive origin shift. The absolute companion unit is discovered mathematically by matching scale $s$ in thermal dimension $\Theta$ where $o = 0$:
  - $^\circ\text{F}$ ($s = 5/9, o = 459.67$) $\implies ^\circ\text{R}$ ($s = 5/9, o = 0$)
  - $^\circ\text{C}$ ($s = 1.0, o = 273.15$) $\implies \text{K}$ ($s = 1.0, o = 0$)
- **Scale Parity ($|\Delta| < 10^{-6}$):** If two units in a ratio share dimensions and $|s_A - s_B| < 10^{-6}$ (e.g. $\text{kW}$ vs $\text{kJ/s}$), they are physically equal. No conversion factor is emitted; both cancel directly.

### 4.2 Factor-Label Derivations & The 4-Row Cap
Derivations default to **in-situ conversions** placed directly beside the converted token.

A compound fraction has 4 vertical visual row slots:
$$\cfrac{\text{Row 1}}{\text{Row 2}} \Bigg/ \cfrac{\text{Row 3}}{\text{Row 4}}$$

Because conversion factors multiply horizontally beside variables in the numerator (Rows 1 & 2) and denominator (Rows 3 & 4), they preserve the 4-row limit:

$$\%_{ip} = \cfrac{Q_{ip}}{Q_f} = \cfrac{5{,}186{,}450 \, \cfrac{\cancel{\text{Btu}}}{\cancel{\text{h}}} \cdot 60 \, \cfrac{\cancel{\text{h}}}{\cancel{\text{min}}}}{227{,}476 \, \cfrac{\cancel{\text{Btu}}}{\cancel{\text{min}}}} = \boxed{38 \, \text{\%}}$$

- **Stepping Down:** Stepping down to the main line ($A/B \cdot E/F$) is an overflow valve used *only* if an expression itself already contains nested fractions that would push visual height $\ge 5$ rows.

### 4.3 Cancellation Hierarchy
- **Whole-Unit (Canonical):** Wrap the entire unit block when cancelling identical scales:
  $$\cfrac{1{,}440 \, \cancel{\text{kW}}}{4{,}000 \, \cancel{\cfrac{\text{kJ}}{\text{s}}}} = \boxed{36 \, \text{\%}}$$
- **Component-Level (Fallback):** Cancel individual sub-tokens *only* when components cancel against separate factors:
  $$\cfrac{\cancel{\text{Btu}}}{\cancel{\text{h}}} \cdot 60 \, \cfrac{\cancel{\text{h}}}{\cancel{\text{min}}}$$

### 4.4 Formatting Invariants
- **Omit 1:** Write $\cfrac{\text{kg}}{2.205 \, \cancel{\text{lb}}}$, never $\cfrac{1 \, \text{kg}}{\dots}$.
- **Scalars Outside:** Write $60 \, \cfrac{\cancel{\text{h}}}{\cancel{\text{min}}}$, never $\cfrac{60 \, \cancel{\text{h}}}{\cancel{\text{min}}}$.
- **Percent Symbol:** Render as `\text{\%}` (and `\cancel{\text{\%}}`), mirrored across all unit pipelines.

---

## 5. Testing & Invariant Verification Suite

Run both test suites:

```bash
node --test test/run_test.js test/run_hygiene_test.js
```

| Suite | Invariant Verified |
|---|---|
| `test/run_test.js` | **Universal Round-Trip Invariant:** $u \to \text{base} \to u$ identity across all registered units. <br>**100-Problem Stress Invariant:** 100 randomized problems (SI, US, MIXED) verify physical conservation ($< 0.05\%$), valid boxed answers, and error-free KaTeX rendering. <br>**Whole-Cycle Synthesis:** Full state point generation for beginners, natural step hiding at high mastery. <br>**Derivation Invariants:** 4-row fraction tower limits, in-situ conversions, omit-1 rule, and encompassing cancellations. |
| `test/run_hygiene_test.js` | Zero legacy shadows, exact $\phi$/Fibonacci progressions, zero schema orphan variables, zero duplicate formulas within topics, zero alias collisions across `varsDb`, cross-subject commonality rules, and native `°` symbols (no `\circ`). |

---

## 6. Definition of Done (Checklist before submitting code)

- [ ] Remained in brainstorm mode until explicit permission to code was granted.
- [ ] Addressed the root cause rather than patching a symptom.
- [ ] No Hard Rules in Section 2 are violated.
- [ ] Any new unit is registered in `definitions.js` with consistent atomic base scales.
- [ ] New formulas are pure physics; empirical exceptions declare `requiredUnits`.
- [ ] Unit conversions default to in-situ and strictly respect the 4-row fraction tower cap.
- [ ] Encompassing `\cancel` wraps whole compound units where applicable.
- [ ] Percentages render as `\text{\%}`, units omit coefficients of 1, and scalars sit outside unit fractions.
- [ ] Code modifications use the canonical diff syntax (`<<<< ==== >>>>`) unless the drop-in replacement is shorter in character count.
- [ ] `node --test test/run_test.js test/run_hygiene_test.js` passes with 0 failures.
- [ ] Derivation output passes KaTeX rendering and contains no literal commas before units.
- [ ] LF line endings, no dead code, and no new duplication.

---

## 7. Authoring Guide & Blueprint for New Topics & Subjects

Every topic in the repository follows a strict **4-File Domain Architecture** under `src/topics/<subject>/<topic_name>/`. New material must be mathematically closed, unit-coherent, and independently verifiable against textbook ground truth.

```text
src/topics/<subject>/<topic_name>/
├── index.js       # Topic manifest, categorization, and engine wiring
├── schema.js      # Scoped variable dictionary (dimensions, units, aliases)
├── relations.js   # Invertible physics relations (nodes, baseFormula, canonicalTex)
└── system.js      # Independent ground truth generator ({ sys } => SystemState)
```

---

### 7.1 Topic Manifest Blueprint (`index.js`)

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
  varsDb: MY_TOPIC_VARS_DB,
  relations: MY_TOPIC_RELATIONS,
  createSystem: createMyTopicSystem,

  // Required only for multi-state thermodynamic cycles or complex fluid circuits:
  cycleGivens: ["T_1", "r_k", "r_c"],      // Minimal boundary conditions
  primaryGoals: ["T_2", "T_3", "T_4"],     // Full topological state progression
  terminalGoals: ["e_th", "w_net"]         // Protected terminal deliverables (NEVER fade)
});
```

---

### 7.2 Variable Schema Blueprint (`schema.js`)

Every variable represents a physical edge in the graph. Zero orphan variables and zero alias collisions are permitted.

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

---

### 7.3 Relations Graph Blueprint (`relations.js`)

Relations represent formula nodes. Pure physics only—zero unit conversion constants allowed.

```javascript
/**
 * src/topics/<subject>/<topic>/relations.js
 */
export const MY_TOPIC_RELATIONS = Object.freeze([
  // 1. Pure Physics Relation (Invertible across all variables)
  {
    id: "eq_<topic>_power_flow",
    name: "Power from Mass Flow and Work",
    canonicalTex: "P = \\dot{m} w_{net}",
    baseFormula: "P = m_flow * w_net",      // Strict AST syntax: explicit '*', parenthesized exponents
    nodes: ["P", "m_flow", "w_net"]
  },

  // 2. Dual-System Variant (When SI and US formulas differ mathematically)
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

  // 3. Empirical Correlation (Strict unit locking)
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
2. **Formula Syntax:** Explicit `*`, parenthesized compound exponents (`x^(k - 1)`), parenthesized compound denominators (`a / (b * c)`), bare angle arguments in trig (`cos(psi)`).
3. **Pure Physics:** Never bake `60`, `3600`, `25.4`, or `1.341` into a formula to convert units. Let the `AffineScale` engine project units coherently.

---

### 7.4 Ground Truth Generator Blueprint (`system.js`)

`createSystem({ sys })` generates the independent mathematical ground truth. It must **never** call `solveDAG`, `isolateVariable`, or the unit engine.

```javascript
/**
 * src/topics/<subject>/<topic>/system.js
 */
import { MY_TOPIC_VARS_DB } from "./schema.js";

export function createMyTopicSystem({ sys = "SI" } = {}) {
  const isUS = sys === "US";

  // 1. Independent Ground Truth Calculation (hand arithmetic)
  const m_flow = isUS ? 50.0 : 25.0;        // lb/s vs kg/s
  const w_net = isUS ? 120.0 : 280.0;       // Btu/lb vs kJ/kg
  const P = m_flow * w_net;                 // Pure hand arithmetic

  // 2. Build Human-Readable Aliases Map
  const _names = {};
  for (const [k, meta] of Object.entries(MY_TOPIC_VARS_DB)) {
    _names[k] = meta.nameAliases?.[0] || meta.name;
  }

  // 3. Coherent System Units Map
  const _u = isUS
    ? { m_flow: "lb/s", w_net: "Btu/lb", P: "Btu/s" }
    : { m_flow: "kg/s", w_net: "kJ/kg", P: "kW" };

  return {
    sys,
    m_flow,
    w_net,
    P,
    _names,
    _u
  };
}
```

---

### 7.5 Subject Export Registration

Once the 4 files are written, wire them into the subject and global registries:
1. Export the topic in `src/topics/<subject>/index.js`.
2. Confirm the topic ID matches its dictionary key in `TOPICS`.

---

### 7.6 Topic Validation Checklist (Definition of Done)

Before committing any new topic, run the test suites:
```bash
node --test test/run_test.js test/run_hygiene_test.js
```

Ensure the topic satisfies:
- [ ] **Dual-System Inversion:** Tested via `test/validator.js` across both SI and US with $< 0.1\%$ relative error on all invertible variable pairs.
- [ ] **Zero Schema Orphans:** Every variable in `varsDb` is active in relations or generated in `createSystem`.
- [ ] **Zero Alias Collisions:** Human aliases are unique across variables.
- [ ] **No Duplicate Formulas:** Base formulas are unique within the topic. Shared formulas use `eq_base_` in `common/`.
- [ ] **Native Degree:** Uses `°` exclusively, zero instances of `\circ`.
- [ ] **Derivation Quality:** Boxed answers are valid, unit cancellations follow the 4-row cap, percentages render as `\text{\%}`, and numbers omit coefficients of 1.
