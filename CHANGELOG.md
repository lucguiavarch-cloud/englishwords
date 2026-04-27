# Changelog

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

