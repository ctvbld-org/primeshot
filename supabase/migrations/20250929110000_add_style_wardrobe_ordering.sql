-- Add per-style ordering fields for wardrobe categories and items
-- Safe to run multiple times due to IF NOT EXISTS guards

alter table public.styles
  add column if not exists wardrobe_category_order text[] not null default '{}'::text[];

alter table public.styles
  add column if not exists wardrobe_order jsonb not null default '{}'::jsonb;

comment on column public.styles.wardrobe_category_order is
  'Preferred category display order for this style (e.g., ["Professional","Smart Casual"]).';

comment on column public.styles.wardrobe_order is
  'Per-category wardrobe ordering map, e.g. {"Professional":["suit","blazer"],"Smart Casual":["polo","tshirt"]}. Keys are categories from style_wardrobes.category. Values are wardrobe "value" ids.';


