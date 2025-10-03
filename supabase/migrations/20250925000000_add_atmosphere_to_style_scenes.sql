-- Add atmosphere column to style_scenes table
-- This allows scenes to have an optional atmosphere description that can be used in prompts

alter table "public"."style_scenes" 
add column "atmosphere" text;

-- Add comment to document the purpose of this column
comment on column "public"."style_scenes"."atmosphere" is 'Optional atmosphere description that can be used in style prompts via [atmosphere] placeholder';
