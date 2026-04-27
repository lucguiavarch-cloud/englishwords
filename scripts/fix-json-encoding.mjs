/**
 * Corrige le mojibake UTF-8 mal lu en Latin-1 dans les listes de mots (champ `fr`),
 * puis applique des corrections manuelles pour les séquences UTF-8 incomplètes (œ, à, etc.).
 *
 * Usage :
 *   node scripts/fix-json-encoding.mjs
 *      → traite tous les fichiers A1/A2/B1/B2/C1/C2.json dans data/
 *
 *   node scripts/fix-json-encoding.mjs B1 B2 C1
 *      → traite uniquement data/B1.json, data/B2.json, data/C1.json
 *      (avec ou sans extension .json)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');

function fixMojibake(s) {
  if (typeof s !== 'string') return s;
  try {
    return Buffer.from(s, 'latin1').toString('utf8');
  } catch {
    return s;
  }
}

/** Cas où un caractère ou œ tronqué ne peut pas être récupéré par fixMojibake (identique pour toutes les listes). */
const manualByEn = {
  at: 'à',
  egg: 'œuf',
  eye: 'œil',
  sister: 'sœur',
  heart: 'cœur',
  there: 'là',
  to: 'à',
  until: "jusqu'à",
  till: "jusqu'à",
  already: 'déjà',
};

function resolveFiles(argv) {
  if (argv.length === 0) {
    return readdirSync(dataDir)
      .filter((f) => /^[ABC][12]\.json$/i.test(f))
      .sort();
  }
  return argv.map((arg) => {
    const base = arg.endsWith('.json') ? arg : `${arg}.json`;
    return base;
  });
}

function processFile(filename) {
  const path = join(dataDir, filename);
  if (!existsSync(path)) {
    console.warn('Ignoré (introuvable):', path);
    return;
  }

  const raw = readFileSync(path, 'utf8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    console.warn('Ignoré (JSON non tabulaire):', path);
    return;
  }

  let nMojibake = 0;
  for (const item of data) {
    if (typeof item?.fr === 'string' && /Ã|Â/.test(item.fr)) {
      item.fr = fixMojibake(item.fr);
      nMojibake++;
    }
  }

  for (const item of data) {
    const en = item?.en;
    if (typeof en === 'string' && manualByEn[en] !== undefined) {
      item.fr = manualByEn[en];
    }
  }

  writeFileSync(path, JSON.stringify(data, null, 4) + '\n', 'utf8');
  console.log('OK', filename, `(${data.length} entrées, ${nMojibake} champs fr avec Ã/Â corrigés par recodage)`);
}

const files = resolveFiles(process.argv.slice(2));
if (files.length === 0) {
  console.log('Aucun fichier à traiter (data/ vide ou pas de A1…C2).');
  process.exit(0);
}

for (const f of files) {
  try {
    processFile(f);
  } catch (e) {
    console.error('Erreur', f, e.message);
    process.exitCode = 1;
  }
}
