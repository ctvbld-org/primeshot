-- Create inference_settings table to drive inference UI and runtime config
create table if not exists inference_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Trigger to update updated_at on row changes
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_inference_settings_updated on inference_settings;
create trigger trg_inference_settings_updated
before update on inference_settings
for each row execute function set_updated_at();

-- Seed defaults (idempotent)
insert into inference_settings (key, value)
values
  ('qualities', '["1K","2K","4K"]'::jsonb),
  ('quality_labels', '{"1K":"Basic","2K":"Standard","4K":"High"}'::jsonb),
  ('nb_takes_options', '[5,15,20]'::jsonb),
  ('aspect_ratios', '["4:5","16:9","1:1","3:4"]'::jsonb),
  ('defaults', '{"quality":"1K","nb_takes":5,"aspect_ratio":"4:5"}'::jsonb)
on conflict (key) do nothing;

