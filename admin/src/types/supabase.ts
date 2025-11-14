Using workdir /Users/ledave/Documents/Primeshot/App
WARN: environment variable is unset: SUPABASE_AUTH_EXTERNAL_APPLE_CLIENT_ID
WARN: environment variable is unset: SUPABASE_AUTH_EXTERNAL_APPLE_SECRET
Connecting to db 5432
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      characters: {
        Row: {
          age: string | null
          body_type: string | null
          created_at: string | null
          eye_color: string | null
          gender: string | null
          glasses: string | null
          hair_color: string | null
          hair_length: string | null
          hair_style: string | null
          id: string
          image_count: number | null
          lora_path: string | null
          metadata: Json | null
          name: string
          status: string
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age?: string | null
          body_type?: string | null
          created_at?: string | null
          eye_color?: string | null
          gender?: string | null
          glasses?: string | null
          hair_color?: string | null
          hair_length?: string | null
          hair_style?: string | null
          id?: string
          image_count?: number | null
          lora_path?: string | null
          metadata?: Json | null
          name: string
          status?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: string | null
          body_type?: string | null
          created_at?: string | null
          eye_color?: string | null
          gender?: string | null
          glasses?: string | null
          hair_color?: string | null
          hair_length?: string | null
          hair_style?: string | null
          id?: string
          image_count?: number | null
          lora_path?: string | null
          metadata?: Json | null
          name?: string
          status?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "face_models_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_award_audit: {
        Row: {
          award_type: string
          awarded_at: string | null
          awarded_by: string | null
          created_at: string | null
          credits_awarded: number
          id: string
          invoice_id: string | null
          metadata: Json | null
          month_number: number
          subscription_id: string
          user_id: string
        }
        Insert: {
          award_type: string
          awarded_at?: string | null
          awarded_by?: string | null
          created_at?: string | null
          credits_awarded: number
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          month_number: number
          subscription_id: string
          user_id: string
        }
        Update: {
          award_type?: string
          awarded_at?: string | null
          awarded_by?: string | null
          created_at?: string | null
          credits_awarded?: number
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          month_number?: number
          subscription_id?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_costs: {
        Row: {
          created_at: string | null
          id: number
          type: string
          updated_at: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          type: string
          updated_at?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          id?: number
          type?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      credit_pack_purchases: {
        Row: {
          amount_paid: number
          created_at: string | null
          credits_purchased: number
          expires_at: string
          id: string
          status: string
          stripe_payment_intent_id: string
          stripe_price_id: string
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          credits_purchased: number
          expires_at: string
          id?: string
          status: string
          stripe_payment_intent_id: string
          stripe_price_id: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          credits_purchased?: number
          expires_at?: string
          id?: string
          status?: string
          stripe_payment_intent_id?: string
          stripe_price_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_pack_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packs: {
        Row: {
          created_at: string | null
          credits: number
          id: number
          image_url: string | null
          name: string
          price: number
          translations: Json | null
          updated_at: string | null
          validity_days: number
        }
        Insert: {
          created_at?: string | null
          credits: number
          id?: number
          image_url?: string | null
          name: string
          price: number
          translations?: Json | null
          updated_at?: string | null
          validity_days: number
        }
        Update: {
          created_at?: string | null
          credits?: number
          id?: number
          image_url?: string | null
          name?: string
          price?: number
          translations?: Json | null
          updated_at?: string | null
          validity_days?: number
        }
        Relationships: []
      }
      credit_usage: {
        Row: {
          created_at: string | null
          credits_used: number
          id: string
          job_id: string | null
          metadata: Json | null
          nb_takes: number | null
          quality: string | null
          usage_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_used: number
          id?: string
          job_id?: string | null
          metadata?: Json | null
          nb_takes?: number | null
          quality?: string | null
          usage_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_used?: number
          id?: string
          job_id?: string | null
          metadata?: Json | null
          nb_takes?: number | null
          quality?: string | null
          usage_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      explore_categories: {
        Row: {
          created_at: string | null
          cta_link: string | null
          description: string | null
          id: string
          name: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cta_link?: string | null
          description?: string | null
          id?: string
          name: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cta_link?: string | null
          description?: string | null
          id?: string
          name?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      explore_images: {
        Row: {
          category_id: string | null
          created_at: string | null
          generated_image_id: string | null
          id: string
          s3_path: string
          short_code: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          generated_image_id?: string | null
          id?: string
          s3_path: string
          short_code?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          generated_image_id?: string | null
          id?: string
          s3_path?: string
          short_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "explore_images_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "explore_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_images: {
        Row: {
          bytes: number
          created_at: string
          favourite: boolean
          format: string
          height: number
          id: string
          image_index: number | null
          inference_id: string
          metadata: Json | null
          original_path: string
          seed: number | null
          updated_at: string
          user_id: string
          web_path: string
          width: number
        }
        Insert: {
          bytes: number
          created_at?: string
          favourite?: boolean
          format: string
          height: number
          id?: string
          image_index?: number | null
          inference_id: string
          metadata?: Json | null
          original_path: string
          seed?: number | null
          updated_at?: string
          user_id: string
          web_path: string
          width: number
        }
        Update: {
          bytes?: number
          created_at?: string
          favourite?: boolean
          format?: string
          height?: number
          id?: string
          image_index?: number | null
          inference_id?: string
          metadata?: Json | null
          original_path?: string
          seed?: number | null
          updated_at?: string
          user_id?: string
          web_path?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "generated_images_inference_id_fkey"
            columns: ["inference_id"]
            isOneToOne: false
            referencedRelation: "inference_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inference_jobs: {
        Row: {
          aspect_ratio: string | null
          character_id: string
          color_id: string | null
          completed_at: string | null
          created_at: string | null
          credits_spent: number
          error_message: string | null
          id: string
          modal_job_id: string | null
          nb_takes: number | null
          prompt_override: Json | null
          quality: string | null
          queue_type: string | null
          retry_after: string | null
          scene_id: string | null
          settings_override: Json | null
          status: string
          style_id: string | null
          updated_at: string | null
          user_id: string
          wardrobe_id: string | null
        }
        Insert: {
          aspect_ratio?: string | null
          character_id: string
          color_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          credits_spent?: number
          error_message?: string | null
          id?: string
          modal_job_id?: string | null
          nb_takes?: number | null
          prompt_override?: Json | null
          quality?: string | null
          queue_type?: string | null
          retry_after?: string | null
          scene_id?: string | null
          settings_override?: Json | null
          status?: string
          style_id?: string | null
          updated_at?: string | null
          user_id: string
          wardrobe_id?: string | null
        }
        Update: {
          aspect_ratio?: string | null
          character_id?: string
          color_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          credits_spent?: number
          error_message?: string | null
          id?: string
          modal_job_id?: string | null
          nb_takes?: number | null
          prompt_override?: Json | null
          quality?: string | null
          queue_type?: string | null
          retry_after?: string | null
          scene_id?: string | null
          settings_override?: Json | null
          status?: string
          style_id?: string | null
          updated_at?: string | null
          user_id?: string
          wardrobe_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inference_jobs_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inference_jobs_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "style_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inference_jobs_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "style_scenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inference_jobs_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inference_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inference_jobs_wardrobe_id_fkey"
            columns: ["wardrobe_id"]
            isOneToOne: false
            referencedRelation: "style_wardrobes"
            referencedColumns: ["id"]
          },
        ]
      }
      inference_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          last_accessed_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      share_links: {
        Row: {
          aspect_ratio: string | null
          click_count: number | null
          color_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          quality: string | null
          scene_id: string | null
          short_code: string
          signed_image_url: string | null
          style_id: string | null
          user_id: string | null
          wardrobe_id: string | null
        }
        Insert: {
          aspect_ratio?: string | null
          click_count?: number | null
          color_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          quality?: string | null
          scene_id?: string | null
          short_code: string
          signed_image_url?: string | null
          style_id?: string | null
          user_id?: string | null
          wardrobe_id?: string | null
        }
        Update: {
          aspect_ratio?: string | null
          click_count?: number | null
          color_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          quality?: string | null
          scene_id?: string | null
          short_code?: string
          signed_image_url?: string | null
          style_id?: string | null
          user_id?: string | null
          wardrobe_id?: string | null
        }
        Relationships: []
      }
      style_colors: {
        Row: {
          color: string
          created_at: string
          id: string
          label: string
          translations: Json
          updated_at: string
          value: string
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          label: string
          translations?: Json
          updated_at?: string
          value: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          label?: string
          translations?: Json
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      style_scenes: {
        Row: {
          atmosphere: string | null
          created_at: string
          id: string
          image: string
          label: string
          prompt: string | null
          translations: Json
          updated_at: string
          value: string
        }
        Insert: {
          atmosphere?: string | null
          created_at?: string
          id?: string
          image: string
          label: string
          prompt?: string | null
          translations?: Json
          updated_at?: string
          value: string
        }
        Update: {
          atmosphere?: string | null
          created_at?: string
          id?: string
          image?: string
          label?: string
          prompt?: string | null
          translations?: Json
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      style_wardrobes: {
        Row: {
          category: string
          created_at: string
          gender: string
          id: string
          image: string
          label: string
          prompt: string | null
          translations: Json
          updated_at: string
          value: string
        }
        Insert: {
          category: string
          created_at?: string
          gender?: string
          id?: string
          image: string
          label: string
          prompt?: string | null
          translations?: Json
          updated_at?: string
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          gender?: string
          id?: string
          image?: string
          label?: string
          prompt?: string | null
          translations?: Json
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      styles: {
        Row: {
          available_colors: string[]
          available_scenes: string[]
          available_wardrobes: string[]
          created_at: string | null
          id: string
          lora_path: string | null
          name: string
          preview_images: Json
          prompt: string | null
          settings: Json
          translations: Json
          updated_at: string | null
          wardrobe_category_order: string[]
          wardrobe_order: Json
        }
        Insert: {
          available_colors?: string[]
          available_scenes?: string[]
          available_wardrobes?: string[]
          created_at?: string | null
          id?: string
          lora_path?: string | null
          name: string
          preview_images?: Json
          prompt?: string | null
          settings?: Json
          translations?: Json
          updated_at?: string | null
          wardrobe_category_order?: string[]
          wardrobe_order?: Json
        }
        Update: {
          available_colors?: string[]
          available_scenes?: string[]
          available_wardrobes?: string[]
          created_at?: string | null
          id?: string
          lora_path?: string | null
          name?: string
          preview_images?: Json
          prompt?: string | null
          settings?: Json
          translations?: Json
          updated_at?: string | null
          wardrobe_category_order?: string[]
          wardrobe_order?: Json
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          character_training_included: number
          concurrent_jobs: number
          concurrent_trainings: number | null
          created_at: string | null
          credits: number
          description: string | null
          disabled: boolean
          display_name: string
          features: Json | null
          id: number
          image_url: string | null
          max_characters: number
          max_quality: string
          monthly_price: number
          name: string
          original_price: number
          popular: boolean | null
          queue_type: string
          translations: Json | null
          updated_at: string | null
          yearly_price: number
        }
        Insert: {
          character_training_included: number
          concurrent_jobs: number
          concurrent_trainings?: number | null
          created_at?: string | null
          credits: number
          description?: string | null
          disabled?: boolean
          display_name: string
          features?: Json | null
          id?: number
          image_url?: string | null
          max_characters: number
          max_quality: string
          monthly_price: number
          name: string
          original_price: number
          popular?: boolean | null
          queue_type?: string
          translations?: Json | null
          updated_at?: string | null
          yearly_price: number
        }
        Update: {
          character_training_included?: number
          concurrent_jobs?: number
          concurrent_trainings?: number | null
          created_at?: string | null
          credits?: number
          description?: string | null
          disabled?: boolean
          display_name?: string
          features?: Json | null
          id?: number
          image_url?: string | null
          max_characters?: number
          max_quality?: string
          monthly_price?: number
          name?: string
          original_price?: number
          popular?: boolean | null
          queue_type?: string
          translations?: Json | null
          updated_at?: string | null
          yearly_price?: number
        }
        Relationships: []
      }
      training_jobs: {
        Row: {
          character_id: string
          completed_at: string | null
          created_at: string | null
          credits_spent: number | null
          error_message: string | null
          gpu_type: string | null
          id: string
          modal_job_id: string | null
          retry_after: string | null
          retry_count: number
          started_at: string | null
          status: string
          training_params: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          character_id: string
          completed_at?: string | null
          created_at?: string | null
          credits_spent?: number | null
          error_message?: string | null
          gpu_type?: string | null
          id?: string
          modal_job_id?: string | null
          retry_after?: string | null
          retry_count?: number
          started_at?: string | null
          status?: string
          training_params?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          character_id?: string
          completed_at?: string | null
          created_at?: string | null
          credits_spent?: number | null
          error_message?: string | null
          gpu_type?: string | null
          id?: string
          modal_job_id?: string | null
          retry_after?: string | null
          retry_count?: number
          started_at?: string | null
          status?: string
          training_params?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_jobs_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_images: {
        Row: {
          character_id: string | null
          created_at: string | null
          dimensions: Json | null
          file_name: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          quality_score: number | null
          url: string
          user_id: string | null
        }
        Insert: {
          character_id?: string | null
          created_at?: string | null
          dimensions?: Json | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          quality_score?: number | null
          url: string
          user_id?: string | null
        }
        Update: {
          character_id?: string | null
          created_at?: string | null
          dimensions?: Json | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          quality_score?: number | null
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_uploaded_images_character_id"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          created_at: string | null
          credits: number
          description: string | null
          expires_at: string | null
          id: string
          invoice_id: string | null
          metadata: Json | null
          source_id: string | null
          source_type: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits: number
          description?: string | null
          expires_at?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          source_id?: string | null
          source_type: string
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits?: number
          description?: string | null
          expires_at?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          source_id?: string | null
          source_type?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string | null
          preferred_language: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          preferred_language?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          preferred_language?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          last_awarded_month: number | null
          plan_name: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_awarded_month?: number | null
          plan_name: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_awarded_month?: number | null
          plan_name?: string
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          admin: boolean
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          admin?: boolean
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          admin?: boolean
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string | null
          error: string | null
          event_type: string
          id: string
          processed_at: string | null
          received_at: string | null
          result: Json | null
          retry_count: number | null
          status: string
          stripe_event_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          event_type: string
          id?: string
          processed_at?: string | null
          received_at?: string | null
          result?: Json | null
          retry_count?: number | null
          status?: string
          stripe_event_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          event_type?: string
          id?: string
          processed_at?: string | null
          received_at?: string | null
          result?: Json | null
          retry_count?: number | null
          status?: string
          stripe_event_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      array_distinct: {
        Args: { arr: string[] } | { arr: unknown }
        Returns: unknown
      }
      award_monthly_subscription_credits: {
        Args: {
          p_month_number: number
          p_plan_name: string
          p_subscription_id: string
          p_user_id: string
        }
        Returns: Json
      }
      award_subscription_credits: {
        Args: {
          p_credits: number
          p_description: string
          p_expires_at: string
          p_metadata: Json
          p_period_end: string
          p_period_start: string
          p_subscription_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      award_subscription_credits_idempotent: {
        Args: {
          p_credits: number
          p_description: string
          p_expires_at: string
          p_invoice_id: string
          p_metadata: Json
          p_month_number: number
          p_period_end: string
          p_period_start: string
          p_subscription_id: string
          p_user_id: string
        }
        Returns: Json
      }
      calculate_user_credit_balance: {
        Args: { user_uuid: string }
        Returns: number
      }
      claim_next_queued_inference_job: {
        Args: Record<PropertyKey, never>
        Returns: {
          aspect_ratio: string | null
          character_id: string
          color_id: string | null
          completed_at: string | null
          created_at: string | null
          credits_spent: number
          error_message: string | null
          id: string
          modal_job_id: string | null
          nb_takes: number | null
          prompt_override: Json | null
          quality: string | null
          queue_type: string | null
          retry_after: string | null
          scene_id: string | null
          settings_override: Json | null
          status: string
          style_id: string | null
          updated_at: string | null
          user_id: string
          wardrobe_id: string | null
        }
      }
      claim_next_queued_training_job: {
        Args: Record<PropertyKey, never>
        Returns: {
          character_id: string
          completed_at: string | null
          created_at: string | null
          credits_spent: number | null
          error_message: string | null
          gpu_type: string | null
          id: string
          modal_job_id: string | null
          retry_after: string | null
          retry_count: number
          started_at: string | null
          status: string
          training_params: Json | null
          updated_at: string | null
          user_id: string
        }
      }
      cleanup_stuck_inference_jobs: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_taken: string
          job_id: string
          status: string
          stuck_duration: unknown
          user_id: string
        }[]
      }
      expire_credit_pack_credits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      expire_credits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      expire_subscription_credits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      force_cleanup_upload_session: {
        Args: { session_id: string }
        Returns: undefined
      }
      get_active_training_jobs: {
        Args: Record<PropertyKey, never>
        Returns: {
          character_id: string
          created_at: string
          id: string
          modal_job_id: string
          retry_after: string
          retry_count: number
          status: string
          updated_at: string
          user_id: string
        }[]
      }
      get_language_preference: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_pricing_last_updated: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_revenue_data: {
        Args: { end_date: string; start_date: string }
        Returns: {
          credit_pack_revenue: number
          refund_amount: number
          subscription_revenue: number
        }[]
      }
      get_subscriptions_needing_monthly_credits: {
        Args: Record<PropertyKey, never>
        Returns: {
          credits_per_month: number
          last_awarded_month: number
          months_due: number
          months_elapsed: number
          plan_name: string
          subscription_id: string
          subscription_start: string
          user_id: string
        }[]
      }
      get_top_users_by_generations: {
        Args: { limit_count?: number }
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          generation_count: number
          id: string
          subscription_plan: string
          training_count: number
        }[]
      }
      get_uploaded_image_counts: {
        Args: { character_ids: string[] }
        Returns: {
          character_id: string
          uploaded_count: number
        }[]
      }
      get_user_available_credits: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_user_credit_balance: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_user_language: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      increment_image_count: {
        Args: { character_id: string }
        Returns: undefined
      }
      process_credit_pack_purchase: {
        Args: {
          p_amount_paid: number
          p_credits: number
          p_description: string
          p_expires_at: string
          p_metadata: Json
          p_payment_intent_id: string
          p_price_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      refund_credits_with_idempotency: {
        Args: {
          p_amount: number
          p_idempotency_key: string
          p_job_id: string
          p_reason: string
          p_user_id: string
        }
        Returns: {
          error_message: string
          refund_created: boolean
          success: boolean
        }[]
      }
      set_user_language: {
        Args: { new_language: string }
        Returns: undefined
      }
      should_cleanup_stuck_inference_jobs: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      should_trigger_inference_queue: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      should_trigger_training_queue: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      spend_credits_with_job_tracking: {
        Args: {
          p_amount: number
          p_description?: string
          p_job_id: string
          p_metadata?: Json
          p_usage_type: string
          p_user_id: string
        }
        Returns: {
          current_balance: number
          error_message: string
          success: boolean
        }[]
      }
      spend_user_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_metadata?: Json
          p_usage_type: string
          p_user_id: string
        }
        Returns: {
          success: boolean
        }[]
      }
      update_language_preference: {
        Args: { new_language: string }
        Returns: undefined
      }
      upsert_subscription: {
        Args: {
          p_cancel_at_period_end: boolean
          p_current_period_end: string
          p_current_period_start: string
          p_plan_name: string
          p_status: string
          p_stripe_customer_id: string
          p_stripe_price_id: string
          p_stripe_subscription_id: string
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

A new version of Supabase CLI is available: v2.58.5 (currently installed v2.48.3)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
