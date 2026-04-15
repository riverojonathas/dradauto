'use server'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentClinic } from '@/lib/clinic'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/google/calendar'
import { getValidAccessToken } from '@/lib/google/auth'
import { createGoogleContact } from '@/lib/google/contacts'
import type { AppointmentInsert } from '@/types'
import { toE164BR } from '@/lib/phone'

type CreateAppointmentInput = Omit<AppointmentInsert, 'clinic_id' | 'patient_whatsapp'> & {
  patient_whatsapp: string
  allowConflict?: boolean
}

// 1. Criar consulta
export async function createAppointment(data: CreateAppointmentInput) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  const patientName = (data.patient_name || '').trim()
  if (!patientName) throw new Error('Nome do paciente é obrigatório')

  const normalizedWhatsapp = toE164BR(data.patient_whatsapp)
  if (!normalizedWhatsapp) throw new Error('WhatsApp inválido. Use DDD e número válidos.')

  const scheduledDate = data.scheduled_at ? new Date(data.scheduled_at) : null
  if (!scheduledDate || Number.isNaN(scheduledDate.getTime())) {
    throw new Error('Data e horário inválidos')
  }

  const allowedTipos = new Set(['consulta', 'retorno', 'teleconsulta'])
  if (!allowedTipos.has(data.tipo || '')) {
    throw new Error('Tipo de consulta inválido')
  }

  const allowedDurations = new Set([30, 45, 60])
  const duration = Number(data.duration_minutes)
  if (!allowedDurations.has(duration)) {
    throw new Error('Duração inválida')
  }

  const value = Number(data.valor ?? 0)
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Valor inválido')
  }

  const conflictWindowStart = new Date(scheduledDate.getTime() - 30 * 60_000).toISOString()
  const conflictWindowEnd = new Date(scheduledDate.getTime() + 30 * 60_000).toISOString()

  const conflictCheck = await supabase
    .from('appointments')
    .select('id')
    .eq('clinic_id', clinic.id)
    .neq('status', 'cancelled')
    .gte('scheduled_at', conflictWindowStart)
    .lte('scheduled_at', conflictWindowEnd)

  const hasConflict = (conflictCheck.data?.length ?? 0) > 0
  if (hasConflict && !data.allowConflict) {
    return { requiresConflictConfirmation: true, hasConflict: true }
  }

  let finalPatientId = data.patient_id

  if (!finalPatientId) {
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('clinic_id', clinic.id)
      .eq('whatsapp', normalizedWhatsapp)
      .single()

    if (existingPatient) {
      finalPatientId = existingPatient.id
    } else {
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          clinic_id: clinic.id,
          nome: patientName,
          whatsapp: normalizedWhatsapp,
        })
        .select('id, google_contact_id')
        .single()

      if (patientError) {
        console.error('Erro ao criar paciente:', patientError)
        throw new Error('Falha ao criar ficha do paciente: ' + patientError.message)
      }

      if (clinic.google_connected && clinic.google_refresh_token) {
        try {
          const accessToken = await getValidAccessToken(clinic)
          const resourceName = await createGoogleContact(accessToken, {
            nome: patientName,
            whatsapp: normalizedWhatsapp,
            especialidadeMedico: clinic.especialidade,
            nomeMedico: clinic.nome,
          })

          if (resourceName) {
            await supabase
              .from('patients')
              .update({ google_contact_id: resourceName })
              .eq('id', newPatient.id)
            newPatient.google_contact_id = resourceName
          }
        } catch (e: any) {
          if (e?.message === 'GOOGLE_CONTACTS_SCOPE_MISSING') {
            console.warn('Google Contacts scope não autorizado — paciente criado via agenda sem sync')
          }
          // Não bloqueia criação da consulta
        }
      }

      finalPatientId = newPatient.id
    }
  }

  // Inserir no banco apenas após validação e confirmação de conflito
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({ 
      patient_name: patientName,
      patient_whatsapp: normalizedWhatsapp,
      scheduled_at: scheduledDate.toISOString(),
      duration_minutes: duration,
      tipo: data.tipo,
      valor: value,
      observacoes: data.observacoes ?? null,
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
      return { ...appointment, google_event_id, google_meet_link, hasConflict }
    } catch (e) {
      // Google falhou — retornar consulta sem event_id, frontend exibe aviso
      return { ...appointment, google_error: true, hasConflict }
    }
  }

  return { ...appointment, hasConflict }
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

  const { data: current } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', id)
    .eq('clinic_id', clinic.id)
    .single()
  if (!current) throw new Error('Consulta não encontrada')

  const { error: updateError } = await supabase
    .from('appointments')
    .update({
      scheduled_at: newScheduledAt,
      duration_minutes: durationMinutes ?? current.duration_minutes,
    })
    .eq('id', id)
    .eq('clinic_id', clinic.id)

  if (updateError) throw new Error(updateError.message)

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

  const { data: current } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', id)
    .eq('clinic_id', clinic.id)
    .single()
  if (!current) throw new Error('Consulta não encontrada')

  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('clinic_id', clinic.id)

  if (updateError) throw new Error(updateError.message)

  if (clinic.google_connected && current.google_event_id) {
    try { await deleteCalendarEvent(clinic, current.google_event_id) } catch { /* silencioso */ }
  }
}

// 4. Concluir consulta
export async function completeAppointment(id: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'completed' })
    .eq('id', id)
    .eq('clinic_id', clinic.id)

  if (error) throw new Error(error.message)
  // NÃO remove do Google Calendar — manter no histórico do médico
}

// 5. Confirmar consulta (pending → confirmed)
export async function confirmAppointment(id: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'confirmed' })
    .eq('id', id)
    .eq('clinic_id', clinic.id)

  if (error) throw new Error(error.message)
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
