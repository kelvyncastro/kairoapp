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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      consistency_days: {
        Row: {
          created_at: string | null
          date: string
          id: string
          is_active: boolean | null
          reason: string | null
          streak_snapshot: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          is_active?: boolean | null
          reason?: string | null
          streak_snapshot?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          is_active?: boolean | null
          reason?: string | null
          streak_snapshot?: number | null
          user_id?: string
        }
        Relationships: []
      }
      daily_tasks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          is_recurring: boolean | null
          priority: number | null
          recurring_rule: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          priority?: number | null
          recurring_rule?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          priority?: number | null
          recurring_rule?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ebook_content: {
        Row: {
          content_markdown: string | null
          id: string
          section_key: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content_markdown?: string | null
          id?: string
          section_key: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content_markdown?: string | null
          id?: string
          section_key?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string | null
          id: string
          muscle_group: string | null
          name: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          muscle_group?: string | null
          name: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          muscle_group?: string | null
          name?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      finance_sectors: {
        Row: {
          color_label: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color_label?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color_label?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          id: string
          name: string
          sector_id: string | null
          updated_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          name: string
          sector_id?: string | null
          updated_at?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          name?: string
          sector_id?: string | null
          updated_at?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "finance_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      food_items: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string | null
          fat: number | null
          fiber: number | null
          id: string
          meal_id: string
          name: string
          protein: number | null
          quantity_text: string | null
          source: Database["public"]["Enums"]["food_source"] | null
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          fat?: number | null
          fiber?: number | null
          id?: string
          meal_id: string
          name: string
          protein?: number | null
          quantity_text?: string | null
          source?: Database["public"]["Enums"]["food_source"] | null
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          fat?: number | null
          fiber?: number | null
          id?: string
          meal_id?: string
          name?: string
          protein?: number | null
          quantity_text?: string | null
          source?: Database["public"]["Enums"]["food_source"] | null
        }
        Relationships: [
          {
            foreignKeyName: "food_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string | null
          current_value: number
          description: string | null
          end_date: string
          id: string
          start_date: string
          status: Database["public"]["Enums"]["goal_status"] | null
          target_value: number
          title: string
          type: Database["public"]["Enums"]["goal_type"]
          unit_label: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_value?: number
          description?: string | null
          end_date: string
          id?: string
          start_date: string
          status?: Database["public"]["Enums"]["goal_status"] | null
          target_value?: number
          title: string
          type: Database["public"]["Enums"]["goal_type"]
          unit_label?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_value?: number
          description?: string | null
          end_date?: string
          id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["goal_status"] | null
          target_value?: number
          title?: string
          type?: Database["public"]["Enums"]["goal_type"]
          unit_label?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          created_at: string | null
          id: string
          name: string
          nutrition_day_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          nutrition_day_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          nutrition_day_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_nutrition_day_id_fkey"
            columns: ["nutrition_day_id"]
            isOneToOne: false
            referencedRelation: "nutrition_days"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_days: {
        Row: {
          calories_total: number | null
          carbs_total: number | null
          created_at: string | null
          date: string
          fat_total: number | null
          fiber_total: number | null
          id: string
          protein_total: number | null
          target_calories: number | null
          target_carbs: number | null
          target_fat: number | null
          target_fiber: number | null
          target_protein: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calories_total?: number | null
          carbs_total?: number | null
          created_at?: string | null
          date: string
          fat_total?: number | null
          fiber_total?: number | null
          id?: string
          protein_total?: number | null
          target_calories?: number | null
          target_carbs?: number | null
          target_fat?: number | null
          target_fiber?: number | null
          target_protein?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calories_total?: number | null
          carbs_total?: number | null
          created_at?: string | null
          date?: string
          fat_total?: number | null
          fiber_total?: number | null
          id?: string
          protein_total?: number | null
          target_calories?: number | null
          target_carbs?: number | null
          target_fat?: number | null
          target_fiber?: number | null
          target_protein?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          calories_target: number | null
          carbs_target: number | null
          created_at: string | null
          daily_reset_time: string | null
          fat_target: number | null
          fiber_target: number | null
          id: string
          protein_target: number | null
          rest_timer_default_seconds: number | null
          streak_rule: string | null
          theme: string | null
          units: string | null
          updated_at: string | null
          user_id: string
          week_starts_on: number | null
        }
        Insert: {
          calories_target?: number | null
          carbs_target?: number | null
          created_at?: string | null
          daily_reset_time?: string | null
          fat_target?: number | null
          fiber_target?: number | null
          id?: string
          protein_target?: number | null
          rest_timer_default_seconds?: number | null
          streak_rule?: string | null
          theme?: string | null
          units?: string | null
          updated_at?: string | null
          user_id: string
          week_starts_on?: number | null
        }
        Update: {
          calories_target?: number | null
          carbs_target?: number | null
          created_at?: string | null
          daily_reset_time?: string | null
          fat_target?: number | null
          fiber_target?: number | null
          id?: string
          protein_target?: number | null
          rest_timer_default_seconds?: number | null
          streak_rule?: string | null
          theme?: string | null
          units?: string | null
          updated_at?: string | null
          user_id?: string
          week_starts_on?: number | null
        }
        Relationships: []
      }
      workout_exercise_entries: {
        Row: {
          created_at: string | null
          exercise_id: string
          id: string
          order_index: number | null
          session_id: string
        }
        Insert: {
          created_at?: string | null
          exercise_id: string
          id?: string
          order_index?: number | null
          session_id: string
        }
        Update: {
          created_at?: string | null
          exercise_id?: string
          id?: string
          order_index?: number | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercise_entries_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercise_entries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          created_at: string | null
          datetime_end: string | null
          datetime_start: string
          id: string
          notes: string | null
          plan_id: string | null
          total_volume: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          datetime_end?: string | null
          datetime_start?: string
          id?: string
          notes?: string | null
          plan_id?: string | null
          total_volume?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          datetime_end?: string | null
          datetime_start?: string
          id?: string
          notes?: string | null
          plan_id?: string | null
          total_volume?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          completed: boolean | null
          created_at: string | null
          exercise_entry_id: string
          id: string
          reps: number
          rest_seconds_used: number | null
          rpe: number | null
          set_number: number
          technique: Database["public"]["Enums"]["workout_technique"] | null
          weight_kg: number
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          exercise_entry_id: string
          id?: string
          reps?: number
          rest_seconds_used?: number | null
          rpe?: number | null
          set_number?: number
          technique?: Database["public"]["Enums"]["workout_technique"] | null
          weight_kg?: number
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          exercise_entry_id?: string
          id?: string
          reps?: number
          rest_seconds_used?: number | null
          rpe?: number | null
          set_number?: number
          technique?: Database["public"]["Enums"]["workout_technique"] | null
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_entry_id_fkey"
            columns: ["exercise_entry_id"]
            isOneToOne: false
            referencedRelation: "workout_exercise_entries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      food_source: "PHOTO" | "TEXT" | "MANUAL"
      goal_status: "ACTIVE" | "COMPLETED" | "PAUSED"
      goal_type: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
      workout_technique:
        | "NONE"
        | "DROP_SET"
        | "REST_PAUSE"
        | "SUPERSET"
        | "TEMPO"
        | "AMRAP"
        | "CLUSTER"
        | "MTOR"
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
  public: {
    Enums: {
      app_role: ["admin", "user"],
      food_source: ["PHOTO", "TEXT", "MANUAL"],
      goal_status: ["ACTIVE", "COMPLETED", "PAUSED"],
      goal_type: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
      workout_technique: [
        "NONE",
        "DROP_SET",
        "REST_PAUSE",
        "SUPERSET",
        "TEMPO",
        "AMRAP",
        "CLUSTER",
        "MTOR",
      ],
    },
  },
} as const
