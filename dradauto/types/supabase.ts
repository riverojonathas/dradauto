export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string
          clerk_user_id: string
          nome: string
          crm: string
          crm_estado: string
          especialidade: string
          whatsapp: string
          valor_consulta: number
          duracao_consulta: number
          nome_secretaria: string | null
          google_connected: boolean
          google_access_token: string | null
          google_refresh_token: string | null
          google_token_expires_at: string | null
          google_calendar_id: string
          working_hours_start: string
          working_hours_end: string
          working_days: number[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_user_id: string
          nome: string
          crm: string
          crm_estado: string
          especialidade: string
          whatsapp: string
          valor_consulta?: number
          duracao_consulta?: number
          nome_secretaria?: string | null
          google_connected?: boolean
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          google_calendar_id?: string
          working_hours_start?: string
          working_hours_end?: string
          working_days?: number[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_user_id?: string
          nome?: string
          crm?: string
          crm_estado?: string
          especialidade?: string
          whatsapp?: string
          valor_consulta?: number
          duracao_consulta?: number
          nome_secretaria?: string | null
          google_connected?: boolean
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          google_calendar_id?: string
          working_hours_start?: string
          working_hours_end?: string
          working_days?: number[]
          updated_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          clinic_id: string
          nome: string
          whatsapp: string
          email: string | null
          data_nascimento: string | null
          cpf: string | null
          google_contact_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          nome: string
          whatsapp: string
          email?: string | null
          data_nascimento?: string | null
          cpf?: string | null
          google_contact_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          nome?: string
          whatsapp?: string
          email?: string | null
          data_nascimento?: string | null
          cpf?: string | null
          google_contact_id?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          clinic_id: string
          patient_id: string | null
          patient_name: string
          patient_whatsapp: string
          scheduled_at: string
          duration_minutes: number
          tipo: string
          google_event_id: string | null
          google_meet_link: string | null
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status: 'pending' | 'paid' | 'refunded'
          stripe_session_id: string | null
          stripe_payment_intent_id: string | null
          valor: number | null
          anamnesis_token: string | null
          anamnesis_token_used: boolean
          anamnesis_token_expires_at: string | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          patient_id?: string | null
          patient_name: string
          patient_whatsapp: string
          scheduled_at: string
          duration_minutes?: number
          tipo?: string
          google_event_id?: string | null
          google_meet_link?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status?: 'pending' | 'paid' | 'refunded'
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          valor?: number | null
          anamnesis_token?: string | null
          anamnesis_token_used?: boolean
          anamnesis_token_expires_at?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          patient_id?: string | null
          patient_name?: string
          patient_whatsapp?: string
          scheduled_at?: string
          duration_minutes?: number
          tipo?: string
          google_event_id?: string | null
          google_meet_link?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status?: 'pending' | 'paid' | 'refunded'
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          valor?: number | null
          anamnesis_token?: string | null
          anamnesis_token_used?: boolean
          anamnesis_token_expires_at?: string | null
          observacoes?: string | null
          updated_at?: string
        }
      }
      medical_records: {
        Row: {
          id: string
          clinic_id: string
          patient_id: string
          appointment_id: string | null
          queixas: string | null
          hipotese_diagnostica: string | null
          cid_10: string | null
          prescricao: string | null
          observacoes: string | null
          anexos: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          patient_id: string
          appointment_id?: string | null
          queixas?: string | null
          hipotese_diagnostica?: string | null
          cid_10?: string | null
          prescricao?: string | null
          observacoes?: string | null
          anexos?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          patient_id?: string
          appointment_id?: string | null
          queixas?: string | null
          hipotese_diagnostica?: string | null
          cid_10?: string | null
          prescricao?: string | null
          observacoes?: string | null
          anexos?: Json
          updated_at?: string
        }
      }
      anamnesis: {
        Row: {
          id: string
          clinic_id: string
          patient_id: string | null
          appointment_id: string | null
          queixa_principal: string | null
          historico_familiar: string | null
          alergias: string | null
          medicamentos_em_uso: string | null
          antecedentes: string | null
          habitos: string | null
          lgpd_consent: boolean
          lgpd_consent_at: string | null
          lgpd_terms_version: string | null
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          patient_id?: string | null
          appointment_id?: string | null
          queixa_principal?: string | null
          historico_familiar?: string | null
          alergias?: string | null
          medicamentos_em_uso?: string | null
          antecedentes?: string | null
          habitos?: string | null
          lgpd_consent?: boolean
          lgpd_consent_at?: string | null
          lgpd_terms_version?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          patient_id?: string | null
          appointment_id?: string | null
          queixa_principal?: string | null
          historico_familiar?: string | null
          alergias?: string | null
          medicamentos_em_uso?: string | null
          antecedentes?: string | null
          habitos?: string | null
          lgpd_consent?: boolean
          lgpd_consent_at?: string | null
          lgpd_terms_version?: string | null
        }
      }
      privacy_consents: {
        Row: {
          id: string
          clinic_id: string | null
          patient_id: string | null
          whatsapp: string | null
          consent_type: string
          consented: boolean
          terms_version: string
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id?: string | null
          patient_id?: string | null
          whatsapp?: string | null
          consent_type: string
          consented?: boolean
          terms_version?: string
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string | null
          patient_id?: string | null
          whatsapp?: string | null
          consent_type?: string
          consented?: boolean
          terms_version?: string
          ip_address?: string | null
        }
      }
      whatsapp_sessions: {
        Row: {
          id: string
          clinic_id: string
          whatsapp_number: string
          patient_id: string | null
          current_intent: string | null
          session_data: Json
          last_message_at: string
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          whatsapp_number: string
          patient_id?: string | null
          current_intent?: string | null
          session_data?: Json
          last_message_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          whatsapp_number?: string
          patient_id?: string | null
          current_intent?: string | null
          session_data?: Json
          last_message_at?: string
        }
      }
      conversation_memory: {
        Row: {
          id: string
          clinic_id: string
          whatsapp_number: string
          role: 'user' | 'assistant'
          content: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          whatsapp_number: string
          role: 'user' | 'assistant'
          content: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          whatsapp_number?: string
          role?: 'user' | 'assistant'
          content?: string
          metadata?: Json
        }
      }
      audit_logs: {
        Row: {
          id: string
          clinic_id: string | null
          clerk_user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          ip_address: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id?: string | null
          clerk_user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          ip_address?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string | null
          clerk_user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          ip_address?: string | null
          metadata?: Json
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
