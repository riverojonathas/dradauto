'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, Save } from 'lucide-react'
import { saveMedicalRecord, saveMedicalRecordById } from '@/app/actions/medical-records'

interface ClinicalNotesFormProps {
  appointmentId: string | null
  recordId?: string
  record: any
  mode?: 'appointment' | 'patient'
}

export function ClinicalNotesForm({ appointmentId, recordId, record, mode = 'appointment' }: ClinicalNotesFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState({
    queixas: record?.queixas || '',
    hipotese_diagnostica: record?.hipotese_diagnostica || '',
    cid_10: record?.cid_10 || '',
    prescricao: record?.prescricao || '',
    observacoes: record?.observacoes || '',
  })

  const isDirty = 
    fields.queixas !== (record?.queixas || '') ||
    fields.hipotese_diagnostica !== (record?.hipotese_diagnostica || '') ||
    fields.cid_10 !== (record?.cid_10 || '') ||
    fields.prescricao !== (record?.prescricao || '') ||
    fields.observacoes !== (record?.observacoes || '')

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (mode === 'patient' && recordId) {
        await saveMedicalRecordById(recordId, fields)
      } else if (appointmentId) {
        await saveMedicalRecord(appointmentId, fields)
      }
    } catch (e: any) {
      setError("Erro ao salvar prontuário: " + e.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="h-full border-slate-200/60 shadow-sm rounded-3xl flex flex-col">
      <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
        <CardTitle className="text-base font-bold text-slate-800">Notas Clínicas</CardTitle>
        <Button size="sm" onClick={handleSave} disabled={!isDirty || isLoading} className="rounded-full h-8 px-4 font-bold shadow-sm">
          {isLoading ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Save className="size-3.5 mr-1.5" />}
          Salvar
        </Button>
      </CardHeader>
      
      <CardContent className="p-6 flex-1 overflow-y-auto space-y-6">
        {error && (
          <Alert variant="destructive" className="py-2 px-3 rounded-xl border-destructive/20 bg-destructive/5 items-center flex">
            <AlertCircle className="size-4 mr-2" />
            <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-1.5">
          <Label className="font-semibold text-slate-700">Evolução / Queixa do Dia</Label>
          <Textarea 
            value={fields.queixas} 
            onChange={(e) => setFields(f => ({ ...f, queixas: e.target.value }))}
            placeholder="Qual o estado atual do paciente..."
            className="min-h-[120px] resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="sm:col-span-2 grid gap-1.5">
            <Label className="font-semibold text-slate-700">Hipótese Diagnóstica</Label>
            <Input 
              value={fields.hipotese_diagnostica} 
              onChange={(e) => setFields(f => ({ ...f, hipotese_diagnostica: e.target.value }))}
              placeholder="Ex: Hipertensão Arterial Sistêmica"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="font-semibold text-slate-700">CID-10</Label>
            <Input 
              value={fields.cid_10} 
              onChange={(e) => setFields(f => ({ ...f, cid_10: e.target.value }))}
              placeholder="Ex: I10"
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label className="font-semibold text-slate-700">Prescrição e Conduta</Label>
          <Textarea 
            value={fields.prescricao} 
            onChange={(e) => setFields(f => ({ ...f, prescricao: e.target.value }))}
            placeholder="Medicamentos, exames solicitados, orientações..."
            className="min-h-[150px] resize-y"
          />
        </div>

        <div className="grid gap-1.5">
          <Label className="font-semibold text-slate-700">Observações Internas</Label>
          <Textarea 
            value={fields.observacoes} 
            onChange={(e) => setFields(f => ({ ...f, observacoes: e.target.value }))}
            placeholder="Anotações para uso apenas da equipe..."
            className="min-h-[80px] resize-y bg-amber-50/50 border-amber-200"
          />
        </div>
      </CardContent>
    </Card>
  )
}
