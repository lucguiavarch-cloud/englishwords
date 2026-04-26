// On ouvre la bulle protectrice (IIFE)
(() => {

/* --- CONFIGURATION ET ÉTAT GLOBAL --- */
const KEY = 'EM_ULTIMATE_TIME_V1';

let dictionary = JSON.parse(localStorage.getItem(KEY)) || [];

const defaultStats = {
    flames: 0,
    lastDate: null,
    lastFlameDate: null,
    owner: "Session Locale",
    xp: 0,
    playerLevel: 1,
    shields: 3, 
    hints: 5,
    currentTheme: 'clair' // <-- Sauvegarde du skin
};

const savedStats = JSON.parse(localStorage.getItem(KEY + '_STATS')) || {};

let stats = { 
    ...defaultStats, 
    ...savedStats 
};

stats.xp = parseInt(stats.xp) || 0;
stats.playerLevel = parseInt(stats.playerLevel) || 1;
stats.shields = parseInt(stats.shields);
if (isNaN(stats.shields)) stats.shields = 3;
stats.hints = parseInt(stats.hints);
if (isNaN(stats.hints)) stats.hints = 5;

let celebrationQueue = [];
let isCelebrationRunning = false;
let isShieldArmed = false; 
let currentWord = null;
let sessionCombo = 0;
let timeLeft = 10 * 60; 
let timerActive = false;
let timerInterval = null;
const today = new Date().toDateString();

if (stats.lastDate !== today) {
    const lastVisit = new Date(stats.lastDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
	stats.maxCombo = 0;
	stats.dailyTotal = 0;
    if (lastVisit.toDateString() === yesterday.toDateString()) {
        stats.flames = (stats.flames || 0) + 1;
    } else {
        stats.flames = 0;
    }
    stats.dailyTotal = 0; 
    stats.lastDate = today;
    save();
}

/* ==========================================
   🎨 MOTEUR DE SKINS (NOUVEAU)
   ========================================== */
const SKIN_CATALOG = {
    "Classiques": [
        { id: "clair", name: "Thème : Base (Clair)" },
        { id: "skin-dark", name: "Thème : Grimoire (Sombre)" }
    ],
    "Tour du Monde": [
        { id: "skin-ghibli", name: "🇯🇵 Studio Ghibli" },
        { id: "skin-british", name: "🇬🇧 So British" },
        { id: "skin-canadian", name: "🇨🇦 Cabane au Canada" },
        { id: "skin-american", name: "🇺🇸 Retro Diner 50s" }
    ],
    "Vibes & Folies": [
        { id: "skin-rap-fr", name: "🎤 Rap Français" },
        { id: "skin-barbie", name: "💅 Barbiecore" },
        { id: "skin-win95", name: "💾 Windows 95" },
        { id: "skin-cyberpunk", name: "🦾 Cyberpunk" },
        { id: "skin-arcade", name: "👾 Retro Arcade" }
    ]
};


/* --- INITIALISATION DES ÉCOUTEURS D'ÉVÉNEMENTS --- */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('time-limit').addEventListener('change', resetTimer);
    document.getElementById('btn-add').addEventListener('click', openModal);
    document.getElementById('btn-export').addEventListener('click', exportJSON);
    document.getElementById('btn-import-trigger').addEventListener('click', () => document.getElementById('fLoader').click());
    document.getElementById('fLoader').addEventListener('change', importJSON);
    document.getElementById('btn-reset').addEventListener('click', resetAll);
    document.getElementById('btn-modal-valid').addEventListener('click', importMassive);
    document.getElementById('btn-modal-close').addEventListener('click', closeModal);
    const btnOpenReservoir = document.getElementById('btn-open-reservoir');
const modalReservoir = document.getElementById('modal-reservoir');

if (btnOpenReservoir) {
    btnOpenReservoir.addEventListener('click', () => {
        modalReservoir.style.display = 'block';
    });
}
    document.getElementById('btn-shield').addEventListener('click', toggleShield);
    const btnHint = document.getElementById('btn-hint');
    if (btnHint) btnHint.addEventListener('click', useHint); 
    
    document.getElementById('user-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAnswer();
    });
    
    window.onclick = (event) => {
        if (event.target == document.getElementById('wordModal')) closeModal();
    };

    initSkins(); // Lancement du moteur de skins !
    updateUI();
    getNextWord();
    updateTimerDisplay();
    startInterval();
});


//La base de données de tous tes badges
const gameBadges = [
    // Catégorie : Combos (les suites de bonnes réponses)
    { id: 'c2', type: 'combo', target: 2, icon: '🎖', name: 'Combox2', desc: '2 mots de suite' },
    { id: 'c3', type: 'combo', target: 3, icon: '🥉', name: 'Combox3', desc: '3 mots de suite' },
    { id: 'c5', type: 'combo', target: 5, icon: '🥈', name: 'Combox5', desc: '5 mots de suite' },
    { id: 'c10', type: 'combo', target: 10, icon: '🥇️', name: 'Combox10', desc: '10 mots de suite' },
	{ id: 'c20', type: 'combo', target: 20, icon: '🏆', name: 'Combox20', desc: '20 mots de suite' },
    
    // Catégorie : Total de mots justes
    { id: 'w10', type: 'words', target: 5, icon: '🥚', name: '5 mots justes', desc: '5 mots justes' },
    { id: 'w50', type: 'words', target: 10, icon: '🐣', name: '10 mots justes', desc: '10 mots justes' },
    { id: 'w100', type: 'words', target: 30, icon: '🐥', name: '30 mots justes', desc: '30 mots justes' },
    { id: 'w500', type: 'words', target: 50, icon: '🐓', name: '50 mots justes', desc: '50 mots justes' },
	{ id: 'w500', type: 'words', target: 100, icon: '🦖', name: '100 mots justes', desc: '100 mots justes' }
];

/* --- GESTION DU TEMPS --- */
function resetTimer() {
    timeLeft = parseInt(document.getElementById('time-limit').value) * 60;
    updateTimerDisplay();
    timerActive = false;
}

function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    document.getElementById('timer').innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
}

function startInterval() {
    setInterval(() => {
        if (timerActive && timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft === 0) {
                timerActive = false;
                const bonusXP = 50;
                stats.xp += bonusXP;

                const nextLevelXP = stats.playerLevel * 100;
                let leveledUp = false;
                
                if (stats.xp >= nextLevelXP) {
                    stats.xp -= nextLevelXP;
                    stats.playerLevel++;
                    leveledUp = true;
                }

                save(); 

                if (leveledUp) {
                    triggerCelebration('level', '🌟', `NIVEAU ${stats.playerLevel}`);
                } else {
                    triggerCelebration('focus', '⏳', `+${bonusXP} XP BONUS`);
                }
                resetTimer();
            }
        }
    }, 1000);
}


function applySkin(skinId) {
    document.body.className = document.body.className.split(' ').filter(c => !c.startsWith('skin-')).join(' ');
    if (skinId && skinId !== 'clair') {
        document.body.classList.add(skinId);
    }
}

function initSkins() {
    const selector = document.getElementById('skin-selector');
    const btnApply = document.getElementById('btn-apply-skin');
    
    // Sécurité : si les éléments n'existent pas dans le HTML, on arrête tout
    if (!selector) return;

    // 1. On vide le menu au cas où
    selector.innerHTML = ''; 

    // 2. On génère dynamiquement les options à partir du catalogue
    for (const [categoryName, skins] of Object.entries(SKIN_CATALOG)) {
        const optGroup = document.createElement('optgroup');
        optGroup.label = categoryName;
        
        skins.forEach(skin => {
            const option = document.createElement('option');
            option.value = skin.id;
            option.textContent = skin.name;
            optGroup.appendChild(option);
        });
        selector.appendChild(optGroup);
    }

    // 3. On sélectionne visuellement le thème actuel sauvegardé
    const savedSkin = stats.currentTheme || 'clair';
    selector.value = savedSkin;
    
    // 4. On l'applique au chargement de la page
    applySkin(savedSkin);

    // 5. On écoute le clic sur le bouton "Appliquer"
    if (btnApply) {
        btnApply.addEventListener('click', function() {
            const selectedSkin = selector.value;
            
            // On change l'apparence
            applySkin(selectedSkin);
            
            // On enregistre dans les statistiques
            stats.currentTheme = selectedSkin;
            
            // On sauvegarde dans le localStorage
            save(); 
            
            console.log("🎨 Thème appliqué avec succès : " + selectedSkin);
        });
    } else {
        console.warn("⚠️ Bouton 'btn-apply-skin' introuvable dans le HTML.");
    }
}


/* --- SYNTHÈSE VOCALE AMÉLIORÉE --- */
function speak(text) {
    if (!text) return;
    
    // 1. On annule tout pour éviter les bugs de file d'attente
    window.speechSynthesis.cancel();

    const msg = new SpeechSynthesisUtterance(text);
    
    // 2. On change pour une langue plus universelle au cas où
    msg.lang = 'en-US'; 
    msg.rate = 0.9;
    msg.pitch = 1;
    msg.volume = 1; // On force le volume à fond

    // 3. LE HACK : Sur certains navigateurs, il faut "re-déclencher" le resume
    if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
    }

    // 4. On écoute si une erreur survient (affichée en console)
    msg.onerror = (event) => {
        console.error("❌ Erreur de synthèse vocale :", event.error);
    };

    window.speechSynthesis.speak(msg);
}

/* --- MISE À JOUR DE L'INTERFACE --- */
/* --- MISE À JOUR DE L'INTERFACE --- */
function updateUI() {
    const elCombo = document.getElementById('stk-perf');
    const elTotal = document.getElementById('stk-total');
    const elOwner = document.getElementById('current-session-display');
    const elMastery = document.getElementById('mastery-score');

    if (elCombo) elCombo.innerText = sessionCombo;
    if (elTotal) elTotal.innerText = stats.dailyTotal;
    if (elOwner) elOwner.innerText = stats.owner;

    if (elMastery) {
        const totalWords = dictionary.length;
        const masterWords = dictionary.filter(w => w.level === 7).length;
        const masteryPercent = totalWords > 0 ? Math.round((masterWords / totalWords) * 100) : 0;
        elMastery.innerText = masteryPercent + "%";
    }

    const levelsDisplay = document.getElementById('levels-display');
    if (levelsDisplay && Array.isArray(dictionary)) {
        const labels = ['Nouv', '1J', '3J', '5J', '7J', '15J', '30J', 'Master'];
        
        levelsDisplay.innerHTML = labels.map((l, i) => {
            const isMaster = (i === 7);
            const count = dictionary.filter(w => w.level === i).length;
            
            return `
                <div class="level-box ${isMaster && count > 0 ? 'has-mastery shiny-effect' : ''}" 
                     style="${isMaster ? 'background:var(--success)' : ''}">
                    <span class="level-count">${count}</span>
                    <span class="level-label">${l}</span>
                </div>`;
        }).join('');
    }

    // 🌟 LA MAGIE OPÈRE ICI : On appelle le NOUVEAU système de badges
    // On utilise stats.maxCombo pour que tu gardes tes badges même si tu perds ton combo !
    updateBadgeSystem(stats.maxCombo, stats.dailyTotal);

    // Mise à jour de l'indicateur de révision
const failedWords = dictionary.filter(w => w.level === 0 && w.isFailed);
const reviserContainer = document.getElementById('reviser-container');
const reservoirCount = document.getElementById('reservoir-count');

if (failedWords.length > 0) {
    reviserContainer.style.display = 'block';
    reservoirCount.innerText = failedWords.length;
    
    // Remplissage de la liste dans la modale (au cas où elle est ouverte)
    const listModal = document.getElementById('reservoir-list-modal');
    if (listModal) {
        listModal.innerHTML = failedWords.map(w => `<span class="word-tag">${w.fr}</span>`).join('');
    }
} else {
    reviserContainer.style.display = 'none';
}

    // Mise à jour de l'XP et du Joueur
    document.getElementById('player-lvl').innerText = stats.playerLevel;
    const xpReq = stats.playerLevel * 100;
    const xpPercent = (stats.xp / xpReq) * 100;
    document.getElementById('xp-bar').style.width = `${xpPercent}%`;
    document.getElementById('xp-text').innerText = `${stats.xp} / ${xpReq} XP`;

    document.getElementById('count-hint').innerText = stats.hints;
    document.getElementById('count-shield').innerText = stats.shields;
}

function updateProgressBadge(id, current, target) {
    const el = document.getElementById(id);
    if (!el) return;

    const percent = Math.min(Math.round((current / target) * 100), 100);

    if (percent >= 100) {
        if (!el.classList.contains('unlocked')) {
            el.classList.add('unlocked');
            el.style.background = "var(--gold)"; 
			addXP(25);
            triggerCelebration('badge', el.innerText, el.getAttribute('data-label'));
        }
    } else {
        el.classList.remove('unlocked');
        if (percent > 0) {
            el.classList.add('in-progress');
            el.style.background = `linear-gradient(to top, var(--violet) ${percent}%, #eee ${percent}%)`;
        } else {
            el.style.background = "#eee"; 
        }
    }
}

function save() {
    localStorage.setItem(KEY, JSON.stringify(dictionary));
    localStorage.setItem(KEY + '_STATS', JSON.stringify(stats));
    updateUI();
}

/* --- LOGIQUE DU JEU --- */
function getNextWord() {
    const now = new Date();
    const modeTag = document.getElementById('mode-tag');

    let reviews = dictionary.filter(w => w.level >= 1 && w.level < 7 && new Date(w.nextReview) <= now);
    let consolidation = dictionary.filter(w => w.level === 0 && w.isFailed);
    let discovery = dictionary.filter(w => w.level === 0 && !w.isFailed);

    let pool = [];
    if (reviews.length) {
        pool = reviews;
        setMode("🔄 RÉVISION", "var(--accent)");
    } else if (consolidation.length) {
        pool = consolidation;
        setMode("🛠️ CONSO", "var(--pink)");
    } else if (discovery.length) {
        pool = discovery;
        setMode("✨ NOUVEAU", "var(--primary)");
    }

    if (!pool.length) {
        document.getElementById('current-word').innerText = "Bravo !";
        modeTag.style.display = "none";
        return;
    }

    modeTag.style.display = "block";
    currentWord = pool[Math.floor(Math.random() * pool.length)];
    document.getElementById('current-word').innerText = currentWord.fr;
    document.getElementById('user-input').value = "";
    document.getElementById('user-input').focus();
}

function setMode(text, color) {
    const modeTag = document.getElementById('mode-tag');
    modeTag.innerText = text;
    modeTag.style.backgroundColor = color;
}

function handleAnswer() {
    if (!timerActive && timeLeft > 0) timerActive = true;

    const input = document.getElementById('user-input').value.trim().toLowerCase();
    const target = currentWord.en.toLowerCase();
    const fb = document.getElementById('feedback');
    const box = document.getElementById('quiz-box');
    const comboCard = document.getElementById('stk-perf').closest('.stat-card');

    const distance = getLevenshteinDistance(input, target);

    if (distance === 0 || (distance === 1 && target.length > 3)) {
        sessionCombo++;
        stats.dailyTotal++;
        spawnFloatingText("+10 XP", "var(--success)");
        if (stats.dailyTotal % 10 === 0 && stats.dailyTotal !== 0) {
            let bonusPalier = stats.dailyTotal; 
            addXP(bonusPalier);
            setTimeout(() => {
                triggerCelebration('badge', '📈', `PALIER ${stats.dailyTotal} : +${bonusPalier} XP !`);
            }, 1000);
        }
        addXP(10); 
        
        if (sessionCombo % 10 === 0 && sessionCombo !== 0) { 
            addXP(25); 
            stats.shields++; 
            triggerCelebration('badge', '🛡️', `COMBO ${sessionCombo} : BOUCLIER !`);
        }

        if (sessionCombo > stats.maxCombo) stats.maxCombo = sessionCombo;

        playSuccessSound(sessionCombo);

        const oldLevel = currentWord.level;
        currentWord.level = Math.min(currentWord.level + 1, 7);
        currentWord.isFailed = false;

        comboCard.classList.remove('flash-combo');
        void comboCard.offsetWidth; 
        comboCard.classList.add('flash-combo');

        if (distance === 1) {
            fb.innerHTML = `<span style="color:var(--accent)">PRESQUE ! </span> <small>(Correction: ${currentWord.en})</small>`;
        } else {
            fb.innerHTML = `<span style="color:var(--success)">EXCELLENT !</span>`;
        }
        
        speak(currentWord.en);

        if (oldLevel === 6 && currentWord.level === 7) {
            addXP(50); 
            triggerCelebration('master', '🏆', currentWord.en.toUpperCase());
        }

        let d = new Date();
        const intervals = [0, 1, 3, 5, 7, 15, 30, 90];
        d.setDate(d.getDate() + intervals[currentWord.level]);
        currentWord.nextReview = d.toISOString();
        
    } else {
        if (isShieldArmed && stats.shields > 0) {
            stats.shields--;
            isShieldArmed = false; 
            
            const btn = document.getElementById('btn-shield');
            if(btn) {
                btn.style.boxShadow = "none";
                btn.style.border = "none";
                btn.innerHTML = `🛡️ Bouclier (<span id="count-shield">${stats.shields}</span>)`;
            }
            
            box.classList.add('shake');
            playErrorSound();
            speak(currentWord.en);

            fb.innerHTML = `
                <div style="font-size: 11px; color: var(--primary); margin-bottom: 5px; font-weight: bold;">🛡️ BOUCLIER UTILISÉ</div>
                <span style="color:var(--danger)">${currentWord.en}</span>
            `;
            
            currentWord.level = Math.max(0, currentWord.level - 1);
            currentWord.isFailed = true;
            let d = new Date();
            d.setDate(d.getDate() + 1); 
            currentWord.nextReview = d.toISOString();

            setTimeout(() => box.classList.remove('shake'), 400);

        } else {
            sessionCombo = 0;
            playErrorSound();

            box.classList.add('shake');
            fb.innerHTML = `<span style="color:var(--danger)">${currentWord.en}</span>`;
            speak(currentWord.en);

            currentWord.level = Math.max(0, currentWord.level - 1);
            currentWord.isFailed = true;

            let d = new Date();
            d.setDate(d.getDate() + 1); 
            currentWord.nextReview = d.toISOString();

            setTimeout(() => box.classList.remove('shake'), 400);
        }
    }

    save();
    setTimeout(() => { 
        fb.innerHTML = ""; 
		document.getElementById('user-input').focus(); 
        getNextWord(); 
    }, 2600);
	
}


function addXP(amount) {
    stats.xp += amount;
    let xpRequired = stats.playerLevel * 100;

    if (stats.xp >= xpRequired) {
        stats.xp -= xpRequired;
        stats.playerLevel++;
        
        stats.shields++;  
        stats.hints += 3; 

        triggerCelebration('badge', '✨', `NIVEAU ${stats.playerLevel} !`);
        setTimeout(() => triggerCelebration('badge', '🛡️', "BOUCLIER OBTENU !"), 3500); 
    }
    save();
}

function toggleShield() {
    if (stats.shields > 0) {
        isShieldArmed = !isShieldArmed;
        
        const btn = document.getElementById('btn-shield');
        if (isShieldArmed) {
            btn.style.boxShadow = "0 0 15px var(--primary)";
            btn.style.border = "2px solid white";
            btn.innerHTML = `🛡️ ARMÉ ! (<span id="count-shield">${stats.shields}</span>)`;
        } else {
            btn.style.boxShadow = "none";
            btn.style.border = "none";
            btn.innerHTML = `🛡️ Bouclier (<span id="count-shield">${stats.shields}</span>)`;
        }
        updateUI();
        document.getElementById('user-input').focus();
    } else {
        alert("Vous n'avez plus de boucliers en réserve !");
        document.getElementById('user-input').focus();
    }
}

function useHint() {
    if (stats.hints > 0 && currentWord) {
        stats.hints--;
        const hintText = `Commence par "${currentWord.en[0]}" (${currentWord.en.length} lettres)`;
        document.getElementById('feedback').innerHTML = `<span style="color:var(--violet)">${hintText}</span>`;
        updateUI();
        document.getElementById('user-input').focus();
    }
}

/* --- FONCTIONS ADMIN --- */
function openModal() { document.getElementById('wordModal').style.display = "block"; document.getElementById('bulk-input').focus(); }
function closeModal() { document.getElementById('wordModal').style.display = "none"; }

function importMassive() {
    const input = document.getElementById('bulk-input').value;
    if (!input.trim()) return;

    input.split('\n').forEach(line => {
        const parts = line.split(',');
        if (parts.length === 2) {
            dictionary.push({
                en: parts[0].trim(),
                fr: parts[1].trim(),
                level: 0,
                isFailed: false,
                nextReview: new Date().toISOString()
            });
        }
    });
    save();
    closeModal();
    getNextWord();
}

function exportJSON() {
    let userName = prompt("Entrez votre nom pour la sauvegarde :", stats.owner || "Session Locale");
    if (!userName) return;
    
    stats.owner = userName;

    const cleanStats = {
        flames: isNaN(parseInt(stats.flames)) ? 0 : parseInt(stats.flames),
        lastDate: stats.lastDate || new Date().toDateString(),
        lastFlameDate: stats.lastFlameDate || null,
        owner: stats.owner,
        xp: isNaN(parseInt(stats.xp)) ? 0 : parseInt(stats.xp),
        playerLevel: isNaN(parseInt(stats.playerLevel)) ? 1 : parseInt(stats.playerLevel),
        shields: isNaN(parseInt(stats.shields)) ? 3 : parseInt(stats.shields),
        hints: isNaN(parseInt(stats.hints)) ? 5 : parseInt(stats.hints),
        currentTheme: stats.currentTheme || 'clair'
    };

    stats = cleanStats;
    save();

    const exportData = { mots: dictionary, progression: cleanStats };

    const data = JSON.stringify(exportData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${userName.replace(/\s+/g, '_')}_vocab.json`;
    document.body.appendChild(a); 
    a.click();
    document.body.removeChild(a); 
    URL.revokeObjectURL(url); 
}

function importJSON(e) {
    const reader = new FileReader();
    reader.onload = (f) => {
        try {
            const data = JSON.parse(f.target.result);
            if (data.mots && Array.isArray(data.mots)) {
                dictionary = data.mots;
                stats = { ...stats, ...(data.progression || {}) };
                stats.xp = parseInt(stats.xp) || 0;
                stats.playerLevel = parseInt(stats.playerLevel) || 1;
                stats.shields = parseInt(stats.shields);
                if (isNaN(stats.shields)) stats.shields = 3;
                stats.hints = parseInt(stats.hints);
                if (isNaN(stats.hints)) stats.hints = 5;
            } 
            else if (Array.isArray(data)) { dictionary = data; } 
            else { throw new Error("Format de données inconnu"); }
            save();
            alert("Importation réussie !");
            location.reload();
        } catch (err) { alert("Fichier invalide : " + err.message); }
    };
    reader.readAsText(e.target.files[0]);
}

async function loadPreset(fileName) {
    const area = document.getElementById('bulk-input');
    try {
        const response = await fetch(`data/${fileName}.json`);
        if (!response.ok) throw new Error(`Fichier ${fileName}.json introuvable.`);
        const data = await response.json();
        const formattedLines = data.map(item => `${item.en}, ${item.fr}`).join('\n');
        if (area.value.trim() !== "") {
            if (confirm("Ajouter à la liste actuelle ? (Annuler pour remplacer tout)")) {
                area.value += "\n" + formattedLines;
            } else { area.value = formattedLines; }
        } else { area.value = formattedLines; }
    } catch (error) {
        console.error("Erreur :", error);
        alert(`Impossible de charger la liste.`);
    }
}
window.loadPreset = loadPreset;

function resetAll() {
    if (confirm("Tout effacer ? Cette action est irréversible.")) {
        localStorage.clear();
        location.reload();
    }
}

function triggerCelebration(type, icon, mainText) {
    celebrationQueue.push({ type, icon, mainText });
    processCelebrationQueue();
}

async function processCelebrationQueue() {
    if (isCelebrationRunning || celebrationQueue.length === 0) return;
    isCelebrationRunning = true;
    const { type, icon, mainText } = celebrationQueue.shift(); 
    const overlay = document.getElementById('celebration-overlay');
    const iconEl = document.getElementById('celebration-icon');
    const titleEl = document.getElementById('celebration-title');
    const nameEl = document.getElementById('celebration-name');
    const subEl = document.getElementById('celebration-subtitle');

    iconEl.classList.remove('badge-pop', 'mastery-pulse');
    void iconEl.offsetWidth; 

    if (type === 'master') {
        titleEl.innerText = "MOT MASTER";
        titleEl.style.color = "var(--success)";
        iconEl.style.filter = "drop-shadow(0 0 30px var(--success))";
        subEl.innerText = "Niveau Master Atteint (+50 XP)";
        iconEl.classList.add('mastery-pulse');
    } else if (type === 'level') {
        titleEl.innerText = "LEVEL UP !";
        titleEl.style.color = "var(--primary)";
        iconEl.style.filter = "drop-shadow(0 0 30px var(--primary))";
        subEl.innerText = "Nouveau palier franchi";
        iconEl.classList.add('mastery-pulse');
    } else if (type === 'focus') {
        titleEl.innerText = "OBJECTIF ATTEINT !";
        titleEl.style.color = "var(--accent)";
        subEl.innerText = "Bonus de concentration débloqué (+50 XP)";
        iconEl.classList.add('badge-pop');
    } else {
        titleEl.innerText = "NOUVEAU BADGE !";
        titleEl.style.color = "var(--gold)";
        subEl.innerText = "Récompense débloquée";
        iconEl.classList.add('badge-pop');
    }

    iconEl.innerText = icon;
    nameEl.innerText = mainText;
    playEpicSound();
    overlay.style.display = 'flex';
    await new Promise(resolve => setTimeout(resolve, 3000));
    overlay.style.display = 'none';
    isCelebrationRunning = false;
    processCelebrationQueue(); 
}
/* --- EFFETS VISUELS --- */
function spawnFloatingText(text, color) {
    const input = document.getElementById('user-input');
    const rect = input.getBoundingClientRect();
    
    const floatEl = document.createElement('div');
    floatEl.className = 'floating-text';
    floatEl.innerText = text;
    floatEl.style.color = color || 'var(--success)';
    
    // On le positionne pile au centre du champ de texte
    floatEl.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
    floatEl.style.top = `${rect.top + window.scrollY}px`;
    
    document.body.appendChild(floatEl);
    
    // Le texte s'auto-détruit après 1 seconde (fin de l'animation)
    setTimeout(() => floatEl.remove(), 1000);
}




/* --- MOTEUR AUDIO --- */
function getAudioCtx() {
    if (!window.myAudioCtx) window.myAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (window.myAudioCtx.state === 'suspended') window.myAudioCtx.resume();
    return window.myAudioCtx;
}

function playTone(frequency, type, duration, vol = 0.1) {
    try {
        const ctx = getAudioCtx();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
        gainNode.gain.setValueAtTime(vol, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + duration);
    } catch(e) { }
}

function playSuccessSound(comboCount) {
    let baseFreq = 523.25; 
    let freqModifier = Math.min(comboCount * 40, 500); 
    let finalFreq = baseFreq + freqModifier;
    playTone(finalFreq, 'sine', 0.5, 0.1);
    if (comboCount > 3) setTimeout(() => playTone(finalFreq * 1.5, 'sine', 0.6, 0.05), 80);
}

function playErrorSound() { playTone(150, 'sawtooth', 0.3, 0.1); }

function playEpicSound() {
    try {
        const notes = [261.63, 329.63, 392.00, 523.25]; 
        notes.forEach((freq, index) => {
            setTimeout(() => playTone(freq, 'triangle', 2.0, 0.15), index * 120); 
        });
    } catch(e) {}
}

function getLevenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, 
                    matrix[i][j - 1] + 1,     
                    matrix[i - 1][j] + 1      
                );
            }
        }
    }
    return matrix[b.length][a.length];
}


// --- GESTION DE LA MODALE GRIMOIRE ---
const modalCollection = document.getElementById('modal-collection');
const btnShowCollection = document.getElementById('btn-show-collection');
const btnCloseCollection = document.getElementById('btn-close-collection');

// Ouvrir la modale
btnShowCollection.addEventListener('click', () => {
    modalCollection.style.display = 'block';
});

// Fermer la modale via le bouton rouge
btnCloseCollection.addEventListener('click', () => {
    modalCollection.style.display = 'none';
});

// Fermer la modale si on clique en dehors du cadre
window.addEventListener('click', (event) => {
    if (event.target == modalCollection) {
        modalCollection.style.display = 'none';
    }
});

// =========================================
// 🏆 SYSTÈME DE BADGES ET GRIMOIRE
// =========================================



// 2. La fonction qui met à jour l'affichage
function updateBadgeSystem(currentStreak, totalScore) {
    const objectiveSlots = document.getElementById('objective-slots');
    const fullBadgesList = document.getElementById('full-badges-list');
    
    if (!objectiveSlots || !fullBadgesList) return;

    objectiveSlots.innerHTML = '';
    fullBadgesList.innerHTML = '';

    let nextComboBadge = null;
    let nextWordsBadge = null;

    // 1. On traite tous les badges
    gameBadges.forEach(badge => {
        let isUnlocked = false;
        if (badge.type === 'combo' && currentStreak >= badge.target) isUnlocked = true;
        if (badge.type === 'words' && totalScore >= badge.target) isUnlocked = true;

        const grimoireHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:5px;">
                <div class="badge ${isUnlocked ? 'unlocked' : ''}" title="${badge.desc}">
                    ${badge.icon}
                </div>
                <div style="font-size: 8px; color: var(--text-muted);">${badge.name}</div>
            </div>
        `;
        fullBadgesList.innerHTML += grimoireHTML;

        if (!isUnlocked) {
            if (badge.type === 'combo' && !nextComboBadge) nextComboBadge = badge;
            if (badge.type === 'words' && !nextWordsBadge) nextWordsBadge = badge;
        }
    });

    // 2. LA FONCTION UNIQUE (Déclarée une seule fois ici)
    const createObjectiveHTML = (badge, currentVal) => `
        <div style="display:flex; flex-direction:column; align-items:center; flex:1;">
            <div style="font-size: 8px; color: var(--text-muted); text-transform: uppercase; font-weight: bold; margin-bottom: 2px;">
                ${badge.type === 'combo' ? 'Combo Max' : 'Total Mots'}
            </div>
            <div class="badge in-progress" title="${badge.desc}">
                ${badge.icon}
            </div>
            <div class="objective-progress-text">
                ${currentVal} / ${badge.target}
            </div>
        </div>
    `;

    // 3. Affichage des objectifs
    if (nextComboBadge) objectiveSlots.innerHTML += createObjectiveHTML(nextComboBadge, currentStreak);
    if (nextWordsBadge) objectiveSlots.innerHTML += createObjectiveHTML(nextWordsBadge, totalScore);

    if (!nextComboBadge && !nextWordsBadge) {
        objectiveSlots.innerHTML = `<div style="font-size: 11px; color: var(--gold); text-align: center;">Toutes les quêtes sont terminées ! 🏆</div>`;
    }
}

})(); // Fin de l'application