/**
 * scripts/lib/patch_parse.js
 * Strict parser for FILE:, diff, subst, and full-file patch blocks.
 * Enforces N+1 backtick fence matching (R27) and unambiguous hunk markers.
 */

function parseSubstArgs(tokens, openLine) {
  let scope = null;
  let expect = null;

  for (const tok of tokens) {
    const eq = tok.indexOf("=");
    if (eq === -1) {
      if (scope === null) {
        scope = tok;
      } else {
        throw new Error(`Unexpected argument "${tok}" in subst header at line ${openLine}`);
      }
      continue;
    }

    const key = tok.slice(0, eq);
    const val = tok.slice(eq + 1);
    if (key === "scope") {
      if (scope !== null) throw new Error(`Duplicate scope in subst header at line ${openLine}`);
      scope = val;
    } else if (key === "expect") {
      if (expect !== null) throw new Error(`Duplicate expect in subst header at line ${openLine}`);
      if (!/^[1-9]\d*$/.test(val)) {
        throw new Error(`Invalid expect="${val}" in subst header at line ${openLine}; expected positive integer`);
      }
      expect = Number(val);
    } else {
      throw new Error(`Unknown subst argument "${key}" at line ${openLine}`);
    }
  }

  if (!scope) throw new Error(`subst block at line ${openLine} is missing scope=<file|dir>`);
  if (expect === null) throw new Error(`subst block at line ${openLine} is missing expect=N`);
  return { scope, expect };
}

export function parseHunks(content, openLine = 1) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const hunks = [];
  let state = "idle";
  let markerLen = 4;
  let search = [];
  let replace = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNo = openLine + i + 1;

    if (state === "idle") {
      if (trimmed === "") continue;
      const m = trimmed.match(/^(<{4,})$/);
      if (!m) {
        throw new Error(`Unexpected text outside hunk markers at line ${lineNo}: ${trimmed.slice(0, 60)}`);
      }
      markerLen = m[1].length;
      state = "search";
      search = [];
      replace = [];
    } else if (state === "search") {
      if (trimmed === "=".repeat(markerLen)) {
        state = "replace";
      } else {
        search.push(line);
      }
    } else if (state === "replace") {
      if (trimmed === ">".repeat(markerLen)) {
        const searchStr = search.join("\n");
        if (!searchStr) {
          throw new Error(`Empty search block in hunk ending at line ${lineNo}`);
        }
        hunks.push({ search: searchStr, replace: replace.join("\n") });
        state = "idle";
      } else {
        replace.push(line);
      }
    }
  }

  if (state !== "idle") {
    throw new Error(`Incomplete hunk (missing closing ${">".repeat(markerLen)}) in block at line ${openLine}`);
  }
  return hunks;
}

export function parsePatch(raw) {
  if (typeof raw !== "string") throw new Error("Patch input must be a string");
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  const operations = [];

  let stickyFile = null;
  let freshFile = false;
  let inFence = false;
  let openFenceLen = 0;
  let openInfo = "";
  let openLine = 0;
  let fenceBuf = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    if (!inFence) {
      const trimmed = line.trim();
      if (trimmed.startsWith("FILE:")) {
        const fm = trimmed.match(/^FILE:\s*`?([^\s`]+)`?\s*$/);
        if (!fm) throw new Error(`Malformed FILE: header at line ${lineNo}: ${trimmed}`);
        if (freshFile) {
          throw new Error(`FILE: "${stickyFile}" has no following block before FILE: "${fm[1]}" at line ${lineNo}`);
        }
        stickyFile = fm[1];
        freshFile = true;
        continue;
      }

      const openMatch = line.match(/^(`{3,})(.*)$/);
      if (openMatch) {
        inFence = true;
        openFenceLen = openMatch[1].length;
        openInfo = openMatch[2].trim();
        openLine = lineNo;
        fenceBuf = [];
      }
    } else {
      const closeMatch = line.match(/^(`{3,})\s*$/);
      if (closeMatch && closeMatch[1].length >= openFenceLen) {
        inFence = false;
        const content = fenceBuf.join("\n");
        const tokens = openInfo ? openInfo.split(/\s+/) : [];
        const kind = tokens[0] || "";

        if (kind === "subst") {
          if (freshFile) {
            throw new Error(`FILE: "${stickyFile}" has no following block before subst at line ${openLine}`);
          }
          const { scope, expect } = parseSubstArgs(tokens.slice(1), openLine);
          const hunks = parseHunks(content, openLine);
          if (hunks.length !== 1) {
            throw new Error(`subst block at line ${openLine} must contain exactly 1 hunk (found ${hunks.length})`);
          }
          operations.push({ type: "subst", scope, expect, hunk: hunks[0], line: openLine });
          stickyFile = null;
          freshFile = false;
        } else if (kind === "diff") {
          if (!stickyFile) {
            throw new Error(`diff block at line ${openLine} is missing a FILE: header`);
          }
          const hunks = parseHunks(content, openLine);
          if (hunks.length === 0) {
            throw new Error(`diff block at line ${openLine} for "${stickyFile}" contains no hunks`);
          }
          operations.push({ type: "diff", file: stickyFile, hunks, line: openLine });
          freshFile = false;
        } else {
          if (!freshFile || !stickyFile) {
            throw new Error(`Code block at line ${openLine} requires an immediately preceding FILE: header`);
          }
          operations.push({ type: "file", file: stickyFile, content, line: openLine });
          stickyFile = null;
          freshFile = false;
        }
        fenceBuf = [];
      } else {
        fenceBuf.push(line);
      }
    }
  }

  if (inFence) {
    throw new Error(`Unclosed code fence opened at line ${openLine}`);
  }
  if (freshFile) {
    throw new Error(`FILE: "${stickyFile}" has no following code or diff block`);
  }
  if (operations.length === 0) {
    throw new Error("No code or patch blocks found in patch input");
  }

  return operations;
}
