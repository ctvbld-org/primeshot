export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          expires_at?: string
        }
      }
      compositions: {
        Row: {
          id: string
          user_id: string
          name: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      images: {
        Row: {
          id: string
          composition_id: string
          user_id: string
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          composition_id: string
          user_id: string
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          composition_id?: string
          user_id?: string
          url?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 