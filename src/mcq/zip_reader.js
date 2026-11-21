/**
 * src/mcq/zip_reader.js
 * Pure-JS, zero-dependency ZIP archive reader using native DecompressionStream.
 * Supports Store (method 0) and Deflate (method 8).
 */

const EOCD_SIG = 0x06054b50;
const CD_SIG = 0x02014b50;
const LFH_SIG = 0x04034b50;

function findEocdOffset(view) {
  const minOffset = Math.max(0, view.byteLength - 65557);
  for (let i = view.byteLength - 22; i >= minOffset; i--) {
    if (view.getUint32(i, true) === EOCD_SIG) return i;
  }
  return -1;
}

async function inflateRaw(bytes) {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser does not support native ZIP decompression.");
  }
  const ds = new DecompressionStream("deflate-raw");
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const ab = await new Response(ds.readable).arrayBuffer();
  return new Uint8Array(ab);
}

/**
 * Unpacks a ZIP ArrayBuffer into a Map<normalizedPath, Uint8Array>.
 */
export async function parseZipArchive(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const bytes = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder("utf-8");

  const eocdOffset = findEocdOffset(view);
  if (eocdOffset < 0) throw new Error("Invalid ZIP file (EOCD not found).");

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  let cdOffset = view.getUint32(eocdOffset + 16, true);
  const files = new Map();

  for (let i = 0; i < totalEntries; i++) {
    if (view.getUint32(cdOffset, true) !== CD_SIG) {
      throw new Error("Corrupt ZIP central directory.");
    }

    const method = view.getUint16(cdOffset + 10, true);
    const compSize = view.getUint32(cdOffset + 20, true);
    const nameLen = view.getUint16(cdOffset + 28, true);
    const extraLen = view.getUint16(cdOffset + 30, true);
    const commentLen = view.getUint16(cdOffset + 32, true);
    const localHeaderOffset = view.getUint32(cdOffset + 42, true);

    const rawName = decoder.decode(bytes.subarray(cdOffset + 46, cdOffset + 46 + nameLen));
    const cleanName = rawName.replace(/\\/g, "/").replace(/^\.\//, "");
    cdOffset += 46 + nameLen + extraLen + commentLen;

    if (cleanName.endsWith("/") || cleanName.startsWith("__MACOSX/")) continue;

    if (view.getUint32(localHeaderOffset, true) !== LFH_SIG) {
      throw new Error(`Corrupt local file header for ${cleanName}`);
    }
    const lfNameLen = view.getUint16(localHeaderOffset + 26, true);
    const lfExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + lfNameLen + lfExtraLen;
    const compressed = bytes.subarray(dataStart, dataStart + compSize);

    let content;
    if (method === 0) {
      content = compressed.slice();
    } else if (method === 8) {
      content = await inflateRaw(compressed);
    } else {
      throw new Error(`Unsupported ZIP compression method (${method}) in ${cleanName}`);
    }

    files.set(cleanName, content);
  }

  return files;
}
