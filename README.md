# BSME Reviewer

A graph-based problem generator and spaced-repetition reviewer for Mechanical Engineering board-exam subjects (Machine Design, Air Conditioning, with Powerplant Design planned). Every equation is a node in a graph. The engine chains equations into multi-step problems, checks answers, renders textbook-style derivations, and tracks mastery per equation with golden-ratio / Fibonacci memory curves.

- **Stack:** vanilla ES modules, no bundler, no runtime dependencies except KaTeX (CDN). State lives in `localStorage`.
- **Run:** serve the folder statically (`python3 -m http.server`) and open `index.html`. ES modules do not load from `file://`.
- **Test:** `node --test test/run_test.js test/run_hygiene_test.js` (Node 22). See section 10 for why the command is spelled out.

> **If you are an AI model:** this document is your specification. Section 2 is a set of hard rules; code that breaks them will be rejected even if it "works". Section 12 lists known defects: do not build on them silently, and do not claim they are fixed unless you verified it.

---

## 0. Using this file with an AI model

Paste or attach this file, then use this prompt:

```text
You are modifying the BSME Reviewer repository.
1. Read README.md completely before writing any code. It overrides your defaults.
2. Before coding, state: (a) which Hard Rules (section 2) apply, (b) the files you
   will touch, (c) which tests will prove the change works.
3. Write code that satisfies every rule in section 2. If a rule conflicts with my
   request, stop and ask instead of choosing.
4. Run: node --test test/run_test.js test/run_hygiene_test.js
5. Reply with: files changed, a summary of test output, and anything you could
   not verify. Do not claim a test passed unless you ran it.
```

Some tools load a project file automatically (for example `CLAUDE.md` for Claude Code, `AGENTS.md` for Codex-style agents, `.github/copilot-instructions.md` for Copilot, `.cursorrules` for Cursor). If you use one, make it a single line: `Read README.md in full before writing code.`

---

## 1. Design philosophy in one paragraph

Equations are data, not code. A formula is declared once as a relation; the solver, the algebra engine, the unit engine, the derivation renderer and the mastery tracker all read that one declaration. Ground truth is written independently of the formulas and a validator proves the two agree. Units are handled by a registry, never by constants buried in formulas. The learning model uses golden-ratio and Fibonacci constants instead of tuned magic numbers. Tests are meant to be able to fail: they inspect ASTs and numeric values rather than checking that something merely exists.

---

## 2. Hard rules (non-negotiable)

### Math and formulas
- **R1. Formulas are nodes.** Add an equation by adding a relation. Never write a bespoke "solve for X" function, a hard-coded solution order, or a per-topic solver. Variables are edges; `solveDAG` finds the path.
- **R2. AST only.** All symbolic work goes through `src/cas/ast.js` and `src/cas/algebra.js`. No regex rewriting of formulas, no `eval` / `new Function`, no CAS dependency (Nerdamer was removed on purpose).
- **R3. Obey the formula language (section 5).** Explicit `*`, parenthesised exponents, exactly one `=`, trig arguments that are a bare angle variable. Several violations fail *silently*.
- **R4. Case-sensitive canonical keys.** Keys match `[A-Za-z][A-Za-z0-9_]*` (`P_d`, `p_b`, `D_P1`). Never lowercase or normalise keys, never put braces in keys, never use reserved names (`pi e sin cos tan asin acos atan sqrt exp ln log abs`). TeX belongs in `symbol`, not in the key.

### Units
- **R5. Relations are pure physics.** No unit-conversion constants (`25.4`, `1000`, `60`, `12`, ...). The unit engine converts.
- **R6. Declare the exceptions.**
  - Formula only valid in certain units (Buckingham, Liley, Carrier, correlations in `°API`, ...): declare `requiredUnits`.
  - Formula whose form differs between SI and US: declare `variants.SI` / `variants.US`, each with its own `nodes` if the variables differ.
  - Formula that cannot be algebraically inverted for some variable (exponent, transcendental): declare `solvable: [...]`.
- **R7. Register every unit.** Every unit string must exist in `src/cas/units/definitions.js`. Unknown units fail validation and are otherwise silently treated as dimensionless. Never invent a unit string.
- **R8. No absolute temperatures in unit-converted relations.** Affine offsets are declared in the registry but **not applied** anywhere (section 6.3). Use temperature differences, or pin `requiredUnits` to `°C` and keep the topic SI-only.

### Topics and data
- **R9. Ground truth is independent.** `system.js` computes true values by hand, with explicit conversions. It never calls the solver, `isolateVariable` or the unit engine. The validator's job is to prove the two agree.
- **R10. `createSystem` contract.** `createSystem({ sys })` accepts `"SI"` or `"US"`, returns `sys`, `_u` (unit per key) and `_names`, and provides a value for every non-abstract key in `varsDb`. SI-only topics ignore `sys` but still return `sys: "SI"`.
- **R11. Globally unique equation ids** (`eq_<topic>_<name>`). Mastery is one global map keyed by id. The `eq_base_` prefix is **reserved** for shared formulas in a `common/` folder; it also changes how mastery decays (section 8).
- **R12. Share, don't copy.** A formula used by more than one subject lives in `core/` or a `common/` folder (enforced by a hygiene test).
- **R13. Clean schemas.** No orphan variables, no duplicate formulas, no alias collisions inside a topic. Names of 2 characters or fewer and LaTeX macros are exempt from alias checks.
- **R14. Don't invent engineering data.** Every coefficient, constant, table value and empirical formula carries a source comment (textbook and equation/page when known). If you do not know the source or value, say so and ask. Never adjust a number just to make a test pass.

### Mastery and generation
- **R15. No magic numbers in learning logic.** Use `phi(n)`, `fib(n)`, `FADING_THRESHOLD`, `snapToFibonacci` from `src/mastery/constants.js`.
- **R16. Variant-aware planning.** Any reachability or planning call must receive the real system `S`: `canSolveTarget(givens, goal, relations, S)`. Planning against the default formula while solving against the SI variant produces empty problems.
- **R17. Respect the mastery lookup contract.** `getDecayedMastery(eq, topic)` needs an object with an `id` (and `baseFormula`). A solver *step* has `eqId`, not `id`; a variable key is not an equation id. Passing either silently yields `0`.

### Output
- **R18. Textbook derivations (section 7).** Native `°`, never `\circ`. No underscores inside `\text{}`; no `\cdot^`; no nested `\cfrac` towers; every derivation ends in `\boxed{}`.
- **R19. Number display goes through `fmtSigFig`** (at most 6 significant figures and 3 decimals; `|x| < 1e-4` prints as `0`). Choose variable units so typical values stay at or above `1e-3` (kg/h, not kg/s, for fuel flow).

### UI
- **R20. Vanilla DOM, idempotent init.** Initialisers guard against double registration. Never add a listener per topic switch or per modal open without removing it. Styles go in `styles/*.css` using the variables in `base.css`; no new hex colours; avoid inline styles.
- **R21. Interactive symbols** in generated HTML use `class="interactive-var" data-var="<canonical key>"`.

### Process
- **R22. Never make a red test invisible.** No renaming, skipping, narrowing globs, loosening the 0.1% tolerance, or deleting a test. Fix the cause.
- **R23. Bug fixes ship with a regression test** that fails without the fix. Tests that touch mastery use the real mastery functions, not constant stubs like `() => 0.5`.
- **R24. No dead code, no new duplication** (`knip`, `jscpd`, threshold 5%). LF line endings (`.gitattributes`). New files start with a header comment (path + one-line purpose).
- **R25. Report honestly.** Files changed, commands run with results, and anything unverified.

---

## 3. Architecture

```text
app.js                       Lifecycle, 3-tier topic dropdown, export/import wiring
index.html                   Shell; loads KaTeX (CDN) and app.js as a module
styles/                      base.css (CSS variables), components.css, problem.css, modals.css
src/
  cas/
    ast.js                   Tokenizer, parser, AST utilities, evalAST
    algebra.js               isolateVariable: "onion peeler" + linear-rational factoring;
                             resolveCanonicalKey; reserved math tokens
    latex.js                 AST -> LaTeX
    units/definitions.js     Unit registry (ATOMIC_BASE_UNITS, COMPOUND_UNITS)
    units/analysis.js        solveUnitAlgebra: dimensional analysis, factor-label markup, preConversions
    units/evaluator.js       evaluatePhysicalAST: numeric value in the target unit
  core/
    graph_solver.js          solveDAG, canSolveTarget, pruneSolutionPath (+ fading)
    problem_gen.js           generateProblem: plan -> givens -> neatness -> statement
    derivation.js            buildAlignedDerivation
    dimensions.js            DIMENSIONS, fmtSigFig
    constants_registry.js    CONSTANTS_DB (c_pw, c_pa, g) - partially wired
    unit_sampler.js          SI/US/MIXED sampler - partially wired (section 12)
  mastery/                   constants.js (phi, fib), engine.js, storage.js, index.js
  topics/
    index.js                 TOPICS / ALL_TOPICS (spreads every subject)
    <subject>/index.js       <SUBJECT>_TOPICS, keyed by topic id
    <subject>/common/        Shared schema and eq_base_* relations
    <subject>/<topic>/       index.js, schema.js, relations.js, system.js
  ui/                        problem_view, sidebar_view, carousel_view, tooltip_view
test/                        validator.js, run_test.js, run_hygiene_test.js, index.html (browser runner)
```

Data flow for one problem:

```text
topic.relations + topic.varsDb + topic.createSystem()
  -> generateProblem(topic, getMastery)
       1. pick a target equation, weakest mastery first
       2. expand to a path of 0-3 hops (depends on mastery)
       3. greedily minimise the givens (variant-aware); sometimes add 1 distractor
       4. neatness pass: round givens to 6 s.f., recompute downstream with the unit engine
       5. solveDAG -> steps (isolateVariable per step) -> pruneSolutionPath (fading)
  -> { statement, solution[], givens, distractors, system, ... }
problem_view -> check answer -> recordAttempt / penalize / reinforce ancestors -> sidebar
```

---

## 4. Data contracts

### 4.1 Topic object (`<topic>/index.js`)

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Unique string; **must equal its key** in the subject's `*_TOPICS` map (tested). |
| `title` | yes | Dropdown label. |
| `subject` | yes | Dropdown level 1 (e.g. `"Machine Design"`). |
| `category` | no | Dropdown level 2 folder, or `null` to sit directly under the subject. |
| `noun` | no | Statement reads "A {noun} operates with the following specifications...". |
| `varsDb` | yes | Variable schema (4.2). |
| `relations` | yes | Non-empty array of relations (4.3). |
| `createSystem` | yes | Ground-truth generator (4.4). |
| `statementBuilder` | no | `(givens, visibleGoals, S, varsDb) => html`; replaces the default statement entirely. |

Export the topic with `Object.freeze({...})`.

### 4.2 `varsDb` entry

| Field | Required | Notes |
|---|---|---|
| `name` | yes | Human name. |
| `symbol` | yes | TeX used in statements and derivations (braces allowed here, e.g. `"P_{sat}"`). |
| `dimension` | yes | One of `DIMENSIONS.*` (`src/core/dimensions.js`). |
| `unit` | unless dimensionless | A registered unit string (R7). |
| `aliases` | recommended | Lookup names and tooltip synonyms. `aliases[0]` becomes the `_names` entry. |
| `nameAliases`, `symbolAliases` | no | Pools the statement randomises over so students meet board-exam synonyms. Derivations stay on canonical notation. |
| `isInteger` | no | Answer tolerance becomes +/-0.5 and the neatness pass rounds to an integer. |
| `isAbstract` | no | Parent category (e.g. `D_P`, `T`); exempt from orphan and system checks. |
| `isConstant` | no | Recall-mode constant (e.g. `c_pw`); see section 8. |
| `tolerance` | no | **Absolute** answer tolerance, overriding the default relative rule. |
| `baseVar` | no | Metadata only. Not read by the engine. |

Every non-abstract key must either appear in a relation's `nodes` or be generated by `system.js`; otherwise the orphan test fails.

### 4.3 Relation

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Globally unique (R11). |
| `name` | yes | Shown as the problem title and in the mastery sidebar. |
| `canonicalTex` | yes | Hand-written textbook-notation TeX, shown as the first derivation line. |
| `baseFormula` | yes | Formula-language string (section 5), canonical keys only. |
| `nodes` | yes | Exactly the variable keys appearing in `baseFormula`. |
| `variants` | no | `{ SI: {...}, US: {...} }`. Each may override `canonicalTex`, `baseFormula`, `nodes`, `requiredUnits`. Keep a default `baseFormula` on the relation too. |
| `requiredUnits` | no | `{ key: "unit" }`. Tokens are converted to these units before evaluation; the result is read in the stated target unit. |
| `solvable` | no | Whitelist of targets the relation can be inverted for. Omit when every node is invertible. |

### 4.4 `createSystem({ sys })` return value

```js
{
  sys: "SI" | "US",   // what was actually generated
  <key>: number,      // one per non-abstract varsDb key, in the unit given by _u[key]
  _u:     { <key>: "unit" },    // unit per key (registered strings)
  _names: { <key>: "Name" }     // usually aliases[0] || name
}
```

Values must be physically consistent: every relation must hold between them (in the units given by `_u`). Pick discrete, textbook-friendly inputs (`pick([600, 900, 1200])`) and derive the rest.

### 4.5 Registering a topic

1. Create `src/topics/<subject>/<topic>/{index,schema,relations,system}.js`.
2. Export `<SUBJECT>_TOPICS` from `src/topics/<subject>/index.js` (new subject only).
3. Spread it into `src/topics/index.js`.

Nothing else needs editing: the dropdown is built from `subject` / `category`.

---

## 5. Formula language (`baseFormula`)

Supported: numbers, canonical keys, `+ - * / ^`, parentheses, unary minus, and the functions `sin cos tan asin acos atan sqrt exp ln log abs`, plus constants `pi` and `e`. Exactly one `=`; either side may be an expression.

Behaviours measured against the parser. The **Silent** rows are the dangerous ones.

| You write | Result | Rule |
|---|---|---|
| `2*a` | `2 * a` | Always write `*` explicitly. |
| `2a` | parses as `2`; **`a` is silently dropped** | **Silent.** Never use implicit multiplication. |
| `P_{sat}` | truncates to `P_`; **silent** | **Silent.** No braces in keys or formulas. |
| `x^-1` | throws | Write `x^(-1)`. |
| `x ** 2` | throws | Use `^`. |
| `x^2^3` | `(x^2)^3` (left-associative) | Always parenthesise nested powers. |
| `a/b/c` | `(a/b)/c` | Parenthesise denominators: `a/(b*c)`. |
| `sin(phi)` with `phi` in `deg` or `°` | correct (0.5 for 30 degrees) | Angle variables must declare unit `deg` or `°`. |
| `sin(2*phi)`, `sin(phi/2)` | **wrong** (treats 60 as radians; gives -0.3048) | **Silent.** Trig/inverse-trig arguments must be a bare angle variable. Introduce a separate angle variable instead. |
| exponent containing the target, e.g. `r^(k-1)` solved for `k` | isolation fails | Declare `solvable` to exclude that target. |

Reserved tokens cannot be variable keys: `pi e sin cos tan asin acos atan sqrt exp ln log abs`.

---

## 6. Units and dimensions

### 6.1 Model
Every unit reduces to **atoms** with a scale to a coherent base. An atomic unit is `{ dim, scale, tex }` (e.g. `mm: { dim: "L", scale: 0.001 }`). A compound unit is `{ atoms, factor?, displayTex, substituteTex? }`, and its scale is `factor x product(atom.scale ^ power)`. Relations are evaluated in coherent units, then converted to the target's display unit. `getUnitAtomBag(u).isUnknown` tells you whether a unit is registered.

### 6.2 Adding a unit
1. Add it to `COMPOUND_UNITS` (or `ATOMIC_BASE_UNITS`) in `src/cas/units/definitions.js`. Register each spelling you intend to use (`"lb/hp-h"` and `"lb/hp-hr"` are separate entries).
2. Express it through existing atoms. Example: `kWh: { factor: 3.6e6, atoms: { N: 1, m: 1 }, displayTex: "\\text{kWh}" }` (1 kWh = 3.6e6 J).
3. Check the SI scale by hand, then run the suites. The validator fails with "unregistered unit" or a numeric mismatch if you got it wrong.
4. Never remove a unit that any topic uses; search `src/topics` first.

### 6.3 Temperature: differences only
`K`, `°C`, `°F`, `°R` have scales (`°F` = 5/9) but **no offset is applied**. The `offset` field exists in the registry and `getUnitAtomBag` returns it, yet nothing consumes it. Measured: 212 °F converts to 117.78 °C (correct: 100), 25 °C to 25 K (correct: 298.15). Temperature **differences** convert correctly (10 °F = 5.556 K). Consequences:
- Relations may use temperature differences (`Q = m * c * dt`) in any system.
- Relations that need an absolute temperature (psychrometric Liley/Carrier, ideal-gas `T`) must pin `requiredUnits` to `°C` or `K` and stay SI-only until affine conversion is implemented in the `preConversions` path. Implementing it (with tests) is allowed; pretending it exists is not.

### 6.4 Registered units (as of this README)
- **Atomic:** `m mm cm in ft yd s min h hr N kN lb kip kg g lb_m K °C °F °R Btu teeth rad rev ° deg %`
- **Compound:** `psi psf ksi MPa Pa kPa bar N-m N*m kN-m lb-in lb-ft J kJ W kW MW hp m^2 in^2 m^3 L m^3/s m^3/h L/h cfm kg/m^3 m^3/kg lb/ft^3 ft^3/lb kJ/kg Btu/lb Btu/min Btu/h Btu/hr kWh kg/kWh g/kWh kg/h lb/hp-h lb/hp-hr m/s ft/min kg/s g/s kg/min lb/min lb/s teeth/in rpm rev/s rev/min strokes/min kJ/(kg*K) kJ/kg-K Btu/(lb*F) Btu/lb-F`
- Special strings: `dimless` and `ratio` (dimensionless).

Not registered at the time of writing (add before use): `mm^2 cm^2 ft^2 cm^3 in^3 ft^3 kg/L bhp L/s ft^3/min W/(m*K) kJ/h kcal tons`.

---

## 7. Problem generation and derivations

### 7.1 Generation (`src/core/problem_gen.js`)
- **Target choice:** weakest-mastery equation first, via `weight = max(phi(-7), ((1 + phi(-6)) - mastery) ^ fib(4))` times a random factor.
- **Graph distance (hops):** mastery below `phi(-2)` (38.2%) gives 0 hops; below `phi(-1)` (61.8%) gives 1; below `FADING_THRESHOLD` (76.4%) gives 2; otherwise `fib(4)` = 3.
- **Minimal givens:** root leaves of the solution DAG are greedily pruned so non-distractor givens are the minimum needed. The pruning must be variant-aware (R16).
- **Distractor:** with probability `phi(-4)` (about 14.6%) one numeric variable that is not on the path is added.
- **Neatness:** givens are rounded to 6 s.f. (integers for `isInteger`), then every downstream value is recomputed through `evaluatePhysicalAST`, so the student's answer matches the displayed arithmetic exactly.
- **Fading:** non-goal steps whose equation mastery is at least `FADING_THRESHOLD` are pre-answered so effort goes into synthesis.
- **Recall mode:** `isConstant` givens are omitted from the statement once their mastery reaches the threshold.
- **Statement:** "A {noun} operates with the following specifications: ... Determine: ..." with polymorphic names and symbols; every non-faded step is listed as a goal.

### 7.2 Derivations (`src/core/derivation.js`)
- Line 1 is `canonicalTex`; then the isolated form (when the formula is not already solved for the target); then the numeric substitution.
- Unit conversions are attached **inline** to the token that needs them, as factor-label brackets with `\cancel`.
- The last line is `\boxed{value unit}`.
- Typesetting is enforced by tests: no underscore inside `\text{}`, no `\cdot^`, no empty `\cancel{}`, no `\cfrac{\cfrac{...` towers, native `°` only.
- The derivation must be arithmetically honest: the displayed numbers, multiplied out, should equal the boxed value. Today only the boxed value is verified (section 12, item 6). When you change derivation code, add a test that evaluates the *displayed* expression.

---

## 8. Mastery engine (`src/mastery/`)

| Item | Rule |
|---|---|
| Constants | `phi(n)` = golden ratio to the n; `fib(n)`; `FADING_THRESHOLD = 1 - phi(-3)` (about 0.764); windows `{2,3,5,8,13,21}`; `MAX_HISTORY = 21`. |
| Mastery of an equation | phi-weighted moving average of the last `N` attempts, `N = snapToFibonacci(tokens / e)` where `tokens` is the formula's token count. Newest attempt has weight 1, each older one is `phi(-1)` times the previous. Missing history counts as failures. |
| Decay | `mastery x exp(-lambda x ticks_since_last_attempt)`, `lambda = ln2 / max(fib(8), tokensUnique / e + tokensCommon / (e x phi))`, summed over the topic's relations. |
| Tick scope | `eq_base_*` ids use the `"common"` tick; every other id uses its topic's tick. Ticks advance by 1 per generated problem and per non-empty answer submission. |
| Ancestors | A correct answer reinforces `fadedAncestorEqIds` (refreshes their `lastTick`); a wrong answer or a reveal penalises them. |
| Storage | `localStorage` keys `me_mastery_global` and `me_topic_ticks`. Export payload: `{ version: 2, exportedAt, topicTicks, masteryState }`. Import validates and merges. |
| Answer tolerance | Integers: +/-0.5. Else `meta.tolerance` (absolute) if set. Else `max(phi(-8) x |expected|, 1e-4)` (about 2.1% relative). |

---

## 9. UI contracts

- **Dropdown:** Subject -> optional Category -> Topic, built from `topic.subject` / `topic.category`.
- **Sidebar:** `initSidebarView(relations, getMastery)` is guarded against double init; `renderMasteryBars(relations, getMastery)` (or with a leading container argument). `getMastery` receives a **relation**.
- **Interactive symbols:** `.interactive-var[data-var]`. Tooltips are attached via `attachTooltips`; the carousel opens with `openCarouselForVariable(varKey, relations, varsDb, S)`. A carousel/modal open must not leak document-level listeners.
- **KaTeX:** rendered with `throwOnError: false`; never assume rendering succeeded in logic or tests.
- **CSS variables** (`styles/base.css`): `--bg --panel --card --border --border-subtle --text --text-muted --text-dim --accent-math --success --danger --warning --font-base`.

---

## 10. Tests, hygiene and CI

Run **both** suites explicitly:

```bash
node --test test/run_test.js test/run_hygiene_test.js
```

| Suite | What it enforces |
|---|---|
| `test/validator.js` (used by `run_test.js`) | Per topic, for **SI and US** (`createSystem({ sys })`): duplicate ids, unknown nodes, unregistered units, every invertible (equation, target) pair isolates with the target absent from the RHS (AST inspection), and the isolated formula reproduces ground truth within 0.1% through the physical unit engine; plus a multi-goal DAG solvability test. |
| `test/run_test.js` | Registry contract (unique ids, key equals `topic.id`, required fields), generation and solvability per topic, derivation typesetting checks, UI module export smoke tests. |
| `test/run_hygiene_test.js` | No legacy shadows, `phi`/`fib` invariants, no orphan variables, no duplicate formulas, no alias collisions, cross-subject formula commonality gate, no `\circ`. |
| `npm run audit:dead-code` / `audit:duplicates` | `knip` for unused exports, `jscpd` for duplication (threshold 5%). |

Rules for writing tests:
- **Both unit systems, deterministically.** Call `createSystem({ sys: "SI" })` and `createSystem({ sys: "US" })`. Never rely on the random default.
- **Real mastery.** Seed `recordAttempt` and use `getDecayedMastery` for tests involving fading, constants or hop distance. A constant stub hides lookup bugs (R17).
- **Prove the test can fail.** For a new rule, mutate the code or data (break a formula, a unit, a variant) and confirm the suite goes red, then restore.
- **Independent numbers.** Expected values in tests come from hand-computed ground truth, not from the engine under test.
- **Cover generation, not just parts.** Include a loop over many generated problems per topic and system asserting: no crash, non-empty solution, every step finite, target equation present.

---

## 11. Worked example: adding "Diesel Powerplant" (Powerplant Design)

The files below were run in a clean copy of this repository: all topic-specific tests pass and 3,000 generated problems (three mastery levels) produced no crash and no empty solution. They intentionally use only registered units and a pure-physics `baseFormula` (R5).

`src/topics/powerplant_design/diesel_powerplant/schema.js`

```js
import { DIMENSIONS } from "../../../core/dimensions.js";

export const DIESEL_VARS_DB = Object.freeze({
  n: {
    name: "Engine Speed",
    symbol: "N",
    dimension: DIMENSIONS.ROT_SPEED,
    unit: "rpm",
    aliases: ["Engine Speed", "Crankshaft Speed"]
  },
  T_b: {
    name: "Brake Torque",
    symbol: "T_b",
    dimension: DIMENSIONS.TORQUE,
    unit: "N-m",
    aliases: ["Brake Torque", "Engine Torque"]
  },
  P_b: {
    name: "Brake Power",
    symbol: "P_b",
    dimension: DIMENSIONS.POWER,
    unit: "kW",
    aliases: ["Brake Power", "Shaft Power"]
  },
  P_i: {
    name: "Indicated Power",
    symbol: "P_i",
    dimension: DIMENSIONS.POWER,
    unit: "kW",
    aliases: ["Indicated Power"]
  },
  P_f: {
    name: "Friction Power",
    symbol: "P_f",
    dimension: DIMENSIONS.POWER,
    unit: "kW",
    aliases: ["Friction Power", "Frictional Losses"]
  },
  eta_m: {
    name: "Mechanical Efficiency",
    symbol: "\\eta_m",
    dimension: DIMENSIONS.DIMENSIONLESS,
    aliases: ["Mechanical Efficiency", "Engine Mechanical Efficiency"]
  }
});
```

`src/topics/powerplant_design/diesel_powerplant/relations.js`

```js
export const DIESEL_RELATIONS = Object.freeze([
  {
    id: "eq_diesel_brake_power",
    name: "Brake Power from Torque",
    canonicalTex: "P_b = 2\\pi N T_b",
    baseFormula: "P_b = 2 * pi * n * T_b",
    nodes: ["P_b", "n", "T_b"]
  },
  {
    id: "eq_diesel_friction_power",
    name: "Friction Power",
    canonicalTex: "P_f = P_i - P_b",
    baseFormula: "P_f = P_i - P_b",
    nodes: ["P_f", "P_i", "P_b"]
  },
  {
    id: "eq_diesel_mech_eff",
    name: "Mechanical Efficiency",
    canonicalTex: "\\eta_m = \\frac{P_b}{P_i}",
    baseFormula: "eta_m = P_b / P_i",
    nodes: ["eta_m", "P_b", "P_i"]
  }
]);
```

`src/topics/powerplant_design/diesel_powerplant/system.js`

```js
import { DIESEL_VARS_DB } from "./schema.js";

const pick = (list) => list[Math.floor(Math.random() * list.length)];

// SI-only topic: accepts { sys } for contract compliance but always returns SI.
export function createDieselSystem({ sys = "SI" } = {}) {
  // Independent ground truth: hand-computed, WITH explicit conversions.
  // Never call the solver/unit engine here; the validator cross-checks the two.
  const n = pick([600, 750, 900, 1200, 1500, 1800]);          // rpm
  const T_b = pick([800, 1200, 1800, 2500, 3200]);            // N-m
  const P_b = (2 * Math.PI * n * T_b) / 60 / 1000;            // kW
  const eta_m = pick([0.80, 0.82, 0.85, 0.88, 0.90]);
  const P_i = P_b / eta_m;                                    // kW
  const P_f = P_i - P_b;                                      // kW

  const _names = {};
  for (const [k, meta] of Object.entries(DIESEL_VARS_DB)) {
    _names[k] = meta.aliases?.[0] || meta.name;
  }

  const _u = {
    n: "rpm", T_b: "N-m", P_b: "kW", P_i: "kW", P_f: "kW", eta_m: "ratio"
  };

  return { sys: "SI", n, T_b, P_b, P_i, P_f, eta_m, _names, _u };
}
```

`src/topics/powerplant_design/diesel_powerplant/index.js`

```js
import { DIESEL_VARS_DB } from "./schema.js";
import { DIESEL_RELATIONS } from "./relations.js";
import { createDieselSystem } from "./system.js";

export const dieselPowerplantTopic = Object.freeze({
  id: "diesel_powerplant",
  title: "Diesel Powerplant",
  subject: "Powerplant Design",
  category: null,
  noun: "diesel engine",
  varsDb: DIESEL_VARS_DB,
  relations: DIESEL_RELATIONS,
  createSystem: createDieselSystem
});
```

`src/topics/powerplant_design/index.js`

```js
import { dieselPowerplantTopic } from "./diesel_powerplant/index.js";

export const POWERPLANT_DESIGN_TOPICS = Object.freeze({
  diesel_powerplant: dieselPowerplantTopic
});
```

`src/topics/index.js`

```js
import { MACHINE_DESIGN_TOPICS } from "./machine_design/index.js";
import { HVAC_TOPICS } from "./hvac/index.js";
import { POWERPLANT_DESIGN_TOPICS } from "./powerplant_design/index.js";

export const TOPICS = Object.freeze({
  ...MACHINE_DESIGN_TOPICS,
  ...HVAC_TOPICS,
  ...POWERPLANT_DESIGN_TOPICS
});

export const ALL_TOPICS = Object.values(TOPICS);
```

Then run the suites (section 10). A new topic is not done until it passes both.

### Powerplant-specific cautions
- **Absolute temperatures** (intake air in K for density or ideal-gas work) are not supported by the unit engine (6.3). Avoid them, or implement affine conversion first with tests.
- **Small magnitudes:** `fmtSigFig` prints values under 1e-4 as `0`. Use kg/h, L/h, g/kWh and similar so answers stay readable.
- **Units that exist:** `kW hp kPa L m^3 kg/h L/h kWh kg/kWh g/kWh lb/hp-hr kJ/kg kJ/kg-K Btu/lb rpm strokes/min N-m`. **Missing:** `mm^2 cm^2 ft^2 ft^3 kg/L bhp L/s` (piston area, fuel density). Register them before use (6.2).
- **Empirical correlations** (fuel heating value from API gravity, etc.) need `requiredUnits`, a source comment (R14), and a ground-truth line in `system.js` that uses the same coefficients independently.
- **Four-stroke vs two-stroke** is a discrete choice. Model it as a numeric variable (strokes factor) or separate relations, not as a string; the engine is numeric-only.
- **SI/US variants that change which variables appear** (the Lewis `m` vs `P_d` case) are supported but must be planned against the real `S` (R16).

---

## 12. Known gaps and traps

Verified against the repository upload audited on 2026-11-09. Fix or flag any of these when you touch the area; update or delete this section as they are resolved.

1. **`npm test` skips the hygiene suite.** `package.json` still points at `test/hygiene_test.js` (renamed to `run_hygiene_test.js`). Node silently ignores a missing file, so `npm test` reports green after running only `run_test.js`. CI runs `node --test test/run_test*.js`, a glob that matches neither. Use the explicit command in section 10 until both are corrected.
2. **The hygiene suite is currently red** (3 failures): alias "Lewis Form Factor" claimed by both `Y` and `y_form` (spur gears); alias "Ambient Air Temp" claimed by both `t_db` and `t_o` (bypass air); 16 orphan variables in `hvac_bypass_air`.
3. **Fading and recall mode do not fire in the real app.** `pruneSolutionPath` calls `getMastery(step)`, but steps carry `eqId`, not `id`, so mastery reads as 0 (with a fully mastered learner: 0 faded steps, versus hundreds with a constant stub). Recall mode looks up `const_<key>`, and nothing ever records mastery under that id, so `c_pw` is always printed.
4. **Affine temperature offsets are declared but unused** (6.3).
5. **Unit sampler is mostly unwired.** `sampleUnitMap` is never called; `MIXED` mode in the cooling tower falls into the SI branch (every sample is SI-only); four of the five HVAC topics ignore `sys`, so the validator's "SI and US" run is SI twice for them.
6. **Derivation arithmetic is not verified.** Result-side conversions are not shown (for example `20 teeth / (8.467 teeth/in)` is boxed as 60 mm with no `x 25.4 mm/in`; `W` to `kW` likewise), and `kJ/kg-K` can render a spurious `x1000` bracket. Tests check LaTeX shape only.
7. **Unit gaps** listed in 6.4.
8. **Dead exports** are likely (legacy `PHI_INV*` / `FIB_*` constants, `incrementGlobalTick`, `sampleUnitMap`, unused imports from `constants_registry.js`). Run `npm run audit:dead-code` locally before deleting; it needs more memory than some CI sandboxes provide.
9. **Trig arguments** other than a bare angle variable give wrong numbers without an error (section 5); the validator catches it only if ground truth is correct.

---

## 13. Definition of done (copy into every change)

- [ ] I read sections 2 and 5 and none of the Hard Rules are violated.
- [ ] Any new unit, dimension or constant is registered, with a source comment where it is engineering data.
- [ ] New or changed formulas are pure physics; exceptions use `requiredUnits`, `variants` or `solvable`.
- [ ] `system.js` is independent of the solver and honours `{ sys }`.
- [ ] `node --test test/run_test.js test/run_hygiene_test.js` was run; results are quoted in my report.
- [ ] I added a regression test that fails without my change (using real mastery where relevant).
- [ ] No test was renamed, skipped, loosened or deleted to get a green run.
- [ ] No dead exports, no new duplication, LF line endings, header comment on new files.
- [ ] I listed anything I could not verify, including items from section 12 that my change touches.
