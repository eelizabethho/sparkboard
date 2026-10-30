-- Block-editor document (BlockNote JSON). `body` keeps a markdown copy for older posts and fallback.
alter table public.ideas add column if not exists content jsonb;
