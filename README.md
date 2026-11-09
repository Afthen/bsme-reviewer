# BSME Reviewer

A graph-based problem generator and spaced-repetition reviewer for Mechanical Engineering board-exam subjects. Every equation is a node in a graph. The engine chains equations into multi-step problems, checks answers, renders textbook-style derivations, and tracks mastery per equation with golden-ratio / Fibonacci memory curves.

- **Stack:** vanilla ES modules, no bundler, no runtime dependencies except KaTeX (CDN). State lives in `localStorage`.
- **Run:** serve the folder statically (`python3 -m http.server`) and open `index.html`. ES modules do not load from `file://`.
- **Test:** `node --test test/run_test.js test/run_hygiene_test.js` (Node 22).

---

## 1. Hard rules (non-negotiable)

### Math and formulas
- **R1. Formulas are nodes.** Add an equation by adding a relation. Never write a bespoke "solve for X" function, a hard-coded solution order, or a per-topic solver. Variables are edges; `solveDAG` finds the path.
- **R2. AST only.** All symbolic work goes through `src/cas/ast.js` and `src/cas/algebra.js`. No regex rewriting of formulas, no `eval` / `new Function`, no CAS dependency.
- **R3. Obey the formula language (section 5).** Explicit `*`, parenthesised exponents, exactly one `=`, trig arguments that are a bare angle variable.
- **R4. Case-sensitive canonical keys.** Keys match `[A-Za-z][A-Za-z0-9_]*`. TeX belongs in `symbol`, not in the key.

### Units
- **R5. Relations are pure physics.** No unit-conversion constants (`25.4`, `1000`, `60`, `12`, ...). The unit engine converts.
- **R6. Declare the exceptions.** Declare `requiredUnits` (for empirical formulas), `variants`, or `solvable`.
- **R7. Register every unit.** Every unit string must exist in `src/cas/units/definitions.js`.
- **R8. No absolute temperatures in unit-converted relations.** Use temperature differences or pin `requiredUnits` to `°C` / `K`.

### Topics and data
- **R9. Ground truth is independent.** `system.js` computes true values by hand, with explicit conversions.
- **R10. `createSystem` contract.** `createSystem({ sys })` accepts `"SI"` or `"US"`, returns `sys`, `_u` (unit per key) and `_names`, and provides a value for every non-abstract key in `varsDb`. SI-only topics ignore `sys` but still return `sys: "SI"`.
- **R11. Globally unique equation ids** (`eq_<topic>_<name>`).
- **R12. Share, don't copy.** A formula used by more than one subject lives in `core/` or a `common/` folder.
- **R13. Clean schemas.** No orphan variables, no duplicate formulas, no alias collisions inside a topic.
- **R14. Don't invent engineering data.** Every coefficient carries a source comment.

### Mastery and generation
- **R15. No magic numbers in learning logic.** Use `phi(n)`, `fib(n)`, `FADING_THRESHOLD`, `snapToFibonacci` from `src/mastery/constants.js`.
- **R16. Variant-aware planning.** Planning calls must receive the real system `S`.
- **R17. Respect the mastery lookup contract.** `getDecayedMastery(eq, topic)` needs an object with an `id` (and `baseFormula`).
- **R18. Textbook derivations.** Native `°`, never `\circ`. No underscores inside `\text{}`; no `\cdot^`; no nested `\cfrac` towers; every derivation ends in `\boxed{}`.
- **R19. Number display goes through `fmtSigFig`.**
- **R20. Vanilla DOM, idempotent init.**
- **R21. Interactive symbols.**
- **R22. Never make a red test invisible.**
- **R23. Bug fixes ship with a regression test** that fails without the fix.
- **R24. No dead code, no new duplication.**
- **R25. Report honestly.**

---

## 2. Units and Multi-System Sampling

### 6.1 Distribution Model
Problem generation draws unit systems using a 40% SI / 40% US / 20% MIXED distribution:
- **Pure SI / Pure US:** All variables operate within the coherent system palette.
- **MIXED Mode:** Dimensional variables are split 50-50 between SI and US units.
- **Significant Figure Retention:** Conversions into alternative intra-system units must retain $\ge 3$ significant figures under the repository's 3-decimal-place rule ($|v| \ge 0.100$). Conversions that round to $0.099$ or below (such as kilometers for gear pitch diameter) are rejected.
- **Compound Decomposition:** Decomposed unit representations (e.g. $\text{W} \to \text{J/s} \to \text{N}\cdot\text{m/s} \to \text{kg}\cdot\text{m}^2/\text{s}^3$) are sampled with probability inversely proportional to their token count ($w_i = 1/t_i$).
- **Constants:** Physical constants sample exclusively from standard textbook representations per unit system ($c_{pa} = 1.0062\,\text{kJ/kg}\cdot\text{K}$ or $0.24\,\text{Btu/lb}\cdot^\circ\text{F}$).

---

## 3. Derivation & Typesetting Standards
- **Zero-Comma Unit Spacing:** No commas precede units in any derivation line (`100\,\text{kN}`, $\boxed{50\,\text{mm}}$).
- **Additive Unit Grouping:** Like-unit sums and differences are combined into factored parenthesis expressions: $(a \pm b)\,\text{unit}$.
- **Specific Energy Convention:** Specific energy and specific work per unit mass strictly use lowercase notation ($q_A$, $q_R$, $w_{net}$ in $\text{kJ/kg}$), reserving uppercase notation for total energy or power ($Q$, $W$).
- **Perceptual Mastery Gradient:** Formula mastery bars interpolate continuously in Oklab color space from danger red (`oklab(0.63 0.22 0.12)`) through warm amber (`oklab(0.75 0.06 0.16)`) to emerald green (`oklab(0.72 -0.17 0.14)`), sorted ascending (weakest equations on top).

---

## 4. Known gaps and traps

1. **[RESOLVED] `package.json` test script:** Pointed to `test/run_hygiene_test.js`.
2. **[RESOLVED] Hygiene suite:** Disambiguated `Y` vs `y_form`, resolved `t_db` vs `t_o` alias collision, and eliminated orphan variables across all topics (`hvac_bypass_air` and `diesel_heat_balance`).
3. **[RESOLVED] Fading and recall mode:** Solver steps supply `id: eq.id` and pass `{ id, baseFormula }` to `getMastery`; problem answer checking logs constant attempts under `const_<key>`.
4. **Affine temperature offsets are declared but unused** (6.3).
5. **Unit sampler is mostly unwired.** `sampleUnitMap` is rarely invoked; cooling tower `MIXED` mode falls into the SI branch.
6. **Derivation arithmetic is not verified.** Result-side conversions are not displayed.
7. **Unit gaps** listed in 6.4.
8. **[RESOLVED] Dead imports and incomplete files:** Cleared unused imports from `problem_gen.js` and ensured full closure of `app.js`.
9. **Trig arguments** other than a bare angle variable give wrong numbers without an error.
