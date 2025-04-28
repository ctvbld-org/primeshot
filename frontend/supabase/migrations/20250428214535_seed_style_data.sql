-- Seed style_configs table
INSERT INTO style_configs (id, name, tagline, description, preview_images, available_genders, available_backgrounds, available_clothing, available_clothing_colors, translations) 
VALUES 
(
  'editorial',
  'Editorial',
  'Story-Driven. Stylised. Striking.',
  'A cinematic, magazine-worthy aesthetic. Expressive and fashion-forward — stand out with personality and mood.',
  '["outdoor-fashion-1.webp", "outdoor-fashion-2.webp", "outdoor-fashion-3.webp", "outdoor-fashion-4.webp", "outdoor-fashion-4.webp"]',
  ARRAY['male', 'female'],
  ARRAY['plain-light','plain-dark','plain-orange','plain-blue','plain-teal'],
  ARRAY['hoodie','shirt','polo','henley','jacket','fishermans-jumper'],
  ARRAY['#000000','#FFFFFF','#2A9D47','#3B82F6','#FF7F39','#D22D2D','#FC84E2','#A28DF7','#6B7280','#4F46E5'],
  '{
    "es": {
      "name": "Editorial",
      "tagline": "Narrativo. Estilizado. Impactante.",
      "description": "Una estética cinematográfica digna de revista. Expresivo y vanguardista — destaca con personalidad y ambiente."
    }
  }'::jsonb
),
(
  'corporate',
  'Corporate',
  'Professional. Approachable. Trusted.',
  'Professional and approachable, perfect for LinkedIn, team pages, and pitch decks — designed to make a confident first impression.',
  '["business-2.webp", "business-1.webp", "business-3.webp", "business-1.webp", "business-3.webp"]',
  ARRAY['male', 'female'],
  ARRAY['plain-light','plain-dark','plain-orange','plain-blue','plain-teal'],
  ARRAY['suit-jacket-shirt','shirt','polo','henley','jacket'],
  ARRAY['#000000','#FFFFFF','#2A9D47','#3B82F6','#FF7F39','#D22D2D','#FC84E2','#A28DF7','#6B7280','#4F46E5'],
  '{
    "es": {
      "name": "Corporativo",
      "tagline": "Profesional. Accesible. Confiable.",
      "description": "Profesional y accesible, perfecto para LinkedIn, páginas de equipo y presentaciones — diseñado para dar una primera impresión segura."
    }
  }'::jsonb
),
(
  'studio',
  'Studio',
  'Polished. Professional. Powerful.',
  'Step into the spotlight with Studio style — clean, high-impact headshots perfect for portfolios, castings, and personal branding.',
  '["studio-1.webp", "studio-2.webp", "studio-3.webp", "studio-1.webp", "studio-2.webp"]',
  ARRAY['male', 'female'],
  ARRAY['plain-light','plain-dark','plain-orange','plain-blue','plain-teal'],
  ARRAY['shirt','polo','henley','jacket','fishermans-jumper'],
  ARRAY['#000000','#FFFFFF','#2A9D47','#3B82F6','#FF7F39','#D22D2D','#FC84E2','#A28DF7','#6B7280','#4F46E5'],
  '{
    "es": {
      "name": "Estudio",
      "tagline": "Refinado. Profesional. Poderoso.",
      "description": "Paso al centro de la cámara con el estilo Estudio — imágenes de cabecera limpias y de alto impacto perfectas para portafolios, casting y branding personal."
    }
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  preview_images = EXCLUDED.preview_images,
  available_genders = EXCLUDED.available_genders,
  available_backgrounds = EXCLUDED.available_backgrounds,
  available_clothing = EXCLUDED.available_clothing,
  available_clothing_colors = EXCLUDED.available_clothing_colors,
  translations = EXCLUDED.translations;

-- Seed style_options table
INSERT INTO style_options (category, label, description, options, translations) 
VALUES 
(
  'background',
  'Background',
  'Pick a background style. The examples give a general feel, actual results may differ slightly.',
  '[
    {"id": "plain-light", "label": "Studio Light", "translations": { "en": {"label": "Studio Light"}, "es": {"label": "Estudio Claro"}}, "imageUrl": "bg-plain-light.webp"}, 
    {"id": "plain-dark", "label": "Studio Dark", "translations": { "en": {"label": "Studio Dark"}, "es": {"label": "Estudio Oscuro"}}, "imageUrl": "bg-plain-dark.webp"}, 
    {"id": "plain-orange", "label": "Studio Orange", "translations": { "en": {"label": "Studio Orange"}, "es": {"label": "Estudio Naranja"}}, "imageUrl": "bg-plain-orange.webp"}, 
    {"id": "plain-blue", "label": "Studio Blue", "translations": { "en": {"label": "Studio Blue"}, "es": {"label": "Estudio Azul"}}, "imageUrl": "bg-plain-blue.webp"}, 
    {"id": "plain-teal", "label": "Studio Teal", "translations": { "en": {"label": "Studio Teal"}, "es": {"label": "Estudio Verde"}}, "imageUrl": "bg-plain-teal.webp"}
  ]'::jsonb,
  '{
    "es": {
      "label": "Fondo",
      "description": "Elige el estilo del fondo de tu foto"
    }
  }'::jsonb
),
(
  'clothing',
  'Clothing Type',
  'Choose a clothing style for your headshot. The samples are representative, but the final look may vary.',
  '[
    {"id": "hoodie", "label": "Hoodie", "translations": { "en": {"label": "Hoodie"}, "es": {"label": "Sudadera con Capucha"}}, "imageUrl": "hoodie.webp"}, 
    {"id": "suit-jacket-shirt", "label": "Suit Jacket/Shirt", "translations": { "en": {"label": "Suit Jacket/Shirt"}, "es": {"label": "Chaqueta de Traje/Camisa"}}, "imageUrl": "blazer-shirt.webp"}, 
    {"id": "shirt", "label": "Shirt", "translations": { "en": {"label": "Shirt"}, "es": {"label": "Camisa"}}, "imageUrl": "shirt.webp"}, 
    {"id": "polo", "label": "Polo", "translations": { "en": {"label": "Polo"}, "es": {"label": "Polo"}}, "imageUrl": "polo.webp"}, 
    {"id": "henley", "label": "Henley", "translations": { "en": {"label": "Henley"}, "es": {"label": "Henley"}}, "imageUrl": "henley.webp"}, 
    {"id": "jacket", "label": "Jacket", "translations": { "en": {"label": "Jacket"}, "es": {"label": "Chaqueta"}}, "imageUrl": "jacket.webp"}, 
    {"id": "fishermans-jumper", "label": "Fishermans Jumper", "translations": { "en": {"label": "Fishermans Jumper"}, "es": {"label": "Suéter de Pescador"}}, "imageUrl": "fishermans-jumper.webp"}
  ]'::jsonb,
  '{
    "es": {
      "label": "Tipo de Vestuario",
      "description": "Selecciona tu estilo de vestuario preferido"
    }
  }'::jsonb
),
(
  'clothingColor',
  'Clothing Color',
  'Select a clothing colour you prefer. The shade shown is a guide, results may have subtle differences.',
  '[
    {"id": "#000000", "label": "Black", "translations": { "en": {"label": "Black"}, "es": {"label": "Negro"}}}, 
    {"id": "#FFFFFF", "label": "White", "translations": { "en": {"label": "White"}, "es": {"label": "Blanco"}}}, 
    {"id": "#2A9D47", "label": "Green", "translations": { "en": {"label": "Green"}, "es": {"label": "Verde"}}}, 
    {"id": "#3B82F6", "label": "Blue", "translations": { "en": {"label": "Blue"}, "es": {"label": "Azul"}}}, 
    {"id": "#FF7F39", "label": "Orange", "translations": { "en": {"label": "Orange"}, "es": {"label": "Naranja"}}}, 
    {"id": "#D22D2D", "label": "Red", "translations": { "en": {"label": "Red"}, "es": {"label": "Rojo"}}}, 
    {"id": "#FC84E2", "label": "Pink", "translations": { "en": {"label": "Pink"}, "es": {"label": "Rosa"}}}, 
    {"id": "#A28DF7", "label": "Purple", "translations": { "en": {"label": "Purple"}, "es": {"label": "Morado"}}}, 
    {"id": "#6B7280", "label": "Gray", "translations": { "en": {"label": "Gray"}, "es": {"label": "Gris"}}}, 
    {"id": "#4F46E5", "label": "Indigo", "translations": { "en": {"label": "Indigo"}, "es": {"label": "Índigo"}}}
  ]'::jsonb,
  '{
    "es": {
      "label": "Color de Vestuario",
      "description": "Selecciona tu color de vestuario preferido"
    }
  }'::jsonb
)
ON CONFLICT (category) DO UPDATE 
SET 
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  options = EXCLUDED.options,
  translations = EXCLUDED.translations;
