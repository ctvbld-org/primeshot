-- Update inference settings to use Medium for 2K and align defaults
-- Safe to run multiple times; uses deterministic updates

begin;

-- Ensure quality_labels maps to Basic/Medium/High
insert into inference_settings (key, value)
values ('quality_labels', '{"1K":"Basic","2K":"Medium","4K":"High"}'::jsonb)
on conflict (key) do update
  set value = excluded.value,
      updated_at = now()
where inference_settings.value is distinct from excluded.value;

-- Optional: align aspect ratio options with current app fallback
insert into inference_settings (key, value)
values ('aspect_ratios', '["2:3","1:1","3:2"]'::jsonb)
on conflict (key) do update
  set value = excluded.value,
      updated_at = now()
where inference_settings.value is distinct from excluded.value;

-- Optional: align defaults with current app fallback
insert into inference_settings (key, value)
values ('defaults', '{"quality":"1K","nb_takes":5,"aspect_ratio":"1:1"}'::jsonb)
on conflict (key) do update
  set value = excluded.value,
      updated_at = now()
where inference_settings.value is distinct from excluded.value;

commit;


