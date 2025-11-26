-- Add color_mode column to styles table
-- This allows controlling visual filters (grayscale, sepia, color) without redeploying the app

-- Create enum type for color modes
create type public.style_color_mode as enum ('color', 'monochrome', 'sepia');

-- Add color_mode column to styles table with default 'color'
alter table public.styles
add column color_mode public.style_color_mode not null default 'color';

-- Add comment explaining the column
comment on column public.styles.color_mode is 
'Visual filter mode for style images: color (default), monochrome (grayscale), or sepia';

-- Index for filtering by color mode (useful for admin queries)
create index idx_styles_color_mode on public.styles(color_mode);



