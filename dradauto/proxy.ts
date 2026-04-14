import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/anamnese(.*)',
  '/pagamento(.*)',
])

const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)'])

export default clerkMiddleware(async (auth, request) => {
  // Rotas públicas — sem autenticação
  if (isPublicRoute(request)) return NextResponse.next()

  // Chamar auth() uma única vez e pegar todos os dados
  const session = await auth()

  // se não autenticado, redirecionar para sign-in
  if (!session.userId) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect_url', request.url)
    return NextResponse.redirect(signInUrl)
  }

  // Usuário logado: verificar onboarding
  const onboarded = (session.sessionClaims?.publicMetadata as any)?.onboarded
  if (onboarded && isOnboardingRoute(request)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Ignora arquivos estáticos e assets do Next.js (incluindo manifest)
    '/((?!_next/static|_next/image|favicon.ico|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot)).*)',
    '/(api|trpc)(.*)',
  ],
}
