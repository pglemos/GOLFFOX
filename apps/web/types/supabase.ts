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
  public: {
    Tables: {
      announcements: {
        Row: {
          created_at: string | null
          empresa_id: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string
          published_at: string | null
          target_role: string | null
          title: string
          transportadora_id: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          empresa_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          published_at?: string | null
          target_role?: string | null
          title: string
          transportadora_id?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          empresa_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          published_at?: string | null
          target_role?: string | null
          title?: string
          transportadora_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "announcements_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          body: string
          created_at: string | null
          from_user: string | null
          id: string
          to_role: string | null
          viagem_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          from_user?: string | null
          id?: string
          to_role?: string | null
          viagem_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          from_user?: string | null
          id?: string
          to_role?: string | null
          viagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_active_trips"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "chat_messages_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_trip_overview"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "chat_messages_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          created_at: string | null
          id: string
          items: Json
          motorista_id: string | null
          viagem_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          items: Json
          motorista_id?: string | null
          viagem_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          items?: Json
          motorista_id?: string | null
          viagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklists_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_active_trips"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "checklists_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_trip_overview"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "checklists_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          address: string | null
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip_code: string | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          employees_count: number | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip_code?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          employees_count?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip_code?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          employees_count?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gf_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          empresa_id: string | null
          id: string
          is_read: boolean | null
          is_resolved: boolean | null
          message: string
          metadata: Json | null
          motorista_id: string | null
          passenger_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          rota_id: string | null
          severity: string | null
          transportadora_id: string | null
          veiculo_id: string | null
          viagem_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          message: string
          metadata?: Json | null
          motorista_id?: string | null
          passenger_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          rota_id?: string | null
          severity?: string | null
          transportadora_id?: string | null
          veiculo_id?: string | null
          viagem_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          message?: string
          metadata?: Json | null
          motorista_id?: string | null
          passenger_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          rota_id?: string | null
          severity?: string | null
          transportadora_id?: string | null
          veiculo_id?: string | null
          viagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_alerts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_alerts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_alerts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_alerts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "gf_alerts_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_alerts_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_alerts_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_alerts_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_alerts_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_alerts_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "gf_alerts_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_alerts_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_alerts_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_alerts_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_alerts_transportadora_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_alerts_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_active_trips"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "gf_alerts_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_trip_overview"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "gf_alerts_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_alerts_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_vehicle_costs_summary"
            referencedColumns: ["veiculo_id"]
          },
          {
            foreignKeyName: "gf_alerts_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_announcement_reads: {
        Row: {
          announcement_id: string | null
          id: string
          read_at: string | null
          user_id: string | null
        }
        Insert: {
          announcement_id?: string | null
          id?: string
          read_at?: string | null
          user_id?: string | null
        }
        Update: {
          announcement_id?: string | null
          id?: string
          read_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "gf_announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_announcement_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_announcement_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_announcement_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          empresa_id: string
          id: string
          message: string
          name: string
          template_type: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          empresa_id: string
          id?: string
          message: string
          name: string
          template_type?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          empresa_id?: string
          id?: string
          message?: string
          name?: string
          template_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gf_announcement_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_announcement_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_announcement_templates_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_announcement_templates_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_announcement_templates_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_announcement_templates_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      gf_announcements: {
        Row: {
          created_at: string | null
          empresa_id: string
          id: string
          message: string
          operator_id: string | null
          read_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          target_ids: string[] | null
          target_type: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          id?: string
          message: string
          operator_id?: string | null
          read_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          target_ids?: string[] | null
          target_type?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          id?: string
          message?: string
          operator_id?: string | null
          read_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          target_ids?: string[] | null
          target_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gf_announcements_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_announcements_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_announcements_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_announcements_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "gf_announcements_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_announcements_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_assistance_requests: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          dispatched_driver_id: string | null
          dispatched_vehicle_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          motorista_id: string | null
          request_type: string
          resolved_at: string | null
          resolved_by: string | null
          rota_id: string | null
          status: string | null
          updated_at: string | null
          veiculo_id: string | null
          viagem_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          dispatched_driver_id?: string | null
          dispatched_vehicle_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          motorista_id?: string | null
          request_type: string
          resolved_at?: string | null
          resolved_by?: string | null
          rota_id?: string | null
          status?: string | null
          updated_at?: string | null
          veiculo_id?: string | null
          viagem_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          dispatched_driver_id?: string | null
          dispatched_vehicle_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          motorista_id?: string | null
          request_type?: string
          resolved_at?: string | null
          resolved_by?: string | null
          rota_id?: string | null
          status?: string | null
          updated_at?: string | null
          veiculo_id?: string | null
          viagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_assistance_requests_dispatched_driver_id_fkey"
            columns: ["dispatched_driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_assistance_requests_dispatched_driver_id_fkey"
            columns: ["dispatched_driver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_assistance_requests_dispatched_vehicle_id_fkey"
            columns: ["dispatched_vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_vehicle_costs_summary"
            referencedColumns: ["veiculo_id"]
          },
          {
            foreignKeyName: "gf_assistance_requests_dispatched_vehicle_id_fkey"
            columns: ["dispatched_vehicle_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_assistance_requests_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_assistance_requests_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_assistance_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_assistance_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_assistance_requests_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_assistance_requests_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "gf_assistance_requests_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_assistance_requests_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_assistance_requests_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_assistance_requests_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_assistance_requests_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_active_trips"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "gf_assistance_requests_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_trip_overview"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "gf_assistance_requests_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_assistance_requests_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_vehicle_costs_summary"
            referencedColumns: ["veiculo_id"]
          },
          {
            foreignKeyName: "gf_assistance_requests_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_audit_log: {
        Row: {
          action_type: string
          actor_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          operator_id: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          actor_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          operator_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          actor_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          operator_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_audit_log_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_audit_log_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_budgets: {
        Row: {
          alert_threshold_percent: number | null
          budgeted_amount: number
          category_id: string | null
          category_name: string | null
          created_at: string | null
          created_by: string | null
          empresa_id: string | null
          id: string
          notes: string | null
          period_month: number
          period_year: number
          transportadora_id: string | null
          updated_at: string | null
        }
        Insert: {
          alert_threshold_percent?: number | null
          budgeted_amount: number
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          created_by?: string | null
          empresa_id?: string | null
          id?: string
          notes?: string | null
          period_month: number
          period_year: number
          transportadora_id?: string | null
          updated_at?: string | null
        }
        Update: {
          alert_threshold_percent?: number | null
          budgeted_amount?: number
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          created_by?: string | null
          empresa_id?: string | null
          id?: string
          notes?: string | null
          period_month?: number
          period_year?: number
          transportadora_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_budgets_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gf_cost_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_budgets_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_budgets_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_budgets_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_budgets_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "gf_budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_company_branding: {
        Row: {
          accent_hex: string | null
          created_at: string | null
          empresa_id: string
          logo_url: string | null
          name: string
          primary_hex: string | null
          updated_at: string | null
        }
        Insert: {
          accent_hex?: string | null
          created_at?: string | null
          empresa_id: string
          logo_url?: string | null
          name: string
          primary_hex?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_hex?: string | null
          created_at?: string | null
          empresa_id?: string
          logo_url?: string | null
          name?: string
          primary_hex?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_company_branding_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_company_branding_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_company_branding_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_company_branding_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      gf_company_documents: {
        Row: {
          created_at: string | null
          document_number: string | null
          document_type: string
          empresa_id: string
          expiry_date: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          notes: string | null
          status: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_number?: string | null
          document_type: string
          empresa_id: string
          expiry_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_number?: string | null
          document_type?: string
          empresa_id?: string
          expiry_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      gf_contracts: {
        Row: {
          created_at: string | null
          empresa_id: string
          end_date: string | null
          id: string
          name: string
          start_date: string
          status: string | null
          terms_url: string | null
          updated_at: string | null
          value_amount: number | null
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          end_date?: string | null
          id?: string
          name: string
          start_date: string
          status?: string | null
          terms_url?: string | null
          updated_at?: string | null
          value_amount?: number | null
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string
          status?: string | null
          terms_url?: string | null
          updated_at?: string | null
          value_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_contracts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_contracts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_contracts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_contracts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      gf_cost_categories: {
        Row: {
          color: string | null
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_operational: boolean | null
          keywords: string[] | null
          name: string
          parent_id: string | null
          profile_type: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_operational?: boolean | null
          keywords?: string[] | null
          name: string
          parent_id?: string | null
          profile_type: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_operational?: boolean | null
          keywords?: string[] | null
          name?: string
          parent_id?: string | null
          profile_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_cost_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "gf_cost_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_cost_centers: {
        Row: {
          code: string
          created_at: string | null
          empresa_id: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          empresa_id: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          empresa_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "gf_cost_centers_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_cost_centers_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_cost_centers_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_cost_centers_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      gf_costs: {
        Row: {
          amount: number
          cost_category_id: string
          cost_center_id: string | null
          cost_date: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          date: string | null
          empresa_id: string | null
          id: string
          invoice_id: string | null
          motorista_id: string | null
          notes: string | null
          qty: number | null
          rota_id: string | null
          source: string | null
          transportadora_id: string | null
          unit: string | null
          updated_at: string | null
          veiculo_id: string | null
        }
        Insert: {
          amount: number
          cost_category_id: string
          cost_center_id?: string | null
          cost_date: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          date?: string | null
          empresa_id?: string | null
          id?: string
          invoice_id?: string | null
          motorista_id?: string | null
          notes?: string | null
          qty?: number | null
          rota_id?: string | null
          source?: string | null
          transportadora_id?: string | null
          unit?: string | null
          updated_at?: string | null
          veiculo_id?: string | null
        }
        Update: {
          amount?: number
          cost_category_id?: string
          cost_center_id?: string | null
          cost_date?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          date?: string | null
          empresa_id?: string | null
          id?: string
          invoice_id?: string | null
          motorista_id?: string | null
          notes?: string | null
          qty?: number | null
          rota_id?: string | null
          source?: string | null
          transportadora_id?: string | null
          unit?: string | null
          updated_at?: string | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_gf_costs_cost_center"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "gf_cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_gf_costs_invoice"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "gf_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_gf_costs_invoice"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_costs_conciliation"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "gf_costs_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_costs_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_costs_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_costs_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "gf_costs_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_costs_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "gf_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_costs_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_vehicle_costs_summary"
            referencedColumns: ["veiculo_id"]
          },
          {
            foreignKeyName: "gf_costs_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_employee_company: {
        Row: {
          address: string
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip_code: string | null
          cpf: string
          created_at: string | null
          created_by: string | null
          email: string | null
          empresa_id: string
          id: string
          is_active: boolean | null
          latitude: number | null
          login_cpf: string
          longitude: number | null
          name: string
          password_hash: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip_code?: string | null
          cpf: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          empresa_id: string
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          login_cpf: string
          longitude?: number | null
          name: string
          password_hash?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip_code?: string | null
          cpf?: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          empresa_id?: string
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          login_cpf?: string
          longitude?: number | null
          name?: string
          password_hash?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_employee_company_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_employee_company_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_employee_company_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_employee_company_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "gf_employee_company_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_employee_company_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_escalated_alerts: {
        Row: {
          created_at: string | null
          id: string
          message: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source: string
          source_id: string | null
          source_name: string
          status: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          source: string
          source_id?: string | null
          source_name: string
          status?: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string
          source_id?: string | null
          source_name?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_escalated_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_escalated_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_event_store: {
        Row: {
          aggregate_id: string
          aggregate_type: string
          created_at: string | null
          event_data: Json
          event_id: string
          event_type: string
          id: string
          metadata: Json | null
          occurred_at: string
        }
        Insert: {
          aggregate_id: string
          aggregate_type: string
          created_at?: string | null
          event_data?: Json
          event_id: string
          event_type: string
          id?: string
          metadata?: Json | null
          occurred_at: string
        }
        Update: {
          aggregate_id?: string
          aggregate_type?: string
          created_at?: string | null
          event_data?: Json
          event_id?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
        }
        Relationships: []
      }
      gf_financial_alerts: {
        Row: {
          actual_value: number | null
          alert_type: string
          budget_id: string | null
          category_id: string | null
          cost_id: string | null
          created_at: string | null
          dismissed_at: string | null
          dismissed_by: string | null
          empresa_id: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          message: string
          severity: string | null
          threshold_value: number | null
          title: string
          transportadora_id: string | null
          variance_percent: number | null
        }
        Insert: {
          actual_value?: number | null
          alert_type: string
          budget_id?: string | null
          category_id?: string | null
          cost_id?: string | null
          created_at?: string | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          empresa_id?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message: string
          severity?: string | null
          threshold_value?: number | null
          title: string
          transportadora_id?: string | null
          variance_percent?: number | null
        }
        Update: {
          actual_value?: number | null
          alert_type?: string
          budget_id?: string | null
          category_id?: string | null
          cost_id?: string | null
          created_at?: string | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          empresa_id?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string
          severity?: string | null
          threshold_value?: number | null
          title?: string
          transportadora_id?: string | null
          variance_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_financial_alerts_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "gf_budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_financial_alerts_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_financial_alerts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gf_cost_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_financial_alerts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_financial_alerts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_financial_alerts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_financial_alerts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "gf_financial_alerts_cost_id_fkey"
            columns: ["cost_id"]
            isOneToOne: false
            referencedRelation: "gf_manual_costs_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_financial_alerts_dismissed_by_fkey"
            columns: ["dismissed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_financial_alerts_dismissed_by_fkey"
            columns: ["dismissed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_financial_forecasts: {
        Row: {
          actual_amount: number | null
          base_period_months: number | null
          calculation_method: string | null
          category_id: string | null
          confidence_level: number | null
          empresa_id: string | null
          forecast_type: string
          generated_at: string | null
          id: string
          notes: string | null
          period_month: number
          period_year: number
          projected_amount: number
          transportadora_id: string | null
        }
        Insert: {
          actual_amount?: number | null
          base_period_months?: number | null
          calculation_method?: string | null
          category_id?: string | null
          confidence_level?: number | null
          empresa_id?: string | null
          forecast_type: string
          generated_at?: string | null
          id?: string
          notes?: string | null
          period_month: number
          period_year: number
          projected_amount: number
          transportadora_id?: string | null
        }
        Update: {
          actual_amount?: number | null
          base_period_months?: number | null
          calculation_method?: string | null
          category_id?: string | null
          confidence_level?: number | null
          empresa_id?: string | null
          forecast_type?: string
          generated_at?: string | null
          id?: string
          notes?: string | null
          period_month?: number
          period_year?: number
          projected_amount?: number
          transportadora_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_financial_forecasts_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_financial_forecasts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gf_cost_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_financial_forecasts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_financial_forecasts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_financial_forecasts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_financial_forecasts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      gf_holidays: {
        Row: {
          created_at: string | null
          date: string
          empresa_id: string
          id: string
          is_recurring: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          date: string
          empresa_id: string
          id?: string
          is_recurring?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          date?: string
          empresa_id?: string
          id?: string
          is_recurring?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "gf_holidays_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_holidays_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_holidays_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_holidays_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      gf_incidents: {
        Row: {
          created_at: string
          description: string
          empresa_id: string
          id: string
          motorista_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          rota_id: string | null
          severity: string
          status: string
          veiculo_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          empresa_id: string
          id?: string
          motorista_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          rota_id?: string | null
          severity?: string
          status?: string
          veiculo_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          empresa_id?: string
          id?: string
          motorista_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          rota_id?: string | null
          severity?: string
          status?: string
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_incidents_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_incidents_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_incidents_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_incidents_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "gf_incidents_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_incidents_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_incidents_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_incidents_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_incidents_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_incidents_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "gf_incidents_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_incidents_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_incidents_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_incidents_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_incidents_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_vehicle_costs_summary"
            referencedColumns: ["veiculo_id"]
          },
          {
            foreignKeyName: "gf_incidents_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_invoice_lines: {
        Row: {
          amount: number
          description: string | null
          discrepancy: number | null
          id: string
          invoice_id: string | null
          invoiced_km: number | null
          invoiced_time: number | null
          invoiced_trips: number | null
          measured_km: number | null
          measured_time: number | null
          measured_trips: number | null
          notes: string | null
          rota_id: string | null
          unit_price: number | null
        }
        Insert: {
          amount: number
          description?: string | null
          discrepancy?: number | null
          id?: string
          invoice_id?: string | null
          invoiced_km?: number | null
          invoiced_time?: number | null
          invoiced_trips?: number | null
          measured_km?: number | null
          measured_time?: number | null
          measured_trips?: number | null
          notes?: string | null
          rota_id?: string | null
          unit_price?: number | null
        }
        Update: {
          amount?: number
          description?: string | null
          discrepancy?: number | null
          id?: string
          invoice_id?: string | null
          invoiced_km?: number | null
          invoiced_time?: number | null
          invoiced_trips?: number | null
          measured_km?: number | null
          measured_time?: number | null
          measured_trips?: number | null
          notes?: string | null
          rota_id?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "gf_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_costs_conciliation"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "gf_invoice_lines_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_invoice_lines_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "gf_invoice_lines_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_invoice_lines_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_invoice_lines_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_invoice_lines_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_invoices: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          empresa_id: string
          id: string
          invoice_number: string | null
          notes: string | null
          period_end: string
          period_start: string
          reconciled_by: string | null
          status: string | null
          total_amount: number
          transportadora_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          empresa_id: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          period_end: string
          period_start: string
          reconciled_by?: string | null
          status?: string | null
          total_amount: number
          transportadora_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          empresa_id?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          period_end?: string
          period_start?: string
          reconciled_by?: string | null
          status?: string | null
          total_amount?: number
          transportadora_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_invoices_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_invoices_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_invoices_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_invoices_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_invoices_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_invoices_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "gf_invoices_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_invoices_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_invoices_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_invoices_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "gf_invoices_reconciled_by_fkey"
            columns: ["reconciled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_invoices_reconciled_by_fkey"
            columns: ["reconciled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_manual_costs_v2: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          attachment_name: string | null
          attachment_url: string | null
          category_id: string | null
          cost_date: string
          created_at: string | null
          created_by: string | null
          description: string
          empresa_id: string | null
          id: string
          is_recurring: boolean | null
          motorista_id: string | null
          notes: string | null
          parent_recurring_id: string | null
          recurring_end_date: string | null
          recurring_interval: string | null
          rota_id: string | null
          status: string | null
          transportadora_id: string | null
          updated_at: string | null
          veiculo_id: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          category_id?: string | null
          cost_date: string
          created_at?: string | null
          created_by?: string | null
          description: string
          empresa_id?: string | null
          id?: string
          is_recurring?: boolean | null
          motorista_id?: string | null
          notes?: string | null
          parent_recurring_id?: string | null
          recurring_end_date?: string | null
          recurring_interval?: string | null
          rota_id?: string | null
          status?: string | null
          transportadora_id?: string | null
          updated_at?: string | null
          veiculo_id?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          category_id?: string | null
          cost_date?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          empresa_id?: string | null
          id?: string
          is_recurring?: boolean | null
          motorista_id?: string | null
          notes?: string | null
          parent_recurring_id?: string | null
          recurring_end_date?: string | null
          recurring_interval?: string | null
          rota_id?: string | null
          status?: string | null
          transportadora_id?: string | null
          updated_at?: string | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_manual_costs_v2_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gf_cost_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_parent_recurring_id_fkey"
            columns: ["parent_recurring_id"]
            isOneToOne: false
            referencedRelation: "gf_manual_costs_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_vehicle_costs_summary"
            referencedColumns: ["veiculo_id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_manual_revenues: {
        Row: {
          amount: number
          attachment_url: string | null
          category: string
          contract_reference: string | null
          created_at: string | null
          created_by: string | null
          description: string
          empresa_id: string | null
          id: string
          invoice_number: string | null
          is_recurring: boolean | null
          notes: string | null
          recurring_interval: string | null
          revenue_date: string
          status: string | null
          transportadora_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          category: string
          contract_reference?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          empresa_id?: string | null
          id?: string
          invoice_number?: string | null
          is_recurring?: boolean | null
          notes?: string | null
          recurring_interval?: string | null
          revenue_date: string
          status?: string | null
          transportadora_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          category?: string
          contract_reference?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          empresa_id?: string | null
          id?: string
          invoice_number?: string | null
          is_recurring?: boolean | null
          notes?: string | null
          recurring_interval?: string | null
          revenue_date?: string
          status?: string | null
          transportadora_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_manual_revenues_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_manual_revenues_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_manual_revenues_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_manual_revenues_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_manual_revenues_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "gf_manual_revenues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_manual_revenues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_monthly_reports: {
        Row: {
          data: Json
          empresa_id: string | null
          generated_at: string | null
          id: string
          report_month: string
          status: string | null
        }
        Insert: {
          data: Json
          empresa_id?: string | null
          generated_at?: string | null
          id?: string
          report_month: string
          status?: string | null
        }
        Update: {
          data?: Json
          empresa_id?: string | null
          generated_at?: string | null
          id?: string
          report_month?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_monthly_reports_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_monthly_reports_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_monthly_reports_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_monthly_reports_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      gf_motorista_compensation: {
        Row: {
          base_salary: number | null
          contract_type: string | null
          created_at: string | null
          currency: string | null
          end_date: string | null
          has_health_insurance: boolean | null
          has_meal_allowance: boolean | null
          has_transport_allowance: boolean | null
          health_insurance_value: number | null
          id: string
          is_active: boolean | null
          meal_allowance_value: number | null
          motorista_id: string
          payment_frequency: string | null
          start_date: string | null
          transport_allowance_value: number | null
          updated_at: string | null
        }
        Insert: {
          base_salary?: number | null
          contract_type?: string | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          has_health_insurance?: boolean | null
          has_meal_allowance?: boolean | null
          has_transport_allowance?: boolean | null
          health_insurance_value?: number | null
          id?: string
          is_active?: boolean | null
          meal_allowance_value?: number | null
          motorista_id: string
          payment_frequency?: string | null
          start_date?: string | null
          transport_allowance_value?: number | null
          updated_at?: string | null
        }
        Update: {
          base_salary?: number | null
          contract_type?: string | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          has_health_insurance?: boolean | null
          has_meal_allowance?: boolean | null
          has_transport_allowance?: boolean | null
          health_insurance_value?: number | null
          id?: string
          is_active?: boolean | null
          meal_allowance_value?: number | null
          motorista_id?: string
          payment_frequency?: string | null
          start_date?: string | null
          transport_allowance_value?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gf_motorista_documentos: {
        Row: {
          created_at: string | null
          document_number: string | null
          document_type: string
          expires_at: string | null
          expiry_date: string | null
          file_name: string | null
          file_url: string | null
          id: string
          is_valid: boolean | null
          motorista_id: string
          notes: string | null
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_number?: string | null
          document_type: string
          expires_at?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_valid?: boolean | null
          motorista_id: string
          notes?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_number?: string | null
          document_type?: string
          expires_at?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_valid?: boolean | null
          motorista_id?: string
          notes?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_driver_documents_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_driver_documents_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_motorista_eventos: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          meta: Json | null
          motorista_id: string
          points: number | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          meta?: Json | null
          motorista_id: string
          points?: number | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          meta?: Json | null
          motorista_id?: string
          points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_driver_events_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_driver_events_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      gf_operador_audits: {
        Row: {
          audit_type: string
          checklist_data: Json | null
          created_at: string | null
          created_by: string | null
          empresa_id: string
          id: string
          notes: string | null
        }
        Insert: {
          audit_type: string
          checklist_data?: Json | null
          created_at?: string | null
          created_by?: string | null
          empresa_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          audit_type?: string
          checklist_data?: Json | null
          created_at?: string | null
          created_by?: string | null
          empresa_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_operator_audits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operator_audits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operator_audits_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operator_audits_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operator_audits_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_operator_audits_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      gf_operador_documents: {
        Row: {
          created_at: string | null
          created_by: string | null
          document_type: string | null
          document_url: string
          empresa_id: string
          expires_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          document_type?: string | null
          document_url: string
          empresa_id: string
          expires_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          document_type?: string | null
          document_url?: string
          empresa_id?: string
          expires_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "gf_operator_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operator_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operator_documents_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operator_documents_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operator_documents_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_operator_documents_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      gf_operador_incidents: {
        Row: {
          created_at: string | null
          created_by: string | null
          descricao: string
          empresa_id: string
          id: string
          resolved_at: string | null
          resolved_by: string | null
          rota_id: string | null
          severidade: string | null
          status: string | null
          tipo: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          descricao: string
          empresa_id: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          rota_id?: string | null
          severidade?: string | null
          status?: string | null
          tipo: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          descricao?: string
          empresa_id?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          rota_id?: string | null
          severidade?: string | null
          status?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "gf_operator_incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operator_incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operator_incidents_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operator_incidents_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operator_incidents_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_operator_incidents_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "gf_operator_incidents_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operator_incidents_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operator_incidents_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operator_incidents_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "gf_operator_incidents_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_operator_incidents_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_operator_incidents_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operator_incidents_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_operador_settings: {
        Row: {
          created_at: string | null
          empresa_id: string
          id: string
          timezone: string | null
          tolerancias: Json | null
          turnos_padrao: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          id?: string
          timezone?: string | null
          tolerancias?: Json | null
          turnos_padrao?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          id?: string
          timezone?: string | null
          tolerancias?: Json | null
          turnos_padrao?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_operator_settings_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operator_settings_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operator_settings_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_operator_settings_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      gf_operational_alerts: {
        Row: {
          created_at: string | null
          details: Json | null
          empresa_id: string | null
          id: string
          message: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          rota_id: string | null
          severity: string
          title: string
          transportadora_id: string | null
          type: string
          updated_at: string | null
          veiculo_id: string | null
          viagem_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          empresa_id?: string | null
          id?: string
          message: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          rota_id?: string | null
          severity: string
          title: string
          transportadora_id?: string | null
          type: string
          updated_at?: string | null
          veiculo_id?: string | null
          viagem_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          empresa_id?: string | null
          id?: string
          message?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          rota_id?: string | null
          severity?: string
          title?: string
          transportadora_id?: string | null
          type?: string
          updated_at?: string | null
          veiculo_id?: string | null
          viagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_operational_alerts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operational_alerts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operational_alerts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_operational_alerts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "gf_operational_alerts_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operational_alerts_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "gf_operational_alerts_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_operational_alerts_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_operational_alerts_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operational_alerts_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operational_alerts_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_active_trips"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "gf_operational_alerts_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_trip_overview"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "gf_operational_alerts_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_operational_alerts_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_vehicle_costs_summary"
            referencedColumns: ["veiculo_id"]
          },
          {
            foreignKeyName: "gf_operational_alerts_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_report_history: {
        Row: {
          empresa_id: string
          error_message: string | null
          file_url: string | null
          generated_at: string
          id: string
          recipients: string[] | null
          report_key: string
          schedule_id: string | null
          status: string
        }
        Insert: {
          empresa_id: string
          error_message?: string | null
          file_url?: string | null
          generated_at?: string
          id?: string
          recipients?: string[] | null
          report_key: string
          schedule_id?: string | null
          status?: string
        }
        Update: {
          empresa_id?: string
          error_message?: string | null
          file_url?: string | null
          generated_at?: string
          id?: string
          recipients?: string[] | null
          report_key?: string
          schedule_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "gf_report_history_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_report_history_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_report_history_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_report_history_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "gf_report_history_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "gf_report_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_report_schedules: {
        Row: {
          created_at: string | null
          created_by: string | null
          cron: string
          empresa_id: string
          id: string
          is_active: boolean | null
          recipients: string[]
          report_key: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          cron: string
          empresa_id: string
          id?: string
          is_active?: boolean | null
          recipients: string[]
          report_key: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          cron?: string
          empresa_id?: string
          id?: string
          is_active?: boolean | null
          recipients?: string[]
          report_key?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_report_schedules_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_report_schedules_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_report_schedules_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_report_schedules_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "gf_report_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_report_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gf_rota_otimizacao_cache: {
        Row: {
          cached_at: string
          etas: Json
          optimized_order: Json
          rota_id: string
        }
        Insert: {
          cached_at?: string
          etas: Json
          optimized_order: Json
          rota_id: string
        }
        Update: {
          cached_at?: string
          etas?: Json
          optimized_order?: Json
          rota_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gf_route_optimization_cache_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: true
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_route_optimization_cache_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: true
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "gf_route_optimization_cache_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: true
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_route_optimization_cache_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: true
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_route_optimization_cache_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: true
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_route_optimization_cache_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: true
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_rota_plano: {
        Row: {
          address: string | null
          created_at: string | null
          employee_id: string | null
          estimated_arrival_time: string | null
          id: string
          latitude: number
          longitude: number
          passenger_id: string | null
          rota_id: string
          stop_name: string | null
          stop_order: number
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          employee_id?: string | null
          estimated_arrival_time?: string | null
          id?: string
          latitude: number
          longitude: number
          passenger_id?: string | null
          rota_id: string
          stop_name?: string | null
          stop_order: number
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          employee_id?: string | null
          estimated_arrival_time?: string | null
          id?: string
          latitude?: number
          longitude?: number
          passenger_id?: string | null
          rota_id?: string
          stop_name?: string | null
          stop_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_route_plan_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "gf_employee_company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_route_plan_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_operator_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_route_plan_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_operator_employees_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_route_plan_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_route_plan_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_route_plan_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_route_plan_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "gf_route_plan_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_route_plan_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_route_plan_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_route_plan_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_service_requests: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          empresa_id: string
          id: string
          notes: string | null
          payload: Json
          priority: string | null
          resolved_at: string | null
          sla_target: string | null
          status: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          empresa_id: string
          id?: string
          notes?: string | null
          payload: Json
          priority?: string | null
          resolved_at?: string | null
          sla_target?: string | null
          status?: string | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          empresa_id?: string
          id?: string
          notes?: string | null
          payload?: Json
          priority?: string | null
          resolved_at?: string | null
          sla_target?: string | null
          status?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_service_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_service_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_service_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_service_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_service_requests_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_service_requests_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_service_requests_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_service_requests_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      gf_transportadora_documents: {
        Row: {
          created_at: string | null
          document_number: string | null
          document_type: string
          expiry_date: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          notes: string | null
          status: string | null
          transportadora_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_number?: string | null
          document_type: string
          expiry_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          status?: string | null
          transportadora_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_number?: string | null
          document_type?: string
          expiry_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          status?: string | null
          transportadora_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      gf_transportadoras_atribuidas: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          empresa_id: string
          id: string
          notes: string | null
          period_end: string | null
          period_start: string
          transportadora_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          empresa_id: string
          id?: string
          notes?: string | null
          period_end?: string | null
          period_start: string
          transportadora_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
          empresa_id?: string
          id?: string
          notes?: string | null
          period_end?: string | null
          period_start?: string
          transportadora_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gf_assigned_carriers_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_assigned_carriers_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_assigned_carriers_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_assigned_carriers_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_assigned_carriers_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_assigned_carriers_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "gf_assigned_carriers_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_assigned_carriers_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_assigned_carriers_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_assigned_carriers_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      gf_user_company_map: {
        Row: {
          created_at: string | null
          empresa_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gf_user_company_map_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_user_company_map_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_user_company_map_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_user_company_map_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      gf_user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          expires_at: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gf_user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "gf_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_veiculo_checklists: {
        Row: {
          created_at: string | null
          filled_at: string
          id: string
          issues: Json | null
          motorista_id: string | null
          notes: string | null
          status: string
          updated_at: string | null
          veiculo_id: string
        }
        Insert: {
          created_at?: string | null
          filled_at?: string
          id?: string
          issues?: Json | null
          motorista_id?: string | null
          notes?: string | null
          status?: string
          updated_at?: string | null
          veiculo_id: string
        }
        Update: {
          created_at?: string | null
          filled_at?: string
          id?: string
          issues?: Json | null
          motorista_id?: string | null
          notes?: string | null
          status?: string
          updated_at?: string | null
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gf_vehicle_checklists_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_vehicle_checklists_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_vehicle_checklists_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_vehicle_costs_summary"
            referencedColumns: ["veiculo_id"]
          },
          {
            foreignKeyName: "gf_vehicle_checklists_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_veiculo_custos: {
        Row: {
          created_at: string | null
          date: string | null
          fuel: number | null
          id: string
          km: number | null
          maintenance: number | null
          notes: string | null
          other_costs: number | null
          rota_id: string | null
          total: number | null
          updated_at: string | null
          veiculo_id: string | null
          viagem_id: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          fuel?: number | null
          id?: string
          km?: number | null
          maintenance?: number | null
          notes?: string | null
          other_costs?: number | null
          rota_id?: string | null
          total?: number | null
          updated_at?: string | null
          veiculo_id?: string | null
          viagem_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          fuel?: number | null
          id?: string
          km?: number | null
          maintenance?: number | null
          notes?: string | null
          other_costs?: number | null
          rota_id?: string | null
          total?: number | null
          updated_at?: string | null
          veiculo_id?: string | null
          viagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_vehicle_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_vehicle_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "gf_vehicle_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_vehicle_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_vehicle_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_vehicle_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_vehicle_costs_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_active_trips"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "gf_vehicle_costs_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_trip_overview"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "gf_vehicle_costs_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_vehicle_costs_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_vehicle_costs_summary"
            referencedColumns: ["veiculo_id"]
          },
          {
            foreignKeyName: "gf_vehicle_costs_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_veiculo_docs_v2: {
        Row: {
          id: string | null
        }
        Insert: {
          id?: string | null
        }
        Update: {
          id?: string | null
        }
        Relationships: []
      }
      gf_veiculo_documentos: {
        Row: {
          created_at: string | null
          document_number: string | null
          document_type: string
          expiry_date: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          notes: string | null
          status: string | null
          updated_at: string | null
          uploaded_by: string | null
          veiculo_id: string
        }
        Insert: {
          created_at?: string | null
          document_number?: string | null
          document_type: string
          expiry_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          veiculo_id: string
        }
        Update: {
          created_at?: string | null
          document_number?: string | null
          document_type?: string
          expiry_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          veiculo_id?: string
        }
        Relationships: []
      }
      gf_veiculo_manutencoes: {
        Row: {
          cost: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_at: string | null
          id: string
          km_at_service: number | null
          maintenance_type: string
          next_service_date: string | null
          next_service_km: number | null
          notes: string | null
          service_date: string
          service_provider: string | null
          status: string | null
          type: string | null
          updated_at: string | null
          veiculo_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          km_at_service?: number | null
          maintenance_type: string
          next_service_date?: string | null
          next_service_km?: number | null
          notes?: string | null
          service_date: string
          service_provider?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          veiculo_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          km_at_service?: number | null
          maintenance_type?: string
          next_service_date?: string | null
          next_service_km?: number | null
          notes?: string | null
          service_date?: string
          service_provider?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gf_vehicle_maintenance_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_vehicle_maintenance_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_vehicle_maintenance_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_vehicle_costs_summary"
            referencedColumns: ["veiculo_id"]
          },
          {
            foreignKeyName: "gf_vehicle_maintenance_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      gf_web_vitals: {
        Row: {
          created_at: string
          id: number
          metrics: Json
          timestamp: string
          url: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          metrics: Json
          timestamp: string
          url: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          metrics?: Json
          timestamp?: string
          url?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      motorista_documentos: {
        Row: {
          created_at: string | null
          document_number: string | null
          document_type: string
          expiry_date: string | null
          file_name: string
          file_size_bytes: number | null
          file_url: string
          id: string
          issue_date: string | null
          motorista_id: string
          notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_number?: string | null
          document_type: string
          expiry_date?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_url: string
          id?: string
          issue_date?: string | null
          motorista_id: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_number?: string | null
          document_type?: string
          expiry_date?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          issue_date?: string | null
          motorista_id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_documents_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_documents_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      motorista_exames_medicos: {
        Row: {
          clinic_name: string | null
          created_at: string | null
          doctor_crm: string | null
          doctor_name: string | null
          exam_date: string
          exam_type: string
          expiry_date: string
          file_name: string | null
          file_url: string | null
          id: string
          motorista_id: string
          notes: string | null
          result: string | null
          updated_at: string | null
        }
        Insert: {
          clinic_name?: string | null
          created_at?: string | null
          doctor_crm?: string | null
          doctor_name?: string | null
          exam_date: string
          exam_type: string
          expiry_date: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          motorista_id: string
          notes?: string | null
          result?: string | null
          updated_at?: string | null
        }
        Update: {
          clinic_name?: string | null
          created_at?: string | null
          doctor_crm?: string | null
          doctor_name?: string | null
          exam_date?: string
          exam_type?: string
          expiry_date?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          motorista_id?: string
          notes?: string | null
          result?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_medical_exams_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_medical_exams_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      motorista_locations: {
        Row: {
          accuracy: number | null
          altitude: number | null
          heading: number | null
          id: string
          latitude: number
          longitude: number
          motorista_id: string | null
          recorded_at: string | null
          speed: number | null
          viagem_id: string | null
        }
        Insert: {
          accuracy?: number | null
          altitude?: number | null
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          motorista_id?: string | null
          recorded_at?: string | null
          speed?: number | null
          viagem_id?: string | null
        }
        Update: {
          accuracy?: number | null
          altitude?: number | null
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          motorista_id?: string | null
          recorded_at?: string | null
          speed?: number | null
          viagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_locations_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_active_trips"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "driver_locations_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_trip_overview"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "driver_locations_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      motorista_messages: {
        Row: {
          created_at: string | null
          id: string
          is_emergency: boolean | null
          message: string
          message_type: string | null
          metadata: Json | null
          motorista_id: string
          read_at: string | null
          sender: string
          transportadora_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_emergency?: boolean | null
          message: string
          message_type?: string | null
          metadata?: Json | null
          motorista_id: string
          read_at?: string | null
          sender: string
          transportadora_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_emergency?: boolean | null
          message?: string
          message_type?: string | null
          metadata?: Json | null
          motorista_id?: string
          read_at?: string | null
          sender?: string
          transportadora_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_messages_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_messages_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      motorista_positions: {
        Row: {
          heading: number | null
          id: string
          lat: number
          lng: number
          motorista_id: string | null
          speed: number | null
          timestamp: string
          viagem_id: string | null
        }
        Insert: {
          heading?: number | null
          id?: string
          lat: number
          lng: number
          motorista_id?: string | null
          speed?: number | null
          timestamp?: string
          viagem_id?: string | null
        }
        Update: {
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          motorista_id?: string | null
          speed?: number | null
          timestamp?: string
          viagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_positions_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_positions_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_positions_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_active_trips"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "driver_positions_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_trip_overview"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "driver_positions_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      passageiro_cancellations: {
        Row: {
          created_at: string | null
          id: string
          passenger_id: string
          pause_notifications: boolean | null
          pause_until: string | null
          reason: string
          reason_details: string | null
          scheduled_date: string
          viagem_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          passenger_id: string
          pause_notifications?: boolean | null
          pause_until?: string | null
          reason: string
          reason_details?: string | null
          scheduled_date: string
          viagem_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          passenger_id?: string
          pause_notifications?: boolean | null
          pause_until?: string | null
          reason?: string
          reason_details?: string | null
          scheduled_date?: string
          viagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passenger_cancellations_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passenger_cancellations_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passenger_cancellations_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_active_trips"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "passenger_cancellations_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_trip_overview"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "passenger_cancellations_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      passageiro_checkins: {
        Row: {
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          method: string | null
          motorista_id: string | null
          passenger_id: string | null
          passenger_identifier: string | null
          stop_name: string | null
          type: string
          viagem_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          method?: string | null
          motorista_id?: string | null
          passenger_id?: string | null
          passenger_identifier?: string | null
          stop_name?: string | null
          type: string
          viagem_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          method?: string | null
          motorista_id?: string | null
          passenger_id?: string | null
          passenger_identifier?: string | null
          stop_name?: string | null
          type?: string
          viagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passenger_checkins_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passenger_checkins_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passenger_checkins_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passenger_checkins_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passenger_checkins_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_active_trips"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "passenger_checkins_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_trip_overview"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "passenger_checkins_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      passenger_reports: {
        Row: {
          created_at: string | null
          id: string
          kind: string
          message: string | null
          passenger_id: string | null
          viagem_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          kind: string
          message?: string | null
          passenger_id?: string | null
          viagem_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          kind?: string
          message?: string | null
          passenger_id?: string | null
          viagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passenger_reports_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passenger_reports_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passenger_reports_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_active_trips"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "passenger_reports_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_trip_overview"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "passenger_reports_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      rota_custos: {
        Row: {
          cost_date: string
          cost_per_passenger_brl: number | null
          created_at: string | null
          distance_km: number | null
          fixed_cost_brl: number | null
          fuel_cost_brl: number | null
          id: string
          labor_cost_brl: number | null
          maintenance_cost_brl: number | null
          notes: string | null
          passengers_transported: number | null
          rota_id: string
          toll_cost_brl: number | null
          total_cost_brl: number | null
          viagem_id: string | null
        }
        Insert: {
          cost_date: string
          cost_per_passenger_brl?: number | null
          created_at?: string | null
          distance_km?: number | null
          fixed_cost_brl?: number | null
          fuel_cost_brl?: number | null
          id?: string
          labor_cost_brl?: number | null
          maintenance_cost_brl?: number | null
          notes?: string | null
          passengers_transported?: number | null
          rota_id: string
          toll_cost_brl?: number | null
          total_cost_brl?: number | null
          viagem_id?: string | null
        }
        Update: {
          cost_date?: string
          cost_per_passenger_brl?: number | null
          created_at?: string | null
          distance_km?: number | null
          fixed_cost_brl?: number | null
          fuel_cost_brl?: number | null
          id?: string
          labor_cost_brl?: number | null
          maintenance_cost_brl?: number | null
          notes?: string | null
          passengers_transported?: number | null
          rota_id?: string
          toll_cost_brl?: number | null
          total_cost_brl?: number | null
          viagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "route_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "route_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "route_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_costs_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_active_trips"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "route_costs_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_trip_overview"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "route_costs_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      rota_paradas: {
        Row: {
          id: string
          lat: number
          lng: number
          name: string
          radius_m: number | null
          rota_id: string | null
          seq: number
        }
        Insert: {
          id?: string
          lat: number
          lng: number
          name: string
          radius_m?: number | null
          rota_id?: string | null
          seq: number
        }
        Update: {
          id?: string
          lat?: number
          lng?: number
          name?: string
          radius_m?: number | null
          rota_id?: string | null
          seq?: number
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      rotas: {
        Row: {
          created_at: string | null
          empresa_id: string
          id: string
          is_active: boolean | null
          name: string
          transportadora_id: string
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          id?: string
          is_active?: boolean | null
          name: string
          transportadora_id: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          transportadora_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      transportadoras: {
        Row: {
          address: string | null
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip_code: string | null
          bank_account: string | null
          bank_account_type: string | null
          bank_agency: string | null
          bank_code: string | null
          bank_name: string | null
          cnpj: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          legal_rep_cpf: string | null
          legal_rep_email: string | null
          legal_rep_name: string | null
          legal_rep_phone: string | null
          legal_rep_rg: string | null
          municipal_registration: string | null
          name: string
          phone: string | null
          pix_key: string | null
          pix_key_type: string | null
          state_registration: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip_code?: string | null
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_code?: string | null
          bank_name?: string | null
          cnpj?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          legal_rep_cpf?: string | null
          legal_rep_email?: string | null
          legal_rep_name?: string | null
          legal_rep_phone?: string | null
          legal_rep_rg?: string | null
          municipal_registration?: string | null
          name: string
          phone?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          state_registration?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip_code?: string | null
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_code?: string | null
          bank_name?: string | null
          cnpj?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          legal_rep_cpf?: string | null
          legal_rep_email?: string | null
          legal_rep_name?: string | null
          legal_rep_phone?: string | null
          legal_rep_rg?: string | null
          municipal_registration?: string | null
          name?: string
          phone?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          state_registration?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string | null
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform?: string | null
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string | null
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip_code: string | null
          avatar_url: string | null
          cnh: string | null
          cnh_category: string | null
          cpf: string | null
          created_at: string | null
          email: string
          empresa_id: string | null
          id: string
          is_active: boolean | null
          name: string | null
          phone: string | null
          role: string
          transportadora_id: string | null
          updated_at: string | null
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip_code?: string | null
          avatar_url?: string | null
          cnh?: string | null
          cnh_category?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          empresa_id?: string | null
          id: string
          is_active?: boolean | null
          name?: string | null
          phone?: string | null
          role: string
          transportadora_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip_code?: string | null
          avatar_url?: string | null
          cnh?: string | null
          cnh_category?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          empresa_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          phone?: string | null
          role?: string
          transportadora_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      users_role_backup: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          name: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
          role?: string | null
        }
        Relationships: []
      }
      veiculo_checklists: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          items: Json
          motorista_id: string | null
          notes: string | null
          odometer_reading: number | null
          photos: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          trip_id: string | null
          updated_at: string | null
          veiculo_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          items?: Json
          motorista_id?: string | null
          notes?: string | null
          odometer_reading?: number | null
          photos?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          trip_id?: string | null
          updated_at?: string | null
          veiculo_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          items?: Json
          motorista_id?: string | null
          notes?: string | null
          odometer_reading?: number | null
          photos?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          trip_id?: string | null
          updated_at?: string | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_checklists_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_checklists_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_checklists_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_checklists_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_checklists_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "v_active_trips"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "vehicle_checklists_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "v_trip_overview"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "vehicle_checklists_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_checklists_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_vehicle_costs_summary"
            referencedColumns: ["veiculo_id"]
          },
          {
            foreignKeyName: "vehicle_checklists_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculo_custos: {
        Row: {
          amount_brl: number
          cost_category: string
          cost_date: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          invoice_number: string | null
          odometer_km: number | null
          quantity: number | null
          supplier: string | null
          unit_measure: string | null
          updated_at: string | null
          veiculo_id: string
        }
        Insert: {
          amount_brl: number
          cost_category: string
          cost_date: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          invoice_number?: string | null
          odometer_km?: number | null
          quantity?: number | null
          supplier?: string | null
          unit_measure?: string | null
          updated_at?: string | null
          veiculo_id: string
        }
        Update: {
          amount_brl?: number
          cost_category?: string
          cost_date?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          invoice_number?: string | null
          odometer_km?: number | null
          quantity?: number | null
          supplier?: string | null
          unit_measure?: string | null
          updated_at?: string | null
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_costs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_costs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_costs_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_vehicle_costs_summary"
            referencedColumns: ["veiculo_id"]
          },
          {
            foreignKeyName: "vehicle_costs_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculo_documentos: {
        Row: {
          created_at: string | null
          document_number: string | null
          document_type: string
          expiry_date: string | null
          file_name: string | null
          file_url: string | null
          id: string
          insurance_company: string | null
          issue_date: string | null
          notes: string | null
          policy_number: string | null
          status: string | null
          updated_at: string | null
          value_brl: number | null
          veiculo_id: string
        }
        Insert: {
          created_at?: string | null
          document_number?: string | null
          document_type: string
          expiry_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          insurance_company?: string | null
          issue_date?: string | null
          notes?: string | null
          policy_number?: string | null
          status?: string | null
          updated_at?: string | null
          value_brl?: number | null
          veiculo_id: string
        }
        Update: {
          created_at?: string | null
          document_number?: string | null
          document_type?: string
          expiry_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          insurance_company?: string | null
          issue_date?: string | null
          notes?: string | null
          policy_number?: string | null
          status?: string | null
          updated_at?: string | null
          value_brl?: number | null
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_vehicle_costs_summary"
            referencedColumns: ["veiculo_id"]
          },
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculo_manutencoes: {
        Row: {
          completed_date: string | null
          cost_labor_brl: number | null
          cost_parts_brl: number | null
          created_at: string | null
          description: string
          id: string
          maintenance_type: string
          mechanic_name: string | null
          next_maintenance_date: string | null
          notes: string | null
          odometer_km: number | null
          scheduled_date: string | null
          status: string | null
          total_cost_brl: number | null
          updated_at: string | null
          veiculo_id: string
          workshop_name: string | null
        }
        Insert: {
          completed_date?: string | null
          cost_labor_brl?: number | null
          cost_parts_brl?: number | null
          created_at?: string | null
          description: string
          id?: string
          maintenance_type: string
          mechanic_name?: string | null
          next_maintenance_date?: string | null
          notes?: string | null
          odometer_km?: number | null
          scheduled_date?: string | null
          status?: string | null
          total_cost_brl?: number | null
          updated_at?: string | null
          veiculo_id: string
          workshop_name?: string | null
        }
        Update: {
          completed_date?: string | null
          cost_labor_brl?: number | null
          cost_parts_brl?: number | null
          created_at?: string | null
          description?: string
          id?: string
          maintenance_type?: string
          mechanic_name?: string | null
          next_maintenance_date?: string | null
          notes?: string | null
          odometer_km?: number | null
          scheduled_date?: string | null
          status?: string | null
          total_cost_brl?: number | null
          updated_at?: string | null
          veiculo_id?: string
          workshop_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_maintenances_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_vehicle_costs_summary"
            referencedColumns: ["veiculo_id"]
          },
          {
            foreignKeyName: "vehicle_maintenances_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculos: {
        Row: {
          capacity: number | null
          chassis: string | null
          color: string | null
          created_at: string | null
          empresa_id: string | null
          fuel_type: string | null
          id: string
          is_active: boolean
          manufacturer: string | null
          model: string | null
          photo_url: string | null
          plate: string
          prefix: string | null
          renavam: string | null
          transportadora_id: string | null
          updated_at: string | null
          vehicle_type: string | null
          year: number | null
        }
        Insert: {
          capacity?: number | null
          chassis?: string | null
          color?: string | null
          created_at?: string | null
          empresa_id?: string | null
          fuel_type?: string | null
          id?: string
          is_active?: boolean
          manufacturer?: string | null
          model?: string | null
          photo_url?: string | null
          plate: string
          prefix?: string | null
          renavam?: string | null
          transportadora_id?: string | null
          updated_at?: string | null
          vehicle_type?: string | null
          year?: number | null
        }
        Update: {
          capacity?: number | null
          chassis?: string | null
          color?: string | null
          created_at?: string | null
          empresa_id?: string | null
          fuel_type?: string | null
          id?: string
          is_active?: boolean
          manufacturer?: string | null
          model?: string | null
          photo_url?: string | null
          plate?: string
          prefix?: string | null
          renavam?: string | null
          transportadora_id?: string | null
          updated_at?: string | null
          vehicle_type?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_vehicles_company"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_vehicles_company"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_vehicles_company"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "fk_vehicles_company"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "vehicles_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      viagem_avaliacoes: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          motorista_id: string | null
          nps_score: number
          passenger_id: string
          tags: Json | null
          viagem_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          motorista_id?: string | null
          nps_score: number
          passenger_id: string
          tags?: Json | null
          viagem_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          motorista_id?: string | null
          nps_score?: number
          passenger_id?: string
          tags?: Json | null
          viagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_evaluations_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_evaluations_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_evaluations_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_evaluations_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_evaluations_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_active_trips"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "trip_evaluations_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_trip_overview"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "trip_evaluations_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      viagem_eventos: {
        Row: {
          description: string | null
          event_type: string
          id: string
          lat: number | null
          lng: number | null
          motorista_id: string | null
          timestamp: string
          viagem_id: string | null
        }
        Insert: {
          description?: string | null
          event_type: string
          id?: string
          lat?: number | null
          lng?: number | null
          motorista_id?: string | null
          timestamp?: string
          viagem_id?: string | null
        }
        Update: {
          description?: string | null
          event_type?: string
          id?: string
          lat?: number | null
          lng?: number | null
          motorista_id?: string | null
          timestamp?: string
          viagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_events_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_events_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_events_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_active_trips"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "trip_events_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_trip_overview"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "trip_events_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      viagem_passageiros: {
        Row: {
          passenger_id: string
          status: string | null
          viagem_id: string
        }
        Insert: {
          passenger_id: string
          status?: string | null
          viagem_id: string
        }
        Update: {
          passenger_id?: string
          status?: string | null
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_passengers_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_passengers_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_passengers_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_active_trips"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "trip_passengers_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_trip_overview"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "trip_passengers_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      viagem_resumo: {
        Row: {
          avg_speed_kmh: number | null
          created_at: string | null
          duration_minutes: number | null
          end_time: string | null
          id: string
          samples: number | null
          start_time: string | null
          total_distance_km: number | null
          updated_at: string | null
          viagem_id: string | null
        }
        Insert: {
          avg_speed_kmh?: number | null
          created_at?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          samples?: number | null
          start_time?: string | null
          total_distance_km?: number | null
          updated_at?: string | null
          viagem_id?: string | null
        }
        Update: {
          avg_speed_kmh?: number | null
          created_at?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          samples?: number | null
          start_time?: string | null
          total_distance_km?: number | null
          updated_at?: string | null
          viagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_summary_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: true
            referencedRelation: "v_active_trips"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "trip_summary_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: true
            referencedRelation: "v_trip_overview"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "trip_summary_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: true
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      viagens: {
        Row: {
          completed_at: string | null
          distance_km: number | null
          end_time: string | null
          id: string
          motorista_id: string | null
          passenger_ids: string[] | null
          rota_id: string
          scheduled_at: string | null
          scheduled_date: string | null
          start_time: string | null
          started_at: string | null
          status: string
          updated_at: string | null
          veiculo_id: string | null
        }
        Insert: {
          completed_at?: string | null
          distance_km?: number | null
          end_time?: string | null
          id?: string
          motorista_id?: string | null
          passenger_ids?: string[] | null
          rota_id: string
          scheduled_at?: string | null
          scheduled_date?: string | null
          start_time?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          veiculo_id?: string | null
        }
        Update: {
          completed_at?: string | null
          distance_km?: number | null
          end_time?: string | null
          id?: string
          motorista_id?: string | null
          passenger_ids?: string[] | null
          rota_id?: string
          scheduled_at?: string | null
          scheduled_date?: string | null
          start_time?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_vehicle_costs_summary"
            referencedColumns: ["veiculo_id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_admin_kpis: {
        Row: {
          active_trips: number | null
          active_vehicles: number | null
          last_updated: string | null
          total_companies: number | null
          total_drivers: number | null
          total_operators: number | null
          total_passengers: number | null
        }
        Relationships: []
      }
      mv_costs_monthly: {
        Row: {
          company_id: string | null
          cost_records_count: number | null
          first_cost_date: string | null
          last_cost_date: string | null
          period_month: number | null
          period_year: number | null
          refreshed_at: string | null
          total_amount: number | null
          total_qty: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      profiles: {
        Row: {
          email: string | null
          empresa_id: string | null
          id: string | null
          name: string | null
          role: string | null
          transportadora_id: string | null
        }
        Insert: {
          email?: string | null
          empresa_id?: string | null
          id?: string | null
          name?: never
          role?: string | null
          transportadora_id?: string | null
        }
        Update: {
          email?: string | null
          empresa_id?: string | null
          id?: string | null
          name?: never
          role?: string | null
          transportadora_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_active_trips: {
        Row: {
          active_passengers: number | null
          company_name: string | null
          destination: string | null
          driver_email: string | null
          driver_name: string | null
          empresa_id: string | null
          last_lat: number | null
          last_lng: number | null
          last_position_at: string | null
          last_speed: number | null
          motorista_id: string | null
          origin: string | null
          picked_up_count: number | null
          rota_id: string | null
          route_name: string | null
          scheduled_at: string | null
          started_at: string | null
          status: string | null
          time_since_update: unknown
          vehicle_model: string | null
          vehicle_plate: string | null
          veiculo_id: string | null
          viagem_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_vehicle_costs_summary"
            referencedColumns: ["veiculo_id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      v_admin_dashboard_kpis: {
        Row: {
          active_trips: number | null
          active_vehicles: number | null
          total_companies: number | null
          total_drivers: number | null
          total_operators: number | null
          total_passengers: number | null
        }
        Relationships: []
      }
      v_admin_financial_kpis: {
        Row: {
          cost_entries_30d: number | null
          critical_alerts: number | null
          margin_30d: number | null
          recurring_costs_count: number | null
          revenue_entries_30d: number | null
          total_costs_30d: number | null
          total_revenues_30d: number | null
          warning_alerts: number | null
        }
        Relationships: []
      }
      v_carrier_expiring_documents: {
        Row: {
          alert_level: string | null
          days_to_expiry: number | null
          document_type: string | null
          entity_id: string | null
          entity_name: string | null
          expiry_date: string | null
          id: string | null
          item_type: string | null
          status: string | null
          transportadora_id: string | null
        }
        Relationships: []
      }
      v_carrier_route_costs_summary: {
        Row: {
          avg_cost_per_passenger_brl: number | null
          empresa_id: string | null
          fixed_cost_brl: number | null
          fuel_cost_brl: number | null
          labor_cost_brl: number | null
          maintenance_cost_brl: number | null
          month: string | null
          rota_id: string | null
          route_name: string | null
          toll_cost_brl: number | null
          total_cost_brl: number | null
          total_distance_km: number | null
          total_passengers: number | null
          transportadora_id: string | null
          trips_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_carrier_vehicle_costs_summary: {
        Row: {
          cost_entries: number | null
          fines_cost_brl: number | null
          fuel_cost_brl: number | null
          insurance_cost_brl: number | null
          ipva_cost_brl: number | null
          maintenance_cost_brl: number | null
          model: string | null
          month: string | null
          other_cost_brl: number | null
          plate: string | null
          toll_cost_brl: number | null
          total_cost_brl: number | null
          transportadora_id: string | null
          veiculo_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      v_costs_conciliation: {
        Row: {
          company_name: string | null
          empresa_id: string | null
          invoice_id: string | null
          invoice_line_id: string | null
          invoice_number: string | null
          invoiced_amount: number | null
          invoiced_km: number | null
          invoiced_trips: number | null
          measured_amount: number | null
          measured_km: number | null
          measured_trips: number | null
          rota_id: string | null
          route_name: string | null
          vehicle_id: string | null
          vehicle_plate: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_costs_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_costs_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_costs_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_costs_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "gf_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "gf_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_costs_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_costs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_vehicle_costs_summary"
            referencedColumns: ["veiculo_id"]
          },
          {
            foreignKeyName: "gf_costs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      v_costs_kpis: {
        Row: {
          company_id: string | null
          company_name: string | null
          total_cost: number | null
          total_cost_30d: number | null
          total_cost_90d: number | null
          total_km: number | null
          total_trips: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_costs_vs_budget_monthly: {
        Row: {
          budgeted_amount: number | null
          category_id: string | null
          category_name: string | null
          period_month: number | null
          period_year: number | null
          tenant_id: string | null
          tenant_type: string | null
          total_cost: number | null
          variance_percent: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_manual_costs_v2_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gf_cost_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      v_driver_last_position: {
        Row: {
          accuracy: number | null
          captured_at: string | null
          heading: number | null
          lat: number | null
          lng: number | null
          motorista_id: string | null
          speed: number | null
          time_since_update: unknown
          trip_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_positions_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_positions_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_positions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "v_active_trips"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "driver_positions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "v_trip_overview"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "driver_positions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      v_my_companies: {
        Row: {
          accent_hex: string | null
          branding_name: string | null
          id: string | null
          logo_url: string | null
          name: string | null
          primary_hex: string | null
          role: string | null
        }
        Relationships: []
      }
      v_operador_alerts: {
        Row: {
          created_at: string | null
          empresa_id: string | null
          id: string | null
          message: string | null
          severity: string | null
        }
        Insert: {
          created_at?: string | null
          empresa_id?: string | null
          id?: string | null
          message?: string | null
          severity?: string | null
        }
        Update: {
          created_at?: string | null
          empresa_id?: string | null
          id?: string | null
          message?: string | null
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_alerts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_alerts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_alerts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_alerts_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_operador_alerts_secure: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string | null
          is_resolved: boolean | null
          message: string | null
          severity: string | null
          type: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string | null
          is_resolved?: boolean | null
          message?: string | null
          severity?: string | null
          type?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string | null
          is_resolved?: boolean | null
          message?: string | null
          severity?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_operador_costs: {
        Row: {
          empresa_id: string | null
          period: string | null
          route_id: string | null
          route_name: string | null
          total_cost: number | null
          total_discrepancy: number | null
          total_invoiced_km: number | null
          total_invoiced_trips: number | null
          total_measured_km: number | null
          total_measured_trips: number | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_operador_costs_secure: {
        Row: {
          company_id: string | null
          period: string | null
          route_id: string | null
          route_name: string | null
          total_cost: number | null
          total_discrepancy: number | null
          total_invoiced_km: number | null
          total_invoiced_trips: number | null
          total_measured_km: number | null
          total_measured_trips: number | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_operador_dashboard_kpis: {
        Row: {
          avg_occupancy: number | null
          daily_cost: number | null
          delays_over_5min: number | null
          empresa_id: string | null
          sla_d0: number | null
          trips_completed: number | null
          trips_in_progress: number | null
          trips_today: number | null
        }
        Relationships: []
      }
      v_operador_dashboard_kpis_secure: {
        Row: {
          avg_occupancy: number | null
          company_id: string | null
          daily_cost: number | null
          delays_over_5min: number | null
          sla_d0: number | null
          trips_completed: number | null
          trips_in_progress: number | null
          trips_today: number | null
        }
        Relationships: []
      }
      v_operador_routes: {
        Row: {
          avg_delay_minutes: number | null
          carrier_name: string | null
          completed_trips: number | null
          empresa_id: string | null
          id: string | null
          name: string | null
          total_trips: number | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_operador_routes_secure: {
        Row: {
          avg_delay_minutes: number | null
          company_id: string | null
          completed_trips: number | null
          id: string | null
          name: string | null
          total_trips: number | null
          transportadora_id: string | null
          transportadora_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_operator_employees: {
        Row: {
          address: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          empresa_id: string | null
          id: string | null
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          empresa_id?: string | null
          id?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          empresa_id?: string | null
          id?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_employee_company_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_employee_company_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_employee_company_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_employee_company_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_operator_employees_secure: {
        Row: {
          address: string | null
          company_id: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string | null
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_employee_company_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_employee_company_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_employee_company_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_employee_company_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_operator_requests: {
        Row: {
          assigned_to: string | null
          assigned_to_email: string | null
          created_at: string | null
          created_by: string | null
          empresa_id: string | null
          id: string | null
          priority: string | null
          resolved_at: string | null
          response_time_hours: number | null
          sla_target: string | null
          status: string | null
          tipo: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_service_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_service_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_service_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_service_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_service_requests_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_service_requests_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_service_requests_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "gf_service_requests_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_operator_sla: {
        Row: {
          empresa_id: string | null
          on_time_trips: number | null
          period: string | null
          sla_percentage: number | null
          total_trips: number | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_reports_delays: {
        Row: {
          actual_time: string | null
          delay_minutes: number | null
          driver_name: string | null
          empresa_id: string | null
          motorista_id: string | null
          rota_id: string | null
          route_name: string | null
          scheduled_time: string | null
          status: string | null
          trip_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      v_reports_delays_secure: {
        Row: {
          avg_delay_minutes: number | null
          company_id: string | null
          date: string | null
          delayed_trips: number | null
          total_trips: number | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_reports_driver_ranking: {
        Row: {
          company_id: string | null
          driver_id: string | null
          driver_name: string | null
          efficiency_score: number | null
          punctuality_score: number | null
          ranking: number | null
          routes_completed: number | null
          total_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      v_reports_efficiency: {
        Row: {
          avg_delay: number | null
          completed_trips: number | null
          efficiency_rate: number | null
          empresa_id: string | null
          period_end: string | null
          period_start: string | null
          rota_id: string | null
          route_name: string | null
          total_trips: number | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      v_reports_efficiency_secure: {
        Row: {
          active_routes: number | null
          company_id: string | null
          total_duration_minutes: number | null
          total_trips: number | null
          week: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_reports_not_boarded: {
        Row: {
          empresa_id: string | null
          passenger_id: string | null
          passenger_name: string | null
          reason: string | null
          rota_id: string | null
          route_name: string | null
          scheduled_time: string | null
          trip_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "trip_passengers_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_passengers_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      v_reports_not_boarded_secure: {
        Row: {
          company_id: string | null
          date: string | null
          not_boarded_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_reports_occupancy: {
        Row: {
          capacity: number | null
          empresa_id: string | null
          occupancy_rate: number | null
          rota_id: string | null
          route_name: string | null
          time_slot: string | null
          total_passengers: number | null
          trip_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      v_reports_occupancy_secure: {
        Row: {
          avg_occupancy: number | null
          company_id: string | null
          date: string | null
          max_occupancy: number | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_reports_roi_sla_secure: {
        Row: {
          company_id: string | null
          month: string | null
          on_time_trips: number | null
          sla_percentage: number | null
          total_cost: number | null
          total_trips: number | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_my_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_operador_dashboard_kpis_secure"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_route_stops: {
        Row: {
          address: string | null
          created_at: string | null
          employee_id: string | null
          id: string | null
          latitude: number | null
          longitude: number | null
          passenger_email: string | null
          passenger_id: string | null
          passenger_name: string | null
          rota_id: string | null
          route_name: string | null
          stop_name: string | null
          stop_order: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_route_plan_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "gf_employee_company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_route_plan_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_operator_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_route_plan_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_operator_employees_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_route_plan_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_route_plan_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_route_plan_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_route_plan_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_route_costs_summary"
            referencedColumns: ["rota_id"]
          },
          {
            foreignKeyName: "gf_route_plan_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_route_plan_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_costs_secure"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "gf_route_plan_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_route_plan_route_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "v_operador_routes_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      v_trip_latest_position: {
        Row: {
          last_seen_at: string | null
          lat: number | null
          lng: number | null
          motorista_id: string | null
          speed: number | null
          viagem_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_positions_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_positions_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_positions_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_active_trips"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "driver_positions_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "v_trip_overview"
            referencedColumns: ["viagem_id"]
          },
          {
            foreignKeyName: "driver_positions_trip_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      v_trip_overview: {
        Row: {
          motorista_id: string | null
          route_name: string | null
          scheduled_at: string | null
          status: string | null
          vehicle_model: string | null
          vehicle_plate: string | null
          viagem_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      v_vehicle_costs_summary: {
        Row: {
          categories: string[] | null
          entries_count: number | null
          period_month: number | null
          period_year: number | null
          total_cost: number | null
          transportadora_id: string | null
          vehicle_model: string | null
          vehicle_plate: string | null
          veiculo_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gf_manual_costs_v2_carrier_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "v_carrier_vehicle_costs_summary"
            referencedColumns: ["veiculo_id"]
          },
          {
            foreignKeyName: "gf_manual_costs_v2_vehicle_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_trip_summary: { Args: { p_trip: string }; Returns: undefined }
      check_budget_alerts: { Args: never; Returns: number }
      check_operational_alerts: { Args: never; Returns: undefined }
      check_trip_delays: { Args: never; Returns: undefined }
      company_ownership: { Args: { cid: string }; Returns: boolean }
      current_carrier_id: { Args: never; Returns: string }
      current_company_id: { Args: never; Returns: string }
      current_role: { Args: never; Returns: string }
      generate_monthly_financial_report: { Args: never; Returns: undefined }
      generate_recurring_costs: { Args: never; Returns: number }
      get_driver_position_lat: {
        Args: { p_position_id: string }
        Returns: number
      }
      get_driver_position_lng: {
        Args: { p_position_id: string }
        Returns: number
      }
      get_trip_passenger_count: { Args: { p_trip_id: string }; Returns: number }
      get_user_by_id_for_login: {
        Args: { p_user_id: string }
        Returns: {
          company_id: string
          email: string
          id: string
          role: string
          transportadora_id: string
        }[]
      }
      get_user_carrier_id: { Args: never; Returns: string }
      get_user_company_id: { Args: never; Returns: string }
      get_user_name: { Args: { p_user_id: string }; Returns: string }
      get_user_role: { Args: never; Returns: string }
      get_user_transportadora_id: {
        Args: { p_user_id: string }
        Returns: string
      }
      gf_map_snapshot_full: {
        Args: {
          p_company_id?: string
          p_route_id?: string
          p_transportadora_id?: string
        }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      refresh_mv_operator_kpis: { Args: never; Returns: undefined }
      rpc_carrier_monthly_score: {
        Args: { p_carrier_id: string; p_month: string }
        Returns: {
          details: Json
          score: number
        }[]
      }
      rpc_invoice_reconcile: {
        Args: { p_invoice_id: string }
        Returns: {
          details: Json
          discrepancy: number
        }[]
      }
      rpc_raise_incident: {
        Args: {
          p_descricao: string
          p_empresa: string
          p_rota: string
          p_severidade: string
          p_tipo: string
        }
        Returns: string
      }
      rpc_request_route_change: {
        Args: { p_empresa: string; p_payload: Json; p_route: string }
        Returns: string
      }
      rpc_request_service: {
        Args: { p_empresa: string; p_payload: Json; p_tipo: string }
        Returns: string
      }
      rpc_trip_transition: {
        Args: {
          p_description: string
          p_force?: boolean
          p_lat: number
          p_lng: number
          p_new_status: string
          p_trip: string
        }
        Returns: {
          result_status: string
        }[]
      }
      safe_create_user_profile: {
        Args: {
          p_company_id?: string
          p_email: string
          p_name: string
          p_role: string
          p_user_id: string
        }
        Returns: boolean
      }
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
