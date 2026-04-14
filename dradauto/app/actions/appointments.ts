'use server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentClinic } from '@/lib/clinic'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/google/calendar'
import type { AppointmentInsert } from '@/types'

// 1. Criar consulta
export async function createAppointment(data: AppointmentInsert) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  let finalPatientId = data.patient_id

  if (!finalPatientId) {
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('clinic_id', clinic.id)
      .eq('whatsapp', data.patient_whatsapp)
      .single()

    if (existingPatient) {
      finalPatientId = existingPatient.id
    } else {
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          clinic_id: clinic.id,
          nome: data.patient_name,
          whatsapp: data.patient_whatsapp,
        })
        .select('id')
        .single()

      if (patientError) {
        console.error('Erro ao criar paciente:', patientError)
        throw new Error('Falha ao criar ficha do paciente: ' + patientError.message)
      }
      finalPatientId = newPatient.id
    }
  }

  // Verificar conflito (warning, não bloqueio hard)
  const conflictCheck = await supabase
    .from('appointments')
    .select('id, scheduled_at, patient_name')
    .eq('clinic_id', clinic.id)
    .neq('status', 'cancelled')
    .gte('scheduled_at', new Date(new Date(data.scheduled_at!).getTime() - 30 * 60_000).toISOString())
    .lte('scheduled_at', new Date(new Date(data.scheduled_at!).getTime() + 30 * 60_000).toISOString())

  // Inserir no banco primeiro
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({ 
      ...data, 
      clinic_id: clinic.id, 
      patient_id: finalPatientId,
      status: 'pending' 
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar consulta:', error)
    throw new Error('Erro ao registrar consulta: ' + error.message)
  }

  // Tentar criar no Google Calendar (não falha a operação se o Google estiver offline)
  if (clinic.google_connected) {
    try {
      const { google_event_id, google_meet_link } = await createCalendarEvent(clinic, appointment)
      await supabase.from('appointments').update({ google_event_id, google_meet_link })
        .eq('id', appointment.id)
      return { ...appointment, google_event_id, google_meet_link, hasConflict: (conflictCheck.data?.length ?? 0) > 0 }
    } catch (e) {
      // Google falhou — retornar consulta sem event_id, frontend exibe aviso
      return { ...appointment, google_error: true, hasConflict: (conflictCheck.data?.length ?? 0) > 0 }
    }
  }

  return { ...appointment, hasConflict: (conflictCheck.data?.length ?? 0) > 0 }
}

// 2. Reagendar consulta
export async function rescheduleAppointment(
  id: string,
  newScheduledAt: string,
  durationMinutes?: number
) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  const { data: current } = await supabase.from('appointments').select('*').eq('id', id).single()
  if (!current) throw new Error('Consulta não encontrada')

  await supabase.from('appointments').update({
    scheduled_at: newScheduledAt,
    duration_minutes: durationMinutes ?? current.duration_minutes,
  }).eq('id', id)

  if (clinic.google_connected && current.google_event_id) {
    try {
      await updateCalendarEvent(clinic, current.google_event_id, newScheduledAt, durationMinutes ?? current.duration_minutes)
    } catch { /* silencioso */ }
  }
}

// 3. Cancelar consulta
export async function cancelAppointment(id: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  const { data: current } = await supabase.from('appointments').select('*').eq('id', id).single()
  if (!current) throw new Error('Consulta não encontrada')

  await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)

  if (clinic.google_connected && current.google_event_id) {
    try { await deleteCalendarEvent(clinic, current.google_event_id) } catch { /* silencioso */ }
  }
}

// 4. Concluir consulta
export async function completeAppointment(id: string) {
  const supabase = createServerClient() as any
  await supabase.from('appointments').update({ status: 'completed' }).eq('id', id)
  // NÃO remove do Google Calendar — manter no histórico do médico
}

// 5. Confirmar consulta (pending → confirmed)
export async function confirmAppointment(id: string) {
  const supabase = createServerClient() as any
  await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', id)
}

// 6. Buscar consultas por intervalo de datas
export async function getAppointmentsByDateRange(startDate: string, endDate: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) return []

  const supabase = createServerClient() as any
  const { data } = await supabase
    .from('appointments')
    .select('*, patients(id, nome, whatsapp, email)')
    .eq('clinic_id', clinic.id)
    .gte('scheduled_at', startDate)
    .lte('scheduled_at', endDate)
    .order('scheduled_at', { ascending: true })

  return data ?? []
}
