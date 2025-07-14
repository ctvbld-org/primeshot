drop policy "Allow public read access to style_configs" on "public"."style_configs";

drop policy "Public read access" on "public"."style_configs";

drop policy "Allow public read access to style_options" on "public"."style_options";

drop policy "Public read access" on "public"."style_options";

drop policy "Allow insert during signup" on "public"."users";

revoke delete on table "public"."credit_pack_purchases" from "anon";

revoke insert on table "public"."credit_pack_purchases" from "anon";

revoke references on table "public"."credit_pack_purchases" from "anon";

revoke trigger on table "public"."credit_pack_purchases" from "anon";

revoke truncate on table "public"."credit_pack_purchases" from "anon";

revoke update on table "public"."credit_pack_purchases" from "anon";

revoke references on table "public"."credit_pack_purchases" from "authenticated";

revoke trigger on table "public"."credit_pack_purchases" from "authenticated";

revoke truncate on table "public"."credit_pack_purchases" from "authenticated";

revoke delete on table "public"."credit_usage" from "anon";

revoke insert on table "public"."credit_usage" from "anon";

revoke references on table "public"."credit_usage" from "anon";

revoke trigger on table "public"."credit_usage" from "anon";

revoke truncate on table "public"."credit_usage" from "anon";

revoke update on table "public"."credit_usage" from "anon";

revoke references on table "public"."credit_usage" from "authenticated";

revoke trigger on table "public"."credit_usage" from "authenticated";

revoke truncate on table "public"."credit_usage" from "authenticated";

revoke delete on table "public"."face_models" from "anon";

revoke insert on table "public"."face_models" from "anon";

revoke references on table "public"."face_models" from "anon";

revoke trigger on table "public"."face_models" from "anon";

revoke truncate on table "public"."face_models" from "anon";

revoke update on table "public"."face_models" from "anon";

revoke references on table "public"."face_models" from "authenticated";

revoke trigger on table "public"."face_models" from "authenticated";

revoke truncate on table "public"."face_models" from "authenticated";

revoke delete on table "public"."generated_images" from "anon";

revoke insert on table "public"."generated_images" from "anon";

revoke references on table "public"."generated_images" from "anon";

revoke trigger on table "public"."generated_images" from "anon";

revoke truncate on table "public"."generated_images" from "anon";

revoke update on table "public"."generated_images" from "anon";

revoke references on table "public"."generated_images" from "authenticated";

revoke trigger on table "public"."generated_images" from "authenticated";

revoke truncate on table "public"."generated_images" from "authenticated";

revoke delete on table "public"."generated_images" from "service_role";

revoke insert on table "public"."generated_images" from "service_role";

revoke references on table "public"."generated_images" from "service_role";

revoke select on table "public"."generated_images" from "service_role";

revoke trigger on table "public"."generated_images" from "service_role";

revoke truncate on table "public"."generated_images" from "service_role";

revoke update on table "public"."generated_images" from "service_role";

revoke delete on table "public"."images" from "anon";

revoke insert on table "public"."images" from "anon";

revoke references on table "public"."images" from "anon";

revoke select on table "public"."images" from "anon";

revoke trigger on table "public"."images" from "anon";

revoke truncate on table "public"."images" from "anon";

revoke update on table "public"."images" from "anon";

revoke delete on table "public"."images" from "service_role";

revoke insert on table "public"."images" from "service_role";

revoke references on table "public"."images" from "service_role";

revoke select on table "public"."images" from "service_role";

revoke trigger on table "public"."images" from "service_role";

revoke truncate on table "public"."images" from "service_role";

revoke update on table "public"."images" from "service_role";

revoke delete on table "public"."inference_jobs" from "anon";

revoke insert on table "public"."inference_jobs" from "anon";

revoke references on table "public"."inference_jobs" from "anon";

revoke trigger on table "public"."inference_jobs" from "anon";

revoke truncate on table "public"."inference_jobs" from "anon";

revoke update on table "public"."inference_jobs" from "anon";

revoke references on table "public"."inference_jobs" from "authenticated";

revoke trigger on table "public"."inference_jobs" from "authenticated";

revoke truncate on table "public"."inference_jobs" from "authenticated";

revoke delete on table "public"."orders" from "anon";

revoke insert on table "public"."orders" from "anon";

revoke references on table "public"."orders" from "anon";

revoke select on table "public"."orders" from "anon";

revoke trigger on table "public"."orders" from "anon";

revoke truncate on table "public"."orders" from "anon";

revoke update on table "public"."orders" from "anon";

revoke delete on table "public"."orders" from "service_role";

revoke insert on table "public"."orders" from "service_role";

revoke references on table "public"."orders" from "service_role";

revoke select on table "public"."orders" from "service_role";

revoke trigger on table "public"."orders" from "service_role";

revoke truncate on table "public"."orders" from "service_role";

revoke update on table "public"."orders" from "service_role";

revoke delete on table "public"."sessions" from "anon";

revoke insert on table "public"."sessions" from "anon";

revoke references on table "public"."sessions" from "anon";

revoke select on table "public"."sessions" from "anon";

revoke trigger on table "public"."sessions" from "anon";

revoke truncate on table "public"."sessions" from "anon";

revoke update on table "public"."sessions" from "anon";

revoke delete on table "public"."sessions" from "service_role";

revoke insert on table "public"."sessions" from "service_role";

revoke references on table "public"."sessions" from "service_role";

revoke select on table "public"."sessions" from "service_role";

revoke trigger on table "public"."sessions" from "service_role";

revoke truncate on table "public"."sessions" from "service_role";

revoke update on table "public"."sessions" from "service_role";

revoke delete on table "public"."style_configs" from "anon";

revoke insert on table "public"."style_configs" from "anon";

revoke references on table "public"."style_configs" from "anon";

revoke trigger on table "public"."style_configs" from "anon";

revoke truncate on table "public"."style_configs" from "anon";

revoke update on table "public"."style_configs" from "anon";

revoke delete on table "public"."style_configs" from "service_role";

revoke insert on table "public"."style_configs" from "service_role";

revoke references on table "public"."style_configs" from "service_role";

revoke select on table "public"."style_configs" from "service_role";

revoke trigger on table "public"."style_configs" from "service_role";

revoke truncate on table "public"."style_configs" from "service_role";

revoke update on table "public"."style_configs" from "service_role";

revoke delete on table "public"."style_options" from "anon";

revoke insert on table "public"."style_options" from "anon";

revoke references on table "public"."style_options" from "anon";

revoke trigger on table "public"."style_options" from "anon";

revoke truncate on table "public"."style_options" from "anon";

revoke update on table "public"."style_options" from "anon";

revoke delete on table "public"."style_options" from "service_role";

revoke insert on table "public"."style_options" from "service_role";

revoke references on table "public"."style_options" from "service_role";

revoke select on table "public"."style_options" from "service_role";

revoke trigger on table "public"."style_options" from "service_role";

revoke truncate on table "public"."style_options" from "service_role";

revoke update on table "public"."style_options" from "service_role";

revoke delete on table "public"."styles" from "anon";

revoke insert on table "public"."styles" from "anon";

revoke references on table "public"."styles" from "anon";

revoke select on table "public"."styles" from "anon";

revoke trigger on table "public"."styles" from "anon";

revoke truncate on table "public"."styles" from "anon";

revoke update on table "public"."styles" from "anon";

revoke delete on table "public"."styles" from "service_role";

revoke insert on table "public"."styles" from "service_role";

revoke references on table "public"."styles" from "service_role";

revoke select on table "public"."styles" from "service_role";

revoke trigger on table "public"."styles" from "service_role";

revoke truncate on table "public"."styles" from "service_role";

revoke update on table "public"."styles" from "service_role";

revoke delete on table "public"."training_jobs" from "anon";

revoke insert on table "public"."training_jobs" from "anon";

revoke references on table "public"."training_jobs" from "anon";

revoke trigger on table "public"."training_jobs" from "anon";

revoke truncate on table "public"."training_jobs" from "anon";

revoke update on table "public"."training_jobs" from "anon";

revoke references on table "public"."training_jobs" from "authenticated";

revoke trigger on table "public"."training_jobs" from "authenticated";

revoke truncate on table "public"."training_jobs" from "authenticated";

revoke delete on table "public"."upload_chunks" from "anon";

revoke insert on table "public"."upload_chunks" from "anon";

revoke references on table "public"."upload_chunks" from "anon";

revoke trigger on table "public"."upload_chunks" from "anon";

revoke truncate on table "public"."upload_chunks" from "anon";

revoke update on table "public"."upload_chunks" from "anon";

revoke references on table "public"."upload_chunks" from "authenticated";

revoke trigger on table "public"."upload_chunks" from "authenticated";

revoke truncate on table "public"."upload_chunks" from "authenticated";

revoke delete on table "public"."upload_chunks" from "service_role";

revoke insert on table "public"."upload_chunks" from "service_role";

revoke references on table "public"."upload_chunks" from "service_role";

revoke select on table "public"."upload_chunks" from "service_role";

revoke trigger on table "public"."upload_chunks" from "service_role";

revoke truncate on table "public"."upload_chunks" from "service_role";

revoke update on table "public"."upload_chunks" from "service_role";

revoke delete on table "public"."upload_sessions" from "anon";

revoke insert on table "public"."upload_sessions" from "anon";

revoke references on table "public"."upload_sessions" from "anon";

revoke trigger on table "public"."upload_sessions" from "anon";

revoke truncate on table "public"."upload_sessions" from "anon";

revoke update on table "public"."upload_sessions" from "anon";

revoke references on table "public"."upload_sessions" from "authenticated";

revoke trigger on table "public"."upload_sessions" from "authenticated";

revoke truncate on table "public"."upload_sessions" from "authenticated";

revoke delete on table "public"."upload_sessions" from "service_role";

revoke insert on table "public"."upload_sessions" from "service_role";

revoke references on table "public"."upload_sessions" from "service_role";

revoke select on table "public"."upload_sessions" from "service_role";

revoke trigger on table "public"."upload_sessions" from "service_role";

revoke truncate on table "public"."upload_sessions" from "service_role";

revoke update on table "public"."upload_sessions" from "service_role";

revoke delete on table "public"."user_credits" from "anon";

revoke insert on table "public"."user_credits" from "anon";

revoke references on table "public"."user_credits" from "anon";

revoke trigger on table "public"."user_credits" from "anon";

revoke truncate on table "public"."user_credits" from "anon";

revoke update on table "public"."user_credits" from "anon";

revoke references on table "public"."user_credits" from "authenticated";

revoke trigger on table "public"."user_credits" from "authenticated";

revoke truncate on table "public"."user_credits" from "authenticated";

revoke delete on table "public"."user_settings" from "anon";

revoke insert on table "public"."user_settings" from "anon";

revoke references on table "public"."user_settings" from "anon";

revoke trigger on table "public"."user_settings" from "anon";

revoke truncate on table "public"."user_settings" from "anon";

revoke update on table "public"."user_settings" from "anon";

revoke references on table "public"."user_settings" from "authenticated";

revoke trigger on table "public"."user_settings" from "authenticated";

revoke truncate on table "public"."user_settings" from "authenticated";

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

revoke trigger on table "public"."user_subscriptions" from "anon";

revoke truncate on table "public"."user_subscriptions" from "anon";

revoke update on table "public"."user_subscriptions" from "anon";

revoke references on table "public"."user_subscriptions" from "authenticated";

revoke trigger on table "public"."user_subscriptions" from "authenticated";

revoke truncate on table "public"."user_subscriptions" from "authenticated";

revoke delete on table "public"."users" from "anon";

revoke insert on table "public"."users" from "anon";

revoke references on table "public"."users" from "anon";

revoke select on table "public"."users" from "anon";

revoke trigger on table "public"."users" from "anon";

revoke truncate on table "public"."users" from "anon";

revoke update on table "public"."users" from "anon";

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

revoke trigger on table "public"."waitlist" from "anon";

revoke truncate on table "public"."waitlist" from "anon";

revoke update on table "public"."waitlist" from "anon";

revoke references on table "public"."waitlist" from "authenticated";

revoke trigger on table "public"."waitlist" from "authenticated";

revoke truncate on table "public"."waitlist" from "authenticated";

alter table "public"."user_credits" drop column "updated_at";

alter table "public"."user_credits" alter column "source_id" set data type uuid using "source_id"::uuid;

CREATE INDEX idx_credit_pack_purchases_status ON public.credit_pack_purchases USING btree (status);

CREATE INDEX idx_credit_pack_purchases_stripe_payment_intent_id ON public.credit_pack_purchases USING btree (stripe_payment_intent_id);

CREATE INDEX idx_credit_usage_usage_type ON public.credit_usage USING btree (usage_type);

CREATE INDEX idx_user_credits_source_type ON public.user_credits USING btree (source_type);

CREATE INDEX idx_user_credits_transaction_type ON public.user_credits USING btree (transaction_type);

CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions USING btree (status);

set check_function_bodies = off;

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

create policy "Users can insert their own credit pack purchases"
on "public"."credit_pack_purchases"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can insert their own credit usage"
on "public"."credit_usage"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can insert their own credits"
on "public"."user_credits"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can insert their own subscriptions"
on "public"."user_subscriptions"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own subscriptions"
on "public"."user_subscriptions"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Allow public read access to style_configs"
on "public"."style_configs"
as permissive
for select
to anon, authenticated
using (true);


create policy "Public read access"
on "public"."style_configs"
as permissive
for select
to anon, authenticated
using (true);


create policy "Allow public read access to style_options"
on "public"."style_options"
as permissive
for select
to anon, authenticated
using (true);


create policy "Public read access"
on "public"."style_options"
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


CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


