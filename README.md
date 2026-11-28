# BSME Reviewer

A browser-based engineering study application with two modes: **generated engineering problems** and **multiple-choice review/exams**. The problem engine builds multi-step questions from topic relation graphs, uses an in-repository AST-based algebra and unit engine, checks answers, and renders worked LaTeX derivations. The MCQ mode runs repository question banks and user-imported banks. A mastery system records learning activity and influences problem selection and cognitive fading.

The current topic catalog is focused on Mechanical Engineering subjects, including Machine Design, HVAC/Air Conditioning, and Powerplant Design. The MCQ system is a separate question-bank format and is not inherently limited to those topics.

- **Runtime:** Browser application using native ES modules; no bundler is required. KaTeX is loaded from a CDN.
- **Persistence:** Browser-local state uses `localStorage`; user-imported MCQ banks use `IndexedDB`. This is not a server-backed multi-user service.
- **Run locally:** From the repository root, run `python3 -m http.server` and open `http://localhost:8000`.
- **Node version:** Use Node.js 22 for the test/tooling workflow.
- **Canonical verification:** `npm test` regenerates the topic/MCQ registries and runs the configured test suites.
- **AI context map:** `npm run skeleton` emits a compact repository map. It is an index, not the source code: use the context commands below to inspect implementations.
- **AI context loop:** `npm run ctx` processes directives in `tmp/ctx_req.txt`, writes results to `tmp/ctx_res.txt`, and maintains the delivery ledger in `tmp/ctx_cache.txt`.
- **Registry maintenance:** `npm run clean:mcqs` sanitizes repository MCQ data; `npm run gen:registry` regenerates the topic and MCQ manifests. `npm test` runs the configured pipeline.
- **Patch application:** `npm run apply` applies a patch bundle from `tmp/patch.txt` by default.

---

## 0. Working with an AI model: repository tools and workflow

This section is the quick-start manual for the repository's own AI-assisted workflow. It exists so a model can inspect the relevant implementation and diagnostics early, rather than spending turns asking what tools exist.

### 0.1 What context the model receives

The generated repository skeleton is intentionally slim: normally one line per file, with imports/exports and selected symbol names. It does **not** include full function bodies, complete signatures, or reliable line ranges. The skeleton also embeds a **dynamically trimmed README excerpt**; that excerpt is not this complete README. In the current slim mode it retains the overview, AI tools, engineering rules, architecture, testing, Definition of Done, and commit guidance, while omitting the detailed domain sections 4–9. Treat this file as the full project guide and request the relevant omitted section with `READ README.md:a-b` when needed.

The context loop is a deterministic repository interface for an external AI workflow, not an LLM or autonomous agent embedded in the application. The model supplies directives; the local workflow runs them against this checkout and returns the result. Do not infer implementation details from a filename, symbol name, skeleton summary, or README example. They are navigation hints. Read the real implementation before proposing a code change, and read the exact target before constructing a patch.

### 0.2 Sending context requests

When using the `npm run ctx` workflow, send repository-inspection requests as **one fenced `text` block**, one directive per line, then stop. Do not wrap the directives in XML or explain the request in prose. Batch related requests to reduce round trips.

The current request limits are **16 directives** and **1,024 output lines**. Directives beyond the limit are not run; output beyond the line budget is truncated or refused by the relevant handler. The response header reports the budget used.

Example:

```text
OUTLINE src/core/problem_gen.js
READ src/core/problem_gen.js#buildGraphPath,determineGraphDistance
TOPIC hvac_air_properties
GRAPH hvac_air_properties target=SHR sys=SI
```

Use paths relative to the repository root and copy topic IDs, relation IDs, matrix cases, and other identifiers from actual output. Do not guess them.

### 0.3 Source-navigation commands

| Directive | What it returns | When to use it |
|---|---|---|
| `READ path#symbol[,symbol2]` | Exact extracted JavaScript symbol bodies (functions/constants); multiple symbol names are allowed. | Preferred way to inspect a known implementation unit. |
| `READ path:a-b` | Requested source-line range; it may snap outward to an enclosing JavaScript symbol when the expansion is no more than 48 lines. | Read a known region or a non-JavaScript file. |
| `READ path:-N` | Last `N` lines of a file. | Inspect endings, exports, or configuration tails. |
| `READ path` | Full file when it is within the 512-line full-read limit; larger files return an outline instead. | Small files only. |
| `OUTLINE path` | JavaScript symbol names and their line ranges for one file. | Find the exact function/constant to read in a large file. |
| `GREP [-C n] [-i] [-E] term [@ scope[,scope2...]]` | Matching lines with optional context. `-i` is case-insensitive; `-E` treats the term as a JavaScript regular expression; `-C n` adds context lines. | Find call sites, contracts, error strings, and unknown implementation locations. |

`GREP` accepts **multiple comma-separated scopes**, including optional line ranges, for example:

```text
GREP -i -C 2 requiredUnits @ src/topics,src/core
GREP -E "build(Graph|SingleGraph)Path" @ src/core/problem_gen.js:1-300
```

A scope must resolve inside the repository and must exist. When no scope is supplied, `GREP` searches the script's configured search roots. If the output is truncated, narrow the scope or reduce context. The old note that multiple scopes fail or lock out `GREP` is obsolete; multi-scope search is supported and covered by `test/ctx_test.js`.

### 0.4 Domain and engine-inspection commands

| Directive | What it inspects | Best use |
|---|---|---|
| `TOPIC topic` | One-page summary of a topic's `varsDb`, dimensions, relations, and contracts. | Understand a topic before editing its schema or equations. |
| `REGISTRY [units\|prefixes\|dims\|constants\|palettes\|coupled ...]` | Live engine registries; bare `REGISTRY` reports section row counts. | Check whether a unit, prefix, dimension, constant, palette, or coupled-variable group already exists. |
| `GRAPH topic [givens=A,B] [target=X] [sys=SI\|US]` | Relation-graph reachability, degrees of freedom, and an unrolled solution graph. | Check whether a topic can solve a target from candidate givens. |
| `DERIVE topic rel target [{u}] [sys=SI\|US]` | One relation/target derivation, including the four-row layout constraint and numerical oracle check. | Inspect a single equation's solve direction and rendered conversion steps. |
| `UNIT expr` | Unit parse, 7D dimensional vector, base scale, affine offset, and companion information. | Diagnose an unknown, malformed, or dimensionally unexpected unit. |
| `CONVERT unitA -> unitB` | Conversion factor-label decomposition and canonical-scale verification. | Diagnose scale ratios and how a conversion should be represented. |
| `SOLVE "formula" target` | CAS variable isolation and the isolated expression/LaTeX. | Test whether the formula grammar and algebra isolator can solve for a variable. |
| `HYGIENE [topic\|all]` | Static topic/schema checks, including orphans, collisions, and native degree-symbol rules. | Check schema and authoring invariants without running the full matrix. |

### 0.5 Failure and derivation diagnostics

| Directive | What it does | Best use |
|---|---|---|
| `FAILURES [topic]` | Runs the derivation matrix and groups failures by relation/target; includes a minimal `TRACE`-ready case and boxed-answer/derivation information. The all-topic run can be slow. | Start here when a matrix or generation test fails without an obvious cause. |
| `TRACE topic[SI\|US] relation -> target {tok:unit, ...} [seed=N]` | Re-runs a supplied matrix case through unit solving and reports non-canonical scalars with the stack frames that created them. Without `seed=`, it tries both matrix seeds. Output is capped at 128 lines. | Use the exact case line from `FAILURES` or test output; do not invent a case. |
| `AUDIT-LATEX [topic\|"tex"]` | Checks KaTeX/LaTeX formatting conventions such as spacing, commas, percent signs, and degree symbols. | Inspect statement or derivation markup. |
| `AUDIT-STEP topic rel target [{u}] [sys=SI\|US]` | AST-native structural audit of a single derivation. | Find structural issues that are hard to see in rendered output. |
| `RENDER-STEP topic rel target` | Shows a visual wireframe and phase-by-phase layout progression for a step. | Diagnose conversion placement and fraction-tower layout. |
| `PROBLEM-STEPS topic [sys=SI\|US] [seed=N]` | Shows a complete generated problem progression, including cognitive fading. | Inspect how a relation path becomes a learner-facing problem. |
| `STEP-AST topic rel target` | Shows the expression AST alongside rendered KaTeX. | Compare mathematical structure with its displayed form. |
| `DIFF-STEP topic rel target1 vs target2` | Structurally compares isolated formulas/targets. | Check whether two solve directions produce consistent structures. |
| `DIFF-DERIVE topic rel target` | Compares SI and US derivations. | Investigate system-specific behavior. |
| `ROUNDTRIP-STEP topic rel target [{u}]` | Compares numerical AST physics evaluation with the rendered derivation's numerical result. | Investigate a mismatch between calculation and displayed math. |

The command names and accepted grammar are registered in `scripts/fulfill_ctx.js`; that handler table is the authoritative list. If this README and the handler disagree, inspect the handler and tests, then correct this README.

### 0.6 Recommended investigation sequence

1. **Locate:** Run `OUTLINE` on the likely file, or `GREP` when the implementation location is unknown.
2. **Understand:** Read the exact symbol with `READ path#symbol`. For topic-level questions, use `TOPIC`, `GRAPH`, and `REGISTRY` as appropriate.
3. **Reproduce/measure:** Use the narrowest relevant test. For matrix failures, use `FAILURES` and then pass a real failing case to `TRACE`. For derivation layout, use `DERIVE`, `AUDIT-STEP`, `RENDER-STEP`, or `STEP-AST`.
4. **Design first:** Explain the root cause, general invariant, affected files, and regression test. Stay in brainstorm mode until the user explicitly authorizes code.
5. **Patch safely:** Read the exact target code before emitting a diff or full-file replacement. Never reconstruct unseen code from the skeleton or from a partial excerpt.
6. **Verify:** Run the narrow test while iterating, then `npm test` before calling the change complete. Report what was actually run and any failures.

Do not request context already present in the conversation. Prefer symbol reads over hand-calculated line ranges. Use specialized diagnostics only when their output answers the suspected failure; do not run every diagnostic by default.

### 0.7 Context cache behavior

`npm run ctx` maintains a delivery ledger in `tmp/ctx_cache.txt`. It stores hashes and delivery metadata, not source text. Repeated source requests can return a cache marker; overlapping `READ`/`GREP` requests return only source lines not previously delivered. Identical computed diagnostic outputs can also be marked as already delivered. Changed lines and lines at new positions are sent again.

A full `READ` can satisfy a later excerpt request, but a `GREP` excerpt does not satisfy a later full `READ`. Reset the ledger with `npm run ctx -- --reset`. Running `npm run skeleton` starts a new context boundary and clears the ledger.

### 0.8 Applying code changes through the repository patch tool

When the model is not editing the working tree directly, it should emit the repository's patch format; the user can apply it with `npm run apply` (default input: `tmp/patch.txt`). The context directives are for inspection/diagnostics; they do not edit source files. The parser accepts `diff`, `subst`, and full-file drop-in blocks.

- Use a fence labelled `diff path/to/file.ext` for partial edits. A block can contain multiple hunks. Each hunk uses `<<<<` / `====` / `>>>>`; `<<<< expect=N` asserts the exact number of matches (default `1`). A directory path applies a hunk across that scope. A hunk whose replacement is already present is a no-op.
- Use a fence labelled `subst scope=<file|dir> expect=N` for one literal replacement applied to exactly `N` matches across a scope. It is atomic. Only `diff` and `subst` fences parse hunk markers.
- Use a `FILE: path/to/file.ext` header followed by a language-fenced full-file block for a complete replacement. `FILE:` declares the target file; a full-file replacement consumes that header. A `subst` block clears a sticky `FILE:` header.
- Prefer the path in the fence info string. The `FILE:` form remains accepted for full-file replacements and compatibility.
- Use three-backtick fences for patch blocks. If a block contains a line beginning with a run of `N` backticks where `N >= 3`, fence the outer block with `N+1` backticks.
- Use four-character hunk markers unless the block itself contains literal four-character markers; then use at least five matching marker characters.

Partial-edit example:

```diff path/to/file.js
<<<<
exact existing lines
====
replacement lines
>>>>
```

Full-file replacement example:

````markdown
FILE: path/to/new_file.js
```javascript
// complete replacement file
```
````

The patch parser/applier lives in `scripts/lib/patch_parse.js` and `scripts/lib/patch_apply.js`; `scripts/apply_patch.js` is the CLI entry point. Do not claim a patch was applied unless the tool was actually run and its result checked.

---

## 1. Engineering Philosophy: General Invariants & Root Causes

The repository is designed around reusable mathematical and software invariants. Treat the following as engineering principles, not as a blanket performance guarantee:

1. **Use generated registries instead of hand-maintained indexes.** Topic leaves and MCQ sets are discovered by `scripts/gen_registry.js`, which generates `src/topics/index.js` and `src/mcq/index.js`. Add content in the supported leaf/set layout, regenerate the registries, and let tests verify discovery. Do not claim constant-time startup or zero central-code changes without measuring the actual loading path.
2. **Fix root causes, not symptoms.** When a value is unexpected, trace the mathematical or data-contract breakdown at the foundational layer. Avoid per-variable scalar patches, hardcoded string branches, and local exceptions that conceal a general defect. Use `TRACE` when the source of a numeric artifact is unclear.
3. **Prefer general mathematical representations.** Units are represented through dimensional data and scale/offset semantics. Scale parity, affine temperature companions, and factor-label decompositions should arise from shared unit definitions and algorithms, not duplicated per-topic conversion code.
4. **Avoid tunnel vision.** Evaluate changes across the relation graph, SI/US/MIXED behavior, numerical evaluation, rendered derivations, and mastery propagation where relevant.
5. **Anti-patterns to avoid:**
   - Do not branch on unit strings (for example, special-case `°F`) to determine physical scale; use registered unit semantics.
   - Do not duplicate hardcoded conversion constants or private scale tables. `definitions.js` and `scales.js` are the relevant shared sources of unit/conversion data.
   - Do not add per-variable conversion logic; route conversions through the unit parser, dimensions, and registry.
   - Do not use broad regex assertions as substitutes for AST and rendered-math validation.
   - Keep coupled thermodynamic state outputs in a coherent unit frame where the topic contract requires it.
   - Do not add topic-specific solvers for equations that should be handled by the shared formula parser, algebra isolator, and graph/problem engine.
   - Keep unit-string producers compatible with the grammar consumed by the unit parser and derivation builder (see section 6.2).

---

## 2. Hard Rules (Non-Negotiable)

These are the repository's authoring and maintenance contracts. Some are checked directly by tests; others are design constraints that reviewers must enforce. Do not assume a rule is tested merely because it appears here. When a rule appears inconsistent with the implementation, inspect the relevant source and tests and update the documentation rather than preserving a stale claim.

### Math and Formulas
- **R1. Formulas are nodes.** Equations are declared as relations; variables are edges. The shared graph/problem engine determines usable solve paths. Never write bespoke per-topic "solve for X" functions or hardcoded solution orders.
- **R2. AST only.** All symbolic operations pass through `src/cas/ast.js` and `src/cas/algebra.js`. No regex rewriting of formulas, no `eval` / `new Function`, no runtime CAS dependencies.
- **R3. Obey formula language rules (section 5).** Explicit `*`, parenthesised exponents, exactly one `=`, trig arguments must be a bare angle variable.
- **R4. Case-sensitive canonical keys.** Variable keys match `[A-Za-z][A-Za-z0-9_]*` (`P_d`, `D_P1`, `m_cw`). Never lowercase or normalize keys. LaTeX formatting belongs in `symbol`, never in the canonical key.

### Physical Units & Dimensions
- **R5. Relations are pure physics.** No unit-conversion constants (`25.4`, `1000`, `60`, `3600`, `12`, `1.341`). Coherent base conversions handle scaling automatically.
- **R6. Declare empirical exceptions.**
  - Empirical correlations valid only in specific units: declare `requiredUnits: { token: "unit", targetVar: "unit" }`.
  - Differing mathematical formulations between SI and US: declare `variants.SI` and `variants.US`.
- **R7. Register every unit.** Every unit string must exist in `src/cas/units/definitions.js`. Unknown units fail validation. Prefixes are registry data: a base accepts an SI prefix only if its entry lists the code in `prefixes`.
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
- **R19. Dynamic Per-Problem Deliverables & Cognitive Fading.** Problem goals are determined dynamically at runtime based on topological distance and mastery level. Mastered intermediate steps ($\text{mastery} \ge \text{FADING THRESHOLD}$) are omitted from statement prompts and **literally hidden** from the interactive solution flow, while the active problem's final deliverable always remains active.

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
  - **No Fused Scalars:** Every displayed conversion scalar is a decade or a single registered same-dimension atom ratio (optionally raised to an integer power as `(root)^p`). A product of different ratios (e.g. $737.562 \times 0.453592 = 334.553$, or $1000 \times 3600^3$) is never emitted as one number; it is factored per atom pair.
- **R21. Specific Energy Notation.** Quantities per unit mass ($\text{kJ/kg}$, $\text{Btu/lb}$) strictly use lowercase symbols ($q_A, q_R, w_{net}, h$), reserving uppercase ($Q, W, P$) for total energy or power.
- **R22. Number formatting & hierarchical display floor.** Displayed values pass through `fmtSigFig` (positional up to 6 significant figures, max 6 decimal places by default); `fmtScale` delegates to it. Computation is never capped: scalars stay at 6 significant figures with no decimal cap. The sampler prefers `MIN_DISPLAY_MAGNITUDE` (0.0995) when choosing units, and non-constant displayed values target `displayFloorOk` (`|v| >= MIN_DISPLAY_FLOOR = 0.001`). When a generated problem value fails the display test, the problem-generation path resolves it hierarchically and recursively: (1) switch to a smaller (or larger) registered unit scale, (2) backsolve through the DAG (`isolateVariable`) and retry step 1 across all variables, then (3) collect any remaining failing numbers into `sciVars` and render them in scientific notation ($m \times 10^{k}$).

### AI Collaboration, Testing & Process
- **R23. Never make a red test invisible.** No renaming, skipping, narrowing globs, loosening tolerances, or deleting tests. Fix the root cause.
- **R24. Bug fixes ship with regression tests.** Tests that touch mastery use real mastery functions (`recordAttempt`, `getDecayedMastery`), not constant stubs.
- **R25. Report honestly.** State files changed, test output, and anything that could not be verified.
- **R26. Brainstorm mode by default.** Always operate in brainstorm mode first to analyze root causes, establish mathematical invariants, and verify alignment. Never write code or emit diffs until given explicit permission to proceed.
- **R27. Canonical diff syntax & fence nesting.** When authorized to write code, put the target path in each fence info string (```diff path/to/file.ext, or ```javascript path/to/new_file.js for a full file; many hunks per block, `expect=N` on a hunk opener) and wrap in 3-backtick fences (```diff using `<<<< ==== >>>>`, or >= 5 matching marker chars if the body has literal 4-char markers, when shorter than a full-file replacement). Only `diff` and `subst` fences parse hunk markers; `subst scope=<file|dir> expect=N` carries its own scope and requires an exact match count. Full-file drop-in blocks consume `FILE:`; sticky `FILE:` applies only to consecutive `diff` blocks and is cleared by `subst`. Let N be the longest backtick run that starts a line inside a block (inline mentions do not count); when N >= 3, wrap the block in N+1 backticks so that nothing inside can close it early. 

---

## 3. Architecture

This is a small native-ES-module browser application with a Node-based generation, diagnostics, patching, and test toolchain. The following map names the main implementation areas; use `npm run skeleton`, `OUTLINE`, and `READ` for the current exact dependency/symbol details.

```text
app.js                       Browser application shell; Problems/MCQ mode, selectors, and event wiring
index.html                   DOM structure and KaTeX CDN loader
styles/                      Base, component, problem, MCQ, and modal styles
src/
  cas/
    ast.js                   Formula lexer/parser, AST walkers, identifier and evaluation helpers
    algebra.js               Symbolic manipulation and variable isolation
    latex.js                 AST-to-LaTeX serialization
    units/
      ast.js                 Unit-expression tokenizer/parser and unit AST
      definitions.js         Unit registry, dimensions, scales, affine units, and conversion primitives
      scales.js              Conversion-scale computation and factor-label decomposition
      analysis.js             Unit-algebra analysis and derivation conversion planning
      evaluator.js            Physical AST evaluation in coherent units
  core/
    constants_registry.js    Registered physical constants and their units
    dimensions.js             Dimension definitions and numeric/display tolerances
    relation_builder.js       Formula/relation compilation and indexed-variable expansion
    graph_solver.js           Target reachability for topic relation graphs
    problem_gen.js            Problem path construction, generated values, and statement building
    derivation.js              Worked derivation construction
    unit_sampler.js            Unit-system inference, candidate selection, and problem-unit planning
    unit_catalog.js            Unit catalog, unit chips, and conversion-card data
    topic_mix.js               Multi-topic relation-share logic
  mastery/
    constants.js              Phi/Fibonacci schedules and learning thresholds
    engine.js                 Mastery updates, decay, and ancestor reinforcement/penalties
    storage.js                Browser-local mastery and topic-tick persistence
    index.js                  Mastery exports
  mcq/
    index.js                  Generated MCQ manifest and set loaders
    engine.js                 Batch selection, distractors, and study/exam session data
    zip_reader.js              Zero-dependency ZIP archive reader
    custom_store.js             IndexedDB persistence for imported question banks
  topics/
    index.js                  Generated topic manifest and topic loaders
    <subject>/<category>/<topic>/  Topic leaf data and implementation (see section 4)
    <subject>/common/          Shared schemas and relations used by related topics
  ui/
    problem_view.js            Generated-problem display and step checking
    mcq_view.js                MCQ setup, study, exam, timer, and results views
    sidebar_view.js            Mastery sidebar and mastery visualization
    carousel_view.js           Formula/reference carousel and variable isolation UI
    tooltip_view.js            Variable tooltips
    unit_card_view.js          Unit detail cards
    unit_click_view.js         Interactive unit-click wiring
    xmb_model.js                XMB picker interaction model
    xmb_picker_view.js          XMB unit picker UI
scripts/
  clean_mcqs.js                Sanitizes repository MCQ sets before registry generation
  gen_registry.js              Discovers topic leaves and MCQ sets; generates both registries
  repo_skeleton.js             Emits the compact repository map and trimmed README excerpt
  fulfill_ctx.js               Parses and fulfills the repository context directives
  trace_case.js                Runs one derivation-matrix trace case
  apply_patch.js               CLI for applying patch bundles
  quiet_reporter.js             Compact node:test reporter
  lib/
    ctx_cache.js               Context-delivery fingerprint ledger
    ctx_tools.js               Topic/registry/graph/unit/derivation diagnostic handlers
    patch_parse.js              Patch-bundle parser
    patch_apply.js              Patch-bundle applier
    symbols.js                  JavaScript symbol extraction for READ/OUTLINE
    trace_parse.js               Matrix-case parser
    trace_hooks.js               Numeric push/fill tracing hooks

test/
  run_test.js                   Main application, solver, derivation, and integration regression suite
  run_hygiene_test.js            Topic/schema and repository hygiene checks
  derivation_matrix_test.js      Relation/target/system/unit derivation matrix
  matrix_worker.js               Worker used by matrix tests and diagnostics
  matrix_helpers.js              Seeded matrix generation and derivation assertions
  latex_oracle.js                Numerical checks of rendered derivation LaTeX
  validator.js                   Topic schema, equation inversion, and numerical checks
  mcq_test.js                    MCQ registry, image, grid, and ZIP-reader test helper
  ctx_test.js                    Context command and symbol-extraction regressions
  trace_test.js                  TRACE parsing and hook-restoration regressions
  Other focused tests             Unit catalog, unit-frame coherence, topic mixing, cache equivalence,
                                 prefix/rate parsing, patch format/application, reporter, and XMB model
```

The generated registries are outputs: **do not hand-edit** `src/topics/index.js` or `src/mcq/index.js`. Edit the leaf topic or MCQ data, then run the registry-generation/test workflow.

---

## 4. Data Contracts

### 4.1 Topic Object (`<topic>/index.js`)

| Field | Required | Type | Meaning |
|---|---|---|---|
| `id` | Yes | `string` | Globally unique topic identifier used by the generated `TOPIC_MANIFEST` and selectors. |
| `title` | Yes | `string` | Dropdown label. |
| `subject` | Yes | `string` | Dropdown level 1 (e.g. `"Powerplant Design"`). |
| `category` | No | `string|null` | Dropdown level 2 subfolder, or `null` if standalone under subject. |
| `noun` | No | `string` | Reads: "A/An {noun} operates with the following specifications...". |
| `varsDb` | Yes | `object` | Variable schema dictionary (section 4.2). |
| `relations` | Yes | `Array` | Array of relation objects (section 4.3). |
| `createSystem` | Yes | `Function` | Ground truth generator: `({ sys }) => SystemState` (section 4.4). |

Export the topic frozen: `export const myTopic = Object.freeze({...});`.

#### Topic Partitioning & Registry Rules:
- **Single-state graph consistency:** One `createSystem({ sys })` state `S` must satisfy **all** `relations` in a topic simultaneously in a connected graph. Split conflicting geometries, operating assumptions, or empirical-code vs. analytical-theory regimes into separate leaf topics under `category`.
- **Leaf-only barrels:** Never create `index.js` files in `common/` or category folders (`test/run_hygiene_test.js` rejects non-leaf `index.js` and `export *`).
- **No orphan spreads:** When reusing a shared base schema (`common/*_base_schema.js`), spread **only** the subset of keys actually referenced by the topic's `relations` or `system.js`.

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
- `typical: [lo, hi]`: Optional canonical-unit range used by `planProblemUnits` and `makeDraw` (`src/core/unit_sampler.js`) to sample clean givens directly in their planned display unit before `createSystem` runs.
- **Reserved tokens & uniqueness:** Never use reserved math tokens (`e`, `pi`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `sqrt`, `exp`, `ln`, `log`, `abs`) as `varsDb` keys. Every `meta.name` and every entry in `meta.aliases` (length $> 2$, not starting with `\`) must be unique within a topic's `varsDb`.
- **Coupled deliverable groups:** `COUPLED_VARIABLE_GROUPS` (`src/core/unit_sampler.js`) matches globally by variable key name across all topics and forces shared deliverables (never givens) onto one unit. Register new state-point groups there, and avoid reusing an already-coupled key name unless coupling is intended.
- **Shared base-relation naming:** Verify exact variable key contracts before importing shared `common/` relations so `varsDb` and `system.js` stay aligned.

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
  // 2. Compute independent ground truth with explicit arithmetic; do not call the solver or unit engine
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
| `ln(x)` | `log(x)` | **Oracle Base Mismatch** | `ast.js` treats `log()` as $\ln$, while `latex_oracle.js` treats `\text{log}()` as $\log_{10}$; always use `ln(...)`. |

### 5.1 CAS Isolation (`isolateVariable`) & Trigonometry Rules
- **Single-occurrence & linear-rational isolation:** `isolateVariable` inverts any single-occurrence variable through `+ - * / ^ sqrt sin cos tan asin acos atan ln exp` (except inside exponents or `abs(...)`), and solves multi-occurrence variables when linear or linear-rational. Even powers invert to positive roots (`y^(1/n)`), so keep physical sizes and magnitudes positive.
- **Factoring for full invertibility:** Decompose repeated subexpressions into intermediate nodes (e.g., `X_eq = ...` before using `X_eq` alongside inputs; `L_tot = L + a` before products using both `a` and `L + a`; `1 / X_eq = 1 / X_1 + 1 / X_2` instead of `(X_1 * X_2) / (X_1 + X_2)`) so every graph edge remains bidirectional. Never store `0` in `createSystem` for a variable that becomes a divisor when inverted.
- **Trigonometry & angle units:** `evaluatePhysicalAST` converts inputs to coherent SI (`rad`) before `evalAST`, while `test/latex_oracle.js` converts `°` by $\pi/180$ only inside `\sin/\cos/\tan`, treats `°` as `1` outside trig, and returns inverse trig (`asin`/`acos`/`atan`) in degrees. Use `unit: "°"` for trig angles, `unit: "rad"` (`DIMENSIONS.ANGLE`) for geometric/rotational angles, and avoid adding/subtracting bare constants (`45`, `pi/4`) to degree variables.

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
`src/cas/units/scales.js` computes all conversion scalars directly from `BASE_UNITS` and `PREFIXES` in `definitions.js` using `fmtScale` (6 significant figures, 6-decimal display cap; scalars themselves are uncapped):
- **Single-Dimension Scaling (Option B):** When an expression evaluates to a single dimension differing from `targetUnit` (e.g. $\text{hp} \to \text{ft}\cdot\text{lb/s}$), `scales.js` preserves the target unit intact on the main line:
  $$BP = \cfrac{EP}{\eta_g} = \cfrac{1{,}850.61 \, \cancel{\text{hp}}}{0.92} \cdot 550 \, \cfrac{\cfrac{\text{ft}\cdot\text{lb}}{\text{s}}}{\cancel{\text{hp}}} = \boxed{1{,}106{,}340 \, \cfrac{\text{ft}\cdot\text{lb}}{\text{s}}}$$
- **Compound Ratio Decomposition:** Compound unit conversions (e.g. $\frac{\text{lb/min}}{\text{Btu/h}} \to \frac{\text{kg}}{\text{kWh}}$) are never lumped into unfamiliar decimals (like $92{,}863.4$). `scales.js` decomposes them into atomic dimension pairs (`60`, `2.20462`, `3,412.14`) applied in-situ.
- **AST-Driven Mismatches:** Ratios with differing unit scales (e.g. $\text{Btu/h}$ vs $\text{Btu/min}$) extract the exact differing atomic pair from the unit AST.
- **Rate Grammar (`n/(d)`):** `splitRateParts` splits a unit at its single top-level `/` and strips one pair of wrapping parentheses per side, so `kJ/kg`, `ft-lb_f/(lb_m)` and `Btu/(h)` all decompose into a numerator ratio and a denominator ratio. `unitForSubExpr` in `analysis.js` emits sibling-term target units in this form; producer and consumer must stay in agreement. Strings with no top-level `/`, several, unbalanced parentheses, or a unit-less `1/(...)` numerator are not split.
- **Pairwise Shortcut Gate:** Section D of `solveUnitAlgebra` converts same-dimension tokens by one pairwise `formatPairConversion` only when every resulting scalar passes `isCanonicalScaleFactor`. Otherwise (for example a `kg*m*m/(h*h^2)` atom-soup target, where kW needs $1000 \times 3600^3$) the branch routes to `buildCompoundTokenConversions`, which factors per atom pair.
- **Registry Units, Prefixes & Percentage Contract:** `definitions.js` supports special tokens `psi`, `psf`, `ksi`, `rpm`, `cfm`, `gpm`, `%`, `°`, `deg` (there is no `Mpsi`; prefixes only attach when listed in `RAW_BASE_UNITS[k].prefixes`, so e.g. `um` and `uin` exist while `mrad` does not). `lb` resolves to `lb_m` for Mass/MassFlow/Density/SpecificEnergy and `lb_f` otherwise (`lb_f`, `lb_m`, `kip` are explicit). Compound thermal units must use `Δ` atoms (`Δ°C`, `ΔK`, `Δ°F`, `Δ°R`). Percentage variables (`unit: "%"`, scale `0.01`) use pure ratios in `baseFormula` (no `* 100`) while `system.js` stores the percentage number (`14` for `14%`).
- **Fractional Root & Dimensional Vector Traps:**
  - **No compound force/stress/modulus units inside fractional roots (`^(1/3)`, `^(1/4)`):** Because `DIMENSION_TOKEN_PALETTES` includes `bar` ($10^5$) and US force-based pressure units (`psi`, `ksi`), placing derived/compound units inside fractional roots causes `buildCompoundTokenConversions` to emit non-canonical fractional-power scalars (`alien-scalar`). Decouple sizing through pure geometric intermediates (e.g., `Z = M / sigma` then `Z = pi * d^3 / 32`) so only pure length powers (`L^3`, `L^4`) appear under roots.
  - **Angle (`Ang`) & Count (`C`) separation:** `rad`/`°` carry `{ Ang: 1 }`, `rev`/`rpm` carry `{ C: 1 }`, and `Hz` carries `{ T: -1 }`. Avoid squaring angular speeds (`rad/s`) inside force/energy formulas (`Ang: 2`) or placing `rad`-carrying rates (`N-m/rad`, `Ang: -1`) inside `sqrt(...)` (`Ang: -0.5`). Express cyclic natural frequencies in `Hz` (`{ T: -1 }`) and bridge `rpm` $\leftrightarrow$ `rad/s` $\leftrightarrow$ `Hz` via $\omega = 2\pi n$.
  - **Volume vs. length-cubed:** Do not compute `DIMENSIONS.VOLUME` (`L`, `gal`) directly from `LENGTH` products (`pi * r^2 * L` with `mm`/`in`; `in^3 -> gal` emits `231`), and do not add `SECTION_MODULUS` (`mm^3`, `in^3`) to `DIMENSION_TOKEN_PALETTES` (collides with `VOLUME` `{ L: 3 }`).
  - **Empirical `requiredUnits`:** Relations whose `variants.SI`/`US` specify `requiredUnits` must also declare top-level `requiredUnits` matching the top-level formula for `MIXED` mode.

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
- **Significant Figure Retention:** Conversions to alternative units must retain $\ge 3$ significant figures under the 6-decimal display cap ($|v| \ge 0.0995$, `MIN_DISPLAY_MAGNITUDE`).
- **Compound Decomposition:** Decomposed unit options (e.g. $\text{W} \to \text{J/s} \to \text{N}\cdot\text{m/s} \to \text{kg}\cdot\text{m}^2/\text{s}^3$) are sampled with probability inversely proportional to token count: $w_i = 1/t_i$.
- **Cross-Unit Subtractive Amplification Trap:** In `derivation_matrix_test.js` pairwise unit coverage, a small quantity converted across palette units (e.g., a sub-millimeter displacement converted to `ft` at 6 decimals) inside a subtractive expression divided by a small factor can amplify 6-decimal rounding error past `ORACLE_REL_TOLERANCE = 1e-3`. Ensure canonical `createSystem` values remain well-conditioned across all palette units when subtractive inversion occurs.

---

## 7. Direction-Agnostic Synthesis & Natural Cognitive Fading

### 7.1 Relation-graph problem construction

Topics provide a variable schema, relation network, and a `createSystem` ground-truth generator. The shared problem engine uses those relations and the active unit-system context to construct solvable paths and choose problem deliverables; topics should not encode a fixed sequence of givens and goals.

- `canSolveTarget` in `src/core/graph_solver.js` checks whether a target is reachable from candidate givens for the active system/state.
- `determineGraphDistance` in `src/core/problem_gen.js` uses mastery to influence the intended problem-chain depth. The progression is Fibonacci-based rather than a fixed topic-specific hop count.
- Problem-path construction and statement building live in `src/core/problem_gen.js`. Use `PROBLEM-STEPS` to inspect the actual sequence for a topic/seed; do not infer generated behavior from the README alone.

### 7.2 Cognitive fading and mastery propagation

- **Lower mastery:** Problems generally expose more intermediate prompts and use shorter paths, providing more scaffolding.
- **Higher mastery:** The engine can use longer relation chains and hide mastered intermediate steps from the learner-facing prompt/solution flow, leaving the active deliverable to be solved.
- **Ancestry propagation:** The mastery engine exposes ancestor reinforcement and penalty logic. Correct work can reinforce faded prerequisite relations; failures or reveals can reduce ancestor mastery and allow scaffolding to return.

The exact threshold and hop schedule are defined in `src/mastery/constants.js`; inspect that source before changing thresholds or describing a precise percentage. Use `PROBLEM-STEPS` and the mastery tests to verify user-visible behavior.

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

New topic leaves should follow the repository's **4-file Domain Architecture** under `src/topics/<subject>/<category>/<topic_name>/` (the category segment may be omitted for standalone topics). New material must be mathematically closed, unit-coherent, and independently verifiable against textbook ground truth.

```text
src/topics/<subject>/<category>/<topic_name>/  # optional category segment
├── index.js       # Topic manifest, categorization, and engine wiring
├── schema.js      # Scoped variable dictionary (dimensions, units, aliases)
├── relations.js   # Invertible physics relations (nodes, baseFormula, canonicalTex)
└── system.js      # Independent ground truth generator ({ sys } => SystemState)
```

### 9.1 Topic Manifest Blueprint (`index.js`)

```javascript
/**
 * src/topics/<subject>/<category>/<topic>/index.js
 * (omit <category> for standalone topics)
 */
import { MY_TOPIC_VARS_DB } from "./schema.js";
import { MY_TOPIC_RELATIONS } from "./relations.js";
import { createMyTopicSystem } from "./system.js";

export const myTopic = Object.freeze({
  id: "<subject>_<topic_name>",             // Globally unique ID used by the generated registry
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
 * src/topics/<subject>/<category>/<topic>/schema.js
 * (omit <category> for standalone topics)
 */
import { DIMENSIONS } from "../../../../core/dimensions.js"; // nested category topic; standalone topics climb one fewer level

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
    unit: "kJ/kg-ΔK",
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
 * src/topics/<subject>/<category>/<topic>/relations.js
 * (omit <category> for standalone topics)
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
 * src/topics/<subject>/<category>/<topic>/system.js
 * (omit <category> for standalone topics)
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

### 9.5 Automatic Discovery & Verification

1. Do **not** create subject/category barrel `index.js` files or edit `src/topics/index.js` or `src/mcq/index.js` manually.
2. Run `npm test` — the configured workflow cleans MCQ sets, regenerates the topic and MCQ registries, and runs the test suites. The tests cover schema hygiene, equation inversion, numerical fidelity, derivation rendering, and pairwise unit/system cases; consult the actual test output rather than assuming a blanket guarantee from the README.
3. If the matrix reports failures, each line ends in `seed=N`; paste it into a `TRACE` directive (section 0) to see where the offending scalar is created.

### 9.6 Authoring MCQ Sets (`src/mcq/`)

MCQ sets can be committed directly to the repository under `src/mcq/` or uploaded at runtime in the browser.

#### Directory Layout (Repository Sets)
```text
src/mcq/<subject>/<set_name>/
├── set.json       # Required question bank
└── assets/        # Optional local images referenced by questions (e.g. "./assets/fig1.png")
```

- Folder depth determines grouping if `subject` / `category` are omitted from `set.json`, though declaring them explicitly is recommended.
- Never edit `src/mcq/index.js` by hand.

#### `set.json` Schema

```json
{
  "id": "mcq_cse_math_01",
  "title": "Quantitative Reasoning & Word Problems",
  "subject": "Civil Service Exam",
  "category": "Numerical Ability",
  "questions": [
    {
      "id": 126,
      "q": "Which fraction has the largest value?",
      "options": ["$\\frac{4}{5}$", "$\\frac{41}{50}$", "$\\frac{17}{20}$", "$75\\%$", "None, they are all equal"],
      "answer": "$\\frac{17}{20}$",
      "shuffle": [[0, 1, 2, 3]]
    },
    {
      "id": 127,
      "q": "Identify the component shown in the diagram.",
      "image": { "src": "./assets/fig1.png", "alt": "Pump cross-section" },
      "options": ["Impeller", "Volute", "Shaft sleeve", "Wear ring"],
      "answer": "Impeller"
    }
  ]
}
```

| Field | Required | Notes |
|---|---|---|
| `id` | Recommended | Globally unique string. Defaults to `mcq_<relDir>` if omitted. |
| `title` | Recommended | Display name in the quiz selector (falls back to `setName` or folder name). |
| `subject` | Recommended | Top-level group in the selector (falls back to `<subject>` folder name). |
| `category` | No | Sub-group under `subject`, or `null` for standalone sets. |
| `questions` | Yes | Array of question objects. |
| `questions[].q` | Yes | Prompt text. Supports KaTeX (`$...$` / `$$...$$`). |
| `questions[].options` | Yes | At least 2 choices. Pools $> 4$ sample the correct answer + 3 distractors at runtime. |
| `questions[].answer` | Yes | Exact option text (recommended), option letter (`"A"`–`"F"`), or index. |
| `questions[].shuffle` | No | Omit for full shuffle; `[]` locks option order; index groups (e.g. `[[0, 1, 2]]`) shuffle only those indices while pinning trailing choices like `"All of the above"` / `"NO ERROR"`. |
| `questions[].image` | No | Path string (`"./assets/fig1.png"`, `https://...`, `data:image/...`) or `{ "src": "...", "alt": "..." }`. |

#### Publishing & Local Uploads
- **Repository sets (important):** When adding new questions, you may simply append them to the `questions` array in `set.json`. You do not need to worry about ID conflicts or duplicates. Running `npm test` (or `npm run clean:mcqs`) will automatically deduplicate questions, merge their option pools, and re-index IDs to a strict $1 \dots N$ sequence before updating the registry. Once sanitized, **commit + push the regenerated `src/mcq/index.js`** alongside your `set.json`.
- **Local browser uploads:** Users can also import personal `.json` or `.zip` (containing a `.json` file plus an `assets/` folder) directly via **+ Add Quiz (.json / .zip)** in the quiz dropdown; these persist locally in `IndexedDB`.

---

## 10. Testing & Invariant Verification Suite

Run **`npm test`** as the canonical full verification command. It performs the repository's MCQ cleaning/registry-generation steps and then runs the configured Node test suites with the quiet reporter. Use Node.js 22.

For a focused regression while iterating, run an individual test file directly, for example:

```bash
node --test test/ctx_test.js
node --test test/unit_catalog_test.js
node --test test/derivation_matrix_test.js
```

`test/derivation_matrix_test.js` supports the `MATRIX_TOPIC` environment variable for a single-topic matrix run. Use the command documented in the current package scripts or inspect the test file before relying on a platform-specific shell example. `npm test` remains the final verification command.

| Suite or helper | Primary responsibility |
|---|---|
| `test/run_test.js` | Main integration/property suite: topic generation, algebra, unit behavior, derivation output, UI integration, mastery, and MCQ helper tests. |
| `test/run_hygiene_test.js` | Topic/schema hygiene, orphan and duplicate checks, alias collisions, shared-relation rules, and notation constraints. |
| `test/derivation_matrix_test.js` | Relation/target/system coverage under pairwise unit combinations and seeded generated-problem trials; failures include a `TRACE`-ready case. |
| `test/matrix_worker.js`, `test/matrix_helpers.js` | Worker and shared helpers used by matrix coverage; not standalone user-facing features. |
| `test/latex_oracle.js`, `test/validator.js` | Numerical LaTeX oracle and topic/equation validation helpers. |
| `test/ctx_test.js` | Context directive parsing, READ/OUTLINE/GREP behavior, budgets, range snapping, multi-scope GREP, and registry sections. |
| `test/trace_test.js` | TRACE case parsing, numeric hooks, hook restoration, and malformed-request handling. |
| `test/mcq_test.js` | MCQ registry, image asset, grid classifier, and ZIP reader helper coverage, invoked by the main test suite. |
| `test/unit_catalog_test.js`, `test/unit_frame_coherence_test.js` | Unit catalog behavior and coherent unit frames for coupled variables. |
| `test/topic_mix_test.js` | Multi-topic mixing/relation-share behavior. |
| `test/memo_equivalence_test.js` | Cached versus uncached algebra/unit lookup equivalence. |
| `test/prefix_policy_test.js`, `test/rate_parts_test.js`, `test/section_d_test.js`, `test/shared_token_sum_test.js`, `test/sibling_markup_test.js` | Focused unit grammar, scale decomposition, sibling-term conversion, and derivation markup regressions. |
| `test/patch_test.js`, `test/patch_format_test.js` | Patch parsing/application, supported fence formats, exact-match counts, and atomicity. |
| `test/reporter_test.js` | Quiet reporter behavior. |
| `test/xmb_model_test.js` | XMB picker motion/interaction model. |
| `test/skeleton_test.js` | Repository skeleton generation/shape. |

When a test fails, do not immediately edit the first line that appears suspicious. Read the failing assertion, inspect the implementation, and select the diagnostic that can distinguish competing root causes. For numerical derivation-matrix failures, start with `FAILURES` and follow with `TRACE` using the exact failing line.

---

## 11. Definition of Done (Checklist before submitting code)

- [ ] Stayed in brainstorm mode until explicit permission to code was granted.
- [ ] Addressed the root cause rather than patching a symptom (measured with `TRACE` when the cause was not obvious).
- [ ] No Hard Rules in Section 2 are violated.
- [ ] Any new unit is registered in `definitions.js` with consistent atomic base scales and 7D dimensional vectors.
- [ ] New formulas are pure physics; empirical exceptions declare `requiredUnits`.
- [ ] `system.js` is independent of the solver and honors `{ sys }`.
- [ ] Unit conversions default to in-situ, respect the 4-row fraction tower cap, omit coefficients of 1, keep scalars outside unit ratios, emit no fused scalars, and use canonical encompassing `\cancel`.
- [ ] Percentages render as `\text{\%}` and degree symbols use native `°`.
- [ ] Code changes use ```diff path/to/file.ext blocks (`<<<< ==== >>>>`, optional `expect=N`) unless shorter as a drop-in replacement.
- [ ] `npm test` (or `node --test` over every suite listed in section 10) was run and passed with 0 failures.
- [ ] Derivation output passes KaTeX rendering and contains no literal commas before units.
- [ ] No tests were renamed, skipped, loosened, or deleted.
- [ ] LF line endings, header comment on every new file, no dead code, no new duplication.
- [ ] Commit changes using the Conventional Commits pattern (Section 12).

---

## 12. Commit Guidelines

Once the Definition of Done is met and all tests pass, commit your changes using the Conventional Commits pattern to maintain a clean, searchable history:

```text
git commit -m "type(scope): short description"
```

### Types
- `feat`: New topics, MCQ sets, or core capabilities.
- `fix`: Corrections to math, unit scaling, or UI bugs.
- `docs`: Documentation, comments, or README updates.
- `refactor`: Code reorganization that preserves behavior.
- `test`: Adding or updating the test suite.
- `chore`: Routine tasks (registry generation, build scripts, dependencies).

### Common Scopes
- `core`: Mathematical engine, solver, or unit system.
- `ui`: All view components.
- `topic:<name>`: Changes specific to a subject or topic.
- `mcq`: MCQ engine or manifest updates.
- `mastery`: Spaced-repetition and decay logic.