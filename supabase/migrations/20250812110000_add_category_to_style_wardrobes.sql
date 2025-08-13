-- Add category column to style_wardrobes
-- Nullable free-text field for now

alter table if exists public.style_wardrobes
  add column if not exists category text;

comment on column public.style_wardrobes.category is 'Free-text category for wardrobe (e.g., Professional, Smart Casual)';


