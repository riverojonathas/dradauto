'use server'

import { createServerClient } from '@/lib/supabase/server'
import { getCurrentClinic } from '@/lib/clinic'
import { revalidatePath } from 'next/cache'

// Gerar token para envio ao paciente (chamado pelo médico)
export async function generateAnamnesisToken(appointmentId: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  // Verificar se já existe anamnese preenchida
  const { data: existing } = await supabase
    .from('anamnesis')
    .select('id')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  if (existing) return { success: false, error: 'already_filled' }

  // Verificar se já existe token válido
  const { data: appointment } = await supabase
    .from('appointments')
    .select('anamnesis_token, anamnesis_token_expires_at, anamnesis_token_used, scheduled_at')
    .eq('id', appointmentId)
    .eq('clinic_id', clinic.id)
    .single()

  if (!appointment) throw new Error('Consulta não encontrada')

  // Reutilizar token existente se ainda válido
  if (
    appointment.anamnesis_token &&
    !appointment.anamnesis_token_used &&
    new Date(appointment.anamnesis_token_expires_at) > new Date()
  ) {
    return { success: true, token: appointment.anamnesis_token }
  }

  // Gerar novo token
  const { randomUUID } = await import('crypto')
  const token = randomUUID()
  const appointmentDate = new Date(appointment.scheduled_at)
  const expiry = new Date(appointmentDate)
  expiry.setDate(expiry.getDate() + 7)

  await supabase
    .from('appointments')
    .update({
      anamnesis_token: token,
      anamnesis_token_expires_at: expiry.toISOString(),
      anamnesis_token_used: false,
    })
    .eq('id', appointmentId)

  return { success: true, token }
}

// Validar token (rota pública — sem auth)
export async function validateAnamnesisToken(token: string) {
  const supabase = createServerClient() as any

  const { data: appointment } = await supabase
    .from('appointments')
    .select(`
      id, patient_name, scheduled_at, anamnesis_token_used,
      anamnesis_token_expires_at, clinic_id,
      clinics(nome, especialidade, nome_secretaria)
    `)
    .eq('anamnesis_token', token)
    .single()

  if (!appointment) return { valid: false, reason: 'not_found' }
  if (appointment.anamnesis_token_used) return { valid: false, reason: 'already_used' }

  const expires = new Date(appointment.anamnesis_token_expires_at)
  if (expires < new Date()) return { valid: false, reason: 'expired' }

  return { valid: true, appointment }
}

// Submeter anamnese preenchida pelo paciente (sem auth)
export async function submitAnamnesis(token: string, data: {
  queixa_principal: string
  historico_familiar?: string
  alergias?: string
  medicamentos_em_uso?: string
  antecedentes?: string
  habitos?: string
  lgpd_consent: boolean
}) {
  if (!data.lgpd_consent) {
    return { success: false, error: 'lgpd_required' }
  }

  const supabase = createServerClient() as any

  // Buscar e validar token
  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, patient_id, clinic_id, anamnesis_token_used, anamnesis_token_expires_at')
    .eq('anamnesis_token', token)
    .single()

  if (!appointment) return { success: false, error: 'invalid_token' }
  if (appointment.anamnesis_token_used) return { success: false, error: 'already_used' }
  if (new Date(appointment.anamnesis_token_expires_at) < new Date()) {
    return { success: false, error: 'expired' }
  }

  // Inserir anamnese
  const { error: insertError } = await supabase
    .from('anamnesis')
    .insert({
      clinic_id: appointment.clinic_id,
      patient_id: appointment.patient_id,
      appointment_id: appointment.id,
      ...data,
      lgpd_consent_at: new Date().toISOString(),
      lgpd_terms_version: 'v1.0',
    })

  if (insertError) return { success: false, error: 'save_failed' }

  // Marcar token como usado
  await supabase
    .from('appointments')
    .update({ anamnesis_token_used: true })
    .eq('id', appointment.id)

  return { success: true }
}

// ─────────────────────────────────────────────────────────────
// Médico preenche a anamnese — vinculada a consulta
// ─────────────────────────────────────────────────────────────
export async function submitAnamnesisAsDoctor(appointmentId: string, data: {
  queixa_principal: string
  historico_familiar?: string
  alergias?: string
  medicamentos_em_uso?: string
  antecedentes?: string
  habitos?: string
}) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  // Verificar se já existe anamnese
  const { data: existing } = await supabase
    .from('anamnesis')
    .select('id')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  if (existing) return { success: false, error: 'already_filled' }

  const { data: appointment } = await supabase
    .from('appointments')
    .select('patient_id, clinic_id')
    .eq('id', appointmentId)
    .eq('clinic_id', clinic.id)
    .single()

  if (!appointment) throw new Error('Consulta não encontrada')

  const { error } = await supabase
    .from('anamnesis')
    .insert({
      clinic_id: clinic.id,
      patient_id: appointment.patient_id,
      appointment_id: appointmentId,
      ...data,
      lgpd_consent: true,
      lgpd_consent_at: new Date().toISOString(),
      lgpd_terms_version: 'v1.0-medico',
    })

  if (error) throw new Error(error.message)

  // Invalidar o token existente (se havia link enviado ao paciente)
  await supabase
    .from('appointments')
    .update({ anamnesis_token_used: true })
    .eq('id', appointmentId)
    .not('anamnesis_token', 'is', null)

  revalidatePath(`/prontuarios/${appointmentId}`)
  return { success: true }
}

// ─────────────────────────────────────────────────────────────
// Médico preenche anamnese STANDALONE — apenas por patient_id
// ─────────────────────────────────────────────────────────────
export async function submitAnamnesisAsDoctoForPatient(patientId: string, data: {
  queixa_principal: string
  historico_familiar?: string
  alergias?: string
  medicamentos_em_uso?: string
  antecedentes?: string
  habitos?: string
}) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .eq('clinic_id', clinic.id)
    .single()

  if (!patient) throw new Error('Paciente não encontrado')

  const { error } = await supabase
    .from('anamnesis')
    .insert({
      clinic_id: clinic.id,
      patient_id: patientId,
      // appointment_id: null (standalone)
      ...data,
      lgpd_consent: true,
      lgpd_consent_at: new Date().toISOString(),
      lgpd_terms_version: 'v1.0-medico',
    })

  if (error) throw new Error(error.message)

  revalidatePath(`/prontuarios/paciente/${patientId}`)
  revalidatePath(`/pacientes/${patientId}`)
  return { success: true }
}
