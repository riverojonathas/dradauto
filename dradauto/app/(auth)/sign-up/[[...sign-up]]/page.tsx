'use client'

import { useState } from 'react'
import { Loader2, Stethoscope } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.4l2.7-2.6C16.9 3.2 14.7 2.2 12 2.2A9.8 9.8 0 0 0 2.2 12 9.8 9.8 0 0 0 12 21.8c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12Z" />
      <path fill="#4285F4" d="M2.2 7.5l3.2 2.3C6.3 7.3 8.9 5.9 12 5.9c1.9 0 3.2.8 3.9 1.4l2.7-2.6C16.9 3.2 14.7 2.2 12 2.2c-3.8 0-7.1 2.2-8.8 5.3Z" />
      <path fill="#FBBC05" d="M2.2 16.5 5.8 14c.8 2.5 3.2 4.1 6.2 4.1 3.8 0 5.2-2.5 5.5-3.8l3.4 2.6c-1.8 3.4-5.2 4.9-8.9 4.9-3.8 0-7.1-2.2-8.8-5.3Z" />
      <path fill="#34A853" d="M21.3 12.3c0-.6-.1-1.1-.2-1.6H12v3.9h5.5a5.6 5.6 0 0 1-2.4 3.5l3.4 2.6c2-1.8 2.8-4.6 2.8-8.4Z" />
    </svg>
  )
}

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (data.session) {
        window.location.href = '/onboarding'
        return
      }

      setSuccess('Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('next', '/agenda')

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      })

      if (oauthError) {
        setError(oauthError.message)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Lado esquerdo — identidade visual */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-white">
        <div className="flex items-center gap-3">
          <Stethoscope className="size-8" />
          <span className="text-2xl font-bold tracking-tight">dradauto</span>
        </div>

        <div className="flex flex-col gap-6">
          <blockquote className="text-3xl font-light leading-relaxed text-white/90">
            "Sua agenda, seus pacientes e sua secretária — tudo em um só lugar."
          </blockquote>
          <p className="text-white/60 text-sm">
            Junte-se à revolução médica e automatize o seu consultório em minutos.
          </p>
        </div>

        <div className="text-white/40 text-xs">
          © 2026 dradauto — Todos os direitos reservados
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="flex flex-col items-center justify-center px-8 py-12 bg-background">
        {/* Logo no mobile */}
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <Stethoscope className="size-7 text-primary" />
          <span className="text-2xl font-bold text-primary tracking-tight">dradauto</span>
        </div>

        <div className="w-full max-w-[440px] flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-foreground">Crie sua conta</h1>
            <p className="text-sm text-muted-foreground">
              Cadastre-se para começar a usar
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isLoading || isGoogleLoading}
            className="h-12 rounded-xl border border-border bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isGoogleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
            Continuar com Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">ou crie com e-mail</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu e-mail"
              className="h-12 rounded-xl border border-border px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crie uma senha"
              className="h-12 rounded-xl border border-border px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
              minLength={6}
              required
            />
            {error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : null}
            {success ? (
              <p className="text-sm text-emerald-700">{success}</p>
            ) : null}
            <button
              type="submit"
              disabled={isLoading}
              className="h-12 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60"
            >
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </button>
            <p className="text-sm text-muted-foreground">
              Já tem conta?{' '}
              <a href="/sign-in" className="text-primary font-medium hover:text-primary/80">
                Entrar
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
