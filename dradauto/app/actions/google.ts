'use server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'

export async function getGoogleAuthUrl(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error('Não autenticado')

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/contacts',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: userId,
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function disconnectGoogle(): Promise<void> {
  const { userId } = await auth()
  if (!userId) throw new Error('Não autenticado')

  const supabase = createServerClient() as any
  await supabase.from('clinics').update({
    google_connected: false,
    google_access_token: null,
    google_refresh_token: null,
    google_token_expires_at: null,
  }).eq('clerk_user_id', userId)
}
