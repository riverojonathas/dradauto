'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { createPatient, updatePatient } from '@/app/actions/patients'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { formatPhoneBR } from '@/lib/phone'

interface PatientFormDialogProps {
  isOpen: boolean
  onClose: () => void
  initialData?: any // if passed, it's an update
  isProviderConnected: boolean
}

export function PatientFormDialog({ isOpen, onClose, initialData, isProviderConnected }: PatientFormDialogProps) {
  const isEditing = !!initialData
  const [isLoading, setIsLoading] = useState(false)
  const [duplicateError, setDuplicateError] = useState<{ id: string, name: string } | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  
  const [nome, setNome] = useState(initialData?.nome || '')
  const [whatsapp, setWhatsapp] = useState(formatPhoneBR(initialData?.whatsapp || ''))
  const [email, setEmail] = useState(initialData?.email || '')
  const [dataNascimento, setDataNascimento] = useState(initialData?.data_nascimento || '')
  const [cpf, setCpf] = useState(initialData?.cpf || '')
  const [notes, setNotes] = useState(initialData?.notes || '')
  
  // O sync é automático no action createPatient se isProviderConnected
  
  const handleSubmit = async () => {
    try {
      setIsLoading(true)
      setDuplicateError(null)

      if (isEditing) {
        await updatePatient(initialData.id, {
          nome, whatsapp, email, data_nascimento: dataNascimento || undefined, cpf, notes
        })
      } else {
        const res = await createPatient({
          nome, whatsapp, email, data_nascimento: dataNascimento || undefined, cpf, notes
        })
        if (res.success === false && res.error === 'duplicate_whatsapp') {
          setDuplicateError({ id: res.existingId, name: res.existingName })
          return
        }
      }
      onClose()
    } catch (error: any) {
      setSaveError("Erro ao salvar: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-8 pt-8 pb-6 border-b border-border/50">
          <DialogTitle className="text-xl font-bold">{isEditing ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {isEditing ? 'Atualize as informações do paciente.' : 'Cadastre um novo paciente na clínica.'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-8 py-6 flex flex-col gap-5 max-h-[60vh] overflow-y-auto">
          {saveError && (
            <Alert variant="destructive" className="py-2 px-3 rounded-xl">
              <AlertCircle className="size-4 mr-2" />
              <AlertDescription className="text-xs font-medium">{saveError}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-1.5">
            <Label>Nome completo *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Maria Santos" />
          </div>

          <div className="grid gap-1.5">
            <Label>WhatsApp *</Label>
            <InputGroup>
              <InputGroupAddon>+55</InputGroupAddon>
              <InputGroupInput 
                value={whatsapp} 
                onChange={(e) => setWhatsapp(formatPhoneBR(e.target.value))} 
                placeholder="(11) 99999-9999" 
              />
            </InputGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="grid gap-1.5">
              <Label>Data de Nascimento</Label>
              <Input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>CPF</Label>
            <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
          </div>

          <div className="grid gap-1.5">
            <Label>Notas Internas (apenas você vê)</Label>
            <Textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Observações administrativas..."
              className="resize-none"
            />
          </div>

          {!isEditing && (
            <div className={`p-4 rounded-xl border flex gap-3 ${isProviderConnected ? 'bg-primary/5 border-primary/20 items-center' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-800">Salvar nos contatos do Google</div>
                <div className="text-xs text-slate-500 mt-1">
                  {isProviderConnected 
                    ? 'Ao criar, este paciente será adicionado automaticamente ao seu celular.'
                    : 'Conecte sua conta do Google Agenda para habilitar.'}
                </div>
              </div>
            </div>
          )}
        </div>

        {duplicateError && (
          <div className="px-8 pb-4">
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertCircle className="size-4 text-red-600" />
              <AlertTitle className="text-red-800 font-bold">WhatsApp já cadastrado</AlertTitle>
              <AlertDescription className="text-red-700 flex flex-col items-start gap-2 mt-2">
                Já existe um paciente ({duplicateError.name}) com este número.
                <Link href={`/pacientes/${duplicateError.id}`} onClick={onClose} className="inline-flex items-center gap-1.5 text-xs font-bold text-red-800 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-full transition-colors">
                  <LinkIcon className="size-3" />
                  Ir para perfil do paciente
                </Link>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter className="px-8 py-6 border-t border-border/50 bg-muted/30">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isLoading || !nome || !whatsapp}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEditing ? 'Salvar Alterações' : 'Criar Paciente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
