--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: tenants; Type: TABLE DATA; Schema: _realtime; Owner: supabase_admin
--

INSERT INTO _realtime.tenants VALUES ('d0d684ab-f02e-4fd0-91f2-eb7f0737dfa0', 'realtime-dev', 'realtime-dev', 'iNjicxc4+llvc9wovDvqymwfnj9teWMlyOIbJ8Fh6j2WNU8CIJ2ZgjR6MUIKqSmeDmvpsKLsZ9jgXJmQPpwL8w==', 200, '2025-05-03 23:36:56', '2025-05-03 23:36:56', 100, 'postgres_cdc_rls', 100000, 100, 100, false, '{"keys": [{"k": "c3VwZXItc2VjcmV0LWp3dC10b2tlbi13aXRoLWF0LWxlYXN0LTMyLWNoYXJhY3RlcnMtbG9uZw", "kty": "oct"}]}', false, false);


--
-- Data for Name: extensions; Type: TABLE DATA; Schema: _realtime; Owner: supabase_admin
--

INSERT INTO _realtime.extensions VALUES ('8653f6ac-c541-4d86-b59c-9d679607c3c0', 'postgres_cdc_rls', '{"region": "us-east-1", "db_host": "TQ2j/DAwe0SguG0wTBxTY1GdP/THOquqNXwhpdaTwkY=", "db_name": "sWBpZNdjggEPTQVlI52Zfw==", "db_port": "+enMDFi1J/3IrrquHHwUmA==", "db_user": "uxbEq/zz8DXVD53TOI1zmw==", "slot_name": "supabase_realtime_replication_slot", "db_password": "sWBpZNdjggEPTQVlI52Zfw==", "publication": "supabase_realtime", "ssl_enforced": false, "poll_interval_ms": 100, "poll_max_changes": 100, "poll_max_record_bytes": 1048576}', 'realtime-dev', '2025-05-03 23:36:56', '2025-05-03 23:36:56');


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: _realtime; Owner: supabase_admin
--

INSERT INTO _realtime.schema_migrations VALUES (20210706140551, '2025-05-03 23:36:52');
INSERT INTO _realtime.schema_migrations VALUES (20220329161857, '2025-05-03 23:36:52');
INSERT INTO _realtime.schema_migrations VALUES (20220410212326, '2025-05-03 23:36:52');
INSERT INTO _realtime.schema_migrations VALUES (20220506102948, '2025-05-03 23:36:52');
INSERT INTO _realtime.schema_migrations VALUES (20220527210857, '2025-05-03 23:36:52');
INSERT INTO _realtime.schema_migrations VALUES (20220815211129, '2025-05-03 23:36:52');
INSERT INTO _realtime.schema_migrations VALUES (20220815215024, '2025-05-03 23:36:52');
INSERT INTO _realtime.schema_migrations VALUES (20220818141501, '2025-05-03 23:36:52');
INSERT INTO _realtime.schema_migrations VALUES (20221018173709, '2025-05-03 23:36:52');
INSERT INTO _realtime.schema_migrations VALUES (20221102172703, '2025-05-03 23:36:52');
INSERT INTO _realtime.schema_migrations VALUES (20221223010058, '2025-05-03 23:36:52');
INSERT INTO _realtime.schema_migrations VALUES (20230110180046, '2025-05-03 23:36:52');
INSERT INTO _realtime.schema_migrations VALUES (20230810220907, '2025-05-03 23:36:52');
INSERT INTO _realtime.schema_migrations VALUES (20230810220924, '2025-05-03 23:36:52');
INSERT INTO _realtime.schema_migrations VALUES (20231024094642, '2025-05-03 23:36:52');
INSERT INTO _realtime.schema_migrations VALUES (20240306114423, '2025-05-03 23:36:52');
INSERT INTO _realtime.schema_migrations VALUES (20240418082835, '2025-05-03 23:36:52');
INSERT INTO _realtime.schema_migrations VALUES (20240625211759, '2025-05-03 23:36:52');
INSERT INTO _realtime.schema_migrations VALUES (20240704172020, '2025-05-03 23:36:52');
INSERT INTO _realtime.schema_migrations VALUES (20240902173232, '2025-05-03 23:36:52');
INSERT INTO _realtime.schema_migrations VALUES (20241106103258, '2025-05-03 23:36:52');


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO auth.schema_migrations VALUES ('20171026211738');
INSERT INTO auth.schema_migrations VALUES ('20171026211808');
INSERT INTO auth.schema_migrations VALUES ('20171026211834');
INSERT INTO auth.schema_migrations VALUES ('20180103212743');
INSERT INTO auth.schema_migrations VALUES ('20180108183307');
INSERT INTO auth.schema_migrations VALUES ('20180119214651');
INSERT INTO auth.schema_migrations VALUES ('20180125194653');
INSERT INTO auth.schema_migrations VALUES ('00');
INSERT INTO auth.schema_migrations VALUES ('20210710035447');
INSERT INTO auth.schema_migrations VALUES ('20210722035447');
INSERT INTO auth.schema_migrations VALUES ('20210730183235');
INSERT INTO auth.schema_migrations VALUES ('20210909172000');
INSERT INTO auth.schema_migrations VALUES ('20210927181326');
INSERT INTO auth.schema_migrations VALUES ('20211122151130');
INSERT INTO auth.schema_migrations VALUES ('20211124214934');
INSERT INTO auth.schema_migrations VALUES ('20211202183645');
INSERT INTO auth.schema_migrations VALUES ('20220114185221');
INSERT INTO auth.schema_migrations VALUES ('20220114185340');
INSERT INTO auth.schema_migrations VALUES ('20220224000811');
INSERT INTO auth.schema_migrations VALUES ('20220323170000');
INSERT INTO auth.schema_migrations VALUES ('20220429102000');
INSERT INTO auth.schema_migrations VALUES ('20220531120530');
INSERT INTO auth.schema_migrations VALUES ('20220614074223');
INSERT INTO auth.schema_migrations VALUES ('20220811173540');
INSERT INTO auth.schema_migrations VALUES ('20221003041349');
INSERT INTO auth.schema_migrations VALUES ('20221003041400');
INSERT INTO auth.schema_migrations VALUES ('20221011041400');
INSERT INTO auth.schema_migrations VALUES ('20221020193600');
INSERT INTO auth.schema_migrations VALUES ('20221021073300');
INSERT INTO auth.schema_migrations VALUES ('20221021082433');
INSERT INTO auth.schema_migrations VALUES ('20221027105023');
INSERT INTO auth.schema_migrations VALUES ('20221114143122');
INSERT INTO auth.schema_migrations VALUES ('20221114143410');
INSERT INTO auth.schema_migrations VALUES ('20221125140132');
INSERT INTO auth.schema_migrations VALUES ('20221208132122');
INSERT INTO auth.schema_migrations VALUES ('20221215195500');
INSERT INTO auth.schema_migrations VALUES ('20221215195800');
INSERT INTO auth.schema_migrations VALUES ('20221215195900');
INSERT INTO auth.schema_migrations VALUES ('20230116124310');
INSERT INTO auth.schema_migrations VALUES ('20230116124412');
INSERT INTO auth.schema_migrations VALUES ('20230131181311');
INSERT INTO auth.schema_migrations VALUES ('20230322519590');
INSERT INTO auth.schema_migrations VALUES ('20230402418590');
INSERT INTO auth.schema_migrations VALUES ('20230411005111');
INSERT INTO auth.schema_migrations VALUES ('20230508135423');
INSERT INTO auth.schema_migrations VALUES ('20230523124323');
INSERT INTO auth.schema_migrations VALUES ('20230818113222');
INSERT INTO auth.schema_migrations VALUES ('20230914180801');
INSERT INTO auth.schema_migrations VALUES ('20231027141322');
INSERT INTO auth.schema_migrations VALUES ('20231114161723');
INSERT INTO auth.schema_migrations VALUES ('20231117164230');
INSERT INTO auth.schema_migrations VALUES ('20240115144230');
INSERT INTO auth.schema_migrations VALUES ('20240214120130');
INSERT INTO auth.schema_migrations VALUES ('20240306115329');
INSERT INTO auth.schema_migrations VALUES ('20240314092811');
INSERT INTO auth.schema_migrations VALUES ('20240427152123');
INSERT INTO auth.schema_migrations VALUES ('20240612123726');
INSERT INTO auth.schema_migrations VALUES ('20240729123726');
INSERT INTO auth.schema_migrations VALUES ('20240802193726');
INSERT INTO auth.schema_migrations VALUES ('20240806073726');
INSERT INTO auth.schema_migrations VALUES ('20241009103726');


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: completed_user_journeys; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: images; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: style_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.style_configs VALUES ('editorial', 'Editorial', 'Story-Driven. Stylised. Striking.', 'A cinematic, magazine-worthy aesthetic. Expressive and fashion-forward — stand out with personality and mood.', '["outdoor-fashion-1.webp", "outdoor-fashion-2.webp", "outdoor-fashion-3.webp", "outdoor-fashion-4.webp", "outdoor-fashion-4.webp"]', '{male,female}', '{plain-light,plain-dark,plain-orange,plain-blue,plain-teal}', '{hoodie,shirt,polo,henley,jacket,fishermans-jumper}', '{#000000,#FFFFFF,#2A9D47,#3B82F6,#FF7F39,#D22D2D,#FC84E2,#A28DF7,#6B7280,#4F46E5}', '{"de": {"name": "Editorial", "tagline": "Erzählerisch. Stilisiert. Eindrucksvoll.", "description": "Eine filmische, magazinwürdige Ästhetik. Expressiv und modisch — stechen Sie mit Persönlichkeit und Stimmung hervor."}, "es": {"name": "Editorial", "tagline": "Narrativo. Estilizado. Impactante.", "description": "Una estética cinematográfica digna de revista. Expresivo y vanguardista — destaca con personalidad y ambiente."}, "fr": {"name": "Éditorial", "tagline": "Narratif. Stylisé. Saisissant.", "description": "Une esthétique cinématographique digne des magazines. Expressif et avant-gardiste — démarquez-vous avec personnalité et ambiance."}, "it": {"name": "Editoriale", "tagline": "Narrativo. Stilizzato. Impressionante.", "description": "Un''estetica cinematografica degna di una rivista. Espressivo e all''avanguardia — distinguiti con personalità e atmosfera."}, "ja": {"name": "エディトリアル", "tagline": "ストーリー性。様式的。印象的。", "description": "映画のような雑誌品質の美学。表現力豊かでファッション性の高い — 個性と雰囲気で際立ちます。"}, "nl": {"name": "Editorial", "tagline": "Verhalend. Gestileerd. Opvallend.", "description": "Een cinematografische, magazine-waardige esthetiek. Expressief en vooruitstrevend — val op met persoonlijkheid en sfeer."}, "pt": {"name": "Editorial", "tagline": "Narrativo. Estilizado. Impactante.", "description": "Uma estética cinematográfica digna de revista. Expressivo e vanguardista — destaque-se com personalidade e atmosfera."}, "zh": {"name": "杂志风格", "tagline": "叙事性。风格化。引人注目。", "description": "电影般的杂志级美学。富有表现力和前卫感 — 以独特个性和氛围脱颖而出。"}}', '2025-05-03 23:36:54.119333+00', '2025-05-03 23:36:54.119333+00');
INSERT INTO public.style_configs VALUES ('corporate', 'Corporate', 'Professional. Approachable. Trusted.', 'Professional and approachable, perfect for LinkedIn, team pages, and pitch decks — designed to make a confident first impression.', '["business-2.webp", "business-1.webp", "business-3.webp", "business-1.webp", "business-3.webp"]', '{male,female}', '{plain-light,plain-dark,plain-orange,plain-blue,plain-teal}', '{suit-jacket-shirt,shirt,polo,henley,jacket}', '{#000000,#FFFFFF,#2A9D47,#3B82F6,#FF7F39,#D22D2D,#FC84E2,#A28DF7,#6B7280,#4F46E5}', '{"de": {"name": "Business", "tagline": "Professionell. Zugänglich. Vertrauenswürdig.", "description": "Professionell und zugänglich, perfekt für LinkedIn, Teamseiten und Pitch-Decks — entwickelt für einen selbstbewussten ersten Eindruck."}, "es": {"name": "Corporativo", "tagline": "Profesional. Accesible. Confiable.", "description": "Profesional y accesible, perfecto para LinkedIn, páginas de equipo y presentaciones — diseñado para dar una primera impresión segura."}, "fr": {"name": "Corporate", "tagline": "Professionnel. Accessible. Fiable.", "description": "Professionnel et accessible, parfait pour LinkedIn, les pages d''équipe et les présentations — conçu pour donner une première impression assurée."}, "it": {"name": "Corporate", "tagline": "Professionale. Accessibile. Affidabile.", "description": "Professionale e accessibile, perfetto per LinkedIn, pagine del team e presentazioni — progettato per dare una prima impressione sicura."}, "ja": {"name": "コーポレート", "tagline": "プロフェッショナル。親しみやすい。信頼感。", "description": "プロフェッショナルで親しみやすい、LinkedIn、チームページ、ピッチデッキに最適 — 自信に満ちた第一印象を作るためにデザインされました。"}, "nl": {"name": "Zakelijk", "tagline": "Professioneel. Benaderbaar. Betrouwbaar.", "description": "Professioneel en toegankelijk, perfect voor LinkedIn, teampagina''s en pitch decks — ontworpen om een zelfverzekerde eerste indruk te maken."}, "pt": {"name": "Corporativo", "tagline": "Profissional. Acessível. Confiável.", "description": "Profissional e acessível, perfeito para LinkedIn, páginas de equipe e apresentações — projetado para criar uma primeira impressão confiante."}, "zh": {"name": "商务风格", "tagline": "专业。平易近人。值得信赖。", "description": "专业且平易近人，完美适用于领英、团队页面和演示文稿 — 旨在创造自信的第一印象。"}}', '2025-05-03 23:36:54.119333+00', '2025-05-03 23:36:54.119333+00');
INSERT INTO public.style_configs VALUES ('studio', 'Studio', 'Polished. Professional. Powerful.', 'Step into the spotlight with Studio style — clean, high-impact headshots perfect for portfolios, castings, and personal branding.', '["studio-1.webp", "studio-2.webp", "studio-3.webp", "studio-1.webp", "studio-2.webp"]', '{male,female}', '{plain-light,plain-dark,plain-orange,plain-blue,plain-teal}', '{shirt,polo,henley,jacket,fishermans-jumper}', '{#000000,#FFFFFF,#2A9D47,#3B82F6,#FF7F39,#D22D2D,#FC84E2,#A28DF7,#6B7280,#4F46E5}', '{"de": {"name": "Studio", "tagline": "Poliert. Professionell. Kraftvoll.", "description": "Treten Sie mit dem Studio-Stil ins Rampenlicht — klare, wirkungsvolle Portraits, perfekt für Portfolios, Castings und persönliches Branding."}, "es": {"name": "Estudio", "tagline": "Refinado. Profesional. Poderoso.", "description": "Paso al centro de la cámara con el estilo Estudio — imágenes de cabecera limpias y de alto impacto perfectas para portafolios, casting y branding personal."}, "fr": {"name": "Studio", "tagline": "Raffiné. Professionnel. Puissant.", "description": "Entrez dans la lumière avec le style Studio — des portraits nets et percutants, parfaits pour les portfolios, les castings et l''image de marque personnelle."}, "it": {"name": "Studio", "tagline": "Raffinato. Professionale. Potente.", "description": "Entra sotto i riflettori con lo stile Studio — ritratti puliti e d''impatto perfetti per portfolio, casting e personal branding."}, "ja": {"name": "スタジオ", "tagline": "洗練。プロフェッショナル。パワフル。", "description": "スタジオスタイルでスポットライトを浴びましょう — ポートフォリオ、キャスティング、パーソナルブランディングに最適なクリーンで印象的なヘッドショット。"}, "nl": {"name": "Studio", "tagline": "Gepolijst. Professioneel. Krachtig.", "description": "Stap in de spotlight met de Studio-stijl — strakke, impactvolle headshots perfect voor portfolio''s, castings en personal branding."}, "pt": {"name": "Estúdio", "tagline": "Refinado. Profissional. Poderoso.", "description": "Entre sob os holofotes com o estilo Estúdio — fotos limpas e de alto impacto perfeitas para portfólios, testes e marca pessoal."}, "zh": {"name": "工作室风格", "tagline": "精致。专业。有力。", "description": "以工作室风格步入聚光灯下 — 干净、具有冲击力的头像照片，完美适用于作品集、试镜和个人品牌塑造。"}}', '2025-05-03 23:36:54.119333+00', '2025-05-03 23:36:54.119333+00');


--
-- Data for Name: style_options; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.style_options VALUES ('efb652d3-410f-4624-a6b5-fa47964dc44b', 'background', 'Background', 'Pick a background style. The examples give a general feel, actual results may differ slightly.', '[{"id": "plain-light", "label": "Studio Light", "imageUrl": "bg-plain-light.webp", "translations": {"de": {"label": "Studio Hell"}, "es": {"label": "Estudio Claro"}, "fr": {"label": "Studio Clair"}, "it": {"label": "Studio Chiaro"}, "ja": {"label": "スタジオライト"}, "nl": {"label": "Studio Licht"}, "pt": {"label": "Estúdio Claro"}, "zh": {"label": "明亮工作室"}}}, {"id": "plain-dark", "label": "Studio Dark", "imageUrl": "bg-plain-dark.webp", "translations": {"de": {"label": "Studio Dunkel"}, "es": {"label": "Estudio Oscuro"}, "fr": {"label": "Studio Sombre"}, "it": {"label": "Studio Scuro"}, "ja": {"label": "スタジオダーク"}, "nl": {"label": "Studio Donker"}, "pt": {"label": "Estúdio Escuro"}, "zh": {"label": "暗调工作室"}}}, {"id": "plain-orange", "label": "Studio Orange", "imageUrl": "bg-plain-orange.webp", "translations": {"de": {"label": "Studio Orange"}, "es": {"label": "Estudio Naranja"}, "fr": {"label": "Studio Orange"}, "it": {"label": "Studio Arancione"}, "ja": {"label": "スタジオオレンジ"}, "nl": {"label": "Studio Oranje"}, "pt": {"label": "Estúdio Laranja"}, "zh": {"label": "橙色工作室"}}}, {"id": "plain-blue", "label": "Studio Blue", "imageUrl": "bg-plain-blue.webp", "translations": {"de": {"label": "Studio Blau"}, "es": {"label": "Estudio Azul"}, "fr": {"label": "Studio Bleu"}, "it": {"label": "Studio Blu"}, "ja": {"label": "スタジオブルー"}, "nl": {"label": "Studio Blauw"}, "pt": {"label": "Estúdio Azul"}, "zh": {"label": "蓝色工作室"}}}, {"id": "plain-teal", "label": "Studio Teal", "imageUrl": "bg-plain-teal.webp", "translations": {"de": {"label": "Studio Türkis"}, "es": {"label": "Estudio Verde"}, "fr": {"label": "Studio Turquoise"}, "it": {"label": "Studio Turchese"}, "ja": {"label": "スタジオティール"}, "nl": {"label": "Studio Groenblauw"}, "pt": {"label": "Estúdio Verde-água"}, "zh": {"label": "青色工作室"}}}]', '{"de": {"label": "Hintergrund", "description": "Wählen Sie den Hintergrundstil für Ihr Foto"}, "es": {"label": "Fondo", "description": "Elige el estilo del fondo de tu foto"}, "fr": {"label": "Arrière-plan", "description": "Choisissez le style d''arrière-plan de votre photo"}, "it": {"label": "Sfondo", "description": "Scegli lo stile dello sfondo della tua foto"}, "ja": {"label": "背景", "description": "写真の背景スタイルを選択してください"}, "nl": {"label": "Achtergrond", "description": "Kies de achtergrondstijl voor uw foto"}, "pt": {"label": "Fundo", "description": "Escolha o estilo do fundo da sua foto"}, "zh": {"label": "背景", "description": "选择您照片的背景风格"}}', '2025-05-03 23:36:54.119333+00', '2025-05-03 23:36:54.119333+00');
INSERT INTO public.style_options VALUES ('948e161e-c341-4d5f-976b-c62c032a2573', 'clothing', 'Clothing Type', 'Choose a clothing style for your headshot. The samples are representative, but the final look may vary.', '[{"id": "hoodie", "label": "Hoodie", "imageUrl": "hoodie.webp", "translations": {"de": {"label": "Kapuzenpullover"}, "es": {"label": "Sudadera con Capucha"}, "fr": {"label": "Sweat à Capuche"}, "it": {"label": "Felpa con Cappuccio"}, "ja": {"label": "パーカー"}, "nl": {"label": "Hoodie"}, "pt": {"label": "Moletom com Capuz"}, "zh": {"label": "连帽衫"}}}, {"id": "suit-jacket-shirt", "label": "Suit Jacket/Shirt", "imageUrl": "blazer-shirt.webp", "translations": {"de": {"label": "Anzugjacke/Hemd"}, "es": {"label": "Chaqueta de Traje/Camisa"}, "fr": {"label": "Veste de Costume/Chemise"}, "it": {"label": "Giacca/Camicia"}, "ja": {"label": "スーツジャケット/シャツ"}, "nl": {"label": "Colbert/Overhemd"}, "pt": {"label": "Paletó/Camisa"}, "zh": {"label": "西装外套/衬衫"}}}, {"id": "shirt", "label": "Shirt", "imageUrl": "shirt.webp", "translations": {"de": {"label": "Hemd"}, "es": {"label": "Camisa"}, "fr": {"label": "Chemise"}, "it": {"label": "Camicia"}, "ja": {"label": "シャツ"}, "nl": {"label": "Overhemd"}, "pt": {"label": "Camisa"}, "zh": {"label": "衬衫"}}}, {"id": "polo", "label": "Polo", "imageUrl": "polo.webp", "translations": {"de": {"label": "Poloshirt"}, "es": {"label": "Polo"}, "fr": {"label": "Polo"}, "it": {"label": "Polo"}, "ja": {"label": "ポロシャツ"}, "nl": {"label": "Polo"}, "pt": {"label": "Polo"}, "zh": {"label": "polo衫"}}}, {"id": "henley", "label": "Henley", "imageUrl": "henley.webp", "translations": {"de": {"label": "Henley"}, "es": {"label": "Henley"}, "fr": {"label": "Henley"}, "it": {"label": "Henley"}, "ja": {"label": "ヘンリーネック"}, "nl": {"label": "Henley"}, "pt": {"label": "Henley"}, "zh": {"label": "亨利领"}}}, {"id": "jacket", "label": "Jacket", "imageUrl": "jacket.webp", "translations": {"de": {"label": "Jacke"}, "es": {"label": "Chaqueta"}, "fr": {"label": "Veste"}, "it": {"label": "Giacca"}, "ja": {"label": "ジャケット"}, "nl": {"label": "Jas"}, "pt": {"label": "Jaqueta"}, "zh": {"label": "夹克"}}}, {"id": "fishermans-jumper", "label": "Fishermans Jumper", "imageUrl": "fishermans-jumper.webp", "translations": {"de": {"label": "Fischerpullover"}, "es": {"label": "Suéter de Pescador"}, "fr": {"label": "Pull Marin"}, "it": {"label": "Maglione da Pescatore"}, "ja": {"label": "フィッシャーマンセーター"}, "nl": {"label": "Visserstrui"}, "pt": {"label": "Suéter de Pescador"}, "zh": {"label": "渔夫毛衣"}}}]', '{"de": {"label": "Kleidungsart", "description": "Wählen Sie Ihren bevorzugten Kleidungsstil"}, "es": {"label": "Tipo de Vestuario", "description": "Selecciona tu estilo de vestuario preferido"}, "fr": {"label": "Type de Vêtement", "description": "Choisissez votre style vestimentaire préféré"}, "it": {"label": "Tipo di Abbigliamento", "description": "Scegli il tuo stile di abbigliamento preferito"}, "ja": {"label": "衣類の種類", "description": "お好みの服装スタイルを選択してください"}, "nl": {"label": "Type Kleding", "description": "Kies uw gewenste kledingstijl"}, "pt": {"label": "Tipo de Roupa", "description": "Selecione seu estilo de roupa preferido"}, "zh": {"label": "服装类型", "description": "选择您喜欢的服装风格"}}', '2025-05-03 23:36:54.119333+00', '2025-05-03 23:36:54.119333+00');
INSERT INTO public.style_options VALUES ('c7ef0eb1-11f8-400f-bf7e-3fbbf4f18cb4', 'clothingColor', 'Clothing Color', 'Select a clothing colour you prefer. The shade shown is a guide, results may have subtle differences.', '[{"id": "#000000", "label": "Black", "translations": {"de": {"label": "Schwarz"}, "es": {"label": "Negro"}, "fr": {"label": "Noir"}, "it": {"label": "Nero"}, "ja": {"label": "黒"}, "nl": {"label": "Zwart"}, "pt": {"label": "Preto"}, "zh": {"label": "黑色"}}}, {"id": "#FFFFFF", "label": "White", "translations": {"de": {"label": "Weiß"}, "es": {"label": "Blanco"}, "fr": {"label": "Blanc"}, "it": {"label": "Bianco"}, "ja": {"label": "白"}, "nl": {"label": "Wit"}, "pt": {"label": "Branco"}, "zh": {"label": "白色"}}}, {"id": "#2A9D47", "label": "Green", "translations": {"de": {"label": "Grün"}, "es": {"label": "Verde"}, "fr": {"label": "Vert"}, "it": {"label": "Verde"}, "ja": {"label": "緑"}, "nl": {"label": "Groen"}, "pt": {"label": "Verde"}, "zh": {"label": "绿色"}}}, {"id": "#3B82F6", "label": "Blue", "translations": {"de": {"label": "Blau"}, "es": {"label": "Azul"}, "fr": {"label": "Bleu"}, "it": {"label": "Blu"}, "ja": {"label": "青"}, "nl": {"label": "Blauw"}, "pt": {"label": "Azul"}, "zh": {"label": "蓝色"}}}, {"id": "#FF7F39", "label": "Orange", "translations": {"de": {"label": "Orange"}, "es": {"label": "Naranja"}, "fr": {"label": "Orange"}, "it": {"label": "Arancione"}, "ja": {"label": "オレンジ"}, "nl": {"label": "Oranje"}, "pt": {"label": "Laranja"}, "zh": {"label": "橙色"}}}, {"id": "#D22D2D", "label": "Red", "translations": {"de": {"label": "Rot"}, "es": {"label": "Rojo"}, "fr": {"label": "Rouge"}, "it": {"label": "Rosso"}, "ja": {"label": "赤"}, "nl": {"label": "Rood"}, "pt": {"label": "Vermelho"}, "zh": {"label": "红色"}}}, {"id": "#FC84E2", "label": "Pink", "translations": {"de": {"label": "Pink"}, "es": {"label": "Rosa"}, "fr": {"label": "Rose"}, "it": {"label": "Rosa"}, "ja": {"label": "ピンク"}, "nl": {"label": "Roze"}, "pt": {"label": "Rosa"}, "zh": {"label": "粉色"}}}, {"id": "#A28DF7", "label": "Purple", "translations": {"de": {"label": "Lila"}, "es": {"label": "Morado"}, "fr": {"label": "Violet"}, "it": {"label": "Viola"}, "ja": {"label": "紫"}, "nl": {"label": "Paars"}, "pt": {"label": "Roxo"}, "zh": {"label": "紫色"}}}, {"id": "#6B7280", "label": "Gray", "translations": {"de": {"label": "Grau"}, "es": {"label": "Gris"}, "fr": {"label": "Gris"}, "it": {"label": "Grigio"}, "ja": {"label": "グレー"}, "nl": {"label": "Grijs"}, "pt": {"label": "Cinza"}, "zh": {"label": "灰色"}}}, {"id": "#4F46E5", "label": "Indigo", "translations": {"de": {"label": "Indigo"}, "es": {"label": "Índigo"}, "fr": {"label": "Indigo"}, "it": {"label": "Indaco"}, "ja": {"label": "インディゴ"}, "nl": {"label": "Indigo"}, "pt": {"label": "Índigo"}, "zh": {"label": "靛蓝"}}}]', '{"de": {"label": "Kleidungsfarbe", "description": "Wählen Sie Ihre bevorzugte Kleidungsfarbe"}, "es": {"label": "Color de Vestuario", "description": "Selecciona tu color de vestuario preferido"}, "fr": {"label": "Couleur du Vêtement", "description": "Sélectionnez la couleur de vêtement que vous préférez"}, "it": {"label": "Colore dell''Abbigliamento", "description": "Seleziona il colore dell''abbigliamento che preferisci"}, "ja": {"label": "服の色", "description": "お好みの服の色を選択してください"}, "nl": {"label": "Kleding Kleur", "description": "Kies uw gewenste kleding kleur"}, "pt": {"label": "Cor da Roupa", "description": "Selecione a cor da roupa de sua preferência"}, "zh": {"label": "服装颜色", "description": "选择您喜欢的服装颜色"}}', '2025-05-03 23:36:54.119333+00', '2025-05-03 23:36:54.119333+00');


--
-- Data for Name: styles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_language_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: messages_2025_05_02; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--



--
-- Data for Name: messages_2025_05_03; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--



--
-- Data for Name: messages_2025_05_04; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--



--
-- Data for Name: messages_2025_05_05; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--



--
-- Data for Name: messages_2025_05_06; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--



--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

INSERT INTO realtime.schema_migrations VALUES (20211116024918, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20211116045059, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20211116050929, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20211116051442, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20211116212300, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20211116213355, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20211116213934, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20211116214523, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20211122062447, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20211124070109, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20211202204204, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20211202204605, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20211210212804, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20211228014915, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20220107221237, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20220228202821, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20220312004840, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20220603231003, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20220603232444, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20220615214548, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20220712093339, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20220908172859, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20220916233421, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20230119133233, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20230128025114, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20230128025212, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20230227211149, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20230228184745, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20230308225145, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20230328144023, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20231018144023, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20231204144023, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20231204144024, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20231204144025, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20240108234812, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20240109165339, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20240227174441, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20240311171622, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20240321100241, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20240401105812, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20240418121054, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20240523004032, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20240618124746, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20240801235015, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20240805133720, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20240827160934, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20240919163303, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20240919163305, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20241019105805, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20241030150047, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20241108114728, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20241121104152, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20241130184212, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20241220035512, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20241220123912, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20241224161212, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20250107150512, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20250110162412, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20250123174212, '2025-05-03 23:36:53');
INSERT INTO realtime.schema_migrations VALUES (20250128220012, '2025-05-03 23:36:53');


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

INSERT INTO realtime.subscription OVERRIDING SYSTEM VALUE VALUES (3, '2488958a-2878-11f0-a010-fa19461872f3', 'public.styles', '{}', '{"aal": "aal1", "amr": [{"method": "oauth", "timestamp": 1746311647}], "aud": "authenticated", "exp": 1746318758, "iat": 1746315158, "iss": "http://127.0.0.1:54321/auth/v1", "sub": "23fb7234-6ef8-4453-b671-33805c2692b6", "role": "authenticated", "email": "david.benollol@gmail.com", "phone": "", "session_id": "3476a152-9500-474e-a4c3-6fea8f17d031", "app_metadata": {"provider": "google", "providers": ["google"]}, "is_anonymous": false, "user_metadata": {"iss": "https://accounts.google.com", "sub": "110530994538012758503", "name": "David", "email": "david.benollol@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJNQhWmftVDfrAYDINBMHf3K5wgtN9bgl-MRtTm5nVS8iMr1aWn=s96-c", "full_name": "David", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJNQhWmftVDfrAYDINBMHf3K5wgtN9bgl-MRtTm5nVS8iMr1aWn=s96-c", "provider_id": "110530994538012758503", "email_verified": true, "phone_verified": false}}', DEFAULT, '2025-05-03 23:41:32.261125');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO storage.migrations VALUES (0, 'create-migrations-table', 'e18db593bcde2aca2a408c4d1100f6abba2195df', '2025-05-03 23:36:53.629727');
INSERT INTO storage.migrations VALUES (1, 'initialmigration', '6ab16121fbaa08bbd11b712d05f358f9b555d777', '2025-05-03 23:36:53.630827');
INSERT INTO storage.migrations VALUES (2, 'storage-schema', '5c7968fd083fcea04050c1b7f6253c9771b99011', '2025-05-03 23:36:53.631428');
INSERT INTO storage.migrations VALUES (3, 'pathtoken-column', '2cb1b0004b817b29d5b0a971af16bafeede4b70d', '2025-05-03 23:36:53.634814');
INSERT INTO storage.migrations VALUES (4, 'add-migrations-rls', '427c5b63fe1c5937495d9c635c263ee7a5905058', '2025-05-03 23:36:53.642172');
INSERT INTO storage.migrations VALUES (5, 'add-size-functions', '79e081a1455b63666c1294a440f8ad4b1e6a7f84', '2025-05-03 23:36:53.643121');
INSERT INTO storage.migrations VALUES (6, 'change-column-name-in-get-size', 'f93f62afdf6613ee5e7e815b30d02dc990201044', '2025-05-03 23:36:53.644258');
INSERT INTO storage.migrations VALUES (7, 'add-rls-to-buckets', 'e7e7f86adbc51049f341dfe8d30256c1abca17aa', '2025-05-03 23:36:53.645272');
INSERT INTO storage.migrations VALUES (8, 'add-public-to-buckets', 'fd670db39ed65f9d08b01db09d6202503ca2bab3', '2025-05-03 23:36:53.645967');
INSERT INTO storage.migrations VALUES (9, 'fix-search-function', '3a0af29f42e35a4d101c259ed955b67e1bee6825', '2025-05-03 23:36:53.646674');
INSERT INTO storage.migrations VALUES (10, 'search-files-search-function', '68dc14822daad0ffac3746a502234f486182ef6e', '2025-05-03 23:36:53.647593');
INSERT INTO storage.migrations VALUES (11, 'add-trigger-to-auto-update-updated_at-column', '7425bdb14366d1739fa8a18c83100636d74dcaa2', '2025-05-03 23:36:53.648794');
INSERT INTO storage.migrations VALUES (12, 'add-automatic-avif-detection-flag', '8e92e1266eb29518b6a4c5313ab8f29dd0d08df9', '2025-05-03 23:36:53.649981');
INSERT INTO storage.migrations VALUES (13, 'add-bucket-custom-limits', 'cce962054138135cd9a8c4bcd531598684b25e7d', '2025-05-03 23:36:53.650873');
INSERT INTO storage.migrations VALUES (14, 'use-bytes-for-max-size', '941c41b346f9802b411f06f30e972ad4744dad27', '2025-05-03 23:36:53.651663');
INSERT INTO storage.migrations VALUES (15, 'add-can-insert-object-function', '934146bc38ead475f4ef4b555c524ee5d66799e5', '2025-05-03 23:36:53.657895');
INSERT INTO storage.migrations VALUES (16, 'add-version', '76debf38d3fd07dcfc747ca49096457d95b1221b', '2025-05-03 23:36:53.658751');
INSERT INTO storage.migrations VALUES (17, 'drop-owner-foreign-key', 'f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101', '2025-05-03 23:36:53.65947');
INSERT INTO storage.migrations VALUES (18, 'add_owner_id_column_deprecate_owner', 'e7a511b379110b08e2f214be852c35414749fe66', '2025-05-03 23:36:53.660389');
INSERT INTO storage.migrations VALUES (19, 'alter-default-value-objects-id', '02e5e22a78626187e00d173dc45f58fa66a4f043', '2025-05-03 23:36:53.661489');
INSERT INTO storage.migrations VALUES (20, 'list-objects-with-delimiter', 'cd694ae708e51ba82bf012bba00caf4f3b6393b7', '2025-05-03 23:36:53.662177');
INSERT INTO storage.migrations VALUES (21, 's3-multipart-uploads', '8c804d4a566c40cd1e4cc5b3725a664a9303657f', '2025-05-03 23:36:53.663748');
INSERT INTO storage.migrations VALUES (22, 's3-multipart-uploads-big-ints', '9737dc258d2397953c9953d9b86920b8be0cdb73', '2025-05-03 23:36:53.670756');
INSERT INTO storage.migrations VALUES (23, 'optimize-search-function', '9d7e604cddc4b56a5422dc68c9313f4a1b6f132c', '2025-05-03 23:36:53.67506');
INSERT INTO storage.migrations VALUES (24, 'operation-function', '8312e37c2bf9e76bbe841aa5fda889206d2bf8aa', '2025-05-03 23:36:53.675987');
INSERT INTO storage.migrations VALUES (25, 'custom-metadata', 'd974c6057c3db1c1f847afa0e291e6165693b990', '2025-05-03 23:36:53.676894');


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Data for Name: migrations; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--

INSERT INTO supabase_functions.migrations VALUES ('initial', '2025-05-03 23:36:42.47896+00');
INSERT INTO supabase_functions.migrations VALUES ('20210809183423_update_grants', '2025-05-03 23:36:42.47896+00');


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: supabase_migrations; Owner: postgres
--

INSERT INTO supabase_migrations.schema_migrations VALUES ('20240424000000', '{"-- Create flow_stage enum type
CREATE TYPE public.flow_stage AS ENUM (''shoot'', ''payment'', ''upload'', ''review'', ''dashboard'')","COMMENT ON TYPE public.flow_stage IS ''Represents the different stages in the headshot generation workflow''","-- Create tables
CREATE TABLE users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  gender TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(''utc'', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(''utc'', NOW())
)","CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(''utc'', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(''utc'', NOW()),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE
)","CREATE TABLE styles (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id TEXT,
  name TEXT NOT NULL,
  settings JSONB NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(''utc'', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(''utc'', NOW())
)","CREATE TABLE style_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  preview_images JSONB NOT NULL DEFAULT ''[]'',
  available_genders TEXT[] NOT NULL DEFAULT ''{}'',
  available_backgrounds TEXT[] NOT NULL DEFAULT ''{}'',
  available_clothing TEXT[] NOT NULL DEFAULT ''{}'',
  available_clothing_colors TEXT[] NOT NULL DEFAULT ''{}'',
  translations jsonb DEFAULT ''{}''::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(''utc'', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(''utc'', NOW())
)","CREATE TABLE style_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL DEFAULT ''[]'',
  translations jsonb DEFAULT ''{}''::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(''utc'', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(''utc'', NOW())
)","CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL,
  amount integer,
  currency text,
  payment_intent_id text,
  payment_status text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT timezone(''utc''::text, now()),
  updated_at timestamp with time zone DEFAULT timezone(''utc''::text, now()),
  idempotency_key text,
  checkout_session_id text
)","CREATE TABLE images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  url text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone(''utc''::text, now()),
  file_name text,
  file_size bigint,
  mime_type text,
  dimensions jsonb,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE
)","CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_stage flow_stage NOT NULL,
  completed_stages flow_stage[] NOT NULL DEFAULT ''{}'',
  stage_data JSONB,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(''utc'', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(''utc'', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(''utc'', NOW()),
  UNIQUE(user_id)
)","CREATE TABLE completed_user_journeys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  journey_data JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(''utc'', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(''utc'', NOW())
)","-- Create user creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  RAISE LOG ''Creating new user with id: %, email: %'', NEW.id, NEW.email;
  
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>''full_name'',
    NEW.raw_user_meta_data->>''avatar_url''
  );
  
  RAISE LOG ''User created successfully in public.users'';
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG ''Error creating user: %'', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER","DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users","CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()","-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY","ALTER TABLE sessions ENABLE ROW LEVEL SECURITY","ALTER TABLE styles ENABLE ROW LEVEL SECURITY","ALTER TABLE style_configs ENABLE ROW LEVEL SECURITY","ALTER TABLE style_options ENABLE ROW LEVEL SECURITY","ALTER TABLE orders ENABLE ROW LEVEL SECURITY","ALTER TABLE images ENABLE ROW LEVEL SECURITY","ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY","ALTER TABLE completed_user_journeys ENABLE ROW LEVEL SECURITY","-- Create RLS policies
CREATE POLICY \"Users can view their own profile\"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id)","CREATE POLICY \"Users can update their own profile\"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)","CREATE POLICY \"Allow insert during signup\"
  ON users FOR INSERT
  TO authenticated, anon
  WITH CHECK (true)","CREATE POLICY \"Users can view their own sessions\"
  ON sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id)","CREATE POLICY \"Users can delete their own sessions\"
  ON sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id)","CREATE POLICY \"Allow public read access to style_configs\"
  ON style_configs FOR SELECT
  TO authenticated, anon
  USING (true)","CREATE POLICY \"Allow public read access to style_options\"
  ON style_options FOR SELECT
  TO authenticated, anon
  USING (true)","CREATE POLICY \"Users can manage their own styles\"
  ON styles FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)","CREATE POLICY \"Users can manage their own orders\"
  ON orders FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)","CREATE POLICY \"Users can manage their own images\"
  ON images FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)","CREATE POLICY \"Users can manage their own progress\"
  ON user_progress FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)","CREATE POLICY \"Users can view their own completed journeys\"
  ON completed_user_journeys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id)","-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE(''utc'', NOW());
  RETURN NEW;
END;
$$ language ''plpgsql''","CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column()","CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column()","CREATE TRIGGER update_styles_updated_at
  BEFORE UPDATE ON styles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column()","CREATE TRIGGER update_style_configs_updated_at
  BEFORE UPDATE ON style_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column()","CREATE TRIGGER update_style_options_updated_at
  BEFORE UPDATE ON style_options
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column()","CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column()","CREATE TRIGGER update_images_updated_at
  BEFORE UPDATE ON images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column()","CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column()","CREATE TRIGGER update_completed_user_journeys_updated_at
  BEFORE UPDATE ON completed_user_journeys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column()","-- Add descriptions to all tables and their columns

-- Users table
COMMENT ON TABLE users IS ''Stores user profile information and authentication details''","COMMENT ON COLUMN users.id IS ''Primary key, references auth.users''","COMMENT ON COLUMN users.email IS ''User''''s email address''","COMMENT ON COLUMN users.full_name IS ''User''''s full name''","COMMENT ON COLUMN users.avatar_url IS ''URL to user''''s profile picture''","COMMENT ON COLUMN users.gender IS ''User''''s gender preference for headshot generation''","COMMENT ON COLUMN users.created_at IS ''Timestamp when the user profile was created''","COMMENT ON COLUMN users.updated_at IS ''Timestamp when the user profile was last updated''","-- Sessions table
COMMENT ON TABLE sessions IS ''Stores user session information for authentication''","COMMENT ON COLUMN sessions.id IS ''Unique identifier for the session''","COMMENT ON COLUMN sessions.user_id IS ''Reference to the user who owns this session''","COMMENT ON COLUMN sessions.created_at IS ''Timestamp when the session was created''","COMMENT ON COLUMN sessions.updated_at IS ''Timestamp when the session was last updated''","COMMENT ON COLUMN sessions.expires_at IS ''Timestamp when the session expires''","COMMENT ON COLUMN sessions.last_accessed_at IS ''Timestamp when the session was last accessed''","-- Styles table
COMMENT ON TABLE styles IS ''Stores user-created headshot style configurations''","COMMENT ON COLUMN styles.id IS ''Unique identifier for the style''","COMMENT ON COLUMN styles.user_id IS ''Reference to the user who created the style''","COMMENT ON COLUMN styles.order_id IS ''Reference to the order this style is associated with''","COMMENT ON COLUMN styles.name IS ''Name of the style''","COMMENT ON COLUMN styles.settings IS ''JSON configuration for the style settings''","COMMENT ON COLUMN styles.status IS ''Current status of the style (draft, active, etc.)''","COMMENT ON COLUMN styles.created_at IS ''Timestamp when the style was created''","COMMENT ON COLUMN styles.updated_at IS ''Timestamp when the style was last updated''","-- Style configs table
COMMENT ON TABLE style_configs IS ''Stores predefined style configuration templates''","COMMENT ON COLUMN style_configs.id IS ''Unique identifier for the style config''","COMMENT ON COLUMN style_configs.name IS ''Name of the style configuration''","COMMENT ON COLUMN style_configs.tagline IS ''Short description or tagline for the style''","COMMENT ON COLUMN style_configs.description IS ''Detailed description of the style''","COMMENT ON COLUMN style_configs.preview_images IS ''JSON array of preview image URLs''","COMMENT ON COLUMN style_configs.available_genders IS ''Array of supported gender options''","COMMENT ON COLUMN style_configs.available_backgrounds IS ''Array of available background options''","COMMENT ON COLUMN style_configs.available_clothing IS ''Array of available clothing options''","COMMENT ON COLUMN style_configs.available_clothing_colors IS ''Array of available clothing color options''","COMMENT ON COLUMN style_configs.translations IS ''JSON object containing localized strings for name, tagline, and description keyed by language code''","COMMENT ON COLUMN style_configs.created_at IS ''Timestamp when the config was created''","COMMENT ON COLUMN style_configs.updated_at IS ''Timestamp when the config was last updated''","-- Style options table
COMMENT ON TABLE style_options IS ''Stores available options for different style categories''","COMMENT ON COLUMN style_options.id IS ''Unique identifier for the style option''","COMMENT ON COLUMN style_options.category IS ''Category of the style option (e.g., background, clothing)''","COMMENT ON COLUMN style_options.label IS ''Display label for the option''","COMMENT ON COLUMN style_options.description IS ''Detailed description of the option''","COMMENT ON COLUMN style_options.options IS ''JSON array of specific options within this category''","COMMENT ON COLUMN style_options.translations IS ''JSON object containing localized strings for label and description keyed by language code''","COMMENT ON COLUMN style_options.created_at IS ''Timestamp when the option was created''","COMMENT ON COLUMN style_options.updated_at IS ''Timestamp when the option was last updated''","-- User progress table
COMMENT ON TABLE user_progress IS ''Tracks user progress through the headshot generation workflow''","COMMENT ON COLUMN user_progress.id IS ''Unique identifier for the progress entry''","COMMENT ON COLUMN user_progress.user_id IS ''Reference to the user''","COMMENT ON COLUMN user_progress.current_stage IS ''Current stage in the workflow''","COMMENT ON COLUMN user_progress.completed_stages IS ''Array of completed workflow stages''","COMMENT ON COLUMN user_progress.stage_data IS ''JSON data specific to the current stage''","COMMENT ON COLUMN user_progress.last_active_at IS ''Timestamp of user''''s last activity''","COMMENT ON COLUMN user_progress.created_at IS ''Timestamp when the progress tracking started''","COMMENT ON COLUMN user_progress.updated_at IS ''Timestamp when the progress was last updated''","-- Completed user journeys table
COMMENT ON TABLE completed_user_journeys IS ''Archives completed headshot generation workflows''","COMMENT ON COLUMN completed_user_journeys.id IS ''Unique identifier for the completed journey''","COMMENT ON COLUMN completed_user_journeys.user_id IS ''Reference to the user who completed the journey''","COMMENT ON COLUMN completed_user_journeys.journey_data IS ''JSON data containing the complete journey details''","COMMENT ON COLUMN completed_user_journeys.completed_at IS ''Timestamp when the journey was completed''","COMMENT ON COLUMN completed_user_journeys.created_at IS ''Timestamp when the journey record was created''","COMMENT ON COLUMN completed_user_journeys.updated_at IS ''Timestamp when the journey record was last updated''","-- Orders table
COMMENT ON TABLE orders IS ''Stores headshot orders and their payment/processing status''","COMMENT ON COLUMN orders.id IS ''Unique identifier for the order''","COMMENT ON COLUMN orders.user_id IS ''Reference to the user who created the order''","COMMENT ON COLUMN orders.status IS ''Current status of the order (draft, pending_payment, paid, processing, completed, cancelled)''","COMMENT ON COLUMN orders.amount IS ''Total amount for the order in smallest currency unit (e.g., cents)''","COMMENT ON COLUMN orders.currency IS ''Three-letter currency code (e.g., USD)''","COMMENT ON COLUMN orders.payment_intent_id IS ''Stripe payment intent ID for tracking payment status''","COMMENT ON COLUMN orders.payment_status IS ''Current status of the payment (pending, succeeded, failed)''","COMMENT ON COLUMN orders.metadata IS ''Additional order metadata stored as JSON''","COMMENT ON COLUMN orders.created_at IS ''Timestamp when the order was created''","COMMENT ON COLUMN orders.updated_at IS ''Timestamp when the order was last updated''","COMMENT ON COLUMN orders.idempotency_key IS ''Stripe idempotency key used for the most recent payment attempt''","COMMENT ON COLUMN orders.checkout_session_id IS ''Stripe checkout session ID for checkout-based payments''","-- Images table
COMMENT ON TABLE images IS ''Stores user-uploaded images and their metadata''","COMMENT ON COLUMN images.id IS ''Unique identifier for the image''","COMMENT ON COLUMN images.user_id IS ''Reference to the user who owns the image''","COMMENT ON COLUMN images.url IS ''Public URL where the image can be accessed''","COMMENT ON COLUMN images.created_at IS ''Timestamp when the image was uploaded''","COMMENT ON COLUMN images.file_name IS ''Original filename of the uploaded image''","COMMENT ON COLUMN images.file_size IS ''Size of the image file in bytes''","COMMENT ON COLUMN images.mime_type IS ''MIME type of the image (e.g., image/jpeg)''","COMMENT ON COLUMN images.dimensions IS ''Image dimensions stored as JSON {width: number, height: number}''","COMMENT ON COLUMN images.order_id IS ''Reference to the order this image belongs to''","-- Create function to generate unique style ID
CREATE OR REPLACE FUNCTION generate_style_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate a style ID in format: style_<timestamp>_<random>
  NEW.id := ''style_'' || 
            TO_CHAR(CURRENT_TIMESTAMP, ''YYYYMMDDHH24MISS'') || 
            ''_'' || 
            SUBSTR(MD5(RANDOM()::TEXT), 1, 6);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql","-- Create trigger for styles table
CREATE TRIGGER set_style_id
  BEFORE INSERT ON styles
  FOR EACH ROW
  EXECUTE FUNCTION generate_style_id()","-- Add comment for the trigger
COMMENT ON FUNCTION generate_style_id IS ''Automatically generates a unique style ID for new styles''"}', 'initial_schema');
INSERT INTO supabase_migrations.schema_migrations VALUES ('20240424143000', '{"-- Add UNIQUE constraint to style_options.category
ALTER TABLE style_options
  ADD CONSTRAINT style_options_category_unique UNIQUE (category)","-- Add comment explaining the constraint
COMMENT ON CONSTRAINT style_options_category_unique ON style_options IS 
  ''Ensures each category (background, clothing, clothingColor) only appears once in the table to match API assumptions''"}', 'add_style_options_category_unique_constraint');
INSERT INTO supabase_migrations.schema_migrations VALUES ('20240430000000', '{"-- Convert order_id in styles table to UUID type
ALTER TABLE styles 
  ALTER COLUMN order_id TYPE uuid USING order_id::uuid","-- Add foreign key constraint if it doesn''t exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = ''styles_order_id_fkey''
  ) THEN
    ALTER TABLE styles
      ADD CONSTRAINT styles_order_id_fkey 
      FOREIGN KEY (order_id) 
      REFERENCES orders(id)
      ON DELETE CASCADE;
  END IF;
END
$$","-- Add comment explaining the constraint
COMMENT ON CONSTRAINT styles_order_id_fkey ON styles IS 
  ''Links styles to their associated order, cascade deletes styles when order is deleted''"}', 'fix_styles_order_id_type');
INSERT INTO supabase_migrations.schema_migrations VALUES ('20240430000001', '{"-- Temporarily remove the foreign key if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = ''styles_order_id_fkey''
  ) THEN
    ALTER TABLE styles DROP CONSTRAINT styles_order_id_fkey;
  END IF;
END
$$","-- Create a temporary column with the new type
ALTER TABLE styles ADD COLUMN order_id_new uuid","-- Update the new column, handling invalid UUIDs
DO $$
BEGIN
  -- Try to convert valid UUIDs
  UPDATE styles 
  SET order_id_new = order_id::uuid 
  WHERE order_id IS NOT NULL;
EXCEPTION WHEN OTHERS THEN
  -- If any conversion fails, we''ll handle it in the next step
  NULL;
END
$$","-- Drop the old column and rename the new one
ALTER TABLE styles DROP COLUMN order_id","ALTER TABLE styles RENAME COLUMN order_id_new TO order_id","-- Add the foreign key constraint
ALTER TABLE styles
  ADD CONSTRAINT styles_order_id_fkey 
  FOREIGN KEY (order_id) 
  REFERENCES orders(id)
  ON DELETE CASCADE","-- Add comment explaining the constraint
COMMENT ON CONSTRAINT styles_order_id_fkey ON styles IS 
  ''Links styles to their associated order, cascade deletes styles when order is deleted''"}', 'fix_styles_order_id_type_safe');
INSERT INTO supabase_migrations.schema_migrations VALUES ('20250428155106', '{"-- Create language preferences table
CREATE TABLE IF NOT EXISTS public.user_language_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_language VARCHAR DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
)","-- Add RLS policies
ALTER TABLE public.user_language_preferences ENABLE ROW LEVEL SECURITY","DROP POLICY IF EXISTS \"Users can read their own language preference\" ON public.user_language_preferences","CREATE POLICY \"Users can read their own language preference\" ON public.user_language_preferences
    FOR SELECT
    USING (auth.uid() = user_id)","DROP POLICY IF EXISTS \"Users can update their own language preference\" ON public.user_language_preferences","CREATE POLICY \"Users can update their own language preference\" ON public.user_language_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id)","DROP POLICY IF EXISTS \"Users can insert their own language preference\" ON public.user_language_preferences","CREATE POLICY \"Users can insert their own language preference\" ON public.user_language_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id)","-- Create function to get language preference
CREATE OR REPLACE FUNCTION public.get_language_preference()
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    lang VARCHAR;
BEGIN
    SELECT preferred_language INTO lang
    FROM public.user_language_preferences
    WHERE user_id = auth.uid();
    
    -- Return NULL if no preference is set, allowing i18next to use its default
    RETURN lang;
END;
$$","-- Create function to update language preference
CREATE OR REPLACE FUNCTION public.update_language_preference(new_language VARCHAR)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_language_preferences (user_id, preferred_language)
    VALUES (auth.uid(), new_language)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        preferred_language = EXCLUDED.preferred_language,
        updated_at = NOW();
END;
$$","-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_language_preference TO authenticated","GRANT EXECUTE ON FUNCTION public.update_language_preference TO authenticated","-- Rollback statements (commented out)
/*
DROP POLICY IF EXISTS \"Users can update their own language preference\" ON auth.users;
DROP FUNCTION IF EXISTS public.update_language_preference;
DROP FUNCTION IF EXISTS public.get_language_preference;
ALTER TABLE auth.users DROP COLUMN IF EXISTS preferred_language;
*/"}', 'add_language_preference');
INSERT INTO supabase_migrations.schema_migrations VALUES ('20250428214535', '{"-- Seed style_configs table
INSERT INTO style_configs (id, name, tagline, description, preview_images, available_genders, available_backgrounds, available_clothing, available_clothing_colors, translations) 
VALUES 
(
  ''editorial'',
  ''Editorial'',
  ''Story-Driven. Stylised. Striking.'',
  ''A cinematic, magazine-worthy aesthetic. Expressive and fashion-forward — stand out with personality and mood.'',
  ''[\"outdoor-fashion-1.webp\", \"outdoor-fashion-2.webp\", \"outdoor-fashion-3.webp\", \"outdoor-fashion-4.webp\", \"outdoor-fashion-4.webp\"]'',
  ARRAY[''male'', ''female''],
  ARRAY[''plain-light'',''plain-dark'',''plain-orange'',''plain-blue'',''plain-teal''],
  ARRAY[''hoodie'',''shirt'',''polo'',''henley'',''jacket'',''fishermans-jumper''],
  ARRAY[''#000000'',''#FFFFFF'',''#2A9D47'',''#3B82F6'',''#FF7F39'',''#D22D2D'',''#FC84E2'',''#A28DF7'',''#6B7280'',''#4F46E5''],
  ''{
    \"es\": {
      \"name\": \"Editorial\",
      \"tagline\": \"Narrativo. Estilizado. Impactante.\",
      \"description\": \"Una estética cinematográfica digna de revista. Expresivo y vanguardista — destaca con personalidad y ambiente.\"
    },
    \"fr\": {
      \"name\": \"Éditorial\",
      \"tagline\": \"Narratif. Stylisé. Saisissant.\",
      \"description\": \"Une esthétique cinématographique digne des magazines. Expressif et avant-gardiste — démarquez-vous avec personnalité et ambiance.\"
    },
    \"it\": {
      \"name\": \"Editoriale\",
      \"tagline\": \"Narrativo. Stilizzato. Impressionante.\",
      \"description\": \"Un''''estetica cinematografica degna di una rivista. Espressivo e all''''avanguardia — distinguiti con personalità e atmosfera.\"
    },
    \"pt\": {
      \"name\": \"Editorial\",
      \"tagline\": \"Narrativo. Estilizado. Impactante.\",
      \"description\": \"Uma estética cinematográfica digna de revista. Expressivo e vanguardista — destaque-se com personalidade e atmosfera.\"
    },
    \"de\": {
      \"name\": \"Editorial\",
      \"tagline\": \"Erzählerisch. Stilisiert. Eindrucksvoll.\",
      \"description\": \"Eine filmische, magazinwürdige Ästhetik. Expressiv und modisch — stechen Sie mit Persönlichkeit und Stimmung hervor.\"
    },
    \"nl\": {
      \"name\": \"Editorial\",
      \"tagline\": \"Verhalend. Gestileerd. Opvallend.\",
      \"description\": \"Een cinematografische, magazine-waardige esthetiek. Expressief en vooruitstrevend — val op met persoonlijkheid en sfeer.\"
    },
    \"zh\": {
      \"name\": \"杂志风格\",
      \"tagline\": \"叙事性。风格化。引人注目。\",
      \"description\": \"电影般的杂志级美学。富有表现力和前卫感 — 以独特个性和氛围脱颖而出。\"
    },
    \"ja\": {
      \"name\": \"エディトリアル\",
      \"tagline\": \"ストーリー性。様式的。印象的。\",
      \"description\": \"映画のような雑誌品質の美学。表現力豊かでファッション性の高い — 個性と雰囲気で際立ちます。\"
    }
  }''::jsonb
),
(
  ''corporate'',
  ''Corporate'',
  ''Professional. Approachable. Trusted.'',
  ''Professional and approachable, perfect for LinkedIn, team pages, and pitch decks — designed to make a confident first impression.'',
  ''[\"business-2.webp\", \"business-1.webp\", \"business-3.webp\", \"business-1.webp\", \"business-3.webp\"]'',
  ARRAY[''male'', ''female''],
  ARRAY[''plain-light'',''plain-dark'',''plain-orange'',''plain-blue'',''plain-teal''],
  ARRAY[''suit-jacket-shirt'',''shirt'',''polo'',''henley'',''jacket''],
  ARRAY[''#000000'',''#FFFFFF'',''#2A9D47'',''#3B82F6'',''#FF7F39'',''#D22D2D'',''#FC84E2'',''#A28DF7'',''#6B7280'',''#4F46E5''],
  ''{
    \"es\": {
      \"name\": \"Corporativo\",
      \"tagline\": \"Profesional. Accesible. Confiable.\",
      \"description\": \"Profesional y accesible, perfecto para LinkedIn, páginas de equipo y presentaciones — diseñado para dar una primera impresión segura.\"
    },
    \"fr\": {
      \"name\": \"Corporate\",
      \"tagline\": \"Professionnel. Accessible. Fiable.\",
      \"description\": \"Professionnel et accessible, parfait pour LinkedIn, les pages d''''équipe et les présentations — conçu pour donner une première impression assurée.\"
    },
    \"it\": {
      \"name\": \"Corporate\",
      \"tagline\": \"Professionale. Accessibile. Affidabile.\",
      \"description\": \"Professionale e accessibile, perfetto per LinkedIn, pagine del team e presentazioni — progettato per dare una prima impressione sicura.\"
    },
    \"pt\": {
      \"name\": \"Corporativo\",
      \"tagline\": \"Profissional. Acessível. Confiável.\",
      \"description\": \"Profissional e acessível, perfeito para LinkedIn, páginas de equipe e apresentações — projetado para criar uma primeira impressão confiante.\"
    },
    \"de\": {
      \"name\": \"Business\",
      \"tagline\": \"Professionell. Zugänglich. Vertrauenswürdig.\",
      \"description\": \"Professionell und zugänglich, perfekt für LinkedIn, Teamseiten und Pitch-Decks — entwickelt für einen selbstbewussten ersten Eindruck.\"
    },
    \"nl\": {
      \"name\": \"Zakelijk\",
      \"tagline\": \"Professioneel. Benaderbaar. Betrouwbaar.\",
      \"description\": \"Professioneel en toegankelijk, perfect voor LinkedIn, teampagina''''s en pitch decks — ontworpen om een zelfverzekerde eerste indruk te maken.\"
    },
    \"zh\": {
      \"name\": \"商务风格\",
      \"tagline\": \"专业。平易近人。值得信赖。\",
      \"description\": \"专业且平易近人，完美适用于领英、团队页面和演示文稿 — 旨在创造自信的第一印象。\"
    },
    \"ja\": {
      \"name\": \"コーポレート\",
      \"tagline\": \"プロフェッショナル。親しみやすい。信頼感。\",
      \"description\": \"プロフェッショナルで親しみやすい、LinkedIn、チームページ、ピッチデッキに最適 — 自信に満ちた第一印象を作るためにデザインされました。\"
    }
  }''::jsonb
),
(
  ''studio'',
  ''Studio'',
  ''Polished. Professional. Powerful.'',
  ''Step into the spotlight with Studio style — clean, high-impact headshots perfect for portfolios, castings, and personal branding.'',
  ''[\"studio-1.webp\", \"studio-2.webp\", \"studio-3.webp\", \"studio-1.webp\", \"studio-2.webp\"]'',
  ARRAY[''male'', ''female''],
  ARRAY[''plain-light'',''plain-dark'',''plain-orange'',''plain-blue'',''plain-teal''],
  ARRAY[''shirt'',''polo'',''henley'',''jacket'',''fishermans-jumper''],
  ARRAY[''#000000'',''#FFFFFF'',''#2A9D47'',''#3B82F6'',''#FF7F39'',''#D22D2D'',''#FC84E2'',''#A28DF7'',''#6B7280'',''#4F46E5''],
  ''{
    \"es\": {
      \"name\": \"Estudio\",
      \"tagline\": \"Refinado. Profesional. Poderoso.\",
      \"description\": \"Paso al centro de la cámara con el estilo Estudio — imágenes de cabecera limpias y de alto impacto perfectas para portafolios, casting y branding personal.\"
    },
    \"fr\": {
      \"name\": \"Studio\",
      \"tagline\": \"Raffiné. Professionnel. Puissant.\",
      \"description\": \"Entrez dans la lumière avec le style Studio — des portraits nets et percutants, parfaits pour les portfolios, les castings et l''''image de marque personnelle.\"
    },
    \"it\": {
      \"name\": \"Studio\",
      \"tagline\": \"Raffinato. Professionale. Potente.\",
      \"description\": \"Entra sotto i riflettori con lo stile Studio — ritratti puliti e d''''impatto perfetti per portfolio, casting e personal branding.\"
    },
    \"pt\": {
      \"name\": \"Estúdio\",
      \"tagline\": \"Refinado. Profissional. Poderoso.\",
      \"description\": \"Entre sob os holofotes com o estilo Estúdio — fotos limpas e de alto impacto perfeitas para portfólios, testes e marca pessoal.\"
    },
    \"de\": {
      \"name\": \"Studio\",
      \"tagline\": \"Poliert. Professionell. Kraftvoll.\",
      \"description\": \"Treten Sie mit dem Studio-Stil ins Rampenlicht — klare, wirkungsvolle Portraits, perfekt für Portfolios, Castings und persönliches Branding.\"
    },
    \"nl\": {
      \"name\": \"Studio\",
      \"tagline\": \"Gepolijst. Professioneel. Krachtig.\",
      \"description\": \"Stap in de spotlight met de Studio-stijl — strakke, impactvolle headshots perfect voor portfolio''''s, castings en personal branding.\"
    },
    \"zh\": {
      \"name\": \"工作室风格\",
      \"tagline\": \"精致。专业。有力。\",
      \"description\": \"以工作室风格步入聚光灯下 — 干净、具有冲击力的头像照片，完美适用于作品集、试镜和个人品牌塑造。\"
    },
    \"ja\": {
      \"name\": \"スタジオ\",
      \"tagline\": \"洗練。プロフェッショナル。パワフル。\",
      \"description\": \"スタジオスタイルでスポットライトを浴びましょう — ポートフォリオ、キャスティング、パーソナルブランディングに最適なクリーンで印象的なヘッドショット。\"
    }
  }''::jsonb
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
  translations = EXCLUDED.translations","-- Seed style_options table
INSERT INTO style_options (category, label, description, options, translations) 
VALUES 
(
  ''background'',
  ''Background'',
  ''Pick a background style. The examples give a general feel, actual results may differ slightly.'',
  ''[
    {\"id\": \"plain-light\", \"label\": \"Studio Light\", \"translations\": { 
      \"es\": {\"label\": \"Estudio Claro\"},
      \"fr\": {\"label\": \"Studio Clair\"},
      \"it\": {\"label\": \"Studio Chiaro\"},
      \"pt\": {\"label\": \"Estúdio Claro\"},
      \"de\": {\"label\": \"Studio Hell\"},
      \"nl\": {\"label\": \"Studio Licht\"},
      \"zh\": {\"label\": \"明亮工作室\"},
      \"ja\": {\"label\": \"スタジオライト\"}
    }, \"imageUrl\": \"bg-plain-light.webp\"}, 
    {\"id\": \"plain-dark\", \"label\": \"Studio Dark\", \"translations\": { 
      \"es\": {\"label\": \"Estudio Oscuro\"},
      \"fr\": {\"label\": \"Studio Sombre\"},
      \"it\": {\"label\": \"Studio Scuro\"},
      \"pt\": {\"label\": \"Estúdio Escuro\"},
      \"de\": {\"label\": \"Studio Dunkel\"},
      \"nl\": {\"label\": \"Studio Donker\"},
      \"zh\": {\"label\": \"暗调工作室\"},
      \"ja\": {\"label\": \"スタジオダーク\"}
    }, \"imageUrl\": \"bg-plain-dark.webp\"}, 
    {\"id\": \"plain-orange\", \"label\": \"Studio Orange\", \"translations\": { 
      \"es\": {\"label\": \"Estudio Naranja\"},
      \"fr\": {\"label\": \"Studio Orange\"},
      \"it\": {\"label\": \"Studio Arancione\"},
      \"pt\": {\"label\": \"Estúdio Laranja\"},
      \"de\": {\"label\": \"Studio Orange\"},
      \"nl\": {\"label\": \"Studio Oranje\"},
      \"zh\": {\"label\": \"橙色工作室\"},
      \"ja\": {\"label\": \"スタジオオレンジ\"}
    }, \"imageUrl\": \"bg-plain-orange.webp\"}, 
    {\"id\": \"plain-blue\", \"label\": \"Studio Blue\", \"translations\": { 
      \"es\": {\"label\": \"Estudio Azul\"},
      \"fr\": {\"label\": \"Studio Bleu\"},
      \"it\": {\"label\": \"Studio Blu\"},
      \"pt\": {\"label\": \"Estúdio Azul\"},
      \"de\": {\"label\": \"Studio Blau\"},
      \"nl\": {\"label\": \"Studio Blauw\"},
      \"zh\": {\"label\": \"蓝色工作室\"},
      \"ja\": {\"label\": \"スタジオブルー\"}
    }, \"imageUrl\": \"bg-plain-blue.webp\"}, 
    {\"id\": \"plain-teal\", \"label\": \"Studio Teal\", \"translations\": { 
      \"es\": {\"label\": \"Estudio Verde\"},
      \"fr\": {\"label\": \"Studio Turquoise\"},
      \"it\": {\"label\": \"Studio Turchese\"},
      \"pt\": {\"label\": \"Estúdio Verde-água\"},
      \"de\": {\"label\": \"Studio Türkis\"},
      \"nl\": {\"label\": \"Studio Groenblauw\"},
      \"zh\": {\"label\": \"青色工作室\"},
      \"ja\": {\"label\": \"スタジオティール\"}
    }, \"imageUrl\": \"bg-plain-teal.webp\"}
  ]''::jsonb,
  ''{
    \"es\": {
      \"label\": \"Fondo\",
      \"description\": \"Elige el estilo del fondo de tu foto\"
    },
    \"fr\": {
      \"label\": \"Arrière-plan\",
      \"description\": \"Choisissez le style d''''arrière-plan de votre photo\"
    },
    \"it\": {
      \"label\": \"Sfondo\",
      \"description\": \"Scegli lo stile dello sfondo della tua foto\"
    },
    \"pt\": {
      \"label\": \"Fundo\",
      \"description\": \"Escolha o estilo do fundo da sua foto\"
    },
    \"de\": {
      \"label\": \"Hintergrund\",
      \"description\": \"Wählen Sie den Hintergrundstil für Ihr Foto\"
    },
    \"nl\": {
      \"label\": \"Achtergrond\",
      \"description\": \"Kies de achtergrondstijl voor uw foto\"
    },
    \"zh\": {
      \"label\": \"背景\",
      \"description\": \"选择您照片的背景风格\"
    },
    \"ja\": {
      \"label\": \"背景\",
      \"description\": \"写真の背景スタイルを選択してください\"
    }
  }''::jsonb
),
(
  ''clothing'',
  ''Clothing Type'',
  ''Choose a clothing style for your headshot. The samples are representative, but the final look may vary.'',
  ''[
    {\"id\": \"hoodie\", \"label\": \"Hoodie\", \"translations\": { 
      \"es\": {\"label\": \"Sudadera con Capucha\"},
      \"fr\": {\"label\": \"Sweat à Capuche\"},
      \"it\": {\"label\": \"Felpa con Cappuccio\"},
      \"pt\": {\"label\": \"Moletom com Capuz\"},
      \"de\": {\"label\": \"Kapuzenpullover\"},
      \"nl\": {\"label\": \"Hoodie\"},
      \"zh\": {\"label\": \"连帽衫\"},
      \"ja\": {\"label\": \"パーカー\"}
    }, \"imageUrl\": \"hoodie.webp\"}, 
    {\"id\": \"suit-jacket-shirt\", \"label\": \"Suit Jacket/Shirt\", \"translations\": { 
      \"es\": {\"label\": \"Chaqueta de Traje/Camisa\"},
      \"fr\": {\"label\": \"Veste de Costume/Chemise\"},
      \"it\": {\"label\": \"Giacca/Camicia\"},
      \"pt\": {\"label\": \"Paletó/Camisa\"},
      \"de\": {\"label\": \"Anzugjacke/Hemd\"},
      \"nl\": {\"label\": \"Colbert/Overhemd\"},
      \"zh\": {\"label\": \"西装外套/衬衫\"},
      \"ja\": {\"label\": \"スーツジャケット/シャツ\"}
    }, \"imageUrl\": \"blazer-shirt.webp\"}, 
    {\"id\": \"shirt\", \"label\": \"Shirt\", \"translations\": { 
      \"es\": {\"label\": \"Camisa\"},
      \"fr\": {\"label\": \"Chemise\"},
      \"it\": {\"label\": \"Camicia\"},
      \"pt\": {\"label\": \"Camisa\"},
      \"de\": {\"label\": \"Hemd\"},
      \"nl\": {\"label\": \"Overhemd\"},
      \"zh\": {\"label\": \"衬衫\"},
      \"ja\": {\"label\": \"シャツ\"}
    }, \"imageUrl\": \"shirt.webp\"}, 
    {\"id\": \"polo\", \"label\": \"Polo\", \"translations\": { 
      \"es\": {\"label\": \"Polo\"},
      \"fr\": {\"label\": \"Polo\"},
      \"it\": {\"label\": \"Polo\"},
      \"pt\": {\"label\": \"Polo\"},
      \"de\": {\"label\": \"Poloshirt\"},
      \"nl\": {\"label\": \"Polo\"},
      \"zh\": {\"label\": \"polo衫\"},
      \"ja\": {\"label\": \"ポロシャツ\"}
    }, \"imageUrl\": \"polo.webp\"}, 
    {\"id\": \"henley\", \"label\": \"Henley\", \"translations\": { 
      \"es\": {\"label\": \"Henley\"},
      \"fr\": {\"label\": \"Henley\"},
      \"it\": {\"label\": \"Henley\"},
      \"pt\": {\"label\": \"Henley\"},
      \"de\": {\"label\": \"Henley\"},
      \"nl\": {\"label\": \"Henley\"},
      \"zh\": {\"label\": \"亨利领\"},
      \"ja\": {\"label\": \"ヘンリーネック\"}
    }, \"imageUrl\": \"henley.webp\"}, 
    {\"id\": \"jacket\", \"label\": \"Jacket\", \"translations\": { 
      \"es\": {\"label\": \"Chaqueta\"},
      \"fr\": {\"label\": \"Veste\"},
      \"it\": {\"label\": \"Giacca\"},
      \"pt\": {\"label\": \"Jaqueta\"},
      \"de\": {\"label\": \"Jacke\"},
      \"nl\": {\"label\": \"Jas\"},
      \"zh\": {\"label\": \"夹克\"},
      \"ja\": {\"label\": \"ジャケット\"}
    }, \"imageUrl\": \"jacket.webp\"}, 
    {\"id\": \"fishermans-jumper\", \"label\": \"Fishermans Jumper\", \"translations\": { 
      \"es\": {\"label\": \"Suéter de Pescador\"},
      \"fr\": {\"label\": \"Pull Marin\"},
      \"it\": {\"label\": \"Maglione da Pescatore\"},
      \"pt\": {\"label\": \"Suéter de Pescador\"},
      \"de\": {\"label\": \"Fischerpullover\"},
      \"nl\": {\"label\": \"Visserstrui\"},
      \"zh\": {\"label\": \"渔夫毛衣\"},
      \"ja\": {\"label\": \"フィッシャーマンセーター\"}
    }, \"imageUrl\": \"fishermans-jumper.webp\"}
  ]''::jsonb,
  ''{
    \"es\": {
      \"label\": \"Tipo de Vestuario\",
      \"description\": \"Selecciona tu estilo de vestuario preferido\"
    },
    \"fr\": {
      \"label\": \"Type de Vêtement\",
      \"description\": \"Choisissez votre style vestimentaire préféré\"
    },
    \"it\": {
      \"label\": \"Tipo di Abbigliamento\",
      \"description\": \"Scegli il tuo stile di abbigliamento preferito\"
    },
    \"pt\": {
      \"label\": \"Tipo de Roupa\",
      \"description\": \"Selecione seu estilo de roupa preferido\"
    },
    \"de\": {
      \"label\": \"Kleidungsart\",
      \"description\": \"Wählen Sie Ihren bevorzugten Kleidungsstil\"
    },
    \"nl\": {
      \"label\": \"Type Kleding\",
      \"description\": \"Kies uw gewenste kledingstijl\"
    },
    \"zh\": {
      \"label\": \"服装类型\",
      \"description\": \"选择您喜欢的服装风格\"
    },
    \"ja\": {
      \"label\": \"衣類の種類\",
      \"description\": \"お好みの服装スタイルを選択してください\"
    }
  }''::jsonb
),
(
  ''clothingColor'',
  ''Clothing Color'',
  ''Select a clothing colour you prefer. The shade shown is a guide, results may have subtle differences.'',
  ''[
    {\"id\": \"#000000\", \"label\": \"Black\", \"translations\": { 
      \"es\": {\"label\": \"Negro\"},
      \"fr\": {\"label\": \"Noir\"},
      \"it\": {\"label\": \"Nero\"},
      \"pt\": {\"label\": \"Preto\"},
      \"de\": {\"label\": \"Schwarz\"},
      \"nl\": {\"label\": \"Zwart\"},
      \"zh\": {\"label\": \"黑色\"},
      \"ja\": {\"label\": \"黒\"}
    }}, 
    {\"id\": \"#FFFFFF\", \"label\": \"White\", \"translations\": { 
      \"es\": {\"label\": \"Blanco\"},
      \"fr\": {\"label\": \"Blanc\"},
      \"it\": {\"label\": \"Bianco\"},
      \"pt\": {\"label\": \"Branco\"},
      \"de\": {\"label\": \"Weiß\"},
      \"nl\": {\"label\": \"Wit\"},
      \"zh\": {\"label\": \"白色\"},
      \"ja\": {\"label\": \"白\"}
    }}, 
    {\"id\": \"#2A9D47\", \"label\": \"Green\", \"translations\": { 
      \"es\": {\"label\": \"Verde\"},
      \"fr\": {\"label\": \"Vert\"},
      \"it\": {\"label\": \"Verde\"},
      \"pt\": {\"label\": \"Verde\"},
      \"de\": {\"label\": \"Grün\"},
      \"nl\": {\"label\": \"Groen\"},
      \"zh\": {\"label\": \"绿色\"},
      \"ja\": {\"label\": \"緑\"}
    }}, 
    {\"id\": \"#3B82F6\", \"label\": \"Blue\", \"translations\": { 
      \"es\": {\"label\": \"Azul\"},
      \"fr\": {\"label\": \"Bleu\"},
      \"it\": {\"label\": \"Blu\"},
      \"pt\": {\"label\": \"Azul\"},
      \"de\": {\"label\": \"Blau\"},
      \"nl\": {\"label\": \"Blauw\"},
      \"zh\": {\"label\": \"蓝色\"},
      \"ja\": {\"label\": \"青\"}
    }}, 
    {\"id\": \"#FF7F39\", \"label\": \"Orange\", \"translations\": { 
      \"es\": {\"label\": \"Naranja\"},
      \"fr\": {\"label\": \"Orange\"},
      \"it\": {\"label\": \"Arancione\"},
      \"pt\": {\"label\": \"Laranja\"},
      \"de\": {\"label\": \"Orange\"},
      \"nl\": {\"label\": \"Oranje\"},
      \"zh\": {\"label\": \"橙色\"},
      \"ja\": {\"label\": \"オレンジ\"}
    }}, 
    {\"id\": \"#D22D2D\", \"label\": \"Red\", \"translations\": { 
      \"es\": {\"label\": \"Rojo\"},
      \"fr\": {\"label\": \"Rouge\"},
      \"it\": {\"label\": \"Rosso\"},
      \"pt\": {\"label\": \"Vermelho\"},
      \"de\": {\"label\": \"Rot\"},
      \"nl\": {\"label\": \"Rood\"},
      \"zh\": {\"label\": \"红色\"},
      \"ja\": {\"label\": \"赤\"}
    }}, 
    {\"id\": \"#FC84E2\", \"label\": \"Pink\", \"translations\": { 
      \"es\": {\"label\": \"Rosa\"},
      \"fr\": {\"label\": \"Rose\"},
      \"it\": {\"label\": \"Rosa\"},
      \"pt\": {\"label\": \"Rosa\"},
      \"de\": {\"label\": \"Pink\"},
      \"nl\": {\"label\": \"Roze\"},
      \"zh\": {\"label\": \"粉色\"},
      \"ja\": {\"label\": \"ピンク\"}
    }}, 
    {\"id\": \"#A28DF7\", \"label\": \"Purple\", \"translations\": { 
      \"es\": {\"label\": \"Morado\"},
      \"fr\": {\"label\": \"Violet\"},
      \"it\": {\"label\": \"Viola\"},
      \"pt\": {\"label\": \"Roxo\"},
      \"de\": {\"label\": \"Lila\"},
      \"nl\": {\"label\": \"Paars\"},
      \"zh\": {\"label\": \"紫色\"},
      \"ja\": {\"label\": \"紫\"}
    }}, 
    {\"id\": \"#6B7280\", \"label\": \"Gray\", \"translations\": { 
      \"es\": {\"label\": \"Gris\"},
      \"fr\": {\"label\": \"Gris\"},
      \"it\": {\"label\": \"Grigio\"},
      \"pt\": {\"label\": \"Cinza\"},
      \"de\": {\"label\": \"Grau\"},
      \"nl\": {\"label\": \"Grijs\"},
      \"zh\": {\"label\": \"灰色\"},
      \"ja\": {\"label\": \"グレー\"}
    }}, 
    {\"id\": \"#4F46E5\", \"label\": \"Indigo\", \"translations\": { 
      \"es\": {\"label\": \"Índigo\"},
      \"fr\": {\"label\": \"Indigo\"},
      \"it\": {\"label\": \"Indaco\"},
      \"pt\": {\"label\": \"Índigo\"},
      \"de\": {\"label\": \"Indigo\"},
      \"nl\": {\"label\": \"Indigo\"},
      \"zh\": {\"label\": \"靛蓝\"},
      \"ja\": {\"label\": \"インディゴ\"}
    }}
  ]''::jsonb,
  ''{
    \"es\": {
      \"label\": \"Color de Vestuario\",
      \"description\": \"Selecciona tu color de vestuario preferido\"
    },
    \"fr\": {
      \"label\": \"Couleur du Vêtement\",
      \"description\": \"Sélectionnez la couleur de vêtement que vous préférez\"
    },
    \"it\": {
      \"label\": \"Colore dell''''Abbigliamento\",
      \"description\": \"Seleziona il colore dell''''abbigliamento che preferisci\"
    },
    \"pt\": {
      \"label\": \"Cor da Roupa\",
      \"description\": \"Selecione a cor da roupa de sua preferência\"
    },
    \"de\": {
      \"label\": \"Kleidungsfarbe\",
      \"description\": \"Wählen Sie Ihre bevorzugte Kleidungsfarbe\"
    },
    \"nl\": {
      \"label\": \"Kleding Kleur\",
      \"description\": \"Kies uw gewenste kleding kleur\"
    },
    \"zh\": {
      \"label\": \"服装颜色\",
      \"description\": \"选择您喜欢的服装颜色\"
    },
    \"ja\": {
      \"label\": \"服の色\",
      \"description\": \"お好みの服の色を選択してください\"
    }
  }''::jsonb
)
ON CONFLICT (category) DO UPDATE 
SET 
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  options = EXCLUDED.options,
  translations = EXCLUDED.translations"}', 'seed_style_data');
INSERT INTO supabase_migrations.schema_migrations VALUES ('20250429000001', '{"-- Enable realtime for the styles table
ALTER PUBLICATION supabase_realtime ADD TABLE styles","-- Make sure RLS is enabled
ALTER TABLE styles ENABLE ROW LEVEL SECURITY","-- Add policy for realtime subscriptions if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = ''styles'' 
        AND policyname = ''Enable realtime for users own styles''
    ) THEN
        CREATE POLICY \"Enable realtime for users own styles\"
            ON styles
            FOR SELECT
            TO authenticated
            USING (auth.uid() = user_id);
    END IF;
END
$$"}', 'enable_realtime_for_styles');


--
-- Data for Name: seed_files; Type: TABLE DATA; Schema: supabase_migrations; Owner: postgres
--

INSERT INTO supabase_migrations.seed_files VALUES ('supabase/seed.sql', '7e9fe984109379e793250f8b9ebac1e1e1426a7bf33f7d5f4165bac36c868f62');


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 3, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('supabase_functions.hooks_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

