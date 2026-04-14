'use server'

import { createServerClient } from '@/lib/supabase/server'
import { getCurrentClinic } from '@/lib/clinic'
import { getValidAccessToken } from '@/lib/google/auth'
import { createGoogleContact, updateGoogleContact } from '@/lib/google/contacts'
import { revalidatePath } from 'next/cache'
import { normalizeDigits, toE164BR } from '@/lib/phone'
import { isValidCPF, normalizeCPF } from '@/lib/cpf'

function buildPhoneSearchCandidates(search: string): string[] {
  const digits = normalizeDigits(search)
  if (!digits) return []

  const candidates = new Set<string>([digits])
  const e164 = toE164BR(search)

  if (e164) candidates.add(e164)

  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    candidates.add(digits.slice(2))
  }

  if (digits.length === 10 || digits.length === 11) {
    candidates.add(`55${digits}`)
  }

  return Array.from(candidates)
}

function matchesPhoneSearch(storedPhone: string | null, search: string): boolean {
  if (!storedPhone) return false

  const normalizedStored = normalizeDigits(storedPhone)
  if (!normalizedStored) return false

  const candidates = buildPhoneSearchCandidates(search)
  if (!candidates.length) return false

  return candidates.some((candidate) => {
    if (!candidate) return false

    if (candidate.length <= 9) {
      return normalizedStored.endsWith(candidate)
    }

    return normalizedStored.includes(candidate)
  })
}

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
  const trimmedSearch = search?.trim() || ''

  if (trimmedSearch) {
    const searchLower = trimmedSearch.toLowerCase()

    const { data, error } = await supabase
      .from('patients')
      .select('*, appointments(count)')
      .eq('clinic_id', clinic.id)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    const filtered = (data || []).filter((patient: any) => {
      const nameMatch = (patient.nome || '').toLowerCase().includes(searchLower)
      if (nameMatch) return true

      return matchesPhoneSearch(patient.whatsapp, trimmedSearch)
    })

    return {
      patients: filtered.slice(from, to + 1),
      total: filtered.length,
    }
  }

  const { data, error, count } = await supabase
    .from('patients')
    .select('*, appointments(count)', { count: 'exact' })
    .eq('clinic_id', clinic.id)
    .order('created_at', { ascending: false })
    .range(from, to)

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

  const normalizedCpf = data.cpf ? normalizeCPF(data.cpf) : undefined
  if (normalizedCpf && !isValidCPF(normalizedCpf)) {
    throw new Error('CPF inválido')
  }

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
    .insert({
      ...data,
      cpf: normalizedCpf || null,
      whatsapp: normalizedWhatsapp,
      clinic_id: clinic.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Sincronizar com Google Contacts (se conectado)
  if (clinic.google_access_token && clinic.google_refresh_token) {
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

  const normalizedCpf =
    typeof data.cpf === 'string'
      ? normalizeCPF(data.cpf)
      : undefined

  if (typeof data.whatsapp === 'string' && !normalizedWhatsapp) {
    throw new Error('WhatsApp inválido. Use DDD e número válidos.')
  }

  if (typeof data.cpf === 'string' && normalizedCpf && !isValidCPF(normalizedCpf)) {
    throw new Error('CPF inválido')
  }

  const updatePayload = {
    ...data,
    cpf: normalizedCpf,
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
  if (!clinic?.google_access_token) {
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

export async function getPatientsSyncStats() {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  const [{ count: total }, { count: unsynced }] = await Promise.all([
    supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinic.id),
    supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinic.id)
      .is('google_contact_id', null),
  ])

  return {
    total: total || 0,
    unsynced: unsynced || 0,
  }
}

export async function syncPatientToGoogle(patientId: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  if (!clinic.google_access_token || !clinic.google_refresh_token) {
    return { success: false, error: 'not_connected' }
  }

  const supabase = createServerClient() as any

  const { data: patient, error } = await supabase
    .from('patients')
    .select('id, nome, whatsapp, google_contact_id')
    .eq('id', patientId)
    .eq('clinic_id', clinic.id)
    .single()

  if (error || !patient) {
    return { success: false, error: 'not_found' }
  }

  if (patient.google_contact_id) {
    return { success: true, alreadySynced: true }
  }

  try {
    const accessToken = await getValidAccessToken(clinic)
    const resourceName = await createGoogleContact(accessToken, {
      nome: patient.nome,
      whatsapp: patient.whatsapp,
      especialidadeMedico: clinic.especialidade,
      nomeMedico: clinic.nome,
    })

    if (!resourceName) {
      return { success: false, error: 'sync_failed' }
    }

    await supabase
      .from('patients')
      .update({ google_contact_id: resourceName })
      .eq('id', patient.id)
      .eq('clinic_id', clinic.id)

    revalidatePath('/pacientes')
    revalidatePath(`/pacientes/${patient.id}`)
    return { success: true }
  } catch (e: any) {
    const message = String(e?.message || '')

    if (message === 'GOOGLE_NOT_CONNECTED' || message === 'GOOGLE_TOKEN_MISSING') {
      // Token expirou e refresh_token está faltando — precisa reconectar em Configurações
      return { success: false, error: 'token_revoked' }
    }
    if (message === 'GOOGLE_CONTACTS_SCOPE_MISSING') {
      return { success: false, error: 'scope_missing' }
    }
    if (message === 'GOOGLE_TOKEN_REVOKED') {
      return { success: false, error: 'token_revoked' }
    }
    if (message.startsWith('GOOGLE_CONTACTS_API_ERROR:')) {
      const parts = message.split(':')
      const status = parts[1] || 'unknown'
      const detail = parts.slice(2).join(':') || 'Erro ao criar contato no Google.'
      return {
        success: false,
        error: 'google_api_error',
        detail: `Google API ${status}: ${detail}`,
      }
    }

    return { success: false, error: 'sync_failed' }
  }
}

export async function deletePatient(patientId: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  const { data: patient } = await supabase
    .from('patients')
    .select('id, nome')
    .eq('id', patientId)
    .eq('clinic_id', clinic.id)
    .single()

  if (!patient) {
    return { success: false, error: 'not_found' }
  }

  const { count: recordsCount } = await supabase
    .from('medical_records')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', clinic.id)
    .eq('patient_id', patientId)

  if ((recordsCount || 0) > 0) {
    return {
      success: false,
      error: 'has_medical_records',
      message: 'Este paciente possui prontuários vinculados e não pode ser excluído.',
    }
  }

  await Promise.all([
    supabase
      .from('appointments')
      .update({ patient_id: null })
      .eq('clinic_id', clinic.id)
      .eq('patient_id', patientId),
    supabase
      .from('anamnesis')
      .update({ patient_id: null })
      .eq('clinic_id', clinic.id)
      .eq('patient_id', patientId),
    supabase
      .from('privacy_consents')
      .update({ patient_id: null })
      .eq('patient_id', patientId),
  ])

  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', patientId)
    .eq('clinic_id', clinic.id)

  if (error) {
    throw new Error('Erro ao excluir paciente: ' + error.message)
  }

  revalidatePath('/pacientes')
  revalidatePath(`/pacientes/${patientId}`)
  return { success: true }
}
