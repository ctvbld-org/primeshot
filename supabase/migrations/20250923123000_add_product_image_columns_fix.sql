-- Fix: re-add product image URL columns (forward-only)

alter table public.subscriptions add column if not exists image_url text;
alter table public.credit_packs add column if not exists image_url text;


