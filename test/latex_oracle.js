/**
 * test/latex_oracle.js
 * Smart LaTeX Oracle. Evaluates rendered factor-label derivations numerically
 * and verifies strict equality with the boxed result.
 */

import assert from "node:assert/strict";
import { ORACLE_REL_TOLERANCE, ORACLE_ABS_TOLERANCE } from "../src/core/dimensions.js";

let katex = null;
try {
  const mod = await import("katex");
  katex = mod.default || mod;
} catch (_) {
  katex = null;
}

export function validateDerivationLatex(derivLatex) {
  assert.ok(typeof derivLatex === "string" && derivLatex.length > 0, "Derivation LaTeX must be non-empty");
  assert.ok(derivLatex.includes("\\boxed{"), "Derivation step missing boxed answer");
  assert.ok(derivLatex.includes("="), "Derivation step missing equality");
  assert.ok(!derivLatex.includes("\\cdot^"), `\\cdot cannot take a direct superscript in step: ${derivLatex}`);
  assert.ok(!derivLatex.includes("\\cancel{}") && !derivLatex.includes("\\cancel{ }"), `Empty cancel bracket in step: ${derivLatex}`);
  assert.ok(!derivLatex.includes("\\cfrac{\\cfrac{\\cfrac{"), `Illegal nested fraction tower (exceeds 2 levels) in step: ${derivLatex}`);

  let braceDepth = 0;
  for (let i = 0; i < derivLatex.length; i++) {
    const ch = derivLatex[i];
    const prev = i > 0 ? derivLatex[i - 1] : "";
    if (prev !== "\\") {
      if (ch === "{") braceDepth++;
      else if (ch === "}") braceDepth--;
      assert.ok(braceDepth >= 0, `Unbalanced closing brace '}' in derivation: ${derivLatex}`);
    }
  }
  assert.equal(braceDepth, 0, `Unbalanced opening brace '{' in derivation: ${derivLatex}`);

  const beginAligned = derivLatex.split("\\begin{aligned}").length - 1;
  const endAligned = derivLatex.split("\\end{aligned}").length - 1;
  assert.equal(beginAligned, endAligned, `Mismatched aligned environment in: ${derivLatex}`);

  if (katex && typeof katex.renderToString === "function") {
    let raw = derivLatex.trim();
    if (raw.startsWith("$$") && raw.endsWith("$$")) {
      raw = raw.slice(2, -2).trim();
    }
    try {
      katex.renderToString(raw, { displayMode: true, throwOnError: true });
    } catch (err) {
      assert.fail(`KaTeX rendering error: ${err.message} in derivation:\n${derivLatex}`);
    }
  }
}

export function validateStatementLatex(statement, ctx = "") {
  const str = String(statement || "");
  let pos = 0;
  while (pos < str.length) {
    if (str.startsWith("$$", pos)) {
      const end = str.indexOf("$$", pos + 2);
      assert.ok(end !== -1, `Unclosed $$ in ${ctx} statement: ${str}`);
      const math = str.slice(pos + 2, end).trim();
      if (katex && typeof katex.renderToString === "function") {
        katex.renderToString(math, { displayMode: true, throwOnError: true });
      }
      pos = end + 2;
    } else if (str[pos] === "$") {
      const end = str.indexOf("$", pos + 1);
      assert.ok(end !== -1, `Unclosed $ in ${ctx} statement: ${str}`);
      const math = str.slice(pos + 1, end).trim();
      if (katex && typeof katex.renderToString === "function") {
        katex.renderToString(math, { displayMode: false, throwOnError: true });
      }
      pos = end + 1;
    } else {
      pos++;
    }
  }
}

function readBalancedGroup(str, openIdx, openCh = "{", closeCh = "}") {
  if (str[openIdx] !== openCh) return { content: "", nextIdx: openIdx };
  let depth = 0;
  for (let i = openIdx; i < str.length; i++) {
    if (str[i] === openCh) depth++;
    else if (str[i] === closeCh) {
      depth--;
      if (depth === 0) return { content: str.slice(openIdx + 1, i), nextIdx: i + 1 };
    }
  }
  return { content: str.slice(openIdx + 1), nextIdx: str.length };
}

function readBalancedLeftRightParens(str, startIdx) {
  let depth = 0;
  let i = startIdx;
  while (i < str.length) {
    if (str.startsWith("\\left(", i)) {
      depth++;
      i += 6;
    } else if (str.startsWith("\\right)", i)) {
      depth--;
      if (depth === 0) {
        return { content: str.slice(startIdx + 6, i), nextIdx: i + 7 };
      }
      i += 7;
    } else {
      i++;
    }
  }
  return { content: "", nextIdx: startIdx };
}

function skipOptionalSubSuper(str, idx) {
  let pos = idx;
  while (pos < str.length) {
    while (pos < str.length && str[pos] === " ") pos++;
    if (str[pos] === "_" || str[pos] === "^") {
      pos++;
      if (str[pos] === "{") {
        pos = readBalancedGroup(str, pos).nextIdx;
      } else if (pos < str.length) {
        pos++;
      }
    } else {
      break;
    }
  }
  return pos;
}

function evalLatexNode(tex, inTrigArg = false) {
  const fail = () => ({ val: NaN, pureUnit: false });
  const s = (tex || "").replace(/\{,\}/g, "").trim();
  if (!s) return fail();

  const tokens = [];
  let i = 0;
  while (i < s.length) {
    if (s[i] === " " || s[i] === "\t" || s[i] === "\n") {
      i++;
      continue;
    }
    if (s.startsWith("\\,", i) || s.startsWith("\\;", i) || s.startsWith("\\ ", i)) {
      i += 2;
      continue;
    }
    if (s.startsWith("\\quad", i)) {
      i += 5;
      continue;
    }
    if (s.startsWith("\\Delta", i) && !/[a-zA-Z]/.test(s[i + 6] || "")) {
      i += 6;
      while (i < s.length && (s[i] === " " || s.startsWith("\\,", i))) {
        i += s[i] === " " ? 1 : 2;
      }
      if (s[i] !== "°" && !s.startsWith("\\text{", i)) return fail();
      continue;
    }
    if (s[i] === "Δ") {
      i++;
      if (s[i] !== "°" && s[i] !== "K" && !s.startsWith("\\text{", i)) return fail();
      continue;
    }
    if (s.startsWith("\\left(", i) || s.startsWith("\\left[", i)) {
      tokens.push({ type: "op", val: "(" });
      i += 6;
      continue;
    }
    if (s.startsWith("\\right)", i) || s.startsWith("\\right]", i)) {
      tokens.push({ type: "op", val: ")" });
      i += 7;
      continue;
    }
    if (s.startsWith("\\cdot", i) || s.startsWith("\\times", i)) {
      tokens.push({ type: "op", val: "*" });
      i += s.startsWith("\\cdot", i) ? 5 : 6;
      continue;
    }
    if (s.startsWith("\\pi", i)) {
      tokens.push({ type: "num", val: Math.PI, pureUnit: false });
      i += 3;
      continue;
    }
    if (s.startsWith("\\cancel{", i)) {
      const grp = readBalancedGroup(s, i + 7);
      i = skipOptionalSubSuper(s, grp.nextIdx);
      tokens.push({ type: "unit", val: 1, pureUnit: true });
      continue;
    }
    if (s.startsWith("\\text{", i)) {
      const grp = readBalancedGroup(s, i + 5);
      if (grp.content === "abs" || grp.content === "log") {
        tokens.push({ type: "fn", val: grp.content });
        i = grp.nextIdx;
      } else if (grp.content === "\\%" || grp.content === "%") {
        i = skipOptionalSubSuper(s, grp.nextIdx);
        tokens.push({ type: "unit", val: 0.01, pureUnit: true });
      } else {
        i = skipOptionalSubSuper(s, grp.nextIdx);
        tokens.push({ type: "unit", val: 1, pureUnit: true });
      }
      continue;
    }
    if (s[i] === "°" || s[i] === "K") {
      if (s[i] === "K") {
        if (i > 0 && /[a-zA-Z]/.test(s[i - 1])) return fail();
        if (i + 1 < s.length && /[a-zA-Z]/.test(s[i + 1])) return fail();
        i++;
      } else {
        i++;
        if (i < s.length && (s[i] === "C" || s[i] === "F" || s[i] === "R" || s[i] === "K")) {
          i++;
        }
      }
      i = skipOptionalSubSuper(s, i);
      tokens.push({ type: "unit", val: inTrigArg ? (Math.PI / 180) : 1, pureUnit: true });
      continue;
    }
    if (s.startsWith("\\cfrac{", i) || s.startsWith("\\tfrac{", i) || s.startsWith("\\frac{", i)) {
      const cmdLen = s.startsWith("\\frac{", i) ? 5 : 6;
      const numGrp = readBalancedGroup(s, i + cmdLen);
      const denGrp = readBalancedGroup(s, numGrp.nextIdx);
      i = denGrp.nextIdx;
      const nRes = evalLatexNode(numGrp.content, false);
      const dRes = evalLatexNode(denGrp.content, false);
      if (!Number.isFinite(nRes.val) || !Number.isFinite(dRes.val) || dRes.val === 0) return fail();
      tokens.push({ type: "num", val: nRes.val / dRes.val, pureUnit: nRes.pureUnit && dRes.pureUnit });
      continue;
    }
    if (s.startsWith("\\sqrt{", i)) {
      const grp = readBalancedGroup(s, i + 5);
      i = grp.nextIdx;
      const innerRes = evalLatexNode(grp.content, false);
      if (!Number.isFinite(innerRes.val) || innerRes.pureUnit) return fail();
      tokens.push({ type: "num", val: Math.sqrt(innerRes.val), pureUnit: false });
      continue;
    }
    if (s.startsWith("\\ln", i)) {
      tokens.push({ type: "fn", val: "ln" });
      i += 3;
      continue;
    }
    const invTrig = ["\\sin^{-1}", "\\cos^{-1}", "\\tan^{-1}"].find(fn => s.startsWith(fn, i));
    if (invTrig) {
      tokens.push({ type: "fn", val: invTrig.slice(1, 4) + "inv" });
      i += invTrig.length;
      continue;
    }
    const trigMatch = ["\\sin", "\\cos", "\\tan"].find(fn => s.startsWith(fn, i));
    if (trigMatch) {
      i += trigMatch.length;
      while (i < s.length && s[i] === " ") i++;
      let pow = 1;
      if (s[i] === "^") {
        i++;
        if (s[i] === "{") {
          const pGrp = readBalancedGroup(s, i);
          const pRes = evalLatexNode(pGrp.content, false);
          if (pRes.pureUnit) return fail();
          pow = pRes.val;
          i = pGrp.nextIdx;
        } else {
          pow = Number(s[i++]);
        }
      }
      while (i < s.length && s[i] === " ") i++;
      let argRes = fail();
      if (s.startsWith("\\left(", i)) {
        const grp = readBalancedLeftRightParens(s, i);
        if (grp.nextIdx === i) return fail();
        argRes = evalLatexNode(grp.content, true);
        i = grp.nextIdx;
      } else if (s[i] === "(") {
        const grp = readBalancedGroup(s, i, "(", ")");
        argRes = evalLatexNode(grp.content, true);
        i = grp.nextIdx;
      } else {
        const mNum = s.slice(i).match(/^[\d.]+(?:\s*(?:\\,\s*)?°)?/);
        if (mNum) {
          argRes = evalLatexNode(mNum[0], true);
          i += mNum[0].length;
        }
      }
      if (!Number.isFinite(argRes.val) || argRes.pureUnit || !Number.isFinite(pow)) return fail();
      const fnName = trigMatch.slice(1);
      tokens.push({ type: "num", val: Math.pow(Math[fnName](argRes.val), pow), pureUnit: false });
      continue;
    }
    if (s.startsWith("e^{", i)) {
      const grp = readBalancedGroup(s, i + 2);
      i = grp.nextIdx;
      const expRes = evalLatexNode(grp.content, false);
      if (!Number.isFinite(expRes.val) || expRes.pureUnit) return fail();
      tokens.push({ type: "num", val: Math.exp(expRes.val), pureUnit: false });
      continue;
    }
    if (s[i] === "{") {
      const grp = readBalancedGroup(s, i);
      i = grp.nextIdx;
      const innerRes = evalLatexNode(grp.content, inTrigArg);
      if (!Number.isFinite(innerRes.val)) return fail();
      tokens.push({ type: "num", val: innerRes.val, pureUnit: innerRes.pureUnit });
      continue;
    }
    if (/[0-9.]/.test(s[i])) {
      let numStr = "";
      while (i < s.length && /[0-9.]/.test(s[i])) numStr += s[i++];
      if (s[i] === "e" || s[i] === "E") {
        if (/[+-0-9]/.test(s[i + 1] || "")) {
          numStr += s[i++];
          if (s[i] === "+" || s[i] === "-") numStr += s[i++];
          while (i < s.length && /[0-9]/.test(s[i])) numStr += s[i++];
        }
      }
      tokens.push({ type: "num", val: parseFloat(numStr), pureUnit: false });
      continue;
    }
    if ("+-*/^()".includes(s[i])) {
      tokens.push({ type: "op", val: s[i] });
      i++;
      continue;
    }
    return fail();
  }

  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function parsePrimary() {
    const t = peek();
    if (!t) return fail();
    if (t.type === "op" && t.val === "-") {
      next();
      const inner = parsePower();
      if (inner.pureUnit) return fail();
      return { val: -inner.val, pureUnit: false };
    }
    if (t.type === "op" && t.val === "+") {
      next();
      const inner = parsePower();
      if (inner.pureUnit) return fail();
      return { val: inner.val, pureUnit: false };
    }
    if (t.type === "op" && t.val === "(") {
      next();
      const v = parseAdd();
      if (peek()?.val === ")") next();
      return v;
    }
    if (t.type === "fn") {
      const fn = next().val;
      const arg = parsePrimary();
      if (arg.pureUnit || !Number.isFinite(arg.val)) return fail();
      if (fn === "ln") return { val: Math.log(arg.val), pureUnit: false };
      if (fn === "log") return { val: Math.log10(arg.val), pureUnit: false };
      if (fn === "abs") return { val: Math.abs(arg.val), pureUnit: false };
      if (fn === "sininv") return { val: Math.asin(arg.val) * 180 / Math.PI, pureUnit: false };
      if (fn === "cosinv") return { val: Math.acos(arg.val) * 180 / Math.PI, pureUnit: false };
      if (fn === "taninv") return { val: Math.atan(arg.val) * 180 / Math.PI, pureUnit: false };
      return fail();
    }
    if (t.type === "num" || t.type === "unit") {
      const tok = next();
      return { val: tok.val, pureUnit: !!tok.pureUnit };
    }
    return fail();
  }

  function parsePower() {
    let left = parsePrimary();
    while (peek()?.type === "op" && peek().val === "^") {
      next();
      const right = parsePower();
      if (left.pureUnit || right.pureUnit) return fail();
      left = { val: Math.pow(left.val, right.val), pureUnit: false };
    }
    return left;
  }

  function parseMul() {
    let left = parsePower();
    while (peek()) {
      const t = peek();
      if (t.type === "op" && (t.val === "*" || t.val === "/")) {
        next();
        const right = parsePower();
        const val = t.val === "*" ? left.val * right.val : left.val / right.val;
        left = { val, pureUnit: left.pureUnit && right.pureUnit };
      } else if (t.type === "unit" || t.type === "num" || t.type === "fn" || (t.type === "op" && t.val === "(")) {
        const right = parsePower();
        left = { val: left.val * right.val, pureUnit: left.pureUnit && right.pureUnit };
      } else {
        break;
      }
    }
    return left;
  }

  function parseAdd() {
    let left = parseMul();
    while (peek()?.type === "op" && (peek().val === "+" || peek().val === "-")) {
      const op = next().val;
      const right = parseMul();
      if (left.pureUnit || right.pureUnit) return fail();
      left = { val: op === "+" ? left.val + right.val : left.val - right.val, pureUnit: false };
    }
    return left;
  }

  const out = parseAdd();
  if (pos !== tokens.length) return fail();
  return out;
}

export function evalLatexMathToNumber(tex, inTrigArg = false) {
  const res = evalLatexNode(tex, inTrigArg);
  return (res.pureUnit || !Number.isFinite(res.val)) ? NaN : res.val;
}

export function assertDerivationMatchesAnswer(derivLatex, expectedVal, ctx = "", varsDb = {}, targetUnit = null) {
  const inner = derivLatex.trim().replace(/^\$\$\s*\\begin\{aligned\}/, "").replace(/\\end\{aligned\}\s*\$\$$/, "");
  const rows = inner.split(/\\\\(?:\[\d+pt\])?/).map(r => r.trim()).filter(Boolean);
  assert.ok(rows.length >= 2, `Expected >= 2 aligned rows in derivation (${ctx}):\n${derivLatex}`);

  const finalRow = rows[rows.length - 1];
  const boxMatch = finalRow.match(/\\boxed\{([\s\S]+)\}/);
  assert.ok(boxMatch, `Missing \\boxed{} in final row (${ctx}): ${finalRow}`);
  const boxedNumMatch = boxMatch[1].replace(/\{,\}|,/g, "").match(/^[+-]?[\d.]+(?:[eE][+-]?\d+)?/);
  assert.ok(boxedNumMatch, `Could not parse boxed value from ${boxMatch[1]} (${ctx})`);
  const boxedVal = parseFloat(boxedNumMatch[0]);

  const numericRow = rows[rows.length - 2];
  const ampIdx = numericRow.indexOf("&=");
  const numTex = ampIdx >= 0 ? numericRow.slice(ampIdx + 2).trim() : numericRow;
  const evaluated = evalLatexMathToNumber(numTex);

  assert.ok(
    Number.isFinite(evaluated),
    `Derivation numeric expression evaluated to non-finite (${evaluated}) in ${ctx}:\n${numTex}`
  );

  const tol = Math.max(Math.abs(boxedVal) * ORACLE_REL_TOLERANCE, ORACLE_ABS_TOLERANCE);
  assert.ok(
    Math.abs(evaluated - boxedVal) <= tol,
    `Derivation evaluates to ${evaluated}, boxed is ${boxedVal} (${ctx}):\n${numTex}`
  );

  // If the row above the conversion row is itself a numeric formula row, verify it feeds the conversion row accurately.
  if (rows.length >= 3) {
    const prevRow = rows[rows.length - 3];
    const prevAmp = prevRow.indexOf("&=");
    const prevTex = prevAmp >= 0 ? prevRow.slice(prevAmp + 2).trim() : prevRow;
    const prevEval = evalLatexMathToNumber(prevTex);
    if (Number.isFinite(prevEval)) {
      const leadMatch = numTex.replace(/\{,\}|,/g, "").match(/^[(\s]*([+-]?[\d.]+(?:[eE][+-]?\d+)?)/);
      assert.ok(leadMatch, `Expected numeric lead in conversion row (${ctx}): ${numTex}`);
      const leadVal = parseFloat(leadMatch[1]);
      const prevTol = Math.max(Math.abs(prevEval) * ORACLE_REL_TOLERANCE, ORACLE_ABS_TOLERANCE);
      assert.ok(
        Math.abs(prevEval - leadVal) <= prevTol,
        `Formula row evaluated to ${prevEval}, but conversion row starts with ${leadVal} (${ctx}):\n${prevTex}`
      );
    }
  }
}
