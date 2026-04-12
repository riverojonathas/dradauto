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

  redirect('/')
}
