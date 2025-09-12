-- Add settings jsonb column to styles for per-node overrides
-- Safe to run multiple times

alter table if exists public.styles
add column if not exists settings jsonb not null default '{}'::jsonb;

comment on column public.styles.settings is
'Per-style ComfyUI node overrides keyed by node title. Example: {"FilmGrain": {"grain_intensity": 0.1}, "CharacterLoRA": {"strength_model": 0.8}}';


