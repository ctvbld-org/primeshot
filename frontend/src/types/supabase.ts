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
      completed_user_journeys: {
        Row: {
          completed_at: string
          created_at: string | null
          id: string
          journey_data: Json
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at: string
          created_at?: string | null
          id?: string
          journey_data: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string
          created_at?: string | null
          id?: string
          journey_data?: Json
          updated_at?: string | null
          user_id?: string | null
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
          style_id: string | null
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
          style_id?: string | null
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
          style_id?: string | null
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
          file_name: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          order_id: string | null
          quality_score: number | null
          url: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          dimensions?: Json | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          order_id?: string | null
          quality_score?: number | null
          url: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          dimensions?: Json | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          order_id?: string | null
          quality_score?: number | null
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "images_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number | null
          checkout_session_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          idempotency_key: string | null
          metadata: Json | null
          payment_intent_id: string | null
          payment_status: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          checkout_session_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          payment_intent_id?: string | null
          payment_status?: string | null
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          checkout_session_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          payment_intent_id?: string | null
          payment_status?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
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
        Relationships: []
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
      user_language_preferences: {
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
      user_progress: {
        Row: {
          completed_stages: Database["public"]["Enums"]["flow_stage"][]
          created_at: string | null
          current_stage: Database["public"]["Enums"]["flow_stage"]
          id: string
          last_active_at: string | null
          stage_data: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_stages?: Database["public"]["Enums"]["flow_stage"][]
          created_at?: string | null
          current_stage: Database["public"]["Enums"]["flow_stage"]
          id?: string
          last_active_at?: string | null
          stage_data?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_stages?: Database["public"]["Enums"]["flow_stage"][]
          created_at?: string | null
          current_stage?: Database["public"]["Enums"]["flow_stage"]
          id?: string
          last_active_at?: string | null
          stage_data?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          age: number | null
          body_type: string | null
          created_at: string
          ethnicity: string | null
          eye_color: string | null
          glasses: boolean | null
          hair_color: string | null
          hair_length: string | null
          hair_style: string | null
          height: number | null
          id: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          age?: number | null
          body_type?: string | null
          created_at?: string
          ethnicity?: string | null
          eye_color?: string | null
          glasses?: boolean | null
          hair_color?: string | null
          hair_length?: string | null
          hair_style?: string | null
          height?: number | null
          id: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          age?: number | null
          body_type?: string | null
          created_at?: string
          ethnicity?: string | null
          eye_color?: string | null
          glasses?: boolean | null
          hair_color?: string | null
          hair_length?: string | null
          hair_style?: string | null
          height?: number | null
          id?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      flow_stage: "shoot" | "payment" | "upload" | "review" | "albums"
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
    Enums: {
      flow_stage: ["shoot", "payment", "upload", "review", "albums"],
    },
  },
} as const

