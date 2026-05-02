# Changelog

## v4.9 — 02/05/2026

### Refactor & qualité — Vocabulaire (`vocabulaire.html` / `.css` / `.js`)
- **JavaScript** : conservation de l’**IIFE** ; helpers **`loadJSON`**, **`setText`**, **`escapeHtml`**, **`safeAddListener`** ; chargement JSON / stats plus robuste ; **`save()`** avec **`try/catch`** ; garde-fous avant accès DOM ; **`RARITY_LEVELS`** unique (grille + modale niveaux) ; construction du Grimoire en **`join()`** au lieu de **`innerHTML +=`** ; fermeture modales **réservoir** / **niveau** par boutons + écouteurs ; sections commentées (init, jeu, UI, stockage, audio).
- **CSS** : nettoyage variables inutilisées (**`--font-title`**, tokens réservoir non référencés) ; fusion règles **`.dashboard-grid`** ; **boutons** avec **`--radius-btn`** et **`--shadow-main`** ; bloc **Grimoire / flottant / skins** avant le **`@media (max-width: 600px)`** unique en fin de fichier ; suppression de règles mortes (presets inutilisés, animations orphelines, etc.) ; styles extraits du HTML vers des classes (modales, célébration, admin, etc.).
- **HTML** : indentation ; **ARIA** (Grimoire, révision, thème) ; **`#celebration-overlay`** et modales sans gros blocs **`style=`** inline.

### Correctif export — compteurs objectifs / progression
- **`exportJSON`** : **`cleanStats`** inclut désormais **`maxCombo`**, **`dailyTotal`**, champs **maîtrise** (**`masteryBaselineDate`**, **`masteryBaselinePercent`**, **`masterySnapshotEod`**) — évite la perte de ces clés lors du remplacement de **`stats`** et le dérèglement des donuts / Grimoire après export.
- **Import** : normalisation **`maxCombo`** / **`dailyTotal`** ; idem pour la collection jurons (**`unlockedJurons`**, **`lastUnlockedId`**) une fois la feature ajoutée.

### Juron Box — collection & déblocage (`data/jurons.json`, vocabulaire)
- **Données** : **`data/jurons.json`** (`[{ "en", "fr" }, …]`), identifiant = **index** du tableau ; chargement au démarrage (**`fetch`**) dans **`JURON_LIBRARY`** (async avant init UI).
- **Stats** : **`unlockedJurons`** (indices), **`lastUnlockedId`** (carte « nouvelle » + persistance export / import).
- **Gameplay** : tous les **50** mots justes **du jour** (**`dailyTotal`**), tirage aléatoire d’un juron non possédé ; célébration type **`juron`** (overlay rouge **`var(--danger)`**, distinct du type **`badge`** ignoré par l’overlay).
- **UI** : donut **`#donut-juron`** (anneau rouge, progression **`dailyTotal % 50`**) dans **`updateBadgeSystem`** ; bouton **🤬** sous le Grimoire ; modale **BD** (bordures noires, fond à pois) ; cartes verrou / débloqué ; classe **`.new-juron`** + **`@keyframes flash-juron`** et **`vibration`** au clic.
- **TTS cartes** : réutilisation de **`speak()`** (même pile que le quiz : **`en-US`**, débit / hauteur identiques) ; clic **`onclick`** → **`window.speakJuronFromId(id)`** → **`speak(row.en)`** ; clavier (Enter / espace) appelle **`speak(row.en)`** directement — geste utilisateur sans **`setTimeout`** autour de la synthèse.

### Mobile — quiz
- **Mode** : bandeau **`#mode-tag`** en flux (**`top: 0`**, marge sous le tag) pour ne plus recouvrir le mot ; **`.quiz-section`** en colonne centrée.
- **Saisie** : **`input`** pleine largeur utile, **`box-sizing`**, marges auto pour centrage cohérent sur **≤600px**.

## v4.8 — 02/05/2026

### Vocabulaire (`vocabulaire.html` / `.css` / `.js`)
- **Zone Objectifs** : pastilles **~40px** avec **anneau de progression SVG**, disposition **compacte** (toolbar 🎯 + réservoir fusionné + Grimoire), libellés courts, **focus** sur l’objectif le plus avancé (pulse). Mobile : bulles **28px** dans la colonne étroite.
- **Maîtrise totale** (colonne droite) : bandeau **ultra-compact** — `Maîtrise` + **%** + barre fine + **delta jour** (`+n%` / `−n%` / `·`), détail en **infobulle**. Stats **`masteryBaselineDate`**, **`masteryBaselinePercent`**, **`masterySnapshotEod`** + **`persistStatsOnly()`** pour suivre la progression sur la journée.
- **Reset** : **double confirmation** avec rappel du contenu effacé et **recommandation d’exporter** avant.

### Verbes (`verbes.html`)
- **Gamification** : **XP** + niveau joueur (barre), **combo** de session (pastille), **toasts** (objectif quotidien, combo, verbe **Acquis**, niveau joueur), animation courte sur bonne réponse, pastille volume **dorée** quand l’objectif du jour est atteint, modes quiz **colorés**. Stats étendues (**`sessionCombo`**, **`bestSessionCombo`**, **`xp`**, **`playerLevel`**) avec fusion **`mergeVerbStats`**.
- **Reset** : même logique **double confirmation** + export recommandé.

### Onboarding (vocabulaire + verbes)
- Nouvelle clé **`learnEnglish_vocab_onboarding_v2`** / **`learnEnglish_verbs_onboarding_v2`** (script `<head>` aligné) : contenu recentré sur la **répétition quotidienne**, la métaphore des **boîtes** jusqu’à **Maître** (vocab) / **Acquis** (verbes), la **première connexion** (packs A1–C2 avec **repères scolaires indicatifs**, liste officielle verbes), et la **sauvegarde régulière** (données **navigateur**).

## v4.7 — 01/05/2026

### Données vocabulaire (A1–C2)
- Champ optionnel **`guide`** : précision **en français uniquement**, sans exemple anglais ni mot anglais attendu — elle oriente sur le sens (article vs nombre, nature du mot, faux ami…) pour ne pas tricher avec la réponse.
- Fichier des indices détaillés : **`scripts/explicit-guides-fr-only.mjs`** (importé par `add-word-guides.mjs`).
- **Sauvegarde** des JSON d’origine : `data/backup-pre-guide-2026-05-01/`.
- Script de régénération / mise à jour des guides : **`scripts/add-word-guides.mjs`** (`node scripts/add-word-guides.mjs`).

### Appli (`vocabulaire.html` / `.css` / `.js`)
- **Onboarding vocabulaire** : voir **v4.8** (clé **`learnEnglish_vocab_onboarding_v2`**). Ancienne clé **`v1`** obsolète pour le masquage automatique.
- Bloc **`#word-guide`** sous le mot affiché ; masqué s’il n’y a pas de précision.
- Import en masse : format **`Anglais, Français`** ou **`Anglais, Français ||| précision`** (trois barres verticales).
- Chargement des packs CECRL depuis **`data/`** : les lignes collées dans la zone d’import incluent la précision quand elle existe.

## v4.6 — 01/05/2026

### Hub & onboarding (`index.html`)
- **Onboarding** au premier lancement : **5 écrans** (hub, vocabulaire, verbes, ressources externes, données locales), navigation **Suivant / Précédent**, **Passer** et **Commencer** sur la dernière étape.
- **Mémorisation** : `localStorage` **`learnEnglish_onboarding_v1`** ; script dans le **`<head>`** + classe **`onboarding-done`** sur `<html>` pour éviter un flash chez les utilisateurs déjà passés.
- Lien **« Revoir l’introduction »** en pied de page (réinitialise la clé et rouvre le flux).
- **Corrections** : suppression d’un **`<a>`** erroné dans le **`<head>`** et d’un **doublon** de balise **`viewport`**.
- Liens externes BBC / News in Levels : **`rel="noopener noreferrer"`**.

### PWA (`manifest.json`)
- **`start_url`** : **`index.html`** (ouverture sur le hub et prise en compte de l’onboarding à la première utilisation).

## v4.5 — 29/04/2026

### Thème
- **Thème par défaut** : **Grimoire (Sombre)** (`skin-dark`) à la place du thème clair pour les nouvelles sessions / valeurs manquantes.
- Repli **`stats.currentTheme`** (init du sélecteur, export) aligné sur **`skin-dark`**.

### Données (vocabulaire CECRL)
- Correction d’**encodage** (mojibake UTF-8 / Latin-1) sur les champs **`fr`** des listes **A1 à C2** (`data/*.json`).
- Script **`scripts/fix-json-encoding.mjs`** : traiter tout le dossier par défaut, ou cibler des fichiers (`node scripts/fix-json-encoding.mjs B1 C2`).

## v4.4 — 28/04/2026

### Feedback jeu (mot validé)
- **Plus de texte flottant** à chaque bon mot (moins envahissant). Conservé : **`pendingLevelFlash`** sur la case de niveau à droite, sons et message dans la zone feedback.
- L’effet « machine à sous » ne s’applique plus qu’au **déblocage d’un badge** (voir ci-dessous).

### Objectifs (slots)
- **Compteurs dynamiques** sous chaque badge d’objectif : `sessionCombo / cible` (combo) et `mots justes du jour / cible` (words).
- Remplacement de l’ancien **flash** de changement d’objectif par une apparition **élastique** (classe **`new-objective-bounce`**) + **arpège bref** (`playNewObjectiveTargetSound`) quand la cible change.
- **Combo perdu** (erreur sans bouclier) : `sessionCombo` à 0, **`updateBadgeSystem`** appelé tout de suite, **vibration rouge** sur le compteur combo (`counter-reset-shake`).
- Nettoyage : suppression de `lastObjectiveComboId` / `lastObjectiveWordsId`, de `flashIfChanged`, et des styles **`objective-flash`**.

### Badges — feedback déblocage
- Appel type **`spawnFloatingText(… DÉBLOQUÉ !, var(--gold), opts)`** : **jitter** aléatoire **±30 px** / **±20 px** ; si **plusieurs badges** en une fois, **décalage 300 ms** entre chaque popup + flash grimoire associé.
- **`spawnFloatingText`** : paramètre optionnel **`{ maxJitterX, maxJitterY }`** ; élément retiré du DOM après **800 ms**.

### Texte flottant (animation)
- **`floatUp` en 0,8 s** (disparition rapide) + **dérive horizontale** légère dans les keyframes ; lueur conservée. Variante **+1 bouclier** (`shield-plus`) alignée sur **0,8 s** ; **`spawnFloatingTextFromElement`** supprime le nœud à **800 ms** aussi.

### Mobile — lien Aide / Tuto
- Lien **❓ Aide** dans la **zone admin** (avec import / thème) ; sur **≤600px**, grille **quiz pleine largeur en haut**, puis colonnes objectifs / niveaux, puis **admin**.

## v4.3 — 27/04/2026

### Badges / Objectifs
- Flash au gain d’un badge : **1 seul flash** + **texte “débloqué” qui pop**, puis état stable.
- Suppression du **clignotement permanent** des badges gagnés (plus d’animation infinie sur les badges `unlocked`).

### Grimoire
- Affichage complet de tous les badges, avec mise en évidence des badges débloqués.
- Flash appliqué uniquement au **badge nouvellement débloqué** dans le grimoire (classe temporaire).

### Libellés
- Harmonisation des noms de combos : **“Combo x2 / x3 / x5 / x10 / x20”**.

## v4.1 — "Mobile First & Dual-View"

### Expérience Smartphone
- Layout "manette de jeu" : boutons **Indice** et **Bouclier** juste sous le champ de saisie.
- HUD compact façon RPG (chrono, combo, total, niveau sur une seule ligne).
- Clavier persistant : focus optimisé entre deux mots.
- Anti-triche : désactivation forcée autocorrection / prédiction.

### Expérience Ordinateur
- Responsive : conservation de l’affichage large sur PC.
- Fusion des styles : un seul fichier gère les deux affichages.

### Corrections
- Fix synthèse vocale : réveil du moteur audio au premier clic (mobile).
- Préparation PWA : `manifest.json` pour installation sur écran d’accueil.

## v3.2 — "Le Caméléon"

### Skins & cosmétiques
- Moteur de thèmes dynamique : sélecteur de skins + bouton **Appliquer**.
- 7 univers visuels : Studio Ghibli, So British, Canadian, Rap Français, Barbiecore, Windows 95, Cyberpunk/Arcade.

### Technique
- Variabilisation : polices, arrondis et bordures s’adaptent au thème.
- Anti-conflit : nettoyage des anciens thèmes avant application.

## v3.1.5

### Corrections
- Fix erreurs de syntaxe bloquantes (formatage commentaires, accolade orpheline).
- Fix plantage export (suppression code dupliqué).
- Fix attribut HTML affectant l’affichage du badge “50 mots”.

### Architecture / optimisation
- Encapsulation globale du script (IIFE) pour isoler les variables.
- Exposition publique limitée : seule `loadPreset` reste accessible pour le HTML.

### Gameplay / interface
- Bonus de régularité : gains d’XP progressifs à chaque dizaine de mots justes quotidiens.
- Bonus au déblocage d’un badge : +25 XP immédiat.
- Récompenses de niveau : +3 indices et +1 bouclier à chaque niveau.
- Logique session : “Combo Max” et “Effort” réinitialisés au rechargement (défi renouvelé).
- Libellés : remplacement de “par jour” par “par session”.

## v3.1.4

### Corrections
- Correction de la “célébration fantôme” : file d’attente (`celebrationQueue`) + verrou (`isCelebrationRunning`) pour éviter le chevauchement.

### Améliorations
- Séquençage fluide et asynchrone des célébrations (badges / niveaux / fin de session).

## v3.1.3

### Ajouts (concept / direction)
- Système d’XP et niveaux du joueur (progression globale).
- Indice + bouclier de combo (jokers / protection de série).

## v3.1.2
- Tolérance de saisie : 1 faute de frappe admise.

## v3.1.1

### Audio / feedback
- Son de succès : tonalité qui monte avec le combo + note harmonique au-delà de 3.
- Son d’erreur adouci : grave, court, non frustrant.
- Fanfare épique pour les célébrations (arpège Do–Mi–Sol–Do).
- Web Audio API : génération en temps réel, sans fichiers audio externes.
- Synchronisation audio + synthèse vocale (Ding → prononciation).

## v2.3

### Progression “Soft-Reset”
- Un mot ne repart plus systématiquement au niveau 0 en cas d’erreur.
- Descente progressive : perte d’un seul niveau.
- Révision rapide : reprogrammation dès le lendemain.
- Maintien du réservoir : le mot reste dans “À CORRIGER”.

### Badges (suivi en temps réel)
- Jauges de progression : remplissage type sablier selon les stats.
- États : vide / en cours (violet) / débloqué (doré + célébration).
- Application aux records de combo, volume quotidien, et jours consécutifs.

## v2.2

### Interface
- Lisibilité : correction du menu de durée (chiffres visibles).
- Contraste : compteur section “Master” (texte blanc sur fond vert).

### Progression & badges
- Streaks : activation du calcul des jours consécutifs.
- Fix : déblocage badges “Régularité” (1J à 30J) qui restaient grisés.

### Technique
- Sync : mise à jour des badges à chaque rafraîchissement UI.
- Persistance : optimisation sauvegarde des stats en local.

### Visuel & feedback
- Flash : animation sur la case Combo à chaque bonne réponse.
- Flash vert : sur la case Master quand un mot atteint le niveau 7.
- Libellés : “Effort” → “Effort (Quotidien)” pour clarifier la réinitialisation journalière.

