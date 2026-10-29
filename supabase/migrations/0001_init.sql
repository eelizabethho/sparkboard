-- Sparkboard init. Paste into the Supabase SQL editor.
-- is_owner() holds Liz's auth user id (not secret).
-- Re-running is safe.

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  pitch text not null default '',
  body text not null default '',
  status text not null default 'spark'
    check (status in ('spark','exploring','building','shipped','shelved')),
  category text,
  tags text[] not null default '{}',
  links text[] not null default '{}',
  cover_url text,
  is_private boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists ideas_set_updated_at on public.ideas;
create trigger ideas_set_updated_at before update on public.ideas
  for each row execute function public.set_updated_at();

create or replace function public.is_owner() returns boolean
language sql stable as $$
  select auth.uid() = 'baf06dce-240c-4bcd-a9a2-6825c1eef09b'::uuid
$$;

alter table public.ideas enable row level security;

drop policy if exists "ideas select" on public.ideas;
create policy "ideas select" on public.ideas for select
  using (not is_private or public.is_owner());

drop policy if exists "ideas insert" on public.ideas;
create policy "ideas insert" on public.ideas for insert
  with check (public.is_owner());

drop policy if exists "ideas update" on public.ideas;
create policy "ideas update" on public.ideas for update
  using (public.is_owner()) with check (public.is_owner());

drop policy if exists "ideas delete" on public.ideas;
create policy "ideas delete" on public.ideas for delete
  using (public.is_owner());

-- Storage: public bucket for cover images (public buckets serve reads without a policy).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 5242880, array['image/*'])
on conflict (id) do nothing;

drop policy if exists "covers insert" on storage.objects;
create policy "covers insert" on storage.objects for insert
  with check (bucket_id = 'covers' and public.is_owner());

drop policy if exists "covers update" on storage.objects;
create policy "covers update" on storage.objects for update
  using (bucket_id = 'covers' and public.is_owner())
  with check (bucket_id = 'covers' and public.is_owner());

drop policy if exists "covers delete" on storage.objects;
create policy "covers delete" on storage.objects for delete
  using (bucket_id = 'covers' and public.is_owner());
