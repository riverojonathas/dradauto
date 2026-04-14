import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth-server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  let returnTo = '/agenda'

  // Usuário negou acesso
  if (error) return NextResponse.redirect(new URL('/agenda?error=google_denied', request.url))

  // Validar state (proteção CSRF)
  const user = await getCurrentUser()
  const userId = user?.id
  let isStateValid = false

  if (userId && state) {
    if (state === userId) {
      isStateValid = true
    } else {
      try {
        const decoded = Buffer.from(state, 'base64url').toString('utf-8')
        const parsed = JSON.parse(decoded) as { u?: string; r?: string }
        if (parsed.u === userId) {
          isStateValid = true
          if (parsed.r && parsed.r.startsWith('/')) {
            returnTo = parsed.r
          }
        }
      } catch {
        isStateValid = false
      }
    }
  }

  if (!isStateValid) {
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
  
  console.log('[Google Callback] Iniciando salvamento de tokens para user_id:', userId)

  // Recuperar token antigo antes de atualizar (em caso de Google reutilizar)
  const { data: currentClinic, error: fetchError } = await supabase
    .from('clinics')
    .select('id, google_refresh_token')
    .eq('user_id', userId)
    .single()

  if (fetchError) {
    console.error('[Google Callback] Erro ao recuperar token antigo:', fetchError)
    return NextResponse.redirect(new URL('/agenda?error=fetch_failed', request.url))
  }

  console.log('[Google Callback] Token antigo recuperado:', !!currentClinic?.google_refresh_token)

  // Google pode não retornar novo refresh_token se já autorizou antes
  // Usar novo se retornar, senão usar o antigo, senão null
  const refreshTokenToSave = tokens.refresh_token || currentClinic?.google_refresh_token || null

  console.log('[Google Callback] Novo refresh_token:', !!tokens.refresh_token)
  console.log('[Google Callback] Refresh token final:', !!refreshTokenToSave)

  // Se não temos refresh_token em nenhuma fonte, não prosseguir (não conseguirá fazer refresh depois)
  if (!refreshTokenToSave) {
    console.error('[Google Callback] Sem refresh_token! Primeira autorização deve retornar um.')
    return NextResponse.redirect(new URL('/agenda?error=no_refresh_token', request.url))
  }

  const { error: dbError } = await supabase.from('clinics').update({
    google_connected: true,
    google_access_token: tokens.access_token,
    google_refresh_token: refreshTokenToSave,
    google_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  }).eq('id', currentClinic.id)

  if (dbError) {
    console.error('[Google Callback] Erro ao salvar no banco:', dbError)
    return NextResponse.redirect(new URL('/agenda?error=save_failed', request.url))
  }

  console.log('[Google Callback] ✅ Tokens salvos com sucesso')

  const redirectUrl = new URL(returnTo, request.url)
  redirectUrl.searchParams.set('connected', 'true')
  return NextResponse.redirect(redirectUrl)
}
