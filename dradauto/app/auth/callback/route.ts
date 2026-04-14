import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase/auth-server'
import { createServerClient } from '@/lib/supabase/server'

function getSafeRedirect(value: string | null, fallback: string) {
  if (!value || !value.startsWith('/')) return fallback
  return value
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = getSafeRedirect(requestUrl.searchParams.get('next'), '/agenda')

  if (!code) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('error', 'google_auth_failed')
    return NextResponse.redirect(signInUrl)
  }

  const authClient = await createAuthServerClient()
  const { data, error } = await authClient.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('error', 'google_auth_failed')
    return NextResponse.redirect(signInUrl)
  }

  const supabase = createServerClient()
  const userId = data.user.id

  const { data: clinic } = await supabase
    .from('clinics' as any)
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  const destination = clinic ? next : '/onboarding'
  return NextResponse.redirect(new URL(destination, request.url))
}