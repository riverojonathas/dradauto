import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowRight } from 'lucide-react'
import { GoogleSyncBadge } from './google-sync-badge'

interface PatientCardProps {
  patient: any
  isProviderConnected: boolean
  searchQuery?: string
  onOpen?: (patientId: string) => void
}

export function PatientCard({ patient, isProviderConnected, searchQuery, onOpen }: PatientCardProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
  }

  const consultCount = patient.appointments?.[0]?.count || 0
  const detailHref = searchQuery
    ? `/pacientes/${patient.id}?q=${encodeURIComponent(searchQuery)}`
    : `/pacientes/${patient.id}`

  return (
    <Link href={detailHref} onClick={() => onOpen?.(patient.id)}>
      <Card className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/70 transition-all group shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            <Avatar className="size-10 sm:size-11 border-2 border-white shadow ring-1 ring-slate-100 shrink-0">
            <AvatarFallback className="bg-primary/5 text-primary font-bold text-sm">
              {getInitials(patient.nome)}
            </AvatarFallback>
          </Avatar>

            <div className="min-w-0 flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                  {patient.nome}
                </h3>
                <span className="text-xs sm:text-sm font-medium text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md w-fit">
                {patient.whatsapp}
              </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="text-sm text-slate-500 font-medium whitespace-nowrap">
                  {consultCount} {consultCount === 1 ? 'consulta' : 'consultas'}
                </div>
                <GoogleSyncBadge
                  patientId={patient.id}
                  googleContactId={patient.google_contact_id}
                  isProviderConnected={isProviderConnected}
                  patientName={patient.nome}
                  patientWhatsapp={patient.whatsapp}
                />
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shrink-0">
          <span className="text-sm font-bold text-primary">Ver perfil</span>
          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowRight className="size-4 text-primary" />
          </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
