import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowRight, Phone, Stethoscope } from 'lucide-react'
import { GoogleSyncBadge } from './google-sync-badge'
import { formatPhoneBR } from '@/lib/phone'
import type { Patient } from '@/types'

interface PatientCardProps {
  patient: Patient & { appointments?: Array<{ count: number }> }
  isProviderConnected: boolean
}

export function PatientCard({ patient, isProviderConnected }: PatientCardProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
  }

  const consultCount = patient.appointments?.[0]?.count || 0

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md hover:border-slate-300">
      <div className="flex items-start justify-between gap-3 p-3 sm:p-4">
        <Link
          href={`/pacientes/${patient.id}`}
          className="group min-w-0 flex-1 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label={`Abrir perfil de ${patient.nome}`}
        >
          <div className="flex items-start gap-3">
            <Avatar className="size-10 sm:size-11 border border-slate-200 shadow-sm shrink-0">
              <AvatarFallback className="bg-primary/5 text-primary font-semibold text-xs sm:text-sm">
                {getInitials(patient.nome)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm sm:text-base font-semibold text-slate-900 group-hover:text-primary transition-colors">
                  {patient.nome}
                </h3>
                <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="size-3.5" />
                </div>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <Phone className="size-3.5 text-slate-400 shrink-0" />
                  <span className="truncate font-medium">{formatPhoneBR(patient.whatsapp)}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <Stethoscope className="size-3.5 text-slate-400" />
                  {consultCount} {consultCount === 1 ? 'consulta' : 'consultas'}
                </span>
              </div>
            </div>
          </div>
        </Link>

        <div className="shrink-0 pt-0.5">
          <GoogleSyncBadge
            patientId={patient.id}
            googleContactId={patient.google_contact_id}
            isProviderConnected={isProviderConnected}
            patientName={patient.nome}
            patientWhatsapp={patient.whatsapp}
          />
        </div>
      </div>
    </Card>
  )
}
