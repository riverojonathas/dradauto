import { SignUp } from '@clerk/nextjs'
import { Stethoscope } from 'lucide-react'

export default function SignUpPage() {
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

          <SignUp
            fallbackRedirectUrl="/onboarding"
            signInUrl="/sign-in"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 p-0 bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border border-border rounded-xl h-12 font-medium text-sm hover:bg-accent/30 transition-colors",
                formButtonPrimary: "bg-primary hover:bg-primary/90 rounded-xl h-12 font-semibold",
                formFieldInput: "border-border rounded-xl h-12 focus:ring-2 focus:ring-ring",
                footerActionLink: "text-primary hover:text-primary/80 font-medium",
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
