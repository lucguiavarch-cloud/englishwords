// On ouvre la bulle protectrice (IIFE)
(() => {

/* =========================================================
   VARIABLES
   ========================================================= */
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
  currentTheme: 'skin-dark',
  streakDays: 1
};

const savedStats = JSON.parse(localStorage.getItem(KEY + '_STATS')) || {};
let stats = { ...defaultStats, ...savedStats };

stats.xp = parseInt(stats.xp) || 0;
stats.playerLevel = parseInt(stats.playerLevel) || 1;
stats.shields = parseInt(stats.shields);
if (isNaN(stats.shields)) stats.shields = 3;
stats.hints = parseInt(stats.hints);
if (isNaN(stats.hints)) stats.hints = 5;
stats.streakDays = parseInt(stats.streakDays);
if (isNaN(stats.streakDays) || stats.streakDays < 1) stats.streakDays = 1;

let celebrationQueue = [];
let isCelebrationRunning = false;
let isShieldArmed = false;
let currentWord = null;
let sessionCombo = 0;
let timeLeft = 10 * 60;
let timerActive = false;
let sessionMasterWords = 0; 
let sessionAlmostMasterWords = 0;

const today = new Date().toDateString();

/** Dernières cibles affichées dans les slots objectifs (détection changement de quête). */
let objectivePrevComboBadgeId = null;
let objectivePrevWordsBadgeId = null;

// Pour déclencher un flash unique + pop texte quand un badge est gagné
let lastUnlockedBadgeIds = new Set();

// Pour déclencher un flash quand un mot tombe dans une boîte de niveau
let pendingLevelFlash = null;
let pendingMasterFireworks = false;

// (supprimé) flash dans la modale grimoire: on flashe seulement dans la badges-section

/* =========================================================
   JEU (badges)
   ========================================================= */
const gameBadges = [
  // Catégorie : Combos (les suites de bonnes réponses)
  { id: 'c2', type: 'combo', target: 2, icon: '🎖', name: 'Combo x2', desc: '2 mots de suite' },
  { id: 'c3', type: 'combo', target: 3, icon: '🥉', name: 'Combo x3', desc: '3 mots de suite' },
  { id: 'c5', type: 'combo', target: 5, icon: '🥈', name: 'Combo x5', desc: '5 mots de suite' },
  { id: 'c10', type: 'combo', target: 10, icon: '🥇️', name: 'Combo x10', desc: '10 mots de suite' },
  { id: 'c20', type: 'combo', target: 20, icon: '🏆', name: 'Combo x20', desc: '20 mots de suite' },

  // Catégorie : Total de mots justes
  { id: 'w5', type: 'words', target: 5, icon: '🥚', name: '5 mots justes', desc: '5 mots justes' },
  { id: 'w10', type: 'words', target: 10, icon: '🐣', name: '10 mots justes', desc: '10 mots justes' },
  { id: 'w30', type: 'words', target: 30, icon: '🐥', name: '30 mots justes', desc: '30 mots justes' },
  { id: 'w50', type: 'words', target: 50, icon: '🐓', name: '50 mots justes', desc: '50 mots justes' },
  { id: 'w100', type: 'words', target: 100, icon: '🦖', name: '100 mots justes', desc: '100 mots justes' }
];

/* =========================================================
   UI (skins)
   ========================================================= */
const SKIN_CATALOG = {
  "Classiques": [
    { id: "clair", name: "Thème : Base (Clair)" },
    { id: "skin-dark", name: "Thème : Grimoire (Sombre)" }
  ],
  "Skins": [
    { id: "skin-barbie", name: "💅 Barbiecore" },
    { id: "skin-american", name: "🇺🇸 Retro Diner 50s" },
    { id: "skin-arcade", name: "👾 Retro Arcade" }
  ]
};

/* =========================================================
   VARIABLES (rotation journalière)
   ========================================================= */
if (stats.lastDate !== today) {
  const lastVisit = new Date(stats.lastDate);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  stats.maxCombo = 0;
  stats.dailyTotal = 0;

  const isConsecutive = lastVisit.toDateString() === yesterday.toDateString();
  if (isConsecutive) {
    // Compat: on conserve flames, mais on pilote le vrai compteur via streakDays
    stats.flames = (stats.flames || 0) + 1;
    stats.streakDays = (parseInt(stats.streakDays) || 1) + 1;

    // Bonus d'indices au démarrage si série >= 2 jours
    if (stats.streakDays >= 2) {
      stats.hints += 3;
      triggerCelebration('streak', '🔥', `${stats.streakDays} jours consécutifs`);
    }
  } else {
    stats.flames = 0;
    stats.streakDays = 1;
  }

  stats.dailyTotal = 0;
  stats.lastDate = today;
  save();
}

/* =========================================================
   UI (init + listeners)
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const timeLimit = document.getElementById('time-limit');
  if (timeLimit) timeLimit.addEventListener('change', resetTimer);

  // Mobile/UX: clic sur le chrono -> modale choix durée
  const timerEl = document.getElementById('timer');
  const timerModal = document.getElementById('modal-timer');
  const btnCloseTimer = document.getElementById('btn-close-timer');

  const closeTimerModal = () => {
    if (timerModal) timerModal.style.display = 'none';
  };

  const openTimerModal = () => {
    if (!timerModal) return;
    timerModal.style.display = 'block';
  };

  if (timerEl) {
    timerEl.style.cursor = 'pointer';
    timerEl.title = "Changer la durée du chrono";
    timerEl.addEventListener('click', openTimerModal);
  }

  if (btnCloseTimer) btnCloseTimer.addEventListener('click', closeTimerModal);

  if (timerModal) {
    timerModal.addEventListener('click', (e) => {
      if (e.target === timerModal) closeTimerModal();
    });

    timerModal.querySelectorAll('.btn-timer-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        const minutes = parseInt(btn.getAttribute('data-min'));
        if (!timeLimit || !minutes || isNaN(minutes)) return;
        timeLimit.value = String(minutes);
        resetTimer();
        closeTimerModal();
      });
    });
  }

  const btnAdd = document.getElementById('btn-add');
  if (btnAdd) btnAdd.addEventListener('click', openModal);

  const btnExport = document.getElementById('btn-export');
  if (btnExport) btnExport.addEventListener('click', exportJSON);

  const btnImportTrigger = document.getElementById('btn-import-trigger');
  const fileLoader = document.getElementById('fLoader');
  if (btnImportTrigger && fileLoader) btnImportTrigger.addEventListener('click', () => fileLoader.click());
  if (fileLoader) fileLoader.addEventListener('change', importJSON);

  const btnReset = document.getElementById('btn-reset');
  if (btnReset) btnReset.addEventListener('click', resetAll);

  const btnModalValid = document.getElementById('btn-modal-valid');
  if (btnModalValid) btnModalValid.addEventListener('click', importMassive);

  const btnModalClose = document.getElementById('btn-modal-close');
  if (btnModalClose) btnModalClose.addEventListener('click', closeModal);

  const btnOpenReservoir = document.getElementById('btn-open-reservoir');
  const modalReservoir = document.getElementById('modal-reservoir');
  if (btnOpenReservoir && modalReservoir) {
    btnOpenReservoir.addEventListener('click', () => {
      modalReservoir.style.display = 'block';
    });
  }

  const btnShield = document.getElementById('btn-shield');
  if (btnShield) btnShield.addEventListener('click', toggleShield);

  const btnHint = document.getElementById('btn-hint');
  if (btnHint) btnHint.addEventListener('click', useHint);

  const userInput = document.getElementById('user-input');
  if (userInput) {
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleAnswer();
    });
  }

  window.addEventListener('click', (event) => {
    const wordModal = document.getElementById('wordModal');
    if (wordModal && event.target === wordModal) closeModal();
  });

  initSkins();
  initCollectionModal();
  updateUI();
  getNextWord();
  updateTimerDisplay();
  startInterval();
});

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
				
				// --- Bilan de la session ---
				let recapHTML = `Bonus de concentration : +${bonusXP} XP`;
				// Si tu as fait progresser au moins un mot, on affiche le bilan détaillé
                if (sessionMasterWords > 0 || sessionAlmostMasterWords > 0) {
                    recapHTML = `<div style="margin-top:10px; font-size:18px;">
                        <span style="color:var(--gold)">♔ ${sessionMasterWords} nouveaux Master</span><br>
                        <span style="color:var(--primary)">★ ${sessionAlmostMasterWords} mots en ancrage (niv 4 à 6)</span>
                    </div>`;
                }			
				
               // 1. On lance TOUJOURS le bilan du chrono en premier
                triggerCelebration('focus', '⏳', `<span style="font-size:20px">+${bonusXP} XP BONUS</span>`, recapHTML);

                // 2. SI on a passé un niveau, la file d'attente lancera le Level Up juste après !
                if (leveledUp) {
                    triggerCelebration('level', '🌟', `NIVEAU ${stats.playerLevel}`);
                }
				
				// On réinitialise les compteurs pour le prochain chrono
                sessionMasterWords = 0;
                sessionAlmostMasterWords = 0;
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
    const savedSkin = stats.currentTheme || 'skin-dark';
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


/* =========================================================
   AUDIO (synthèse vocale)
   ========================================================= */
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


/* =========================================================
   UI
   ========================================================= */
function updateUI() {
    const elOwner = document.getElementById('current-session-display');
    const elMastery = document.getElementById('elMastery');

    if (elOwner) elOwner.innerText = stats.owner;

    // ✅ gestion du mastery-score !
   if (elMastery) {
        const totalWords = dictionary.length;
        
        if (totalWords > 0) {
            // 1. On additionne les points de chaque mot (niveau 0 = 0pt, niveau 7 = 7pts)
            const totalPoints = dictionary.reduce((sum, w) => sum + (w.level || 0), 0);
            
            // 2. Le score max possible est le nombre de mots x 7
            const maxPossiblePoints = totalWords * 7;
            
            // 3. On calcule le pourcentage global de progression
            const weightedPercent = Math.round((totalPoints / maxPossiblePoints) * 100);
            
            elMastery.innerText = weightedPercent + "%";
        } else {
            elMastery.innerText = "0%";
        }
    }

   const levelsDisplay = document.getElementById('levels-display');
    if (levelsDisplay && Array.isArray(dictionary)) {
        
        // ✅ On définit la configuration avec les symboles 
        const rarityConfig = [
            { symbol: '○' },
            { symbol: '●' },
            { symbol: '●●' },
            { symbol: '●●●' },
            { symbol: '★' },
            { symbol: '★★' },
            { symbol: '★★★' },
            { symbol: '♔♔♔' } // La couronne monochrome
        ];
        
        levelsDisplay.innerHTML = rarityConfig.map((cfg, i) => {
            const isMaster = (i === 7);
            const count = dictionary.filter(w => w.level === i).length;
            
            return `
                <div class="level-box ${isMaster && count > 0 ? 'has-mastery shiny-effect' : ''}" 
                     style="${isMaster ? 'background:var(--success)' : ''}; cursor:pointer;"
                     data-level="${i}"
                     onclick="openLevelModal(${i})">
                    <span class="level-count">${count}</span>
                    <span class="level-label" style="color:var(--gold); font-size: 8px;">${cfg.symbol}</span>
                </div>`;
        }).join('');

        if (pendingLevelFlash !== null) {
            const target = levelsDisplay.querySelector(`.level-box[data-level="${pendingLevelFlash}"]`);
            pendingLevelFlash = null;
            if (target) {
                target.classList.remove('level-flash');
                void target.offsetWidth;
                target.classList.add('level-flash');
                setTimeout(() => target.classList.remove('level-flash'), 650);
            }
        }

        if (pendingMasterFireworks) {
            pendingMasterFireworks = false;
            const masterBox = levelsDisplay.querySelector(`.level-box[data-level="7"]`);
            if (masterBox) {
                masterBox.classList.remove('master-fireworks');
                void masterBox.offsetWidth;
                masterBox.classList.add('master-fireworks');
                setTimeout(() => masterBox.classList.remove('master-fireworks'), 1300);
            }
        }
    }

    // 🌟 LA MAGIE OPÈRE ICI : On appelle le NOUVEAU système de badges
    // On utilise stats.maxCombo pour que tu gardes tes badges même si tu perds ton combo !
    // Objectifs combo: basé sur le combo ACTUEL (retombe à 0 si série brisée)
    // Déblocage badges combo (grimoire): basé sur le combo MAX historique
    updateBadgeSystem(sessionCombo, stats.maxCombo, stats.dailyTotal);

    // Mise à jour de l'indicateur de révision
    //const failedWords = dictionary.filter(w => w.level === 0 && w.isFailed);
	const failedWords = dictionary.filter(w => w.isFailed);
    const reviserContainer = document.getElementById('reviser-container');
    const reservoirCount = document.getElementById('reservoir-count');

    if (reviserContainer && reservoirCount && failedWords.length > 0) {
        reviserContainer.style.display = 'block';
        reservoirCount.innerText = failedWords.length;
        
        // Remplissage de la liste dans la modale (au cas où elle est ouverte)
        const listModal = document.getElementById('reservoir-list-modal');
        if (listModal) {
            listModal.innerHTML = failedWords.map(w => `<span class="word-tag">${w.fr}</span>`).join('');
        }
    } else if (reviserContainer) {
        reviserContainer.style.display = 'none';
    }

    // Mise à jour de l'XP et du Joueur
    const elPlayerLvl = document.getElementById('player-lvl');
    if (elPlayerLvl) elPlayerLvl.innerText = stats.playerLevel;
    const xpReq = stats.playerLevel * 100;
const xpPercent = (stats.xp / xpReq) * 100;

const elXpBar = document.getElementById('xp-bar');
if (elXpBar) {
    elXpBar.style.width = `${xpPercent}%`;
}

const elXpText = document.getElementById('xp-text');
if (elXpText) {
    elXpText.innerText = `${stats.xp} / ${xpReq} XP`;
}

    const elHint = document.getElementById('count-hint');
    if (elHint) elHint.innerText = stats.hints;
    const elShield = document.getElementById('count-shield');
    if (elShield) elShield.innerText = stats.shields;
}




// (supprimé) updateProgressBadge: non utilisé
function save() {
    localStorage.setItem(KEY, JSON.stringify(dictionary));
    localStorage.setItem(KEY + '_STATS', JSON.stringify(stats));
    updateUI();
}

/* =========================================================
   JEU
   ========================================================= */
function getNextWord() {
    const now = new Date();
    const modeTag = document.getElementById('mode-tag');

	// On ajoute "!w.isFailed" pour ne pas mélanger les révisions et la consolidation
	let reviews = dictionary.filter(w => w.level >= 1 && w.level < 7 && new Date(w.nextReview) <= now && !w.isFailed);

	// La consolidation aspire TOUS les mots échoués, peu importe le niveau
	let consolidation = dictionary.filter(w => w.isFailed);
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

    const guideEl = document.getElementById('word-guide');
    if (!pool.length) {
        document.getElementById('current-word').innerText = "Bravo !";
        if (guideEl) {
            guideEl.textContent = "";
            guideEl.hidden = true;
        }
        modeTag.style.display = "none";
        return;
    }

    modeTag.style.display = "block";
    currentWord = pool[Math.floor(Math.random() * pool.length)];
    document.getElementById('current-word').innerText = currentWord.fr;
    if (guideEl) {
        const g = currentWord.guide && String(currentWord.guide).trim();
        if (g) {
            guideEl.textContent = g;
            guideEl.hidden = false;
        } else {
            guideEl.textContent = "";
            guideEl.hidden = true;
        }
    }
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

    const distance = getLevenshteinDistance(input, target);

    if (distance === 0 || (distance === 1 && target.length > 3)) {
        sessionCombo++;
        stats.dailyTotal++;
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
            spawnFloatingTextFromElement(document.getElementById('btn-shield'), '+1', 'var(--text-light)');
        }

        if (sessionCombo > stats.maxCombo) stats.maxCombo = sessionCombo;

        playSuccessSound(sessionCombo);

        const oldLevel = currentWord.level;
        currentWord.level = Math.min(currentWord.level + 1, 7);
        currentWord.isFailed = false;
		
		if (oldLevel !== currentWord.level) {
            if (currentWord.level === 7) {
                sessionMasterWords++;
            } else if (currentWord.level >= 4 && currentWord.level <= 6) {
                sessionAlmostMasterWords++;
            }
        }
				
        if (currentWord.level !== oldLevel) pendingLevelFlash = currentWord.level;

        if (distance === 1) {
            fb.innerHTML = `<span style="color:var(--accent)">PRESQUE ! </span> <small>(Correction: ${currentWord.en})</small>`;
        } else {
            fb.innerHTML = `<span style="color:var(--success)">EXCELLENT !</span>`;
        }
        
        speak(currentWord.en);

        if (oldLevel === 6 && currentWord.level === 7) {
            addXP(50); 
            // Pas de modale: feu d'artifice local sur la boîte Master
            pendingMasterFireworks = true;
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
            
            const oldLevel = currentWord.level;
            currentWord.level = Math.max(0, currentWord.level - 1);
            currentWord.isFailed = true;
            if (currentWord.level !== oldLevel) pendingLevelFlash = currentWord.level;
            let d = new Date();
            d.setDate(d.getDate() + 1); 
            currentWord.nextReview = d.toISOString();

            setTimeout(() => box.classList.remove('shake'), 400);

        } else {
            sessionCombo = 0;
            playErrorSound();

            updateBadgeSystem(sessionCombo, stats.maxCombo, stats.dailyTotal);
            const comboCounter = document.querySelector('#objective-slots .objective-counter[data-objective-type="combo"]');
            if (comboCounter) {
                comboCounter.classList.remove('counter-reset-shake');
                void comboCounter.offsetWidth;
                comboCounter.classList.add('counter-reset-shake');
                comboCounter.addEventListener('animationend', () => comboCounter.classList.remove('counter-reset-shake'), { once: true });
            }

            box.classList.add('shake');
            fb.innerHTML = `<span style="color:var(--danger)">${currentWord.en}</span>`;
            speak(currentWord.en);

            const oldLevel = currentWord.level;
            currentWord.level = Math.max(0, currentWord.level - 1);
            currentWord.isFailed = true;
            if (currentWord.level !== oldLevel) pendingLevelFlash = currentWord.level;

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
        spawnFloatingTextFromElement(document.getElementById('btn-shield'), '+1', 'var(--text-light)');
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

/* =========================================================
   ADMIN
   ========================================================= */
function openModal() { document.getElementById('wordModal').style.display = "block"; document.getElementById('bulk-input').focus(); }
function closeModal() { document.getElementById('wordModal').style.display = "none"; }

function importMassive() {
    const input = document.getElementById('bulk-input').value;
    if (!input.trim()) return;

    const GUIDE_SEP = " ||| ";
    input.split('\n').forEach(rawLine => {
        let line = rawLine.trim();
        if (!line) return;
        let guide = "";
        const gi = line.indexOf(GUIDE_SEP);
        if (gi !== -1) {
            guide = line.slice(gi + GUIDE_SEP.length).trim();
            line = line.slice(0, gi).trim();
        }
        const comma = line.indexOf(",");
        if (comma === -1) return;
        const en = line.slice(0, comma).trim();
        const fr = line.slice(comma + 1).trim();
        if (!en || !fr) return;
        const row = {
            en,
            fr,
            level: 0,
            isFailed: false,
            nextReview: new Date().toISOString()
        };
        if (guide) row.guide = guide;
        dictionary.push(row);
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
        currentTheme: stats.currentTheme || 'skin-dark',
        streakDays: isNaN(parseInt(stats.streakDays)) ? 1 : Math.max(1, parseInt(stats.streakDays))
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
        const GUIDE_SEP = " ||| ";
        const formattedLines = data
            .map((item) => {
                let line = `${item.en}, ${item.fr}`;
                if (item.guide && String(item.guide).trim()) {
                    line += GUIDE_SEP + String(item.guide).trim().replace(/\s*\|\|\|\s*/g, " ");
                }
                return line;
            })
            .join("\n");
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

function triggerCelebration(type, icon, mainText,customSubtitle = null) {
    // Désactivé: pas de modale (overlay) pour les badges et bonus de palier (tous les 10 mots)
    // On garde les célébrations importantes: master / level / focus
    if (type === 'badge') return;
    celebrationQueue.push({ type, icon, mainText,customSubtitle });
    processCelebrationQueue();
}

async function processCelebrationQueue() {
    if (isCelebrationRunning || celebrationQueue.length === 0) return;
    isCelebrationRunning = true;
    const { type, icon, mainText, customSubtitle } = celebrationQueue.shift();
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
    } else if (type === 'streak') {
        titleEl.innerText = "SÉRIE !";
        titleEl.style.color = "var(--gold)";
        iconEl.style.filter = "drop-shadow(0 0 30px var(--gold))";
        subEl.innerText = "+3 indices";
        iconEl.classList.add('badge-pop');
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
	
	if (customSubtitle) {
        subEl.innerHTML = customSubtitle;
    }

    iconEl.innerText = icon;
    nameEl.innerHTML = mainText;
    playEpicSound();
    overlay.style.display = 'flex';
await new Promise(resolve => setTimeout(resolve, 3500)); // J'ai mis 3.5s pour te laisser lire le bilan
    overlay.style.display = 'none';
    isCelebrationRunning = false;
    processCelebrationQueue(); 
}
/* --- EFFETS VISUELS --- */
/**
 * Texte flottant centré sur le champ de saisie.
 * @param {string} text
 * @param {string} [color]
 * @param {{ maxJitterX?: number, maxJitterY?: number }} [opts] — décalage aléatoire ±max depuis le centre (px)
 */
function spawnFloatingText(text, color, opts) {
    const input = document.getElementById('user-input');
    if (!input) return;

    const rect = input.getBoundingClientRect();
    const o = opts || {};
    const jx = typeof o.maxJitterX === 'number' ? (Math.random() * 2 - 1) * o.maxJitterX : 0;
    const jy = typeof o.maxJitterY === 'number' ? (Math.random() * 2 - 1) * o.maxJitterY : 0;

    const floatEl = document.createElement('div');
    floatEl.className = 'floating-text';
    floatEl.innerText = text;
    floatEl.style.color = color || 'var(--success)';

    floatEl.style.left = `${rect.left + rect.width / 2 + window.scrollX + jx}px`;
    floatEl.style.top = `${rect.top + window.scrollY + jy}px`;

    document.body.appendChild(floatEl);

    setTimeout(() => floatEl.remove(), 1600);
}

function spawnFloatingTextFromElement(anchorEl, text, color) {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const floatEl = document.createElement('div');
    floatEl.className = 'floating-text shield-plus';
    floatEl.innerText = text;
    floatEl.style.color = color || 'var(--gold)';
    floatEl.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
    floatEl.style.top = `${rect.top + window.scrollY}px`;
    document.body.appendChild(floatEl);
    setTimeout(() => floatEl.remove(), 1500);
}




/* =========================================================
   AUDIO (effets)
   ========================================================= */
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

/** Arpège bref montant quand la cible d'objectif change. */
function playNewObjectiveTargetSound() {
    playTone(392, 'sine', 0.11, 0.09);
    setTimeout(() => playTone(523.25, 'sine', 0.11, 0.09), 70);
    setTimeout(() => playTone(659.25, 'sine', 0.14, 0.09), 140);
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
function initCollectionModal() {
    const modalCollection = document.getElementById('modal-collection');
    const btnShowCollection = document.getElementById('btn-show-collection');
    const btnCloseCollection = document.getElementById('btn-close-collection');

    if (!modalCollection) return;

    if (btnShowCollection) {
        btnShowCollection.addEventListener('click', () => {
            modalCollection.style.display = 'block';
        });
    }

    if (btnCloseCollection) {
        btnCloseCollection.addEventListener('click', () => {
            modalCollection.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === modalCollection) {
            modalCollection.style.display = 'none';
        }
    });
}

// =========================================
// 🏆 SYSTÈME DE BADGES ET GRIMOIRE
// =========================================



function updateBadgeSystem(currentCombo, maxCombo, totalScore) {
    const objectiveSlots = document.getElementById('objective-slots');
    const fullBadgesList = document.getElementById('full-badges-list');
    
    if (!objectiveSlots || !fullBadgesList) return;

    const prevComboSlotId = objectivePrevComboBadgeId;
    const prevWordsSlotId = objectivePrevWordsBadgeId;

    objectiveSlots.innerHTML = '';
    fullBadgesList.innerHTML = '';

    let nextComboBadge = null;
    let nextWordsBadge = null;

    const newlyUnlockedBadges = [];
    const unlockedNowIds = new Set();

    // 1. Traitement du Grimoire (Affichage statique de tous les badges)
    gameBadges.forEach(badge => {
        let isUnlocked = (badge.type === 'combo' && maxCombo >= badge.target) || 
                         (badge.type === 'words' && totalScore >= badge.target);

        if (isUnlocked) {
            unlockedNowIds.add(badge.id);
            if (!lastUnlockedBadgeIds.has(badge.id)) {
                newlyUnlockedBadges.push(badge);
            }
        }

        const grimoireHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:5px;">
                <div class="badge ${isUnlocked ? 'unlocked' : ''}" data-badge-id="${badge.id}" title="${badge.desc}">
                    ${badge.icon}
                </div>
                <div style="font-size: 8px; color: var(--text-muted);">${badge.name}</div>
            </div>
        `;
        fullBadgesList.innerHTML += grimoireHTML;

        // Identification des prochains badges à afficher en objectifs
        if (!isUnlocked) {
            if (badge.type === 'combo' && !nextComboBadge) nextComboBadge = badge;
            if (badge.type === 'words' && !nextWordsBadge) nextWordsBadge = badge;
        }
    });

    // 2. Fonction de création des Objectifs
    const createObjectiveHTML = (badge, progressVal) => {
        const isCompleted = progressVal >= badge.target;
        const statusClass = isCompleted ? 'unlocked' : 'in-progress';
        const counterText = `${progressVal} / ${badge.target}`;

        return `
            <div style="display:flex; flex-direction:column; align-items:center; flex:1;">
                <div class="objective-badge-name">${badge.name}</div>
                <div class="badge ${statusClass}" data-badge-id="${badge.id}" data-objective-type="${badge.type}" title="${badge.name} — ${badge.desc}">
                    ${badge.icon}
                </div>
                <div class="objective-counter" data-objective-type="${badge.type}" aria-live="polite">${counterText}</div>
            </div>
        `;
    };

    // 3. Affichage des slots d'objectifs
    if (nextComboBadge) objectiveSlots.innerHTML += createObjectiveHTML(nextComboBadge, currentCombo);
    if (nextWordsBadge) objectiveSlots.innerHTML += createObjectiveHTML(nextWordsBadge, totalScore);

    objectivePrevComboBadgeId = nextComboBadge ? nextComboBadge.id : null;
    objectivePrevWordsBadgeId = nextWordsBadge ? nextWordsBadge.id : null;

    const triggerNewObjectiveBounce = (prevSlotId, nextSlotId) => {
        if (!prevSlotId || !nextSlotId || prevSlotId === nextSlotId) return;
        const badgeEl = objectiveSlots.querySelector(`.badge[data-badge-id="${nextSlotId}"]`);
        if (!badgeEl) return;
        badgeEl.classList.remove('new-objective-bounce');
        void badgeEl.offsetWidth;
        badgeEl.classList.add('new-objective-bounce');
        playNewObjectiveTargetSound();
        badgeEl.addEventListener('animationend', () => badgeEl.classList.remove('new-objective-bounce'), { once: true });
    };

    triggerNewObjectiveBounce(prevComboSlotId, objectivePrevComboBadgeId);
    triggerNewObjectiveBounce(prevWordsSlotId, objectivePrevWordsBadgeId);

    if (newlyUnlockedBadges.length) {
        newlyUnlockedBadges.forEach((badge, i) => {
            setTimeout(() => {
                spawnFloatingText(`${badge.icon} ${badge.name} DÉBLOQUÉ !`, 'var(--gold)', {
                    maxJitterX: 30,
                    maxJitterY: 20
                });

                const grimoireEl = fullBadgesList.querySelector(`.badge[data-badge-id="${badge.id}"]`);
                if (grimoireEl) {
                    grimoireEl.classList.remove('badge-just-won');
                    void grimoireEl.offsetWidth;
                    grimoireEl.classList.add('badge-just-won');
                    setTimeout(() => grimoireEl.classList.remove('badge-just-won'), 850);
                }
            }, i * 300);
        });
    }

    lastUnlockedBadgeIds = unlockedNowIds;

    // Si plus aucun badge n'est disponible (tout est débloqué)
    if (!nextComboBadge && !nextWordsBadge) {
        objectiveSlots.innerHTML = `<div style="font-size: 11px; color: var(--gold); text-align: center;">Toutes les quêtes sont terminées ! 🏆</div>`;
    }
}


function openLevelModal(levelIndex) {
    // On remplace les lettres par les symboles d'étoiles et de progression
    const rarityConfig = [
        { symbol: '○', name: 'Nouveau (à apprendre)' },
        { symbol: '●', name: 'Initié (Court terme)' },
        { symbol: '●●', name: 'Commun (Encodage)' },
        { symbol: '●●●', name: 'Rare (Répétition)' },
        { symbol: '★', name: 'Épique (Intermédiaire)' },
        { symbol: '★★', name: 'Légendaire (Long terme)' },
        { symbol: '★★★', name: 'Mythique (Automatisme)' },
        { symbol: '♔♔♔', name: 'Maître Absolu (Permanent)' }
    ];

    const modal = document.getElementById('modal-level-details');
    const title = document.getElementById('level-modal-title');
    const list = document.getElementById('level-words-list');
    
    // On récupère les mots du dictionnaire correspondant au niveau cliqué
    const words = dictionary.filter(w => w.level === levelIndex);
    
    // Mise à jour du titre : on affiche le symbole + le nom (ex: "★★★ Épique")
    title.innerHTML = `<span style="color:var(--gold); margin-right:10px;">${rarityConfig[levelIndex].symbol}</span>${rarityConfig[levelIndex].name}`;
    
    // Affichage de la liste des mots
    list.innerHTML = words.length > 0 
        ? words.map(w => `<div class="word-tag" style="border-color:var(--primary); color:var(--text-card); cursor:default;">${w.en}</div>`).join('')
        : '<p style="color:var(--text-muted); font-size:12px;">Aucun mot à ce stade pour le moment.</p>';
    
    modal.style.display = 'block';
}


// On rend la fonction accessible au clic HTML
window.openLevelModal = openLevelModal;

})(); // Fin de l'application