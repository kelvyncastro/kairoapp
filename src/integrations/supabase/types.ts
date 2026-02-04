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
      calendar_blocks: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          color: string | null
          completed_at: string | null
          created_at: string
          demand_type: Database["public"]["Enums"]["calendar_demand_type"]
          description: string | null
          duration_minutes: number | null
          end_time: string
          id: string
          is_recurrence_paused: boolean | null
          priority: Database["public"]["Enums"]["calendar_priority"]
          recurrence_end_date: string | null
          recurrence_parent_id: string | null
          recurrence_rule: Json | null
          recurrence_type: Database["public"]["Enums"]["calendar_recurrence_type"]
          start_time: string
          status: Database["public"]["Enums"]["calendar_block_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          color?: string | null
          completed_at?: string | null
          created_at?: string
          demand_type?: Database["public"]["Enums"]["calendar_demand_type"]
          description?: string | null
          duration_minutes?: number | null
          end_time: string
          id?: string
          is_recurrence_paused?: boolean | null
          priority?: Database["public"]["Enums"]["calendar_priority"]
          recurrence_end_date?: string | null
          recurrence_parent_id?: string | null
          recurrence_rule?: Json | null
          recurrence_type?: Database["public"]["Enums"]["calendar_recurrence_type"]
          start_time: string
          status?: Database["public"]["Enums"]["calendar_block_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          color?: string | null
          completed_at?: string | null
          created_at?: string
          demand_type?: Database["public"]["Enums"]["calendar_demand_type"]
          description?: string | null
          duration_minutes?: number | null
          end_time?: string
          id?: string
          is_recurrence_paused?: boolean | null
          priority?: Database["public"]["Enums"]["calendar_priority"]
          recurrence_end_date?: string | null
          recurrence_parent_id?: string | null
          recurrence_rule?: Json | null
          recurrence_type?: Database["public"]["Enums"]["calendar_recurrence_type"]
          start_time?: string
          status?: Database["public"]["Enums"]["calendar_block_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_blocks_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "calendar_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_daily_stats: {
        Row: {
          actual_time_minutes: number | null
          cancelled_blocks: number | null
          completed_blocks: number | null
          created_at: string
          date: string
          execution_score: number | null
          id: string
          planned_blocks: number | null
          planned_time_minutes: number | null
          postponed_blocks: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_time_minutes?: number | null
          cancelled_blocks?: number | null
          completed_blocks?: number | null
          created_at?: string
          date: string
          execution_score?: number | null
          id?: string
          planned_blocks?: number | null
          planned_time_minutes?: number | null
          postponed_blocks?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_time_minutes?: number | null
          cancelled_blocks?: number | null
          completed_blocks?: number | null
          created_at?: string
          date?: string
          execution_score?: number | null
          id?: string
          planned_blocks?: number | null
          planned_time_minutes?: number | null
          postponed_blocks?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
          due_date: string | null
          folder_id: string | null
          id: string
          is_recurring: boolean | null
          labels: string[] | null
          priority: number | null
          recurring_rule: string | null
          start_date: string | null
          status_id: string | null
          time_estimate_minutes: number | null
          time_spent_seconds: number | null
          timer_started_at: string | null
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
          due_date?: string | null
          folder_id?: string | null
          id?: string
          is_recurring?: boolean | null
          labels?: string[] | null
          priority?: number | null
          recurring_rule?: string | null
          start_date?: string | null
          status_id?: string | null
          time_estimate_minutes?: number | null
          time_spent_seconds?: number | null
          timer_started_at?: string | null
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
          due_date?: string | null
          folder_id?: string | null
          id?: string
          is_recurring?: boolean | null
          labels?: string[] | null
          priority?: number | null
          recurring_rule?: string | null
          start_date?: string | null
          status_id?: string | null
          time_estimate_minutes?: number | null
          time_spent_seconds?: number | null
          timer_started_at?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_tasks_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "task_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tasks_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "task_statuses"
            referencedColumns: ["id"]
          },
        ]
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
          icon: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color_label?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color_label?: string | null
          created_at?: string | null
          icon?: string | null
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
          status: string | null
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
          status?: string | null
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
          status?: string | null
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
      goal_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      goal_progress_history: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          note: string | null
          value: number
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          note?: string | null
          value: number
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          note?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "goal_progress_history_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string | null
          category_id: string | null
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
          category?: string | null
          category_id?: string | null
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
          category?: string | null
          category_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "goals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "goal_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_logs: {
        Row: {
          created_at: string
          date: string
          habit_id: string
          id: string
          status: Database["public"]["Enums"]["habit_log_status"]
        }
        Insert: {
          created_at?: string
          date: string
          habit_id: string
          id?: string
          status?: Database["public"]["Enums"]["habit_log_status"]
        }
        Update: {
          created_at?: string
          date?: string
          habit_id?: string
          id?: string
          status?: Database["public"]["Enums"]["habit_log_status"]
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          active: boolean
          created_at: string
          frequency: Json
          id: string
          name: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          frequency?: Json
          id?: string
          name: string
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          frequency?: Json
          id?: string
          name?: string
          start_date?: string
          updated_at?: string
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
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
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
      ranking_goal_logs: {
        Row: {
          completed: boolean
          created_at: string
          date: string
          goal_id: string
          id: string
          points_earned: number
          ranking_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          date: string
          goal_id: string
          id?: string
          points_earned?: number
          ranking_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          date?: string
          goal_id?: string
          id?: string
          points_earned?: number
          ranking_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ranking_goal_logs_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "ranking_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranking_goal_logs_ranking_id_fkey"
            columns: ["ranking_id"]
            isOneToOne: false
            referencedRelation: "rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_goals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_index: number
          ranking_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          ranking_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          ranking_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ranking_goals_ranking_id_fkey"
            columns: ["ranking_id"]
            isOneToOne: false
            referencedRelation: "rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_participants: {
        Row: {
          accepted_bet: boolean | null
          created_at: string
          deletion_consent: boolean | null
          id: string
          joined_at: string | null
          ranking_id: string
          status: string
          total_points: number
          user_id: string
        }
        Insert: {
          accepted_bet?: boolean | null
          created_at?: string
          deletion_consent?: boolean | null
          id?: string
          joined_at?: string | null
          ranking_id: string
          status?: string
          total_points?: number
          user_id: string
        }
        Update: {
          accepted_bet?: boolean | null
          created_at?: string
          deletion_consent?: boolean | null
          id?: string
          joined_at?: string | null
          ranking_id?: string
          status?: string
          total_points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ranking_participants_ranking_id_fkey"
            columns: ["ranking_id"]
            isOneToOne: false
            referencedRelation: "rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      rankings: {
        Row: {
          bet_amount: string | null
          bet_description: string | null
          created_at: string
          creator_id: string
          deletion_requested: boolean | null
          deletion_requested_at: string | null
          description: string | null
          end_date: string
          id: string
          max_participants: number
          name: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          bet_amount?: string | null
          bet_description?: string | null
          created_at?: string
          creator_id: string
          deletion_requested?: boolean | null
          deletion_requested_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          max_participants?: number
          name: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          bet_amount?: string | null
          bet_description?: string | null
          created_at?: string
          creator_id?: string
          deletion_requested?: boolean | null
          deletion_requested_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          max_participants?: number
          name?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_filters: {
        Row: {
          created_at: string
          filters: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_checklist_items: {
        Row: {
          checklist_id: string
          completed: boolean
          created_at: string
          id: string
          order_index: number
          title: string
        }
        Insert: {
          checklist_id: string
          completed?: boolean
          created_at?: string
          id?: string
          order_index?: number
          title: string
        }
        Update: {
          checklist_id?: string
          completed?: boolean
          created_at?: string
          id?: string
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "task_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      task_checklists: {
        Row: {
          created_at: string
          id: string
          name: string
          order_index: number
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklists_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "daily_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_folders: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      task_labels: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      task_statuses: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          order: number | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          order?: number | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          order?: number | null
          user_id?: string
        }
        Relationships: []
      }
      task_subtasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          order_index: number
          task_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          order_index?: number
          task_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          order_index?: number
          task_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "daily_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          app_theme: string
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          onboarding_completed: boolean
          public_id: string | null
          subscription_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_theme?: string
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_completed?: boolean
          public_id?: string | null
          subscription_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_theme?: string
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_completed?: boolean
          public_id?: string | null
          subscription_status?: string
          updated_at?: string
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
      public_user_profiles: {
        Row: {
          avatar_url: string | null
          first_name: string | null
          id: string | null
          public_id: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          first_name?: string | null
          id?: string | null
          public_id?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          first_name?: string | null
          id?: string | null
          public_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_default_finance_sectors: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      generate_public_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_ranking_creator: {
        Args: { _ranking_id: string; _user_id: string }
        Returns: boolean
      }
      is_ranking_participant: {
        Args: { _ranking_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      calendar_block_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "postponed"
      calendar_demand_type: "fixed" | "flexible" | "micro"
      calendar_priority: "low" | "medium" | "high" | "urgent"
      calendar_recurrence_type:
        | "none"
        | "daily"
        | "weekly"
        | "monthly"
        | "custom"
      food_source: "PHOTO" | "TEXT" | "MANUAL"
      goal_status: "ACTIVE" | "COMPLETED" | "PAUSED"
      goal_type: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
      habit_log_status: "done" | "not_done" | "skipped"
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
      calendar_block_status: [
        "pending",
        "in_progress",
        "completed",
        "cancelled",
        "postponed",
      ],
      calendar_demand_type: ["fixed", "flexible", "micro"],
      calendar_priority: ["low", "medium", "high", "urgent"],
      calendar_recurrence_type: [
        "none",
        "daily",
        "weekly",
        "monthly",
        "custom",
      ],
      food_source: ["PHOTO", "TEXT", "MANUAL"],
      goal_status: ["ACTIVE", "COMPLETED", "PAUSED"],
      goal_type: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
      habit_log_status: ["done", "not_done", "skipped"],
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
