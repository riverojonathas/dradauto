'use server'

import { createServerClient } from '@/lib/supabase/server'
import { getCurrentClinic } from '@/lib/clinic'
import { getValidAccessToken } from '@/lib/google/auth'
import { createGoogleContact, updateGoogleContact } from '@/lib/google/contacts'
import { revalidatePath } from 'next/cache'
import { toE164BR } from '@/lib/phone'

// Listar pacientes com busca e paginação
export async function listPatients(params?: {
  search?: string
  page?: number
  limit?: number
}) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any
  const { search, page = 1, limit = 20 } = params || {}
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('patients')
    .select('*, appointments(count)', { count: 'exact' })
    .eq('clinic_id', clinic.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.ilike('nome', `%${search}%`)
  }

  const { data, error, count } = await query

  if (error) throw new Error(error.message)
  return { patients: data || [], total: count || 0 }
}

// Buscar paciente por ID (para detalhe)
export async function getPatient(id: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      appointments(
        id, scheduled_at, tipo, status, payment_status, valor,
        google_meet_link, observacoes
      )
    `)
    .eq('id', id)
    .eq('clinic_id', clinic.id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Criar paciente (standalone — não via agenda)
export async function createPatient(data: {
  nome: string
  whatsapp: string
  email?: string
  data_nascimento?: string
  cpf?: string
  notes?: string
}) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any
  const normalizedWhatsapp = toE164BR(data.whatsapp)
  if (!normalizedWhatsapp) throw new Error('WhatsApp inválido. Use DDD e número válidos.')

  // Verificar duplicata por WhatsApp
  const { data: existing } = await supabase
    .from('patients')
    .select('id, nome')
    .eq('clinic_id', clinic.id)
    .eq('whatsapp', normalizedWhatsapp)
    .single()

  if (existing) {
    return { 
      success: false, 
      error: 'duplicate_whatsapp',
      existingId: existing.id,
      existingName: existing.nome,
    }
  }

  const { data: patient, error } = await supabase
    .from('patients')
    .insert({ ...data, whatsapp: normalizedWhatsapp, clinic_id: clinic.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Sincronizar com Google Contacts (se conectado)
  if (clinic.google_connected && clinic.google_refresh_token) {
    try {
      const accessToken = await getValidAccessToken(clinic)
      const resourceName = await createGoogleContact(accessToken, {
        nome: data.nome,
        whatsapp: normalizedWhatsapp,
        especialidadeMedico: clinic.especialidade,
        nomeMedico: clinic.nome,
      })
      if (resourceName) {
        await (supabase as any)
          .from('patients')
          .update({ google_contact_id: resourceName })
          .eq('id', patient.id)
        patient.google_contact_id = resourceName
      }
    } catch (e: any) {
      if (e.message === 'GOOGLE_CONTACTS_SCOPE_MISSING') {
        console.warn('Google Contacts scope não autorizado — paciente salvo sem sync')
      }
      // Falha silenciosa — paciente foi salvo com sucesso
    }
  }

  revalidatePath('/pacientes')
  return { success: true, patient }
}

// Atualizar paciente
export async function updatePatient(id: string, data: {
  nome?: string
  whatsapp?: string
  email?: string
  data_nascimento?: string
  cpf?: string
  notes?: string
}) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any
  const normalizedWhatsapp =
    typeof data.whatsapp === 'string'
      ? toE164BR(data.whatsapp)
      : undefined

  if (typeof data.whatsapp === 'string' && !normalizedWhatsapp) {
    throw new Error('WhatsApp inválido. Use DDD e número válidos.')
  }

  const updatePayload = {
    ...data,
    whatsapp: normalizedWhatsapp,
    updated_at: new Date().toISOString(),
  }

  const { data: patient, error } = await supabase
    .from('patients')
    .update(updatePayload)
    .eq('id', id)
    .eq('clinic_id', clinic.id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Atualizar Google Contact se existir
  if (
    clinic.google_connected &&
    patient.google_contact_id &&
    (data.nome || data.whatsapp)
  ) {
    try {
      const accessToken = await getValidAccessToken(clinic)
      await updateGoogleContact(accessToken, patient.google_contact_id, {
        nome: patient.nome,
        whatsapp: patient.whatsapp,
      })
    } catch {
      // Falha silenciosa
    }
  }

  revalidatePath('/pacientes')
  revalidatePath(`/pacientes/${id}`)
  return { success: true, patient }
}

// Buscar pacientes para o Combobox da agenda
export async function searchPatients(query: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) return []

  const supabase = createServerClient() as any

  const { data } = await supabase
    .from('patients')
    .select('id, nome, whatsapp')
    .eq('clinic_id', clinic.id)
    .ilike('nome', `%${query}%`)
    .order('nome')
    .limit(8)

  return data || []
}

// Sincronizar TODOS os pacientes sem google_contact_id (bulk sync)
export async function syncAllPatientsToGoogle() {
  const clinic = await getCurrentClinic()
  if (!clinic?.google_connected) {
    return { success: false, error: 'not_connected' }
  }

  const supabase = createServerClient() as any

  const { data: patients } = await supabase
    .from('patients')
    .select('id, nome, whatsapp')
    .eq('clinic_id', clinic.id)
    .is('google_contact_id', null)
    .limit(50) // Processar em lotes para evitar rate limiting

  if (!patients?.length) return { success: true, synced: 0 }

  let synced = 0
  let failed = 0

  try {
    const accessToken = await getValidAccessToken(clinic)
    for (const patient of patients) {
      try {
        const resourceName = await createGoogleContact(accessToken, {
          nome: patient.nome,
          whatsapp: patient.whatsapp,
          especialidadeMedico: clinic.especialidade,
        })
        if (resourceName) {
          await supabase
            .from('patients')
            .update({ google_contact_id: resourceName })
            .eq('id', patient.id)
          synced++
        }
      } catch {
        failed++
      }
    }
  } catch (e: any) {
    if (e.message === 'GOOGLE_CONTACTS_SCOPE_MISSING') {
      return { success: false, error: 'scope_missing' }
    }
  }

  revalidatePath('/pacientes')
  return { success: true, synced, failed, remaining: patients.length - synced }
}
