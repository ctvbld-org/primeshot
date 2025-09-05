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
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', 'e4291ff7-e2e6-4e12-a92d-239077361308', '{"action":"user_signedup","actor_id":"79acf17f-0800-4882-99dd-3b1dc2171c88","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"google"}}', '2025-05-03 23:12:16.796029+00', ''),
	('00000000-0000-0000-0000-000000000000', '1e46c9d7-2515-464c-87d8-1592f6b752f8', '{"action":"user_recovery_requested","actor_id":"79acf17f-0800-4882-99dd-3b1dc2171c88","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"user"}', '2025-05-03 23:13:36.329943+00', ''),
	('00000000-0000-0000-0000-000000000000', '1a5ab897-583c-4615-aaad-f9a46cd28261', '{"action":"login","actor_id":"79acf17f-0800-4882-99dd-3b1dc2171c88","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-03 23:13:47.770412+00', ''),
	('00000000-0000-0000-0000-000000000000', '5d08f581-4bbe-4325-b049-87418fa79667', '{"action":"login","actor_id":"79acf17f-0800-4882-99dd-3b1dc2171c88","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-03 23:24:39.031048+00', ''),
	('00000000-0000-0000-0000-000000000000', '83163a36-d2ac-4bd3-a05b-28ba059ebbfd', '{"action":"login","actor_id":"79acf17f-0800-4882-99dd-3b1dc2171c88","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-03 23:25:33.292261+00', ''),
	('00000000-0000-0000-0000-000000000000', '52a51c68-6ce6-4485-9281-b1ebba9b8f0c', '{"action":"login","actor_id":"79acf17f-0800-4882-99dd-3b1dc2171c88","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-03 23:26:00.747424+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a97c9c4b-bd5b-4dc2-97c6-e2591cee24ce', '{"action":"user_recovery_requested","actor_id":"79acf17f-0800-4882-99dd-3b1dc2171c88","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"user"}', '2025-05-03 23:29:26.851626+00', ''),
	('00000000-0000-0000-0000-000000000000', '23995d69-0954-467e-91bb-fad2a9340d3a', '{"action":"login","actor_id":"79acf17f-0800-4882-99dd-3b1dc2171c88","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-03 23:30:36.8434+00', ''),
	('00000000-0000-0000-0000-000000000000', '896c6806-f935-4aa9-b44a-b8f6f350d1a1', '{"action":"login","actor_id":"79acf17f-0800-4882-99dd-3b1dc2171c88","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-03 23:46:03.034544+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a9d9327a-79d9-4e1b-b91d-d2a9fd7c23b4', '{"action":"login","actor_id":"79acf17f-0800-4882-99dd-3b1dc2171c88","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-03 23:46:03.692008+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c930a0c3-f163-4389-b708-5be50d4e6ddd', '{"action":"user_signedup","actor_id":"764e675a-68f5-4d39-b681-7301f2e5349b","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"google"}}', '2025-05-04 00:10:56.318672+00', ''),
	('00000000-0000-0000-0000-000000000000', '6559a2fd-dc3d-4078-a6ad-4cfbc6c251fd', '{"action":"login","actor_id":"764e675a-68f5-4d39-b681-7301f2e5349b","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-04 00:10:56.696915+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bc6b52c2-dcb5-45de-bf5f-215271bf393f', '{"action":"logout","actor_id":"764e675a-68f5-4d39-b681-7301f2e5349b","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-04 00:16:04.350444+00', ''),
	('00000000-0000-0000-0000-000000000000', '28856090-2bc1-41fd-8894-10a8c01d9a76', '{"action":"login","actor_id":"764e675a-68f5-4d39-b681-7301f2e5349b","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-04 00:16:09.452179+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b7a197d5-0580-4ee3-95b9-ba78fbd52cff', '{"action":"login","actor_id":"764e675a-68f5-4d39-b681-7301f2e5349b","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-04 00:16:09.749203+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a6f30827-79f6-489c-982b-1419fcd26fd8', '{"action":"logout","actor_id":"764e675a-68f5-4d39-b681-7301f2e5349b","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-04 00:44:17.698096+00', ''),
	('00000000-0000-0000-0000-000000000000', '5e91d2db-2e11-4862-a4ad-60986a6319f3', '{"action":"login","actor_id":"764e675a-68f5-4d39-b681-7301f2e5349b","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-04 00:45:14.095123+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd7278a6d-ad34-4522-a77f-fc11efc6fcc6', '{"action":"login","actor_id":"764e675a-68f5-4d39-b681-7301f2e5349b","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-04 00:45:14.55005+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ca6d05d4-9834-4db6-a8ca-d98bf38f907b', '{"action":"login","actor_id":"764e675a-68f5-4d39-b681-7301f2e5349b","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-04 00:48:23.601193+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e96c5931-c683-43a9-a8f7-9187dbe394cf', '{"action":"login","actor_id":"764e675a-68f5-4d39-b681-7301f2e5349b","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-04 00:48:24.016627+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ab2f04c5-5601-4842-b3ae-18197cdbdef7', '{"action":"logout","actor_id":"764e675a-68f5-4d39-b681-7301f2e5349b","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-04 00:48:43.35592+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ba75b301-d1b8-4e1e-99f5-f4fb3bfe0fca', '{"action":"login","actor_id":"764e675a-68f5-4d39-b681-7301f2e5349b","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-04 00:50:20.981007+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dfeb66ad-4880-4146-a6a0-435f4f6f3774', '{"action":"login","actor_id":"764e675a-68f5-4d39-b681-7301f2e5349b","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-04 00:50:21.334884+00', ''),
	('00000000-0000-0000-0000-000000000000', '208bc113-9c16-4639-939f-2de1396713f8', '{"action":"logout","actor_id":"764e675a-68f5-4d39-b681-7301f2e5349b","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-04 00:59:07.166932+00', ''),
	('00000000-0000-0000-0000-000000000000', '178b776d-5de1-44a1-b424-af10b52667ae', '{"action":"login","actor_id":"764e675a-68f5-4d39-b681-7301f2e5349b","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-04 00:59:55.509473+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b2d4dd28-18c7-4418-9aef-2ced36362df7', '{"action":"login","actor_id":"764e675a-68f5-4d39-b681-7301f2e5349b","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-04 00:59:55.799503+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c1f44c8c-f6cd-4364-9db9-fa61d1f7d706', '{"action":"logout","actor_id":"764e675a-68f5-4d39-b681-7301f2e5349b","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-04 01:03:19.921874+00', ''),
	('00000000-0000-0000-0000-000000000000', '3f738ab1-c7c9-450c-8a39-afda8359f888', '{"action":"login","actor_id":"764e675a-68f5-4d39-b681-7301f2e5349b","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-04 01:03:31.353823+00', ''),
	('00000000-0000-0000-0000-000000000000', 'af2ff0fe-fe0e-4ea9-a022-ab1100fa255f', '{"action":"login","actor_id":"764e675a-68f5-4d39-b681-7301f2e5349b","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-04 01:03:31.716742+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f6aa24ba-3d89-4a20-b770-7de00fb4642d', '{"action":"logout","actor_id":"764e675a-68f5-4d39-b681-7301f2e5349b","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-04 01:04:03.755786+00', ''),
	('00000000-0000-0000-0000-000000000000', '091c5806-3716-40e0-a079-9a18f2a02539', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"david.benollol@gmail.com","user_id":"764e675a-68f5-4d39-b681-7301f2e5349b","user_phone":""}}', '2025-05-04 01:22:38.763106+00', ''),
	('00000000-0000-0000-0000-000000000000', '0b937f50-3969-4229-b2f0-02b5e377fa4c', '{"action":"user_signedup","actor_id":"89edaf9d-cc65-4d56-820e-fedf93ca158e","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"google"}}', '2025-05-04 01:23:25.300654+00', ''),
	('00000000-0000-0000-0000-000000000000', '883091da-6f30-4e28-9431-78eaca9149bd', '{"action":"login","actor_id":"89edaf9d-cc65-4d56-820e-fedf93ca158e","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-04 01:23:25.817866+00', ''),
	('00000000-0000-0000-0000-000000000000', '5b2187cb-6023-4832-9bfe-417bc9a20562', '{"action":"logout","actor_id":"89edaf9d-cc65-4d56-820e-fedf93ca158e","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-04 01:27:34.655275+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f59745e4-d861-4d1b-bb56-f420c0550323', '{"action":"user_confirmation_requested","actor_id":"d0835d66-0bc5-4ac1-82c9-509dd997034e","actor_username":"anouk.veen@wirethings.net","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-05-04 04:57:49.576685+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ee90832b-fee7-43a8-b69e-0409ccc8bf81', '{"action":"user_confirmation_requested","actor_id":"277021b9-9f20-4d21-9695-128e0b549ca4","actor_username":"vanessa8@usaaxa.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-05-04 05:18:06.364754+00', ''),
	('00000000-0000-0000-0000-000000000000', '1f83f55c-734e-49e9-aa11-f26d3854d99b', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"anouk.veen@wirethings.net","user_id":"d0835d66-0bc5-4ac1-82c9-509dd997034e","user_phone":""}}', '2025-05-04 09:29:33.228599+00', ''),
	('00000000-0000-0000-0000-000000000000', '4ce4dbae-5057-4dd3-af8a-0bc80b19b8fa', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"vanessa8@usaaxa.com","user_id":"277021b9-9f20-4d21-9695-128e0b549ca4","user_phone":""}}', '2025-05-04 09:29:40.931682+00', ''),
	('00000000-0000-0000-0000-000000000000', '2a868f95-e3a1-445c-aabf-8c6c8ccaaafe', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"david.benollol@gmail.com","user_id":"89edaf9d-cc65-4d56-820e-fedf93ca158e","user_phone":""}}', '2025-05-04 09:29:45.803039+00', ''),
	('00000000-0000-0000-0000-000000000000', '94946443-55c8-4047-8a3f-fa2410b6c108', '{"action":"user_signedup","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"google"}}', '2025-05-04 09:32:42.293026+00', ''),
	('00000000-0000-0000-0000-000000000000', '17e01360-8a59-41d7-bb56-d7b39de978f2', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-04 09:32:42.830897+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e4cfc68e-043e-43a8-ab12-0a6bebfb86a5', '{"action":"logout","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-04 10:17:17.443402+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b7532158-9d2e-4249-8e3a-69793c3f8ec8', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-04 10:54:20.112091+00', ''),
	('00000000-0000-0000-0000-000000000000', '159a0340-5ab2-4c5d-afef-2ac06be1f333', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-04 10:54:20.826989+00', ''),
	('00000000-0000-0000-0000-000000000000', '3b771063-d846-4644-bbf0-2e0d64c4ad5d', '{"action":"user_signedup","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"google"}}', '2025-05-04 10:57:08.508792+00', ''),
	('00000000-0000-0000-0000-000000000000', '54b1e5e2-192e-44fb-ab84-0030648e61c7', '{"action":"login","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-04 10:57:09.049906+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e08f8c52-b024-4826-8f47-41e87d41ce99', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-04 11:05:53.980981+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a74cb84a-d0fc-4330-b42b-7137281a0f09', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-04 11:05:54.440579+00', ''),
	('00000000-0000-0000-0000-000000000000', '72728eea-7949-4ada-bf78-97f066e961e5', '{"action":"login","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-04 11:15:06.59891+00', ''),
	('00000000-0000-0000-0000-000000000000', '4d2a380a-e5e2-4cca-bb5f-f3cc23a32f1d', '{"action":"login","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-04 11:15:06.905383+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bd8702a0-66fa-4a78-b3f2-8293b257b6ff', '{"action":"logout","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-04 11:41:46.600419+00', ''),
	('00000000-0000-0000-0000-000000000000', '0a1310d5-c615-47fc-b08e-cf79cabb3bc1', '{"action":"login","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-04 11:43:05.440759+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c61005c1-1fdc-4c1b-afac-8ae50a36430e', '{"action":"login","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-04 11:43:05.963186+00', ''),
	('00000000-0000-0000-0000-000000000000', '3e320b4e-511b-4407-95cd-ffc94053de59', '{"action":"logout","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-11 22:34:28.806091+00', ''),
	('00000000-0000-0000-0000-000000000000', '6df600c1-0a5f-48cd-90d6-a6abf8ea3418', '{"action":"login","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-04 12:22:39.046264+00', ''),
	('00000000-0000-0000-0000-000000000000', '7a968f20-b11f-49e5-84e1-3ea38dfaf498', '{"action":"login","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-04 12:22:39.375077+00', ''),
	('00000000-0000-0000-0000-000000000000', 'efcae47f-7681-4315-a74c-4e030f8cc7e7', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 12:22:46.891799+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ec5beb3f-ae5e-447c-8663-eef874c885c9', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 12:22:46.892518+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a45ddb84-1969-4aa4-b7b3-d3aa3428bac8', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 13:30:12.161463+00', ''),
	('00000000-0000-0000-0000-000000000000', '952056f1-bbde-4699-850d-356ba3121cf8', '{"action":"token_revoked","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 13:30:12.162494+00', ''),
	('00000000-0000-0000-0000-000000000000', '1102dde2-6fd6-464c-962d-f5f71bfc4016', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 14:25:15.077987+00', ''),
	('00000000-0000-0000-0000-000000000000', '6329bd8b-ade5-4476-875e-37faff19c821', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 14:25:15.0792+00', ''),
	('00000000-0000-0000-0000-000000000000', '82e8dbb7-090d-4dca-8455-98f3a4c1f3bd', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 15:24:00.716208+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b8aaedf6-6f20-4eca-93dd-359e15fb0184', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 15:24:00.726469+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd7f002ad-fb7a-41f6-9139-67ec24d617ad', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 15:25:33.947566+00', ''),
	('00000000-0000-0000-0000-000000000000', '9fef193a-9260-4ddc-b3af-51f29c15a6ce', '{"action":"token_revoked","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 15:25:33.948539+00', ''),
	('00000000-0000-0000-0000-000000000000', 'eed512c0-6c49-453b-9d72-cf653a513318', '{"action":"logout","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-04 16:12:19.900675+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cd9679fd-ee31-4c39-9bcb-20c3557fd805', '{"action":"login","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-04 16:12:28.725241+00', ''),
	('00000000-0000-0000-0000-000000000000', '8cbe8e79-f93b-4566-bdb1-824bfe5075bb', '{"action":"login","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-04 16:12:29.475265+00', ''),
	('00000000-0000-0000-0000-000000000000', '3b443f58-8d1d-43eb-a419-1a46d1909b6b', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 16:22:22.712512+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e425acd6-2157-4080-9b7f-010e0526e832', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 16:22:22.714419+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ab9bacfa-d1fd-479c-9519-e359f2d5536a', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 17:21:30.236319+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd90e1218-3030-46b6-87f7-aedddcccd3a7', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 17:21:30.237318+00', ''),
	('00000000-0000-0000-0000-000000000000', '3443a3b1-a538-4fb7-b4fa-4d022b8bd101', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 19:39:43.617954+00', ''),
	('00000000-0000-0000-0000-000000000000', 'efd0920b-0c3f-44af-8c65-708fdb564b0b', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 19:39:43.618851+00', ''),
	('00000000-0000-0000-0000-000000000000', '23e13d86-3238-4f4e-a140-889db1b46f6d', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 20:39:09.664961+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a710e624-51a0-46e3-a26a-ca7b3221e569', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 20:39:09.666706+00', ''),
	('00000000-0000-0000-0000-000000000000', 'afcc1c0c-cf6f-4270-825a-3069790e4ec5', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 21:38:03.842778+00', ''),
	('00000000-0000-0000-0000-000000000000', '4818abf8-0f74-45e8-ab6e-1b896c8a0b24', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 21:38:03.843765+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f6911f34-8ff6-41f8-87ed-1928e723e751', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 22:37:09.694214+00', ''),
	('00000000-0000-0000-0000-000000000000', '4e813f77-6141-4569-9aa9-a2c536407851', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 22:37:09.695216+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f52c7875-640e-4c90-8ad5-71c398c84dfe', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 23:35:39.758521+00', ''),
	('00000000-0000-0000-0000-000000000000', '55ce88bb-6f4c-402f-8fc8-f98961d0d31d', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-04 23:35:39.759423+00', ''),
	('00000000-0000-0000-0000-000000000000', '96b4aa5f-8b4b-4fa2-b09c-2ce34d858034', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 01:16:50.794294+00', ''),
	('00000000-0000-0000-0000-000000000000', '44c11797-7e3f-48ab-88dd-48f9a2a62d55', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 01:16:50.795296+00', ''),
	('00000000-0000-0000-0000-000000000000', '2c2e6eee-8996-4c3e-a775-a44159a10b4f', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 02:56:14.640144+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ceca5476-8252-4b7f-b834-7a81b1b7de3a', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 02:56:14.64137+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dab890f4-f269-4399-8814-f2b17b79ad88', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 04:57:50.611243+00', ''),
	('00000000-0000-0000-0000-000000000000', '8647317e-f577-4b0f-9dc8-62875dd39b26', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 04:57:50.612167+00', ''),
	('00000000-0000-0000-0000-000000000000', '81fe0aa9-fb46-4266-9f67-14456b17c27a', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 05:59:20.317986+00', ''),
	('00000000-0000-0000-0000-000000000000', 'aec9e12d-a2b8-499e-944f-e2b0951783d7', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 05:59:20.31906+00', ''),
	('00000000-0000-0000-0000-000000000000', '4cf61929-eedf-4965-bc80-8fe412bd2574', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 06:59:47.443213+00', ''),
	('00000000-0000-0000-0000-000000000000', '21ed4fff-2a42-4474-95e6-d6d23a030583', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 06:59:47.444179+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e20be59e-12d5-44f1-a925-9474e81a5de0', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 08:01:23.575126+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b7b5f403-a173-45f2-b6b5-5febe4627166', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 08:01:23.576115+00', ''),
	('00000000-0000-0000-0000-000000000000', '5d391b1d-c829-4faf-b03e-400fb745e7cd', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 09:02:09.370977+00', ''),
	('00000000-0000-0000-0000-000000000000', '705249d7-c416-4a06-a073-09718f02eb1a', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 09:02:09.371977+00', ''),
	('00000000-0000-0000-0000-000000000000', '998bd80b-b4a9-430f-8c79-21e8867cb7f5', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 09:09:58.178462+00', ''),
	('00000000-0000-0000-0000-000000000000', '5d669448-069c-4157-88f7-d857ca000e10', '{"action":"token_revoked","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 09:09:58.179453+00', ''),
	('00000000-0000-0000-0000-000000000000', '143d0eb8-72a4-4532-80b8-9e628d6b07ea', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 11:03:29.611425+00', ''),
	('00000000-0000-0000-0000-000000000000', 'facae035-fb9f-41ad-9c09-98b9e44a396b', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 11:03:29.612499+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f8abf487-1666-448e-a125-5ae88bb1c492', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 12:02:00.677169+00', ''),
	('00000000-0000-0000-0000-000000000000', '41d87f77-c280-42d2-a087-629584f9488b', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 12:02:00.678119+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c997a109-ef5e-4f56-94c6-b6deeeb4eb23', '{"action":"logout","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-05 12:11:04.042756+00', ''),
	('00000000-0000-0000-0000-000000000000', '77f03841-489f-48a2-9e2c-7c4b7e4c58ab', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 21:30:36.462835+00', ''),
	('00000000-0000-0000-0000-000000000000', '9936c1ed-5ec8-4f6f-b9e3-e95a86892bbb', '{"action":"token_revoked","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 21:30:36.468578+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a879e33e-d9d6-4aad-86bb-3f569587eb42', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-05 21:30:37.832656+00', ''),
	('00000000-0000-0000-0000-000000000000', '9d94b09b-757d-46c2-a8b1-8d8445230243', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-06 11:56:19.79332+00', ''),
	('00000000-0000-0000-0000-000000000000', '70518098-704b-445f-89ea-943c03d4f4e0', '{"action":"token_revoked","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-06 11:56:19.799858+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ed3978e2-cfcb-47f0-a21e-a74bac76d20d', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-06 14:11:53.889542+00', ''),
	('00000000-0000-0000-0000-000000000000', '7e69a961-d0f0-4b01-b018-fad85dca1e4d', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-06 14:11:55.426803+00', ''),
	('00000000-0000-0000-0000-000000000000', '0dd321de-0437-48f1-8033-f88118b154aa', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-06 15:13:55.414586+00', ''),
	('00000000-0000-0000-0000-000000000000', '0dd92d7c-3779-4b64-9ea2-220e526aaaa4', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-06 15:13:55.41723+00', ''),
	('00000000-0000-0000-0000-000000000000', '89938e86-715f-4cc3-82c1-b6a30f15b1a5', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-07 09:38:36.064635+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ab7f7b4d-2f7e-435e-9bdb-d19f411f38fb', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-07 09:38:36.068387+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b84ed845-663f-4bcf-9d1c-ef8e8e300c6e', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-07 18:50:37.759977+00', ''),
	('00000000-0000-0000-0000-000000000000', '0e5fbd01-ff3e-4d63-ac8f-63c2bea2aa9a', '{"action":"token_revoked","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-07 18:50:37.762101+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ff764681-460f-4c46-b367-36271df844f1', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-07 18:50:39.379453+00', ''),
	('00000000-0000-0000-0000-000000000000', '80c8639c-ceba-4a11-80cc-3e84ebe8accd', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-08 09:19:06.967975+00', ''),
	('00000000-0000-0000-0000-000000000000', 'df03f2e3-2fef-49af-aaba-e910fbdd277d', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-08 09:19:06.971741+00', ''),
	('00000000-0000-0000-0000-000000000000', '40e2c4a4-3f4d-42ec-859b-a7faa3219a02', '{"action":"logout","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-08 09:19:23.652843+00', ''),
	('00000000-0000-0000-0000-000000000000', '5eb08edb-60a1-4391-b2d7-1dc8f2c5b189', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-08 22:36:31.34996+00', ''),
	('00000000-0000-0000-0000-000000000000', '95b6e3db-dd11-49bf-a49a-cf01284aff5a', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-08 22:36:32.253426+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b9e4d94b-aa82-41eb-aae3-93a542b4fbe8', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-09 01:08:33.447337+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b35252be-946b-42b2-96fa-8178590bbbad', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-09 01:08:33.449578+00', ''),
	('00000000-0000-0000-0000-000000000000', '89c6ece8-9ca9-4a09-9d24-6e72f6c6e49f', '{"action":"logout","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-09 01:10:08.936823+00', ''),
	('00000000-0000-0000-0000-000000000000', '17acbc8c-2399-4c90-ba47-5db57b33a386', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-09 07:38:00.948917+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f43dbe1b-2a9d-4a3f-8d85-9ba24f1c1e15', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-09 07:38:02.010681+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e54e59a7-a9bd-4600-8186-f71d78026225', '{"action":"logout","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-09 07:38:39.37861+00', ''),
	('00000000-0000-0000-0000-000000000000', '3d3878e3-46d0-4b21-a710-21ff45cb3004', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-09 07:39:08.806481+00', ''),
	('00000000-0000-0000-0000-000000000000', '77a41a18-588b-4d43-bc84-8fbea3c829d8', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-09 07:39:09.156068+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b76f879e-aca6-49f4-8701-cfb7c451f946', '{"action":"login","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-09 08:27:35.135745+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ae2ecb66-b593-41ee-9732-c23af7c506eb', '{"action":"login","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-09 08:27:35.607248+00', ''),
	('00000000-0000-0000-0000-000000000000', '60dd0908-12ea-42f6-b11b-e38045dae613', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-09 10:33:02.612239+00', ''),
	('00000000-0000-0000-0000-000000000000', '84a6b8fa-b686-4678-9da5-b727ac391b01', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-09 10:33:02.613156+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e792fd23-fa4a-4252-82ed-78bc55e1b749', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-09 11:18:57.513042+00', ''),
	('00000000-0000-0000-0000-000000000000', '31efa2bb-550b-44ba-a1ee-f0e3e5059f73', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-09 11:18:58.977754+00', ''),
	('00000000-0000-0000-0000-000000000000', 'da69477e-e9ca-47d9-806f-ac7956626cbb', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-09 13:35:25.046906+00', ''),
	('00000000-0000-0000-0000-000000000000', '1313329a-1e19-4517-ab03-b6de459f791b', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-09 13:35:25.048092+00', ''),
	('00000000-0000-0000-0000-000000000000', '64a4b7c1-fad3-4a9f-b41a-94c42b963f4c', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-09 17:32:40.808168+00', ''),
	('00000000-0000-0000-0000-000000000000', '57329ba8-38ae-42be-b786-dfee76de80b1', '{"action":"token_revoked","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-09 17:32:40.809848+00', ''),
	('00000000-0000-0000-0000-000000000000', '308d8cee-f445-41b5-a86b-080c6a0d741d', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-09 17:32:41.922224+00', ''),
	('00000000-0000-0000-0000-000000000000', 'be44b798-a524-4a67-9d75-1b732c1302c5', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-09 17:32:42.369098+00', ''),
	('00000000-0000-0000-0000-000000000000', '1029fbc3-d2ca-4e09-bc61-91835c584d09', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-09 17:32:42.724622+00', ''),
	('00000000-0000-0000-0000-000000000000', '3b2f8642-b71a-4e28-923a-b4e5a5429a61', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-09 17:32:42.74673+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ffbd773a-3d8f-455d-8345-4bdfa5796348', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-09 17:57:00.487296+00', ''),
	('00000000-0000-0000-0000-000000000000', '5948e1db-883a-4c44-b4e9-31cac121aa9c', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-09 17:57:00.489464+00', ''),
	('00000000-0000-0000-0000-000000000000', '33e3870c-96da-41c8-b1b1-b42afde3240e', '{"action":"logout","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-09 18:11:04.176706+00', ''),
	('00000000-0000-0000-0000-000000000000', '75bf5a33-fa9b-42e8-8907-741395cae6e7', '{"action":"login","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-09 18:12:21.75052+00', ''),
	('00000000-0000-0000-0000-000000000000', '8a6bc100-b042-41fd-8842-b156b9ad6953', '{"action":"login","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-09 18:12:22.432468+00', ''),
	('00000000-0000-0000-0000-000000000000', '7633a793-bd6b-4791-abfb-8424a571ea7e', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-09 20:24:24.640059+00', ''),
	('00000000-0000-0000-0000-000000000000', '34ada0a5-883a-4146-afbb-44bc68ff3ac5', '{"action":"token_revoked","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-09 20:24:24.641738+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b1219d01-ce5f-4d5d-bbd8-6ea42ce62080', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-09 21:27:06.949562+00', ''),
	('00000000-0000-0000-0000-000000000000', '5f379448-3461-48ea-8ba6-f2a5dd760f78', '{"action":"token_revoked","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-09 21:27:06.950615+00', ''),
	('00000000-0000-0000-0000-000000000000', '431f4b7c-eb1d-4ac9-9b93-62016e995748', '{"action":"logout","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-09 21:46:36.53785+00', ''),
	('00000000-0000-0000-0000-000000000000', '3ee25d8e-0e81-4988-8617-9c16bf95f4aa', '{"action":"user_signedup","actor_id":"c0c4cc9b-b0fd-4ed3-aa71-324ea0aa94fa","actor_name":"Creativebuild","actor_username":"team@creativebuild.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"google"}}', '2025-05-09 21:47:06.351826+00', ''),
	('00000000-0000-0000-0000-000000000000', '9b651fc0-1b69-4cfa-ae66-88334fe95bb8', '{"action":"login","actor_id":"c0c4cc9b-b0fd-4ed3-aa71-324ea0aa94fa","actor_name":"Creativebuild","actor_username":"team@creativebuild.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-09 21:47:06.867049+00', ''),
	('00000000-0000-0000-0000-000000000000', '46ca8e86-ff85-4f8c-958a-63f380442662', '{"action":"token_refreshed","actor_id":"c0c4cc9b-b0fd-4ed3-aa71-324ea0aa94fa","actor_name":"Creativebuild","actor_username":"team@creativebuild.com","actor_via_sso":false,"log_type":"token"}', '2025-05-09 23:02:14.776446+00', ''),
	('00000000-0000-0000-0000-000000000000', '2ba148dd-e656-4097-8c69-438e3e45b824', '{"action":"token_revoked","actor_id":"c0c4cc9b-b0fd-4ed3-aa71-324ea0aa94fa","actor_name":"Creativebuild","actor_username":"team@creativebuild.com","actor_via_sso":false,"log_type":"token"}', '2025-05-09 23:02:14.777422+00', ''),
	('00000000-0000-0000-0000-000000000000', '1ab9dd73-7057-4b71-a6b3-2cc3a357277c', '{"action":"token_refreshed","actor_id":"c0c4cc9b-b0fd-4ed3-aa71-324ea0aa94fa","actor_name":"Creativebuild","actor_username":"team@creativebuild.com","actor_via_sso":false,"log_type":"token"}', '2025-05-10 08:07:11.083769+00', ''),
	('00000000-0000-0000-0000-000000000000', '8ec4ad82-247d-4f8b-a1c4-d13f65c15cbd', '{"action":"token_revoked","actor_id":"c0c4cc9b-b0fd-4ed3-aa71-324ea0aa94fa","actor_name":"Creativebuild","actor_username":"team@creativebuild.com","actor_via_sso":false,"log_type":"token"}', '2025-05-10 08:07:11.087022+00', ''),
	('00000000-0000-0000-0000-000000000000', 'edb4cb42-7991-4bf4-baac-1a957eb63392', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-10 08:25:44.577999+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f2873823-0557-4f11-a2b1-61afd34d5299', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-10 08:25:44.58101+00', ''),
	('00000000-0000-0000-0000-000000000000', '050212ce-8fac-4279-8af6-b5a2ec91d79c', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-10 11:28:11.392358+00', ''),
	('00000000-0000-0000-0000-000000000000', '7191d1ae-febf-497e-9ddb-c5c229223cd3', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-10 11:28:11.395175+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ce0a691f-5d90-4964-b094-00c6ffa171bc', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-10 16:44:21.560069+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c286598d-e829-4cfd-96e8-b92a05d675db', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-10 16:44:21.563338+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c1059053-0a94-43d8-bc8d-94137b0ef5c1', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-10 23:51:41.595029+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e74cbf6f-5538-4230-8ea5-f90b1d866ac3', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-10 23:51:41.597286+00', ''),
	('00000000-0000-0000-0000-000000000000', '1fc2b67e-bd8a-4b61-a217-5c72fc4928b7', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-11 11:13:13.22929+00', ''),
	('00000000-0000-0000-0000-000000000000', 'af7546ee-c9ac-49a2-ac7f-336d876d886f', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-11 11:13:13.231099+00', ''),
	('00000000-0000-0000-0000-000000000000', '4e9a40a1-93eb-48d2-8ee5-886157613d6b', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-11 22:26:35.657226+00', ''),
	('00000000-0000-0000-0000-000000000000', '38a28d6c-67e0-4390-b0d8-e15c331baace', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-11 22:26:35.658933+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e033e83f-3065-488c-bea2-82791acd471c', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-11 22:34:48.950478+00', ''),
	('00000000-0000-0000-0000-000000000000', '67468d6b-fca0-4a70-b17d-bef72002980d', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-11 22:34:49.710975+00', ''),
	('00000000-0000-0000-0000-000000000000', '844805fe-27d3-4405-9ff6-227989d783ed', '{"action":"token_refreshed","actor_id":"c0c4cc9b-b0fd-4ed3-aa71-324ea0aa94fa","actor_name":"Creativebuild","actor_username":"team@creativebuild.com","actor_via_sso":false,"log_type":"token"}', '2025-05-11 22:36:11.452543+00', ''),
	('00000000-0000-0000-0000-000000000000', '3bcc048b-b286-419b-925c-4b227e2dbd8e', '{"action":"token_revoked","actor_id":"c0c4cc9b-b0fd-4ed3-aa71-324ea0aa94fa","actor_name":"Creativebuild","actor_username":"team@creativebuild.com","actor_via_sso":false,"log_type":"token"}', '2025-05-11 22:36:11.453196+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd4b9d54b-a3ec-4cb4-b204-78439aa919ed', '{"action":"token_refreshed","actor_id":"c0c4cc9b-b0fd-4ed3-aa71-324ea0aa94fa","actor_name":"Creativebuild","actor_username":"team@creativebuild.com","actor_via_sso":false,"log_type":"token"}', '2025-05-11 22:36:12.409476+00', ''),
	('00000000-0000-0000-0000-000000000000', '4ee9c880-4d30-462f-8e9d-ee39ab8bef07', '{"action":"token_refreshed","actor_id":"c0c4cc9b-b0fd-4ed3-aa71-324ea0aa94fa","actor_name":"Creativebuild","actor_username":"team@creativebuild.com","actor_via_sso":false,"log_type":"token"}', '2025-05-11 22:36:13.045524+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dedb670e-fff9-43d7-9ccc-3d362a7db986', '{"action":"token_refreshed","actor_id":"c0c4cc9b-b0fd-4ed3-aa71-324ea0aa94fa","actor_name":"Creativebuild","actor_username":"team@creativebuild.com","actor_via_sso":false,"log_type":"token"}', '2025-05-11 22:36:13.241897+00', ''),
	('00000000-0000-0000-0000-000000000000', '817e03ee-fa47-4d0a-a124-8745ff3cdfdc', '{"action":"login","actor_id":"c0c4cc9b-b0fd-4ed3-aa71-324ea0aa94fa","actor_name":"Creativebuild","actor_username":"team@creativebuild.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-11 22:42:06.966272+00', ''),
	('00000000-0000-0000-0000-000000000000', 'eebd06f4-2edd-4641-9834-9961c58aac2e', '{"action":"login","actor_id":"c0c4cc9b-b0fd-4ed3-aa71-324ea0aa94fa","actor_name":"Creativebuild","actor_username":"team@creativebuild.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-11 22:42:07.701799+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a521e1dc-89c5-4baa-a7b2-7a291d2a9233', '{"action":"logout","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-11 22:48:20.826957+00', ''),
	('00000000-0000-0000-0000-000000000000', '00561155-4e07-4e27-b0c0-54f0c26a6070', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-11 22:48:30.892717+00', ''),
	('00000000-0000-0000-0000-000000000000', '217d7335-1e71-44c6-887b-427429cfd679', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-11 22:48:31.517672+00', ''),
	('00000000-0000-0000-0000-000000000000', '53e876d6-185b-446e-b341-21acb6394a77', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-12 12:19:38.732622+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b043ed29-a856-4ccb-96c3-07ade8ba2ff1', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-12 12:19:38.735402+00', ''),
	('00000000-0000-0000-0000-000000000000', '19e2e850-2f2e-43e5-862d-6b85008c51ff', '{"action":"login","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-05-12 18:50:11.64578+00', ''),
	('00000000-0000-0000-0000-000000000000', '31a92613-4ad6-4f2c-bcbd-c133d8f98992', '{"action":"login","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-05-12 18:50:12.393879+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c508a144-873d-4dce-b981-c12ebd73e8ec', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-12 20:18:14.983636+00', ''),
	('00000000-0000-0000-0000-000000000000', '0ee9e0e0-410f-4c60-a3f7-a38d0a1810ed', '{"action":"token_revoked","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-12 20:18:14.985763+00', ''),
	('00000000-0000-0000-0000-000000000000', '6251bc4f-b837-4aaf-8457-042e09e257d3', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-13 17:40:31.189191+00', ''),
	('00000000-0000-0000-0000-000000000000', '4473f403-a078-459d-8fd8-0cdf746a5c11', '{"action":"token_revoked","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-13 17:40:31.191498+00', ''),
	('00000000-0000-0000-0000-000000000000', '7ff6f180-1001-4909-aee7-9c7e27d447cd', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-13 18:39:45.987583+00', ''),
	('00000000-0000-0000-0000-000000000000', '80e051c3-8af1-4e05-a49f-38c6ad62556e', '{"action":"token_revoked","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-13 18:39:45.989192+00', ''),
	('00000000-0000-0000-0000-000000000000', 'deb7a8ce-4c4c-4e67-a607-2d9c5e940c35', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-13 19:38:24.882944+00', ''),
	('00000000-0000-0000-0000-000000000000', 'af70e178-9612-4b7a-81c2-a8aa6df4257e', '{"action":"token_revoked","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-13 19:38:24.884575+00', ''),
	('00000000-0000-0000-0000-000000000000', 'abe006e0-ec94-4ace-bde6-ba1a44ff8330', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-14 08:34:03.638158+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e9b8684e-d390-453a-aae1-746aa75c7ce2', '{"action":"token_revoked","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-14 08:34:03.640676+00', ''),
	('00000000-0000-0000-0000-000000000000', 'da385440-40e2-4644-bf7d-0fb22c28f90e', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-14 09:32:40.776849+00', ''),
	('00000000-0000-0000-0000-000000000000', '9d3a0ced-747c-4b52-b412-54f55c34a64d', '{"action":"token_revoked","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-14 09:32:40.779242+00', ''),
	('00000000-0000-0000-0000-000000000000', '0f83d023-a456-41dc-947b-bfe6bc319857', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-14 10:32:50.125429+00', ''),
	('00000000-0000-0000-0000-000000000000', 'da386799-5143-4363-b995-ae0b52bea981', '{"action":"token_revoked","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-14 10:32:50.127752+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fc821385-409f-45cd-a3bc-f4c6d79c3dd4', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-14 13:14:15.790284+00', ''),
	('00000000-0000-0000-0000-000000000000', '4d81b478-6f21-4ebe-a8be-1e7645f450e4', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-14 13:14:15.791189+00', ''),
	('00000000-0000-0000-0000-000000000000', '3895bc3c-eb2c-4602-a6db-6b1843cf5382', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-16 00:39:15.977068+00', ''),
	('00000000-0000-0000-0000-000000000000', '21b98102-1f6b-4ad5-9588-57f7644bf994', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-16 00:39:15.979196+00', ''),
	('00000000-0000-0000-0000-000000000000', '311de2ba-f71e-426f-a2f7-f45933f5d71e', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-16 06:46:40.220266+00', ''),
	('00000000-0000-0000-0000-000000000000', '02c7c03d-b4d2-4c71-84bc-ebed9f6bcad0', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-16 06:46:40.221975+00', ''),
	('00000000-0000-0000-0000-000000000000', '54d111a0-a9e0-4f18-9946-747d379e9ad1', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-16 17:11:49.29541+00', ''),
	('00000000-0000-0000-0000-000000000000', '4cac0817-7b13-4333-b586-15be137b99c3', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-16 17:11:49.296327+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ba1c8ad8-b70b-4b90-a57a-a9c3d7f43d12', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-17 13:18:05.077967+00', ''),
	('00000000-0000-0000-0000-000000000000', '37803f09-1b28-4e30-8b4f-de377cb018dd', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-17 13:18:05.079145+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cf3bfd15-f831-49d1-8812-8e47656b7ad3', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-17 18:07:43.157344+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f7f7d1ae-35e7-41f8-aa9f-d9c262150f0f', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-17 18:07:43.159458+00', ''),
	('00000000-0000-0000-0000-000000000000', '01639578-adba-4967-a594-d418c768c57d', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-18 13:04:10.938355+00', ''),
	('00000000-0000-0000-0000-000000000000', '6d44203f-62b1-4266-b94f-12cb7fcf12c0', '{"action":"token_revoked","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-18 13:04:10.93922+00', ''),
	('00000000-0000-0000-0000-000000000000', '21d1ff15-cbf7-4e1e-b3f3-52cca419fc9f', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-18 13:04:11.870346+00', ''),
	('00000000-0000-0000-0000-000000000000', '1f94ea30-7d6d-4552-afc8-927b1d565efd', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-05-18 13:04:12.089608+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a475fd5b-3228-455d-9b62-bed70350597c', '{"action":"logout","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-05-18 13:06:29.37291+00', ''),
	('00000000-0000-0000-0000-000000000000', '34f1411c-a99f-414f-913e-295ad500509a', '{"action":"login","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-06-01 20:57:38.784659+00', ''),
	('00000000-0000-0000-0000-000000000000', '7ab6dd78-45c5-433c-98ac-95242fa35f5f', '{"action":"login","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-06-01 20:57:47.109369+00', ''),
	('00000000-0000-0000-0000-000000000000', 'aac9d9fe-eccf-4368-ad83-b8bdbd190a35', '{"action":"token_refreshed","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-01 22:01:09.6753+00', ''),
	('00000000-0000-0000-0000-000000000000', '25c0373b-d448-4ef7-8887-6fa61579b793', '{"action":"token_revoked","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-01 22:01:09.676903+00', ''),
	('00000000-0000-0000-0000-000000000000', '91bc170e-d741-498b-b05a-2e681d833b90', '{"action":"user_recovery_requested","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"user"}', '2025-06-05 17:50:32.482716+00', ''),
	('00000000-0000-0000-0000-000000000000', '6964e2c1-e581-4ae8-9380-890fd133b4d8', '{"action":"user_recovery_requested","actor_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","actor_name":"Rich Holt","actor_username":"richholt@gmail.com","actor_via_sso":false,"log_type":"user"}', '2025-06-06 11:34:47.954736+00', ''),
	('00000000-0000-0000-0000-000000000000', '13ccf82a-f193-4233-bc35-4cda3bfa00ac', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-06-26 09:20:34.547428+00', ''),
	('00000000-0000-0000-0000-000000000000', '130e05d7-b8e1-4e4f-b343-0583df9c57ab', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-06-26 09:20:42.891223+00', ''),
	('00000000-0000-0000-0000-000000000000', '6a4df284-0126-4246-88c5-e927f28ad5d3', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-27 09:15:12.463212+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f8164b51-22c2-4510-bb0a-b6bf78ed3429', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-27 09:15:12.464224+00', ''),
	('00000000-0000-0000-0000-000000000000', '12785fff-964d-4005-84a0-e8dbbc6ed57c', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-06-29 21:56:17.263262+00', ''),
	('00000000-0000-0000-0000-000000000000', '6d894c8a-ac1a-4fac-8e38-751a783f18f9', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-06-29 21:56:32.983847+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cb16cb3a-b4e8-449a-900d-e285d4706d2a', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-30 10:40:57.918135+00', ''),
	('00000000-0000-0000-0000-000000000000', '58d04eeb-5565-45c3-8725-9d36e97c7e72', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-30 10:40:57.920631+00', ''),
	('00000000-0000-0000-0000-000000000000', '55c064d1-7adc-4837-9690-a9088aee7bb4', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-30 12:19:25.4742+00', ''),
	('00000000-0000-0000-0000-000000000000', '20e9686b-0ab8-4a46-9572-7af129a8d2c3', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-30 12:19:25.475048+00', ''),
	('00000000-0000-0000-0000-000000000000', '6b18eaaf-ae7e-4416-ba16-e9914e5371ff', '{"action":"logout","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-30 12:20:18.216308+00', ''),
	('00000000-0000-0000-0000-000000000000', '6c64042e-1c05-4abf-a808-de2376bfb237', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-06-30 12:20:29.529668+00', ''),
	('00000000-0000-0000-0000-000000000000', '7dc3b9b6-e550-4712-8a63-5d55be621ac4', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-06-30 12:32:45.550074+00', ''),
	('00000000-0000-0000-0000-000000000000', '240de9eb-5ce7-435b-a7a0-0a468c96760d', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-06-30 12:32:47.675986+00', ''),
	('00000000-0000-0000-0000-000000000000', '55cdde31-8afc-4cd9-99a3-65deb3c7222b', '{"action":"logout","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-30 12:33:01.858359+00', ''),
	('00000000-0000-0000-0000-000000000000', 'aa312f77-e406-4376-a04e-2fb9754ab2ab', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-06-30 12:37:24.211936+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b21896e1-49b5-459b-b6b2-6e7741ad055a', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-06-30 12:37:25.058373+00', ''),
	('00000000-0000-0000-0000-000000000000', '9dd7c472-2b4b-421a-a3d8-73c707966dad', '{"action":"logout","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-30 12:37:56.87231+00', ''),
	('00000000-0000-0000-0000-000000000000', '44e78383-9ad1-406f-ba42-2931ec32f661', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-06-30 12:40:35.384014+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd91834d5-c2f3-49cd-a7bd-fe5240cd19cc', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-06-30 12:40:36.242192+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fac29a4d-5537-4383-adbe-4336169c3ea8', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-06-30 12:41:29.391342+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ef8198f8-c643-4213-a35b-c70639f385bb', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-06-30 12:41:30.285778+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd8321696-820c-4353-b222-92b1679412f6', '{"action":"logout","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-30 12:41:33.696662+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e2ac777e-473a-4d2c-be4e-0fd28835d55d', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-06-30 16:15:37.398314+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e68113ab-b703-4fd8-984e-8eb3f8acddaf', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-06-30 16:15:38.721333+00', ''),
	('00000000-0000-0000-0000-000000000000', '1901cc0a-8823-4c94-bf8b-ea0a4d9d8699', '{"action":"logout","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-30 16:15:55.315501+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bcaa624a-6402-444c-abcd-cd96241da37c', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-06-30 16:27:00.149833+00', ''),
	('00000000-0000-0000-0000-000000000000', '847d78d5-8294-4a6b-9d15-77fd915e770b', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-06-30 16:27:01.590851+00', ''),
	('00000000-0000-0000-0000-000000000000', '77bbffc3-9025-4e06-be41-88e80cfb04d2', '{"action":"logout","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-30 16:27:34.875345+00', ''),
	('00000000-0000-0000-0000-000000000000', 'af737fd9-00e4-4f95-8176-dd5f78261661', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-06-30 16:27:44.00002+00', ''),
	('00000000-0000-0000-0000-000000000000', '7fb83f63-823e-411c-b77d-d3ff43f11373', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-06-30 16:27:44.450914+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bebadb63-0f68-4ca2-b3cc-bf0216480688', '{"action":"logout","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-30 16:53:37.250088+00', ''),
	('00000000-0000-0000-0000-000000000000', '1228e3f9-0542-4c17-9052-455b8c6da7e5', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-06-30 16:54:01.254084+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b9f5710b-18d5-4982-a03c-ed96967dccec', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-06-30 16:54:01.968645+00', ''),
	('00000000-0000-0000-0000-000000000000', 'effb6006-f9ff-4ec5-9e71-2299bbb684af', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-30 19:42:35.826825+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e044fef3-55c1-4afa-b258-3ae4ef0903b4', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-30 19:42:35.827836+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e32034db-64e1-4bf9-9a3e-2b02854dfabd', '{"action":"logout","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-30 19:42:43.18968+00', ''),
	('00000000-0000-0000-0000-000000000000', '44266bfc-800e-4211-8615-9a39bd7a252c', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-06-30 19:42:50.686372+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a379bb6b-d0fa-4ab5-afa8-6ff19719a3ff', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-06-30 19:42:51.967539+00', ''),
	('00000000-0000-0000-0000-000000000000', '802f9ebe-2985-4386-960e-45c40e7cfded', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-06-30 21:31:04.944806+00', ''),
	('00000000-0000-0000-0000-000000000000', '306ce0b4-56a6-4765-be65-96df845e4b73', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-06-30 21:31:06.198185+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a1f74cd2-143b-4c08-b390-0a98c7a4c2fe', '{"action":"logout","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-30 21:33:59.688759+00', ''),
	('00000000-0000-0000-0000-000000000000', '53d85c96-ef8a-4fd4-91ed-88c3d94eaa8a', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-06-30 21:34:06.172518+00', ''),
	('00000000-0000-0000-0000-000000000000', '7a33a1df-d757-4aac-934c-85b58029b8ba', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-06-30 21:34:06.861753+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c25d17f4-80e1-43cb-8ac9-42e0d46d55b1', '{"action":"logout","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-06-30 21:34:38.171842+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a3a0a646-a585-46ca-8969-62d7db74f950', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-06-30 21:34:44.76125+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c002577d-195a-4e8f-8ec9-0e5910e9a2bf', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-06-30 21:34:45.403327+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c8ba4593-a77a-48eb-a64c-8e617db1c692', '{"action":"token_refreshed","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-01 06:32:28.023934+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a4301b54-64b3-4384-84b1-0d51fefa10ba', '{"action":"token_revoked","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-01 06:32:28.025743+00', ''),
	('00000000-0000-0000-0000-000000000000', '6f7e9059-b2cf-4eec-b197-0fc226d05af4', '{"action":"logout","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-07-01 06:32:45.487447+00', ''),
	('00000000-0000-0000-0000-000000000000', '8fb8af5b-545b-4a00-9f2f-163fc079412f', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-07-01 06:32:53.36691+00', ''),
	('00000000-0000-0000-0000-000000000000', '1f735dd7-6fb9-4e00-b6aa-fc6f368ba7b8', '{"action":"login","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-07-01 06:32:55.094389+00', ''),
	('00000000-0000-0000-0000-000000000000', '733d0bcc-0b3d-4f7a-9647-799ebbb62a75', '{"action":"logout","actor_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-07-01 06:33:03.207633+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c5e801cb-4042-44a6-8a93-f89733bd7fc5', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"david.benollol@gmail.com","user_id":"efc62e1c-e7c2-4e51-8396-ac75898302ec","user_phone":""}}', '2025-07-01 06:34:56.987161+00', ''),
	('00000000-0000-0000-0000-000000000000', '4d18fe02-93ca-4f58-8586-3a6be5cc19f3', '{"action":"user_signedup","actor_id":"306df3b4-6672-4fe3-9fb0-8853e23c4171","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"google"}}', '2025-07-01 07:54:42.948152+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f3f3962d-07f7-4628-a347-9addf7d44d60', '{"action":"login","actor_id":"306df3b4-6672-4fe3-9fb0-8853e23c4171","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-07-01 07:54:44.716752+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b6aa60d3-e58c-4bb5-bfe6-c7e933f3eb33', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"david.benollol@gmail.com","user_id":"306df3b4-6672-4fe3-9fb0-8853e23c4171","user_phone":""}}', '2025-07-01 07:55:03.50745+00', ''),
	('00000000-0000-0000-0000-000000000000', '7ad8268c-2cc7-48ba-afa0-7a600185c4e4', '{"action":"user_signedup","actor_id":"59d4e05a-ed58-4b2f-967c-cfce8793afdc","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"google"}}', '2025-07-01 08:27:56.673642+00', ''),
	('00000000-0000-0000-0000-000000000000', '8321e874-96cc-48dc-8dec-3fbc3793f62c', '{"action":"login","actor_id":"59d4e05a-ed58-4b2f-967c-cfce8793afdc","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-07-01 08:27:58.455492+00', ''),
	('00000000-0000-0000-0000-000000000000', '662120b9-496e-49b8-9175-dc359b9aa7fb', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"team@creativebuild.com","user_id":"c0c4cc9b-b0fd-4ed3-aa71-324ea0aa94fa","user_phone":""}}', '2025-07-01 08:36:44.51533+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f754e80d-6691-48c1-b835-6411a9cb2651', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"david.benollol@gmail.com","user_id":"59d4e05a-ed58-4b2f-967c-cfce8793afdc","user_phone":""}}', '2025-07-01 08:36:44.572539+00', ''),
	('00000000-0000-0000-0000-000000000000', '03905ca3-2796-4a9f-9a68-7a231bb73bee', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"richholt@gmail.com","user_id":"68cc6659-3ea0-4c37-affc-59176f6e9432","user_phone":""}}', '2025-07-01 08:36:44.720787+00', ''),
	('00000000-0000-0000-0000-000000000000', '29219386-2d4d-4c18-b318-a23b67c419a2', '{"action":"user_signedup","actor_id":"7243d2ed-00bc-44be-8aeb-ea3a19c6f4bd","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"google"}}', '2025-07-01 09:29:14.363464+00', ''),
	('00000000-0000-0000-0000-000000000000', '172f0f98-fe7c-40c1-ab99-926174fda9dd', '{"action":"login","actor_id":"7243d2ed-00bc-44be-8aeb-ea3a19c6f4bd","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-07-01 09:29:15.594189+00', ''),
	('00000000-0000-0000-0000-000000000000', 'abac2e4e-26af-492d-9c7d-3c34a31850cd', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"david.benollol@gmail.com","user_id":"7243d2ed-00bc-44be-8aeb-ea3a19c6f4bd","user_phone":""}}', '2025-07-01 09:32:05.298637+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ce918176-a7bd-4273-bbf5-93b51732aaa9', '{"action":"user_signedup","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"google"}}', '2025-07-01 09:52:25.572528+00', ''),
	('00000000-0000-0000-0000-000000000000', '6daa7dbe-7936-462d-b82b-c6da0ab339c0', '{"action":"login","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-07-01 09:52:26.410783+00', ''),
	('00000000-0000-0000-0000-000000000000', '25503870-37e0-4c1f-8beb-0d178f415e65', '{"action":"logout","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-07-01 09:52:49.582883+00', ''),
	('00000000-0000-0000-0000-000000000000', '2e219ab7-be47-4dff-93d1-66e41d66ae0d', '{"action":"login","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-07-01 09:53:54.098598+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd2e6f32f-85ea-4a2c-9103-6ad040ac0f90', '{"action":"login","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-07-01 09:53:54.571106+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a323cf38-8bef-462d-8471-402670fa5abf', '{"action":"logout","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-07-01 09:58:18.508098+00', ''),
	('00000000-0000-0000-0000-000000000000', '3911737c-a4b1-4d3d-b595-beffe2d3ae4b', '{"action":"login","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-07-01 10:03:32.209892+00', ''),
	('00000000-0000-0000-0000-000000000000', '973c784c-08ca-4875-88b5-3599467318ac', '{"action":"login","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-07-01 10:03:33.365165+00', ''),
	('00000000-0000-0000-0000-000000000000', '5f565997-bd19-4b38-b0b4-2c5d3ef5c96f', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-01 12:56:03.814723+00', ''),
	('00000000-0000-0000-0000-000000000000', '141edfa0-2514-4023-a031-fdd3e2b5d41b', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-01 12:56:03.816629+00', ''),
	('00000000-0000-0000-0000-000000000000', '13b961bc-f5db-4285-b6a1-254f01f64646', '{"action":"logout","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-07-01 12:56:13.548289+00', ''),
	('00000000-0000-0000-0000-000000000000', '164f37ee-127e-4a89-99d5-1311a910010f', '{"action":"login","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-07-01 12:56:42.036807+00', ''),
	('00000000-0000-0000-0000-000000000000', '319b6104-d56a-4714-96ba-b5a861cb639f', '{"action":"login","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-07-01 12:56:43.389187+00', ''),
	('00000000-0000-0000-0000-000000000000', '443eead8-c49d-4fd2-9acd-38937a9c6dec', '{"action":"logout","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-07-01 13:05:14.25894+00', ''),
	('00000000-0000-0000-0000-000000000000', '79c8f392-da41-4211-bdaf-50ef6e10af2f', '{"action":"login","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-07-01 14:49:45.559086+00', ''),
	('00000000-0000-0000-0000-000000000000', '7ae2b855-341a-42e0-aabe-d3d3d39016f9', '{"action":"login","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-07-01 14:49:47.311121+00', ''),
	('00000000-0000-0000-0000-000000000000', '88575998-9dfa-4234-8ff3-1bc6ae1b16c2', '{"action":"logout","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-07-01 14:51:31.545038+00', ''),
	('00000000-0000-0000-0000-000000000000', '95f7e53a-12de-43fb-be0d-7c464ebc088f', '{"action":"login","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-07-01 14:51:41.029423+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bbf79462-6fc9-4a75-b2a2-167849aecd90', '{"action":"login","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-07-01 14:51:41.779682+00', ''),
	('00000000-0000-0000-0000-000000000000', '12c07afa-4e30-4291-90ae-1924e351e124', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-01 16:27:42.29095+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e5235c84-83e2-4f98-8aca-e94195b13e40', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-01 16:27:42.294462+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ef3c0ea2-2baf-4724-938b-47a33b752936', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-01 18:46:07.860888+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd222389c-4547-4f50-9908-a4713360ae61', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-01 18:46:07.862528+00', ''),
	('00000000-0000-0000-0000-000000000000', '230fc2bf-e833-4eae-89fa-70d7244258c8', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-01 20:13:43.950838+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b8b67920-0596-4bf3-9022-f8e5f14c5f6c', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-01 20:13:43.952892+00', ''),
	('00000000-0000-0000-0000-000000000000', '60d9dbe1-2fa1-41d4-a63b-9b1d603025b0', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-02 23:39:42.570022+00', ''),
	('00000000-0000-0000-0000-000000000000', '3d0cf712-c65b-4afd-9f20-35e497ab62bb', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-02 23:39:42.573022+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b88dbda8-b524-4326-b042-a2f1ea39ebce', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 15:28:30.237782+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bdc17bb4-95c8-410f-aa3a-a4ca6ef017c0', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-04 15:28:30.241169+00', ''),
	('00000000-0000-0000-0000-000000000000', '25ce23e4-9606-41c8-8c28-33683455949c', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 17:44:57.426232+00', ''),
	('00000000-0000-0000-0000-000000000000', '61810f66-975a-4067-bf2d-1143e124c1b5', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 17:44:57.428231+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f3184742-e18e-4bc0-b4e4-6b4da02526f4', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 18:47:30.090577+00', ''),
	('00000000-0000-0000-0000-000000000000', '2fcca62d-a746-43e5-a955-5f746fd26470', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 18:47:30.092087+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e271ec79-1856-4cf1-be16-cf9856c5db93', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 20:35:29.050024+00', ''),
	('00000000-0000-0000-0000-000000000000', '1c0bddec-5a79-4ac1-8370-7b389efe27ff', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-06 20:35:29.052232+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c546682e-e138-464e-bcb1-8fbde5cf25b9', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 22:08:00.093707+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cf891387-063d-4dad-af03-17139aaf5ebd', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 22:08:00.094742+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cf08d314-e5b9-41b5-846e-a32ffafdf6e8', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 23:45:47.858096+00', ''),
	('00000000-0000-0000-0000-000000000000', '3e92f1d0-58e5-4a3a-abef-4ae62066dd08', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-07 23:45:47.859604+00', ''),
	('00000000-0000-0000-0000-000000000000', '64a6da9a-e6f5-48a3-87ba-e7e7ca98e7b6', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 09:06:24.554169+00', ''),
	('00000000-0000-0000-0000-000000000000', '335f7822-beb4-4c37-8b1b-d630ffb3361f', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 09:06:24.555264+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a0f8c5f9-c636-4b7e-b48e-d012cc167c99', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 11:40:34.782715+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ce7bdbfc-d8aa-427c-b2d3-666617e40a57', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 11:40:34.783814+00', ''),
	('00000000-0000-0000-0000-000000000000', '920ac8b9-ba6a-451d-b66a-132f62b26d27', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 13:39:03.569777+00', ''),
	('00000000-0000-0000-0000-000000000000', '301dcd3a-399c-4683-8341-641fcc20b3c7', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 13:39:03.572244+00', ''),
	('00000000-0000-0000-0000-000000000000', '719fd13e-76b8-49cf-8458-f30b464e5774', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 15:40:09.701897+00', ''),
	('00000000-0000-0000-0000-000000000000', '79657fbd-1b14-40c8-9578-ad2951a25ae3', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 15:40:09.703357+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b12b7701-2a0c-4da7-9ce0-902ec00b70d1', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 17:32:28.623745+00', ''),
	('00000000-0000-0000-0000-000000000000', '6e287cee-e299-44ac-8eb0-760f806d7d4f', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 17:32:28.624664+00', ''),
	('00000000-0000-0000-0000-000000000000', '3c5ab545-655a-4b2f-a223-6e28eaa5e2e9', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 19:19:08.595649+00', ''),
	('00000000-0000-0000-0000-000000000000', '69409fef-bcfc-49be-af6f-b3d00ed42880', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 19:19:08.596503+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cc5ca071-75ab-4e1a-ac34-4e0270db6406', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 20:20:10.007071+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b7f2820a-7f3c-4bd9-813d-c51d6114a552', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 20:20:10.01046+00', ''),
	('00000000-0000-0000-0000-000000000000', '50ed38eb-f87b-4e42-8737-23db56ab2f9d', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 05:15:06.037998+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd95f5e87-9337-4915-8092-41f394f6fdcd', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 05:15:06.039004+00', ''),
	('00000000-0000-0000-0000-000000000000', '5b624f41-3753-4188-a70b-ecd1bd9da544', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 05:15:06.729896+00', ''),
	('00000000-0000-0000-0000-000000000000', '6807b269-2be1-4431-9719-42bd119d6df8', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 05:15:06.759887+00', ''),
	('00000000-0000-0000-0000-000000000000', '10036b16-18ee-43dc-ae9b-bcdcd1626933', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 05:15:06.77936+00', ''),
	('00000000-0000-0000-0000-000000000000', '41f6193b-396f-409b-9ffc-1bf72eb4d340', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 05:15:06.792369+00', ''),
	('00000000-0000-0000-0000-000000000000', '5c2487bb-78b8-45e4-9b90-e33009a3bdda', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 05:15:06.807968+00', ''),
	('00000000-0000-0000-0000-000000000000', '429c24d3-7ea4-4b46-b4a4-e25c736ac591', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 17:40:40.266444+00', ''),
	('00000000-0000-0000-0000-000000000000', '03977ffe-c1b0-4d6a-8857-36603dc5f6bf', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 17:40:40.267359+00', ''),
	('00000000-0000-0000-0000-000000000000', '93295918-3698-4cf0-8de2-1fb53ae53154', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 21:00:55.071559+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dac51022-897f-4f04-a5dd-68b11efd0847', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 21:00:55.074602+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ffb73014-a679-4104-936b-524704a26a37', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 22:56:36.322367+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b005951d-1193-4954-8f3e-59bfe6205218', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-09 22:56:36.323822+00', ''),
	('00000000-0000-0000-0000-000000000000', '6f53a0e8-6e4e-4a51-a0a0-e4e8bd33a40b', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-10 09:34:26.518335+00', ''),
	('00000000-0000-0000-0000-000000000000', '91240c32-8014-4b31-af25-790a66fa0603', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-10 09:34:26.519263+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e6694621-47ac-4490-8865-1e6b9aeea709', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-12 22:08:32.623632+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd500557a-2ce7-4d4a-9a6e-17d8a3215774', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-12 22:08:32.631824+00', ''),
	('00000000-0000-0000-0000-000000000000', '04321672-ccbb-4f6c-8c1d-45b75681d2e5', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-14 11:28:44.302894+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c271b56e-a05f-48ba-978a-00fc99a37840', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-14 11:28:44.306583+00', ''),
	('00000000-0000-0000-0000-000000000000', '7d38f181-9f68-43cf-90b1-d519de47aece', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-14 14:36:09.928417+00', ''),
	('00000000-0000-0000-0000-000000000000', '96cd276a-b50d-4dc3-8b2c-49f403f8f905', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-14 14:36:09.929409+00', ''),
	('00000000-0000-0000-0000-000000000000', '24e08a04-1fa6-4c1a-9538-a73bdd60003e', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-14 23:26:02.447436+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b060d2b1-1eee-4bcf-9526-5c8d806eefca', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-14 23:26:02.448437+00', ''),
	('00000000-0000-0000-0000-000000000000', '2bdcebac-63e2-48bc-90bf-dc13165a6529', '{"action":"login","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-07-15 02:24:28.622299+00', ''),
	('00000000-0000-0000-0000-000000000000', '78eeff73-a50a-44c4-8fa7-bc1187266183', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-15 02:24:30.913139+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e7ef4c43-d8f8-465d-b5ac-71b7a70fb9ab', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-15 02:24:30.913737+00', ''),
	('00000000-0000-0000-0000-000000000000', '22779e64-3a58-4784-8060-1f195a0ed959', '{"action":"login","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-07-15 02:35:11.085373+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fc536040-9333-4575-9f41-996eefdc8fd7', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-15 21:14:31.046543+00', ''),
	('00000000-0000-0000-0000-000000000000', '31e2f57c-392c-4131-af19-d9f811578e72', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-15 21:14:31.047519+00', ''),
	('00000000-0000-0000-0000-000000000000', '777a7b34-7cf9-49b4-af3c-336d58c36959', '{"action":"token_refreshed","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-17 18:50:52.289894+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cae37dad-be14-4636-a0d6-b394a3b57198', '{"action":"token_revoked","actor_id":"dcace384-bcbb-43de-b48f-bd82722b6ce0","actor_name":"David","actor_username":"david.benollol@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-17 18:50:52.293886+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at") VALUES
	('1b682522-9cdc-4e50-934b-88d606a02104', '79acf17f-0800-4882-99dd-3b1dc2171c88', 'fbdb04ca-f646-4522-bab9-5a7c2846e7a7', 's256', 'nqMC8TxafyP6yxRIIDTa4rJPprWfQTa-ik_8JiT9VHU', 'google', 'ya29.a0AZYkNZhpLtNnUPs7bFA-EOVOCu5gU7VrUCPg7GKNwkhfDY7QtjFU30pLHb_fSIEmqv8RzZQC-pzjMqSsxZ3674trVHdmTYRdS8IlOWX9Sn4BQddZX6sGrG-6RLRBoSKiFSGc3jVIbBJ8G3yVuLMlpPRNa9u1KHWA7AbMn1yWaCgYKAboSARUSFQHGX2Mik2lsHuqhHXxB2GNpkVkn2A0175', '1//059hubj1zYTkACgYIARAAGAUSNwF-L9Ir1iHXgOqajQi5pHkE23ZhDQOfWlMEKaXEnkF7Z109o_BkzQaIdF4aRaZLv1dDqt7OF1I', '2025-05-03 23:12:11.548382+00', '2025-05-03 23:12:16.807612+00', 'oauth', '2025-05-03 23:12:16.807562+00'),
	('bab0598b-afc6-494b-83ca-f8787690efcb', '79acf17f-0800-4882-99dd-3b1dc2171c88', '52ca1de1-7924-465b-813e-191ddf0c0144', 's256', '9jSFpKw8cSET72FGXBMi2UZAxUqDrWqrV1Ft1-SWTJc', 'magiclink', '', '', '2025-05-03 23:13:36.327629+00', '2025-05-03 23:13:47.775499+00', 'magiclink', '2025-05-03 23:13:47.775459+00'),
	('92ea0e45-94ec-4e82-908e-e8e9015802a3', '79acf17f-0800-4882-99dd-3b1dc2171c88', 'eece8c1f-8014-4d3c-b821-4fc434d5fe4d', 's256', 'BaB6YByNYrndqx1EJcVCFN-cKQrmsymI86miZcUgDeg', 'google', 'ya29.a0AZYkNZirFVGSHpPfxpkmFzo51q-nJ2iCQ80QaLVgkV9MJp1dD3jl0iLEkl64eDfApvQqM_GiAYLm1Qy2drHIO9aNQN02i-pzGi2FeSK9-_rFS_o8pLH1nr57SSf9Tk3SyUQzeDlMx8Fp5bxcW1IKnZLEQvPq3ZQ_J5UAOKIJaCgYKAfgSARUSFQHGX2Mig4E1jkwfeAUQ5sgMpWoXZw0175', '1//05K0m6J8oAfUdCgYIARAAGAUSNwF-L9IrY-Zs_LTo6kcRA1F_0mP4XLbwXx5SEemgxd4iMJ44vuXzyFk5oJLbmPgs9sPDi2fpFPk', '2025-05-03 23:24:32.840117+00', '2025-05-03 23:24:39.031905+00', 'oauth', '2025-05-03 23:24:39.03185+00'),
	('421ddb04-ef99-4d72-b8c9-12303491f8dc', '79acf17f-0800-4882-99dd-3b1dc2171c88', '588ebd8a-4d3f-4012-9910-aad002e4d966', 's256', 'B6_5XUdQrqwCcklFBlskCz6GNmv1PPMbvU7rqGRhzLI', 'google', 'ya29.a0AZYkNZi8IgShwR9PZP8hpj1eVPfi4ERZubizGNyxN05o-ewQLfSHq_YuG3kymyxQ1QZeqHY4-wi66nk5UDBbsK_vBS0iJ17NiYtoJYBN_LeKsHCW8f2HpfiRThlT7sVrhxovyQCtJqZbUfKOXt-UF4ahc-1r1vqAdGFPtQ4SaCgYKAdMSARUSFQHGX2MiQu_yIgiUvVGYgIbNOchzpw0175', '1//05VdxaVhYHfhuCgYIARAAGAUSNwF-L9IrTCVDaWjfyxvssdIzYQR0jPUk8tUZkyoNVDeGVmOo0dyGMWpKtDbLBXdukQ5gsUCB0MA', '2025-05-03 23:25:30.010549+00', '2025-05-03 23:26:00.748048+00', 'oauth', '2025-05-03 23:26:00.748005+00'),
	('455d41c2-a80a-4b91-9667-0c32a3b102cf', '79acf17f-0800-4882-99dd-3b1dc2171c88', 'f4e61974-04fc-4252-b944-5d7f245f93a8', 's256', 'm6Oobim7xMSllYaLS8UXzWDys_3kaiWH6azH6qYmj-4', 'magiclink', '', '', '2025-05-03 23:29:26.849279+00', '2025-05-03 23:30:36.847367+00', 'magiclink', '2025-05-03 23:30:36.847329+00'),
	('ed542f0d-2cc2-4cfd-9628-0b7f97be58c6', NULL, '56b68f5e-b161-47da-8a6f-388fc8084512', 's256', 'abPoLzuzNg-_hWADY7X9P4qBViCl5npcaa2wlILka7Q', 'google', '', '', '2025-05-03 23:56:09.073985+00', '2025-05-03 23:56:09.073985+00', 'oauth', NULL),
	('594d26e0-dea4-4937-a8ee-56fcc84538df', NULL, '38f16caf-78dc-4b0d-a111-9680eb751092', 's256', 'RLTDmIRK5YGmN4u-0lrDSbbPK9mpsHPUpfaGtg6cj94', 'google', '', '', '2025-05-03 23:56:51.23635+00', '2025-05-03 23:56:51.23635+00', 'oauth', NULL),
	('9b39726d-3ad9-4d8d-a8ea-9d334a94bab4', NULL, '085e2688-1e0d-4fe6-8a8a-85315512bdd5', 's256', 'IyXiLmBWIjL2kq6-Mm0_X92FPGiJyHC6fHVGcAoNuww', 'google', '', '', '2025-05-04 00:07:43.893444+00', '2025-05-04 00:07:43.893444+00', 'oauth', NULL),
	('72c412aa-13bc-4113-b13f-26622407e4e7', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', 'db0a2c8d-1213-4470-b1b5-839332205ae6', 's256', 'AzzcuyNJ6U33cc1bdQV6O3UNNRQgvtk5q0fpdTDDc_c', 'google', 'ya29.a0AS3H6NzpXHCJK22SiiSpXfxiYyeQR_JvHAj6bOw4BUy666V0lztNhYn0TgQ1zLwTScIjg7JBYC92k1n5ivGFjytbHxjyrAC_buGcGRFALUdo8nfSlMU235T_QUFs13b0YtOHdNrxjz69Dy2sP-uVjHJhfDstp-d99VHyiIy2aCgYKAWQSARQSFQHGX2Mi_MtyFoyo5ihBHjUGAKQTiA0175', '1//05SR7SiWnjKZrCgYIARAAGAUSNwF-L9IrXVavIjK6jmZL2FTc95BKzqrgWFj1FN5psZcAmT8De5auI6uXvHKiFWZx1S03qKNsVXk', '2025-07-15 02:24:24.611741+00', '2025-07-15 02:24:28.623208+00', 'oauth', '2025-07-15 02:24:28.623154+00'),
	('4877b3cc-247f-44c4-9f1b-223376f7a9d7', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', 'e3756d3e-747e-4fef-b825-76de627baff3', 's256', '1qN2vVvaexIyUJf7ZnzN-RFHIXkQtphivzXYRJIAcak', 'google', 'ya29.a0AS3H6Nx0LOhdw2agOX9RBc0M6pMSrmIHmkv8ziFBpeoGpys4qpLDziHZu1VjANRjHfFnLZpOnCnJ9tTSskOerA3ZzF1uLi3Vbj1AOD4_PVBPZHcOnSlIhQeA7_8SJsNY_3_eMObtv3qo6IXwVfWhs3wo2_j1TE9ZMkUnRj1XaCgYKAYwSARISFQHGX2MizFerL-gk40gA8CgE4f2Y2w0175', '1//05aOedS_Pvpk9CgYIARAAGAUSNwF-L9IrwuT6RT3GOZpTrazmk2tRuuFCbt23vFlY1NKnmti9Q2gKhNlCV_UI9exgDrXXNZbMdKg', '2025-07-15 02:35:06.74322+00', '2025-07-15 02:35:11.086217+00', 'oauth', '2025-07-15 02:35:11.086172+00'),
	('1789bd24-ff14-4abe-8b35-8d8b3620ec4e', '68cc6659-3ea0-4c37-affc-59176f6e9432', '0c7119fd-a4cd-46a0-b70b-55d88d9efa36', 's256', 'V-9RT8Qie_S9Yh4mw4sx3TLASZY1GpDc-ysK4bucHNA', 'magiclink', '', '', '2025-06-05 17:50:32.475198+00', '2025-06-05 17:50:32.475198+00', 'magiclink', NULL),
	('f498b8bc-b475-4c11-b0b6-c873b53c9278', '68cc6659-3ea0-4c37-affc-59176f6e9432', '519abfd2-d4f7-4d7f-96f9-f62ba8944b94', 's256', 'p3yFf4gdy8EPCUBzw0Vak4omxc_T-9GX8vU1UHwureY', 'magiclink', '', '', '2025-06-06 11:34:47.95182+00', '2025-06-06 11:34:47.95182+00', 'magiclink', NULL),
	('d73ffc8c-601e-4916-98be-65fb8d6f7bb1', 'efc62e1c-e7c2-4e51-8396-ac75898302ec', '4826cd04-5840-4e1f-909d-552ec1f2cc4c', 's256', 'i3_vU5cOJLjbgGn4T7VkuMn6u3R2I0EME5cHo1RWy_Q', 'google', 'ya29.a0AS3H6NxiJoBVSY7najwNFAcutFqzFriRfZRIRE4OrI6imJM2-RWGm6xwxqcx0YcVFugRAGIEwnIc61aqUaJ3asKztT4fTt8S20X9gGrxpA3YfwCGsA0p5EOd1assZfFACXNjIHhPIkTsTwAhPs1XrXdEXFHruquwQpwfLgRnaCgYKATASARUSFQHGX2MisAlvp7G3yAJEyLvRxz0WVg0175', '1//057RaTmS9v9PoCgYIARAAGAUSNwF-L9IrenHhmeveaBjvRRBRoy9FJm06C2TlNgL1Alsf0kcMSyLOYbbsvCIDHxsxH9Nq0lO4XAY', '2025-06-30 12:20:25.035221+00', '2025-06-30 12:20:29.530264+00', 'oauth', '2025-06-30 12:20:29.530222+00'),
	('3af70612-9c47-4e93-a37f-3f607dad5cf9', 'd0835d66-0bc5-4ac1-82c9-509dd997034e', 'aea4cb92-9fbd-4e4c-bfe8-8100ad0910c5', 's256', 'ag4T3P9pZ49l93_-pEl7kc6zfZWQ3fuyKpvRbDV36Zs', 'email', '', '', '2025-05-04 04:57:49.577567+00', '2025-05-04 04:57:49.577567+00', 'email/signup', NULL),
	('0f23c110-1b53-4a26-b581-e0f1c5834388', '277021b9-9f20-4d21-9695-128e0b549ca4', '04d4f62a-d5c6-42b2-87d6-03c7e323753d', 's256', 'j06e2gfUe_V7AcV_PtsPsDSVDvRZkTZUIicXDHkH3H0', 'email', '', '', '2025-05-04 05:18:06.365618+00', '2025-05-04 05:18:06.365618+00', 'email/signup', NULL),
	('210c8f86-35d9-4668-a450-5acd5c333f91', NULL, '6d33ba85-d2e0-4bf7-8d6e-6566f2d68898', 's256', 'NqSb680NjvDQ7_rbeoqfSfIT4QGiCqqfJYjZ1QHeXpw', 'google', '', '', '2025-07-01 09:32:22.889935+00', '2025-07-01 09:32:22.889935+00', 'oauth', NULL),
	('b97dfa6b-548e-4e68-8fa0-49a1beac7b84', NULL, '2e232f10-2d6f-45e9-ade7-f66afdfc07d6', 's256', 'Q0GQfNgWttlcB7-7fekfllI96GbmQ9m2Ph676KBoRaw', 'google', '', '', '2025-07-01 09:32:27.854573+00', '2025-07-01 09:32:27.854573+00', 'oauth', NULL),
	('320da121-32dd-405e-a322-6009baca1d11', NULL, '2eb001dc-ee68-4af3-8eb9-b87270eaf118', 's256', '_I2ZE10ECtTHeAp4sNG7A5wAsBMYPXMoZyWH27uvFEQ', 'google', '', '', '2025-07-01 09:32:32.34317+00', '2025-07-01 09:32:32.34317+00', 'oauth', NULL),
	('063322bd-3b65-498b-a2ee-ef80dca11ed0', NULL, 'a58b3254-9216-45d1-b1db-1d1485e2315f', 's256', '6Nk2dpQ3FVQjOisXgdV77Mvvy7MLomQ3xeizxw4S39g', 'google', '', '', '2025-07-01 09:36:27.518436+00', '2025-07-01 09:36:27.518436+00', 'oauth', NULL),
	('a8cd7fbe-ffbd-439d-84d5-0ccaaba07b9e', NULL, 'd2e831bf-9172-4243-a3c2-39a8b1cc87bd', 's256', 'YWwETuZizVSjIIa-dGnXPKlanb3fpoDRj7mG12vwKLs', 'google', '', '', '2025-07-01 09:37:18.51823+00', '2025-07-01 09:37:18.51823+00', 'oauth', NULL),
	('151a499f-cd69-4cf2-98f9-0b734fe17d9a', NULL, '323f8e5c-c5fb-4b1f-9a1e-c30a3d2bc713', 's256', 'X7GmVCzv8ifyFd3gXgQr5AU9STNwvcTada5e9alU5TE', 'google', '', '', '2025-07-01 09:37:22.59647+00', '2025-07-01 09:37:22.59647+00', 'oauth', NULL),
	('3cbd15d5-71b3-447a-b452-73cb65c316b0', NULL, '5a49c85d-c5ff-4200-b2b3-419cf47aecfc', 's256', 'fN7Y1j3bfYw6paRbYZY6-PF722nd3hNjzQomCTK7Gmg', 'google', '', '', '2025-07-01 09:37:25.892832+00', '2025-07-01 09:37:25.892832+00', 'oauth', NULL),
	('8902809a-155e-4357-9f1c-203b021817f3', NULL, '0ddd188a-a4e8-46e0-b868-869a7c4220f3', 's256', 'qsG28Cb5sb8ta6rWqpxoCe6UTeMbszN59RDsOlQWtGo', 'google', '', '', '2025-07-01 09:37:30.123633+00', '2025-07-01 09:37:30.123633+00', 'oauth', NULL),
	('a76d6bd4-731c-4fb5-a052-2b73ca604924', NULL, 'cb20d8db-62e5-410f-b2bd-db0b5f9dc776', 's256', '8uDlN1Oy4REm2p8fLQOxYZSfVpAlq_aHFpA_Uk4_-ew', 'google', '', '', '2025-07-01 10:00:21.027837+00', '2025-07-01 10:00:21.027837+00', 'oauth', NULL);


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', 'authenticated', 'authenticated', 'david.benollol@gmail.com', NULL, '2025-07-01 09:52:25.573374+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-07-01 14:51:41.780332+00', '{"provider": "google", "providers": ["google"]}', '{"iss": "https://accounts.google.com", "sub": "110530994538012758503", "name": "David", "email": "david.benollol@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJNQhWmftVDfrAYDINBMHf3K5wgtN9bgl-MRtTm5nVS8iMr1aWn=s96-c", "full_name": "David", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJNQhWmftVDfrAYDINBMHf3K5wgtN9bgl-MRtTm5nVS8iMr1aWn=s96-c", "provider_id": "110530994538012758503", "email_verified": true, "phone_verified": false}', NULL, '2025-07-01 09:52:25.56227+00', '2025-07-17 18:50:52.301218+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('110530994538012758503', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', '{"iss": "https://accounts.google.com", "sub": "110530994538012758503", "name": "David", "email": "david.benollol@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJNQhWmftVDfrAYDINBMHf3K5wgtN9bgl-MRtTm5nVS8iMr1aWn=s96-c", "full_name": "David", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJNQhWmftVDfrAYDINBMHf3K5wgtN9bgl-MRtTm5nVS8iMr1aWn=s96-c", "provider_id": "110530994538012758503", "email_verified": true, "phone_verified": false}', 'google', '2025-07-01 09:52:25.568827+00', '2025-07-01 09:52:25.568887+00', '2025-07-15 02:35:11.080971+00', '0e7d9e32-6286-4ccb-8df2-fb2c40faa5e1');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('d0779d76-25cf-4fea-89ab-da9d874b6e96', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', '2025-07-01 14:51:41.780408+00', '2025-07-17 18:50:52.302566+00', NULL, 'aal1', NULL, '2025-07-17 18:50:52.302496', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36', '86.247.30.189', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('d0779d76-25cf-4fea-89ab-da9d874b6e96', '2025-07-01 14:51:41.78328+00', '2025-07-01 14:51:41.78328+00', 'oauth', '699fd8c0-7fb9-4190-b07a-8e293c18f4e1');


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

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 120, 'lxyq7iokd7fn', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-01 14:51:41.781349+00', '2025-07-01 16:27:42.295402+00', NULL, 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 121, 'zr2vvjka5tel', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-01 16:27:42.297183+00', '2025-07-01 18:46:07.863689+00', 'lxyq7iokd7fn', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 122, '35n7gbgocuyi', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-01 18:46:07.86505+00', '2025-07-01 20:13:43.953517+00', 'zr2vvjka5tel', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 123, 'mqlz3snnbv7v', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-01 20:13:43.955054+00', '2025-07-02 23:39:42.57441+00', '35n7gbgocuyi', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 124, 'q6cfrcdfcqey', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-02 23:39:42.575165+00', '2025-07-04 15:28:30.241941+00', 'mqlz3snnbv7v', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 125, 'o2hn4srpjmjz', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-04 15:28:30.244545+00', '2025-07-06 17:44:57.428826+00', 'q6cfrcdfcqey', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 126, 'azz2vrsbbhbx', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-06 17:44:57.42964+00', '2025-07-06 18:47:30.093122+00', 'o2hn4srpjmjz', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 127, 'ztb4qsp3mtym', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-06 18:47:30.094971+00', '2025-07-06 20:35:29.052838+00', 'azz2vrsbbhbx', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 128, 'kqp7il3simc3', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-06 20:35:29.053547+00', '2025-07-07 22:08:00.09886+00', 'ztb4qsp3mtym', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 129, 'xsstroilw5ve', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-07 22:08:00.103633+00', '2025-07-07 23:45:47.860164+00', 'kqp7il3simc3', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 130, '7i4tqrxjtpvz', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-07 23:45:47.861539+00', '2025-07-08 09:06:24.555883+00', 'xsstroilw5ve', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 131, 'mww3e5gnpuhh', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-08 09:06:24.557292+00', '2025-07-08 11:40:34.784403+00', '7i4tqrxjtpvz', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 132, 'o3m3xdtznkq7', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-08 11:40:34.786359+00', '2025-07-08 13:39:03.572844+00', 'mww3e5gnpuhh', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 133, 'qvyp77y5fi2q', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-08 13:39:03.57449+00', '2025-07-08 15:40:09.703995+00', 'o3m3xdtznkq7', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 134, '7fyfflulo5li', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-08 15:40:09.705566+00', '2025-07-08 17:32:28.625275+00', 'qvyp77y5fi2q', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 135, 'sr4xsmcesork', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-08 17:32:28.627348+00', '2025-07-08 19:19:08.596982+00', '7fyfflulo5li', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 136, '7hzll3g4so4a', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-08 19:19:08.599008+00', '2025-07-08 20:20:10.011419+00', 'sr4xsmcesork', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 137, 'wevcrrboejpa', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-08 20:20:10.016344+00', '2025-07-09 05:15:06.03967+00', '7hzll3g4so4a', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 138, 'xzxcx5ccjpk4', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-09 05:15:06.040444+00', '2025-07-09 17:40:40.267899+00', 'wevcrrboejpa', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 139, 'e722rd3y4jpk', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-09 17:40:40.268677+00', '2025-07-09 21:00:55.075482+00', 'xzxcx5ccjpk4', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 140, 'ckqzqya4hfcd', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-09 21:00:55.076579+00', '2025-07-09 22:56:36.325052+00', 'e722rd3y4jpk', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 141, 'mpompro5hyn2', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-09 22:56:36.325934+00', '2025-07-10 09:34:26.519791+00', 'ckqzqya4hfcd', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 142, 'thekbjtzicqp', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-10 09:34:26.520501+00', '2025-07-12 22:08:32.632446+00', 'mpompro5hyn2', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 143, 'swm6w3cpeeup', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-12 22:08:32.634549+00', '2025-07-14 11:28:44.307889+00', 'thekbjtzicqp', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 144, 'ozlumrg6xcva', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-14 11:28:44.309486+00', '2025-07-14 14:36:09.929938+00', 'swm6w3cpeeup', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 145, 'lzlj2jvkdke6', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-14 14:36:09.930619+00', '2025-07-14 23:26:02.448977+00', 'ozlumrg6xcva', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 146, '7xjraq5rayqc', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-14 23:26:02.450409+00', '2025-07-15 02:24:30.914319+00', 'lzlj2jvkdke6', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 147, 'hgczh6caud7h', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-15 02:24:30.91493+00', '2025-07-15 21:14:31.048088+00', '7xjraq5rayqc', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 148, 'msyjpau4u2ru', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', true, '2025-07-15 21:14:31.048892+00', '2025-07-17 18:50:52.296348+00', 'hgczh6caud7h', 'd0779d76-25cf-4fea-89ab-da9d874b6e96'),
	('00000000-0000-0000-0000-000000000000', 149, 'ldoovpwl6w5m', 'dcace384-bcbb-43de-b48f-bd82722b6ce0', false, '2025-07-17 18:50:52.299307+00', '2025-07-17 18:50:52.299307+00', 'msyjpau4u2ru', 'd0779d76-25cf-4fea-89ab-da9d874b6e96');


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
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "email", "full_name", "avatar_url", "created_at", "updated_at", "admin") VALUES
	('dcace384-bcbb-43de-b48f-bd82722b6ce0', 'david.benollol@gmail.com', 'David', 'https://lh3.googleusercontent.com/a/ACg8ocJNQhWmftVDfrAYDINBMHf3K5wgtN9bgl-MRtTm5nVS8iMr1aWn=s96-c', '2025-07-01 09:52:25.558166+00', '2025-07-15 01:54:00.941306+00', true);


--
-- Data for Name: characters; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: credit_costs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."credit_costs" ("id", "type", "value", "created_at", "updated_at") VALUES
	(1, 'IMAGE_GENERATION_1K', 1, '2025-07-11 22:06:23.247161+00', '2025-07-11 22:06:23.247161+00'),
	(2, 'IMAGE_GENERATION_2K', 2, '2025-07-11 22:06:23.247161+00', '2025-07-11 22:06:23.247161+00'),
	(3, 'IMAGE_GENERATION_4K', 3, '2025-07-11 22:06:23.247161+00', '2025-07-11 22:06:23.247161+00'),
	(4, 'CHARACTER_TRAINING', 30, '2025-07-11 22:06:23.247161+00', '2025-07-11 22:06:23.247161+00');


--
-- Data for Name: credit_pack_purchases; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: credit_packs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."credit_packs" ("id", "name", "credits", "price", "validity_days", "created_at", "updated_at", "translations") VALUES
	(2, '180 Credits', 180, 32.00, 60, '2025-07-11 22:06:23.247161+00', '2025-07-11 22:06:23.247161+00', '{"de": {"name": "180 Credits", "description": "180 Credits Paket mit 60 Tagen Gültigkeit"}, "en": {"name": "180 Credits", "description": "180 credits pack with 60 days validity"}, "es": {"name": "180 Créditos", "description": "Paquete de 180 créditos con validez de 60 días"}, "fr": {"name": "180 Crédits", "description": "Pack de 180 crédits valable 60 jours"}, "it": {"name": "180 Crediti", "description": "Pacchetto di 180 crediti con validità di 60 giorni"}, "ja": {"name": "180クレジット", "description": "180クレジットパック（有効期限60日）"}, "nl": {"name": "180 Credits", "description": "180 credits pakket geldig voor 60 dagen"}, "pt": {"name": "180 Créditos", "description": "Pacote de 180 créditos com validade de 60 dias"}, "zh": {"name": "180积分", "description": "180积分套餐，有效期60天"}}'),
	(3, '360 Credits', 360, 52.00, 60, '2025-07-11 22:06:23.247161+00', '2025-07-11 22:06:23.247161+00', '{"de": {"name": "360 Credits", "description": "360 Credits Paket mit 60 Tagen Gültigkeit"}, "en": {"name": "360 Credits", "description": "360 credits pack with 60 days validity"}, "es": {"name": "360 Créditos", "description": "Paquete de 360 créditos con validez de 60 días"}, "fr": {"name": "360 Crédits", "description": "Pack de 360 crédits valable 60 jours"}, "it": {"name": "360 Crediti", "description": "Pacchetto di 360 crediti con validità di 60 giorni"}, "ja": {"name": "360クレジット", "description": "360クレジットパック（有効期限60日）"}, "nl": {"name": "360 Credits", "description": "360 credits pakket geldig voor 60 dagen"}, "pt": {"name": "360 Créditos", "description": "Pacote de 360 créditos com validade de 60 dias"}, "zh": {"name": "360积分", "description": "360积分套餐，有效期60天"}}'),
	(1, '90 Credits', 90, 19.00, 60, '2025-07-11 22:06:23.247161+00', '2025-07-11 22:06:23.247161+00', '{"de": {"name": "90 Credits", "description": "90 Credits Paket mit 60 Tagen Gültigkeit"}, "en": {"name": "90 Credits", "description": "90 credits pack with 60 days validity"}, "es": {"name": "90 Créditos", "description": "Paquete de 90 créditos con validez de 60 días"}, "fr": {"name": "90 Crédits", "description": "Pack de 90 crédits valable 60 jours"}, "it": {"name": "90 Crediti", "description": "Pacchetto di 90 crediti con validità di 60 giorni"}, "ja": {"name": "90クレジット", "description": "90クレジットパック（有効期限60日）"}, "nl": {"name": "90 Credits", "description": "90 credits pakket geldig voor 60 dagen"}, "pt": {"name": "90 Créditos", "description": "Pacote de 90 créditos com validade de 60 dias"}, "zh": {"name": "90积分", "description": "90积分套餐，有效期60天"}}');


--
-- Data for Name: credit_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: style_colors; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."style_colors" ("id", "value", "label", "color", "translations", "created_at", "updated_at") VALUES
	('bdcf754e-07ba-4f00-ab4b-69bd7477a5b1', 'black', 'Black', '#000000', '{"de": {"label": "Schwarz"}, "es": {"label": "Negro"}, "fr": {"label": "Noir"}, "it": {"label": "Nero"}, "ja": {"label": "黒"}, "nl": {"label": "Zwart"}, "pt": {"label": "Preto"}, "zh": {"label": "黑色"}}', '2025-08-18 22:36:57.114286+00', '2025-08-18 22:36:57.114286+00'),
	('21040152-db2f-471d-8b8f-b91e5ad64476', 'white', 'White', '#FFFFFF', '{"de": {"label": "Weiß"}, "es": {"label": "Blanco"}, "fr": {"label": "Blanc"}, "it": {"label": "Bianco"}, "ja": {"label": "白"}, "nl": {"label": "Wit"}, "pt": {"label": "Branco"}, "zh": {"label": "白色"}}', '2025-08-18 22:36:57.299593+00', '2025-08-18 22:36:57.299593+00'),
	('7aea4713-6e44-455c-9ea3-da3341ed2ffb', 'green', 'Green', '#2A9D47', '{"de": {"label": "Grün"}, "es": {"label": "Verde"}, "fr": {"label": "Vert"}, "it": {"label": "Verde"}, "ja": {"label": "緑"}, "nl": {"label": "Groen"}, "pt": {"label": "Verde"}, "zh": {"label": "绿色"}}', '2025-08-18 22:36:57.486859+00', '2025-08-18 22:36:57.486859+00'),
	('11b75c05-3a1a-4c8a-a786-9e5ca73c4e44', 'blue', 'Blue', '#3B82F6', '{"de": {"label": "Blau"}, "es": {"label": "Azul"}, "fr": {"label": "Bleu"}, "it": {"label": "Blu"}, "ja": {"label": "青"}, "nl": {"label": "Blauw"}, "pt": {"label": "Azul"}, "zh": {"label": "蓝色"}}', '2025-08-18 22:36:57.673009+00', '2025-08-18 22:36:57.673009+00'),
	('52579814-de4d-4389-b290-c82a7c3b95bd', 'orange', 'Orange', '#FF7F39', '{"de": {"label": "Orange"}, "es": {"label": "Naranja"}, "fr": {"label": "Orange"}, "it": {"label": "Arancione"}, "ja": {"label": "オレンジ"}, "nl": {"label": "Oranje"}, "pt": {"label": "Laranja"}, "zh": {"label": "橙色"}}', '2025-08-18 22:36:57.852715+00', '2025-08-18 22:36:57.852715+00'),
	('b3ab2a27-362e-4e6f-a44a-edc83236d598', 'red', 'Red', '#D22D2D', '{"de": {"label": "Rot"}, "es": {"label": "Rojo"}, "fr": {"label": "Rouge"}, "it": {"label": "Rosso"}, "ja": {"label": "赤"}, "nl": {"label": "Rood"}, "pt": {"label": "Vermelho"}, "zh": {"label": "红色"}}', '2025-08-18 22:36:58.038814+00', '2025-08-18 22:36:58.038814+00'),
	('c8ad01b0-8a62-4e16-af0b-2856cb379e47', 'pink', 'Pink', '#FC84E2', '{"de": {"label": "Pink"}, "es": {"label": "Rosa"}, "fr": {"label": "Rose"}, "it": {"label": "Rosa"}, "ja": {"label": "ピンク"}, "nl": {"label": "Roze"}, "pt": {"label": "Rosa"}, "zh": {"label": "粉色"}}', '2025-08-18 22:36:58.226487+00', '2025-08-18 22:36:58.226487+00'),
	('0800839a-bec2-4393-a168-eb6413f43af5', 'purple', 'Purple', '#A28DF7', '{"de": {"label": "Lila"}, "es": {"label": "Morado"}, "fr": {"label": "Violet"}, "it": {"label": "Viola"}, "ja": {"label": "紫"}, "nl": {"label": "Paars"}, "pt": {"label": "Roxo"}, "zh": {"label": "紫色"}}', '2025-08-18 22:36:58.420542+00', '2025-08-18 22:36:58.420542+00'),
	('55f9ee7b-adac-451e-b95a-4c08cf779639', 'gray', 'Gray', '#6B7280', '{"de": {"label": "Grau"}, "es": {"label": "Gris"}, "fr": {"label": "Gris"}, "it": {"label": "Grigio"}, "ja": {"label": "グレー"}, "nl": {"label": "Grijs"}, "pt": {"label": "Cinza"}, "zh": {"label": "灰色"}}', '2025-08-18 22:36:58.598023+00', '2025-08-18 22:36:58.598023+00'),
	('f884c34a-fec0-4fb7-8e83-5bd3876e3166', 'indigo', 'Indigo', '#4F46E5', '{"de": {"label": "Indigo"}, "es": {"label": "Índigo"}, "fr": {"label": "Indigo"}, "it": {"label": "Indaco"}, "ja": {"label": "インディゴ"}, "nl": {"label": "Indigo"}, "pt": {"label": "Índigo"}, "zh": {"label": "靛蓝"}}', '2025-08-18 22:36:58.792514+00', '2025-08-18 22:36:58.792514+00');


--
-- Data for Name: style_scenes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."style_scenes" ("id", "value", "label", "image", "translations", "created_at", "updated_at", "prompt") VALUES
	('36a141aa-220c-4dc5-ba2d-4d64d65e6fcf', 'neon-pink', 'Neon Pink', 'neon-pink-1.webp', '{"de": {"label": "Neonrosa"}, "es": {"label": "Rosa neón"}, "fr": {"label": "Rose néon"}, "it": {"label": "Rosa neon"}, "ja": {"label": "ネオンピンク"}, "nl": {"label": "Neonroze"}, "pt": {"label": "Rosa neon"}, "zh": {"label": "霓虹粉色"}}', '2025-08-18 19:41:56.120196+00', '2025-08-18 19:41:56.120196+00', 'The background is a perfectly flat, seamless neon pink, evenly lit with no gradients, shadows, or depth—appearing as a smooth paper backdrop'),
	('0d9c9994-128d-4968-9859-3d8ecfd8f773', 'dark-navy', 'Dark Navy', 'dark-navy-1.webp', '{"de": {"label": "Dunkles Marineblau"}, "es": {"label": "Azul marino oscuro"}, "fr": {"label": "Bleu marine foncé"}, "it": {"label": "Blu navy scuro"}, "ja": {"label": "ダークネイビー"}, "nl": {"label": "Donkerblauw"}, "pt": {"label": "Azul marinho escuro"}, "zh": {"label": "深海军蓝"}}', '2025-08-18 19:41:56.317303+00', '2025-08-18 19:41:56.317303+00', 'The background is a perfectly flat, seamless dark navy, evenly lit with no gradients, shadows, or depth—appearing as a smooth paper backdrop');


--
-- Data for Name: style_wardrobes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."style_wardrobes" ("id", "value", "label", "image", "translations", "created_at", "updated_at", "gender", "prompt", "category") VALUES
	('f2201bee-28db-40f6-8e92-ee46de8d3484', 'PROF_M_03', 'Turtleneck with Blazer', 'prof_m_03-1.webp', '{"de": {"label": "Rollkragenpullover mit Blazer"}, "es": {"label": "Cuello alto con blazer"}, "fr": {"label": "Col roulé avec blazer"}, "it": {"label": "Dolcevita con blazer"}, "ja": {"label": "タートルネックとブレザー"}, "nl": {"label": "Coltrui met blazer"}, "pt": {"label": "Gola alta com blazer"}, "zh": {"label": "高领毛衣配西装外套"}}', '2025-08-18 19:41:57.855546+00', '2025-08-18 22:33:29.817683+00', 'man', 'a white fine-gauge merino wool turtleneck layered under a [color] wool blazer, relaxed slim fit for male physique, minimalistic and sophisticated.', 'Professional'),
	('7fecfda0-328d-496e-bafd-01102bd95c0a', 'PROF_M_01', 'Shirt with Suit Jacket', 'prof_m_01-1.webp', '{"de": {"label": "Hemd mit Sakko"}, "es": {"label": "Camisa con chaqueta de traje"}, "fr": {"label": "Chemise avec veste de costume"}, "it": {"label": "Camicia con giacca"}, "ja": {"label": "スーツジャケット付きシャツ"}, "nl": {"label": "Overhemd met colbert"}, "pt": {"label": "Camisa com blazer"}, "zh": {"label": "带西装外套的衬衫"}}', '2025-08-18 19:41:58.123501+00', '2025-08-18 22:33:30.196223+00', 'man', 'a white crisp cotton button-up shirt under a [color] tailored wool suit jacket, slim fit for male physique, notched lapels, single-breasted, professional and polished.', 'Professional'),
	('a2ace4ff-be26-4642-a6d0-da343522ff32', 'PROF_M_02', 'Shirt and Tie with Suit', 'prof_m_02-1.webp', '{"de": {"label": "Hemd und Krawatte mit Anzug"}, "es": {"label": "Camisa y corbata con traje"}, "fr": {"label": "Chemise et cravate avec costume"}, "it": {"label": "Camicia e cravatta con abito"}, "ja": {"label": "スーツにシャツとネクタイ"}, "nl": {"label": "Overhemd en stropdas met pak"}, "pt": {"label": "Camisa e gravata com terno"}, "zh": {"label": "西装衬衫和领带"}}', '2025-08-18 19:41:58.329597+00', '2025-08-18 22:33:30.008501+00', 'man', 'a white oxford cloth shirt paired with a [color] slim silk tie and a three-piece suit, classic fit for male build, subtle texture for depth.', 'Professional');


--
-- Data for Name: styles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."styles" ("name", "preview_images", "available_scenes", "available_wardrobes", "available_colors", "translations", "created_at", "updated_at", "prompt", "id", "lora_path") VALUES
	('Studio', '["studio-1.webp", "studio-2.webp", "studio-3.webp", "studio-1.webp", "studio-2.webp"]', '{plain-light,plain-dark,plain-orange,plain-blue,plain-teal}', '{shirt,polo,henley,jacket,fishermans-jumper}', '{black,white,green,blue,orange,red,pink,purple,gray,indigo}', '{"de": {"name": "Studio"}, "es": {"name": "Estudio"}, "fr": {"name": "Studio"}, "it": {"name": "Studio"}, "ja": {"name": "スタジオ"}, "nl": {"name": "Studio"}, "pt": {"name": "Estúdio"}, "zh": {"name": "工作室风格"}}', '2025-05-03 23:44:34.330977+00', '2025-07-16 23:01:10.023032+00', NULL, '3ae77887-5df2-4982-85d4-d6f88993055f', NULL),
	('Editorial', '["outdoor-fashion-1.webp", "outdoor-fashion-2.webp", "outdoor-fashion-3.webp", "outdoor-fashion-4.webp", "outdoor-fashion-4.webp"]', '{plain-light,plain-dark,plain-orange,plain-blue,plain-teal}', '{hoodie,shirt,polo,henley,jacket,fishermans-jumper}', '{black,white,green,blue,orange,red,pink,purple,gray,indigo}', '{"de": {"name": "Editorial"}, "es": {"name": "Editorial"}, "fr": {"name": "Éditorial"}, "it": {"name": "Editoriale"}, "ja": {"name": "エディトリアル"}, "nl": {"name": "Editorial"}, "pt": {"name": "Editorial"}, "zh": {"name": "杂志风格"}}', '2025-08-08 00:03:05.723427+00', '2025-08-08 00:03:05.723427+00', NULL, 'd4fcdab5-2c19-457e-affb-d83e836759d2', NULL),
	('Studio Pro', '["studio-pro-1.webp"]', '{dark-navy,neon-pink}', '{PROF_M_01,PROF_M_02,PROF_M_03}', '{black,blue,gray,green,indigo,orange,pink,purple,red,white}', '{"de": {"name": "Studio Pro"}, "es": {"name": "Estudio Pro"}, "fr": {"name": "Studio Pro"}, "it": {"name": "Studio Pro"}, "ja": {"name": "スタジオプロ"}, "nl": {"name": "Studio Pro"}, "pt": {"name": "Estúdio Pro"}, "zh": {"name": "摄影棚专业版"}}', '2025-08-18 19:41:55.173018+00', '2025-08-18 22:33:29.379926+00', 'A dark, cinematic studio portrait, the subject is tightly framed from the upper chest, looking directly at the camera and showing a calm, positive and slightly introspective expression. The lighting is very low-key and directional, illuminating only the subject’s left side, while the right side of the face falls into deep shadow. The mood is subdued, minimalistic, and intimate, with strong contrast, defined shadows, and a highly professional editorial style.', '42ec7659-5b7a-4507-9d31-b93b223c69ae', '/data/style_loras/studiopro/loras/wan_lora_20250725_005619.safetensors');


--
-- Data for Name: inference_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: generated_images; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: inference_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."inference_settings" ("key", "value", "updated_at") VALUES
	('qualities', '["1K", "2K", "4K"]', '2025-08-12 13:53:12.839747+00'),
	('quality_labels', '{"1K": "Basic", "2K": "Standard", "4K": "High"}', '2025-08-12 13:53:12.839747+00'),
	('nb_takes_options', '[5, 15, 20]', '2025-08-12 13:53:12.839747+00'),
	('aspect_ratios', '["4:5", "16:9", "1:1", "3:4"]', '2025-08-12 13:53:12.839747+00'),
	('defaults', '{"quality": "1K", "nb_takes": 5, "aspect_ratio": "4:5"}', '2025-08-12 13:53:12.839747+00');


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."subscriptions" ("id", "name", "display_name", "description", "original_price", "monthly_price", "yearly_price", "credits", "max_quality", "character_training_included", "concurrent_jobs", "max_characters", "features", "popular", "created_at", "updated_at", "translations", "concurrent_trainings") VALUES
	(1, 'basic', 'Basic', 'Includes 40 credits per month, plus 1 FaceModel (30 credits value).', 14.00, 9.00, 9.00, 40, '1K', 1, 1, 1, '["40 monthly credits", "Up to 1K Resolution", "1x FaceModel Included", "1 concurrent job", "Up to 1 FaceModel Storage", "Up to 40 images per month"]', false, '2025-07-11 22:06:23.247161+00', '2025-07-11 22:06:23.247161+00', '{"de": {"name": "Basis", "description": "Beinhaltet 40 Credits pro Monat, plus 1 FaceModel (Wert von 30 Credits)."}, "en": {"name": "Basic", "description": "Includes 40 credits per month, plus 1 FaceModel (30 credits value)."}, "es": {"name": "Básico", "description": "Incluye 40 créditos por mes, más 1 FaceModel (valor de 30 créditos)."}, "fr": {"name": "Basique", "description": "Comprend 40 crédits par mois, plus 1 FaceModel (valeur de 30 crédits)."}, "it": {"name": "Base", "description": "Include 40 crediti al mese, più 1 FaceModel (valore di 30 crediti)."}, "ja": {"name": "ベーシック", "description": "月40クレジット、FaceModel1個（30クレジット相当）を含みます。"}, "nl": {"name": "Basis", "description": "Bevat 40 credits per maand, plus 1 FaceModel (waarde van 30 credits)."}, "pt": {"name": "Básico", "description": "Inclui 40 créditos por mês, mais 1 FaceModel (valor de 30 créditos)."}, "zh": {"name": "基础版", "description": "每月包含40个积分，外加1个FaceModel（价值30积分）。"}}', 2),
	(2, 'standard', 'Standard', 'Includes 180 credits per month, plus 1 FaceModel (30 credits value).', 39.00, 29.00, 18.00, 180, '4K', 1, 2, 3, '["180 monthly credits", "Up to 4K Resolution", "1x FaceModel Included", "2 concurrent jobs", "Up to 3 FaceModel Storage", "Up to 180×1K, 90×2K, or 60×4K images per month"]', true, '2025-07-11 22:06:23.247161+00', '2025-07-11 22:06:23.247161+00', '{"de": {"name": "Standard", "description": "Beinhaltet 180 Credits pro Monat, plus 1 FaceModel (Wert von 30 Credits)."}, "en": {"name": "Standard", "description": "Includes 180 credits per month, plus 1 FaceModel (30 credits value)."}, "es": {"name": "Estándar", "description": "Incluye 180 créditos por mes, más 1 FaceModel (valor de 30 créditos)."}, "fr": {"name": "Standard", "description": "Comprend 180 crédits par mois, plus 1 FaceModel (valeur de 30 crédits)."}, "it": {"name": "Standard", "description": "Include 180 crediti al mese, più 1 FaceModel (valore di 30 crediti)."}, "ja": {"name": "スタンダード", "description": "月180クレジット、FaceModel1個（30クレジット相当）を含みます。"}, "nl": {"name": "Standaard", "description": "Bevat 180 credits per maand, plus 1 FaceModel (waarde van 30 credits)."}, "pt": {"name": "Padrão", "description": "Inclui 180 créditos por mês, mais 1 FaceModel (valor de 30 créditos)."}, "zh": {"name": "标准版", "description": "每月包含180个积分，外加1个FaceModel（价值30积分）。"}}', 2),
	(3, 'pro', 'Pro', 'Includes 450 credits per month, plus 3 FaceModel (90 credits value).', 79.00, 59.00, 39.00, 450, '4K', 3, 4, 8, '["450 monthly credits", "Up to 4K Resolution", "3x FaceModel Included", "4 concurrent jobs", "Up to 8 FaceModel Storage", "Up to 450×1K, 225×2K, or 150×4K images per month"]', false, '2025-07-11 22:06:23.247161+00', '2025-07-11 22:06:23.247161+00', '{"de": {"name": "Pro", "description": "Beinhaltet 450 Credits pro Monat, plus 3 FaceModels (Wert von 90 Credits)."}, "en": {"name": "Pro", "description": "Includes 450 credits per month, plus 3 FaceModels (90 credits value)."}, "es": {"name": "Pro", "description": "Incluye 450 créditos por mes, más 3 FaceModels (valor de 90 créditos)."}, "fr": {"name": "Pro", "description": "Comprend 450 crédits par mois, plus 3 FaceModels (valeur de 90 crédits)."}, "it": {"name": "Pro", "description": "Include 450 crediti al mese, più 3 FaceModels (valore di 90 crediti)."}, "ja": {"name": "プロ", "description": "月450クレジット、FaceModel3個（90クレジット相当）を含みます。"}, "nl": {"name": "Pro", "description": "Bevat 450 credits per maand, plus 3 FaceModels (waarde van 90 credits)."}, "pt": {"name": "Pro", "description": "Inclui 450 créditos por mês, mais 3 FaceModels (valor de 90 créditos)."}, "zh": {"name": "专业版", "description": "每月包含450个积分，外加3个FaceModel（价值90积分）。"}}', 2);


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
-- Data for Name: uploaded_images; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_credits; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: waitlist; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."waitlist" ("id", "email", "created_at") VALUES
	(1, 'david.benollol@gmail.com', '2025-07-06 18:47:31.477018+00'),
	(2, 'johndpatton@gmail.com', '2025-07-06 18:48:21.338411+00'),
	(3, 'info@felixclarke.com', '2025-07-06 20:27:58.315076+00'),
	(4, 'persianstallion@gmail.com', '2025-07-06 21:03:31.424637+00'),
	(8, 'vamshigoud105@gmail.com', '2025-07-07 01:32:00.616403+00'),
	(9, 'tanishqmaggo@gmail.com', '2025-07-07 02:40:20.707971+00'),
	(10, 'denisstella@mac.com', '2025-07-07 04:48:08.746084+00'),
	(11, 'kedjohns@gmail.com', '2025-07-07 05:04:00.561383+00'),
	(12, 'pascal.monier16@gmail.com', '2025-07-07 05:39:02.523886+00'),
	(13, 'pat@zerogaps.org', '2025-07-07 09:01:00.564408+00'),
	(14, 'appsikua@gmail.com', '2025-07-07 09:02:34.02489+00'),
	(15, 'jpsear@gmail.com', '2025-07-07 09:34:58.03835+00'),
	(16, 'clarry@hotmail.co.uk', '2025-07-07 09:56:56.719246+00'),
	(17, 'maiconrcf@gmail.com', '2025-07-07 12:27:22.507556+00'),
	(18, 'jherrielsoriano@gmail.com', '2025-07-07 12:52:49.959997+00'),
	(19, 'mansouri.ayoub404@gmail.com', '2025-07-07 13:15:19.689059+00'),
	(20, 'edlavalette@gmail.com', '2025-07-07 13:28:59.610727+00'),
	(21, 'a@imbox.li', '2025-07-07 14:05:09.691743+00'),
	(22, 'vinayak.joshi@gmail.com', '2025-07-07 14:50:09.96793+00'),
	(23, 'dmitrydiez@gmail.com', '2025-07-07 18:28:47.769794+00'),
	(24, 'jonas@courriel.fr.nf', '2025-07-07 18:58:37.944896+00'),
	(25, 'polina.oleksiuk@gmail.com', '2025-07-07 19:24:57.846791+00'),
	(26, 'temp.securebyte@gmail.com', '2025-07-07 20:55:28.675562+00'),
	(27, 'dustin@theblkhse.com', '2025-07-08 03:12:28.50168+00'),
	(28, 'tobytoisfor@protonmail.com', '2025-07-08 13:00:26.665139+00'),
	(29, 'talkaboutstartup@gmail.com', '2025-07-08 13:18:44.772016+00'),
	(30, 'fenxingzi007@163.com', '2025-07-08 13:44:40.283569+00'),
	(31, 'pkhristolubov@gmail.com', '2025-07-08 17:58:11.312012+00'),
	(32, 'vldbbc@gmail.com', '2025-07-08 19:45:11.766179+00'),
	(33, 'criston2011@gmail.com', '2025-07-08 20:21:43.779792+00'),
	(34, 'biz@youdo.blog', '2025-07-09 01:01:21.350075+00'),
	(35, 'bibekboro729@gmail.com', '2025-07-09 02:33:37.010968+00'),
	(36, 'sihyunrr@gmail.com', '2025-07-09 05:40:56.528123+00'),
	(37, 'fzrncic@volum3.com', '2025-07-09 08:10:37.16769+00'),
	(38, 'pewshj2008@gmail.com', '2025-07-09 09:57:48.865911+00'),
	(39, 'jourde@gmail.com', '2025-07-09 10:06:17.176619+00'),
	(40, 'noah@codestory.co', '2025-07-09 17:53:55.253609+00'),
	(41, 'nicholasmenelaou@gmail.com', '2025-07-09 18:09:03.875436+00'),
	(42, 'kazellerton@gmail.com', '2025-07-09 18:32:35.94486+00'),
	(43, 'rysw15@live.co.uk', '2025-07-09 18:32:45.236967+00'),
	(44, 'cve@rise8.nl', '2025-07-09 19:14:17.371816+00'),
	(45, 'chibisamu@gmail.com', '2025-07-09 20:04:46.080403+00'),
	(46, 'nadvornik.lukas@gmail.com', '2025-07-09 21:23:32.14788+00'),
	(47, 'dheeraj@stelleninfotech.com.au', '2025-07-10 12:50:55.187816+00'),
	(48, 'ethcab.work+test2@gmail.com', '2025-07-10 17:19:36.275754+00'),
	(49, 'djbmcdougall@gmail.com', '2025-07-10 23:40:11.80712+00'),
	(50, 'newsletters@hubertquetel.fr', '2025-07-11 13:38:58.56885+00'),
	(51, 'joe@cxoaxis.com', '2025-07-11 19:40:21.309628+00'),
	(52, 'gerben_grat5m@icloud.com', '2025-07-12 01:24:04.098246+00'),
	(53, '4zctemzi@duck.com', '2025-07-12 09:53:46.843995+00'),
	(54, 'slimmoyra@punkproof.com', '2025-07-12 13:50:18.855883+00'),
	(55, 'neil@kitchen-os.com', '2025-07-12 16:58:48.225226+00'),
	(56, 'kelagha@gmail.com', '2025-07-12 23:48:32.891601+00'),
	(57, 'mqbrightside@gmail.com', '2025-07-13 15:24:39.180314+00'),
	(58, 'gorlov35@gmail.com', '2025-07-14 00:34:25.436105+00'),
	(59, 'kati-online@hotmail.com', '2025-07-14 12:04:05.82821+00'),
	(60, 'vahe@mdlogica.com', '2025-07-15 06:18:32.963323+00'),
	(61, 'hamoudiyt2ooo@gmail.com', '2025-07-15 14:34:05.979345+00'),
	(62, 'maxhanafi@gmail.com', '2025-07-16 15:53:07.218447+00'),
	(63, 'cpconsultant3@gmail.com', '2025-07-17 08:00:54.252098+00'),
	(64, 'geo367@mail.ru', '2025-07-18 06:58:41.01657+00'),
	(65, 'ztu38@mail.ru', '2025-07-18 06:59:37.871518+00'),
	(66, 'vladimirdaub3@gmail.com', '2025-07-18 07:22:24.635361+00'),
	(68, 'kisilwww@gmail.com', '2025-07-18 10:27:05.621044+00'),
	(69, 'karoldebkowski@gmail.com', '2025-07-19 00:22:32.041895+00'),
	(70, 'recomenzando2233@gmail.com', '2025-07-19 02:14:33.463682+00'),
	(71, 'sithumsd100@gmail.com', '2025-07-19 05:15:58.405979+00'),
	(72, 'akhilesh.johnson5@gmail.com', '2025-07-19 06:21:47.205779+00'),
	(73, 'tyulkanov.igor@gmail.com', '2025-07-19 12:42:17.143713+00'),
	(74, 'nikitajw0000@gmail.com', '2025-07-22 05:47:56.367065+00'),
	(75, 'kabamba.sandra@gmail.com', '2025-07-23 02:51:10.786236+00'),
	(76, 'briaslaughter.bs@gmail.com', '2025-07-23 19:58:04.127118+00'),
	(77, 'andreaismarketing@gmail.com', '2025-07-24 02:31:38.833673+00'),
	(78, 'gregbparkinson@gmail.com', '2025-07-29 21:28:58.213431+00'),
	(79, 'aakash.xcvi@gmail.com', '2025-07-30 11:43:51.415012+00'),
	(80, 'yesebo9638@misehub.com', '2025-08-01 14:24:58.702026+00'),
	(81, 'rami.batteh@gmail.com', '2025-08-05 00:06:33.616611+00'),
	(82, 'nekatikat@gmail.com', '2025-08-17 21:19:32.68505+00');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



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
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 149, true);


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

SELECT pg_catalog.setval('"public"."waitlist_id_seq"', 82, true);


--
-- PostgreSQL database dump complete
--

RESET ALL;
