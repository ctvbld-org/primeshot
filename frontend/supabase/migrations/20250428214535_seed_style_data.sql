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
    },
    "fr": {
      "name": "Éditorial",
      "tagline": "Narratif. Stylisé. Saisissant.",
      "description": "Une esthétique cinématographique digne des magazines. Expressif et avant-gardiste — démarquez-vous avec personnalité et ambiance."
    },
    "it": {
      "name": "Editoriale",
      "tagline": "Narrativo. Stilizzato. Impressionante.",
      "description": "Un''estetica cinematografica degna di una rivista. Espressivo e all''avanguardia — distinguiti con personalità e atmosfera."
    },
    "pt": {
      "name": "Editorial",
      "tagline": "Narrativo. Estilizado. Impactante.",
      "description": "Uma estética cinematográfica digna de revista. Expressivo e vanguardista — destaque-se com personalidade e atmosfera."
    },
    "de": {
      "name": "Editorial",
      "tagline": "Erzählerisch. Stilisiert. Eindrucksvoll.",
      "description": "Eine filmische, magazinwürdige Ästhetik. Expressiv und modisch — stechen Sie mit Persönlichkeit und Stimmung hervor."
    },
    "nl": {
      "name": "Editorial",
      "tagline": "Verhalend. Gestileerd. Opvallend.",
      "description": "Een cinematografische, magazine-waardige esthetiek. Expressief en vooruitstrevend — val op met persoonlijkheid en sfeer."
    },
    "zh": {
      "name": "杂志风格",
      "tagline": "叙事性。风格化。引人注目。",
      "description": "电影般的杂志级美学。富有表现力和前卫感 — 以独特个性和氛围脱颖而出。"
    },
    "ja": {
      "name": "エディトリアル",
      "tagline": "ストーリー性。様式的。印象的。",
      "description": "映画のような雑誌品質の美学。表現力豊かでファッション性の高い — 個性と雰囲気で際立ちます。"
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
    },
    "fr": {
      "name": "Corporate",
      "tagline": "Professionnel. Accessible. Fiable.",
      "description": "Professionnel et accessible, parfait pour LinkedIn, les pages d''équipe et les présentations — conçu pour donner une première impression assurée."
    },
    "it": {
      "name": "Corporate",
      "tagline": "Professionale. Accessibile. Affidabile.",
      "description": "Professionale e accessibile, perfetto per LinkedIn, pagine del team e presentazioni — progettato per dare una prima impressione sicura."
    },
    "pt": {
      "name": "Corporativo",
      "tagline": "Profissional. Acessível. Confiável.",
      "description": "Profissional e acessível, perfeito para LinkedIn, páginas de equipe e apresentações — projetado para criar uma primeira impressão confiante."
    },
    "de": {
      "name": "Business",
      "tagline": "Professionell. Zugänglich. Vertrauenswürdig.",
      "description": "Professionell und zugänglich, perfekt für LinkedIn, Teamseiten und Pitch-Decks — entwickelt für einen selbstbewussten ersten Eindruck."
    },
    "nl": {
      "name": "Zakelijk",
      "tagline": "Professioneel. Benaderbaar. Betrouwbaar.",
      "description": "Professioneel en toegankelijk, perfect voor LinkedIn, teampagina''s en pitch decks — ontworpen om een zelfverzekerde eerste indruk te maken."
    },
    "zh": {
      "name": "商务风格",
      "tagline": "专业。平易近人。值得信赖。",
      "description": "专业且平易近人，完美适用于领英、团队页面和演示文稿 — 旨在创造自信的第一印象。"
    },
    "ja": {
      "name": "コーポレート",
      "tagline": "プロフェッショナル。親しみやすい。信頼感。",
      "description": "プロフェッショナルで親しみやすい、LinkedIn、チームページ、ピッチデッキに最適 — 自信に満ちた第一印象を作るためにデザインされました。"
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
    },
    "fr": {
      "name": "Studio",
      "tagline": "Raffiné. Professionnel. Puissant.",
      "description": "Entrez dans la lumière avec le style Studio — des portraits nets et percutants, parfaits pour les portfolios, les castings et l''image de marque personnelle."
    },
    "it": {
      "name": "Studio",
      "tagline": "Raffinato. Professionale. Potente.",
      "description": "Entra sotto i riflettori con lo stile Studio — ritratti puliti e d''impatto perfetti per portfolio, casting e personal branding."
    },
    "pt": {
      "name": "Estúdio",
      "tagline": "Refinado. Profissional. Poderoso.",
      "description": "Entre sob os holofotes com o estilo Estúdio — fotos limpas e de alto impacto perfeitas para portfólios, testes e marca pessoal."
    },
    "de": {
      "name": "Studio",
      "tagline": "Poliert. Professionell. Kraftvoll.",
      "description": "Treten Sie mit dem Studio-Stil ins Rampenlicht — klare, wirkungsvolle Portraits, perfekt für Portfolios, Castings und persönliches Branding."
    },
    "nl": {
      "name": "Studio",
      "tagline": "Gepolijst. Professioneel. Krachtig.",
      "description": "Stap in de spotlight met de Studio-stijl — strakke, impactvolle headshots perfect voor portfolio''s, castings en personal branding."
    },
    "zh": {
      "name": "工作室风格",
      "tagline": "精致。专业。有力。",
      "description": "以工作室风格步入聚光灯下 — 干净、具有冲击力的头像照片，完美适用于作品集、试镜和个人品牌塑造。"
    },
    "ja": {
      "name": "スタジオ",
      "tagline": "洗練。プロフェッショナル。パワフル。",
      "description": "スタジオスタイルでスポットライトを浴びましょう — ポートフォリオ、キャスティング、パーソナルブランディングに最適なクリーンで印象的なヘッドショット。"
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
    {"id": "plain-light", "label": "Studio Light", "translations": { 
      "es": {"label": "Estudio Claro"},
      "fr": {"label": "Studio Clair"},
      "it": {"label": "Studio Chiaro"},
      "pt": {"label": "Estúdio Claro"},
      "de": {"label": "Studio Hell"},
      "nl": {"label": "Studio Licht"},
      "zh": {"label": "明亮工作室"},
      "ja": {"label": "スタジオライト"}
    }, "imageUrl": "bg-plain-light.webp"}, 
    {"id": "plain-dark", "label": "Studio Dark", "translations": { 
      "es": {"label": "Estudio Oscuro"},
      "fr": {"label": "Studio Sombre"},
      "it": {"label": "Studio Scuro"},
      "pt": {"label": "Estúdio Escuro"},
      "de": {"label": "Studio Dunkel"},
      "nl": {"label": "Studio Donker"},
      "zh": {"label": "暗调工作室"},
      "ja": {"label": "スタジオダーク"}
    }, "imageUrl": "bg-plain-dark.webp"}, 
    {"id": "plain-orange", "label": "Studio Orange", "translations": { 
      "es": {"label": "Estudio Naranja"},
      "fr": {"label": "Studio Orange"},
      "it": {"label": "Studio Arancione"},
      "pt": {"label": "Estúdio Laranja"},
      "de": {"label": "Studio Orange"},
      "nl": {"label": "Studio Oranje"},
      "zh": {"label": "橙色工作室"},
      "ja": {"label": "スタジオオレンジ"}
    }, "imageUrl": "bg-plain-orange.webp"}, 
    {"id": "plain-blue", "label": "Studio Blue", "translations": { 
      "es": {"label": "Estudio Azul"},
      "fr": {"label": "Studio Bleu"},
      "it": {"label": "Studio Blu"},
      "pt": {"label": "Estúdio Azul"},
      "de": {"label": "Studio Blau"},
      "nl": {"label": "Studio Blauw"},
      "zh": {"label": "蓝色工作室"},
      "ja": {"label": "スタジオブルー"}
    }, "imageUrl": "bg-plain-blue.webp"}, 
    {"id": "plain-teal", "label": "Studio Teal", "translations": { 
      "es": {"label": "Estudio Verde"},
      "fr": {"label": "Studio Turquoise"},
      "it": {"label": "Studio Turchese"},
      "pt": {"label": "Estúdio Verde-água"},
      "de": {"label": "Studio Türkis"},
      "nl": {"label": "Studio Groenblauw"},
      "zh": {"label": "青色工作室"},
      "ja": {"label": "スタジオティール"}
    }, "imageUrl": "bg-plain-teal.webp"}
  ]'::jsonb,
  '{
    "es": {
      "label": "Fondo",
      "description": "Elige el estilo del fondo de tu foto"
    },
    "fr": {
      "label": "Arrière-plan",
      "description": "Choisissez le style d''arrière-plan de votre photo"
    },
    "it": {
      "label": "Sfondo",
      "description": "Scegli lo stile dello sfondo della tua foto"
    },
    "pt": {
      "label": "Fundo",
      "description": "Escolha o estilo do fundo da sua foto"
    },
    "de": {
      "label": "Hintergrund",
      "description": "Wählen Sie den Hintergrundstil für Ihr Foto"
    },
    "nl": {
      "label": "Achtergrond",
      "description": "Kies de achtergrondstijl voor uw foto"
    },
    "zh": {
      "label": "背景",
      "description": "选择您照片的背景风格"
    },
    "ja": {
      "label": "背景",
      "description": "写真の背景スタイルを選択してください"
    }
  }'::jsonb
),
(
  'clothing',
  'Clothing Type',
  'Choose a clothing style for your headshot. The samples are representative, but the final look may vary.',
  '[
    {"id": "hoodie", "label": "Hoodie", "translations": { 
      "es": {"label": "Sudadera con Capucha"},
      "fr": {"label": "Sweat à Capuche"},
      "it": {"label": "Felpa con Cappuccio"},
      "pt": {"label": "Moletom com Capuz"},
      "de": {"label": "Kapuzenpullover"},
      "nl": {"label": "Hoodie"},
      "zh": {"label": "连帽衫"},
      "ja": {"label": "パーカー"}
    }, "imageUrl": "hoodie.webp"}, 
    {"id": "suit-jacket-shirt", "label": "Suit Jacket/Shirt", "translations": { 
      "es": {"label": "Chaqueta de Traje/Camisa"},
      "fr": {"label": "Veste de Costume/Chemise"},
      "it": {"label": "Giacca/Camicia"},
      "pt": {"label": "Paletó/Camisa"},
      "de": {"label": "Anzugjacke/Hemd"},
      "nl": {"label": "Colbert/Overhemd"},
      "zh": {"label": "西装外套/衬衫"},
      "ja": {"label": "スーツジャケット/シャツ"}
    }, "imageUrl": "blazer-shirt.webp"}, 
    {"id": "shirt", "label": "Shirt", "translations": { 
      "es": {"label": "Camisa"},
      "fr": {"label": "Chemise"},
      "it": {"label": "Camicia"},
      "pt": {"label": "Camisa"},
      "de": {"label": "Hemd"},
      "nl": {"label": "Overhemd"},
      "zh": {"label": "衬衫"},
      "ja": {"label": "シャツ"}
    }, "imageUrl": "shirt.webp"}, 
    {"id": "polo", "label": "Polo", "translations": { 
      "es": {"label": "Polo"},
      "fr": {"label": "Polo"},
      "it": {"label": "Polo"},
      "pt": {"label": "Polo"},
      "de": {"label": "Poloshirt"},
      "nl": {"label": "Polo"},
      "zh": {"label": "polo衫"},
      "ja": {"label": "ポロシャツ"}
    }, "imageUrl": "polo.webp"}, 
    {"id": "henley", "label": "Henley", "translations": { 
      "es": {"label": "Henley"},
      "fr": {"label": "Henley"},
      "it": {"label": "Henley"},
      "pt": {"label": "Henley"},
      "de": {"label": "Henley"},
      "nl": {"label": "Henley"},
      "zh": {"label": "亨利领"},
      "ja": {"label": "ヘンリーネック"}
    }, "imageUrl": "henley.webp"}, 
    {"id": "jacket", "label": "Jacket", "translations": { 
      "es": {"label": "Chaqueta"},
      "fr": {"label": "Veste"},
      "it": {"label": "Giacca"},
      "pt": {"label": "Jaqueta"},
      "de": {"label": "Jacke"},
      "nl": {"label": "Jas"},
      "zh": {"label": "夹克"},
      "ja": {"label": "ジャケット"}
    }, "imageUrl": "jacket.webp"}, 
    {"id": "fishermans-jumper", "label": "Fishermans Jumper", "translations": { 
      "es": {"label": "Suéter de Pescador"},
      "fr": {"label": "Pull Marin"},
      "it": {"label": "Maglione da Pescatore"},
      "pt": {"label": "Suéter de Pescador"},
      "de": {"label": "Fischerpullover"},
      "nl": {"label": "Visserstrui"},
      "zh": {"label": "渔夫毛衣"},
      "ja": {"label": "フィッシャーマンセーター"}
    }, "imageUrl": "fishermans-jumper.webp"}
  ]'::jsonb,
  '{
    "es": {
      "label": "Tipo de Vestuario",
      "description": "Selecciona tu estilo de vestuario preferido"
    },
    "fr": {
      "label": "Type de Vêtement",
      "description": "Choisissez votre style vestimentaire préféré"
    },
    "it": {
      "label": "Tipo di Abbigliamento",
      "description": "Scegli il tuo stile di abbigliamento preferito"
    },
    "pt": {
      "label": "Tipo de Roupa",
      "description": "Selecione seu estilo de roupa preferido"
    },
    "de": {
      "label": "Kleidungsart",
      "description": "Wählen Sie Ihren bevorzugten Kleidungsstil"
    },
    "nl": {
      "label": "Type Kleding",
      "description": "Kies uw gewenste kledingstijl"
    },
    "zh": {
      "label": "服装类型",
      "description": "选择您喜欢的服装风格"
    },
    "ja": {
      "label": "衣類の種類",
      "description": "お好みの服装スタイルを選択してください"
    }
  }'::jsonb
),
(
  'clothingColor',
  'Clothing Color',
  'Select a clothing colour you prefer. The shade shown is a guide, results may have subtle differences.',
  '[
    {"id": "#000000", "label": "Black", "translations": { 
      "es": {"label": "Negro"},
      "fr": {"label": "Noir"},
      "it": {"label": "Nero"},
      "pt": {"label": "Preto"},
      "de": {"label": "Schwarz"},
      "nl": {"label": "Zwart"},
      "zh": {"label": "黑色"},
      "ja": {"label": "黒"}
    }}, 
    {"id": "#FFFFFF", "label": "White", "translations": { 
      "es": {"label": "Blanco"},
      "fr": {"label": "Blanc"},
      "it": {"label": "Bianco"},
      "pt": {"label": "Branco"},
      "de": {"label": "Weiß"},
      "nl": {"label": "Wit"},
      "zh": {"label": "白色"},
      "ja": {"label": "白"}
    }}, 
    {"id": "#2A9D47", "label": "Green", "translations": { 
      "es": {"label": "Verde"},
      "fr": {"label": "Vert"},
      "it": {"label": "Verde"},
      "pt": {"label": "Verde"},
      "de": {"label": "Grün"},
      "nl": {"label": "Groen"},
      "zh": {"label": "绿色"},
      "ja": {"label": "緑"}
    }}, 
    {"id": "#3B82F6", "label": "Blue", "translations": { 
      "es": {"label": "Azul"},
      "fr": {"label": "Bleu"},
      "it": {"label": "Blu"},
      "pt": {"label": "Azul"},
      "de": {"label": "Blau"},
      "nl": {"label": "Blauw"},
      "zh": {"label": "蓝色"},
      "ja": {"label": "青"}
    }}, 
    {"id": "#FF7F39", "label": "Orange", "translations": { 
      "es": {"label": "Naranja"},
      "fr": {"label": "Orange"},
      "it": {"label": "Arancione"},
      "pt": {"label": "Laranja"},
      "de": {"label": "Orange"},
      "nl": {"label": "Oranje"},
      "zh": {"label": "橙色"},
      "ja": {"label": "オレンジ"}
    }}, 
    {"id": "#D22D2D", "label": "Red", "translations": { 
      "es": {"label": "Rojo"},
      "fr": {"label": "Rouge"},
      "it": {"label": "Rosso"},
      "pt": {"label": "Vermelho"},
      "de": {"label": "Rot"},
      "nl": {"label": "Rood"},
      "zh": {"label": "红色"},
      "ja": {"label": "赤"}
    }}, 
    {"id": "#FC84E2", "label": "Pink", "translations": { 
      "es": {"label": "Rosa"},
      "fr": {"label": "Rose"},
      "it": {"label": "Rosa"},
      "pt": {"label": "Rosa"},
      "de": {"label": "Pink"},
      "nl": {"label": "Roze"},
      "zh": {"label": "粉色"},
      "ja": {"label": "ピンク"}
    }}, 
    {"id": "#A28DF7", "label": "Purple", "translations": { 
      "es": {"label": "Morado"},
      "fr": {"label": "Violet"},
      "it": {"label": "Viola"},
      "pt": {"label": "Roxo"},
      "de": {"label": "Lila"},
      "nl": {"label": "Paars"},
      "zh": {"label": "紫色"},
      "ja": {"label": "紫"}
    }}, 
    {"id": "#6B7280", "label": "Gray", "translations": { 
      "es": {"label": "Gris"},
      "fr": {"label": "Gris"},
      "it": {"label": "Grigio"},
      "pt": {"label": "Cinza"},
      "de": {"label": "Grau"},
      "nl": {"label": "Grijs"},
      "zh": {"label": "灰色"},
      "ja": {"label": "グレー"}
    }}, 
    {"id": "#4F46E5", "label": "Indigo", "translations": { 
      "es": {"label": "Índigo"},
      "fr": {"label": "Indigo"},
      "it": {"label": "Indaco"},
      "pt": {"label": "Índigo"},
      "de": {"label": "Indigo"},
      "nl": {"label": "Indigo"},
      "zh": {"label": "靛蓝"},
      "ja": {"label": "インディゴ"}
    }}
  ]'::jsonb,
  '{
    "es": {
      "label": "Color de Vestuario",
      "description": "Selecciona tu color de vestuario preferido"
    },
    "fr": {
      "label": "Couleur du Vêtement",
      "description": "Sélectionnez la couleur de vêtement que vous préférez"
    },
    "it": {
      "label": "Colore dell''Abbigliamento",
      "description": "Seleziona il colore dell''abbigliamento che preferisci"
    },
    "pt": {
      "label": "Cor da Roupa",
      "description": "Selecione a cor da roupa de sua preferência"
    },
    "de": {
      "label": "Kleidungsfarbe",
      "description": "Wählen Sie Ihre bevorzugte Kleidungsfarbe"
    },
    "nl": {
      "label": "Kleding Kleur",
      "description": "Kies uw gewenste kleding kleur"
    },
    "zh": {
      "label": "服装颜色",
      "description": "选择您喜欢的服装颜色"
    },
    "ja": {
      "label": "服の色",
      "description": "お好みの服の色を選択してください"
    }
  }'::jsonb
)
ON CONFLICT (category) DO UPDATE 
SET 
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  options = EXCLUDED.options,
  translations = EXCLUDED.translations;
