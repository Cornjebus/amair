export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
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
      children: {
        Row: {
          age: number | null
          avatar_url: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_accounts: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          lifetime_credits: number
          tier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          lifetime_credits?: number
          tier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          lifetime_credits?: number
          tier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_costs: {
        Row: {
          base_cost: number
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          operation: string
          updated_at: string | null
        }
        Insert: {
          base_cost: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          operation: string
          updated_at?: string | null
        }
        Update: {
          base_cost?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          operation?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          bonus_credits: number | null
          created_at: string | null
          credits: number
          currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          metadata: Json | null
          name: string
          price_cents: number
          sort_order: number | null
          stripe_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          bonus_credits?: number | null
          created_at?: string | null
          credits: number
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
          name: string
          price_cents: number
          sort_order?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bonus_credits?: number | null
          created_at?: string | null
          credits?: number
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
          name?: string
          price_cents?: number
          sort_order?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_purchases: {
        Row: {
          amount_cents: number
          bonus_credits: number | null
          completed_at: string | null
          created_at: string | null
          credits_purchased: number
          currency: string | null
          id: string
          metadata: Json | null
          package_id: string | null
          status: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          bonus_credits?: number | null
          completed_at?: string | null
          created_at?: string | null
          credits_purchased: number
          currency?: string | null
          id?: string
          metadata?: Json | null
          package_id?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          bonus_credits?: number | null
          completed_at?: string | null
          created_at?: string | null
          credits_purchased?: number
          currency?: string | null
          id?: string
          metadata?: Json | null
          package_id?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_purchases_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          related_entity_id: string | null
          related_entity_type: string | null
          type: Database["public"]["Enums"]["credit_transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          type: Database["public"]["Enums"]["credit_transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          type?: Database["public"]["Enums"]["credit_transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_challenges: {
        Row: {
          challenge_items: string[]
          child_story: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          challenge_items: string[]
          child_story?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          challenge_items?: string[]
          child_story?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_packages: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          display_order: number | null
          duration_months: number
          id: string
          is_active: boolean | null
          name: string
          price_cents: number
          slug: string
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          duration_months: number
          id?: string
          is_active?: boolean | null
          name: string
          price_cents: number
          slug: string
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          duration_months?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price_cents?: number
          slug?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
        }
        Relationships: []
      }
      gift_subscriptions: {
        Row: {
          created_at: string | null
          currency: string | null
          delivery_date: string | null
          duration_months: number
          expires_at: string
          gift_message: string | null
          gift_package_id: string
          id: string
          price_paid_cents: number
          purchased_at: string | null
          purchaser_email: string
          purchaser_name: string | null
          purchaser_user_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          recipient_user_id: string | null
          redeemed_at: string | null
          redemption_code: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          delivery_date?: string | null
          duration_months: number
          expires_at?: string
          gift_message?: string | null
          gift_package_id: string
          id?: string
          price_paid_cents: number
          purchased_at?: string | null
          purchaser_email: string
          purchaser_name?: string | null
          purchaser_user_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_user_id?: string | null
          redeemed_at?: string | null
          redemption_code: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          delivery_date?: string | null
          duration_months?: number
          expires_at?: string
          gift_message?: string | null
          gift_package_id?: string
          id?: string
          price_paid_cents?: number
          purchased_at?: string | null
          purchaser_email?: string
          purchaser_name?: string | null
          purchaser_user_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_user_id?: string | null
          redeemed_at?: string | null
          redemption_code?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_subscriptions_gift_package_id_fkey"
            columns: ["gift_package_id"]
            isOneToOne: false
            referencedRelation: "gift_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_subscriptions_purchaser_user_id_fkey"
            columns: ["purchaser_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_subscriptions_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          ai_model: string | null
          ai_provider: string | null
          audio_url: string | null
          content: string
          created_at: string | null
          feedback: string | null
          id: string
          is_favorite: boolean | null
          length: Database["public"]["Enums"]["story_length"]
          quality_score: number | null
          rating: number | null
          regeneration_count: number | null
          title: string
          tone: Database["public"]["Enums"]["story_tone"]
          updated_at: string | null
          user_id: string
          voice_config: Json | null
          voice_provider: string | null
          word_count: number
        }
        Insert: {
          ai_model?: string | null
          ai_provider?: string | null
          audio_url?: string | null
          content: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          is_favorite?: boolean | null
          length: Database["public"]["Enums"]["story_length"]
          quality_score?: number | null
          rating?: number | null
          regeneration_count?: number | null
          title: string
          tone: Database["public"]["Enums"]["story_tone"]
          updated_at?: string | null
          user_id: string
          voice_config?: Json | null
          voice_provider?: string | null
          word_count: number
        }
        Update: {
          ai_model?: string | null
          ai_provider?: string | null
          audio_url?: string | null
          content?: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          is_favorite?: boolean | null
          length?: Database["public"]["Enums"]["story_length"]
          quality_score?: number | null
          rating?: number | null
          regeneration_count?: number | null
          title?: string
          tone?: Database["public"]["Enums"]["story_tone"]
          updated_at?: string | null
          user_id?: string
          voice_config?: Json | null
          voice_provider?: string | null
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      story_seeds: {
        Row: {
          child_name: string
          created_at: string | null
          id: string
          seed_items: string[]
          story_id: string
        }
        Insert: {
          child_name: string
          created_at?: string | null
          id?: string
          seed_items: string[]
          story_id: string
        }
        Update: {
          child_name?: string
          created_at?: string | null
          id?: string
          seed_items?: string[]
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_seeds_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_history: {
        Row: {
          billing_cycle: string | null
          created_at: string | null
          event_type: string
          from_tier: Database["public"]["Enums"]["subscription_tier"] | null
          id: string
          metadata: Json | null
          to_tier: Database["public"]["Enums"]["subscription_tier"] | null
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string | null
          event_type: string
          from_tier?: Database["public"]["Enums"]["subscription_tier"] | null
          id?: string
          metadata?: Json | null
          to_tier?: Database["public"]["Enums"]["subscription_tier"] | null
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string | null
          event_type?: string
          from_tier?: Database["public"]["Enums"]["subscription_tier"] | null
          id?: string
          metadata?: Json | null
          to_tier?: Database["public"]["Enums"]["subscription_tier"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_prices: {
        Row: {
          billing_cycle: string
          created_at: string | null
          currency: string | null
          id: string
          is_active: boolean | null
          price_cents: number
          stripe_price_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
        }
        Insert: {
          billing_cycle: string
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          price_cents: number
          stripe_price_id?: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          price_cents?: number
          stripe_price_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
        }
        Relationships: []
      }
      tier_limits: {
        Row: {
          created_at: string | null
          features: Json | null
          max_children: number
          max_saved_stories: number
          monthly_premium_voices: number
          monthly_stories: number
          tier_name: Database["public"]["Enums"]["subscription_tier"]
        }
        Insert: {
          created_at?: string | null
          features?: Json | null
          max_children: number
          max_saved_stories: number
          monthly_premium_voices: number
          monthly_stories: number
          tier_name: Database["public"]["Enums"]["subscription_tier"]
        }
        Update: {
          created_at?: string | null
          features?: Json | null
          max_children?: number
          max_saved_stories?: number
          monthly_premium_voices?: number
          monthly_stories?: number
          tier_name?: Database["public"]["Enums"]["subscription_tier"]
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          billing_period_end: string
          billing_period_start: string
          created_at: string | null
          id: string
          premium_voices_used: number | null
          stories_generated: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_period_end: string
          billing_period_start: string
          created_at?: string | null
          id?: string
          premium_voices_used?: number | null
          stories_generated?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string | null
          id?: string
          premium_voices_used?: number | null
          stories_generated?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          billing_cycle: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          gift_subscription_id: string | null
          id: string
          premium_voices_used: number | null
          status: string
          stories_used: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          gift_subscription_id?: string | null
          id?: string
          premium_voices_used?: number | null
          status?: string
          stories_used?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          gift_subscription_id?: string | null
          id?: string
          premium_voices_used?: number | null
          status?: string
          stories_used?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          clerk_id: string
          created_at: string | null
          current_period_end: string | null
          email: string
          id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_end_date: string | null
          subscription_period_start: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at: string | null
        }
        Insert: {
          clerk_id: string
          created_at?: string | null
          current_period_end?: string | null
          email: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_period_start?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at?: string | null
        }
        Update: {
          clerk_id?: string
          created_at?: string | null
          current_period_end?: string | null
          email?: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_period_start?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      user_credit_summary: {
        Row: {
          account_created: string | null
          balance: number | null
          lifetime_credits: number | null
          tier: string | null
          total_purchased: number | null
          total_spent: number | null
          total_transactions: number | null
          user_id: string | null
        }
        Insert: {
          account_created?: string | null
          balance?: number | null
          lifetime_credits?: number | null
          tier?: string | null
          total_purchased?: never
          total_spent?: never
          total_transactions?: never
          user_id?: string | null
        }
        Update: {
          account_created?: string | null
          balance?: number | null
          lifetime_credits?: number | null
          tier?: string | null
          total_purchased?: never
          total_spent?: never
          total_transactions?: never
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_credits: {
        Args: {
          p_amount: number
          p_description: string
          p_metadata?: Json
          p_type: Database["public"]["Enums"]["credit_transaction_type"]
          p_user_id: string
        }
        Returns: {
          error_message: string
          new_balance: number
          success: boolean
          transaction_id: string
        }[]
      }
      can_generate_story: {
        Args: { p_use_premium_voice?: boolean; p_user_id: string }
        Returns: {
          allowed: boolean
          premium_voices_remaining: number
          reason: string
          stories_remaining: number
        }[]
      }
      deduct_credits: {
        Args: {
          p_amount: number
          p_reason: string
          p_related_entity_id?: string
          p_related_entity_type?: string
          p_user_id: string
        }
        Returns: {
          error_message: string
          new_balance: number
          success: boolean
          transaction_id: string
        }[]
      }
      generate_gift_code: { Args: never; Returns: string }
      record_story_generation: {
        Args: { p_used_premium_voice?: boolean; p_user_id: string }
        Returns: {
          premium_voices_remaining: number
          stories_remaining: number
          success: boolean
        }[]
      }
      redeem_gift_code: {
        Args: { p_redemption_code: string; p_user_id: string }
        Returns: {
          duration_months: number
          error_message: string
          new_period_end: string
          success: boolean
          tier: Database["public"]["Enums"]["subscription_tier"]
        }[]
      }
      reset_subscription_usage: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      credit_transaction_type:
        | "purchase"
        | "usage"
        | "bonus"
        | "refund"
        | "gift"
        | "subscription"
        | "adjustment"
      story_length: "quick" | "medium" | "epic"
      story_tone: "bedtime-calm" | "funny" | "adventure" | "mystery"
      subscription_status: "free" | "premium" | "trial"
      subscription_tier:
        | "free"
        | "dream_weaver"
        | "magic_circle"
        | "enchanted_library"
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
    Enums: {
      credit_transaction_type: [
        "purchase",
        "usage",
        "bonus",
        "refund",
        "gift",
        "subscription",
        "adjustment",
      ],
      story_length: ["quick", "medium", "epic"],
      story_tone: ["bedtime-calm", "funny", "adventure", "mystery"],
      subscription_status: ["free", "premium", "trial"],
      subscription_tier: [
        "free",
        "dream_weaver",
        "magic_circle",
        "enchanted_library",
      ],
    },
  },
} as const
