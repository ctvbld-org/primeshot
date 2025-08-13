-- Add nullable prompt columns to style tables
-- Allows NULL so the field is optional in UI

alter table if exists public.style_scenes
  add column if not exists prompt text;

alter table if exists public.style_wardrobes
  add column if not exists prompt text;


