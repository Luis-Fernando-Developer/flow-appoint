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
      absences: {
        Row: {
          absence_type: string
          company_id: string
          created_at: string
          employee_id: string | null
          end_date: string
          id: string
          reason: string | null
          start_date: string
        }
        Insert: {
          absence_type: string
          company_id: string
          created_at?: string
          employee_id?: string | null
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
        }
        Update: {
          absence_type?: string
          company_id?: string
          created_at?: string
          employee_id?: string | null
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "absences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_slots: {
        Row: {
          company_id: string
          created_at: string
          employee_id: string | null
          end_datetime: string
          id: string
          reason: string | null
          start_datetime: string
        }
        Insert: {
          company_id: string
          created_at?: string
          employee_id?: string | null
          end_datetime: string
          id?: string
          reason?: string | null
          start_datetime: string
        }
        Update: {
          company_id?: string
          created_at?: string
          employee_id?: string | null
          end_datetime?: string
          id?: string
          reason?: string | null
          start_datetime?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_slots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_slots_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          client_id: string | null
          company_id: string
          created_at: string
          employee_id: string | null
          end_time: string
          id: string
          notes: string | null
          service_id: string | null
          start_time: string
          status: string | null
          updated_at: string
        }
        Insert: {
          booking_date: string
          client_id?: string | null
          company_id: string
          created_at?: string
          employee_id?: string | null
          end_time: string
          id?: string
          notes?: string | null
          service_id?: string | null
          start_time: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          booking_date?: string
          client_id?: string | null
          company_id?: string
          created_at?: string
          employee_id?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string | null
          start_time?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_flows: {
        Row: {
          company_id: string
          containers: Json | null
          created_at: string
          description: string | null
          edges: Json | null
          id: string
          is_active: boolean | null
          is_published: boolean | null
          name: string
          public_id: string | null
          published_at: string | null
          published_containers: Json | null
          published_edges: Json | null
          settings: Json | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          company_id: string
          containers?: Json | null
          created_at?: string
          description?: string | null
          edges?: Json | null
          id?: string
          is_active?: boolean | null
          is_published?: boolean | null
          name: string
          public_id?: string | null
          published_at?: string | null
          published_containers?: Json | null
          published_edges?: Json | null
          settings?: Json | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          company_id?: string
          containers?: Json | null
          created_at?: string
          description?: string | null
          edges?: Json | null
          id?: string
          is_active?: boolean | null
          is_published?: boolean | null
          name?: string
          public_id?: string | null
          published_at?: string | null
          published_containers?: Json | null
          published_edges?: Json | null
          settings?: Json | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_flows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_sessions: {
        Row: {
          client_id: string | null
          company_id: string | null
          created_at: string
          flow_id: string
          id: string
          state: Json
          status: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          company_id?: string | null
          created_at?: string
          flow_id: string
          id?: string
          state?: Json
          status?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          company_id?: string | null
          created_at?: string
          flow_id?: string
          id?: string
          state?: Json
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_sessions_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "chatbot_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company_id: string
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          owner_email: string | null
          owner_name: string | null
          owner_phone: string | null
          slug: string
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          slug: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          slug?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_customizations: {
        Row: {
          company_id: string
          created_at: string
          id: string
          logo_type: string | null
          logo_upload_path: string | null
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          theme: Json | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          logo_type?: string | null
          logo_upload_path?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          theme?: Json | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          logo_type?: string | null
          logo_upload_path?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          theme?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_customizations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_subscriptions: {
        Row: {
          billing_period: string
          company_id: string
          created_at: string
          discount_cycles_remaining: number | null
          discount_percentage: number | null
          discount_reason: string | null
          ends_at: string | null
          id: string
          original_price: number
          plan_id: string
          starts_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          billing_period?: string
          company_id: string
          created_at?: string
          discount_cycles_remaining?: number | null
          discount_percentage?: number | null
          discount_reason?: string | null
          ends_at?: string | null
          id?: string
          original_price?: number
          plan_id: string
          starts_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          billing_period?: string
          company_id?: string
          created_at?: string
          discount_cycles_remaining?: number | null
          discount_percentage?: number | null
          discount_reason?: string | null
          ends_at?: string | null
          id?: string
          original_price?: number
          plan_id?: string
          starts_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_services: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          service_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          service_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_services_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          role: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          points_required: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_required?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_required?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      service_combo_items: {
        Row: {
          combo_id: string
          created_at: string
          id: string
          service_id: string
        }
        Insert: {
          combo_id: string
          created_at?: string
          id?: string
          service_id: string
        }
        Update: {
          combo_id?: string
          created_at?: string
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_combo_items_combo_id_fkey"
            columns: ["combo_id"]
            isOneToOne: false
            referencedRelation: "service_combos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_combo_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_combos: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_combos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          duration: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          annual_price: number
          created_at: string
          features: Json | null
          id: string
          is_active: boolean | null
          monthly_price: number
          name: string
          quarterly_price: number
          updated_at: string
        }
        Insert: {
          annual_price?: number
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          monthly_price?: number
          name: string
          quarterly_price?: number
          updated_at?: string
        }
        Update: {
          annual_price?: number
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          monthly_price?: number
          name?: string
          quarterly_price?: number
          updated_at?: string
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
  public: {
    Enums: {},
  },
} as const
