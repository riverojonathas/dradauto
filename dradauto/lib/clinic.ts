import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import type { Clinic } from '@/types'

export async function getCurrentClinic(): Promise<Clinic | null> {
  const { userId } = await auth()
  if (!userId) return null

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('clinics' as any) // as any para evitar redundância de tipagem se o TS reclamar
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  if (error) {
    console.error('Erro ao buscar clínica:', error)
    return null
  }

  return data as Clinic
}
