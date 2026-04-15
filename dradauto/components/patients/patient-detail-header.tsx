'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageCircle, CalendarPlus, Settings2 } from 'lucide-react'
import { GoogleSyncBadge } from './google-sync-badge'
import { PatientFormDialog } from './patient-form-dialog'
import { NewAppointmentDialog } from '@/components/agenda/new-appointment-dialog'
import { useRouter } from 'next/navigation'
import { toE164BR } from '@/lib/phone'
import Link from 'next/link'

interface PatientDetailHeaderProps {
  patient: any
  isProviderConnected: boolean
  backHref?: string
}

export function PatientDetailHeader({ patient, isProviderConnected, backHref = '/pacientes' }: PatientDetailHeaderProps) {
  const router = useRouter()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false)
  const [suggestedDate, setSuggestedDate] = useState<Date | undefined>(undefined)
  const [suggestedTime, setSuggestedTime] = useState<string | undefined>(undefined)

  const getInitials = (name: string) => {
    return name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'PA'
  }

  const calcularIdade = (data: string | null) => {
    if (!data) return null
    const hoje = new Date()
    const nasc = new Date(data)
    let idade = hoje.getFullYear() - nasc.getFullYear()
    const m = hoje.getMonth() - nasc.getMonth()
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--
    }
    return idade
  }

  const handleWhatsApp = () => {
    const e164 = toE164BR(patient.whatsapp)
    if (!e164) return
    const url = `https://wa.me/${e164}`
    window.open(url, '_blank')
  }

  const handleOpenAppointment = () => {
    const slot = new Date()
    slot.setSeconds(0, 0)
    const minutes = slot.getMinutes()

    if (minutes === 0) {
      slot.setMinutes(0)
    } else if (minutes <= 30) {
      slot.setMinutes(30)
    } else {
      slot.setHours(slot.getHours() + 1, 0, 0, 0)
    }

    const hh = slot.getHours().toString().padStart(2, '0')
    const mm = slot.getMinutes().toString().padStart(2, '0')

    setSuggestedDate(slot)
    setSuggestedTime(`${hh}:${mm}`)
    setIsAppointmentDialogOpen(true)
  }

  const idade = calcularIdade(patient.data_nascimento)

  return (
    <>
      <div className="flex flex-col gap-6">
        <Link
          href={backHref}
          className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors self-start"
        >
          <ArrowLeft className="size-4" />
          Voltar para Lista
        </Link>

        <Card className="rounded-3xl border-slate-200/60 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-8 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="flex items-center gap-6">
              <Avatar className="size-24 border-4 border-white shadow-lg ring-1 ring-slate-100">
                <AvatarFallback className="bg-primary/5 text-primary font-bold text-2xl">
                  {getInitials(patient.nome)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{patient.nome}</h1>
                  <GoogleSyncBadge 
                    patientId={patient.id}
                    googleContactId={patient.google_contact_id}
                    isProviderConnected={isProviderConnected}
                    patientName={patient.nome}
                    patientWhatsapp={patient.whatsapp}
                  />
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-500">
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">{patient.whatsapp}</span>
                  {idade !== null && <span>• {idade} anos</span>}
                  {patient.email && <span>• {patient.email}</span>}
                  {patient.cpf && <span>• CPF: ***.{patient.cpf.slice(3,6)}.***-**</span>}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <Button onClick={handleWhatsApp} variant="outline" className="w-full sm:w-auto rounded-full border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800">
                <MessageCircle className="size-4 mr-2" />
                WhatsApp
              </Button>
              <Button onClick={handleOpenAppointment} className="w-full sm:w-auto rounded-full shadow-md">
                <CalendarPlus className="size-4 mr-2" />
                Nova Consulta
              </Button>
              <Button onClick={() => setIsEditDialogOpen(true)} variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <Settings2 className="size-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <PatientFormDialog 
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        initialData={patient}
        isProviderConnected={isProviderConnected}
      />

      <NewAppointmentDialog
        isOpen={isAppointmentDialogOpen}
        onClose={() => setIsAppointmentDialogOpen(false)}
        initialDate={suggestedDate}
        initialTime={suggestedTime}
        initialPatient={{ id: patient.id, nome: patient.nome, whatsapp: patient.whatsapp }}
        onSuccess={() => {
          setIsAppointmentDialogOpen(false)
          router.refresh()
        }}
      />
    </>
  )
}
