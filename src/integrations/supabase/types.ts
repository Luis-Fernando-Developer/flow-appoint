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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      blocked_slots: {
        Row: {
          blocked_date: string
          company_id: string
          created_at: string | null
          employee_id: string | null
          end_time: string | null
          id: string
          is_company_wide: boolean | null
          reason: string | null
          start_time: string | null
        }
        Insert: {
          blocked_date: string
          company_id: string
          created_at?: string | null
          employee_id?: string | null
          end_time?: string | null
          id?: string
          is_company_wide?: boolean | null
          reason?: string | null
          start_time?: string | null
        }
        Update: {
          blocked_date?: string
          company_id?: string
          created_at?: string | null
          employee_id?: string | null
          end_time?: string | null
          id?: string
          is_company_wide?: boolean | null
          reason?: string | null
          start_time?: string | null
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
          booking_status: Database["public"]["Enums"]["booking_status"]
          booking_time: string
          client_id: string
          company_id: string
          created_at: string
          duration_minutes: number
          employee_id: string | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          price: number
          service_id: string
          updated_at: string
        }
        Insert: {
          booking_date: string
          booking_status?: Database["public"]["Enums"]["booking_status"]
          booking_time: string
          client_id: string
          company_id: string
          created_at?: string
          duration_minutes?: number
          employee_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          price?: number
          service_id: string
          updated_at?: string
        }
        Update: {
          booking_date?: string
          booking_status?: Database["public"]["Enums"]["booking_status"]
          booking_time?: string
          client_id?: string
          company_id?: string
          created_at?: string
          duration_minutes?: number
          employee_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          price?: number
          service_id?: string
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
      business_hours: {
        Row: {
          close_time: string | null
          company_id: string
          created_at: string | null
          day_of_week: number
          id: string
          is_open: boolean | null
          open_time: string | null
          second_close_time: string | null
          second_open_time: string | null
          updated_at: string | null
        }
        Insert: {
          close_time?: string | null
          company_id: string
          created_at?: string | null
          day_of_week: number
          id?: string
          is_open?: boolean | null
          open_time?: string | null
          second_close_time?: string | null
          second_open_time?: string | null
          updated_at?: string | null
        }
        Update: {
          close_time?: string | null
          company_id?: string
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_open?: boolean | null
          open_time?: string | null
          second_close_time?: string | null
          second_open_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_flows: {
        Row: {
          company_id: string
          containers: Json
          created_at: string
          description: string | null
          edges: Json
          id: string
          is_active: boolean
          name: string
          updated_at: string
          variables: Json
        }
        Insert: {
          company_id: string
          containers?: Json
          created_at?: string
          description?: string | null
          edges?: Json
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          company_id?: string
          containers?: Json
          created_at?: string
          description?: string | null
          edges?: Json
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          variables?: Json
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
          company_id: string
          created_at: string
          current_container_id: string | null
          flow_id: string
          id: string
          messages: Json
          status: string
          updated_at: string
          variables: Json
        }
        Insert: {
          client_id?: string | null
          company_id: string
          created_at?: string
          current_container_id?: string | null
          flow_id: string
          id?: string
          messages?: Json
          status?: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          client_id?: string | null
          company_id?: string
          created_at?: string
          current_container_id?: string | null
          flow_id?: string
          id?: string
          messages?: Json
          status?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_sessions_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "chatbot_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      client_payment_methods: {
        Row: {
          card_brand: string | null
          card_last_four: string | null
          client_id: string
          created_at: string | null
          id: string
          is_default: boolean | null
          payment_type: string
          pix_key: string | null
          updated_at: string | null
        }
        Insert: {
          card_brand?: string | null
          card_last_four?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          payment_type: string
          pix_key?: string | null
          updated_at?: string | null
        }
        Update: {
          card_brand?: string | null
          card_last_four?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          payment_type?: string
          pix_key?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client_rewards: {
        Row: {
          company_id: string
          count_specific_service: boolean | null
          created_at: string | null
          id: string
          is_active: boolean | null
          required_procedures: number
          requires_completed_booking: boolean | null
          requires_payment_confirmed: boolean | null
          reward_service_id: string | null
          specific_service_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          count_specific_service?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          required_procedures?: number
          requires_completed_booking?: boolean | null
          requires_payment_confirmed?: boolean | null
          reward_service_id?: string | null
          specific_service_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          count_specific_service?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          required_procedures?: number
          requires_completed_booking?: boolean | null
          requires_payment_confirmed?: boolean | null
          reward_service_id?: string | null
          specific_service_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          accepts_marketing: boolean | null
          address: string | null
          avatar_url: string | null
          birth_date: string | null
          city: string | null
          company_id: string
          cpf: string | null
          created_at: string
          data_deleted_at: string | null
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string | null
          zip_code: string | null
        }
        Insert: {
          accepts_marketing?: boolean | null
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          company_id: string
          cpf?: string | null
          created_at?: string
          data_deleted_at?: string | null
          email: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          zip_code?: string | null
        }
        Update: {
          accepts_marketing?: boolean | null
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          company_id?: string
          cpf?: string | null
          created_at?: string
          data_deleted_at?: string | null
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          zip_code?: string | null
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
          city: string | null
          cnpj: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_cpf: string
          owner_email: string
          owner_name: string
          phone: string | null
          plan: string
          slug: string
          state: string | null
          status: string
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_cpf: string
          owner_email: string
          owner_name: string
          phone?: string | null
          plan?: string
          slug: string
          state?: string | null
          status?: string
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_cpf?: string
          owner_email?: string
          owner_name?: string
          phone?: string | null
          plan?: string
          slug?: string
          state?: string | null
          status?: string
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      company_customizations: {
        Row: {
          button_color: string | null
          button_color_type: string | null
          button_gradient: Json | null
          cards_color: string | null
          cards_color_type: string | null
          cards_font_family: string | null
          cards_gradient: Json | null
          cards_layout: string | null
          cards_show_images: boolean | null
          company_id: string
          created_at: string
          extra_section_code: string | null
          extra_section_enabled: boolean | null
          font_color: string | null
          font_color_type: string | null
          font_family: string | null
          font_gradient: Json | null
          font_size_base: number | null
          footer_background_color: string | null
          footer_background_gradient: Json | null
          footer_background_type: string | null
          footer_font_family: string | null
          header_background_color: string | null
          header_background_gradient: Json | null
          header_background_type: string | null
          header_position: string | null
          hero_background_color: string | null
          hero_background_gradient: Json | null
          hero_background_type: string | null
          hero_banner_type: string | null
          hero_banner_urls: string[] | null
          hero_content_position: string | null
          hero_description: string | null
          hero_title: string | null
          id: string
          logo_type: string | null
          logo_upload_path: string | null
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          button_color?: string | null
          button_color_type?: string | null
          button_gradient?: Json | null
          cards_color?: string | null
          cards_color_type?: string | null
          cards_font_family?: string | null
          cards_gradient?: Json | null
          cards_layout?: string | null
          cards_show_images?: boolean | null
          company_id: string
          created_at?: string
          extra_section_code?: string | null
          extra_section_enabled?: boolean | null
          font_color?: string | null
          font_color_type?: string | null
          font_family?: string | null
          font_gradient?: Json | null
          font_size_base?: number | null
          footer_background_color?: string | null
          footer_background_gradient?: Json | null
          footer_background_type?: string | null
          footer_font_family?: string | null
          header_background_color?: string | null
          header_background_gradient?: Json | null
          header_background_type?: string | null
          header_position?: string | null
          hero_background_color?: string | null
          hero_background_gradient?: Json | null
          hero_background_type?: string | null
          hero_banner_type?: string | null
          hero_banner_urls?: string[] | null
          hero_content_position?: string | null
          hero_description?: string | null
          hero_title?: string | null
          id?: string
          logo_type?: string | null
          logo_upload_path?: string | null
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          button_color?: string | null
          button_color_type?: string | null
          button_gradient?: Json | null
          cards_color?: string | null
          cards_color_type?: string | null
          cards_font_family?: string | null
          cards_gradient?: Json | null
          cards_layout?: string | null
          cards_show_images?: boolean | null
          company_id?: string
          created_at?: string
          extra_section_code?: string | null
          extra_section_enabled?: boolean | null
          font_color?: string | null
          font_color_type?: string | null
          font_family?: string | null
          font_gradient?: Json | null
          font_size_base?: number | null
          footer_background_color?: string | null
          footer_background_gradient?: Json | null
          footer_background_type?: string | null
          footer_font_family?: string | null
          header_background_color?: string | null
          header_background_gradient?: Json | null
          header_background_type?: string | null
          header_position?: string | null
          hero_background_color?: string | null
          hero_background_gradient?: Json | null
          hero_background_type?: string | null
          hero_banner_type?: string | null
          hero_banner_urls?: string[] | null
          hero_content_position?: string | null
          hero_description?: string | null
          hero_title?: string | null
          id?: string
          logo_type?: string | null
          logo_upload_path?: string | null
          logo_url?: string | null
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
      company_schedule_settings: {
        Row: {
          allows_overtime: boolean | null
          company_id: string
          created_at: string | null
          id: string
          max_booking_advance_days: number | null
          max_break_duration: number | null
          max_overtime_hours: number | null
          max_simultaneous_breaks: number | null
          min_booking_advance_hours: number | null
          min_break_duration: number | null
          slot_duration: number | null
          updated_at: string | null
        }
        Insert: {
          allows_overtime?: boolean | null
          company_id: string
          created_at?: string | null
          id?: string
          max_booking_advance_days?: number | null
          max_break_duration?: number | null
          max_overtime_hours?: number | null
          max_simultaneous_breaks?: number | null
          min_booking_advance_hours?: number | null
          min_break_duration?: number | null
          slot_duration?: number | null
          updated_at?: string | null
        }
        Update: {
          allows_overtime?: boolean | null
          company_id?: string
          created_at?: string | null
          id?: string
          max_booking_advance_days?: number | null
          max_break_duration?: number | null
          max_overtime_hours?: number | null
          max_simultaneous_breaks?: number | null
          min_booking_advance_hours?: number | null
          min_break_duration?: number | null
          slot_duration?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_schedule_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_subscriptions: {
        Row: {
          billing_period: string
          company_id: string | null
          created_at: string | null
          discount_cycles_remaining: number | null
          discount_percentage: number | null
          discounted_price: number | null
          id: string
          next_billing_date: string | null
          original_price: number
          plan_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          billing_period: string
          company_id?: string | null
          created_at?: string | null
          discount_cycles_remaining?: number | null
          discount_percentage?: number | null
          discounted_price?: number | null
          id?: string
          next_billing_date?: string | null
          original_price: number
          plan_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_period?: string
          company_id?: string | null
          created_at?: string | null
          discount_cycles_remaining?: number | null
          discount_percentage?: number | null
          discounted_price?: number | null
          id?: string
          next_billing_date?: string | null
          original_price?: number
          plan_id?: string | null
          status?: string | null
          updated_at?: string | null
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
      employee_absences: {
        Row: {
          absence_type: Database["public"]["Enums"]["absence_type"]
          created_at: string | null
          employee_id: string
          end_date: string
          id: string
          reason: string | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          absence_type: Database["public"]["Enums"]["absence_type"]
          created_at?: string | null
          employee_id: string
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          absence_type?: Database["public"]["Enums"]["absence_type"]
          created_at?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_absences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_availability: {
        Row: {
          available_date: string
          break_end: string | null
          break_start: string | null
          created_at: string | null
          employee_id: string
          end_time: string
          id: string
          start_time: string
        }
        Insert: {
          available_date: string
          break_end?: string | null
          break_start?: string | null
          created_at?: string | null
          employee_id: string
          end_time: string
          id?: string
          start_time: string
        }
        Update: {
          available_date?: string
          break_end?: string | null
          break_start?: string | null
          created_at?: string | null
          employee_id?: string
          end_time?: string
          id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_availability_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_schedules: {
        Row: {
          allows_overtime: boolean | null
          break_end: string | null
          break_start: string | null
          created_at: string | null
          day_of_week: number
          employee_id: string
          end_time: string | null
          id: string
          is_working: boolean | null
          start_time: string | null
          updated_at: string | null
        }
        Insert: {
          allows_overtime?: boolean | null
          break_end?: string | null
          break_start?: string | null
          created_at?: string | null
          day_of_week: number
          employee_id: string
          end_time?: string | null
          id?: string
          is_working?: boolean | null
          start_time?: string | null
          updated_at?: string | null
        }
        Update: {
          allows_overtime?: boolean | null
          break_end?: string | null
          break_start?: string | null
          created_at?: string | null
          day_of_week?: number
          employee_id?: string
          end_time?: string | null
          id?: string
          is_working?: boolean | null
          start_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
          avatar_url: string | null
          company_id: string
          created_at: string
          email: string
          employee_type: string
          id: string
          is_active: boolean | null
          name: string
          permissions: Json | null
          phone: string | null
          role: Database["public"]["Enums"]["employee_role"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_id: string
          created_at?: string
          email: string
          employee_type?: string
          id?: string
          is_active?: boolean | null
          name: string
          permissions?: Json | null
          phone?: string | null
          role?: Database["public"]["Enums"]["employee_role"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_id?: string
          created_at?: string
          email?: string
          employee_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          permissions?: Json | null
          phone?: string | null
          role?: Database["public"]["Enums"]["employee_role"]
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
      service_combo_items: {
        Row: {
          combo_id: string | null
          created_at: string | null
          id: string
          service_id: string
        }
        Insert: {
          combo_id?: string | null
          created_at?: string | null
          id?: string
          service_id: string
        }
        Update: {
          combo_id?: string | null
          created_at?: string | null
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
        ]
      }
      service_combos: {
        Row: {
          combo_price: number
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          original_total_price: number | null
          total_duration_minutes: number
          updated_at: string | null
        }
        Insert: {
          combo_price: number
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          original_total_price?: number | null
          total_duration_minutes: number
          updated_at?: string | null
        }
        Update: {
          combo_price?: number
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          original_total_price?: number | null
          total_duration_minutes?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
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
          annual_checkout_url: string | null
          annual_price: number
          created_at: string | null
          description: string | null
          display_order: number | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          monthly_checkout_url: string | null
          monthly_price: number
          name: string
          quarterly_checkout_url: string | null
          quarterly_price: number
          updated_at: string | null
        }
        Insert: {
          annual_checkout_url?: string | null
          annual_price: number
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          monthly_checkout_url?: string | null
          monthly_price: number
          name: string
          quarterly_checkout_url?: string | null
          quarterly_price: number
          updated_at?: string | null
        }
        Update: {
          annual_checkout_url?: string | null
          annual_price?: number
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          monthly_checkout_url?: string | null
          monthly_price?: number
          name?: string
          quarterly_checkout_url?: string | null
          quarterly_price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_confirm_pending_bookings: { Args: never; Returns: undefined }
      company_has_owner: { Args: { _company_id: string }; Returns: boolean }
      create_client_profile: {
        Args: {
          _company_slug: string
          _email: string
          _name: string
          _phone: string
        }
        Returns: string
      }
      get_user_role: {
        Args: { _company_id: string; _user_id: string }
        Returns: string
      }
      has_permission_level: {
        Args: { _company_id: string; _required_level: string; _user_id: string }
        Returns: boolean
      }
      is_company_admin: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      absence_type:
        | "vacation"
        | "day_off"
        | "sick_leave"
        | "suspension"
        | "other"
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show"
      employee_role:
        | "owner"
        | "manager"
        | "supervisor"
        | "receptionist"
        | "employee"
      payment_status: "pending" | "confirmed" | "cancelled" | "free"
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
      absence_type: [
        "vacation",
        "day_off",
        "sick_leave",
        "suspension",
        "other",
      ],
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "no_show",
      ],
      employee_role: [
        "owner",
        "manager",
        "supervisor",
        "receptionist",
        "employee",
      ],
      payment_status: ["pending", "confirmed", "cancelled", "free"],
    },
  },
} as const
