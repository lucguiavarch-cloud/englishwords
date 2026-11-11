-- Synchro cloud optionnelle (voir README.md, section « Synchro cloud »).
-- À exécuter une fois dans Supabase : Dashboard > SQL Editor > New query > Run.

create table if not exists public.user_data (
    user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
    kind       text        not null,  -- vocab_dict | vocab_stats | verbs_dict | verbs_stats
    payload    jsonb       not null,
    updated_at timestamptz not null default now(),
    primary key (user_id, kind)
);

-- updated_at est toujours fixé par le serveur (évite les horloges d'appareils décalées).
create or replace function public.user_data_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists user_data_touch on public.user_data;
create trigger user_data_touch
    before insert or update on public.user_data
    for each row execute function public.user_data_touch();

-- Row Level Security : chaque utilisateur ne voit et ne modifie que ses propres lignes.
alter table public.user_data enable row level security;

drop policy if exists "user_data_select_own" on public.user_data;
create policy "user_data_select_own" on public.user_data
    for select to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "user_data_insert_own" on public.user_data;
create policy "user_data_insert_own" on public.user_data
    for insert to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "user_data_update_own" on public.user_data;
create policy "user_data_update_own" on public.user_data
    for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "user_data_delete_own" on public.user_data;
create policy "user_data_delete_own" on public.user_data
    for delete to authenticated
    using ((select auth.uid()) = user_id);

revoke all on public.user_data from anon;
grant select, insert, update, delete on public.user_data to authenticated;
