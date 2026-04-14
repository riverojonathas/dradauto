import { validateAnamnesisToken } from '@/app/actions/anamnesis'
import { AnamnesisForm } from '@/components/anamnese/anamnesis-form'
import { Stethoscope, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

// Server Component que valida o token e passa dados para o Client Component
export default async function AnamnesePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const result = await validateAnamnesisToken(token)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-6 py-10">
        {/* Header público */}
        <div className="flex items-center gap-3 mb-8">
          <div className="size-10 rounded-2xl bg-primary flex items-center justify-center">
            <Stethoscope className="size-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground text-lg">dradauto</p>
            {result.valid && result.appointment?.clinics && (
              <p className="text-sm text-muted-foreground">
                {result.appointment.clinics.nome}
              </p>
            )}
          </div>
        </div>

        {/* Formulário ou estado de erro */}
        {result.valid && result.appointment ? (
          <AnamnesisForm token={token} appointment={result.appointment as any} />
        ) : result.reason === 'already_used' ? (
          <TokenState
            icon={CheckCircle2}
            iconClass="text-primary"
            title="Ficha já enviada"
            message="Você já preencheu sua ficha de saúde. Até a consulta!"
          />
        ) : result.reason === 'expired' ? (
          <TokenState
            icon={Clock}
            iconClass="text-warning"
            title="Link expirado"
            message="Este link de anamnese expirou. Peça ao consultório para enviar um novo."
          />
        ) : (
          <TokenState
            icon={AlertCircle}
            iconClass="text-destructive"
            title="Link inválido"
            message="Este link não é válido. Verifique o endereço e tente novamente."
          />
        )}
      </div>
    </div>
  )
}

function TokenState({ icon: Icon, iconClass, title, message }: {
  icon: any; iconClass: string; title: string; message: string
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <Icon className={`size-14 ${iconClass}`} />
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}
