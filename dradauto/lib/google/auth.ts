import { Clinic } from '@/types'
import { createServerClient } from '@/lib/supabase/server'

export async function getValidAccessToken(clinic: Clinic): Promise<string> {
  // Validar que temos os campos necessários
  if (!clinic.google_access_token) {
    throw new Error('GOOGLE_NOT_CONNECTED')
  }

  const expiresAt = new Date(clinic.google_token_expires_at!)
  const needsRefresh = expiresAt <= new Date(Date.now() + 5 * 60 * 1000)

  if (!needsRefresh) return clinic.google_access_token

  // Se precisa refresh mas não tem refresh_token, o token foi revogado
  if (!clinic.google_refresh_token) {
    const supabase = createServerClient() as any
    await supabase.from('clinics')
      .update({ google_connected: false, google_access_token: null })
      .eq('id', clinic.id)
    throw new Error('GOOGLE_TOKEN_MISSING')
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: clinic.google_refresh_token!,
      grant_type: 'refresh_token',
    }),
  })

  // Aguarda se createServerClient() não for sync. No codebase, costuma ser sync no server actions
  const supabase = createServerClient()

  if (!res.ok) {
    // Refresh token revogado — desconectar
    const sb = supabase as any;
    await sb.from('clinics')
      .update({ google_connected: false, google_access_token: null })
      .eq('id', clinic.id)
    throw new Error('GOOGLE_TOKEN_REVOKED')
  }

  const data = await res.json()
  const newExpiry = new Date(Date.now() + data.expires_in * 1000).toISOString()

  const sb2 = supabase as any;
  await sb2.from('clinics').update({
    google_access_token: data.access_token,
    google_token_expires_at: newExpiry,
  }).eq('id', clinic.id)

  return data.access_token
}
