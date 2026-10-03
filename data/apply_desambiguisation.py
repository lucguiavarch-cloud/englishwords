import json
import os

# Dictionnaire de désambiguïsation existant (extrait du script original)
desambiguisation = {
    "ability": "capacité (compétence / aptitude)",
    "about": "à propos (sujet) / environ (quantité)",
    "access": "accéder (verbe) / accès (nom)",
    "account": "compte (bancaire / utilisateur)",
    "act": "acte (nom) / agir (verbe)",
    "address": "adresse (lieu) / s'adresser (verbe)",
    "advance": "avance (progrès / anticipation)",
    "arm": "bras (anatomie)",
    "arms": "bras (anatomie) / armes (militaire)",
    "balance": "équilibre (stabilité) / solde (finance)",
    "band": "groupe (musique) / bande",
    "bank": "banque (finance) / rive (cours d'eau)",
    "bar": "bar (lieu) / barre (objet)",
    "base": "base (fondement) / base (lieu)",
    "bear": "ours (animal) / supporter (verbe)",
    "beat": "battre (frapper/vaincre) / rythme",
    "bill": "facture (paiement) / billet (monnaie) / loi",
    "block": "bloc (objet) / bloquer (verbe)",
    "board": "conseil (comité) / tableau",
    "book": "livre (lecture) / réserver (verbe)",
    "boot": "botte (chaussure) / coffre (voiture)",
    "bowl": "bol (récipient)",
    "box": "boîte (contenant)",
    "branch": "bifurquer (verbe) / branche (arbre/entreprise)",
    "camp": "camp (lieu) / camper (verbe)",
    "can": "pouvoir (verbe) / canette (boîte)",
    "capital": "capital (argent) / capitale (ville)",
    "card": "carte (jeu/identité/bancaire)",
    "case": "cas (situation) / affaire (justice)",
    "cell": "cellule (biologie/prison)",
    "center": "centre (milieu/institution)",
    "chair": "chaise (meuble) / président (réunion)",
    "champion": "champion (sportif) / défendre (cause)",
    "chance": "chance (opportunité/hasard)",
    "change": "changement (évolution) / monnaie",
    "character": "personnage (histoire) / caractère (personnalité)",
    "charge": "charge (responsabilité/électrique) / faire payer",
    "chart": "graphique (diagramme)",
    "check": "vérifier (verbe) / chèque (paiement) / addition",
    "chest": "poitrine (anatomie) / coffre (meuble)",
    "club": "club (association) / massue",
    "coach": "entraîneur (sport) / car (transport)",
    "coast": "côte (littoral)",
    "coat": "manteau (vêtement) / couche (peinture)",
    "code": "code (règle/informatique)",
    "complex": "complexe (compliqué/bâtiment)",
    "condition": "condition (état/exigence)",
    "contract": "contracter (verbe) / contrat (nom)",
    "control": "contrôle (maîtrise/vérification)",
    "count": "compter (verbe) / comte (titre)",
    "course": "cours (leçon) / cap (trajet)",
    "court": "tribunal (justice) / court (sport)",
    "cover": "couverture (protection) / couvrir (verbe)",
    "cross": "croix (symbole) / traverser (verbe)",
    "current": "actuel (présent) / courant (eau/électricité)",
    "custom": "coutume (tradition) / douane",
    "date": "date (jour) / rendez-vous",
    "deal": "accord (marché) / distribuer (cartes)",
    "degree": "degré (température/angle) / diplôme",
    "desert": "désert (lieu) / déserter (verbe)",
    "design": "conception (dessin/plan)",
    "diet": "régime (alimentation)",
    "direction": "direction (sens/gestion)",
    "dish": "plat (nourriture) / vaisselle",
    "draft": "brouillon (texte) / courant d'air / repêchage",
    "draw": "dessiner (art) / tirer (tirage) / match nul",
    "drill": "perceuse / exercice (entraînement)",
    "drive": "conduire (véhicule) / lecteur (informatique)",
    "drop": "baisse (chute) / goutte / laisser tomber",
    "duty": "devoir (obligation) / taxe (douane)",
    "earth": "Terre (planète) / terre (sol)",
    "edge": "bord (limite) / avantage",
    "end": "fin (conclusion) / extrémité",
    "engage": "s'engager (participer) / fiancer",
    "even": "même (adverbe) / pair (nombre)",
    "exercise": "exercice (physique/scolaire)",
    "express": "exprimer (verbe) / exprès (rapide)",
    "face": "affronter (verbe) / visage (nom)",
    "fair": "équitable (juste) / foire (événement)",
    "fall": "automne (saison) / chute (nom) / tomber (verbe)",
    "fan": "ventilateur (appareil) / fan (admirateur)",
    "fast": "rapide (vitesse) / jeûne (alimentation)",
    "fault": "faute (erreur) / faille (géologie)",
    "figure": "chiffre (nombre) / figure (silhouette)",
    "file": "déposer (verbe) / fichier (document) / lime",
    "fine": "bien (état) / amende (pénalité) / fin (texture)",
    "firm": "ferme (solide/entreprise)",
    "fit": "ajuster (taille) / en forme (santé)",
    "flat": "plat (forme) / appartement (logement)",
    "fold": "pli (nom) / plier (verbe)",
    "force": "forcer (verbe) / force (nom)",
    "form": "formulaire (document) / forme (apparence)",
    "game": "jeu (divertissement) / gibier (chasse)",
    "gas": "gaz (état) / essence (carburant)",
    "glass": "verre (matière/récipient) / lunettes",
    "grave": "tombe (lieu) / grave (sérieux)",
    "ground": "sol (terre) / moulu (café)",
    "guide": "guide (personne/livre)",
    "head": "tête (corps) / diriger (verbe)",
    "interest": "intérêt (curiosité/finance)",
    "issue": "problème (sujet) / numéro (publication)",
    "jam": "confiture (nourriture) / embouteillage (trafic)",
    "just": "juste (équitable/seulement)",
    "key": "clé (outil/solution) / touche (clavier)",
    "kind": "gentil (aimable) / sorte (type)",
    "last": "dernier (ordre) / durer (verbe)",
    "lead": "plomb (métal) / mener (verbe)",
    "leave": "partir (verbe) / congé (nom)",
    "left": "gauche (direction) / laissé (participe)",
    "letter": "lettre (alphabet/courrier)",
    "lie": "mensonge (nom) / mentir (verbe) / s'allonger (verbe)",
    "light": "lumière (éclairage) / léger (poids)",
    "like": "comme (comparaison) / aimer (verbe)",
    "line": "doubler (vêtement) / ligne (trait/file)",
    "match": "correspondre (verbe) / match (sport) / allumette",
    "mean": "signifier (verbe) / méchant (adjectif) / moyenne (maths)",
    "mine": "le mien (pronom) / mine (extraction)",
    "minute": "minute (temps) / minuscule (taille)",
    "miss": "manquer (verbe) / mademoiselle (titre)",
    "model": "modèle (exemple) / mannequin (personne)",
    "monitor": "moniteur (écran) / surveiller (verbe)",
    "nail": "clou (outil) / ongle (anatomie)",
    "novel": "roman (livre) / original (nouveau)",
    "objective": "objectif (but) / objectif (impartial)",
    "odd": "impair (nombre) / étrange (bizarre)",
    "office": "bureau (pièce/entreprise)",
    "order": "commande (achat) / ordre (arrangement/instruction)",
    "organ": "organe (corps) / orgue (instrument)",
    "park": "parc (lieu) / se garer (verbe)",
    "part": "partie (morceau) / rôle (théâtre)",
    "party": "faire la fête (verbe) / fête (événement) / parti (politique)",
    "pass": "passer (verbe) / col (montagne) / laissez-passer",
    "patient": "patient (malade) / patient (calme)",
    "pattern": "modèle (motif/structure)",
    "pen": "stylo (écriture) / enclos (animaux)",
    "period": "période (temps) / point (ponctuation)",
    "pilot": "pilote (avion) / pilote (essai TV)",
    "pitch": "terrain (sport) / ton (voix) / lancer (verbe)",
    "plane": "avion (transport) / plan (surface)",
    "plant": "usine (industrie) / plante (végétal)",
    "play": "jouer (verbe) / pièce de théâtre (nom)",
    "plot": "parcelle (terrain) / intrigue (histoire) / complot",
    "point": "indiquer (verbe) / point (nom)",
    "pool": "piscine (eau) / billard (jeu)",
    "port": "port (bateaux) / bâbord (gauche)",
    "post": "poste (courrier/emploi) / publier (verbe)",
    "pound": "livre (poids/monnaie)",
    "present": "présent (temps/cadeau) / présenter (verbe)",
    "press": "presse (média/machine) / appuyer (verbe)",
    "prime": "prime (nom) / premier (principal/nombre)",
    "produce": "produire (verbe) / produits frais (fruits/légumes)",
    "program": "programme (logiciel/plan/émission)",
    "project": "projet (plan) / projeter (verbe)",
    "race": "course (sport) / race (biologie)",
    "record": "enregistrer (verbe) / record (exploit) / disque",
    "rent": "louer (verbe) / loyer (nom)",
    "reserve": "réserve (stock/nature) / réserver (verbe)",
    "rest": "repos (détente) / reste (excédent)",
    "right": "droite (direction) / droit (justice/raison)",
    "ring": "anneau/bague (bijou) / sonner (verbe)",
    "rock": "rocher (pierre) / rock (musique)",
    "roll": "rouler (verbe) / rouleau (nom)",
    "root": "racine (plante/origine)",
    "round": "rond (forme) / tournée (boissons) / round (boxe)",
    "row": "rangée (ligne) / ramer (verbe) / dispute",
    "rule": "règle (loi/instrument) / diriger (verbe)",
    "run": "courir (sport) / diriger (entreprise)",
    "safe": "sûr (sécurité) / coffre-fort (objet)",
    "scale": "échelle (mesure/taille) / balance (poids) / écaille",
    "screen": "écran (affichage) / tamis",
    "season": "saison (temps) / assaisonner (verbe)",
    "second": "deuxième (ordre) / seconde (temps)",
    "sentence": "phrase (grammaire) / peine (justice)",
    "set": "ensemble (groupe) / régler (verbe) / plateau (tournage)",
    "shade": "ombre (protection du soleil) / nuance (couleur)",
    "shake": "secouer (verbe) / tremblement (nom)",
    "sheet": "feuille (papier) / drap (lit)",
    "shell": "coquille (animal) / obus (arme)",
    "shift": "changement (déplacement) / quart de travail (équipe)",
    "ship": "bateau (navire) / expédier (verbe)",
    "shoot": "tirer (arme) / tourner (film) / pousse (plante)",
    "shop": "boutique (magasin) / faire les courses (verbe)",
    "sign": "signe (marque) / panneau (route) / signer (verbe)",
    "sink": "couler (verbe) / évier (cuisine)",
    "slip": "glisser (verbe) / lapsus (erreur)",
    "smart": "intelligent (esprit) / élégant (apparence)",
    "sound": "son (bruit) / solide (état)",
    "space": "espace (univers/lieu)",
    "spell": "épeler (verbe) / sortilège (magie)",
    "spirit": "esprit (âme) / alcool (fort)",
    "spot": "place (endroit) / tache (marque) / repérer (verbe)",
    "spring": "printemps (saison) / ressort (objet) / source (eau)",
    "square": "carré (forme) / place (ville)",
    "stage": "scène (théâtre) / étape (phase)",
    "stamp": "timbre (poste) / tampon (encre)",
    "stand": "rester debout (verbe) / stand (kiosque) / supporter (verbe)",
    "star": "étoile (astre) / vedette (célébrité)",
    "state": "État (gouvernement) / état (condition) / déclarer (verbe)",
    "step": "étape (phase) / pas (marche)",
    "stick": "bâton (bois) / coller (verbe)",
    "still": "toujours (encore) / immobile (sans bouger)",
    "stock": "action (finance) / stock (marchandise) / bouillon (cuisine)",
    "store": "magasin (boutique) / stocker (verbe)",
    "story": "histoire (récit) / étage (bâtiment)",
    "strike": "grève (travail) / frapper (verbe)",
    "string": "ficelle/chaîne (fil/corde)",
    "study": "étude (apprentissage) / bureau (pièce)",
    "subject": "sujet (thème/personne) / matière (école)",
    "suit": "costume (vêtement) / convenir (verbe)",
    "table": "tableau (données) / table (meuble)",
    "tank": "réservoir (contenant) / char (militaire)",
    "tape": "ruban adhésif / cassette (audio/vidéo)",
    "tear": "larme (pleur) / déchirer (verbe)",
    "term": "terme (mot/délai) / trimestre (école)",
    "test": "test (examen) / tester (verbe)",
    "tie": "cravate (vêtement) / attacher (verbe) / match nul (sport)",
    "till": "jusqu'à (temps) / caisse (magasin) / labourer (verbe)",
    "time": "temps (durée) / heure / fois (occurrence)",
    "tip": "conseil (astuce) / pourboire (argent) / bout (extrémité)",
    "title": "titre (nom/livre) / titre (sport)",
    "tone": "tonifier (muscle) / ton (voix/couleur)",
    "tool": "outil (instrument)",
    "top": "haut (sommet) / toupie (jouet)",
    "touch": "touche (bouton) / toucher (verbe) / contact",
    "track": "piste (chemin) / suivre (verbe)",
    "trade": "commerce (échange) / métier",
    "train": "former (verbe) / train (transport)",
    "trip": "voyage (trajet) / trébucher (verbe)",
    "tube": "tube (cylindre) / métro (Londres)",
    "turn": "tourner (verbe) / tour (action)",
    "type": "taper (clavier) / type (genre)",
    "value": "valeur (prix/importance) / estimer (verbe)",
    "van": "van (fourgonnette)",
    "watch": "montre (objet) / regarder (verbe)",
    "water": "eau (liquide) / arroser (verbe)",
    "wave": "vague (eau) / faire signe (verbe)",
    "way": "chemin (direction) / façon (manière)",
    "well": "bien (état) / puits (eau)",
    "wind": "vent (météo) / remonter (mécanisme)",
    "wood": "bois (matière) / bois (forêt)",
    "word": "mot (langage) / parole",
    "work": "travail (emploi) / œuvre (art) / fonctionner",
    "yard": "cour (espace) / yard (mesure)"
}

def apply_desambiguisation_to_file(input_file):
    """
    Applique le dictionnaire de désambiguïsation à un fichier JSON.
    Ajoute le champ 'guide' pour les mots qui sont dans le dictionnaire.
    """
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        guides_ajoutes = 0
        
        # Supporter différents formats de JSON
        if isinstance(data, list):
            items = data
        elif isinstance(data, dict) and "mots" in data:
            items = data["mots"]
        elif isinstance(data, dict):
            items = [data]
        else:
            print(f"Format non reconnu dans {input_file}")
            return
        
        for item in items:
            if "en" in item and "fr" in item:
                mot_anglais = item["en"]
                if mot_anglais in desambiguisation and "guide" not in item:
                    item["guide"] = desambiguisation[mot_anglais]
                    guides_ajoutes += 1
                    print(f"  '{mot_anglais}' -> guide: '{desambiguisation[mot_anglais]}'")
        
        with open(input_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"\n[OK] {input_file} traite avec succes !")
        print(f"   {guides_ajoutes} guides ajoutes\n")
        
    except FileNotFoundError:
        print(f"[ERREUR] Le fichier {input_file} est introuvable.")
    except Exception as e:
        print(f"[ERREUR] lors du traitement de {input_file}: {e}")

def process_directory(directory):
    """
    Traite tous les fichiers JSON CEFR dans un répertoire.
    """
    print(f"Traitement du repertoire: {directory}\n")
    
    cecr_files = ["A1.json", "A2.json", "B1.json", "B2.json", "C1.json", "C2.json"]
    delta_files = ["delta/A1.json", "delta/A2.json", "delta/B1.json", "delta/B2.json", "delta/C1.json", "delta/C2.json"]
    
    all_files = cecr_files + delta_files
    
    for filename in all_files:
        input_path = os.path.join(directory, filename)
        if os.path.exists(input_path):
            print(f"Traitement de {filename}...")
            apply_desambiguisation_to_file(input_path)
        else:
            print(f"Fichier {filename} non trouve, ignore.")

# =========================================================
# CONFIGURATION
# =========================================================

print("=" * 60)
print("APPLICATION DES GUIDES DE DESAMBIGUISATION")
print("=" * 60)
print()

repertoire_data = r"C:\website\english-apps\learnenglish\data"
if os.path.exists(repertoire_data):
    process_directory(repertoire_data)
else:
    print(f"Repertoire data non trouve: {repertoire_data}")

print("\n" + "=" * 60)
print("TRAITEMENT TERMINE")
print("=" * 60)