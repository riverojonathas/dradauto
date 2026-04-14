'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { TimePicker } from './time-picker'
import { createAppointment } from '@/app/actions/appointments'
import { formatLongDate } from '@/lib/date-utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, Loader2, Stethoscope, RefreshCw, Video, Search, UserPlus } from 'lucide-react'
import { searchPatients } from '@/app/actions/patients'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useDebounce } from 'use-debounce'
import { useEffect } from 'react'

import type { Patient } from '@/types'

// Componente de busca de paciente com criação inline
function PatientSearch({ 
  onSelect, 
  initialName = '' 
}: {
  onSelect: (patient: { id: string | null; nome: string; whatsapp: string }) => void
  initialName?: string
}) {
  const [query, setQuery] = useState(initialName)
  const [results, setResults] = useState<Patient[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [debouncedQuery] = useDebounce(query, 300)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function fetchPatients() {
      if (debouncedQuery.length < 2) { 
        setResults([])
        return 
      }
      setIsSearching(true)
      try {
        const patients = await searchPatients(debouncedQuery)
        setResults(patients)
      } catch (error) {
        console.error('Erro ao buscar pacientes', error)
      } finally {
        setIsSearching(false)
      }
    }
    
    // Só buscar se o dropdown estiver ativo ou se o usuário acabou de digitar
    fetchPatients()
  }, [debouncedQuery])

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            onSelect({ id: null, nome: e.target.value, whatsapp: '' }) // Assume novo enquanto digita
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Buscar paciente existente ou digitar nome novo..."
          className="pl-9"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border bg-white shadow-lg overflow-hidden">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                onSelect({ id: p.id, nome: p.nome, whatsapp: p.whatsapp })
                setQuery(p.nome)
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
            >
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-accent text-primary text-xs font-bold">
                  {p.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium text-foreground">{p.nome}</div>
                <div className="text-xs text-muted-foreground">{p.whatsapp}</div>
              </div>
            </button>
          ))}

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              onSelect({ id: null, nome: query, whatsapp: '' })
              setIsOpen(false)
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors border-t border-border"
          >
            <div className="size-8 shrink-0 flex items-center justify-center rounded-full bg-primary/10">
              <UserPlus className="size-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium text-primary">Criar novo paciente "{query}"</div>
              <div className="text-xs text-muted-foreground">Preencha o WhatsApp abaixo</div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

interface NewAppointmentDialogProps {
  isOpen: boolean
  onClose: () => void
  initialDate?: Date
  initialTime?: string
  initialPatient?: { id: string; nome: string; whatsapp: string }
  defaultDuration?: number
  defaultValor?: number
  onSuccess: () => void
}

export function NewAppointmentDialog({ isOpen, onClose, initialDate, initialTime, initialPatient, defaultDuration, defaultValor, onSuccess }: NewAppointmentDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [conflict, setConflict] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [patientId, setPatientId] = useState<string>(initialPatient?.id || '')
  const [patientName, setPatientName] = useState<string>(initialPatient?.nome || '')
  const [whatsapp, setWhatsapp] = useState(initialPatient?.whatsapp || '')
  const [tipo, setTipo] = useState('consulta')
  const [duracao, setDuracao] = useState(String(defaultDuration || 30))
  const [valor, setValor] = useState(String(defaultValor || 150))
  const [observacoes, setObservacoes] = useState('')
  const [time, setTime] = useState(initialTime || '09:00')

  // Resetar formulário ao abrir o dialog (novo slot/data)
  useEffect(() => {
    if (isOpen) {
      setPatientId(initialPatient?.id || '')
      setPatientName(initialPatient?.nome || '')
      setWhatsapp(initialPatient?.whatsapp || '')
      setTipo('consulta')
      setDuracao(String(defaultDuration || 30))
      setValor(String(defaultValor || 150))
      setObservacoes('')
      setTime(initialTime || '09:00')
      setConflict(false)
      setSubmitError(null)
    }
  }, [isOpen, initialTime, initialPatient, defaultDuration, defaultValor])

  const handleSubmit = async () => {
    setSubmitError(null)
    try {
      setIsLoading(true)
      setConflict(false)

      const scheduledAt = new Date(initialDate || new Date())
      const [h, m] = time.split(':').map(Number)
      scheduledAt.setHours(h, m, 0, 0)

      const res = await createAppointment({
        patient_id: patientId || null,
        patient_name: patientName,
        patient_whatsapp: whatsapp,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: parseInt(duracao),
        tipo,
        valor: parseFloat(valor) || 0,
        observacoes,
        clinic_id: '',
      })

      if (res.hasConflict && !conflict) {
        setConflict(true)
        setIsLoading(false)
        return
      }

      onSuccess()
      onClose()
    } catch (e: any) {
      console.error(e)
      setSubmitError(e.message || 'Erro ao salvar a consulta. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-8 pt-8 pb-6 border-b border-border/50">
          <DialogTitle className="text-xl font-bold">Nova Consulta</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Agende um novo horário para {initialDate ? formatLongDate(initialDate) : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="px-8 py-6 flex flex-col gap-5 max-h-[60vh] overflow-y-auto w-full">
          <div className="grid gap-1.5">
            <Label>Paciente *</Label>
            <PatientSearch
              initialName={patientName}
              onSelect={(p) => {
                setPatientId(p.id || '')
                setPatientName(p.nome)
                if (p.whatsapp) setWhatsapp(p.whatsapp)
              }}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>WhatsApp *</Label>
            <InputGroup>
              <InputGroupAddon>+55</InputGroupAddon>
              <InputGroupInput 
                placeholder="(11) 99999-9999" 
                value={whatsapp} 
                onChange={(e) => setWhatsapp(e.target.value)}
                disabled={!!patientId} // Desabilita se for paciente existente
              />
            </InputGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Data</Label>
              <Input value={initialDate?.toLocaleDateString('pt-BR') || ''} disabled />
            </div>
            <div className="grid gap-1.5">
              <Label>Horário *</Label>
              <TimePicker value={time} onChange={setTime} step={30} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Tipo *</Label>
            <ToggleGroup value={tipo as any} onValueChange={(v: any) => v && setTipo(v)} className="justify-start gap-2">
              <ToggleGroupItem value="consulta" className="gap-2">
                <Stethoscope className="size-4" />
                Consulta
              </ToggleGroupItem>
              <ToggleGroupItem value="retorno" className="gap-2">
                <RefreshCw className="size-4" />
                Retorno
              </ToggleGroupItem>
              <ToggleGroupItem value="teleconsulta" className="gap-2">
                <Video className="size-4" />
                Teleconsulta
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Duração</Label>
              <ToggleGroup value={duracao as any} onValueChange={(v: any) => v && setDuracao(v)} className="justify-start">
                <ToggleGroupItem value="30">30 min</ToggleGroupItem>
                <ToggleGroupItem value="45">45 min</ToggleGroupItem>
                <ToggleGroupItem value="60">60 min</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="grid gap-1.5">
              <Label>Valor (R$)</Label>
              <InputGroup>
                <InputGroupAddon>R$</InputGroupAddon>
                <InputGroupInput type="number" value={valor} onChange={e => setValor(e.target.value)} />
              </InputGroup>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Observações</Label>
            <Textarea 
              placeholder="Motivo da consulta..." 
              value={observacoes} 
              onChange={e => setObservacoes(e.target.value)}
              className="resize-none"
            />
          </div>

        </div>

        {submitError && (
          <div className="px-8 pb-4">
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Erro ao salvar</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          </div>
        )}

        {conflict && (
          <div className="px-8 pb-4">
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Conflito de Horário</AlertTitle>
              <AlertDescription>
                Já existe uma consulta próxima. Clique "Confirmar mesmo assim" para prosseguir.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter className="px-8 py-6 border-t border-border/50 bg-muted/30">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isLoading || !patientName || !whatsapp}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {conflict ? 'Confirmar mesmo assim' : (isLoading ? 'Criando...' : 'Criar Consulta')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
