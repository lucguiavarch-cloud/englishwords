"""
Enrichissement du vocabulaire avec un champ "context" généré par LLM.

Pour chaque entrée {"en", "fr", ...}, ajoute :
    "context": "2 à 3 mots-clés français décrivant la nuance de la paire"

Variables d'environnement :
    LLM_API_KEY   (obligatoire) : clé API du fournisseur
    LLM_BASE_URL  (optionnel)  : défaut https://api.openai.com/v1
    LLM_MODEL     (optionnel)  : défaut gpt-4o-mini
    BATCH_SIZE    (optionnel)  : défaut 40

Le script est idempotent : les entrées possédant déjà "context" sont ignorées
et la progression est sauvegardée après chaque lot dans words_enriched.json.
"""

import json
import os
import sys
import time
from pathlib import Path

import requests

DATA_DIR = Path(__file__).resolve().parent
INPUT_FILE = DATA_DIR / "luc_vocab.json"
OUTPUT_FILE = DATA_DIR / "words_enriched.json"
TMP_FILE = OUTPUT_FILE.with_suffix(".json.tmp")

API_KEY = os.environ.get("LLM_API_KEY", "").strip()
BASE_URL = os.environ.get("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
MODEL = os.environ.get("LLM_MODEL", "gpt-4o-mini")
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "40"))
MAX_RETRIES = 6

SYSTEM_PROMPT = (
    "Tu es un lexicographe français. Pour chaque paire (id, en, fr), produis un "
    "champ 'context' : 2 ou 3 mots-clés français maximum (ou une locution courte) "
    "qui précisent la nuance EXACTE du mot anglais dans cette traduction. "
    "Règles impératives : ne jamais répéter le mot français 'fr' ; ne jamais "
    "mettre de mot anglais ; pas de phrase complète. Exemple : heat/chaleur -> "
    "'température, canicule' ; warmth/chaleur -> 'accueil, bienveillance' ; "
    "spring/printemps -> 'saison, fleurs'."
)

USER_TEMPLATE = (
    "Entrées (JSON) :\n{items}\n\n"
    "Réponds UNIQUEMENT avec un objet JSON strict de la forme "
    '{{"results":[{{"id":<id>,"context":"<2-3 mots-clés>"}}]}} '
    "avec exactement un résultat par id fourni."
)


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def get_items(data):
    return data["mots"] if isinstance(data, dict) and "mots" in data else data


def save_progress(data):
    TMP_FILE.write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    TMP_FILE.replace(OUTPUT_FILE)


def call_llm(batch):
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": USER_TEMPLATE.format(
                items=json.dumps(
                    [{"id": i, "en": w["en"], "fr": w["fr"]}
                     for i, w in batch],
                    ensure_ascii=False,
                )
            )},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
    }
    headers = {"Authorization": f"Bearer {API_KEY}"}

    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.post(
                f"{BASE_URL}/chat/completions",
                json=payload,
                headers=headers,
                timeout=120,
            )
            if resp.status_code in (429, 500, 502, 503, 504):
                raise requests.HTTPError(f"HTTP {resp.status_code}", response=resp)
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            return {r["id"]: r["context"].strip()
                    for r in json.loads(content)["results"]}
        except (requests.RequestException, json.JSONDecodeError, KeyError) as e:
            wait = min(2 ** attempt * 2, 60)
            print(f"  Erreur ({e}), nouvel essai dans {wait}s "
                  f"({attempt + 1}/{MAX_RETRIES})")
            time.sleep(wait)
    return None


def main():
    if not API_KEY:
        sys.exit("ERREUR : définissez LLM_API_KEY.")

    data = load_json(OUTPUT_FILE if OUTPUT_FILE.exists() else INPUT_FILE)
    items = get_items(data)
    todo = [(i, w) for i, w in enumerate(items)
            if not str(w.get("context") or "").strip()]

    print(f"{len(items)} entrées, {len(todo)} à enrichir "
          f"(lots de {BATCH_SIZE}).")
    if not todo:
        print("Rien à faire, tout est déjà enrichi.")
        return

    errors = []
    for start in range(0, len(todo), BATCH_SIZE):
        batch = todo[start:start + BATCH_SIZE]
        results = call_llm(batch)
        if results is None:
            errors.extend(i for i, _ in batch)
            print(f"  LOT {start // BATCH_SIZE + 1} : ÉCHEC après retries")
        else:
            for i, word in batch:
                ctx = results.get(i, "").strip()
                if ctx:
                    word["context"] = ctx
                else:
                    errors.append(i)
        save_progress(data)
        print(f"  {min(start + BATCH_SIZE, len(todo))}/{len(todo)} traités")

    save_progress(data)
    done = len(items) - len(todo) + sum(
        1 for i, w in enumerate(items)
        if str(w.get("context") or "").strip() and i in dict(todo)
    )
    enriched = sum(1 for w in items if str(w.get("context") or "").strip())
    print(f"\nTerminé : {enriched}/{len(items)} entrées enrichies "
          f"dans {OUTPUT_FILE.name}")
    if errors:
        print(f"ATTENTION : {len(errors)} entrées sans contexte "
              f"(indices : {errors[:20]}...). Relancez le script.")


if __name__ == "__main__":
    main()
