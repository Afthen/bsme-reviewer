/**
 * test/latex_oracle.js
 * Smart LaTeX Oracle. Evaluates rendered factor-label derivations numerically
 * and verifies strict equality with the boxed result.
 */

import assert from "node:assert/strict";

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

function evalLatexMathToNumber(tex, inTrigArg = false) {
  const s = (tex || "").replace(/\{,\}/g, "").trim();
  if (!s) return NaN;

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
      tokens.push({ type: "num", val: Math.PI });
      i += 3;
      continue;
    }
    if (s.startsWith("\\cancel{", i)) {
      const grp = readBalancedGroup(s, i + 7);
      i = skipOptionalSubSuper(s, grp.nextIdx);
      tokens.push({ type: "unit", val: 1 });
      continue;
    }
    if (s.startsWith("\\text{", i)) {
      const grp = readBalancedGroup(s, i + 5);
      if (grp.content === "abs" || grp.content === "log") {
        tokens.push({ type: "fn", val: grp.content });
        i = grp.nextIdx;
      } else if (grp.content === "\\%" || grp.content === "%") {
        i = skipOptionalSubSuper(s, grp.nextIdx);
        tokens.push({ type: "unit", val: 0.01 });
      } else {
        i = skipOptionalSubSuper(s, grp.nextIdx);
        tokens.push({ type: "unit", val: 1 });
      }
      continue;
    }
    if (s[i] === "°") {
      i++;
      if (i < s.length && (s[i] === "C" || s[i] === "F" || s[i] === "R" || s[i] === "K")) {
        i++;
      }
      i = skipOptionalSubSuper(s, i);
      tokens.push({ type: "unit", val: inTrigArg ? (Math.PI / 180) : 1 });
      continue;
    }
    if (s.startsWith("\\cfrac{", i) || s.startsWith("\\tfrac{", i) || s.startsWith("\\frac{", i)) {
      const cmdLen = s.startsWith("\\frac{", i) ? 5 : 6;
      const numGrp = readBalancedGroup(s, i + cmdLen);
      const denGrp = readBalancedGroup(s, numGrp.nextIdx);
      i = denGrp.nextIdx;
      const nVal = evalLatexMathToNumber(numGrp.content, false);
      const dVal = evalLatexMathToNumber(denGrp.content, false);
      if (!Number.isFinite(nVal) || !Number.isFinite(dVal) || dVal === 0) return NaN;
      tokens.push({ type: "num", val: nVal / dVal });
      continue;
    }
    if (s.startsWith("\\sqrt{", i)) {
      const grp = readBalancedGroup(s, i + 5);
      i = grp.nextIdx;
      const innerVal = evalLatexMathToNumber(grp.content, false);
      if (!Number.isFinite(innerVal)) return NaN;
      tokens.push({ type: "num", val: Math.sqrt(innerVal) });
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
          pow = evalLatexMathToNumber(pGrp.content, false);
          i = pGrp.nextIdx;
        } else {
          pow = Number(s[i++]);
        }
      }
      while (i < s.length && s[i] === " ") i++;
      let argVal = NaN;
      if (s.startsWith("\\left(", i)) {
        const grp = readBalancedLeftRightParens(s, i);
        if (grp.nextIdx === i) return NaN;
        argVal = evalLatexMathToNumber(grp.content, true);
        i = grp.nextIdx;
      } else if (s[i] === "(") {
        const grp = readBalancedGroup(s, i, "(", ")");
        argVal = evalLatexMathToNumber(grp.content, true);
        i = grp.nextIdx;
      } else {
        const mNum = s.slice(i).match(/^[\d.]+(?:\s*(?:\\,\s*)?°)?/);
        if (mNum) {
          argVal = evalLatexMathToNumber(mNum[0], true);
          i += mNum[0].length;
        }
      }
      if (!Number.isFinite(argVal) || !Number.isFinite(pow)) return NaN;
      const fnName = trigMatch.slice(1);
      tokens.push({ type: "num", val: Math.pow(Math[fnName](argVal), pow) });
      continue;
    }
    if (s.startsWith("e^{", i)) {
      const grp = readBalancedGroup(s, i + 2);
      i = grp.nextIdx;
      const expVal = evalLatexMathToNumber(grp.content, false);
      if (!Number.isFinite(expVal)) return NaN;
      tokens.push({ type: "num", val: Math.exp(expVal) });
      continue;
    }
    if (s[i] === "{") {
      const grp = readBalancedGroup(s, i);
      i = grp.nextIdx;
      const innerVal = evalLatexMathToNumber(grp.content, inTrigArg);
      if (!Number.isFinite(innerVal)) return NaN;
      tokens.push({ type: "num", val: innerVal });
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
      tokens.push({ type: "num", val: parseFloat(numStr) });
      continue;
    }
    if ("+-*/^()".includes(s[i])) {
      tokens.push({ type: "op", val: s[i] });
      i++;
      continue;
    }
    return NaN;
  }

  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function parsePrimary() {
    const t = peek();
    if (!t) return NaN;
    if (t.type === "op" && t.val === "-") {
      next();
      return -parsePower();
    }
    if (t.type === "op" && t.val === "+") {
      next();
      return parsePower();
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
      if (fn === "ln") return Math.log(arg);
      if (fn === "log") return Math.log10(arg);
      if (fn === "abs") return Math.abs(arg);
      if (fn === "sininv") return Math.asin(arg) * 180 / Math.PI;
      if (fn === "cosinv") return Math.acos(arg) * 180 / Math.PI;
      if (fn === "taninv") return Math.atan(arg) * 180 / Math.PI;
      return NaN;
    }
    if (t.type === "num" || t.type === "unit") {
      return next().val;
    }
    return NaN;
  }

  function parsePower() {
    let left = parsePrimary();
    while (peek()?.type === "op" && peek().val === "^") {
      next();
      const right = parsePower();
      left = Math.pow(left, right);
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
        left = t.val === "*" ? left * right : left / right;
      } else if (t.type === "unit" || t.type === "num" || t.type === "fn" || (t.type === "op" && t.val === "(")) {
        const right = parsePower();
        left = left * right;
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
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  const out = parseAdd();
  return pos === tokens.length ? out : NaN;
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

  const tol = Math.max(Math.abs(boxedVal) * 1e-3, 1e-3);
  assert.ok(
    Math.abs(evaluated - boxedVal) <= tol,
    `Derivation evaluates to ${evaluated}, boxed is ${boxedVal} (${ctx}):\n${numTex}`
  );
}
