/**
 * test/mcq_test.js
 * Invariant & integration tests for MCQ mode, ZIP unpacking, image paths, and adaptive grid.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import { deflateRawSync } from "node:zlib";
import { MCQ_MANIFEST, loadMcqSet } from "../src/mcq/index.js";
import { buildSessionItems, classifyOptionsGrid } from "../src/mcq/engine.js";
import { parseZipArchive } from "../src/mcq/zip_reader.js";

function buildTestZip(entries) {
  const localParts = [];
  const cdParts = [];
  let offset = 0;

  for (const { name, data, compress } of entries) {
    const nameBuf = Buffer.from(name, "utf8");
    const rawBuf = Buffer.from(data);
    const compBuf = compress ? deflateRawSync(rawBuf) : rawBuf;
    const method = compress ? 8 : 0;

    const lfh = Buffer.alloc(30);
    lfh.writeUInt32LE(0x04034b50, 0);
    lfh.writeUInt16LE(20, 4);
    lfh.writeUInt16LE(method, 8);
    lfh.writeUInt32LE(compBuf.length, 18);
    lfh.writeUInt32LE(rawBuf.length, 22);
    lfh.writeUInt16LE(nameBuf.length, 26);

    localParts.push(lfh, nameBuf, compBuf);

    const cdh = Buffer.alloc(46);
    cdh.writeUInt32LE(0x02014b50, 0);
    cdh.writeUInt16LE(20, 4);
    cdh.writeUInt16LE(20, 6);
    cdh.writeUInt16LE(method, 10);
    cdh.writeUInt32LE(compBuf.length, 20);
    cdh.writeUInt32LE(rawBuf.length, 24);
    cdh.writeUInt16LE(nameBuf.length, 28);
    cdh.writeUInt32LE(offset, 42);

    cdParts.push(cdh, nameBuf);
    offset += lfh.length + nameBuf.length + compBuf.length;
  }

  const cdBuf = Buffer.concat(cdParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);

  const full = Buffer.concat([...localParts, cdBuf, eocd]);
  return full.buffer.slice(full.byteOffset, full.byteOffset + full.byteLength);
}

export async function runMcqTests() {
  for (const meta of MCQ_MANIFEST) {
    const setObj = await loadMcqSet(meta.id);
    assert.ok(setObj && Array.isArray(setObj.questions), `Set ${meta.id} failed to load`);
    for (const q of setObj.questions) {
      assert.ok(q.q && Array.isArray(q.options) && q.options.length >= 2, `Invalid question in ${meta.id}`);
      const rawImg = typeof q.image === "string" ? q.image : q.image?.src;
      if (rawImg && !/^(https?:|data:image\/)/i.test(rawImg)) {
        const imgUrl = new URL(rawImg.replace(/^\.\//, ""), setObj.baseUrl);
        assert.ok(fs.existsSync(imgUrl), `Missing image asset ${imgUrl.href} in ${meta.id}`);
      }
    }
  }

  const sample = buildSessionItems([
    {
      setId: "test",
      setTitle: "Test",
      baseUrl: null,
      seen: 0,
      mastery: 0,
      item: {
        id: 1,
        q: "Locked order?",
        options: ["First", "Second", "A and B", "None"],
        answer: "C",
        referential: true
      }
    },
    {
      setId: "test",
      setTitle: "Test",
      baseUrl: null,
      seen: 0,
      mastery: 0,
      item: {
        id: 2,
        q: "6-option pool",
        options: ["Correct", "D1", "D2", "D3", "D4", "D5"],
        answer: "A"
      }
    }
  ]);

  assert.deepEqual(sample[0].options, ["First", "Second", "A and B", "None"]);
  assert.equal(sample[0].answer, "C");
  assert.equal(sample[1].options.length, 4);
  assert.ok(sample[1].options.includes("Correct"));

  assert.equal(classifyOptionsGrid(["$5°\\text{C}$", "$10°\\text{C}$", "$17°\\text{C}$", "$20°\\text{C}$"]), "cols-4");
  assert.equal(classifyOptionsGrid(["Sensible heating", "Sensible cooling", "Adiabatic saturation", "Chemical dehumidifying"]), "cols-2");
  assert.equal(classifyOptionsGrid(["A very long engineering sentence explaining the thermodynamic process in full detail.", "B", "C", "D"]), "cols-1");

  const zipAb = buildTestZip([
    { name: "set.json", data: JSON.stringify({ title: "Zip Test", questions: [] }), compress: true },
    { name: "assets/fig1.png", data: new Uint8Array([137, 80, 78, 71]), compress: false }
  ]);
  const unpacked = await parseZipArchive(zipAb);
  assert.ok(unpacked.has("set.json"));
  assert.ok(unpacked.has("assets/fig1.png"));
  assert.deepEqual(JSON.parse(new TextDecoder().decode(unpacked.get("set.json"))).title, "Zip Test");
}
