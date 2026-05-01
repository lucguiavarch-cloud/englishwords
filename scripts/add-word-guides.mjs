/**
 * Ajoute le champ optionnel "guide" aux entrées A1–C2 quand le français est ambigu
 * (plusieurs traductions anglaises pour le même libellé FR dans les listes).
 * Exécution : node scripts/add-word-guides.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { EXPLICIT } from "./explicit-guides-fr-only.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
const FILES = ["A1", "A2", "B1", "B2", "C1", "C2"];

function genericGuide(frDisplay, set) {
    const n = set.size;
    const lens = [...set].map((s) => s.length);
    const spread = Math.max(...lens) - Math.min(...lens);
    let tail = "";
    if (spread >= 3) tail = " Les réponses anglaises attendues n’ont pas toutes la même longueur.";
    return `Plusieurs traductions (${n}) existent pour « ${frDisplay} » dans l’appli.${tail} Réfléchis au contexte (nom, verbe, adjectif…). Ce rappel ne donne pas le mot anglais ; l’indice 💡 est là seulement si tu en as besoin.`;
}

function main() {
    const allRows = [];
    for (const f of FILES) {
        const arr = JSON.parse(fs.readFileSync(path.join(dataDir, `${f}.json`), "utf8"));
        for (const o of arr) {
            allRows.push({
                _en: o.en.trim().toLowerCase(),
                _fr: o.fr.trim().toLowerCase(),
            });
        }
    }
    const byFr = new Map();
    for (const o of allRows) {
        if (!byFr.has(o._fr)) byFr.set(o._fr, new Set());
        byFr.get(o._fr).add(o._en);
    }

    for (const f of FILES) {
        const p = path.join(dataDir, `${f}.json`);
        const arr = JSON.parse(fs.readFileSync(p, "utf8"));
        for (const o of arr) {
            const fr = o.fr.trim().toLowerCase();
            const en = o.en.trim().toLowerCase();
            const key = `${en}|${fr}`;
            const set = byFr.get(fr);
            let g = EXPLICIT[key] || null;
            if (!g && set && set.size > 1) g = genericGuide(o.fr.trim(), set);
            if (g) o.guide = g;
            else delete o.guide;
        }
        fs.writeFileSync(p, JSON.stringify(arr, null, 4) + "\n");
    }
    console.log("Guides appliqués sur", FILES.join(", "));
}

main();
