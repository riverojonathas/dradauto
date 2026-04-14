'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { submitAnamnesis } from '@/app/actions/anamnesis'

interface AnamnesisFormProps {
  token: string
  appointment: {
    patient_name: string
    scheduled_at: string
    clinics?: { nome: string; especialidade: string }
  }
}

export function AnamnesisForm({ token, appointment }: AnamnesisFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [lgpdConsent, setLgpdConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fields, setFields] = useState({
    queixa_principal: '',
    historico_familiar: '',
    alergias: '',
    medicamentos_em_uso: '',
    antecedentes: '',
    habitos: '',
  })

  const handleSubmit = async () => {
    if (!lgpdConsent) {
      setError('Você precisa aceitar os termos de privacidade para continuar.')
      return
    }
    if (!fields.queixa_principal.trim()) {
      setError('Por favor, descreva o motivo principal da sua consulta.')
      return
    }

    setIsLoading(true)
    setError(null)

    const result = await submitAnamnesis(token, { ...fields, lgpd_consent: true })

    if (result.success) {
      setSubmitted(true)
    } else {
      setError(
        result.error === 'already_used'
          ? 'Esta ficha já foi enviada anteriormente.'
          : 'Erro ao enviar. Por favor, tente novamente.'
      )
    }
    setIsLoading(false)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <CheckCircle2 className="size-16 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Ficha enviada!</h1>
        <p className="text-muted-foreground">
          O médico poderá ver suas informações antes da consulta.
          Até dia {new Date(appointment.scheduled_at).toLocaleDateString('pt-BR')}!
        </p>
      </div>
    )
  }

  const consultaDate = new Date(appointment.scheduled_at)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ficha de Saúde</h1>
        <p className="text-muted-foreground mt-1">
          Sua consulta está marcada para{' '}
          <strong>
            {consultaDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} às{' '}
            {consultaDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </strong>
          . Preencha para ajudar o médico a se preparar.
        </p>
      </div>

      {/* Campo obrigatório */}
      <div className="flex flex-col gap-2">
        <Label className="font-semibold">
          Qual é o principal motivo da sua consulta? <span className="text-destructive">*</span>
        </Label>
        <Textarea
          placeholder="Descreva o que está sentindo, há quanto tempo, como começou..."
          rows={4}
          value={fields.queixa_principal}
          onChange={(e) => setFields(f => ({ ...f, queixa_principal: e.target.value }))}
          className="resize-none"
        />
      </div>

      {/* Campos opcionais */}
      {[
        { key: 'historico_familiar', label: 'Histórico familiar', placeholder: 'Ex: diabetes, hipertensão na família...' },
        { key: 'alergias', label: 'Alergias conhecidas', placeholder: 'Ex: dipirona, penicilina, frutos do mar...' },
        { key: 'medicamentos_em_uso', label: 'Medicamentos que usa atualmente', placeholder: 'Nome, dose e frequência de cada um...' },
        { key: 'antecedentes', label: 'Histórico médico pessoal', placeholder: 'Cirurgias, internações, doenças crônicas...' },
        { key: 'habitos', label: 'Hábitos de vida', placeholder: 'Fumo, álcool, atividade física, alimentação...' },
      ].map(({ key, label, placeholder }) => (
        <div key={key} className="flex flex-col gap-2">
          <Label className="font-medium text-foreground">{label}</Label>
          <Textarea
            placeholder={placeholder}
            rows={2}
            value={fields[key as keyof typeof fields]}
            onChange={(e) => setFields(f => ({ ...f, [key]: e.target.value }))}
            className="resize-none"
          />
        </div>
      ))}

      {/* LGPD */}
      <div className="rounded-2xl border border-border bg-muted/30 p-5">
        <div className="flex items-start gap-3">
          <Checkbox
            id="lgpd"
            checked={lgpdConsent}
            onCheckedChange={(v: boolean | 'indeterminate') => setLgpdConsent(v === true)}
            className="mt-0.5"
          />
          <Label htmlFor="lgpd" className="text-sm text-foreground cursor-pointer leading-relaxed">
            Autorizo que estas informações sejam utilizadas exclusivamente para fins de atendimento médico
            pelo consultório <strong>{appointment.clinics?.nome}</strong>, em conformidade com a LGPD
            (Lei Geral de Proteção de Dados — Lei 13.709/2018).
          </Label>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isLoading || !lgpdConsent}
        size="lg"
        className="w-full h-14 text-base font-semibold rounded-2xl"
      >
        {isLoading ? <Loader2 className="size-5 animate-spin" /> : 'Enviar Ficha de Saúde'}
      </Button>

      <p className="text-center text-xs text-muted-foreground pb-6">
        Seus dados são protegidos e usados apenas pelo seu médico.
      </p>
    </div>
  )
}
