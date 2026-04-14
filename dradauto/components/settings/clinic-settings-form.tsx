'use client'

import { useState } from 'react'
import { updateClinicSettings } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { AlertCircle, CheckCircle2, Clock, Calendar, DollarSign, Loader2 } from 'lucide-react'
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
