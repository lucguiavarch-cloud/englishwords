// Copier ce fichier en `config.js` (non commité, voir .gitignore) puis renseigner
// les valeurs de Supabase : Dashboard > Project Settings > API.
// La clé « anon » / « publishable » est publique par conception : la sécurité
// repose sur la Row Level Security (supabase/schema.sql).
// Sans config.js, l'appli fonctionne normalement, sans synchro cloud.
window.EM_SYNC_CONFIG = {
    supabaseUrl: 'https://VOTRE-PROJET.supabase.co',
    supabaseAnonKey: 'VOTRE_CLE_ANON_OU_PUBLISHABLE'
};
