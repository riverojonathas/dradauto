'use client'

import { useState } from 'react'
import { submitAnamnesisAsDoctor, submitAnamnesisAsDoctoForPatient, generateAnamnesisToken } from '@/app/actions/anamnesis'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, Copy, Send, CheckCircle2, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AnamnesisPanelProps {
  appointmentId: string | null
  patientId?: string
  anamnesis: any
  appointment: any | null
  mode?: 'appointment' | 'patient'
}

export function AnamnesisPanel({ appointmentId, patientId, anamnesis, appointment, mode = 'appointment' }: AnamnesisPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localToken, setLocalToken] = useState(appointment?.anamnesis_token)
  
  const [fields, setFields] = useState({
    queixa_principal: '',
    historico_familiar: '',
    alergias: '',
    medicamentos_em_uso: '',
    antecedentes: '',
    habitos: '',
  })

  // Estado 4 — Já preenchida
  if (anamnesis) {
    return (
      <Card className="h-full border-slate-200/60 shadow-sm rounded-3xl overflow-hidden flex flex-col bg-slate-50/50">
        <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
          <CardTitle className="text-base font-bold text-slate-800">Anamnese</CardTitle>
          <Badge className="bg-emerald-100 text-emerald-700 border-none px-3">
            <CheckCircle2 className="size-3 mr-1" />
            Recebida
          </Badge>
        </CardHeader>
        <CardContent className="p-6 flex-1 overflow-y-auto space-y-6">
          <DetailItem label="Queixa principal" value={anamnesis.queixa_principal} />
          <DetailItem label="Histórico familiar" value={anamnesis.historico_familiar} />
          <DetailItem label="Alergias" value={anamnesis.alergias} />
          <DetailItem label="Medicamentos em uso" value={anamnesis.medicamentos_em_uso} />
          <DetailItem label="Antecedentes" value={anamnesis.antecedentes} />
          <DetailItem label="Hábitos" value={anamnesis.habitos} />
        </CardContent>
      </Card>
    )
  }

  // Estado 3 — Médico preenchendo
  if (isEditing) {
    const handleSave = async () => {
      if (!fields.queixa_principal.trim()) {
        setError("A queixa principal é obrigatória.")
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        let res
        if (mode === 'patient' && patientId) {
          res = await submitAnamnesisAsDoctoForPatient(patientId, fields)
        } else if (appointmentId) {
          res = await submitAnamnesisAsDoctor(appointmentId, fields)
        } else {
          throw new Error('ID não encontrado')
        }
        if (res && !res.success) throw new Error((res as any).error)
      } catch (e: any) {
        setError("Erro ao salvar: " + e.message)
      } finally {
        setIsLoading(false)
      }
    }

    return (
      <Card className="h-full border-slate-200/60 shadow-sm rounded-3xl flex flex-col">
        <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
          <CardTitle className="text-base font-bold text-slate-800">Preencher Anamnese</CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex-1 overflow-y-auto space-y-4">
          {error && (
            <Alert variant="destructive" className="py-2 px-3 rounded-xl border-destructive/20 bg-destructive/5 items-center flex">
              <AlertCircle className="size-4 mr-2" />
              <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
            </Alert>
          )}
          <Field label="Queixa principal *" value={fields.queixa_principal} onChange={v => setFields(f => ({...f, queixa_principal: v}))} required />
          <Field label="Histórico familiar" value={fields.historico_familiar} onChange={v => setFields(f => ({...f, historico_familiar: v}))} />
          <Field label="Alergias" value={fields.alergias} onChange={v => setFields(f => ({...f, alergias: v}))} />
          <Field label="Medicamentos em uso" value={fields.medicamentos_em_uso} onChange={v => setFields(f => ({...f, medicamentos_em_uso: v}))} />
          <Field label="Antecedentes" value={fields.antecedentes} onChange={v => setFields(f => ({...f, antecedentes: v}))} />
          <Field label="Hábitos" value={fields.habitos} onChange={v => setFields(f => ({...f, habitos: v}))} />
          
          <div className="pt-4 flex gap-3">
            <Button variant="ghost" onClick={() => { setIsEditing(false); setError(null); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Salvar Anamnese
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Estado 2 — Aguardando paciente
  if (localToken && !appointment?.anamnesis_token_used) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    const url = `${baseUrl}/anamnese/${localToken}`
    return (
      <Card className="h-full border-dashed border-2 border-slate-200 shadow-none bg-slate-50/50 rounded-3xl flex flex-col items-center justify-center p-8 text-center">
        <Clock className="size-10 text-amber-500/50 mb-3" />
        <h3 className="font-bold text-slate-700 text-lg">Aguardando Paciente</h3>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          O link para envio da ficha já foi gerado. Você pode enviar novamente ou preencher agora.
        </p>
        
        <div className="flex flex-col w-full gap-3">
          <Button variant="outline" className="w-full bg-white font-semibold" onClick={() => navigator.clipboard.writeText(url)}>
            <Copy className="size-4 mr-2" /> Copiar link novamente
          </Button>
          <Button variant="ghost" className="text-primary font-bold hover:bg-primary/5 hover:text-primary" onClick={() => setIsEditing(true)}>
            Preencher anamnese eu mesmo
          </Button>
        </div>
      </Card>
    )
  }

  // Estado 1 — Vazio
  const handleGenerate = async () => {
    if (!appointmentId) return
    setIsSending(true)
    setError(null)
    try {
      const res = await generateAnamnesisToken(appointmentId)
      if (res.success) {
        setLocalToken(res.token)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
        navigator.clipboard.writeText(`${baseUrl}/anamnese/${res.token}`)
      } else {
        setError("Erro ao gerar link.")
      }
    } catch (e: any) {
      setError("Erro: " + e.message)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className="h-full border-dashed border-2 border-slate-200 shadow-none bg-slate-50/50 rounded-3xl flex flex-col items-center justify-center p-8 text-center">
      <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Send className="size-8 text-slate-300" />
      </div>
      <h3 className="font-bold text-slate-700 text-lg">Nenhuma ficha recebida</h3>
      <p className="text-sm text-slate-500 mt-2 mb-8">
        {mode === 'appointment'
          ? 'Envie um link para o paciente preencher no celular, ou anote os dados abaixo.'
          : 'Preencha a anamnese deste paciente diretamente.'}
      </p>
      
      <div className="flex flex-col w-full gap-3">
        {mode === 'appointment' && (
          <Button onClick={handleGenerate} disabled={isSending} className="w-full shadow-md font-semibold font-base py-5 rounded-2xl">
            {isSending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
            Enviar para o Paciente
          </Button>
        )}
        <Button variant={mode === 'patient' ? 'default' : 'outline'} className="w-full bg-white font-semibold py-5 rounded-2xl" onClick={() => setIsEditing(true)}>
          Preencher Agora
        </Button>
      </div>
    </Card>
  )
}

function DetailItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
      <p className="text-sm text-slate-700 whitespace-pre-wrap">{value}</p>
    </div>
  )
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div className="grid gap-1.5">
      <Label className="font-semibold text-slate-700">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Textarea 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="resize-none bg-white min-h-[80px]"
      />
    </div>
  )
}
