import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Usuário negou acesso
  if (error) return NextResponse.redirect(new URL('/agenda?error=google_denied', request.url))

  // Validar state (proteção CSRF)
  const { userId } = await auth()
  if (!userId || state !== userId) {
    return NextResponse.redirect(new URL('/agenda?error=invalid_state', request.url))
  }

  if (!code) return NextResponse.redirect(new URL('/agenda?error=no_code', request.url))

  // Trocar code por tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) return NextResponse.redirect(new URL('/agenda?error=token_exchange_failed', request.url))

  const tokens = await tokenRes.json()

  // Salvar no banco
  const supabase = createServerClient() as any
  const { error: dbError } = await supabase.from('clinics').update({
    google_connected: true,
    google_access_token: tokens.access_token,
    google_refresh_token: tokens.refresh_token ?? null,
    google_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  }).eq('clerk_user_id', userId)

  if (dbError) return NextResponse.redirect(new URL('/agenda?error=save_failed', request.url))

  return NextResponse.redirect(new URL('/agenda?connected=true', request.url))
}
