-- Ensure existing rows have a category, then enforce NOT NULL

update public.style_wardrobes
set category = 'Professional'
where category is null or trim(category) = '';

alter table if exists public.style_wardrobes
  alter column category set not null;


