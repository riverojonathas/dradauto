import { getCurrentUser } from '@/lib/supabase/auth-server'
import { createServerClient } from '@/lib/supabase/server'
import type { Clinic } from '@/types'

export async function getCurrentClinic(): Promise<Clinic | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createServerClient() as any

  const byUserId = await supabase
    .from('clinics')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!byUserId.error && byUserId.data) return byUserId.data as Clinic

  const byLegacyId = await supabase
    .from('clinics')
    .select('*')
    .eq('clerk_user_id', user.id)
    .maybeSingle()

  if (!byLegacyId.error && byLegacyId.data) return byLegacyId.data as Clinic

  return null
}
