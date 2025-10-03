create extension if not exists "pg_net" with schema "public" version '0.19.5';

drop policy "Allow public read access to style_colors" on "public"."style_colors";

drop policy "Allow public read access to style_scenes" on "public"."style_scenes";

drop policy "Allow public read access to style_wardrobes" on "public"."style_wardrobes";

drop policy "Allow insert during signup" on "public"."users";

revoke delete on table "public"."characters" from "anon";

revoke insert on table "public"."characters" from "anon";

revoke references on table "public"."characters" from "anon";

revoke select on table "public"."characters" from "anon";

revoke trigger on table "public"."characters" from "anon";

revoke truncate on table "public"."characters" from "anon";

revoke update on table "public"."characters" from "anon";

revoke delete on table "public"."characters" from "authenticated";

revoke insert on table "public"."characters" from "authenticated";

revoke references on table "public"."characters" from "authenticated";

revoke select on table "public"."characters" from "authenticated";

revoke trigger on table "public"."characters" from "authenticated";

revoke truncate on table "public"."characters" from "authenticated";

revoke update on table "public"."characters" from "authenticated";

revoke delete on table "public"."characters" from "service_role";

revoke insert on table "public"."characters" from "service_role";

revoke references on table "public"."characters" from "service_role";

revoke select on table "public"."characters" from "service_role";

revoke trigger on table "public"."characters" from "service_role";

revoke truncate on table "public"."characters" from "service_role";

revoke update on table "public"."characters" from "service_role";

revoke delete on table "public"."credit_costs" from "anon";

revoke insert on table "public"."credit_costs" from "anon";

revoke references on table "public"."credit_costs" from "anon";

revoke select on table "public"."credit_costs" from "anon";

revoke trigger on table "public"."credit_costs" from "anon";

revoke truncate on table "public"."credit_costs" from "anon";

revoke update on table "public"."credit_costs" from "anon";

revoke delete on table "public"."credit_costs" from "authenticated";

revoke insert on table "public"."credit_costs" from "authenticated";

revoke references on table "public"."credit_costs" from "authenticated";

revoke select on table "public"."credit_costs" from "authenticated";

revoke trigger on table "public"."credit_costs" from "authenticated";

revoke truncate on table "public"."credit_costs" from "authenticated";

revoke update on table "public"."credit_costs" from "authenticated";

revoke delete on table "public"."credit_costs" from "service_role";

revoke insert on table "public"."credit_costs" from "service_role";

revoke references on table "public"."credit_costs" from "service_role";

revoke select on table "public"."credit_costs" from "service_role";

revoke trigger on table "public"."credit_costs" from "service_role";

revoke truncate on table "public"."credit_costs" from "service_role";

revoke update on table "public"."credit_costs" from "service_role";

revoke delete on table "public"."credit_pack_purchases" from "anon";

revoke insert on table "public"."credit_pack_purchases" from "anon";

revoke references on table "public"."credit_pack_purchases" from "anon";

revoke select on table "public"."credit_pack_purchases" from "anon";

revoke trigger on table "public"."credit_pack_purchases" from "anon";

revoke truncate on table "public"."credit_pack_purchases" from "anon";

revoke update on table "public"."credit_pack_purchases" from "anon";

revoke delete on table "public"."credit_pack_purchases" from "authenticated";

revoke insert on table "public"."credit_pack_purchases" from "authenticated";

revoke references on table "public"."credit_pack_purchases" from "authenticated";

revoke select on table "public"."credit_pack_purchases" from "authenticated";

revoke trigger on table "public"."credit_pack_purchases" from "authenticated";

revoke truncate on table "public"."credit_pack_purchases" from "authenticated";

revoke update on table "public"."credit_pack_purchases" from "authenticated";

revoke delete on table "public"."credit_pack_purchases" from "service_role";

revoke insert on table "public"."credit_pack_purchases" from "service_role";

revoke references on table "public"."credit_pack_purchases" from "service_role";

revoke select on table "public"."credit_pack_purchases" from "service_role";

revoke trigger on table "public"."credit_pack_purchases" from "service_role";

revoke truncate on table "public"."credit_pack_purchases" from "service_role";

revoke update on table "public"."credit_pack_purchases" from "service_role";

revoke delete on table "public"."credit_packs" from "anon";

revoke insert on table "public"."credit_packs" from "anon";

revoke references on table "public"."credit_packs" from "anon";

revoke select on table "public"."credit_packs" from "anon";

revoke trigger on table "public"."credit_packs" from "anon";

revoke truncate on table "public"."credit_packs" from "anon";

revoke update on table "public"."credit_packs" from "anon";

revoke delete on table "public"."credit_packs" from "authenticated";

revoke insert on table "public"."credit_packs" from "authenticated";

revoke references on table "public"."credit_packs" from "authenticated";

revoke select on table "public"."credit_packs" from "authenticated";

revoke trigger on table "public"."credit_packs" from "authenticated";

revoke truncate on table "public"."credit_packs" from "authenticated";

revoke update on table "public"."credit_packs" from "authenticated";

revoke delete on table "public"."credit_packs" from "service_role";

revoke insert on table "public"."credit_packs" from "service_role";

revoke references on table "public"."credit_packs" from "service_role";

revoke select on table "public"."credit_packs" from "service_role";

revoke trigger on table "public"."credit_packs" from "service_role";

revoke truncate on table "public"."credit_packs" from "service_role";

revoke update on table "public"."credit_packs" from "service_role";

revoke delete on table "public"."credit_usage" from "anon";

revoke insert on table "public"."credit_usage" from "anon";

revoke references on table "public"."credit_usage" from "anon";

revoke select on table "public"."credit_usage" from "anon";

revoke trigger on table "public"."credit_usage" from "anon";

revoke truncate on table "public"."credit_usage" from "anon";

revoke update on table "public"."credit_usage" from "anon";

revoke delete on table "public"."credit_usage" from "authenticated";

revoke insert on table "public"."credit_usage" from "authenticated";

revoke references on table "public"."credit_usage" from "authenticated";

revoke select on table "public"."credit_usage" from "authenticated";

revoke trigger on table "public"."credit_usage" from "authenticated";

revoke truncate on table "public"."credit_usage" from "authenticated";

revoke update on table "public"."credit_usage" from "authenticated";

revoke delete on table "public"."credit_usage" from "service_role";

revoke insert on table "public"."credit_usage" from "service_role";

revoke references on table "public"."credit_usage" from "service_role";

revoke select on table "public"."credit_usage" from "service_role";

revoke trigger on table "public"."credit_usage" from "service_role";

revoke truncate on table "public"."credit_usage" from "service_role";

revoke update on table "public"."credit_usage" from "service_role";

revoke delete on table "public"."generated_images" from "anon";

revoke insert on table "public"."generated_images" from "anon";

revoke references on table "public"."generated_images" from "anon";

revoke select on table "public"."generated_images" from "anon";

revoke trigger on table "public"."generated_images" from "anon";

revoke truncate on table "public"."generated_images" from "anon";

revoke update on table "public"."generated_images" from "anon";

revoke delete on table "public"."generated_images" from "authenticated";

revoke insert on table "public"."generated_images" from "authenticated";

revoke references on table "public"."generated_images" from "authenticated";

revoke select on table "public"."generated_images" from "authenticated";

revoke trigger on table "public"."generated_images" from "authenticated";

revoke truncate on table "public"."generated_images" from "authenticated";

revoke update on table "public"."generated_images" from "authenticated";

revoke delete on table "public"."generated_images" from "service_role";

revoke insert on table "public"."generated_images" from "service_role";

revoke references on table "public"."generated_images" from "service_role";

revoke select on table "public"."generated_images" from "service_role";

revoke trigger on table "public"."generated_images" from "service_role";

revoke truncate on table "public"."generated_images" from "service_role";

revoke update on table "public"."generated_images" from "service_role";

revoke delete on table "public"."inference_jobs" from "anon";

revoke insert on table "public"."inference_jobs" from "anon";

revoke references on table "public"."inference_jobs" from "anon";

revoke select on table "public"."inference_jobs" from "anon";

revoke trigger on table "public"."inference_jobs" from "anon";

revoke truncate on table "public"."inference_jobs" from "anon";

revoke update on table "public"."inference_jobs" from "anon";

revoke delete on table "public"."inference_jobs" from "authenticated";

revoke insert on table "public"."inference_jobs" from "authenticated";

revoke references on table "public"."inference_jobs" from "authenticated";

revoke select on table "public"."inference_jobs" from "authenticated";

revoke trigger on table "public"."inference_jobs" from "authenticated";

revoke truncate on table "public"."inference_jobs" from "authenticated";

revoke update on table "public"."inference_jobs" from "authenticated";

revoke delete on table "public"."inference_jobs" from "service_role";

revoke insert on table "public"."inference_jobs" from "service_role";

revoke references on table "public"."inference_jobs" from "service_role";

revoke select on table "public"."inference_jobs" from "service_role";

revoke trigger on table "public"."inference_jobs" from "service_role";

revoke truncate on table "public"."inference_jobs" from "service_role";

revoke update on table "public"."inference_jobs" from "service_role";

revoke delete on table "public"."inference_settings" from "anon";

revoke insert on table "public"."inference_settings" from "anon";

revoke references on table "public"."inference_settings" from "anon";

revoke select on table "public"."inference_settings" from "anon";

revoke trigger on table "public"."inference_settings" from "anon";

revoke truncate on table "public"."inference_settings" from "anon";

revoke update on table "public"."inference_settings" from "anon";

revoke delete on table "public"."inference_settings" from "authenticated";

revoke insert on table "public"."inference_settings" from "authenticated";

revoke references on table "public"."inference_settings" from "authenticated";

revoke select on table "public"."inference_settings" from "authenticated";

revoke trigger on table "public"."inference_settings" from "authenticated";

revoke truncate on table "public"."inference_settings" from "authenticated";

revoke update on table "public"."inference_settings" from "authenticated";

revoke delete on table "public"."inference_settings" from "service_role";

revoke insert on table "public"."inference_settings" from "service_role";

revoke references on table "public"."inference_settings" from "service_role";

revoke select on table "public"."inference_settings" from "service_role";

revoke trigger on table "public"."inference_settings" from "service_role";

revoke truncate on table "public"."inference_settings" from "service_role";

revoke update on table "public"."inference_settings" from "service_role";

revoke delete on table "public"."sessions" from "anon";

revoke insert on table "public"."sessions" from "anon";

revoke references on table "public"."sessions" from "anon";

revoke select on table "public"."sessions" from "anon";

revoke trigger on table "public"."sessions" from "anon";

revoke truncate on table "public"."sessions" from "anon";

revoke update on table "public"."sessions" from "anon";

revoke delete on table "public"."sessions" from "authenticated";

revoke insert on table "public"."sessions" from "authenticated";

revoke references on table "public"."sessions" from "authenticated";

revoke select on table "public"."sessions" from "authenticated";

revoke trigger on table "public"."sessions" from "authenticated";

revoke truncate on table "public"."sessions" from "authenticated";

revoke update on table "public"."sessions" from "authenticated";

revoke delete on table "public"."sessions" from "service_role";

revoke insert on table "public"."sessions" from "service_role";

revoke references on table "public"."sessions" from "service_role";

revoke select on table "public"."sessions" from "service_role";

revoke trigger on table "public"."sessions" from "service_role";

revoke truncate on table "public"."sessions" from "service_role";

revoke update on table "public"."sessions" from "service_role";

revoke delete on table "public"."style_colors" from "anon";

revoke insert on table "public"."style_colors" from "anon";

revoke references on table "public"."style_colors" from "anon";

revoke select on table "public"."style_colors" from "anon";

revoke trigger on table "public"."style_colors" from "anon";

revoke truncate on table "public"."style_colors" from "anon";

revoke update on table "public"."style_colors" from "anon";

revoke delete on table "public"."style_colors" from "authenticated";

revoke insert on table "public"."style_colors" from "authenticated";

revoke references on table "public"."style_colors" from "authenticated";

revoke select on table "public"."style_colors" from "authenticated";

revoke trigger on table "public"."style_colors" from "authenticated";

revoke truncate on table "public"."style_colors" from "authenticated";

revoke update on table "public"."style_colors" from "authenticated";

revoke delete on table "public"."style_colors" from "service_role";

revoke insert on table "public"."style_colors" from "service_role";

revoke references on table "public"."style_colors" from "service_role";

revoke select on table "public"."style_colors" from "service_role";

revoke trigger on table "public"."style_colors" from "service_role";

revoke truncate on table "public"."style_colors" from "service_role";

revoke update on table "public"."style_colors" from "service_role";

revoke delete on table "public"."style_scenes" from "anon";

revoke insert on table "public"."style_scenes" from "anon";

revoke references on table "public"."style_scenes" from "anon";

revoke select on table "public"."style_scenes" from "anon";

revoke trigger on table "public"."style_scenes" from "anon";

revoke truncate on table "public"."style_scenes" from "anon";

revoke update on table "public"."style_scenes" from "anon";

revoke delete on table "public"."style_scenes" from "authenticated";

revoke insert on table "public"."style_scenes" from "authenticated";

revoke references on table "public"."style_scenes" from "authenticated";

revoke select on table "public"."style_scenes" from "authenticated";

revoke trigger on table "public"."style_scenes" from "authenticated";

revoke truncate on table "public"."style_scenes" from "authenticated";

revoke update on table "public"."style_scenes" from "authenticated";

revoke delete on table "public"."style_scenes" from "service_role";

revoke insert on table "public"."style_scenes" from "service_role";

revoke references on table "public"."style_scenes" from "service_role";

revoke select on table "public"."style_scenes" from "service_role";

revoke trigger on table "public"."style_scenes" from "service_role";

revoke truncate on table "public"."style_scenes" from "service_role";

revoke update on table "public"."style_scenes" from "service_role";

revoke delete on table "public"."style_wardrobes" from "anon";

revoke insert on table "public"."style_wardrobes" from "anon";

revoke references on table "public"."style_wardrobes" from "anon";

revoke select on table "public"."style_wardrobes" from "anon";

revoke trigger on table "public"."style_wardrobes" from "anon";

revoke truncate on table "public"."style_wardrobes" from "anon";

revoke update on table "public"."style_wardrobes" from "anon";

revoke delete on table "public"."style_wardrobes" from "authenticated";

revoke insert on table "public"."style_wardrobes" from "authenticated";

revoke references on table "public"."style_wardrobes" from "authenticated";

revoke select on table "public"."style_wardrobes" from "authenticated";

revoke trigger on table "public"."style_wardrobes" from "authenticated";

revoke truncate on table "public"."style_wardrobes" from "authenticated";

revoke update on table "public"."style_wardrobes" from "authenticated";

revoke delete on table "public"."style_wardrobes" from "service_role";

revoke insert on table "public"."style_wardrobes" from "service_role";

revoke references on table "public"."style_wardrobes" from "service_role";

revoke select on table "public"."style_wardrobes" from "service_role";

revoke trigger on table "public"."style_wardrobes" from "service_role";

revoke truncate on table "public"."style_wardrobes" from "service_role";

revoke update on table "public"."style_wardrobes" from "service_role";

revoke delete on table "public"."styles" from "anon";

revoke insert on table "public"."styles" from "anon";

revoke references on table "public"."styles" from "anon";

revoke select on table "public"."styles" from "anon";

revoke trigger on table "public"."styles" from "anon";

revoke truncate on table "public"."styles" from "anon";

revoke update on table "public"."styles" from "anon";

revoke delete on table "public"."styles" from "authenticated";

revoke insert on table "public"."styles" from "authenticated";

revoke references on table "public"."styles" from "authenticated";

revoke select on table "public"."styles" from "authenticated";

revoke trigger on table "public"."styles" from "authenticated";

revoke truncate on table "public"."styles" from "authenticated";

revoke update on table "public"."styles" from "authenticated";

revoke delete on table "public"."styles" from "service_role";

revoke insert on table "public"."styles" from "service_role";

revoke references on table "public"."styles" from "service_role";

revoke select on table "public"."styles" from "service_role";

revoke trigger on table "public"."styles" from "service_role";

revoke truncate on table "public"."styles" from "service_role";

revoke update on table "public"."styles" from "service_role";

revoke delete on table "public"."subscriptions" from "anon";

revoke insert on table "public"."subscriptions" from "anon";

revoke references on table "public"."subscriptions" from "anon";

revoke select on table "public"."subscriptions" from "anon";

revoke trigger on table "public"."subscriptions" from "anon";

revoke truncate on table "public"."subscriptions" from "anon";

revoke update on table "public"."subscriptions" from "anon";

revoke delete on table "public"."subscriptions" from "authenticated";

revoke insert on table "public"."subscriptions" from "authenticated";

revoke references on table "public"."subscriptions" from "authenticated";

revoke select on table "public"."subscriptions" from "authenticated";

revoke trigger on table "public"."subscriptions" from "authenticated";

revoke truncate on table "public"."subscriptions" from "authenticated";

revoke update on table "public"."subscriptions" from "authenticated";

revoke delete on table "public"."subscriptions" from "service_role";

revoke insert on table "public"."subscriptions" from "service_role";

revoke references on table "public"."subscriptions" from "service_role";

revoke select on table "public"."subscriptions" from "service_role";

revoke trigger on table "public"."subscriptions" from "service_role";

revoke truncate on table "public"."subscriptions" from "service_role";

revoke update on table "public"."subscriptions" from "service_role";

revoke delete on table "public"."training_jobs" from "anon";

revoke insert on table "public"."training_jobs" from "anon";

revoke references on table "public"."training_jobs" from "anon";

revoke select on table "public"."training_jobs" from "anon";

revoke trigger on table "public"."training_jobs" from "anon";

revoke truncate on table "public"."training_jobs" from "anon";

revoke update on table "public"."training_jobs" from "anon";

revoke delete on table "public"."training_jobs" from "authenticated";

revoke insert on table "public"."training_jobs" from "authenticated";

revoke references on table "public"."training_jobs" from "authenticated";

revoke select on table "public"."training_jobs" from "authenticated";

revoke trigger on table "public"."training_jobs" from "authenticated";

revoke truncate on table "public"."training_jobs" from "authenticated";

revoke update on table "public"."training_jobs" from "authenticated";

revoke delete on table "public"."training_jobs" from "service_role";

revoke insert on table "public"."training_jobs" from "service_role";

revoke references on table "public"."training_jobs" from "service_role";

revoke select on table "public"."training_jobs" from "service_role";

revoke trigger on table "public"."training_jobs" from "service_role";

revoke truncate on table "public"."training_jobs" from "service_role";

revoke update on table "public"."training_jobs" from "service_role";

revoke delete on table "public"."uploaded_images" from "anon";

revoke insert on table "public"."uploaded_images" from "anon";

revoke references on table "public"."uploaded_images" from "anon";

revoke select on table "public"."uploaded_images" from "anon";

revoke trigger on table "public"."uploaded_images" from "anon";

revoke truncate on table "public"."uploaded_images" from "anon";

revoke update on table "public"."uploaded_images" from "anon";

revoke delete on table "public"."uploaded_images" from "authenticated";

revoke insert on table "public"."uploaded_images" from "authenticated";

revoke references on table "public"."uploaded_images" from "authenticated";

revoke select on table "public"."uploaded_images" from "authenticated";

revoke trigger on table "public"."uploaded_images" from "authenticated";

revoke truncate on table "public"."uploaded_images" from "authenticated";

revoke update on table "public"."uploaded_images" from "authenticated";

revoke delete on table "public"."uploaded_images" from "service_role";

revoke insert on table "public"."uploaded_images" from "service_role";

revoke references on table "public"."uploaded_images" from "service_role";

revoke select on table "public"."uploaded_images" from "service_role";

revoke trigger on table "public"."uploaded_images" from "service_role";

revoke truncate on table "public"."uploaded_images" from "service_role";

revoke update on table "public"."uploaded_images" from "service_role";

revoke delete on table "public"."user_credits" from "anon";

revoke insert on table "public"."user_credits" from "anon";

revoke references on table "public"."user_credits" from "anon";

revoke select on table "public"."user_credits" from "anon";

revoke trigger on table "public"."user_credits" from "anon";

revoke truncate on table "public"."user_credits" from "anon";

revoke update on table "public"."user_credits" from "anon";

revoke delete on table "public"."user_credits" from "authenticated";

revoke insert on table "public"."user_credits" from "authenticated";

revoke references on table "public"."user_credits" from "authenticated";

revoke select on table "public"."user_credits" from "authenticated";

revoke trigger on table "public"."user_credits" from "authenticated";

revoke truncate on table "public"."user_credits" from "authenticated";

revoke update on table "public"."user_credits" from "authenticated";

revoke delete on table "public"."user_credits" from "service_role";

revoke insert on table "public"."user_credits" from "service_role";

revoke references on table "public"."user_credits" from "service_role";

revoke select on table "public"."user_credits" from "service_role";

revoke trigger on table "public"."user_credits" from "service_role";

revoke truncate on table "public"."user_credits" from "service_role";

revoke update on table "public"."user_credits" from "service_role";

revoke delete on table "public"."user_settings" from "anon";

revoke insert on table "public"."user_settings" from "anon";

revoke references on table "public"."user_settings" from "anon";

revoke select on table "public"."user_settings" from "anon";

revoke trigger on table "public"."user_settings" from "anon";

revoke truncate on table "public"."user_settings" from "anon";

revoke update on table "public"."user_settings" from "anon";

revoke delete on table "public"."user_settings" from "authenticated";

revoke insert on table "public"."user_settings" from "authenticated";

revoke references on table "public"."user_settings" from "authenticated";

revoke select on table "public"."user_settings" from "authenticated";

revoke trigger on table "public"."user_settings" from "authenticated";

revoke truncate on table "public"."user_settings" from "authenticated";

revoke update on table "public"."user_settings" from "authenticated";

revoke delete on table "public"."user_settings" from "service_role";

revoke insert on table "public"."user_settings" from "service_role";

revoke references on table "public"."user_settings" from "service_role";

revoke select on table "public"."user_settings" from "service_role";

revoke trigger on table "public"."user_settings" from "service_role";

revoke truncate on table "public"."user_settings" from "service_role";

revoke update on table "public"."user_settings" from "service_role";

revoke delete on table "public"."user_subscriptions" from "anon";

revoke insert on table "public"."user_subscriptions" from "anon";

revoke references on table "public"."user_subscriptions" from "anon";

revoke select on table "public"."user_subscriptions" from "anon";

revoke trigger on table "public"."user_subscriptions" from "anon";

revoke truncate on table "public"."user_subscriptions" from "anon";

revoke update on table "public"."user_subscriptions" from "anon";

revoke delete on table "public"."user_subscriptions" from "authenticated";

revoke insert on table "public"."user_subscriptions" from "authenticated";

revoke references on table "public"."user_subscriptions" from "authenticated";

revoke select on table "public"."user_subscriptions" from "authenticated";

revoke trigger on table "public"."user_subscriptions" from "authenticated";

revoke truncate on table "public"."user_subscriptions" from "authenticated";

revoke update on table "public"."user_subscriptions" from "authenticated";

revoke delete on table "public"."user_subscriptions" from "service_role";

revoke insert on table "public"."user_subscriptions" from "service_role";

revoke references on table "public"."user_subscriptions" from "service_role";

revoke select on table "public"."user_subscriptions" from "service_role";

revoke trigger on table "public"."user_subscriptions" from "service_role";

revoke truncate on table "public"."user_subscriptions" from "service_role";

revoke update on table "public"."user_subscriptions" from "service_role";

revoke delete on table "public"."users" from "anon";

revoke insert on table "public"."users" from "anon";

revoke references on table "public"."users" from "anon";

revoke select on table "public"."users" from "anon";

revoke trigger on table "public"."users" from "anon";

revoke truncate on table "public"."users" from "anon";

revoke update on table "public"."users" from "anon";

revoke delete on table "public"."users" from "authenticated";

revoke insert on table "public"."users" from "authenticated";

revoke references on table "public"."users" from "authenticated";

revoke select on table "public"."users" from "authenticated";

revoke trigger on table "public"."users" from "authenticated";

revoke truncate on table "public"."users" from "authenticated";

revoke update on table "public"."users" from "authenticated";

revoke delete on table "public"."users" from "service_role";

revoke insert on table "public"."users" from "service_role";

revoke references on table "public"."users" from "service_role";

revoke select on table "public"."users" from "service_role";

revoke trigger on table "public"."users" from "service_role";

revoke truncate on table "public"."users" from "service_role";

revoke update on table "public"."users" from "service_role";

revoke delete on table "public"."waitlist" from "anon";

revoke insert on table "public"."waitlist" from "anon";

revoke references on table "public"."waitlist" from "anon";

revoke select on table "public"."waitlist" from "anon";

revoke trigger on table "public"."waitlist" from "anon";

revoke truncate on table "public"."waitlist" from "anon";

revoke update on table "public"."waitlist" from "anon";

revoke delete on table "public"."waitlist" from "authenticated";

revoke insert on table "public"."waitlist" from "authenticated";

revoke references on table "public"."waitlist" from "authenticated";

revoke select on table "public"."waitlist" from "authenticated";

revoke trigger on table "public"."waitlist" from "authenticated";

revoke truncate on table "public"."waitlist" from "authenticated";

revoke update on table "public"."waitlist" from "authenticated";

revoke delete on table "public"."waitlist" from "service_role";

revoke insert on table "public"."waitlist" from "service_role";

revoke references on table "public"."waitlist" from "service_role";

revoke select on table "public"."waitlist" from "service_role";

revoke trigger on table "public"."waitlist" from "service_role";

revoke truncate on table "public"."waitlist" from "service_role";

revoke update on table "public"."waitlist" from "service_role";

alter table "public"."generated_images" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."sessions" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."uploaded_images" alter column "id" set default extensions.uuid_generate_v4();

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.array_distinct(arr anyarray)
 RETURNS anyarray
 LANGUAGE plpgsql
 IMMUTABLE PARALLEL SAFE
AS $function$
BEGIN
    RETURN (
        WITH flow_order AS (
            SELECT stage, ordering
            FROM (VALUES
                ('shoot', 1),
                ('payment', 2),
                ('upload', 3),
                ('review', 4),
                ('albums', 5)
            ) AS t(stage, ordering)
        )
        SELECT array_agg(DISTINCT elem ORDER BY 
            COALESCE((SELECT ordering FROM flow_order WHERE stage = elem::text), 999)
        )
        FROM unnest(arr) AS elem
        WHERE elem IS NOT NULL
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.array_distinct(arr text[])
 RETURNS text[]
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN ARRAY(SELECT DISTINCT unnest(arr));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.award_subscription_credits(p_user_id uuid, p_subscription_id text, p_credits integer, p_expires_at timestamp with time zone, p_period_start timestamp with time zone, p_period_end timestamp with time zone, p_description text, p_metadata jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Update subscription periods atomically
  UPDATE user_subscriptions 
  SET 
    current_period_start = p_period_start,
    current_period_end = p_period_end,
    updated_at = now()
  WHERE stripe_subscription_id = p_subscription_id;
  
  -- Verify the update affected exactly one row
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;
  
  -- Award credits atomically in same transaction
  INSERT INTO user_credits (
    user_id, credits, transaction_type, source_type, 
    source_id, expires_at, description, metadata
  ) VALUES (
    p_user_id, p_credits, 'earned', 'subscription',
    p_subscription_id, p_expires_at, p_description, p_metadata
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_user_credit_balance(user_uuid uuid)
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  select coalesce(
    sum(
      case
        when transaction_type = 'earned' then credits
        when transaction_type = 'spent'  then -credits
        when transaction_type = 'expired' then 0
        else 0
      end
    ), 0)
  from public.user_credits
  where user_id = user_uuid
    and (expires_at is null or expires_at > now());
$function$
;

CREATE OR REPLACE FUNCTION public.claim_next_queued_inference_job()
 RETURNS inference_jobs
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_job public.inference_jobs%rowtype;
BEGIN
  WITH heads AS (
    SELECT * FROM (
      SELECT j.*, ROW_NUMBER() OVER (PARTITION BY j.user_id ORDER BY j.created_at) AS rn
      FROM public.inference_jobs j
      WHERE j.status = 'queued'
        AND (j.retry_after IS NULL OR j.retry_after <= now())
    ) t WHERE rn = 1
  ), eligible AS (
    SELECT h.*
    FROM heads h
    JOIN public.user_subscriptions us ON us.user_id = h.user_id AND us.status = 'active'
    JOIN public.subscriptions s ON s.name = us.plan_name
    LEFT JOIN (
      SELECT user_id, COUNT(1) AS active
      FROM public.inference_jobs
      WHERE status IN ('initializing','pending','running')
      GROUP BY user_id
    ) a ON a.user_id = h.user_id
    WHERE COALESCE(a.active, 0) < COALESCE(s.concurrent_jobs, 1)
  )
  SELECT * INTO v_job FROM eligible
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE public.inference_jobs
  SET status = 'initializing', updated_at = now()
  WHERE id = v_job.id
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.claim_next_queued_training_job()
 RETURNS training_jobs
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_job public.training_jobs%rowtype;
BEGIN
  WITH heads AS (
    SELECT * FROM (
      SELECT j.*, ROW_NUMBER() OVER (PARTITION BY j.user_id ORDER BY j.created_at) AS rn
      FROM public.training_jobs j
      WHERE j.status = 'queued'
        AND (j.retry_after IS NULL OR j.retry_after <= now())
    ) t WHERE rn = 1
  ), eligible AS (
    SELECT h.*
    FROM heads h
    JOIN public.user_subscriptions us ON us.user_id = h.user_id AND us.status = 'active'
    JOIN public.subscriptions s ON s.name = us.plan_name
    LEFT JOIN (
      SELECT user_id, COUNT(1) AS active
      FROM public.training_jobs
      WHERE status IN ('initializing','pending','running')
      GROUP BY user_id
    ) a ON a.user_id = h.user_id
    WHERE COALESCE(a.active, 0) < COALESCE(s.concurrent_trainings, 1)
  )
  SELECT * INTO v_job FROM eligible
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE public.training_jobs
  SET status = 'initializing', updated_at = now()
  WHERE id = v_job.id
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_stuck_inference_jobs()
 RETURNS TABLE(job_id uuid, user_id uuid, status text, stuck_duration interval, action_taken text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  timeout_minutes integer := 15; -- 15 minutes timeout
  stuck_job record;
  refund_amount integer;
BEGIN
  -- Find jobs that have been running for more than timeout_minutes
  FOR stuck_job IN
    SELECT 
      ij.id,
      ij.user_id,
      ij.status,
      ij.updated_at,
      ij.credits_spent,
      (now() - ij.updated_at) as stuck_duration
    FROM public.inference_jobs ij
    WHERE ij.status = 'running'
      AND ij.updated_at < (now() - interval '1 minute' * timeout_minutes)
  LOOP
    -- Mark job as failed
    UPDATE public.inference_jobs 
    SET 
      status = 'failed',
      error_message = 'Job timed out after ' || timeout_minutes || ' minutes',
      updated_at = now()
    WHERE id = stuck_job.id;
    
    -- Refund credits if any were spent
    IF stuck_job.credits_spent > 0 THEN
      INSERT INTO public.user_credits (
        user_id,
        credits,
        transaction_type,
        description,
        created_at
      ) VALUES (
        stuck_job.user_id,
        stuck_job.credits_spent,
        'earned',
        'Refund: inference job timed out (job_id: ' || stuck_job.id || ')',
        now()
      );
      refund_amount := stuck_job.credits_spent;
    ELSE
      refund_amount := 0;
    END IF;
    
    -- Return info about what was done
    RETURN QUERY SELECT 
      stuck_job.id,
      stuck_job.user_id,
      stuck_job.status,
      stuck_job.stuck_duration,
      CASE 
        WHEN refund_amount > 0 THEN 'Failed job and refunded ' || refund_amount || ' credits'
        ELSE 'Failed job (no credits to refund)'
      END;
  END LOOP;
  
  RETURN;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.expire_credit_pack_credits()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE user_credits 
    SET credits = 0,
        transaction_type = 'expired'
    WHERE source_type = 'credit_pack'
        AND expires_at <= NOW()
        AND credits > 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.expire_credits()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Mark expired credits
    UPDATE user_credits 
    SET credits = 0,
        transaction_type = 'expired',
        updated_at = NOW()
    WHERE expires_at <= NOW()
      AND credits > 0
      AND transaction_type != 'expired';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.expire_subscription_credits()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Mark subscription credits as expired when subscription period ends
    UPDATE user_credits 
    SET credits = 0,
        transaction_type = 'expired'
    WHERE source_type = 'subscription'
        AND expires_at <= NOW()
        AND credits > 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.force_cleanup_upload_session(session_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- First delete chunks (explicit deletion before session)
  DELETE FROM public.upload_chunks WHERE upload_chunks.session_id = force_cleanup_upload_session.session_id;
  
  -- Then delete the session
  DELETE FROM public.upload_sessions WHERE id = force_cleanup_upload_session.session_id;
  
  -- Log the cleanup
  RAISE NOTICE 'Force cleaned up upload session: %', session_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_style_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Generate a style ID in format: style_<timestamp>_<random>
  NEW.id := 'style_' || 
            TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDDHH24MISS') || 
            '_' || 
            SUBSTR(MD5(RANDOM()::TEXT), 1, 6);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_active_training_jobs()
 RETURNS TABLE(id uuid, character_id uuid, user_id uuid, status text, created_at timestamp with time zone, updated_at timestamp with time zone, modal_job_id text, retry_after timestamp with time zone, retry_count integer)
 LANGUAGE sql
 STABLE
AS $function$
  select distinct on (tj.character_id)
    tj.id,
    tj.character_id,
    tj.user_id,
    tj.status,
    tj.created_at,
    tj.updated_at,
    tj.modal_job_id,
    tj.retry_after,
    tj.retry_count
  from public.training_jobs tj
  where tj.user_id = auth.uid()
    and tj.status in ('initializing','queued','pending','running')
  order by tj.character_id, tj.created_at desc;
$function$
;

CREATE OR REPLACE FUNCTION public.get_language_preference()
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    lang VARCHAR;
BEGIN
    SELECT preferred_language INTO lang
    FROM public.user_language_preferences
    WHERE user_id = auth.uid();
    
    -- Return NULL if no preference is set, allowing i18next to use its default
    RETURN lang;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_pricing_last_updated()
 RETURNS text
 LANGUAGE sql
AS $function$
  with t as (
    select greatest(
      coalesce((select max(updated_at) from subscriptions), 'epoch'::timestamptz),
      coalesce((select max(updated_at) from credit_costs), 'epoch'::timestamptz),
      coalesce((select max(updated_at) from inference_settings), 'epoch'::timestamptz)
    ) as ts
  )
  select to_char(ts, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') from t;
$function$
;

CREATE OR REPLACE FUNCTION public.get_revenue_data(start_date timestamp with time zone, end_date timestamp with time zone)
 RETURNS TABLE(subscription_revenue numeric, credit_pack_revenue numeric, refund_amount numeric)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT 
    COALESCE(
      (SELECT SUM(
        CASE 
          WHEN s.monthly_price IS NOT NULL THEN s.monthly_price * 100
          ELSE 0
        END
      )
      FROM public.user_subscriptions us
      JOIN public.subscriptions s ON us.plan_name = s.name
      WHERE us.status = 'active' 
      AND us.created_at >= start_date 
      AND us.created_at <= end_date), 0
    ) as subscription_revenue,
    
    COALESCE(
      (SELECT SUM(amount_paid)
      FROM public.credit_pack_purchases
      WHERE status = 'completed'
      AND created_at >= start_date 
      AND created_at <= end_date), 0
    ) as credit_pack_revenue,
    
    COALESCE(
      (SELECT SUM(ABS(credits) * 100)
      FROM public.user_credits
      WHERE transaction_type = 'refunded'
      AND created_at >= start_date 
      AND created_at <= end_date), 0
    ) as refund_amount;
$function$
;

CREATE OR REPLACE FUNCTION public.get_top_users_by_generations(limit_count integer DEFAULT 10)
 RETURNS TABLE(id uuid, email text, full_name text, avatar_url text, generation_count bigint, training_count bigint, subscription_plan text)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.avatar_url,
    COUNT(DISTINCT ij.id) as generation_count,
    COUNT(DISTINCT tj.id) as training_count,
    us.plan_name as subscription_plan
  FROM public.users u
  LEFT JOIN public.inference_jobs ij ON u.id = ij.user_id
  LEFT JOIN public.training_jobs tj ON u.id = tj.user_id
  LEFT JOIN public.user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
  GROUP BY u.id, u.email, u.full_name, u.avatar_url, us.plan_name
  ORDER BY generation_count DESC, training_count DESC
  LIMIT limit_count;
$function$
;

CREATE OR REPLACE FUNCTION public.get_uploaded_image_counts(character_ids uuid[])
 RETURNS TABLE(character_id uuid, uploaded_count integer)
 LANGUAGE sql
 STABLE
AS $function$
  select ui.character_id, count(*)::int as uploaded_count
  from public.uploaded_images ui
  join public.characters c on c.id = ui.character_id
  where ui.character_id = any(character_ids)
    and c.user_id = auth.uid()
  group by ui.character_id
  order by ui.character_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_available_credits(user_uuid uuid)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    available_credits INTEGER := 0;
BEGIN
    SELECT COALESCE(SUM(CASE WHEN transaction_type = 'earned' THEN credits ELSE -credits END), 0) INTO available_credits
    FROM user_credits
    WHERE user_id = user_uuid
        AND transaction_type IN ('earned', 'spent')
        AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN GREATEST(available_credits, 0);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_credit_balance(user_uuid uuid)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    balance INTEGER;
BEGIN
    SELECT COALESCE(
        SUM(
            CASE 
                WHEN transaction_type = 'earned' THEN credits
                WHEN transaction_type = 'spent' THEN -credits  -- Apply negative for spent credits
                ELSE 0
            END
        ), 0
    )
    INTO balance
    FROM user_credits
    WHERE user_id = user_uuid
      AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN GREATEST(balance, 0);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_language()
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  lang varchar;
begin
  select us.preferred_language into lang
  from public.user_settings us
  where us.user_id = auth.uid();

  return lang;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  _full_name text;
  _avatar_url text;
  _preferred_language text;
begin
  -- Extract metadata
  _full_name := coalesce(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    nullif(concat(
      coalesce(NEW.raw_user_meta_data->>'given_name',''),
      ' ',
      coalesce(NEW.raw_user_meta_data->>'family_name','')
    ), ' '),
    NEW.raw_user_meta_data->>'user_name'
  );

  _avatar_url := coalesce(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- Insert into public.users (idempotent on trigger redeploy)
  insert into public.users (
    id, email, full_name, avatar_url, created_at, updated_at
  ) values (
    NEW.id,
    NEW.email,
    _full_name,
    _avatar_url,
    timezone('utc', now()),
    timezone('utc', now())
  );

  -- Initialize user_settings preferred_language if available in metadata
  _preferred_language := coalesce(
    NEW.raw_user_meta_data->>'preferred_language',
    null
  );

  insert into public.user_settings (user_id, preferred_language, created_at, updated_at)
  values (NEW.id, _preferred_language, now(), now())
  on conflict (user_id) do update set
    preferred_language = excluded.preferred_language,
    updated_at = now();

  return NEW;
exception when others then
  -- Do not block signup; log and continue
  raise log 'handle_new_user language/setup ERROR for user ID %: %', NEW.id, SQLERRM;
  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_image_count(character_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE characters 
    SET image_count = image_count + 1, updated_at = now() 
    WHERE id = character_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.init_user_language()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  _locale text := coalesce(NEW.raw_user_meta_data->>'locale', 'en-GB');
begin
  insert into public.user_settings (user_id, preferred_language, created_at, updated_at)
  values (NEW.id, _locale, now(), now())
  on conflict (user_id) do update
  set preferred_language = excluded.preferred_language, updated_at = now();
  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.process_credit_pack_purchase(p_user_id uuid, p_payment_intent_id text, p_price_id text, p_credits integer, p_amount_paid integer, p_expires_at timestamp with time zone, p_description text, p_metadata jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Check for duplicate processing (idempotency)
  IF EXISTS (
    SELECT 1 FROM credit_pack_purchases 
    WHERE stripe_payment_intent_id = p_payment_intent_id
  ) THEN
    RAISE NOTICE 'Credit pack purchase already processed: %', p_payment_intent_id;
    RETURN;
  END IF;
  
  -- Record purchase
  INSERT INTO credit_pack_purchases (
    user_id, stripe_payment_intent_id, stripe_price_id,
    credits_purchased, amount_paid, status, expires_at
  ) VALUES (
    p_user_id, p_payment_intent_id, p_price_id,
    p_credits, p_amount_paid, 'completed', p_expires_at
  );
  
  -- Award credits atomically
  INSERT INTO user_credits (
    user_id, credits, transaction_type, source_type,
    source_id, expires_at, description, metadata
  ) VALUES (
    p_user_id, p_credits, 'earned', 'credit_pack',
    p_payment_intent_id, p_expires_at, p_description, p_metadata
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.refund_credits_with_idempotency(p_user_id uuid, p_job_id uuid, p_amount integer, p_reason text, p_idempotency_key text)
 RETURNS TABLE(success boolean, refund_created boolean, error_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    existing_refund_count INTEGER;
BEGIN
    -- Check if refund already exists with this idempotency key
    SELECT COUNT(*) INTO existing_refund_count
    FROM user_credits 
    WHERE user_id = p_user_id 
      AND source_type = 'refund'
      AND source_id = p_job_id::TEXT
      AND metadata->>'idempotency_key' = p_idempotency_key;
    
    -- If refund already exists, return success but indicate no new refund created
    IF existing_refund_count > 0 THEN
        RETURN QUERY SELECT TRUE, FALSE, 'Refund already processed'::TEXT;
        RETURN;
    END IF;
    
    -- Create new refund record
    INSERT INTO user_credits (
        user_id,
        credits,
        transaction_type,
        source_type,
        source_id,
        description,
        metadata
    ) VALUES (
        p_user_id,
        p_amount,
        'earned',
        'refund',
        p_job_id::TEXT,
        p_reason,
        jsonb_build_object(
            'original_job_id', p_job_id,
            'reason', 'job_creation_failed',
            'idempotency_key', p_idempotency_key
        )
    );
    
    RETURN QUERY SELECT TRUE, TRUE, NULL::TEXT;
    
EXCEPTION WHEN unique_violation THEN
    -- Handle race condition where another process created the same refund
    RETURN QUERY SELECT TRUE, FALSE, 'Concurrent refund already processed'::TEXT;
WHEN OTHERS THEN
    RAISE LOG 'refund_credits_with_idempotency error for user % job %: %', p_user_id, p_job_id, SQLERRM;
    RETURN QUERY SELECT FALSE, FALSE, SQLERRM;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.send_welcome_email_after_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  _project_ref text;
  _hook_secret text;
  _url text;
  _headers jsonb;
  _full_name text;
  _locale text;
begin
  select c.project_ref, c.welcome_hook_secret
  into _project_ref, _hook_secret
  from app.config c
  where c.id = 1;

  if coalesce(_project_ref, '') = '' or coalesce(_hook_secret, '') = '' then
    return NEW;
  end if;

  _full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NULLIF(CONCAT(
      COALESCE(NEW.raw_user_meta_data->>'given_name', ''),
      ' ',
      COALESCE(NEW.raw_user_meta_data->>'family_name', '')
    ), ' '),
    NEW.raw_user_meta_data->>'user_name'
  );

  _locale := coalesce(NEW.raw_user_meta_data->>'locale', 'en-GB');

  _url := 'https://' || _project_ref || '.functions.supabase.co/send-welcome-email';
  _headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-hook-secret', _hook_secret
  );

  perform net.http_post(
    url := _url,
    headers := _headers,
    body := jsonb_build_object(
      'id', NEW.id,
      'email', NEW.email,
      'full_name', _full_name,
      'locale', _locale
    )
  );

  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_user_language(new_language character varying)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.user_settings (user_id, preferred_language, created_at, updated_at)
  values (auth.uid(), new_language, now(), now())
  on conflict (user_id) do update set
    preferred_language = excluded.preferred_language,
    updated_at = now();
end;
$function$
;

CREATE OR REPLACE FUNCTION public.should_cleanup_stuck_inference_jobs()
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.inference_jobs 
    WHERE status = 'running' 
      AND updated_at < (now() - interval '15 minutes')
  );
$function$
;

CREATE OR REPLACE FUNCTION public.should_trigger_inference_queue()
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
WITH heads AS (
  SELECT user_id
  FROM public.inference_jobs
  WHERE status = 'queued'
    AND (retry_after IS NULL OR retry_after <= now())
  GROUP BY user_id
),
active AS (
  SELECT user_id, COUNT(*) AS active
  FROM public.inference_jobs
  WHERE status IN ('initializing','pending','running')
  GROUP BY user_id
),
limits AS (
  SELECT us.user_id, COALESCE(s.concurrent_jobs, 1) AS lim
  FROM public.user_subscriptions us
  JOIN public.subscriptions s ON s.name = us.plan_name
  WHERE us.status = 'active'
)
SELECT EXISTS (
  SELECT 1
  FROM heads h
  JOIN limits l ON l.user_id = h.user_id
  LEFT JOIN active a ON a.user_id = h.user_id
  WHERE COALESCE(a.active, 0) < l.lim
);
$function$
;

CREATE OR REPLACE FUNCTION public.should_trigger_training_queue()
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
WITH heads AS (
  SELECT user_id
  FROM public.training_jobs
  WHERE status = 'queued'
    AND (retry_after IS NULL OR retry_after <= now())
  GROUP BY user_id
),
active AS (
  SELECT user_id, COUNT(*) AS active
  FROM public.training_jobs
  WHERE status IN ('initializing','pending','running')
  GROUP BY user_id
),
limits AS (
  SELECT us.user_id, COALESCE(s.concurrent_trainings, 1) AS lim
  FROM public.user_subscriptions us
  JOIN public.subscriptions s ON s.name = us.plan_name
  WHERE us.status = 'active'
)
SELECT EXISTS (
  SELECT 1
  FROM heads h
  JOIN limits l ON l.user_id = h.user_id
  LEFT JOIN active a ON a.user_id = h.user_id
  WHERE COALESCE(a.active, 0) < l.lim
);
$function$
;

CREATE OR REPLACE FUNCTION public.spend_credits_with_job_tracking(p_user_id uuid, p_job_id uuid, p_amount integer, p_usage_type text, p_description text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(success boolean, current_balance integer, error_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    initial_balance INTEGER;
    final_balance INTEGER;
    spend_success BOOLEAN;
BEGIN
    -- Start transaction (function is automatically wrapped in transaction)
    
    -- Get initial balance
    SELECT get_user_credit_balance(p_user_id) INTO initial_balance;
    
    -- Check if user has enough credits
    IF initial_balance < p_amount THEN
        RETURN QUERY SELECT FALSE, initial_balance, 'Insufficient credits'::TEXT;
        RETURN;
    END IF;
    
    -- Attempt to spend credits using existing function
    SELECT spend_user_credits(
        p_user_id,
        p_amount,
        p_usage_type,
        p_description,
        p_metadata || jsonb_build_object('job_id', p_job_id)
    ) INTO spend_success;
    
    IF NOT spend_success THEN
        RETURN QUERY SELECT FALSE, initial_balance, 'Failed to spend credits'::TEXT;
        RETURN;
    END IF;
    
    -- Get final balance
    SELECT get_user_credit_balance(p_user_id) INTO final_balance;
    
    -- Return success
    RETURN QUERY SELECT TRUE, final_balance, NULL::TEXT;
    
EXCEPTION WHEN OTHERS THEN
    -- Log error and return failure
    RAISE LOG 'spend_credits_with_job_tracking error for user % job %: %', p_user_id, p_job_id, SQLERRM;
    RETURN QUERY SELECT FALSE, COALESCE(initial_balance, 0), SQLERRM;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.spend_user_credits(p_user_id uuid, p_amount integer, p_usage_type text, p_description text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(success boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_quality text := NULL;
  v_nb_takes int := NULL;
  v_job_id uuid := NULL;
BEGIN
  v_quality := NULLIF(p_metadata->>'quality','');
  v_nb_takes := NULLIF(p_metadata->>'nb_takes','')::int;
  v_job_id := NULLIF(p_metadata->>'job_id','')::uuid;

  INSERT INTO public.user_credits (
    user_id, credits, transaction_type, source_type, source_id, description, metadata
  ) VALUES (
    p_user_id, p_amount, 'spent', 'inference', NULL, COALESCE(p_description, p_usage_type), COALESCE(p_metadata, '{}'::jsonb)
  );

  INSERT INTO public.credit_usage (
    user_id, credits_used, usage_type, quality, nb_takes, job_id, metadata
  ) VALUES (
    p_user_id, p_amount, p_usage_type, v_quality, v_nb_takes, v_job_id, COALESCE(p_metadata, '{}'::jsonb)
  );

  RETURN QUERY SELECT TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.training_jobs_status_timestamps()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  -- Set started_at only on transition into 'running' if not already set
  if (new.status = 'running'
      and (old.status is distinct from 'running')
      and new.started_at is null) then
    new.started_at := now();
  end if;

  -- Set completed_at only on first transition into a terminal state
  if ((new.status = 'completed' or new.status = 'failed')
      and (old.status is distinct from new.status)
      and new.completed_at is null) then
    new.completed_at := now();
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_language_preference(new_language character varying)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.user_language_preferences (user_id, preferred_language)
    VALUES (auth.uid(), new_language)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        preferred_language = EXCLUDED.preferred_language,
        updated_at = NOW();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_subscription(p_user_id uuid, p_stripe_subscription_id text, p_stripe_customer_id text, p_stripe_price_id text, p_plan_name text, p_status text, p_current_period_start timestamp with time zone, p_current_period_end timestamp with time zone, p_cancel_at_period_end boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO user_subscriptions (
    user_id, stripe_subscription_id, stripe_customer_id,
    stripe_price_id, plan_name, status, current_period_start,
    current_period_end, cancel_at_period_end, updated_at
  ) VALUES (
    p_user_id, p_stripe_subscription_id, p_stripe_customer_id,
    p_stripe_price_id, p_plan_name, p_status, p_current_period_start,
    p_current_period_end, p_cancel_at_period_end, now()
  )
  ON CONFLICT (stripe_subscription_id) 
  DO UPDATE SET
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    stripe_price_id = EXCLUDED.stripe_price_id,
    plan_name = EXCLUDED.plan_name,
    status = EXCLUDED.status,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    updated_at = now();
END;
$function$
;

create policy "Allow public read access to style_colors"
on "public"."style_colors"
as permissive
for select
to anon, authenticated
using (true);


create policy "Allow public read access to style_scenes"
on "public"."style_scenes"
as permissive
for select
to anon, authenticated
using (true);


create policy "Allow public read access to style_wardrobes"
on "public"."style_wardrobes"
as permissive
for select
to anon, authenticated
using (true);


create policy "Allow insert during signup"
on "public"."users"
as permissive
for insert
to anon, authenticated
with check (true);



CREATE TRIGGER on_auth_user_created_language AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION init_user_language();

CREATE TRIGGER on_auth_user_created_welcome_email AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION send_welcome_email_after_signup();


  create policy "Service role can manage all upload objects"
  on "storage"."objects"
  as permissive
  for all
  to public
using (((bucket_id = 'uploads'::text) AND ((auth.jwt() ->> 'role'::text) = 'service_role'::text)));



  create policy "Users can delete their own chunks"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'uploads'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = 'upload-chunks'::text)));



  create policy "Users can read their own chunks"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'uploads'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = 'upload-chunks'::text)));



  create policy "Users can upload chunks"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'uploads'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = 'upload-chunks'::text)));



