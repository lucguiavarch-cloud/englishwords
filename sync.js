/* =========================================================
   SYNCHRO CLOUD OPTIONNELLE (Supabase)
   ---------------------------------------------------------
   - localStorage reste la source locale (et le fallback hors-ligne).
   - Le cloud (table `user_data`) sert de sauvegarde / synchro entre appareils.
   - Inactif tant que `config.js` (voir config.example.js) n'est pas renseigné.
   Chargement : <script src="sync.js" data-kinds="vocab_dict,vocab_stats"></script>
   `data-kinds` = données affichées par la page (rechargement si le cloud les modifie).
   Les pages appellent `window.EMSync.notifySaved()` après chaque save().
   ========================================================= */
(() => {
'use strict';

const SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js';
const SDK_SRI = 'sha384-TcHRA3zBbn+Lexh5n+Oil4guNPOS3rjNDpGRAN46u/s/mB2IZ50ceC6TYDU2yvgK';
const CONFIG_URL = 'config.js';
const TABLE = 'user_data';
const META_KEY = 'EM_SYNC_META_V1';
const RELOAD_KEY = 'EM_SYNC_RELOADS';
const PUSH_DEBOUNCE_MS = 8000;
const PUSH_MAX_WAIT_MS = 30000;
const RESUME_MIN_INTERVAL_MS = 60000;

const norm = (s) => String(s == null ? '' : s).trim().toLowerCase();

const KINDS = {
    vocab_dict:  { key: 'EM_ULTIMATE_TIME_V1',       type: 'dict',  identity: (w) => norm(w.en) + '|' + norm(w.fr) },
    vocab_stats: { key: 'EM_ULTIMATE_TIME_V1_STATS', type: 'stats' },
    verbs_dict:  { key: 'EM_VERBS_V17',              type: 'dict',  identity: (w) => norm(w.en) },
    verbs_stats: { key: 'EM_VERBS_V17_STATS',        type: 'stats' }
};

const scriptEl = document.currentScript;
const pageKinds = new Set(
    String((scriptEl && scriptEl.dataset.kinds) || '')
        .split(',').map((s) => s.trim()).filter((k) => KINDS[k])
);

/* ---------- helpers ---------- */
function stableStringify(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
    if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
    return '{' + Object.keys(v).sort()
        .filter((k) => v[k] !== undefined)
        .map((k) => JSON.stringify(k) + ':' + stableStringify(v[k])).join(',') + '}';
}

function hashString(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16);
}

const hashOf = (value) => hashString(stableStringify(value));

function readLocal(kind) {
    try {
        const raw = localStorage.getItem(KINDS[kind].key);
        if (raw == null || raw === '') return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function writeLocal(kind, value) {
    localStorage.setItem(KINDS[kind].key, JSON.stringify(value));
}

function loadMeta() {
    try {
        const m = JSON.parse(localStorage.getItem(META_KEY));
        if (m && typeof m === 'object' && m.kinds) return m;
    } catch (e) { /* ignore */ }
    return { userId: null, kinds: {}, lastSyncAt: null };
}

function saveMeta(m) {
    try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) { /* quota */ }
}

/* ---------- fusion ---------- */
const num = (x) => (typeof x === 'number' && isFinite(x) ? x : parseFloat(x) || 0);
const answers = (w) => num(w.successCount) + num(w.failCount) || num(w.responseCount);
const reviewTime = (w) => { const t = Date.parse(w.nextReview); return isNaN(t) ? 0 : t; };

/** Mot le plus avancé : niveau max, puis plus de réponses, puis prochaine révision la plus tardive. */
function pickWord(local, remote) {
    const dl = num(local.level) - num(remote.level);
    if (dl !== 0) return dl > 0 ? local : remote;
    const da = answers(local) - answers(remote);
    if (da !== 0) return da > 0 ? local : remote;
    return reviewTime(remote) > reviewTime(local) ? remote : local;
}

/** Union des deux listes (ordre local d'abord), en gardant pour chaque mot la version la plus avancée. */
function mergeDict(local, remote, identity) {
    if (!Array.isArray(remote)) return Array.isArray(local) ? local : [];
    if (!Array.isArray(local)) return remote;
    const keyOf = (w) => (w && typeof w === 'object' && w.en != null ? identity(w) : '#' + stableStringify(w));
    const byKey = new Map();
    const order = [];
    const add = (w, fromRemote) => {
        const k = keyOf(w);
        if (!byKey.has(k)) { byKey.set(k, w); order.push(k); return; }
        const cur = byKey.get(k);
        if (cur && typeof cur === 'object' && w && typeof w === 'object') {
            byKey.set(k, fromRemote ? pickWord(cur, w) : pickWord(w, cur));
        }
    };
    local.forEach((w) => add(w, false));
    remote.forEach((w) => add(w, true));
    return order.map((k) => byKey.get(k));
}

/** Stats : jamais synchronisé sur cet appareil -> le cloud gagne ; sinon (niveau joueur, XP) max, égalité -> local. */
function resolveStats(local, remote, neverSynced) {
    if (!remote || typeof remote !== 'object') return local;
    if (!local || typeof local !== 'object' || neverSynced) return remote;
    const dl = num(local.playerLevel) - num(remote.playerLevel);
    if (dl !== 0) return dl > 0 ? local : remote;
    return num(remote.xp) > num(local.xp) ? remote : local;
}

function resolveConflict(kind, local, remote, neverSynced) {
    const def = KINDS[kind];
    if (def.type === 'dict') return mergeDict(local, remote, def.identity);
    return resolveStats(local, remote, neverSynced);
}

/* ---------- état ---------- */
let client = null;
let session = null;
let status = 'disabled';      // disabled | signed-out | syncing | synced | pending | offline | error
let statusDetail = '';
let syncChain = Promise.resolve();
let syncQueued = false;
let pushTimer = null;
let firstDirtyAt = 0;
let lastSyncAttempt = 0;
const listeners = new Set();
const ui = {};

function setStatus(s, detail) {
    status = s;
    statusDetail = detail || '';
    renderUI();
    listeners.forEach((fn) => { try { fn(status, statusDetail); } catch (e) { /* ignore */ } });
}

function isDirty() {
    const meta = loadMeta();
    return Object.keys(KINDS).some((kind) => {
        const v = readLocal(kind);
        return v != null && (!meta.kinds[kind] || meta.kinds[kind].hash !== hashOf(v));
    });
}

/* ---------- cœur de la synchro ---------- */
function syncNow() {
    if (!client || !session) return Promise.resolve(false);
    if (syncQueued) return syncChain;
    syncQueued = true;
    syncChain = syncChain.then(() => {
        syncQueued = false;
        return doSync();
    });
    return syncChain;
}

async function doSync() {
    if (!client || !session) return false;
    clearTimeout(pushTimer);
    pushTimer = null;
    firstDirtyAt = 0;
    lastSyncAttempt = Date.now();

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setStatus('offline');
        return false;
    }
    setStatus('syncing');
    const userId = session.user.id;
    let meta = loadMeta();
    if (meta.userId !== userId) meta = { userId, kinds: {}, lastSyncAt: null };

    try {
        const { data: heads, error: headErr } = await client
            .from(TABLE).select('kind,updated_at').eq('user_id', userId);
        if (headErr) throw headErr;
        const remoteAt = {};
        (heads || []).forEach((r) => { remoteAt[r.kind] = r.updated_at; });

        const toFetch = Object.keys(KINDS).filter((k) => remoteAt[k] && (!meta.kinds[k] || meta.kinds[k].syncedAt !== remoteAt[k]));
        const remotePayload = {};
        if (toFetch.length) {
            const { data: rows, error: rowsErr } = await client
                .from(TABLE).select('kind,payload,updated_at').eq('user_id', userId).in('kind', toFetch);
            if (rowsErr) throw rowsErr;
            (rows || []).forEach((r) => { remotePayload[r.kind] = r; });
        }

        const upserts = [];
        const changedLocally = [];
        Object.keys(KINDS).forEach((kind) => {
            const m = meta.kinds[kind] || null;
            const local = readLocal(kind);
            const localHash = local == null ? null : hashOf(local);
            const localChanged = local != null && (!m || m.hash !== localHash);
            const remote = remotePayload[kind];

            if (!remote) {
                if (local != null && (localChanged || !remoteAt[kind])) upserts.push({ kind, payload: local, hash: localHash });
                return;
            }
            const remoteHash = hashOf(remote.payload);
            if (local == null || !localChanged || localHash === remoteHash) {
                if (localHash !== remoteHash) { writeLocal(kind, remote.payload); changedLocally.push(kind); }
                meta.kinds[kind] = { hash: remoteHash, syncedAt: remote.updated_at };
                return;
            }
            const merged = resolveConflict(kind, local, remote.payload, !m || !m.syncedAt);
            const mergedHash = hashOf(merged);
            if (mergedHash !== localHash) { writeLocal(kind, merged); changedLocally.push(kind); }
            if (mergedHash === remoteHash) {
                meta.kinds[kind] = { hash: remoteHash, syncedAt: remote.updated_at };
            } else {
                upserts.push({ kind, payload: merged, hash: mergedHash });
            }
        });

        if (upserts.length) {
            const { data: saved, error: upErr } = await client
                .from(TABLE)
                .upsert(upserts.map((u) => ({ user_id: userId, kind: u.kind, payload: u.payload })), { onConflict: 'user_id,kind' })
                .select('kind,updated_at');
            if (upErr) throw upErr;
            const at = {};
            (saved || []).forEach((r) => { at[r.kind] = r.updated_at; });
            upserts.forEach((u) => { meta.kinds[u.kind] = { hash: u.hash, syncedAt: at[u.kind] || null }; });
        }

        meta.lastSyncAt = new Date().toISOString();
        saveMeta(meta);

        if (changedLocally.some((k) => pageKinds.has(k)) && reloadAllowed()) {
            setStatus('syncing', 'Mise à jour depuis le cloud…');
            location.reload();
            return true;
        }
        setStatus(isDirty() ? 'pending' : 'synced');
        return true;
    } catch (err) {
        saveMeta(meta);
        const offline = (typeof navigator !== 'undefined' && navigator.onLine === false) ||
            /fetch|network/i.test(String(err && (err.message || err)));
        setStatus(offline ? 'offline' : 'error', err && err.message ? err.message : String(err));
        return false;
    }
}

function reloadAllowed() {
    try {
        const now = Date.now();
        const recent = (JSON.parse(sessionStorage.getItem(RELOAD_KEY)) || []).filter((t) => now - t < 60000);
        if (recent.length >= 3) return false;
        recent.push(now);
        sessionStorage.setItem(RELOAD_KEY, JSON.stringify(recent));
    } catch (e) { /* ignore */ }
    return true;
}

/** Appelé par les pages après chaque save() : push debouncé si connecté. */
function notifySaved() {
    if (!client || !session) return;
    const now = Date.now();
    if (!firstDirtyAt) firstDirtyAt = now;
    if (status === 'synced') setStatus('pending');
    clearTimeout(pushTimer);
    const wait = Math.max(0, Math.min(PUSH_DEBOUNCE_MS, firstDirtyAt + PUSH_MAX_WAIT_MS - now));
    pushTimer = setTimeout(syncNow, wait);
}

/* ---------- auth ---------- */
function redirectUrl() {
    return location.origin + location.pathname;
}

const AUTH_ERRORS_FR = [
    [/expired|invalid/i, 'code ou lien invalide ou expiré, redemande un e-mail'],
    [/rate limit|security purposes|too many/i, 'trop de demandes, patiente une minute avant de réessayer'],
    [/signups? not allowed|disabled/i, 'inscription désactivée dans Supabase (Authentication → Providers → Email)'],
    [/fetch|network/i, 'réseau indisponible']
];
function frError(e) {
    const m = String((e && e.message) || e || '');
    const hit = AUTH_ERRORS_FR.find(([re]) => re.test(m));
    return hit ? hit[1] : m;
}

const NO_CLIENT_MSG = 'service cloud injoignable (hors-ligne ?), réessaie plus tard';

async function sendMagicLink(email) {
    if (!client) throw new Error(NO_CLIENT_MSG);
    const { error } = await client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectUrl(), shouldCreateUser: true }
    });
    if (error) throw error;
}

async function verifyCode(email, token) {
    if (!client) throw new Error(NO_CLIENT_MSG);
    const { error } = await client.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw error;
}

async function signOut() {
    if (!client) return;
    if (session && isDirty()) await syncNow();
    await client.auth.signOut();
}

/* ---------- chargement ---------- */
function loadScript(src, attrs) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        Object.keys(attrs || {}).forEach((k) => s.setAttribute(k, attrs[k]));
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Chargement impossible : ' + src));
        document.head.appendChild(s);
    });
}

function getConfig() {
    const c = window.EM_SYNC_CONFIG;
    if (!c || !c.supabaseUrl || !c.supabaseAnonKey) return null;
    if (/VOTRE|YOUR|xxxx/i.test(c.supabaseUrl + c.supabaseAnonKey)) return null;
    return c;
}

async function init() {
    if (!getConfig()) {
        try { await loadScript(CONFIG_URL); } catch (e) { /* pas de config.js : synchro désactivée */ }
    }
    const cfg = getConfig();
    if (!cfg) { setStatus('disabled'); return; }

    setStatus('signed-out');
    try {
        if (!(window.supabase && window.supabase.createClient)) {
            await loadScript(SDK_URL, { integrity: SDK_SRI, crossorigin: 'anonymous' });
        }
        client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' }
        });
    } catch (e) {
        setStatus('offline', 'Bibliothèque Supabase indisponible (hors-ligne ?)');
        window.addEventListener('online', () => { if (!client) init(); }, { once: true });
        return;
    }

    client.auth.onAuthStateChange((event, newSession) => {
        const prevUser = session && session.user ? session.user.id : null;
        session = newSession;
        if (!session) { setStatus('signed-out'); return; }
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
            if (prevUser !== session.user.id) {
                if (ui.panel) closePanel();
                setTimeout(syncNow, 0);
            }
        } else {
            renderUI();
        }
    });

    window.addEventListener('online', () => { if (session) syncNow(); });
    window.addEventListener('offline', () => { if (session) setStatus('offline'); });
    document.addEventListener('visibilitychange', () => {
        if (!session) return;
        if (document.visibilityState === 'hidden') {
            if (pushTimer) syncNow();
        } else if (Date.now() - lastSyncAttempt > RESUME_MIN_INTERVAL_MS) {
            syncNow();
        }
    });
}

/* ---------- UI ---------- */
const STATUS_LABEL = {
    'disabled': '',
    'signed-out': 'Synchro cloud',
    'syncing': 'Synchro…',
    'synced': 'Synchronisé',
    'pending': 'En attente',
    'offline': 'Hors-ligne',
    'error': 'Erreur synchro'
};

function injectStyles() {
    if (document.getElementById('ems-styles')) return;
    const css = `
.ems-pill{pointer-events:auto!important;display:inline-flex!important;align-items:center;gap:6px;padding:6px 12px!important;margin:0!important;border-radius:20px!important;border:1px solid rgba(0,0,0,.12)!important;background:#fff!important;color:#2c3e50!important;font:600 12px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif!important;box-shadow:0 2px 6px rgba(0,0,0,.12)!important;cursor:pointer;width:auto!important;min-width:0!important;transform:none!important;opacity:1!important}
.ems-pill:hover{background:#f3f6fa!important}
.ems-dot{width:9px;height:9px;border-radius:50%;background:#95a5a6;flex:0 0 auto}
.ems-pill[data-status="synced"] .ems-dot{background:#2ecc71}
.ems-pill[data-status="syncing"] .ems-dot{background:#3498db;animation:ems-pulse 1s infinite}
.ems-pill[data-status="pending"] .ems-dot{background:#f39c12}
.ems-pill[data-status="offline"] .ems-dot{background:#7f8c8d}
.ems-pill[data-status="error"] .ems-dot{background:#e74c3c}
@keyframes ems-pulse{50%{opacity:.3}}
.ems-floating{position:fixed;right:12px;bottom:12px;z-index:9998}
.ems-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px}
.ems-panel{background:#fff;color:#2c3e50;width:100%;max-width:380px;border-radius:14px;padding:18px 18px 14px;box-shadow:0 10px 30px rgba(0,0,0,.3);font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:left;position:relative}
.ems-panel [hidden]{display:none!important}
.ems-panel h3{margin:0 0 8px;font-size:17px;color:#2c3e50}
.ems-panel p{margin:0 0 10px;color:#4a5a6a;font-size:13px}
.ems-panel label{display:block;font-size:12px;font-weight:600;margin:8px 0 4px;color:#2c3e50}
.ems-panel input.ems-input{display:block!important;width:100%!important;max-width:none!important;box-sizing:border-box!important;margin:0 0 10px!important;padding:10px 12px!important;font-size:15px!important;border:1px solid #cfd8e3!important;border-radius:8px!important;background:#fff!important;color:#2c3e50!important;text-align:left!important;box-shadow:none!important}
.ems-panel .ems-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
.ems-panel button.ems-btn{flex:1 1 auto;padding:10px 12px!important;margin:0!important;border:none!important;border-radius:8px!important;font-weight:700!important;font-size:13px!important;cursor:pointer;background:#4a90e2!important;color:#fff!important;box-shadow:none!important;width:auto!important}
.ems-panel button.ems-btn.ems-ghost{background:#eef2f7!important;color:#2c3e50!important}
.ems-panel button.ems-btn:disabled{opacity:.6;cursor:default}
.ems-panel button.ems-close{position:absolute;top:8px;right:8px;background:transparent!important;color:#7f8c8d!important;border:none!important;box-shadow:none!important;font-size:20px!important;line-height:1!important;padding:4px 8px!important;margin:0!important;cursor:pointer;width:auto!important}
.ems-msg{font-size:12px;margin:6px 0 0;min-height:16px}
.ems-msg.ems-err{color:#c0392b}
.ems-msg.ems-ok{color:#27ae60}
.ems-status-line{font-size:13px;margin:0 0 10px;padding:8px 10px;border-radius:8px;background:#f4f7fb}
`;
    const style = document.createElement('style');
    style.id = 'ems-styles';
    style.textContent = css;
    document.head.appendChild(style);
}

function el(tag, attrs, text) {
    const e = document.createElement(tag);
    Object.keys(attrs || {}).forEach((k) => {
        if (k === 'class') e.className = attrs[k];
        else e.setAttribute(k, attrs[k]);
    });
    if (text != null) e.textContent = text;
    return e;
}

function mountPill() {
    if (ui.pill || status === 'disabled') return;
    injectStyles();
    const pill = el('button', { type: 'button', class: 'ems-pill', id: 'ems-pill', 'aria-haspopup': 'dialog' });
    pill.appendChild(el('span', { class: 'ems-dot', 'aria-hidden': 'true' }));
    pill.appendChild(el('span', { 'aria-hidden': 'true' }, '☁️'));
    ui.pillLabel = el('span', { class: 'ems-label' });
    pill.appendChild(ui.pillLabel);
    pill.addEventListener('click', openPanel);
    const slot = document.getElementById('sync-slot');
    if (slot) slot.appendChild(pill);
    else { pill.classList.add('ems-floating'); document.body.appendChild(pill); }
    ui.pill = pill;
}

function formatTime(iso) {
    if (!iso) return 'jamais';
    const d = new Date(iso);
    const sameDay = d.toDateString() === new Date().toDateString();
    const hm = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return sameDay ? 'aujourd’hui à ' + hm : d.toLocaleDateString() + ' à ' + hm;
}

function statusSentence() {
    const meta = loadMeta();
    switch (status) {
        case 'syncing': return statusDetail || 'Synchronisation en cours…';
        case 'synced': return '✅ À jour (dernière synchro ' + formatTime(meta.lastSyncAt) + ').';
        case 'pending': return '🕒 Modifications locales en attente d’envoi.';
        case 'offline': return '📴 Hors-ligne : tes données restent sur cet appareil et seront envoyées au retour du réseau.';
        case 'error': return '⚠️ Erreur : ' + (statusDetail || 'synchro impossible') + '. Tes données locales sont intactes.';
        default: return '';
    }
}

function renderUI() {
    if (status === 'disabled') {
        if (ui.pill) ui.pill.style.display = 'none';
        return;
    }
    if (!ui.pill) {
        if (document.readyState === 'loading') return;
        mountPill();
    }
    ui.pill.style.display = '';
    ui.pill.dataset.status = session ? status : 'signed-out';
    const label = session ? STATUS_LABEL[status] : STATUS_LABEL['signed-out'];
    ui.pillLabel.textContent = label;
    ui.pill.title = session ? 'Synchro cloud : ' + label + ' (' + (session.user.email || '') + ')' : 'Se connecter pour sauvegarder ta progression dans le cloud';
    if (ui.panel) renderPanel();
}

function openPanel() {
    if (ui.panel) return;
    injectStyles();
    const overlay = el('div', { class: 'ems-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ems-title' });
    const panel = el('div', { class: 'ems-panel' });
    overlay.appendChild(panel);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closePanel(); });
    document.addEventListener('keydown', onEsc);

    const close = el('button', { type: 'button', class: 'ems-close', 'aria-label': 'Fermer' }, '×');
    close.addEventListener('click', closePanel);
    panel.appendChild(close);
    panel.appendChild(el('h3', { id: 'ems-title' }, '☁️ Synchro cloud'));

    /* Déconnecté */
    const out = el('div', { class: 'ems-out' });
    out.appendChild(el('p', null, 'Optionnel : connecte-toi avec ton e-mail pour sauvegarder ta progression (vocabulaire et verbes) et la retrouver sur tes autres appareils. Sans connexion, tout reste enregistré sur cet appareil.'));
    out.appendChild(el('label', { for: 'ems-email' }, 'Adresse e-mail'));
    const email = el('input', { type: 'email', id: 'ems-email', class: 'ems-input', autocomplete: 'email', placeholder: 'toi@exemple.com', inputmode: 'email' });
    out.appendChild(email);
    const sendActions = el('div', { class: 'ems-actions' });
    const btnSend = el('button', { type: 'button', class: 'ems-btn' }, 'Recevoir le lien de connexion');
    sendActions.appendChild(btnSend);
    out.appendChild(sendActions);

    const codeBox = el('div', { class: 'ems-code', hidden: '' });
    codeBox.appendChild(el('p', { style: 'margin-top:10px' }, '📧 E-mail envoyé ! Clique sur le lien reçu (ouvre-le dans ce navigateur). Sur une appli installée, tu peux aussi saisir le code à 6 chiffres s’il figure dans l’e-mail :'));
    const code = el('input', { type: 'tel', id: 'ems-code', class: 'ems-input', autocomplete: 'one-time-code', inputmode: 'numeric', placeholder: 'Code à 6 chiffres', maxlength: '10', 'aria-label': 'Code reçu par e-mail' });
    codeBox.appendChild(code);
    const codeActions = el('div', { class: 'ems-actions' });
    const btnCode = el('button', { type: 'button', class: 'ems-btn' }, 'Valider le code');
    codeActions.appendChild(btnCode);
    codeBox.appendChild(codeActions);
    out.appendChild(codeBox);

    /* Connecté */
    const inn = el('div', { class: 'ems-in', hidden: '' });
    const who = el('p');
    inn.appendChild(who);
    const statusLine = el('div', { class: 'ems-status-line', role: 'status' });
    inn.appendChild(statusLine);
    const inActions = el('div', { class: 'ems-actions' });
    const btnSync = el('button', { type: 'button', class: 'ems-btn' }, 'Synchroniser maintenant');
    const btnOut = el('button', { type: 'button', class: 'ems-btn ems-ghost' }, 'Se déconnecter');
    inActions.appendChild(btnSync);
    inActions.appendChild(btnOut);
    inn.appendChild(inActions);
    inn.appendChild(el('p', { style: 'margin-top:10px;font-size:12px' }, 'Les données restent aussi sur cet appareil (fonctionne hors-ligne). En cas de modifications sur deux appareils, les listes sont fusionnées mot par mot en gardant le meilleur niveau.'));

    const msg = el('div', { class: 'ems-msg', 'aria-live': 'polite' });
    panel.appendChild(out);
    panel.appendChild(inn);
    panel.appendChild(msg);

    const showMsg = (text, kind) => { msg.textContent = text || ''; msg.className = 'ems-msg' + (kind ? ' ems-' + kind : ''); };
    const busy = (btn, on) => { btn.disabled = on; };

    btnSend.addEventListener('click', async () => {
        const value = email.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { showMsg('Adresse e-mail invalide.', 'err'); return; }
        busy(btnSend, true); showMsg('Envoi…');
        try {
            await sendMagicLink(value);
            codeBox.hidden = false;
            showMsg('Lien envoyé à ' + value + '.', 'ok');
        } catch (e) {
            showMsg('Échec de l’envoi : ' + frError(e), 'err');
        } finally { busy(btnSend, false); }
    });
    email.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnSend.click(); });

    btnCode.addEventListener('click', async () => {
        const value = code.value.replace(/\s/g, '');
        if (!value) { showMsg('Saisis le code reçu.', 'err'); return; }
        busy(btnCode, true); showMsg('Vérification…');
        try {
            await verifyCode(email.value.trim(), value);
            showMsg('Connecté !', 'ok');
        } catch (e) {
            showMsg('Code refusé : ' + frError(e), 'err');
        } finally { busy(btnCode, false); }
    });
    code.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnCode.click(); });

    btnSync.addEventListener('click', async () => {
        busy(btnSync, true); showMsg('');
        await syncNow();
        busy(btnSync, false);
    });
    btnOut.addEventListener('click', async () => {
        busy(btnOut, true);
        try { await signOut(); showMsg('Déconnecté. Tes données restent sur cet appareil.', 'ok'); }
        catch (e) { showMsg('Erreur : ' + (e.message || e), 'err'); }
        finally { busy(btnOut, false); }
    });

    Object.assign(ui, { panel: overlay, out, inn, who, statusLine, email, btnSync });
    document.body.appendChild(overlay);
    renderPanel();
    if (!session) setTimeout(() => email.focus(), 0);
}

function renderPanel() {
    if (!ui.panel) return;
    const signedIn = !!session;
    ui.out.hidden = signedIn;
    ui.inn.hidden = !signedIn;
    if (signedIn) {
        ui.who.textContent = 'Connecté : ' + (session.user.email || session.user.id);
        ui.statusLine.textContent = statusSentence();
        ui.btnSync.disabled = status === 'syncing';
    }
}

function onEsc(e) { if (e.key === 'Escape') closePanel(); }

function closePanel() {
    if (!ui.panel) return;
    ui.panel.remove();
    document.removeEventListener('keydown', onEsc);
    ['panel', 'out', 'inn', 'who', 'statusLine', 'email', 'btnSync'].forEach((k) => { delete ui[k]; });
}

/* ---------- API publique ---------- */
window.EMSync = {
    notifySaved,
    syncNow,
    signOut,
    openPanel,
    getStatus: () => ({ status, detail: statusDetail, email: session && session.user ? session.user.email : null }),
    onStatusChange: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    _internals: { mergeDict, resolveStats, stableStringify, hashOf, KINDS }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderUI);
}
init();
})();
