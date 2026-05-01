import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

function walkJsonFiles(dir, out = []) {
    for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, name.name);
        if (name.isDirectory()) walkJsonFiles(p, out);
        else if (name.name.endsWith('.json')) out.push(p);
    }
    return out;
}

function stripGuideDeep(v) {
    if (Array.isArray(v)) {
        for (const item of v) stripGuideDeep(item);
    } else if (v !== null && typeof v === 'object') {
        delete v.guide;
        for (const k of Object.keys(v)) stripGuideDeep(v[k]);
    }
}

const files = walkJsonFiles(DATA_DIR);
let changed = 0;
for (const f of files) {
    let data;
    try {
        data = JSON.parse(fs.readFileSync(f, 'utf8'));
    } catch (e) {
        console.error('Skip (parse error):', f, e.message);
        continue;
    }
    stripGuideDeep(data);
    fs.writeFileSync(f, JSON.stringify(data, null, 4) + '\n', 'utf8');
    changed++;
    console.log('OK', path.relative(path.join(__dirname, '..'), f));
}
console.log('Done:', changed, 'files');
