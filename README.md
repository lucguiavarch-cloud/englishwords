# English Learning Hub (learnenglish)

PWA 100 % HTML/JS (sans build) pour apprendre le vocabulaire anglais et les verbes irréguliers
en répétition espacée. Ouvrir `index.html` (ou servir le dossier : `python3 -m http.server 8000`).

Les données de progression sont enregistrées dans le navigateur (`localStorage`).
Voir [CHANGELOG.md](CHANGELOG.md) et [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md).

## Synchro cloud (optionnelle)

Le bouton **☁️ Synchro cloud** (pages Vocabulaire et Verbes) permet de se connecter par e-mail
(lien magique) pour sauvegarder la progression dans [Supabase](https://supabase.com) et la retrouver
sur un autre appareil. Sans configuration, le bouton n'apparaît pas et l'appli fonctionne comme avant.

- `localStorage` reste la source locale : tout fonctionne hors-ligne, le cloud n'est qu'une couche de
  sauvegarde / synchro (envoi automatique quelques secondes après chaque modification, au retour du réseau
  et à la réouverture de l'appli).
- Données synchronisées (table `user_data`, une ligne par type) :
  `vocab_dict` (`EM_ULTIMATE_TIME_V1`), `vocab_stats` (`EM_ULTIMATE_TIME_V1_STATS`),
  `verbs_dict` (`EM_VERBS_V17`), `verbs_stats` (`EM_VERBS_V17_STATS`).
- Fusion quand les deux côtés ont changé :
  - **listes de mots / verbes** : union des deux listes, et pour un mot présent des deux côtés on garde le
    **niveau le plus élevé** (puis le plus de réponses, puis la révision la plus tardive) ;
  - **stats** : premier branchement d'un appareil → la version du cloud gagne ; ensuite on garde la version
    avec le niveau joueur / XP le plus élevé.
  - Conséquence : un mot supprimé sur un appareil peut réapparaître s'il existe encore sur un autre.
- Si le cloud apporte des changements, la page se recharge automatiquement pour les afficher.
- « Reset » efface aussi la session de connexion de l'appareil ; les données du cloud ne sont pas supprimées
  (se reconnecter les restaure).

### Configuration (une fois)

1. Créer un projet gratuit sur <https://supabase.com>.
2. **SQL Editor** → coller le contenu de [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   Cela crée la table `user_data` (`user_id`, `kind`, `payload jsonb`, `updated_at`) avec la
   **Row Level Security** : chaque utilisateur ne peut lire / écrire que ses propres lignes.
3. **Réserver la synchro à vos comptes** (l'appli ne crée jamais de compte, même si l'appli est publique) :
   - **Authentication → Sign In / Providers** : vérifier que **Email** est activé et **décocher
     « Allow new users to sign up »** ;
   - **Authentication → Users → Add user → Create new user** : créer votre compte avec votre e-mail
     (cocher « Auto Confirm User »). Seules les adresses créées ici peuvent se connecter ; les autres
     visiteurs voient « adresse non autorisée ».
4. **Authentication → URL Configuration** :
   - *Site URL* : l'adresse où l'appli est publiée (ex. `https://<compte>.github.io/englishwords/`) ;
   - *Redirect URLs* : ajouter `https://<compte>.github.io/englishwords/**`
     (et `http://localhost:8000/**` pour tester en local).
5. *(Recommandé pour l'appli installée sur téléphone)* **Authentication → Emails → Magic Link** : ajouter
   `{{ .Token }}` dans le modèle d'e-mail pour recevoir aussi un **code à 6 chiffres**, à saisir dans l'appli
   si le lien s'ouvre dans un autre navigateur.
6. **Project Settings → API** : copier l'*URL du projet* et la clé *anon* (ou *publishable*).
7. Copier `config.example.js` en `config.js` à la racine et y coller ces deux valeurs :
   ```js
   window.EM_SYNC_CONFIG = {
       supabaseUrl: 'https://abcd1234.supabase.co',
       supabaseAnonKey: 'eyJhbGciOi...'
   };
   ```

`config.js` est ignoré par git (`.gitignore`). La clé *anon* est publique par conception (la sécurité repose
sur la RLS) : pour un site publié via GitHub Pages, on peut donc commiter `config.js` (retirer la ligne du
`.gitignore`), sinon le site en ligne n'aura pas la synchro.

La bibliothèque `@supabase/supabase-js` est chargée depuis le CDN jsDelivr (version figée + contrôle
d'intégrité SRI) uniquement si `config.js` est présent. Code : [`sync.js`](sync.js).
