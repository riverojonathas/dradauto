'use server'

import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth-server'

export type OnboardingData = {
  // Step 1 — dados pessoais
  nomeCompleto: string
  crm: string
  crmEstado: string
  especialidade: string
  // Step 2 — dados da clínica
  nomeClinica: string
  whatsappClinica: string
  // Step 3 — configurações
  valorConsulta: number
  duracaoConsulta: number // em minutos: 30, 45, 60
}

export async function completeOnboarding(data: OnboardingData) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Não autenticado')

  const supabase = createServerClient() as any

  const payload = {
    nome: data.nomeClinica,
    crm: data.crm,
    crm_estado: data.crmEstado,
    especialidade: data.especialidade,
    whatsapp: data.whatsappClinica,
    valor_consulta: data.valorConsulta,
    duracao_consulta: data.duracaoConsulta,
    nome_secretaria: 'Sofia',
  }

  const upsertByUserId = await supabase
    .from('clinics')
    .upsert(
      { user_id: user.id, ...payload },
      { onConflict: 'user_id' }
    )

  if (!upsertByUserId.error) return { success: true }

  const upsertByLegacyId = await supabase
    .from('clinics')
    .upsert(
      { clerk_user_id: user.id, ...payload },
      { onConflict: 'clerk_user_id' }
    )

  if (upsertByLegacyId.error) {
    console.error('Erro ao salvar no Supabase:', upsertByLegacyId.error)
    return { success: false, error: 'Não foi possível concluir o onboarding.' }
  }

  return { success: true }
}
