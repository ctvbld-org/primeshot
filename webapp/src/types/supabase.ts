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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
        Relationships: []
      }
      credit_usage: {
        Row: {
          batch_size: number | null
          created_at: string | null
          credits_used: number
          id: string
          job_id: string | null
          metadata: Json | null
          resolution: string | null
          usage_type: string
          user_id: string
        }
        Insert: {
          batch_size?: number | null
          created_at?: string | null
          credits_used: number
          id?: string
          job_id?: string | null
          metadata?: Json | null
          resolution?: string | null
          usage_type: string
          user_id: string
        }
        Update: {
          batch_size?: number | null
          created_at?: string | null
          credits_used?: number
          id?: string
          job_id?: string | null
          metadata?: Json | null
          resolution?: string | null
          usage_type?: string
          user_id?: string
        }
        Relationships: []
      }
      face_models: {
        Row: {
          created_at: string | null
          id: string
          image_count: number | null
          name: string
          status: string
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_count?: number | null
          name: string
          status?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_count?: number | null
          name?: string
          status?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generated_images: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          status: string
          storage_path: string
          style_id: string
          updated_at: string
          upload_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          status: string
          storage_path: string
          style_id: string
          updated_at?: string
          upload_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          storage_path?: string
          style_id?: string
          updated_at?: string
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_images_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_images_style_id_fkey1"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_images_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      images: {
        Row: {
          created_at: string | null
          dimensions: Json | null
          face_model_id: string | null
          file_name: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          quality_score: number | null
          url: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          dimensions?: Json | null
          face_model_id?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          quality_score?: number | null
          url: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          dimensions?: Json | null
          face_model_id?: string | null
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
            foreignKeyName: "fk_images_face_model_id"
            columns: ["face_model_id"]
            isOneToOne: false
            referencedRelation: "face_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inference_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          face_model_id: string
          id: string
          status: string
          style_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          face_model_id: string
          id?: string
          status?: string
          style_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          face_model_id?: string
          id?: string
          status?: string
          style_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inference_jobs_face_model_id_fkey"
            columns: ["face_model_id"]
            isOneToOne: false
            referencedRelation: "face_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inference_jobs_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number | null
          checkout_session_id: string | null
          created_at: string | null
          credits_used: number | null
          currency: string | null
          id: string
          idempotency_key: string | null
          metadata: Json | null
          payment_intent_id: string | null
          payment_status: string | null
          status: string
          subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          checkout_session_id?: string | null
          created_at?: string | null
          credits_used?: number | null
          currency?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          payment_intent_id?: string | null
          payment_status?: string | null
          status: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          checkout_session_id?: string | null
          created_at?: string | null
          credits_used?: number | null
          currency?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          payment_intent_id?: string | null
          payment_status?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      style_configs: {
        Row: {
          available_backgrounds: string[]
          available_clothing: string[]
          available_clothing_colors: string[]
          available_genders: string[]
          created_at: string | null
          description: string | null
          id: string
          name: string
          preview_images: Json
          tagline: string | null
          translations: Json
          updated_at: string | null
        }
        Insert: {
          available_backgrounds?: string[]
          available_clothing?: string[]
          available_clothing_colors?: string[]
          available_genders?: string[]
          created_at?: string | null
          description?: string | null
          id: string
          name: string
          preview_images?: Json
          tagline?: string | null
          translations?: Json
          updated_at?: string | null
        }
        Update: {
          available_backgrounds?: string[]
          available_clothing?: string[]
          available_clothing_colors?: string[]
          available_genders?: string[]
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          preview_images?: Json
          tagline?: string | null
          translations?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      style_options: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          label: string
          options: Json
          translations: Json
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          label: string
          options?: Json
          translations?: Json
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          label?: string
          options?: Json
          translations?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      styles: {
        Row: {
          created_at: string | null
          id: string
          name: string
          order_id: string | null
          prompt: string | null
          settings: Json
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name: string
          order_id?: string | null
          prompt?: string | null
          settings?: Json
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          order_id?: string | null
          prompt?: string | null
          settings?: Json
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "styles_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "styles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      training_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          face_model_id: string
          id: string
          modal_job_id: string | null
          started_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          face_model_id: string
          id?: string
          modal_job_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          face_model_id?: string
          id?: string
          modal_job_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_jobs_face_model_id_fkey"
            columns: ["face_model_id"]
            isOneToOne: false
            referencedRelation: "face_models"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_chunks: {
        Row: {
          chunk_index: number
          chunk_size: number
          created_at: string
          id: string
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          chunk_index: number
          chunk_size: number
          created_at?: string
          id?: string
          session_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          chunk_index?: number
          chunk_size?: number
          created_at?: string
          id?: string
          session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "upload_chunks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "upload_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_sessions: {
        Row: {
          completed_chunks: number | null
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          final_url: string | null
          id: string
          metadata: Json | null
          order_id: string
          quality_score: number | null
          status: string
          total_chunks: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_chunks?: number | null
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          final_url?: string | null
          id?: string
          metadata?: Json | null
          order_id: string
          quality_score?: number | null
          status?: string
          total_chunks: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_chunks?: number | null
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          final_url?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string
          quality_score?: number | null
          status?: string
          total_chunks?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upload_sessions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
          metadata?: Json | null
          source_id?: string | null
          source_type?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
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
          plan_name?: string
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      array_distinct: {
        Args: { arr: string[] } | { arr: unknown }
        Returns: string[]
      }
      expire_credits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      force_cleanup_upload_session: {
        Args: { session_id: string }
        Returns: undefined
      }
      get_language_preference: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_credit_balance: {
        Args: { p_user_id: string }
        Returns: number
      }
      increment_image_count: {
        Args: { face_model_id: string }
        Returns: undefined
      }
      spend_user_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_usage_type: string
          p_description?: string
          p_metadata?: Json
        }
        Returns: boolean
      }
      update_language_preference: {
        Args: { new_language: string }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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

