-- Enable Supabase Realtime for wallet & deposit sync.
-- The app's useWalletRealtime hook subscribes to postgres_changes on
-- public.deposits (user's own rows) and public.profiles (own row) so the
-- balance updates instantly and the approval toast fires without a refresh.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'deposits'
  ) then
    alter publication supabase_realtime add table public.deposits;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

-- Ensure UPDATE events carry full row images for reliable payload reads.
alter table public.deposits replica identity full;
alter table public.profiles replica identity full;
