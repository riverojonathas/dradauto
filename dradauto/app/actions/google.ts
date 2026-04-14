'use server'
import { getCurrentUser } from '@/lib/supabase/auth-server'
import { getCurrentClinic } from '@/lib/clinic'
import { createServerClient } from '@/lib/supabase/server'

type GoogleIntegration = 'all' | 'calendar' | 'contacts'

function buildScopes(integration: GoogleIntegration): string[] {
  const scopes = new Set<string>()

  // A conexão OAuth é única para Agenda + Contatos.
  // Sempre pedimos ambos para evitar regressão de escopo ao reautorizar uma integração isolada.
  if (integration === 'all' || integration === 'calendar' || integration === 'contacts') {
    scopes.add('https://www.googleapis.com/auth/calendar.events')
    scopes.add('https://www.googleapis.com/auth/calendar.readonly')
    scopes.add('https://www.googleapis.com/auth/contacts')
  }

  return Array.from(scopes)
}

export async function getGoogleAuthUrl(options?: {
  integration?: GoogleIntegration
  returnTo?: string
}): Promise<string> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Não autenticado')

  const integration = options?.integration || 'all'
  const returnTo = options?.returnTo || '/agenda'
  const statePayload = JSON.stringify({ u: user.id, r: returnTo, i: integration })
  const state = Buffer.from(statePayload).toString('base64url')

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope: buildScopes(integration).join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function disconnectGoogle(): Promise<void> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Não autenticado')

  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any
  await supabase.from('clinics').update({
    google_connected: false,
    google_access_token: null,
    google_refresh_token: null,
    google_token_expires_at: null,
  }).eq('id', clinic.id)
}
