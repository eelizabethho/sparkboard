-- Vertical focal point of the cover image, in percent (0 = top, 100 = bottom). Used as CSS object-position.
alter table public.ideas add column if not exists cover_y smallint not null default 50 check (cover_y between 0 and 100);
