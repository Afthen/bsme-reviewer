# BSME Reviewer

A graph-based problem generator and spaced-repetition reviewer for Mechanical Engineering board-exam subjects (Machine Design, Air Conditioning, with Powerplant Design planned). Every equation is a node in a graph. The engine chains equations into multi-step problems, checks answers, renders textbook-style derivations, and tracks mastery per equation with golden-ratio / Fibonacci memory curves.

- **Stack:** vanilla ES modules, no bundler, no runtime dependencies except KaTeX (CDN). State lives in `localStorage`.
- **Run:** serve the folder statically (`python3 -m http.server`) and open `index.html`. ES modules do not load from `file://`.
- **Test:** `node --test test/run_test.js test/run_hygiene_test.js` (Node 22).

---

## 2. Hard rules (non-negotiable)

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

## 12. Known gaps and traps

1. **[RESOLVED] `package.json` test script:** Pointed to `test/run_hygiene_test.js`.
2. **[RESOLVED] Hygiene suite:** Disambiguated `Y` vs `y_form`, resolved `t_db` vs `t_o` alias collision, and eliminated orphan variables across all topics (`hvac_bypass_air` and `diesel_heat_balance`).
3. **[RESOLVED] Fading and recall mode:** Solver steps supply `id: eq.id` and pass `{ id, baseFormula }` to `getMastery`; problem answer checking logs constant attempts under `const_<key>`.
4. **Affine temperature offsets are declared but unused** (6.3).
5. **Unit sampler is mostly unwired.** `sampleUnitMap` is rarely invoked; cooling tower `MIXED` mode falls into the SI branch.
6. **Derivation arithmetic is not verified.** Result-side conversions are not displayed.
7. **Unit gaps** listed in 6.4.
8. **[RESOLVED] Dead imports and incomplete files:** Cleared unused imports from `problem_gen.js` and ensured full closure of `app.js`.
9. **Trig arguments** other than a bare angle variable give wrong numbers without an error.