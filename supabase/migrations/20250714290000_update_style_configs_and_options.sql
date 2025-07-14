-- Migration: Update style_configs and style_options schema
-- Date: 2025-07-14

-- 1. Remove columns from style_configs
do $$
begin
  if exists (select 1 from information_schema.columns where table_name='style_configs' and column_name='tagline') then
    alter table style_configs drop column tagline;
  end if;
  if exists (select 1 from information_schema.columns where table_name='style_configs' and column_name='description') then
    alter table style_configs drop column description;
  end if;
  if exists (select 1 from information_schema.columns where table_name='style_configs' and column_name='available_genders') then
    alter table style_configs drop column available_genders;
  end if;
end $$;

-- 2. Add prompt column to style_configs
alter table style_configs add column if not exists prompt text;

-- 3. Change id type to uuid and generate new ids
-- a) Add new uuid column
alter table style_configs add column if not exists new_id uuid;
-- b) Populate with generated uuids
update style_configs set new_id = gen_random_uuid();
-- c) Drop old PK constraint
alter table style_configs drop constraint if exists style_configs_pkey;
-- d) Drop old id column
alter table style_configs drop column id;
-- e) Rename new_id to id
alter table style_configs rename column new_id to id;
-- f) Set as PK
alter table style_configs add primary key (id);

-- 4. Remove columns from style_options
do $$
begin
  if exists (select 1 from information_schema.columns where table_name='style_options' and column_name='label') then
    alter table style_options drop column label;
  end if;
  if exists (select 1 from information_schema.columns where table_name='style_options' and column_name='description') then
    alter table style_options drop column description;
  end if;
end $$; 