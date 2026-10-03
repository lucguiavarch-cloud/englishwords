import json
import os
import re

def extract_guide_from_french(french_text):
    """
    Extrait le guide (contexte) du texte français et retourne
    la traduction principale et le guide séparément.
    
    Exemples:
    "un (article)" -> ("un", "article")
    "capacité (compétence)" -> ("capacité", "compétence")
    "à propos (sujet)" -> ("à propos", "sujet")
    """
    # Pattern pour capturer le texte entre parenthèses
    match = re.search(r'\s*\(([^)]+)\)', french_text)
    if match:
        guide = match.group(1).strip()
        # Retirer les parenthèses et leur contenu du texte principal
        main_text = re.sub(r'\s*\([^)]+\)', '', french_text).strip()
        return main_text, guide
    return french_text, None

def process_json_file(input_file, output_file=None):
    """
    Traite un fichier JSON pour séparer les guides des traductions françaises.
    """
    if output_file is None:
        output_file = input_file
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        mots_modifies = 0
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
            if "fr" in item:
                old_fr = item["fr"]
                new_fr, guide = extract_guide_from_french(old_fr)
                
                if guide:
                    item["fr"] = new_fr
                    item["guide"] = guide
                    mots_modifies += 1
                    guides_ajoutes += 1
                    print(f"  '{old_fr}' -> '{new_fr}' (guide: '{guide}')")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"\n[OK] {input_file} traite avec succes !")
        print(f"   {mots_modifies} mots modifies")
        print(f"   {guides_ajoutes} guides ajoutes")
        print(f"   Sauvegarde dans: {output_file}\n")
        
    except FileNotFoundError:
        print(f"[ERREUR] Le fichier {input_file} est introuvable.")
    except Exception as e:
        print(f"[ERREUR] lors du traitement de {input_file}: {e}")

def process_directory(directory, pattern="*.json"):
    """
    Traite tous les fichiers JSON correspondant au pattern dans un répertoire.
    """
    print(f"Traitement du repertoire: {directory}\n")
    
    for filename in os.listdir(directory):
        if filename.endswith('.json') and filename != 'desambiguise_to_guide.py':
            input_path = os.path.join(directory, filename)
            print(f"Traitement de {filename}...")
            process_json_file(input_path)
    
    print("Tous les fichiers JSON du repertoire ont ete traites !")

# =========================================================
# CONFIGURATION
# =========================================================

# 1. Traiter le fichier de l'utilisateur
print("=" * 60)
print("DESAMBIGUISATION - SEPARATION FR/GUIDE")
print("=" * 60)
print()

fichier_utilisateur = r"C:\Users\lucgu\Documents\luc_vocab_desambiguise.json"
if os.path.exists(fichier_utilisateur):
    print("Traitement du fichier utilisateur...")
    process_json_file(fichier_utilisateur)
else:
    print(f"Fichier utilisateur non trouve: {fichier_utilisateur}")

# 2. Traiter tous les fichiers JSON du dossier data/
repertoire_data = r"C:\website\english-apps\learnenglish\data"
if os.path.exists(repertoire_data):
    print("\n" + "=" * 60)
    print("TRAITEMENT DES FICHIERS DATA/")
    print("=" * 60)
    print()
    process_directory(repertoire_data)
else:
    print(f"Repertoire data non trouve: {repertoire_data}")

print("\n" + "=" * 60)
print("TRAITEMENT TERMINE")
print("=" * 60)