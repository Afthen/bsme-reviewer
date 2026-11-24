/**
 * scripts/lib/ctx_cache.js
 * Metadata-only ledger of source lines and computed outputs delivered to a model.
 * Source text is never written to the ledger.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const CACHE_RELATIVE = path.join("tmp", "ctx_cache.txt");
const HEADER = "# ctx-cache-v1";
const MAX_LINE_RECORDS = 20000;
const MAX_OUTPUT_RECORDS = 256;

export function hashText(text) {
  return crypto.createHash("sha256").update(String(text), "utf8").digest("hex");
}

function lineKey(rel, line) {
  return `${rel}\0${line}`;
}

function trimOldest(map, limit) {
  if (map.size <= limit) return;
  const rows = [...map.entries()].sort((a, b) => a[1].seq - b[1].seq);
  for (const [key] of rows.slice(0, map.size - limit)) map.delete(key);
}

export function loadContextCache(root = process.cwd()) {
  const file = path.resolve(root, CACHE_RELATIVE);
  const cache = {
    file,
    nextSeq: 1,
    lines: new Map(),
    outputs: new Map(),
    dirty: false
  };

  if (!fs.existsSync(file)) return cache;

  const rows = fs.readFileSync(file, "utf8").split(/\r?\n/);
  if (rows[0] !== HEADER) return cache;

  for (const row of rows.slice(1)) {
    if (!row) continue;
    const fields = row.split("\t");

    try {
      if (fields[0] === "L" && fields.length === 7) {
        const seq = Number(fields[1]);
        const rel = Buffer.from(fields[2], "base64url").toString("utf8");
        const line = Number(fields[3]);
        const contentHash = fields[4];
        const complete = fields[5] === "1";
        const displayHash = fields[6];

        if (!Number.isSafeInteger(seq) || seq < 1 ||
            !Number.isSafeInteger(line) || line < 1 ||
            !rel || !/^[a-f0-9]{64}$/.test(contentHash) ||
            !/^[a-f0-9]{64}$/.test(displayHash)) continue;

        cache.lines.set(lineKey(rel, line), {
          seq, rel, line, contentHash, complete, displayHash
        });
        cache.nextSeq = Math.max(cache.nextSeq, seq + 1);
      } else if (fields[0] === "O" && fields.length === 3) {
        const seq = Number(fields[1]);
        const outputHash = fields[2];

        if (!Number.isSafeInteger(seq) || seq < 1 ||
            !/^[a-f0-9]{64}$/.test(outputHash)) continue;

        cache.outputs.set(outputHash, { seq, outputHash });
        cache.nextSeq = Math.max(cache.nextSeq, seq + 1);
      }
    } catch {
      // Ignore malformed rows; valid rows remain usable.
    }
  }

  trimOldest(cache.lines, MAX_LINE_RECORDS);
  trimOldest(cache.outputs, MAX_OUTPUT_RECORDS);
  return cache;
}

export function allocateCacheSequence(cache) {
  const seq = cache.nextSeq++;
  cache.dirty = true;
  return seq;
}

/**
 * A complete READ satisfies later READs and GREP excerpts.
 * A partial GREP excerpt only satisfies the same displayed excerpt; it must
 * never suppress a later complete READ of that line.
 */
export function findLineDelivery(cache, ref) {
  const rel = String(ref.rel).replace(/\\/g, "/");
  const previous = cache.lines.get(lineKey(rel, ref.line));
  if (!previous || previous.contentHash !== hashText(ref.raw)) return null;
  if (previous.complete) return previous;

  if (!ref.complete && previous.displayHash === hashText(ref.display)) {
    return previous;
  }
  return null;
}

export function recordLineDelivery(cache, ref, seq) {
  const rel = String(ref.rel).replace(/\\/g, "/");
  cache.lines.set(lineKey(rel, ref.line), {
    seq,
    rel,
    line: ref.line,
    contentHash: hashText(ref.raw),
    complete: Boolean(ref.complete),
    displayHash: hashText(ref.display)
  });
  cache.dirty = true;
  trimOldest(cache.lines, MAX_LINE_RECORDS);
}

export function findOutputDelivery(cache, outputHash) {
  return cache.outputs.get(outputHash) || null;
}

export function recordOutputDelivery(cache, outputHash, seq) {
  cache.outputs.set(outputHash, { seq, outputHash });
  cache.dirty = true;
  trimOldest(cache.outputs, MAX_OUTPUT_RECORDS);
}

export function saveContextCache(cache) {
  if (!cache.dirty) return;

  const rows = [HEADER];
  const lineRows = [...cache.lines.values()].sort((a, b) => a.seq - b.seq);
  const outputRows = [...cache.outputs.values()].sort((a, b) => a.seq - b.seq);

  for (const item of lineRows) {
    const encodedPath = Buffer.from(item.rel, "utf8").toString("base64url");
    rows.push([
      "L",
      item.seq,
      encodedPath,
      item.line,
      item.contentHash,
      item.complete ? "1" : "0",
      item.displayHash
    ].join("\t"));
  }

  for (const item of outputRows) {
    rows.push(["O", item.seq, item.outputHash].join("\t"));
  }

  fs.mkdirSync(path.dirname(cache.file), { recursive: true });
  const temp = `${cache.file}.tmp-${process.pid}`;
  fs.writeFileSync(temp, `${rows.join("\n")}\n`, "utf8");
  fs.renameSync(temp, cache.file);
  cache.dirty = false;
}

export function resetContextCache(root = process.cwd()) {
  const dir = path.resolve(root, "tmp");
  const file = path.join(dir, "ctx_cache.txt");

  if (fs.existsSync(file)) fs.rmSync(file, { force: true });
  if (!fs.existsSync(dir)) return;

  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith("ctx_cache.txt.tmp-")) {
      fs.rmSync(path.join(dir, name), { force: true });
    }
  }
}
