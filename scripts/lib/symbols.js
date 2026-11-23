/**
 * scripts/lib/symbols.js
 * Dependency-free extractor of top-level JS symbols (functions, consts, classes)
 * with exact 1-based line ranges. Used by scripts/fulfill_ctx.js for
 * READ path#symbol, OUTLINE, range snapping, and GREP enclosing-symbol tags.
 * Tolerates strings, template literals, comments, and regex literals when
 * tracking bracket depth.
 */

const DECL = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\*?\s+([A-Za-z_$][\w$]*)|(const|let|var|class)\s+([A-Za-z_$][\w$]*))/;
const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*)/;
const CONTINUES = /(?:[=,+\-*/%&|?:(\[{<>!]|=>)$/;
const REGEX_PREV = "(,=:[!&|?{};+-*%<>~^";

/** Marks, for each line, whether it starts as plain code at bracket depth 0. */
function scanCleanLines(src) {
  const n = src.length;
  const clean = new Array(src.split("\n").length).fill(false);
  clean[0] = true;
  let depth = 0;
  let line = 0;
  let i = 0;
  let prev = "";
  const nl = (plain) => {
    line++;
    clean[line] = plain && depth === 0;
  };

  while (i < n) {
    const c = src[i];
    const d = src[i + 1];

    if (c === "\n") { nl(true); i++; continue; }

    if (c === "/" && d === "/") {
      while (i < n && src[i] !== "\n") i++;
      continue;
    }

    if (c === "/" && d === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) {
        if (src[i] === "\n") nl(false);
        i++;
      }
      i += 2;
      continue;
    }

    if (c === '"' || c === "'") {
      i++;
      while (i < n && src[i] !== c && src[i] !== "\n") {
        if (src[i] === "\\") {
          if (src[i + 1] === "\n") nl(false);
          i++;
        }
        i++;
      }
      if (src[i] === c) i++;
      prev = "a";
      continue;
    }

    if (c === "`") {
      i++;
      while (i < n && src[i] !== "`") {
        if (src[i] === "\\") {
          if (src[i + 1] === "\n") nl(false);
          i += 2;
          continue;
        }
        if (src[i] === "\n") { nl(false); i++; continue; }
        if (src[i] === "$" && src[i + 1] === "{") {
          let b = 1;
          i += 2;
          while (i < n && b > 0) {
            const t = src[i];
            if (t === "{") b++;
            else if (t === "}") b--;
            else if (t === "\n") nl(false);
            i++;
          }
          continue;
        }
        i++;
      }
      i++;
      prev = "a";
      continue;
    }

    if (c === "/" && (prev === "" || REGEX_PREV.includes(prev))) {
      i++;
      let inClass = false;
      while (i < n && src[i] !== "\n") {
        const t = src[i];
        if (t === "\\") i++;
        else if (t === "[") inClass = true;
        else if (t === "]") inClass = false;
        else if (t === "/" && !inClass) break;
        i++;
      }
      i++;
      while (/[a-z]/.test(src[i] ?? "")) i++;
      prev = "a";
      continue;
    }

    if (c === "{" || c === "[" || c === "(") depth++;
    else if (c === "}" || c === "]" || c === ")") depth--;
    if (c !== " " && c !== "\t" && c !== "\r") prev = c;
    i++;
  }
  return clean;
}

/** Last line (0-based index) of the declaration that starts at line index L. */
function findEnd(lines, clean, L) {
  let lastCode = lines[L].trim();
  let boundary = lines.length;
  for (let j = L + 1; j < lines.length; j++) {
    const t = lines[j].trim();
    if (!t) continue;
    if (clean[j] && !CONTINUES.test(lastCode)) { boundary = j; break; }
    if (!COMMENT_LINE.test(t)) lastCode = t;
  }
  let end = boundary - 1;
  while (end > L && (!lines[end].trim() || COMMENT_LINE.test(lines[end]))) end--;
  return end;
}

/**
 * @param {string} text file contents
 * @returns {Array<{name:string, kind:"fn"|"const"|"class", exported:boolean, start:number, end:number, declLine:number}>}
 *   1-based inclusive ranges; `start` includes directly-adjacent leading comments.
 */
export function extractSymbols(text) {
  const src = text.replace(/\r\n/g, "\n");
  const clean = scanCleanLines(src);
  const lines = src.split("\n");
  while (lines.length && lines[lines.length - 1] === "") lines.pop();

  const symbols = [];
  for (let L = 0; L < lines.length; L++) {
    if (!clean[L]) continue;
    const m = lines[L].match(DECL);
    if (!m) continue;

    const name = m[1] || m[3];
    const kind = m[1] ? "fn" : m[2] === "class" ? "class" : "const";
    const end = findEnd(lines, clean, L);

    let start = L;
    while (start > 0 && COMMENT_LINE.test(lines[start - 1])) start--;

    symbols.push({
      name,
      kind,
      exported: /^export\b/.test(lines[L]),
      start: start + 1,
      end: end + 1,
      declLine: L + 1
    });
  }
  return symbols;
}

/** Innermost top-level symbol containing a 1-based line, or null. */
export function findEnclosing(symbols, line) {
  return symbols.find((s) => line >= s.start && line <= s.end) || null;
}
