create sequence "public"."credit_costs_id_seq";

create sequence "public"."credit_packs_id_seq";

create sequence "public"."subscriptions_id_seq";

create table "public"."characters" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "thumbnail_url" text,
    "status" text not null default 'queued'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "image_count" integer default 0,
    "gender" text,
    "eye_color" text,
    "hair_color" text,
    "hair_length" text,
    "hair_style" text,
    "age" text,
    "body_type" text,
    "glasses" text,
    "metadata" jsonb,
    "lora_path" text
);


alter table "public"."characters" enable row level security;

create table "public"."credit_costs" (
    "id" integer not null default nextval('credit_costs_id_seq'::regclass),
    "type" text not null,
    "value" integer not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."credit_costs" enable row level security;

create table "public"."credit_pack_purchases" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "stripe_payment_intent_id" text not null,
    "stripe_price_id" text not null,
    "credits_purchased" integer not null,
    "amount_paid" integer not null,
    "status" text not null,
    "expires_at" timestamp with time zone not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."credit_pack_purchases" enable row level security;

create table "public"."credit_packs" (
    "id" integer not null default nextval('credit_packs_id_seq'::regclass),
    "name" text not null,
    "credits" integer not null,
    "price" numeric(10,2) not null,
    "validity_days" integer not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "translations" jsonb default '{}'::jsonb
);


alter table "public"."credit_packs" enable row level security;

create table "public"."credit_usage" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "credits_used" integer not null,
    "usage_type" text not null,
    "quality" text,
    "nb_takes" integer,
    "job_id" uuid,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."credit_usage" enable row level security;

create table "public"."generated_images" (
    "id" uuid not null default uuid_generate_v4(),
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "user_id" uuid not null,
    "inference_id" uuid not null,
    "original_path" text not null,
    "web_path" text not null,
    "width" integer not null,
    "height" integer not null,
    "format" text not null,
    "bytes" bigint not null,
    "favourite" boolean not null default false
);


alter table "public"."generated_images" enable row level security;

create table "public"."inference_jobs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "character_id" uuid not null,
    "style_id" uuid,
    "status" text not null default 'initializing'::text,
    "error_message" text,
    "created_at" timestamp with time zone default now(),
    "completed_at" timestamp with time zone,
    "updated_at" timestamp with time zone default now(),
    "wardrobe_id" uuid,
    "scene_id" uuid,
    "color_id" uuid,
    "credits_spent" integer not null default 0,
    "retry_after" timestamp with time zone,
    "quality" text,
    "nb_takes" integer,
    "aspect_ratio" text,
    "queue_type" text,
    "modal_job_id" text
);


alter table "public"."inference_jobs" enable row level security;

create table "public"."inference_settings" (
    "key" text not null,
    "value" jsonb not null,
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."inference_settings" enable row level security;

create table "public"."sessions" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone default timezone('utc'::text, now()),
    "expires_at" timestamp with time zone,
    "last_accessed_at" timestamp with time zone
);


alter table "public"."sessions" enable row level security;

create table "public"."style_colors" (
    "id" uuid not null default gen_random_uuid(),
    "value" text not null,
    "label" text not null,
    "color" text not null,
    "translations" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."style_colors" enable row level security;

create table "public"."style_scenes" (
    "id" uuid not null default gen_random_uuid(),
    "value" text not null,
    "label" text not null,
    "image" text not null,
    "translations" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "prompt" text
);


alter table "public"."style_scenes" enable row level security;

create table "public"."style_wardrobes" (
    "id" uuid not null default gen_random_uuid(),
    "value" text not null,
    "label" text not null,
    "image" text not null,
    "translations" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "gender" text not null default 'unisex'::text,
    "prompt" text,
    "category" text not null
);


alter table "public"."style_wardrobes" enable row level security;

create table "public"."styles" (
    "name" text not null,
    "preview_images" jsonb not null default '[]'::jsonb,
    "available_scenes" text[] not null default '{}'::text[],
    "available_wardrobes" text[] not null default '{}'::text[],
    "available_colors" text[] not null default '{}'::text[],
    "translations" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone default timezone('utc'::text, now()),
    "prompt" text,
    "id" uuid not null default gen_random_uuid(),
    "lora_path" text
);


alter table "public"."styles" enable row level security;

create table "public"."subscriptions" (
    "id" integer not null default nextval('subscriptions_id_seq'::regclass),
    "name" text not null,
    "display_name" text not null,
    "description" text,
    "original_price" numeric(10,2) not null,
    "monthly_price" numeric(10,2) not null,
    "yearly_price" numeric(10,2) not null,
    "credits" integer not null,
    "max_quality" text not null,
    "character_training_included" integer not null,
    "concurrent_jobs" integer not null,
    "max_characters" integer not null,
    "features" jsonb,
    "popular" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "translations" jsonb default '{}'::jsonb,
    "concurrent_trainings" integer
);


alter table "public"."subscriptions" enable row level security;

create table "public"."training_jobs" (
    "id" uuid not null default gen_random_uuid(),
    "character_id" uuid not null,
    "user_id" uuid not null,
    "status" text not null default 'initializing'::text,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "modal_job_id" text,
    "error_message" text,
    "credits_spent" integer default 0,
    "gpu_type" text,
    "retry_count" integer not null default 0,
    "retry_after" timestamp with time zone
);


alter table "public"."training_jobs" enable row level security;

create table "public"."upload_chunks" (
    "id" uuid not null default uuid_generate_v4(),
    "session_id" uuid not null,
    "chunk_index" integer not null,
    "chunk_size" integer not null,
    "status" text not null default 'pending'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."upload_chunks" enable row level security;

create table "public"."upload_sessions" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "file_name" text not null,
    "file_size" bigint not null,
    "file_type" text not null,
    "total_chunks" integer not null,
    "completed_chunks" integer default 0,
    "status" text not null default 'pending'::text,
    "final_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "metadata" jsonb default '{}'::jsonb,
    "quality_score" integer,
    "character_id" uuid
);


alter table "public"."upload_sessions" enable row level security;

create table "public"."uploaded_images" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "url" text not null,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "file_name" text,
    "file_size" bigint,
    "mime_type" text,
    "dimensions" jsonb,
    "quality_score" double precision default 0,
    "character_id" uuid
);


alter table "public"."uploaded_images" enable row level security;

create table "public"."user_credits" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "credits" integer not null,
    "transaction_type" text not null,
    "source_type" text not null,
    "source_id" text,
    "expires_at" timestamp with time zone,
    "description" text,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."user_credits" enable row level security;

create table "public"."user_settings" (
    "user_id" uuid not null,
    "preferred_language" character varying,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."user_settings" enable row level security;

create table "public"."user_subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "stripe_subscription_id" text not null,
    "stripe_customer_id" text not null,
    "stripe_price_id" text not null,
    "plan_name" text not null,
    "status" text not null,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."user_subscriptions" enable row level security;

create table "public"."users" (
    "id" uuid not null,
    "email" text not null,
    "full_name" text,
    "avatar_url" text,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone default timezone('utc'::text, now()),
    "admin" boolean not null default false
);


alter table "public"."users" enable row level security;

create table "public"."waitlist" (
    "id" bigint generated by default as identity not null,
    "email" text not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."waitlist" enable row level security;

alter sequence "public"."credit_costs_id_seq" owned by "public"."credit_costs"."id";

alter sequence "public"."credit_packs_id_seq" owned by "public"."credit_packs"."id";

alter sequence "public"."subscriptions_id_seq" owned by "public"."subscriptions"."id";

CREATE UNIQUE INDEX credit_costs_pkey ON public.credit_costs USING btree (id);

CREATE UNIQUE INDEX credit_pack_purchases_pkey ON public.credit_pack_purchases USING btree (id);

CREATE UNIQUE INDEX credit_packs_pkey ON public.credit_packs USING btree (id);

CREATE UNIQUE INDEX credit_usage_pkey ON public.credit_usage USING btree (id);

CREATE UNIQUE INDEX face_models_pkey ON public.characters USING btree (id);

CREATE UNIQUE INDEX generated_images_pkey ON public.generated_images USING btree (id);

CREATE INDEX idx_characters_metadata ON public.characters USING gin (metadata);

CREATE INDEX idx_credit_pack_purchases_payment_intent_id ON public.credit_pack_purchases USING btree (stripe_payment_intent_id);

CREATE INDEX idx_credit_pack_purchases_status ON public.credit_pack_purchases USING btree (status);

CREATE INDEX idx_credit_pack_purchases_stripe_id ON public.credit_pack_purchases USING btree (stripe_payment_intent_id);

CREATE INDEX idx_credit_pack_purchases_stripe_payment_intent_id ON public.credit_pack_purchases USING btree (stripe_payment_intent_id);

CREATE INDEX idx_credit_pack_purchases_user_id ON public.credit_pack_purchases USING btree (user_id);

CREATE INDEX idx_credit_usage_created_at ON public.credit_usage USING btree (created_at);

CREATE INDEX idx_credit_usage_usage_type ON public.credit_usage USING btree (usage_type);

CREATE INDEX idx_credit_usage_user_id ON public.credit_usage USING btree (user_id);

CREATE INDEX idx_face_models_created_at ON public.characters USING btree (created_at DESC);

CREATE INDEX idx_face_models_image_count ON public.characters USING btree (image_count);

CREATE INDEX idx_face_models_status ON public.characters USING btree (status);

CREATE INDEX idx_face_models_user_id ON public.characters USING btree (user_id);

CREATE INDEX idx_generated_images_inference_id ON public.generated_images USING btree (inference_id);

CREATE INDEX idx_generated_images_user_id ON public.generated_images USING btree (user_id);

CREATE INDEX idx_inference_jobs_character_id ON public.inference_jobs USING btree (character_id);

CREATE INDEX idx_inference_jobs_color_id ON public.inference_jobs USING btree (color_id);

CREATE INDEX idx_inference_jobs_created_at ON public.inference_jobs USING btree (created_at DESC);

CREATE INDEX idx_inference_jobs_scene_id ON public.inference_jobs USING btree (scene_id);

CREATE INDEX idx_inference_jobs_status ON public.inference_jobs USING btree (status);

CREATE INDEX idx_inference_jobs_style_id ON public.inference_jobs USING btree (style_id);

CREATE INDEX idx_inference_jobs_user_id ON public.inference_jobs USING btree (user_id);

CREATE INDEX idx_inference_jobs_wardrobe_id ON public.inference_jobs USING btree (wardrobe_id);

CREATE INDEX idx_style_colors_translations ON public.style_colors USING gin (translations);

CREATE INDEX idx_style_colors_value ON public.style_colors USING btree (value);

CREATE INDEX idx_style_scenes_translations ON public.style_scenes USING gin (translations);

CREATE INDEX idx_style_scenes_value ON public.style_scenes USING btree (value);

CREATE INDEX idx_style_wardrobes_gender ON public.style_wardrobes USING btree (gender);

CREATE INDEX idx_style_wardrobes_translations ON public.style_wardrobes USING gin (translations);

CREATE INDEX idx_style_wardrobes_value ON public.style_wardrobes USING btree (value);

CREATE INDEX idx_training_jobs_character_id ON public.training_jobs USING btree (character_id);

CREATE INDEX idx_training_jobs_created_at ON public.training_jobs USING btree (created_at DESC);

CREATE INDEX idx_training_jobs_queued_retry_after ON public.training_jobs USING btree (retry_after) WHERE (status = 'queued'::text);

CREATE INDEX idx_training_jobs_status ON public.training_jobs USING btree (status);

CREATE INDEX idx_training_jobs_user_id ON public.training_jobs USING btree (user_id);

CREATE INDEX idx_upload_sessions_character_id ON public.upload_sessions USING btree (character_id);

CREATE INDEX idx_uploaded_images_character_id ON public.uploaded_images USING btree (character_id);

CREATE INDEX idx_user_credits_expires_at ON public.user_credits USING btree (expires_at);

CREATE UNIQUE INDEX idx_user_credits_refund_idempotency ON public.user_credits USING btree (user_id, source_type, source_id, ((metadata ->> 'idempotency_key'::text))) WHERE ((source_type = 'refund'::text) AND ((metadata ->> 'idempotency_key'::text) IS NOT NULL));

CREATE INDEX idx_user_credits_source ON public.user_credits USING btree (source_type, source_id);

CREATE INDEX idx_user_credits_source_type ON public.user_credits USING btree (source_type);

CREATE INDEX idx_user_credits_transaction_type ON public.user_credits USING btree (transaction_type);

CREATE INDEX idx_user_credits_user_id ON public.user_credits USING btree (user_id);

CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions USING btree (status);

CREATE INDEX idx_user_subscriptions_stripe_id ON public.user_subscriptions USING btree (stripe_subscription_id);

CREATE INDEX idx_user_subscriptions_stripe_subscription_id ON public.user_subscriptions USING btree (stripe_subscription_id);

CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions USING btree (user_id);

CREATE UNIQUE INDEX inference_jobs_pkey ON public.inference_jobs USING btree (id);

CREATE UNIQUE INDEX inference_settings_pkey ON public.inference_settings USING btree (key);

CREATE UNIQUE INDEX sessions_pkey ON public.sessions USING btree (id);

CREATE UNIQUE INDEX style_colors_pkey ON public.style_colors USING btree (id);

CREATE UNIQUE INDEX style_colors_value_key ON public.style_colors USING btree (value);

CREATE UNIQUE INDEX style_scenes_pkey ON public.style_scenes USING btree (id);

CREATE UNIQUE INDEX style_scenes_value_key ON public.style_scenes USING btree (value);

CREATE UNIQUE INDEX style_wardrobes_pkey ON public.style_wardrobes USING btree (id);

CREATE UNIQUE INDEX style_wardrobes_value_key ON public.style_wardrobes USING btree (value);

CREATE UNIQUE INDEX styles_pkey ON public.styles USING btree (id);

CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);

CREATE UNIQUE INDEX training_jobs_pkey ON public.training_jobs USING btree (id);

CREATE UNIQUE INDEX upload_chunks_pkey ON public.upload_chunks USING btree (id);

CREATE UNIQUE INDEX upload_chunks_session_id_chunk_index_key ON public.upload_chunks USING btree (session_id, chunk_index);

CREATE UNIQUE INDEX upload_sessions_pkey ON public.upload_sessions USING btree (id);

CREATE UNIQUE INDEX uploaded_images_pkey ON public.uploaded_images USING btree (id);

CREATE UNIQUE INDEX user_credits_pkey ON public.user_credits USING btree (id);

CREATE UNIQUE INDEX user_language_preferences_pkey ON public.user_settings USING btree (user_id);

CREATE UNIQUE INDEX user_subscriptions_pkey ON public.user_subscriptions USING btree (id);

CREATE UNIQUE INDEX user_subscriptions_stripe_subscription_id_key ON public.user_subscriptions USING btree (stripe_subscription_id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX waitlist_email_key ON public.waitlist USING btree (email);

CREATE UNIQUE INDEX waitlist_pkey ON public.waitlist USING btree (id);

alter table "public"."characters" add constraint "face_models_pkey" PRIMARY KEY using index "face_models_pkey";

alter table "public"."credit_costs" add constraint "credit_costs_pkey" PRIMARY KEY using index "credit_costs_pkey";

alter table "public"."credit_pack_purchases" add constraint "credit_pack_purchases_pkey" PRIMARY KEY using index "credit_pack_purchases_pkey";

alter table "public"."credit_packs" add constraint "credit_packs_pkey" PRIMARY KEY using index "credit_packs_pkey";

alter table "public"."credit_usage" add constraint "credit_usage_pkey" PRIMARY KEY using index "credit_usage_pkey";

alter table "public"."generated_images" add constraint "generated_images_pkey" PRIMARY KEY using index "generated_images_pkey";

alter table "public"."inference_jobs" add constraint "inference_jobs_pkey" PRIMARY KEY using index "inference_jobs_pkey";

alter table "public"."inference_settings" add constraint "inference_settings_pkey" PRIMARY KEY using index "inference_settings_pkey";

alter table "public"."sessions" add constraint "sessions_pkey" PRIMARY KEY using index "sessions_pkey";

alter table "public"."style_colors" add constraint "style_colors_pkey" PRIMARY KEY using index "style_colors_pkey";

alter table "public"."style_scenes" add constraint "style_scenes_pkey" PRIMARY KEY using index "style_scenes_pkey";

alter table "public"."style_wardrobes" add constraint "style_wardrobes_pkey" PRIMARY KEY using index "style_wardrobes_pkey";

alter table "public"."styles" add constraint "styles_pkey" PRIMARY KEY using index "styles_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "public"."training_jobs" add constraint "training_jobs_pkey" PRIMARY KEY using index "training_jobs_pkey";

alter table "public"."upload_chunks" add constraint "upload_chunks_pkey" PRIMARY KEY using index "upload_chunks_pkey";

alter table "public"."upload_sessions" add constraint "upload_sessions_pkey" PRIMARY KEY using index "upload_sessions_pkey";

alter table "public"."uploaded_images" add constraint "uploaded_images_pkey" PRIMARY KEY using index "uploaded_images_pkey";

alter table "public"."user_credits" add constraint "user_credits_pkey" PRIMARY KEY using index "user_credits_pkey";

alter table "public"."user_settings" add constraint "user_language_preferences_pkey" PRIMARY KEY using index "user_language_preferences_pkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_pkey" PRIMARY KEY using index "user_subscriptions_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."waitlist" add constraint "waitlist_pkey" PRIMARY KEY using index "waitlist_pkey";

alter table "public"."characters" add constraint "characters_status_check" CHECK ((status = ANY (ARRAY['queued'::text, 'training'::text, 'ready'::text, 'failed'::text, 'deleted'::text]))) not valid;

alter table "public"."characters" validate constraint "characters_status_check";

alter table "public"."characters" add constraint "chk_characters_image_count_positive" CHECK ((image_count >= 0)) not valid;

alter table "public"."characters" validate constraint "chk_characters_image_count_positive";

alter table "public"."characters" add constraint "face_models_gender_check" CHECK (((gender = ANY (ARRAY['Male'::text, 'Female'::text, 'male'::text, 'female'::text, 'MALE'::text, 'FEMALE'::text])) OR (gender IS NULL))) not valid;

alter table "public"."characters" validate constraint "face_models_gender_check";

alter table "public"."characters" add constraint "face_models_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."characters" validate constraint "face_models_user_id_fkey";

alter table "public"."credit_pack_purchases" add constraint "credit_pack_purchases_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."credit_pack_purchases" validate constraint "credit_pack_purchases_status_check";

alter table "public"."credit_pack_purchases" add constraint "credit_pack_purchases_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."credit_pack_purchases" validate constraint "credit_pack_purchases_user_id_fkey";

alter table "public"."credit_usage" add constraint "credit_usage_usage_type_check" CHECK ((usage_type = ANY (ARRAY['image_generation'::text, 'character_training'::text]))) not valid;

alter table "public"."credit_usage" validate constraint "credit_usage_usage_type_check";

alter table "public"."credit_usage" add constraint "credit_usage_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."credit_usage" validate constraint "credit_usage_user_id_fkey";

alter table "public"."generated_images" add constraint "generated_images_bytes_nonnegative" CHECK ((bytes >= 0)) not valid;

alter table "public"."generated_images" validate constraint "generated_images_bytes_nonnegative";

alter table "public"."generated_images" add constraint "generated_images_height_positive" CHECK ((height > 0)) not valid;

alter table "public"."generated_images" validate constraint "generated_images_height_positive";

alter table "public"."generated_images" add constraint "generated_images_inference_id_fkey" FOREIGN KEY (inference_id) REFERENCES inference_jobs(id) ON DELETE CASCADE not valid;

alter table "public"."generated_images" validate constraint "generated_images_inference_id_fkey";

alter table "public"."generated_images" add constraint "generated_images_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."generated_images" validate constraint "generated_images_user_id_fkey";

alter table "public"."generated_images" add constraint "generated_images_width_positive" CHECK ((width > 0)) not valid;

alter table "public"."generated_images" validate constraint "generated_images_width_positive";

alter table "public"."inference_jobs" add constraint "inference_jobs_character_id_fkey" FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE not valid;

alter table "public"."inference_jobs" validate constraint "inference_jobs_character_id_fkey";

alter table "public"."inference_jobs" add constraint "inference_jobs_color_id_fkey" FOREIGN KEY (color_id) REFERENCES style_colors(id) ON DELETE SET NULL not valid;

alter table "public"."inference_jobs" validate constraint "inference_jobs_color_id_fkey";

alter table "public"."inference_jobs" add constraint "inference_jobs_credits_spent_nonneg" CHECK ((credits_spent >= 0)) not valid;

alter table "public"."inference_jobs" validate constraint "inference_jobs_credits_spent_nonneg";

alter table "public"."inference_jobs" add constraint "inference_jobs_scene_id_fkey" FOREIGN KEY (scene_id) REFERENCES style_scenes(id) ON DELETE SET NULL not valid;

alter table "public"."inference_jobs" validate constraint "inference_jobs_scene_id_fkey";

alter table "public"."inference_jobs" add constraint "inference_jobs_status_check" CHECK ((status = ANY (ARRAY['initializing'::text, 'queued'::text, 'pending'::text, 'running'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."inference_jobs" validate constraint "inference_jobs_status_check";

alter table "public"."inference_jobs" add constraint "inference_jobs_style_id_fkey" FOREIGN KEY (style_id) REFERENCES styles(id) ON DELETE SET NULL not valid;

alter table "public"."inference_jobs" validate constraint "inference_jobs_style_id_fkey";

alter table "public"."inference_jobs" add constraint "inference_jobs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."inference_jobs" validate constraint "inference_jobs_user_id_fkey";

alter table "public"."inference_jobs" add constraint "inference_jobs_wardrobe_id_fkey" FOREIGN KEY (wardrobe_id) REFERENCES style_wardrobes(id) ON DELETE SET NULL not valid;

alter table "public"."inference_jobs" validate constraint "inference_jobs_wardrobe_id_fkey";

alter table "public"."sessions" add constraint "sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."sessions" validate constraint "sessions_user_id_fkey";

alter table "public"."style_colors" add constraint "style_colors_color_check" CHECK ((color ~ '^#[0-9A-Fa-f]{6}$'::text)) not valid;

alter table "public"."style_colors" validate constraint "style_colors_color_check";

alter table "public"."style_colors" add constraint "style_colors_value_key" UNIQUE using index "style_colors_value_key";

alter table "public"."style_scenes" add constraint "style_scenes_value_key" UNIQUE using index "style_scenes_value_key";

alter table "public"."style_wardrobes" add constraint "chk_style_wardrobes_gender" CHECK ((gender = ANY (ARRAY['man'::text, 'woman'::text, 'unisex'::text]))) not valid;

alter table "public"."style_wardrobes" validate constraint "chk_style_wardrobes_gender";

alter table "public"."style_wardrobes" add constraint "style_wardrobes_value_key" UNIQUE using index "style_wardrobes_value_key";

alter table "public"."training_jobs" add constraint "training_jobs_character_id_fkey" FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE not valid;

alter table "public"."training_jobs" validate constraint "training_jobs_character_id_fkey";

alter table "public"."training_jobs" add constraint "training_jobs_status_check" CHECK ((status = ANY (ARRAY['initializing'::text, 'queued'::text, 'pending'::text, 'running'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."training_jobs" validate constraint "training_jobs_status_check";

alter table "public"."training_jobs" add constraint "training_jobs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."training_jobs" validate constraint "training_jobs_user_id_fkey";

alter table "public"."upload_chunks" add constraint "upload_chunks_session_id_chunk_index_key" UNIQUE using index "upload_chunks_session_id_chunk_index_key";

alter table "public"."upload_chunks" add constraint "upload_chunks_session_id_fkey" FOREIGN KEY (session_id) REFERENCES upload_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."upload_chunks" validate constraint "upload_chunks_session_id_fkey";

alter table "public"."upload_chunks" add constraint "upload_chunks_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'uploaded'::text]))) not valid;

alter table "public"."upload_chunks" validate constraint "upload_chunks_status_check";

alter table "public"."upload_sessions" add constraint "upload_sessions_character_id_fkey" FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE not valid;

alter table "public"."upload_sessions" validate constraint "upload_sessions_character_id_fkey";

alter table "public"."upload_sessions" add constraint "upload_sessions_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."upload_sessions" validate constraint "upload_sessions_status_check";

alter table "public"."upload_sessions" add constraint "upload_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."upload_sessions" validate constraint "upload_sessions_user_id_fkey";

alter table "public"."uploaded_images" add constraint "fk_uploaded_images_character_id" FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL not valid;

alter table "public"."uploaded_images" validate constraint "fk_uploaded_images_character_id";

alter table "public"."uploaded_images" add constraint "uploaded_images_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."uploaded_images" validate constraint "uploaded_images_user_id_fkey";

alter table "public"."user_credits" add constraint "user_credits_source_type_check" CHECK ((source_type = ANY (ARRAY['subscription'::text, 'credit_pack'::text, 'refund'::text, 'admin'::text, 'inference'::text]))) not valid;

alter table "public"."user_credits" validate constraint "user_credits_source_type_check";

alter table "public"."user_credits" add constraint "user_credits_transaction_type_check" CHECK ((transaction_type = ANY (ARRAY['earned'::text, 'spent'::text, 'expired'::text, 'refunded'::text]))) not valid;

alter table "public"."user_credits" validate constraint "user_credits_transaction_type_check";

alter table "public"."user_credits" add constraint "user_credits_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."user_credits" validate constraint "user_credits_user_id_fkey";

alter table "public"."user_settings" add constraint "user_language_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_settings" validate constraint "user_language_preferences_user_id_fkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'canceled'::text, 'incomplete'::text, 'incomplete_expired'::text, 'past_due'::text, 'unpaid'::text, 'paused'::text]))) not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_status_check";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_stripe_subscription_id_key" UNIQUE using index "user_subscriptions_stripe_subscription_id_key";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_user_id_fkey";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_id_fkey";

alter table "public"."waitlist" add constraint "waitlist_email_key" UNIQUE using index "waitlist_email_key";

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

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    _full_name TEXT;
    _avatar_url TEXT;
BEGIN
    -- Log the start of the function
    RAISE LOG 'handle_new_user: Starting for user ID: %, email: %', NEW.id, NEW.email;
    
    -- Extract metadata with proper null handling
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
    
    _avatar_url := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture'
    );
    
    -- Log the extracted values
    RAISE LOG 'handle_new_user: Extracted full_name: %, avatar_url: %', _full_name, _avatar_url;
    
    -- Attempt the insert
    INSERT INTO public.users (
        id,
        email,
        full_name,
        avatar_url,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        _full_name,
        _avatar_url,
        TIMEZONE('utc', NOW()),
        TIMEZONE('utc', NOW())
    );
    
    RAISE LOG 'handle_new_user: Successfully created user in public.users';
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the detailed error
    RAISE LOG 'handle_new_user ERROR for user ID %: %, SQLSTATE: %, DETAIL: %, HINT: %',
        NEW.id,
        SQLERRM,
        SQLSTATE,
        COALESCE(SQLERRM, 'NO DETAIL'),
        COALESCE(SQLHINT, 'NO HINT');
    RETURN NEW;
END;
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

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
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

create policy "Users can create their own face models"
on "public"."characters"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own face models"
on "public"."characters"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own face models"
on "public"."characters"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own face models"
on "public"."characters"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Anyone can read credit_costs"
on "public"."credit_costs"
as permissive
for select
to public
using (true);


create policy "Only service_role can delete credit_costs"
on "public"."credit_costs"
as permissive
for delete
to public
using ((auth.role() = 'service_role'::text));


create policy "Only service_role can insert credit_costs"
on "public"."credit_costs"
as permissive
for insert
to public
with check ((auth.role() = 'service_role'::text));


create policy "Only service_role can update credit_costs"
on "public"."credit_costs"
as permissive
for update
to public
using ((auth.role() = 'service_role'::text));


create policy "Users can view credit_costs"
on "public"."credit_costs"
as permissive
for select
to authenticated
using (true);


create policy "Select own credit pack purchases"
on "public"."credit_pack_purchases"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Service role full access to credit_pack_purchases"
on "public"."credit_pack_purchases"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "Users can insert their own credit pack purchases"
on "public"."credit_pack_purchases"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can view their own credit pack purchases"
on "public"."credit_pack_purchases"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Anyone can read credit_packs"
on "public"."credit_packs"
as permissive
for select
to public
using (true);


create policy "Only service_role can delete credit_packs"
on "public"."credit_packs"
as permissive
for delete
to public
using ((auth.role() = 'service_role'::text));


create policy "Only service_role can insert credit_packs"
on "public"."credit_packs"
as permissive
for insert
to public
with check ((auth.role() = 'service_role'::text));


create policy "Only service_role can update credit_packs"
on "public"."credit_packs"
as permissive
for update
to public
using ((auth.role() = 'service_role'::text));


create policy "Users can view credit_packs"
on "public"."credit_packs"
as permissive
for select
to authenticated
using (true);


create policy "Service role can manage credit usage"
on "public"."credit_usage"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Users can insert their own credit usage"
on "public"."credit_usage"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can view their own credit usage"
on "public"."credit_usage"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "service_role_bypass_policy"
on "public"."generated_images"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "users_can_insert_own_images"
on "public"."generated_images"
as permissive
for insert
to authenticated
with check ((user_id = auth.uid()));


create policy "users_can_read_own_images"
on "public"."generated_images"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "users_can_update_own_images"
on "public"."generated_images"
as permissive
for update
to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "Users can create their own inference jobs"
on "public"."inference_jobs"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own inference jobs"
on "public"."inference_jobs"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own inference jobs"
on "public"."inference_jobs"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own inference jobs"
on "public"."inference_jobs"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Admins can delete inference_settings"
on "public"."inference_settings"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.admin = true)))));


create policy "Admins can insert inference_settings"
on "public"."inference_settings"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.admin = true)))));


create policy "Admins can update inference_settings"
on "public"."inference_settings"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.admin = true)))));


create policy "Allow public read access to inference_settings"
on "public"."inference_settings"
as permissive
for select
to public
using (true);


create policy "Users can delete their own sessions"
on "public"."sessions"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Users can manage their own sessions"
on "public"."sessions"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view their own sessions"
on "public"."sessions"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Admins can delete style_colors"
on "public"."style_colors"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.admin = true)))));


create policy "Admins can insert style_colors"
on "public"."style_colors"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.admin = true)))));


create policy "Admins can update style_colors"
on "public"."style_colors"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.admin = true)))));


create policy "Allow public read access to style_colors"
on "public"."style_colors"
as permissive
for select
to anon, authenticated
using (true);


create policy "Users can view style_colors"
on "public"."style_colors"
as permissive
for select
to authenticated
using (true);


create policy "Admins can delete style_scenes"
on "public"."style_scenes"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.admin = true)))));


create policy "Admins can insert style_scenes"
on "public"."style_scenes"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.admin = true)))));


create policy "Admins can update style_scenes"
on "public"."style_scenes"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.admin = true)))));


create policy "Allow public read access to style_scenes"
on "public"."style_scenes"
as permissive
for select
to anon, authenticated
using (true);


create policy "Users can view style_scenes"
on "public"."style_scenes"
as permissive
for select
to authenticated
using (true);


create policy "Admins can delete style_wardrobes"
on "public"."style_wardrobes"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.admin = true)))));


create policy "Admins can insert style_wardrobes"
on "public"."style_wardrobes"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.admin = true)))));


create policy "Admins can update style_wardrobes"
on "public"."style_wardrobes"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.admin = true)))));


create policy "Allow public read access to style_wardrobes"
on "public"."style_wardrobes"
as permissive
for select
to anon, authenticated
using (true);


create policy "Users can view style_wardrobes"
on "public"."style_wardrobes"
as permissive
for select
to authenticated
using (true);


create policy "Admins can delete styles"
on "public"."styles"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.admin = true)))));


create policy "Admins can insert styles"
on "public"."styles"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.admin = true)))));


create policy "Admins can read styles"
on "public"."styles"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.admin = true)))));


create policy "Admins can update styles"
on "public"."styles"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.admin = true)))));


create policy "Allow public read access to styles"
on "public"."styles"
as permissive
for select
to authenticated, anon
using (true);


create policy "Public read access"
on "public"."styles"
as permissive
for select
to authenticated, anon
using (true);


create policy "Users can view styles"
on "public"."styles"
as permissive
for select
to authenticated
using (true);


create policy "Anyone can read subscriptions"
on "public"."subscriptions"
as permissive
for select
to public
using (true);


create policy "Only service_role can delete subscriptions"
on "public"."subscriptions"
as permissive
for delete
to public
using ((auth.role() = 'service_role'::text));


create policy "Only service_role can insert subscriptions"
on "public"."subscriptions"
as permissive
for insert
to public
with check ((auth.role() = 'service_role'::text));


create policy "Only service_role can update subscriptions"
on "public"."subscriptions"
as permissive
for update
to public
using ((auth.role() = 'service_role'::text));


create policy "Users can view subscriptions"
on "public"."subscriptions"
as permissive
for select
to authenticated
using (true);


create policy "Users can create their own training jobs"
on "public"."training_jobs"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own training jobs"
on "public"."training_jobs"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own training jobs"
on "public"."training_jobs"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own training jobs"
on "public"."training_jobs"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can insert chunks for their upload sessions"
on "public"."upload_chunks"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM upload_sessions
  WHERE ((upload_sessions.id = upload_chunks.session_id) AND (upload_sessions.user_id = auth.uid())))));


create policy "Users can update chunks for their upload sessions"
on "public"."upload_chunks"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM upload_sessions
  WHERE ((upload_sessions.id = upload_chunks.session_id) AND (upload_sessions.user_id = auth.uid())))));


create policy "Users can view chunks for their upload sessions"
on "public"."upload_chunks"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM upload_sessions
  WHERE ((upload_sessions.id = upload_chunks.session_id) AND (upload_sessions.user_id = auth.uid())))));


create policy "Users can delete their own upload sessions"
on "public"."upload_sessions"
as permissive
for delete
to authenticated
using (((auth.uid() = user_id) OR ((character_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM characters
  WHERE ((characters.id = upload_sessions.character_id) AND (characters.user_id = auth.uid())))))));


create policy "Users can insert their own upload sessions"
on "public"."upload_sessions"
as permissive
for insert
to authenticated
with check (((auth.uid() = user_id) OR ((character_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM characters
  WHERE ((characters.id = upload_sessions.character_id) AND (characters.user_id = auth.uid())))))));


create policy "Users can update their own upload sessions"
on "public"."upload_sessions"
as permissive
for update
to public
using (((auth.uid() = user_id) OR ((character_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM characters
  WHERE ((characters.id = upload_sessions.character_id) AND (characters.user_id = auth.uid())))))));


create policy "Users can view their own upload sessions"
on "public"."upload_sessions"
as permissive
for select
to authenticated
using (((auth.uid() = user_id) OR ((character_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM characters
  WHERE ((characters.id = upload_sessions.character_id) AND (characters.user_id = auth.uid())))))));


create policy "Users can manage their own uploaded images"
on "public"."uploaded_images"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Select own credits"
on "public"."user_credits"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Service role full access to user_credits"
on "public"."user_credits"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "Users can insert their own credits"
on "public"."user_credits"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can view their own credits"
on "public"."user_credits"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can manage their own settings"
on "public"."user_settings"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can read their own settings"
on "public"."user_settings"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can update their own settings"
on "public"."user_settings"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Select own subscription"
on "public"."user_subscriptions"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Service role full access to user_subscriptions"
on "public"."user_subscriptions"
as permissive
for all
to service_role
using (true)
with check (true);


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


create policy "Users can view their own subscriptions"
on "public"."user_subscriptions"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Allow insert during signup"
on "public"."users"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Service role full access to users"
on "public"."users"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "Users can update their own profile (except admin)"
on "public"."users"
as permissive
for update
to public
using ((auth.uid() = id))
with check (((auth.uid() = id) AND (admin = ( SELECT users_1.admin
   FROM users users_1
  WHERE (users_1.id = auth.uid())))));


create policy "Users can view their own profile"
on "public"."users"
as permissive
for select
to authenticated
using ((auth.uid() = id));


create policy "Allow public insert"
on "public"."waitlist"
as permissive
for insert
to public
with check (true);


CREATE TRIGGER update_face_models_updated_at BEFORE UPDATE ON public.characters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inference_jobs_updated_at BEFORE UPDATE ON public.inference_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_inference_settings_updated BEFORE UPDATE ON public.inference_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_style_colors_updated_at BEFORE UPDATE ON public.style_colors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_style_scenes_updated_at BEFORE UPDATE ON public.style_scenes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_style_wardrobes_updated_at BEFORE UPDATE ON public.style_wardrobes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_styles_updated_at BEFORE UPDATE ON public.styles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_training_jobs_status_timestamps BEFORE UPDATE ON public.training_jobs FOR EACH ROW EXECUTE FUNCTION training_jobs_status_timestamps();

CREATE TRIGGER update_training_jobs_updated_at BEFORE UPDATE ON public.training_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



