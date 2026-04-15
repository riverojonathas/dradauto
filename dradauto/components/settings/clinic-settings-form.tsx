'use client'

import { useState } from 'react'
import { updateClinicSettings } from '@/app/actions/settings'
import { getGoogleAuthUrl, disconnectGoogle } from '@/app/actions/google'
import { diagnosePeopleApi } from '@/app/actions/patients'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { AlertCircle, CheckCircle2, Clock, Calendar, DollarSign, Loader2, Unlink } from 'lucide-react'
import type { Clinic } from '@/types'

const DAYS = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
]

const HOUR_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const h = i + 6 // 06:00 to 21:00
  return { value: `${String(h).padStart(2, '0')}:00`, label: `${h}:00` }
})

interface Props {
  clinic: Clinic
}

export function ClinicSettingsForm({ clinic }: Props) {
  const [workStart, setWorkStart] = useState(clinic.working_hours_start || '08:00')
  const [workEnd, setWorkEnd]     = useState(clinic.working_hours_end   || '18:00')
  const [workDays, setWorkDays]   = useState<number[]>(
    clinic.working_days?.length ? clinic.working_days : [1, 2, 3, 4, 5]
  )
  const [duracao, setDuracao] = useState(String(clinic.duracao_consulta || 30))
  const [valor, setValor]     = useState(String(clinic.valor_consulta   || 0))

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [googleConnected, setGoogleConnected] = useState(!!clinic.google_connected)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [googleDiag, setGoogleDiag] = useState<string | null>(null)

  const handleConnectGoogle = async () => {
    setIsGoogleLoading(true)
    try {
      const url = await getGoogleAuthUrl({ integration: 'all', returnTo: '/configuracoes' })
      window.location.href = url
    } catch {
      setIsGoogleLoading(false)
    }
  }

  const handleDisconnectGoogle = async () => {
    setIsGoogleLoading(true)
    try {
      await disconnectGoogle()
      setGoogleConnected(false)
    } catch {
      // silencioso
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleDiagnose = async () => {
    setGoogleDiag('Testando...')
    const result = await diagnosePeopleApi()
    if (result.ok) {
      setGoogleDiag('✅ People API funcionando corretamente!')
    } else if (result.error === 'not_connected') {
      setGoogleDiag('⚠️ Google não conectado.')
    } else if (result.body) {
      // Extrair mensagem do JSON de erro do Google
      try {
        const parsed = JSON.parse(result.body)
        const msg = parsed?.error?.message || result.body
        setGoogleDiag(`Erro ${result.status}: ${msg}`)
      } catch {
        setGoogleDiag(`Erro ${result.status}: ${result.body}`)
      }
    } else {
      setGoogleDiag(`Erro: ${result.error || 'desconhecido'}`)
    }
  }

  const toggleDay = (day: number) => {
    setWorkDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b)
    )
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    try {
      await updateClinicSettings({
        working_hours_start: workStart,
        working_hours_end: workEnd,
        working_days: workDays,
        valor_consulta: parseFloat(valor) || 0,
        duracao_consulta: parseInt(duracao) || 30,
      })
      setSuccess(true)
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar configurações.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Integração Google */}
      <Card className="rounded-3xl border-slate-200/60 shadow-sm">
        <CardHeader className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <CardTitle className="text-lg">Integração Google</CardTitle>
              <CardDescription>Agenda, Meet e Contatos — tudo sincronizado</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
          {googleConnected ? (
            <>
              <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium">
                <CheckCircle2 className="size-4 text-emerald-500" />
                Conta Google conectada
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnectGoogle}
                  disabled={isGoogleLoading}
                  className="rounded-xl"
                >
                  {isGoogleLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Reconectar / atualizar permissões
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDiagnose}
                  className="rounded-xl text-slate-500"
                >
                  Testar conexão
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnectGoogle}
                  disabled={isGoogleLoading}
                  className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Unlink className="size-4 mr-2" />
                  Desconectar
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <AlertCircle className="size-4 text-amber-500" />
                Google não conectado — agenda e contatos não sincronizam
              </div>
              <Button
                size="sm"
                onClick={handleConnectGoogle}
                disabled={isGoogleLoading}
                className="rounded-xl gap-2"
              >
                {isGoogleLoading ? <Loader2 className="size-4 animate-spin" /> : (
                  <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Conectar Google
              </Button>
            </>
          )}
          </div>
          {googleDiag && (
            <p className="text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 break-all">
              {googleDiag}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Horários de atendimento */}
      <Card className="rounded-3xl border-slate-200/60 shadow-sm">
        <CardHeader className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Clock className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Horário de Atendimento</CardTitle>
              <CardDescription>Define o intervalo visível na sua agenda</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Início</Label>
              <select
                value={workStart}
                onChange={e => setWorkStart(e.target.value)}
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {HOUR_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Fim</Label>
              <select
                value={workEnd}
                onChange={e => setWorkEnd(e.target.value)}
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {HOUR_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dias de atendimento */}
      <Card className="rounded-3xl border-slate-200/60 shadow-sm">
        <CardHeader className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Calendar className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Dias de Atendimento</CardTitle>
              <CardDescription>Quais dias da semana você atende</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => {
              const active = workDays.includes(day.value)
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`h-10 w-14 rounded-xl text-sm font-bold border transition-all ${
                    active
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-primary/50'
                  }`}
                >
                  {day.label}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Padrões de consulta */}
      <Card className="rounded-3xl border-slate-200/60 shadow-sm">
        <CardHeader className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Padrões de Consulta</CardTitle>
              <CardDescription>Valores pré-preenchidos ao agendar uma nova consulta</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8 flex flex-col gap-5">
          <div className="grid gap-1.5">
            <Label>Duração padrão</Label>
            <ToggleGroup
              value={duracao as any}
              onValueChange={(v: any) => v && setDuracao(v)}
              className="justify-start gap-2"
            >
              <ToggleGroupItem value="30">30 min</ToggleGroupItem>
              <ToggleGroupItem value="45">45 min</ToggleGroupItem>
              <ToggleGroupItem value="60">60 min</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="grid gap-1.5">
            <Label>Valor padrão da consulta</Label>
            <InputGroup className="max-w-xs">
              <InputGroupAddon>R$</InputGroupAddon>
              <InputGroupInput
                type="number"
                value={valor}
                onChange={e => setValor(e.target.value)}
                placeholder="0"
              />
            </InputGroup>
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      {error && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="rounded-2xl border-emerald-200 bg-emerald-50">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <AlertDescription className="text-emerald-700 font-medium">
            Configurações salvas com sucesso!
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleSave}
        disabled={isLoading || workDays.length === 0}
        size="lg"
        className="self-start rounded-2xl px-8 shadow-md"
      >
        {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
        Salvar Configurações
      </Button>
    </div>
  )
}
