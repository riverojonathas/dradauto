import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowRight } from 'lucide-react'
import { GoogleSyncBadge } from './google-sync-badge'

interface PatientCardProps {
  patient: any
  isProviderConnected: boolean
}

export function PatientCard({ patient, isProviderConnected }: PatientCardProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
  }

  const consultCount = patient.appointments?.[0]?.count || 0

  return (
    <Link href={`/pacientes/${patient.id}`}>
      <Card className="flex items-center justify-between p-5 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-slate-50/80 transition-all group shadow-sm">
        <div className="flex items-center gap-5">
          <Avatar className="size-12 border-2 border-white shadow-md ring-1 ring-slate-100">
            <AvatarFallback className="bg-primary/5 text-primary font-bold text-sm">
              {getInitials(patient.nome)}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <div className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors flex items-center gap-3">
              {patient.nome}
              <span className="text-sm font-medium text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                {patient.whatsapp}
              </span>
            </div>
            
            <div className="flex items-center gap-4 mt-1.5">
              <div className="text-sm text-slate-500 font-medium">
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

        <div className="flex items-center gap-3 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <span className="text-sm font-bold text-primary">Ver perfil</span>
          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowRight className="size-4 text-primary" />
          </div>
        </div>
      </Card>
    </Link>
  )
}
