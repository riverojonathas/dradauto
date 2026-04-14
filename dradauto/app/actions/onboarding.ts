'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

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

import { createServerClient } from '@/lib/supabase/server'

export async function completeOnboarding(data: OnboardingData) {
  const { userId } = await auth()
  if (!userId) throw new Error('Não autenticado')

  const client = await clerkClient()

  await client.users.updateUser(userId, {
    publicMetadata: {
      onboarded: true,
      role: 'doctor',
      crm: `${data.crm}-${data.crmEstado}`,
      especialidade: data.especialidade,
      nomeClinica: data.nomeClinica,
      whatsappClinica: data.whatsappClinica,
      valorConsulta: data.valorConsulta,
      duracaoConsulta: data.duracaoConsulta,
    },
    // Atualiza o nome real do médico no Clerk
    firstName: data.nomeCompleto.split(' ')[0],
    lastName: data.nomeCompleto.split(' ').slice(1).join(' '),
  })

  // Salvar no Supabase
  const supabase = createServerClient()
  
  // Usamos tipagem explícita para evitar erros de inferência do TS com o Database gerado
  const { error } = await supabase.from('clinics' as any).upsert({
    clerk_user_id: userId,
    nome: data.nomeClinica,
    crm: data.crm,
    crm_estado: data.crmEstado,
    especialidade: data.especialidade,
    whatsapp: data.whatsappClinica,
    valor_consulta: data.valorConsulta,
    duracao_consulta: data.duracaoConsulta,
    nome_secretaria: 'Sofia',
  } as any, { onConflict: 'clerk_user_id' })

  if (error) {
    console.error('Erro ao salvar no Supabase:', error)
    // Não vamos bloquear o redirect por enquanto, mas logamos o erro
  }

  return { success: true }
}
