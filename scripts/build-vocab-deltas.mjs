/**
 * Génère data/delta/*.json : mots exclusifs par palier (clé en+fr trim),
 * à partir des jeux cumulatifs data/A1.json … C2.json (inchangés).
 *
 * Usage : node scripts/build-vocab-deltas.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
const outDir = path.join(dataDir, 'delta');

const CHAIN = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function pairKey(entry) {
  const en = String(entry?.en ?? '').trim();
  const fr = String(entry?.fr ?? '').trim();
  return `${en}\u0000${fr}`;
}

function readList(name) {
  const p = path.join(dataDir, `${name}.json`);
  const raw = fs.readFileSync(p, 'utf8');
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr)) throw new Error(`${name}.json doit être un tableau`);
  return arr;
}

function exclusiveDelta(prevEntries, currEntries) {
  const prevKeys = new Set(prevEntries.map(pairKey));
  return currEntries.filter((e) => !prevKeys.has(pairKey(e)));
}

fs.mkdirSync(outDir, { recursive: true });

let prev = readList(CHAIN[0]);
fs.writeFileSync(
  path.join(outDir, `${CHAIN[0]}.json`),
  JSON.stringify(prev, null, 4) + '\n',
  'utf8'
);

for (let i = 1; i < CHAIN.length; i++) {
  const label = CHAIN[i];
  const curr = readList(label);
  const delta = exclusiveDelta(prev, curr);
  fs.writeFileSync(
    path.join(outDir, `${label}.json`),
    JSON.stringify(delta, null, 4) + '\n',
    'utf8'
  );
  console.log(`${label}: ${delta.length} exclusifs (cumul ${label}: ${curr.length}, précédent: ${prev.length})`);
  prev = curr;
}

console.log(`Écrit dans ${path.relative(root, outDir)}/`);
