'use server'

import { createServerClient } from '@/lib/supabase/server'
import { getCurrentClinic } from '@/lib/clinic'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────────────────────
// Funções vinculadas a uma CONSULTA (appointment_id)
// ─────────────────────────────────────────────────────────────

export async function getOrCreateMedicalRecord(appointmentId: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, patient_id, patient_name, clinic_id')
    .eq('id', appointmentId)
    .eq('clinic_id', clinic.id)
    .single()

  if (!appointment) throw new Error('Consulta não encontrada')

  const { data: existing } = await supabase
    .from('medical_records')
    .select('*')
    .eq('appointment_id', appointmentId)
    .single()

  if (existing) return { record: existing, isNew: false }

  const { data: created, error } = await supabase
    .from('medical_records')
    .insert({
      clinic_id: clinic.id,
      patient_id: appointment.patient_id,
      appointment_id: appointmentId,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return { record: created, isNew: true }
}

export async function saveMedicalRecord(appointmentId: string, data: {
  queixas?: string
  hipotese_diagnostica?: string
  cid_10?: string
  prescricao?: string
  observacoes?: string
}) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  const { data: record, error } = await supabase
    .from('medical_records')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('appointment_id', appointmentId)
    .eq('clinic_id', clinic.id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  await supabase
    .from('appointments')
    .update({ status: 'completed' })
    .eq('id', appointmentId)
    .eq('status', 'confirmed')

  revalidatePath(`/prontuarios/${appointmentId}`)
  revalidatePath('/prontuarios')
  revalidatePath('/pacientes')
  return record
}

export async function getMedicalRecordWithAnamnesis(appointmentId: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  const [recordRes, appointmentRes] = await Promise.all([
    supabase
      .from('medical_records')
      .select('*')
      .eq('appointment_id', appointmentId)
      .eq('clinic_id', clinic.id)
      .maybeSingle(),
    supabase
      .from('appointments')
      .select(`
        id, scheduled_at, tipo, status, patient_name, patient_whatsapp,
        duration_minutes, google_meet_link, anamnesis_token, anamnesis_token_used,
        anamnesis_token_expires_at, valor,
        patients(id, nome, whatsapp, data_nascimento)
      `)
      .eq('id', appointmentId)
      .eq('clinic_id', clinic.id)
      .single(),
  ])

  if (appointmentRes.error) throw new Error('Consulta não encontrada')

  const appointment = appointmentRes.data

  const { data: anamnesis } = await supabase
    .from('anamnesis')
    .select('*')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  return {
    record: recordRes.data,
    appointment,
    anamnesis,
    clinic,
    mode: 'appointment' as const,
  }
}

// ─────────────────────────────────────────────────────────────
// Funções STANDALONE — vinculadas apenas ao paciente
// ─────────────────────────────────────────────────────────────

export async function getOrCreateMedicalRecordForPatient(patientId: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  // Verificar se o paciente pertence à clínica
  const { data: patient } = await supabase
    .from('patients')
    .select('id, nome, whatsapp, data_nascimento')
    .eq('id', patientId)
    .eq('clinic_id', clinic.id)
    .single()

  if (!patient) throw new Error('Paciente não encontrado')

  // Buscar o prontuário standalone mais recente (sem appointment_id)
  const { data: existing } = await supabase
    .from('medical_records')
    .select('*')
    .eq('patient_id', patientId)
    .eq('clinic_id', clinic.id)
    .is('appointment_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) return { record: existing, patient, isNew: false }

  // Criar prontuário standalone vazio
  const { data: created, error } = await supabase
    .from('medical_records')
    .insert({
      clinic_id: clinic.id,
      patient_id: patientId,
      // appointment_id: null (standalone)
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return { record: created, patient, isNew: true }
}

export async function getMedicalRecordWithAnamnesisForPatient(patientId: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  // Buscar dados do paciente
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, nome, whatsapp, data_nascimento')
    .eq('id', patientId)
    .eq('clinic_id', clinic.id)
    .single()

  if (patientError || !patient) throw new Error('Paciente não encontrado')

  // Buscar ou criar prontuário standalone
  const { record } = await getOrCreateMedicalRecordForPatient(patientId)

  // Buscar anamnese mais recente do paciente (sem appointment)
  const { data: anamnesis } = await supabase
    .from('anamnesis')
    .select('*')
    .eq('patient_id', patientId)
    .eq('clinic_id', clinic.id)
    .is('appointment_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    record,
    patient,
    anamnesis,
    clinic,
    mode: 'patient' as const,
    appointment: null,
  }
}

export async function saveMedicalRecordById(recordId: string, data: {
  queixas?: string
  hipotese_diagnostica?: string
  cid_10?: string
  prescricao?: string
  observacoes?: string
}) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  const { data: record, error } = await supabase
    .from('medical_records')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recordId)
    .eq('clinic_id', clinic.id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/prontuarios')
  revalidatePath('/pacientes')
  return record
}

// ─────────────────────────────────────────────────────────────
// Listagens
// ─────────────────────────────────────────────────────────────

export async function listMedicalRecords(params?: {
  search?: string
  page?: number
}) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any
  const page = params?.page ?? 1
  const limit = 20
  const from = (page - 1) * limit

  let query = supabase
    .from('medical_records')
    .select(`
      id, patient_id, created_at, updated_at, queixas, cid_10,
      patients(id, nome, whatsapp),
      appointments(id, scheduled_at, tipo, status)
    `, { count: 'exact' })
    .eq('clinic_id', clinic.id)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (params?.search) {
    const { data: patientIds } = await supabase
      .from('patients')
      .select('id')
      .eq('clinic_id', clinic.id)
      .ilike('nome', `%${params.search}%`)

    if (patientIds?.length) {
      query = query.in('patient_id', patientIds.map((p: any) => p.id))
    }
  }

  const { data, count, error } = await query
  if (error) throw new Error(error.message)
  return { records: data || [], total: count || 0 }
}

export async function listPatientMedicalRecords(patientId: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  const { data, error } = await supabase
    .from('medical_records')
    .select(`
      id, created_at, updated_at, queixas, cid_10, appointment_id,
      appointments(id, scheduled_at, tipo, status)
    `)
    .eq('patient_id', patientId)
    .eq('clinic_id', clinic.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function listPatientAnamneses(patientId: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  const { data, error } = await supabase
    .from('anamnesis')
    .select(`
      id, created_at, queixa_principal, alergias, medicamentos_em_uso, appointment_id,
      appointments(id, scheduled_at)
    `)
    .eq('patient_id', patientId)
    .eq('clinic_id', clinic.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
