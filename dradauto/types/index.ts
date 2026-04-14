import type { Database } from './supabase'

// ============================================================
// Tipos base das tabelas
// ============================================================
export type Clinic       = Database['public']['Tables']['clinics']['Row']
export type Patient      = Database['public']['Tables']['patients']['Row']
export type Appointment  = Database['public']['Tables']['appointments']['Row']
export type MedicalRecord = Database['public']['Tables']['medical_records']['Row']
export type Anamnesis    = Database['public']['Tables']['anamnesis']['Row']
export type PrivacyConsent = Database['public']['Tables']['privacy_consents']['Row']
export type WhatsappSession = Database['public']['Tables']['whatsapp_sessions']['Row']
export type ConversationMemory = Database['public']['Tables']['conversation_memory']['Row']
export type AuditLog     = Database['public']['Tables']['audit_logs']['Row']

// Tipos de Insert/Update
export type ClinicInsert      = Database['public']['Tables']['clinics']['Insert']
export type PatientInsert     = Database['public']['Tables']['patients']['Insert']
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert']
export type MedicalRecordInsert = Database['public']['Tables']['medical_records']['Insert']
export type AnamnesisInsert   = Database['public']['Tables']['anamnesis']['Insert']

// ============================================================
// Enums do domínio
// ============================================================
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type PaymentStatus     = 'pending' | 'paid' | 'refunded'
export type MessageRole       = 'user' | 'assistant'
export type AppointmentTipo   = 'consulta' | 'retorno' | 'teleconsulta'

// ============================================================
// Tipos compostos (joins)
// ============================================================
export type AppointmentWithPatient = Appointment & {
  patients: Pick<Patient, 'id' | 'nome' | 'whatsapp' | 'email'> | null
}

export type MedicalRecordWithPatient = MedicalRecord & {
  patients: Pick<Patient, 'id' | 'nome' | 'whatsapp'> | null
  appointments: Pick<Appointment, 'id' | 'scheduled_at' | 'tipo'> | null
}

export type AppointmentWithAnamnesis = Appointment & {
  anamnesis: Anamnesis | null
  patients: Pick<Patient, 'id' | 'nome' | 'whatsapp'> | null
}

// ============================================================
// Tipos utilitários
// ============================================================
export type Json = Database['public']['Tables']['audit_logs']['Row']['metadata']
