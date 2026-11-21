/**
 * src/mcq/custom_store.js
 * IndexedDB persistence for user-uploaded custom MCQ sets (.json and .zip).
 */

import { parseZipArchive } from "./zip_reader.js";

const DB_NAME = "bsme_mcq_custom_v1";
const STORE_NAME = "sets";

const MIME_BY_EXT = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml"
};

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function bytesToDataUrl(bytes, filename) {
  const ext = filename.split(".").pop()?.toLowerCase() || "png";
  const mime = MIME_BY_EXT[ext] || "application/octet-stream";
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:${mime};base64,${btoa(bin)}`;
}

function normalizeParsedSet(parsed, fallbackName, imageResolver = null) {
  const rawList = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.questions) ? parsed.questions : []);
  const questions = rawList
    .map((item, idx) => {
      const rawImg = typeof item.image === "string" ? item.image : item.image?.src;
      const resolvedImg = rawImg && imageResolver ? imageResolver(rawImg) : rawImg;
      return {
        id: item.id ?? (idx + 1),
        q: item.q || item.question || "",
        image: resolvedImg || null,
        imageAlt: item.image?.alt || item.imageAlt || "",
        options: Array.isArray(item.options) ? item.options.map(String) : [],
        answer: String(item.answer || item.correctAnswer || "A").trim(),
        ...(Array.isArray(item.shuffle) ? { shuffle: item.shuffle } : {})
      };
    })
    .filter(q => q.q && q.options.length >= 2);

  if (questions.length === 0) {
    throw new Error("No valid questions found in uploaded file.");
  }

  const title = parsed?.title || parsed?.setName || fallbackName.replace(/\.(json|zip)$/i, "");
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return {
    id: `custom_${slug || Date.now()}`,
    title,
    subject: "Custom (Local)",
    category: null,
    isCustom: true,
    count: questions.length,
    questions
  };
}

export async function listCustomManifests() {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      const rows = req.result || [];
      resolve(rows.map(({ id, title, subject, category, count, isCustom }) => ({
        id, title, subject, category, count, isCustom: !!isCustom
      })));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function loadCustomSet(id) {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCustomSet(id) {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveCustomSetFromFile(file) {
  const lower = file.name.toLowerCase();
  let setObj;

  if (lower.endsWith(".json")) {
    const parsed = JSON.parse(await file.text());
    setObj = normalizeParsedSet(parsed, file.name);
  } else if (lower.endsWith(".zip")) {
    const files = await parseZipArchive(await file.arrayBuffer());
    const jsonEntry = Array.from(files.entries()).find(([p]) => p.toLowerCase().endsWith(".json"));
    if (!jsonEntry) throw new Error("ZIP archive does not contain a .json file.");

    const [jsonPath, jsonBytes] = jsonEntry;
    const jsonDir = jsonPath.includes("/") ? jsonPath.slice(0, jsonPath.lastIndexOf("/") + 1) : "";
    const parsed = JSON.parse(new TextDecoder("utf-8").decode(jsonBytes));

    const dataUrlCache = new Map();
    const resolveAsset = (imgPath) => {
      if (!imgPath || /^(https?:|data:image\/)/i.test(imgPath)) return imgPath;
      const clean = imgPath.replace(/^\.\//, "");
      const candidates = [jsonDir + clean, clean];
      let matched = candidates.find(c => files.has(c));
      if (!matched) {
        const base = clean.split("/").pop();
        matched = Array.from(files.keys()).find(k => k.split("/").pop() === base);
      }
      if (!matched) return imgPath;
      if (!dataUrlCache.has(matched)) {
        dataUrlCache.set(matched, bytesToDataUrl(files.get(matched), matched));
      }
      return dataUrlCache.get(matched);
    };

    setObj = normalizeParsedSet(parsed, file.name, resolveAsset);
  } else {
    throw new Error("Please select a .json or .zip file.");
  }

  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(setObj);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return setObj;
}
