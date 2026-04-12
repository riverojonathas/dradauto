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
  const { userId, sessionClaims } = await auth()

  // Rotas públicas: qualquer um pode acessar
  if (isPublicRoute(request)) return NextResponse.next()

  // Não autenticado: redirecionar para sign-in
  if (!userId) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect_url', request.url)
    return NextResponse.redirect(signInUrl)
  }

  // Autenticado mas onboarding não concluído: forçar onboarding
  const onboarded = (sessionClaims?.publicMetadata as any)?.onboarded
  if (!onboarded && !isOnboardingRoute(request)) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Onboarding concluído tentando acessar /onboarding: redirecionar para painel
  if (onboarded && isOnboardingRoute(request)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jte?|tpe?|mp4|webp|awebp|opus|ogv|ttf|ttc|pfb|pfm|dwf|pct|acn|acr|aw).*).*)', '/(api|trpc)(.*)'],
}
