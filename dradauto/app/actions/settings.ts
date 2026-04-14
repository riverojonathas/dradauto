'use server'

import { createServerClient } from '@/lib/supabase/server'
import { getCurrentClinic } from '@/lib/clinic'
import { revalidatePath } from 'next/cache'

export async function updateClinicSettings(data: {
  working_hours_start: string
  working_hours_end: string
  working_days: number[]
  valor_consulta: number
  duracao_consulta: number
}) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  const { error } = await supabase
    .from('clinics')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clinic.id)

  if (error) throw new Error(error.message)

  revalidatePath('/agenda')
  revalidatePath('/(dashboard)/configuracoes')
  return { success: true }
}
