'use server'

import { getCurrentUser } from '@/lib/supabase/auth-server'
import { toE164BR } from '@/lib/phone'

export type OnboardingData = {
  // Step 1 — dados pessoais
  nomeCompleto: string
  crm: string
  crmEstado: string
  especialidade: string
  // Step 2 — contato da clínica
  whatsappClinica: string
  // Step 3 — configurações
  valorConsulta: number
  duracaoConsulta: number // em minutos: 30, 45, 60
}

import { createServerClient } from '@/lib/supabase/server'

export async function completeOnboarding(data: OnboardingData) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Não autenticado')

  const nomeCompleto = data.nomeCompleto.trim()
  const crm = data.crm.trim()
  const crmEstado = data.crmEstado.trim()
  const especialidade = data.especialidade.trim()
  const whatsapp = toE164BR(data.whatsappClinica)
  const valorConsulta = Number(data.valorConsulta)
  const duracaoConsulta = Number(data.duracaoConsulta)

  if (!nomeCompleto || !crm || !crmEstado || !especialidade) {
    return { success: false, error: 'Preencha todos os campos obrigatórios.' }
  }

  if (!whatsapp) {
    return { success: false, error: 'Informe um WhatsApp válido com DDD.' }
  }

  if (!Number.isFinite(valorConsulta) || valorConsulta < 0) {
    return { success: false, error: 'Informe um valor de consulta válido.' }
  }

  if (!Number.isFinite(duracaoConsulta) || duracaoConsulta <= 0) {
    return { success: false, error: 'Informe uma duração de consulta válida.' }
  }

  // Salvar no Supabase
  const supabase = createServerClient()
  const clinicsTable = supabase.from('clinics' as any) as any

  const payload = {
    user_id: user.id,
    nome: nomeCompleto,
    crm,
    crm_estado: crmEstado,
    especialidade,
    whatsapp,
    valor_consulta: valorConsulta,
    duracao_consulta: duracaoConsulta,
    nome_secretaria: 'Sofia',
  }

  const { data: existingClinic, error: fetchError } = await clinicsTable
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const clinicId = (existingClinic as { id?: string } | null)?.id

  if (fetchError) {
    console.error('Erro ao buscar clínica atual:', fetchError)
    return { success: false, error: 'Não foi possível carregar sua clínica.' }
  }

  if (clinicId) {
    const { error: updateError } = await clinicsTable
      .update(payload as any)
      .eq('id', clinicId)

    if (updateError) {
      console.error('Erro ao atualizar onboarding no Supabase:', updateError)
      return { success: false, error: 'Não foi possível salvar seu onboarding.' }
    }

    return { success: true }
  }

  const { error: insertError } = await clinicsTable
    .insert(payload as any)

  if (insertError) {
    console.error('Erro ao criar clínica no Supabase:', insertError)
    return { success: false, error: 'Não foi possível criar sua clínica.' }
  }

  return { success: true }
}
