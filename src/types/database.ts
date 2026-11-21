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
      clients: {
        Row: {
          address: string | null
          archived_at: string | null
          created_at: string
          currency: string
          email: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          created_at?: string
          currency: string
          email?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount_cents: number
          created_at: string
          description: string
          id: string
          invoice_id: string
          kind: Database["public"]["Enums"]["invoice_item_kind"]
          organization_id: string
          position: number
          project_id: string | null
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          amount_cents: number
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          kind?: Database["public"]["Enums"]["invoice_item_kind"]
          organization_id: string
          position: number
          project_id?: string | null
          quantity: number
          unit_price_cents: number
        }
        Update: {
          amount_cents?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          kind?: Database["public"]["Enums"]["invoice_item_kind"]
          organization_id?: string
          position?: number
          project_id?: string | null
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_fkey"
            columns: ["organization_id", "invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "invoice_items_project_fkey"
            columns: ["organization_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid_cents: number
          client_id: string
          created_at: string
          currency: string
          discount_cents: number
          discount_rate: number
          due_date: string
          id: string
          issue_date: string
          notes: string | null
          number: string
          organization_id: string
          sent_at: string | null
          share_token: string
          status: Database["public"]["Enums"]["invoice_status"]
          subject: string | null
          subtotal_cents: number
          tax_cents: number
          tax_rate: number
          total_cents: number
          updated_at: string
        }
        Insert: {
          amount_paid_cents?: number
          client_id: string
          created_at?: string
          currency: string
          discount_cents?: number
          discount_rate?: number
          due_date: string
          id?: string
          issue_date: string
          notes?: string | null
          number: string
          organization_id: string
          sent_at?: string | null
          share_token?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subject?: string | null
          subtotal_cents?: number
          tax_cents?: number
          tax_rate?: number
          total_cents?: number
          updated_at?: string
        }
        Update: {
          amount_paid_cents?: number
          client_id?: string
          created_at?: string
          currency?: string
          discount_cents?: number
          discount_rate?: number
          due_date?: string
          id?: string
          issue_date?: string
          notes?: string | null
          number?: string
          organization_id?: string
          sent_at?: string | null
          share_token?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subject?: string | null
          subtotal_cents?: number
          tax_cents?: number
          tax_rate?: number
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_fkey"
            columns: ["organization_id", "client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_billing: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          organization_id: string
          plan_interval: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          organization_id: string
          plan_interval?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          organization_id?: string
          plan_interval?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_billing_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string
          created_at: string
          currency: string
          default_tax_rate: number
          id: string
          invoice_prefix: string
          logo_path: string | null
          name: string
          next_invoice_number: number
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string
          created_at?: string
          currency?: string
          default_tax_rate?: number
          id?: string
          invoice_prefix?: string
          logo_path?: string | null
          name: string
          next_invoice_number?: number
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          currency?: string
          default_tax_rate?: number
          id?: string
          invoice_prefix?: string
          logo_path?: string | null
          name?: string
          next_invoice_number?: number
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          organization_id: string
          paid_at: string
          recorded_by: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          invoice_id: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          organization_id: string
          paid_at: string
          recorded_by?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          organization_id?: string
          paid_at?: string
          recorded_by?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_fkey"
            columns: ["organization_id", "invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      project_tasks: {
        Row: {
          created_at: string
          hourly_rate_cents: number | null
          id: string
          is_billable: boolean
          organization_id: string
          project_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          hourly_rate_cents?: number | null
          id?: string
          is_billable?: boolean
          organization_id: string
          project_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          hourly_rate_cents?: number | null
          id?: string
          is_billable?: boolean
          organization_id?: string
          project_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_fkey"
            columns: ["organization_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "project_tasks_task_fkey"
            columns: ["organization_id", "task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          billing_method: Database["public"]["Enums"]["billing_method"]
          budget_cents: number | null
          budget_minutes: number | null
          client_id: string
          code: string | null
          created_at: string
          hourly_rate_cents: number | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          billing_method?: Database["public"]["Enums"]["billing_method"]
          budget_cents?: number | null
          budget_minutes?: number | null
          client_id: string
          code?: string | null
          created_at?: string
          hourly_rate_cents?: number | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          billing_method?: Database["public"]["Enums"]["billing_method"]
          budget_cents?: number | null
          budget_minutes?: number | null
          client_id?: string
          code?: string | null
          created_at?: string
          hourly_rate_cents?: number | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_fkey"
            columns: ["organization_id", "client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived_at: string | null
          created_at: string
          default_hourly_rate_cents: number | null
          id: string
          is_billable: boolean
          is_common: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          default_hourly_rate_cents?: number | null
          id?: string
          is_billable?: boolean
          is_common?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          default_hourly_rate_cents?: number | null
          id?: string
          is_billable?: boolean
          is_common?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          created_at: string
          hourly_rate_cents: number | null
          id: string
          import_key: string | null
          invoice_item_id: string | null
          is_billable: boolean
          minutes: number
          notes: string | null
          organization_id: string
          project_id: string
          spent_date: string
          task_id: string
          timer_started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hourly_rate_cents?: number | null
          id?: string
          import_key?: string | null
          invoice_item_id?: string | null
          is_billable?: boolean
          minutes?: number
          notes?: string | null
          organization_id: string
          project_id: string
          spent_date: string
          task_id: string
          timer_started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hourly_rate_cents?: number | null
          id?: string
          import_key?: string | null
          invoice_item_id?: string | null
          is_billable?: boolean
          minutes?: number
          notes?: string | null
          organization_id?: string
          project_id?: string
          spent_date?: string
          task_id?: string
          timer_started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_invoice_item_fkey"
            columns: ["organization_id", "invoice_item_id"]
            isOneToOne: false
            referencedRelation: "invoice_items"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "time_entries_member_fkey"
            columns: ["organization_id", "user_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "time_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_project_fkey"
            columns: ["organization_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "time_entries_project_task_fkey"
            columns: ["project_id", "task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["project_id", "task_id"]
          },
          {
            foreignKeyName: "time_entries_task_fkey"
            columns: ["organization_id", "task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_time_to_invoice: {
        Args: {
          p_from: string
          p_grouping: string
          p_invoice_id: string
          p_to: string
        }
        Returns: number
      }
      apply_invoice_payments: {
        Args: { p_invoice_id: string }
        Returns: undefined
      }
      create_invoice: {
        Args: {
          p_client_id: string
          p_due_date: string
          p_issue_date: string
          p_organization_id: string
        }
        Returns: string
      }
      create_organization: {
        Args: { p_currency: string; p_name: string; p_timezone: string }
        Returns: string
      }
      delete_payment: { Args: { p_payment_id: string }; Returns: undefined }
      get_shared_invoice: { Args: { p_token: string }; Returns: Json }
      has_org_role: {
        Args: {
          org_id: string
          roles: Database["public"]["Enums"]["org_role"][]
        }
        Returns: boolean
      }
      import_harvest: {
        Args: { p_organization_id: string; p_payload: Json }
        Returns: Json
      }
      is_org_member: { Args: { org_id: string }; Returns: boolean }
      recalculate_invoice_totals: {
        Args: { p_invoice_id: string }
        Returns: undefined
      }
      record_payment: {
        Args: {
          p_amount_cents: number
          p_invoice_id: string
          p_method: Database["public"]["Enums"]["payment_method"]
          p_notes: string
          p_paid_at: string
        }
        Returns: string
      }
      reset_invoice_share_token: {
        Args: { p_invoice_id: string }
        Returns: string
      }
      save_invoice: {
        Args: { p_invoice: Json; p_invoice_id: string; p_items: Json }
        Returns: undefined
      }
      save_project: {
        Args: {
          p_organization_id: string
          p_project: Json
          p_project_id: string
          p_tasks: Json
        }
        Returns: string
      }
      set_invoice_status: {
        Args: { p_action: string; p_invoice_id: string }
        Returns: undefined
      }
      shares_org_with: { Args: { other_user_id: string }; Returns: boolean }
      start_timer: { Args: { p_entry_id: string }; Returns: undefined }
      stop_timer: { Args: { p_entry_id: string }; Returns: undefined }
      timer_elapsed_minutes: { Args: { p_started_at: string }; Returns: number }
    }
    Enums: {
      billing_method: "project_rate" | "task_rate" | "person_rate" | "none"
      invoice_item_kind: "service" | "product" | "time"
      invoice_status: "draft" | "sent" | "partially_paid" | "paid" | "void"
      org_role: "owner" | "admin" | "member"
      payment_method:
        | "bank_transfer"
        | "cash"
        | "card"
        | "paypal"
        | "check"
        | "stripe"
        | "other"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      billing_method: ["project_rate", "task_rate", "person_rate", "none"],
      invoice_item_kind: ["service", "product", "time"],
      invoice_status: ["draft", "sent", "partially_paid", "paid", "void"],
      org_role: ["owner", "admin", "member"],
      payment_method: [
        "bank_transfer",
        "cash",
        "card",
        "paypal",
        "check",
        "stripe",
        "other",
      ],
    },
  },
} as const
