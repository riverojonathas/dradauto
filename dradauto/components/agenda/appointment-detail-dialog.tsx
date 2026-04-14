'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Stethoscope, RefreshCw, Video, Send, CheckCircle2, FileText, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { AppointmentWithPatient } from '@/types'
import { confirmAppointment, completeAppointment, cancelAppointment } from '@/app/actions/appointments'
import { generateAnamnesisToken } from '@/app/actions/anamnesis'
import Link from 'next/link'

interface AppointmentDetailDialogProps {
  isOpen: boolean
  onClose: () => void
  appointment: AppointmentWithPatient | null
  onSuccess: () => void
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: 'secondary',
  confirmed: 'default',
  cancelled: 'destructive',
  completed: 'outline',
}

const statusLabel: Record<string, string> = {
  pending: 'Aguardando',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Concluída',
}

export function AppointmentDetailDialog({ isOpen, onClose, appointment, onSuccess }: AppointmentDetailDialogProps) {
  const [anamnesisToken, setAnamnesisToken] = useState<string | null>(null)
  const [tokenUsed, setTokenUsed] = useState(false)
  const [isSendingLink, setIsSendingLink] = useState(false)

  // Atualizar states quando appointment mudar
  useEffect(() => {
    if (appointment) {
      setAnamnesisToken(appointment.anamnesis_token || null)
      setTokenUsed(appointment.anamnesis_token_used || false)
    }
  }, [appointment])

  if (!appointment) return null

  const tipoConfig = {
    teleconsulta: { icon: Video,       label: 'Teleconsulta' },
    retorno:      { icon: RefreshCw,   label: 'Retorno'      },
    consulta:     { icon: Stethoscope, label: 'Consulta'     },
  }
  const tipo = tipoConfig[appointment.tipo as keyof typeof tipoConfig] ?? tipoConfig.consulta

  const handleAction = async (action: () => Promise<void>) => {
    try {
      await action()
      onSuccess()
      onClose()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSendAnamnesis = async () => {
    setIsSendingLink(true)
    try {
      const res = await generateAnamnesisToken(appointment.id)
      if (res.success && res.token) {
        setAnamnesisToken(res.token)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
        const url = `${baseUrl}/anamnese/${res.token}`
        navigator.clipboard.writeText(url)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSendingLink(false)
    }
  }

  const copyMeetLink = () => {
    if (appointment.google_meet_link) {
      navigator.clipboard.writeText(appointment.google_meet_link)
    }
  }

  const renderBadge = (status: string, labelMap: Record<string, string>, variantMap: Record<string, any>) => (
    <Badge variant={variantMap[status] || 'default'} className="uppercase text-[10px]">
      {labelMap[status] || status}
    </Badge>
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{appointment.patient_name}</DialogTitle>
          <DialogDescription>
            {new Date(appointment.scheduled_at).toLocaleDateString('pt-BR')} às{' '}
            {new Date(appointment.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {appointment.duration_minutes} min
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex gap-2">
            {renderBadge(appointment.status, statusLabel, statusVariant)}
            {renderBadge(appointment.payment_status, { pending: 'Pagamento Pendente', paid: 'Pago', refunded: 'Reembolsado' }, { pending: 'outline', paid: 'default', refunded: 'destructive' })}
          </div>

          <div className="flex items-center gap-2 text-sm font-medium opacity-80 uppercase tracking-wider">
            <tipo.icon className="size-4" />
            {tipo.label}
          </div>

          {appointment.google_meet_link && (
            <Card className="bg-muted/30">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="overflow-hidden">
                  <p className="text-sm font-medium">Google Meet</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {appointment.google_meet_link}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="icon" variant="outline" onClick={copyMeetLink} title="Copiar">
                    <Copy className="size-4" />
                  </Button>
                  <Button size="sm" onClick={() => window.open(appointment.google_meet_link!, '_blank')}>
                    Abrir
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {appointment.observacoes && (
            <div className="text-sm text-muted-foreground border-l-2 pl-3">
              <span className="font-semibold block mb-1">Observações</span>
              {appointment.observacoes}
            </div>
          )}

          {/* Anamnese */}
          {tokenUsed ? (
            <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/20 p-4">
              <CheckCircle2 className="size-4 text-primary shrink-0" />
              <p className="text-sm font-medium text-primary">Ficha de saúde preenchida e recebida</p>
            </div>
          ) : anamnesisToken ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Ficha de saúde</p>
                <p className="text-xs text-muted-foreground">Aguardando paciente</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
                navigator.clipboard.writeText(`${baseUrl}/anamnese/${anamnesisToken}`)
              }}>
                <Copy className="size-4 mr-2" />
                Copiar
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={handleSendAnamnesis}
              disabled={isSendingLink}
            >
              {isSendingLink ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2 text-primary" />}
              Enviar ficha para o paciente
            </Button>
          )}

        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col items-stretch pt-2">
          <Link href={`/prontuarios/${appointment.id}`} className="inline-flex items-center justify-center whitespace-nowrap text-sm h-10 px-4 py-2 border border-input rounded-md font-bold hover:bg-slate-100 transition-colors bg-white shadow-sm w-full">
            <FileText className="size-4 mr-2 text-primary" />
            Abrir Prontuário
          </Link>
          {appointment.status === 'pending' && (
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => handleAction(() => confirmAppointment(appointment.id))}>Confirmar</Button>
              <Button variant="destructive" onClick={() => handleAction(() => cancelAppointment(appointment.id))}>Cancelar</Button>
            </div>
          )}
          {appointment.status === 'confirmed' && (
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => handleAction(() => completeAppointment(appointment.id))}>Concluir</Button>
              <Button variant="destructive" onClick={() => handleAction(() => cancelAppointment(appointment.id))}>Cancelar</Button>
            </div>
          )}
          {appointment.status === 'completed' && (
            <Button variant="outline" disabled>Finalizada</Button>
          )}
           {appointment.status === 'cancelled' && (
            <Button variant="outline" disabled>Cancelada</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
