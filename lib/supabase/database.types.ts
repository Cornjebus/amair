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
          clerk_id: string
          email: string
          created_at: string
          updated_at: string
          subscription_status: 'free' | 'premium' | 'trial'
          subscription_end_date: string | null
          stripe_customer_id: string | null
        }
        Insert: {
          id?: string
          clerk_id: string
          email: string
          created_at?: string
          updated_at?: string
          subscription_status?: 'free' | 'premium' | 'trial'
          subscription_end_date?: string | null
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          clerk_id?: string
          email?: string
          created_at?: string
          updated_at?: string
          subscription_status?: 'free' | 'premium' | 'trial'
          subscription_end_date?: string | null
          stripe_customer_id?: string | null
        }
      }
      children: {
        Row: {
          id: string
          user_id: string
          name: string
          age: number | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stories: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          tone: 'bedtime-calm' | 'funny' | 'adventure' | 'mystery'
          length: 'quick' | 'medium' | 'epic'
          created_at: string
          updated_at: string
          is_favorite: boolean
          audio_url: string | null
          word_count: number
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          tone: 'bedtime-calm' | 'funny' | 'adventure' | 'mystery'
          length: 'quick' | 'medium' | 'epic'
          created_at?: string
          updated_at?: string
          is_favorite?: boolean
          audio_url?: string | null
          word_count: number
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          tone?: 'bedtime-calm' | 'funny' | 'adventure' | 'mystery'
          length?: 'quick' | 'medium' | 'epic'
          created_at?: string
          updated_at?: string
          is_favorite?: boolean
          audio_url?: string | null
          word_count?: number
        }
      }
      story_seeds: {
        Row: {
          id: string
          story_id: string
          child_name: string
          seed_items: string[]
          created_at: string
        }
        Insert: {
          id?: string
          story_id: string
          child_name: string
          seed_items: string[]
          created_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          child_name?: string
          seed_items?: string[]
          created_at?: string
        }
      }
      daily_challenges: {
        Row: {
          id: string
          user_id: string
          challenge_items: string[]
          child_story: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          challenge_items: string[]
          child_story?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          challenge_items?: string[]
          child_story?: string | null
          completed_at?: string | null
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
      subscription_status: 'free' | 'premium' | 'trial'
      story_tone: 'bedtime-calm' | 'funny' | 'adventure' | 'mystery'
      story_length: 'quick' | 'medium' | 'epic'
    }
  }
}
