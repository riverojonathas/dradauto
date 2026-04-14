import { getCurrentUser } from '@/lib/supabase/auth-server'
import { createServerClient } from '@/lib/supabase/server'
import type { Clinic } from '@/types'

export async function getCurrentClinic(): Promise<Clinic | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createServerClient()

  const { data: byUserId } = await supabase
    .from('clinics' as any)
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (byUserId) return byUserId as Clinic

  return null
}
