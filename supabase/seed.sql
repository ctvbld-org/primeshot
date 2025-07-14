SET session_replication_role = replica;

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
-- Data for Name: credit_costs; Type: TABLE DATA; Schema: public; Owner: postgres
--

-- INSERT INTO "public"."credit_costs" ("id", "type", "value", "created_at", "updated_at") VALUES
-- 	(1, 'IMAGE_GENERATION_1K', 1, '2025-07-11 22:06:23.247161+00', '2025-07-11 22:06:23.247161+00'),
-- 	(2, 'IMAGE_GENERATION_2K', 2, '2025-07-11 22:06:23.247161+00', '2025-07-11 22:06:23.247161+00'),
-- 	(3, 'IMAGE_GENERATION_4K', 3, '2025-07-11 22:06:23.247161+00', '2025-07-11 22:06:23.247161+00'),
-- 	(4, 'FACE_MODEL_TRAINING', 30, '2025-07-11 22:06:23.247161+00', '2025-07-11 22:06:23.247161+00');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

-- INSERT INTO "public"."users" ("id", "email", "full_name", "avatar_url", "created_at", "updated_at", "admin") VALUES
-- 	('dcace384-bcbb-43de-b48f-bd82722b6ce0', 'david.benollol@gmail.com', 'David', 'https://lh3.googleusercontent.com/a/ACg8ocJNQhWmftVDfrAYDINBMHf3K5wgtN9bgl-MRtTm5nVS8iMr1aWn=s96-c', '2025-07-01 09:52:25.558166+00', '2025-07-01 14:51:41.906404+00', false);


--
-- Data for Name: credit_pack_purchases; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: credit_packs; Type: TABLE DATA; Schema: public; Owner: postgres
--

-- INSERT INTO "public"."credit_packs" ("id", "name", "credits", "price", "validity_days", "created_at", "updated_at") VALUES
-- 	(1, '90 Credits', 90, 19.00, 60, '2025-07-11 22:06:23.247161+00', '2025-07-11 22:06:23.247161+00'),
-- 	(2, '180 Credits', 180, 32.00, 60, '2025-07-11 22:06:23.247161+00', '2025-07-11 22:06:23.247161+00'),
-- 	(3, '360 Credits', 360, 52.00, 60, '2025-07-11 22:06:23.247161+00', '2025-07-11 22:06:23.247161+00');


--
-- Data for Name: credit_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: face_models; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: images; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: styles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: generated_images; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: inference_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: styles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."styles" ("name", "preview_images", "available_scenes", "available_wardrobes", "available_colors", "translations", "created_at", "updated_at", "prompt", "id") VALUES
	('Corporate', '["business-2.webp", "business-1.webp", "business-3.webp", "business-1.webp", "business-3.webp"]', '{plain-light,plain-dark,plain-orange,plain-blue,plain-teal}', '{suit-jacket-shirt,shirt,polo,henley,jacket}', '{black,white,green,blue,orange,red,pink,purple,gray,indigo}', '{"de": {"name": "Business"}, "es": {"name": "Corporativo"}, "fr": {"name": "Corporate"}, "it": {"name": "Corporate"}, "ja": {"name": "コーポレート"}, "nl": {"name": "Zakelijk"}, "pt": {"name": "Corporativo"}, "zh": {"name": "商务风格"}}', '2025-05-03 23:44:34.330977+00', '2025-07-14 17:17:06.864192+00', NULL, 'c8a3c91a-dbc9-4503-9c19-b0f4378ccce4'),
	('Editorial', '["outdoor-fashion-1.webp", "outdoor-fashion-2.webp", "outdoor-fashion-3.webp", "outdoor-fashion-4.webp", "outdoor-fashion-4.webp"]', '{plain-light,plain-dark,plain-orange,plain-blue,plain-teal}', '{hoodie,shirt,polo,henley,jacket,fishermans-jumper}', '{black,white,green,blue,orange,red,pink,purple,gray,indigo}', '{"de": {"name": "Editorial"}, "es": {"name": "Editorial"}, "fr": {"name": "Éditorial"}, "it": {"name": "Editoriale"}, "ja": {"name": "エディトリアル"}, "nl": {"name": "Editorial"}, "pt": {"name": "Editorial"}, "zh": {"name": "杂志风格"}}', '2025-05-03 23:44:34.330977+00', '2025-07-14 17:17:06.864192+00', NULL, 'd4fcdab5-2c19-457e-affb-d83e836759d2'),
	('Studio', '["studio-1.webp", "studio-2.webp", "studio-3.webp", "studio-1.webp", "studio-2.webp"]', '{plain-light,plain-dark,plain-orange,plain-blue,plain-teal}', '{shirt,polo,henley,jacket,fishermans-jumper}', '{black,white,green,blue,orange,red,pink,purple,gray,indigo}', '{"de": {"name": "Studio"}, "es": {"name": "Estudio"}, "fr": {"name": "Studio"}, "it": {"name": "Studio"}, "ja": {"name": "スタジオ"}, "nl": {"name": "Studio"}, "pt": {"name": "Estúdio"}, "zh": {"name": "工作室风格"}}', '2025-05-03 23:44:34.330977+00', '2025-07-14 17:17:06.864192+00', NULL, '3ae77887-5df2-4982-85d4-d6f88993055f');


--
-- Data for Name: style_scenes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."style_scenes" ("value", "label", "image", "translations") VALUES
	('plain-light', 'Studio Light', 'bg-plain-light.webp', '{"de": {"label": "Studio Hell"}, "es": {"label": "Estudio Claro"}, "fr": {"label": "Studio Clair"}, "it": {"label": "Studio Chiaro"}, "ja": {"label": "スタジオライト"}, "nl": {"label": "Studio Licht"}, "pt": {"label": "Estúdio Claro"}, "zh": {"label": "明亮工作室"}}'),
	('plain-dark', 'Studio Dark', 'bg-plain-dark.webp', '{"de": {"label": "Studio Dunkel"}, "es": {"label": "Estudio Oscuro"}, "fr": {"label": "Studio Sombre"}, "it": {"label": "Studio Scuro"}, "ja": {"label": "スタジオダーク"}, "nl": {"label": "Studio Donker"}, "pt": {"label": "Estúdio Escuro"}, "zh": {"label": "暗调工作室"}}'),
	('plain-orange', 'Studio Orange', 'bg-plain-orange.webp', '{"de": {"label": "Studio Orange"}, "es": {"label": "Estudio Naranja"}, "fr": {"label": "Studio Orange"}, "it": {"label": "Studio Arancione"}, "ja": {"label": "スタジオオレンジ"}, "nl": {"label": "Studio Oranje"}, "pt": {"label": "Estúdio Laranja"}, "zh": {"label": "橙色工作室"}}'),
	('plain-blue', 'Studio Blue', 'bg-plain-blue.webp', '{"de": {"label": "Studio Blau"}, "es": {"label": "Estudio Azul"}, "fr": {"label": "Studio Bleu"}, "it": {"label": "Studio Blu"}, "ja": {"label": "スタジオブルー"}, "nl": {"label": "Studio Blauw"}, "pt": {"label": "Estúdio Azul"}, "zh": {"label": "蓝色工作室"}}'),
	('plain-teal', 'Studio Teal', 'bg-plain-teal.webp', '{"de": {"label": "Studio Türkis"}, "es": {"label": "Estudio Verde"}, "fr": {"label": "Studio Turquoise"}, "it": {"label": "Studio Turchese"}, "ja": {"label": "スタジオティール"}, "nl": {"label": "Studio Groenblauw"}, "pt": {"label": "Estúdio Verde-água"}, "zh": {"label": "青色工作室"}}');

--
-- Data for Name: style_wardrobes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."style_wardrobes" ("value", "label", "image", "translations") VALUES
	('hoodie', 'Hoodie', 'hoodie.webp', '{"de": {"label": "Kapuzenpullover"}, "es": {"label": "Sudadera con Capucha"}, "fr": {"label": "Sweat à Capuche"}, "it": {"label": "Felpa con Cappuccio"}, "ja": {"label": "パーカー"}, "nl": {"label": "Hoodie"}, "pt": {"label": "Moletom com Capuz"}, "zh": {"label": "连帽衫"}}'),
	('suit-jacket-shirt', 'Suit Jacket/Shirt', 'blazer-shirt.webp', '{"de": {"label": "Anzugjacke/Hemd"}, "es": {"label": "Chaqueta de Traje/Camisa"}, "fr": {"label": "Veste de Costume/Chemise"}, "it": {"label": "Giacca/Camicia"}, "ja": {"label": "スーツジャケット/シャツ"}, "nl": {"label": "Colbert/Overhemd"}, "pt": {"label": "Paletó/Camisa"}, "zh": {"label": "西装外套/衬衫"}}'),
	('shirt', 'Shirt', 'shirt.webp', '{"de": {"label": "Hemd"}, "es": {"label": "Camisa"}, "fr": {"label": "Chemise"}, "it": {"label": "Camicia"}, "ja": {"label": "シャツ"}, "nl": {"label": "Overhemd"}, "pt": {"label": "Camisa"}, "zh": {"label": "衬衫"}}'),
	('polo', 'Polo', 'polo.webp', '{"de": {"label": "Poloshirt"}, "es": {"label": "Polo"}, "fr": {"label": "Polo"}, "it": {"label": "Polo"}, "ja": {"label": "ポロシャツ"}, "nl": {"label": "Polo"}, "pt": {"label": "Polo"}, "zh": {"label": "polo衫"}}'),
	('henley', 'Henley', 'henley.webp', '{"de": {"label": "Henley"}, "es": {"label": "Henley"}, "fr": {"label": "Henley"}, "it": {"label": "Henley"}, "ja": {"label": "ヘンリーネック"}, "nl": {"label": "Henley"}, "pt": {"label": "Henley"}, "zh": {"label": "亨利领"}}'),
	('jacket', 'Jacket', 'jacket.webp', '{"de": {"label": "Jacke"}, "es": {"label": "Chaqueta"}, "fr": {"label": "Veste"}, "it": {"label": "Giacca"}, "ja": {"label": "ジャケット"}, "nl": {"label": "Jas"}, "pt": {"label": "Jaqueta"}, "zh": {"label": "夹克"}}'),
	('fishermans-jumper', 'Fishermans Jumper', 'fishermans-jumper.webp', '{"de": {"label": "Fischerpullover"}, "es": {"label": "Suéter de Pescador"}, "fr": {"label": "Pull Marin"}, "it": {"label": "Maglione da Pescatore"}, "ja": {"label": "フィッシャーマンセーター"}, "nl": {"label": "Visserstrui"}, "pt": {"label": "Suéter de Pescador"}, "zh": {"label": "渔夫毛衣"}}');

--
-- Data for Name: style_colors; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."style_colors" ("value", "label", "color", "translations") VALUES
	('black', 'Black', '#000000', '{"de": {"label": "Schwarz"}, "es": {"label": "Negro"}, "fr": {"label": "Noir"}, "it": {"label": "Nero"}, "ja": {"label": "黒"}, "nl": {"label": "Zwart"}, "pt": {"label": "Preto"}, "zh": {"label": "黑色"}}'),
	('white', 'White', '#FFFFFF', '{"de": {"label": "Weiß"}, "es": {"label": "Blanco"}, "fr": {"label": "Blanc"}, "it": {"label": "Bianco"}, "ja": {"label": "白"}, "nl": {"label": "Wit"}, "pt": {"label": "Branco"}, "zh": {"label": "白色"}}'),
	('green', 'Green', '#2A9D47', '{"de": {"label": "Grün"}, "es": {"label": "Verde"}, "fr": {"label": "Vert"}, "it": {"label": "Verde"}, "ja": {"label": "緑"}, "nl": {"label": "Groen"}, "pt": {"label": "Verde"}, "zh": {"label": "绿色"}}'),
	('blue', 'Blue', '#3B82F6', '{"de": {"label": "Blau"}, "es": {"label": "Azul"}, "fr": {"label": "Bleu"}, "it": {"label": "Blu"}, "ja": {"label": "青"}, "nl": {"label": "Blauw"}, "pt": {"label": "Azul"}, "zh": {"label": "蓝色"}}'),
	('orange', 'Orange', '#FF7F39', '{"de": {"label": "Orange"}, "es": {"label": "Naranja"}, "fr": {"label": "Orange"}, "it": {"label": "Arancione"}, "ja": {"label": "オレンジ"}, "nl": {"label": "Oranje"}, "pt": {"label": "Laranja"}, "zh": {"label": "橙色"}}'),
	('red', 'Red', '#D22D2D', '{"de": {"label": "Rot"}, "es": {"label": "Rojo"}, "fr": {"label": "Rouge"}, "it": {"label": "Rosso"}, "ja": {"label": "赤"}, "nl": {"label": "Rood"}, "pt": {"label": "Vermelho"}, "zh": {"label": "红色"}}'),
	('pink', 'Pink', '#FC84E2', '{"de": {"label": "Pink"}, "es": {"label": "Rosa"}, "fr": {"label": "Rose"}, "it": {"label": "Rosa"}, "ja": {"label": "ピンク"}, "nl": {"label": "Roze"}, "pt": {"label": "Rosa"}, "zh": {"label": "粉色"}}'),
	('purple', 'Purple', '#A28DF7', '{"de": {"label": "Lila"}, "es": {"label": "Morado"}, "fr": {"label": "Violet"}, "it": {"label": "Viola"}, "ja": {"label": "紫"}, "nl": {"label": "Paars"}, "pt": {"label": "Roxo"}, "zh": {"label": "紫色"}}'),
	('gray', 'Gray', '#6B7280', '{"de": {"label": "Grau"}, "es": {"label": "Gris"}, "fr": {"label": "Gris"}, "it": {"label": "Grigio"}, "ja": {"label": "グレー"}, "nl": {"label": "Grijs"}, "pt": {"label": "Cinza"}, "zh": {"label": "灰色"}}'),
	('indigo', 'Indigo', '#4F46E5', '{"de": {"label": "Indigo"}, "es": {"label": "Índigo"}, "fr": {"label": "Indigo"}, "it": {"label": "Indaco"}, "ja": {"label": "インディゴ"}, "nl": {"label": "Indigo"}, "pt": {"label": "Índigo"}, "zh": {"label": "靛蓝"}}');


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

-- INSERT INTO "public"."subscriptions" ("id", "name", "display_name", "description", "original_price", "monthly_price", "yearly_price", "credits", "max_resolution", "face_model_training_included", "concurrent_jobs", "max_face_models", "features", "popular", "created_at", "updated_at") VALUES
-- 	(1, 'basic', 'Basic', 'Includes 40 credits per month, plus 1 Face Model training (30 credits value).', 14.00, 9.00, 9.00, 40, '1K', 1, 1, 1, '["40 monthly credits", "Standard image resolution (1K max)", "Includes 1 Face Model training", "1 concurrent job", "1 Face Model slot", "Up to 40 images per month"]', false, '2025-07-11 22:06:23.247161+00', '2025-07-11 22:06:23.247161+00'),
-- 	(2, 'standard', 'Standard', 'Includes 180 credits per month, plus 1 Face Model training (30 credits value).', 39.00, 29.00, 18.00, 180, '4K', 1, 2, 3, '["180 monthly credits", "Ultra high image resolution (up to 4K)", "Includes 1 Face Model training", "2 concurrent jobs", "3 Face Model slots", "Up to 180×1K, 90×2K, or 60×4K images per month"]', true, '2025-07-11 22:06:23.247161+00', '2025-07-11 22:06:23.247161+00'),
-- 	(3, 'pro', 'Pro', 'Includes 450 credits per month, plus 3 Face Model trainings (90 credits value).', 79.00, 59.00, 39.00, 450, '4K', 3, 4, 8, '["450 monthly credits", "Ultra high image resolution (up to 4K)", "Includes 3 Face Model trainings", "4 concurrent jobs", "8 Face Model slots", "Up to 450×1K, 225×2K, or 150×4K images per month"]', false, '2025-07-11 22:06:23.247161+00', '2025-07-11 22:06:23.247161+00');


--
-- Data for Name: training_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: upload_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: upload_chunks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_credits; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: waitlist; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Name: credit_costs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."credit_costs_id_seq"', 4, true);


--
-- Name: credit_packs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."credit_packs_id_seq"', 3, true);


--
-- Name: subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."subscriptions_id_seq"', 3, true);


--
-- Name: waitlist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."waitlist_id_seq"', 59, true);


--
-- PostgreSQL database dump complete
--

RESET ALL;
