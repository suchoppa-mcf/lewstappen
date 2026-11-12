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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      hardware_enquiries: {
        Row: {
          area: string
          created_at: string
          details: string
          device: string
          email: string
          goals: string
          id: string
          model: string
          name: string
        }
        Insert: {
          area: string
          created_at?: string
          details?: string
          device: string
          email: string
          goals: string
          id: string
          model?: string
          name: string
        }
        Update: {
          area?: string
          created_at?: string
          details?: string
          device?: string
          email?: string
          goals?: string
          id?: string
          model?: string
          name?: string
        }
        Relationships: []
      }
      modernizations: {
        Row: {
          created_at: string
          id: string
          input: string
          raw: string
          source: string
          target: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input: string
          raw: string
          source: string
          target: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          input?: string
          raw?: string
          source?: string
          target?: string
          user_id?: string
        }
        Relationships: []
      }
      presets: {
        Row: {
          created_at: string
          goals: Json
          id: string
          name: string
          source: string
          target: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goals?: Json
          id?: string
          name: string
          source: string
          target: string
          user_id?: string
        }
        Update: {
          created_at?: string
          goals?: Json
          id?: string
          name?: string
          source?: string
          target?: string
          user_id?: string
        }
        Relationships: []
      }
      pricing_settings: {
        Row: {
          all_plans_free: boolean
          id: string
          is_active: boolean
          promo_description: string
          special_tag: string
        }
        Insert: {
          all_plans_free?: boolean
          id?: string
          is_active?: boolean
          promo_description?: string
          special_tag?: string
        }
        Update: {
          all_plans_free?: boolean
          id?: string
          is_active?: boolean
          promo_description?: string
          special_tag?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          is_active: boolean
          max_uses: number | null
          uses: number
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          is_active?: boolean
          max_uses?: number | null
          uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          is_active?: boolean
          max_uses?: number | null
          uses?: number
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          code: string
          created_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["code"]
          },
        ]
      }
      special_access_whitelist: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          created_at: string
          id: string
          source: string
          target: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          source: string
          target: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          source?: string
          target?: string
          user_id?: string
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          has_special_access: boolean
          tier: string
          trials_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          has_special_access?: boolean
          tier?: string
          trials_used?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          has_special_access?: boolean
          tier?: string
          trials_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_free_plan: {
        Args: { selected_tier: string }
        Returns: {
          has_special_access: boolean
          tier: string
          trials_used: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_plans"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      developer_overview: { Args: never; Returns: Json }
      developer_update_account: {
        Args: {
          account_id: string
          reset_trials: boolean
          selected_tier: string
          special_access: boolean
        }
        Returns: undefined
      }
      has_special_eligibility: { Args: never; Returns: boolean }
      is_developer: { Args: never; Returns: boolean }
      redeem_promo: { Args: { entered_code: string }; Returns: boolean }
      refund_basic_trial: { Args: never; Returns: undefined }
      refund_basic_trial_for_user: {
        Args: { account_id: string }
        Returns: undefined
      }
      reserve_basic_trial: { Args: { code_text: string }; Returns: boolean }
    }
    Enums: {
      app_role: "developer"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["developer"],
    },
  },
} as const
