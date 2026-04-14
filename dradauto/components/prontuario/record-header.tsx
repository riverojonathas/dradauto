'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, FileText, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface RecordHeaderProps {
  appointment: any | null
  patient?: any
  anamnesis: any
  mode?: 'appointment' | 'patient'
  displayName?: string
}

export function RecordHeader({ appointment, patient, anamnesis, mode = 'appointment', displayName }: RecordHeaderProps) {
  const router = useRouter()

  const anamnesisStatus = anamnesis
    ? { label: 'Anamnese Recebida', color: 'bg-emerald-100 text-emerald-800' }
    : (appointment?.anamnesis_token && !appointment?.anamnesis_token_used)
    ? { label: 'Aguardando Anamnese', color: 'bg-amber-100 text-amber-800' }
    : { label: 'Sem Anamnese', color: 'bg-slate-100 text-slate-600' }

  const name = displayName ?? appointment?.patient_name ?? 'Paciente'
  const whatsapp = patient?.whatsapp ?? appointment?.patient_whatsapp

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-all self-start group"
      >
        <div className="size-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all">
          <ArrowLeft className="size-4" />
        </div>
        Voltar para a lista
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <FileText className="size-8 text-primary" />
            Prontuário
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <span>{name}</span>
            {whatsapp && (
              <>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-sm">{whatsapp}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-3">
          {mode === 'appointment' && appointment?.scheduled_at ? (
            <div className="flex items-center gap-3 text-sm font-bold text-slate-700 bg-white border border-slate-200/60 shadow-sm px-5 py-2.5 rounded-2xl">
              <Calendar className="size-4 text-primary" />
              <span>
                {new Date(appointment.scheduled_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                <span className="mx-2 text-slate-300">|</span>
                {new Date(appointment.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm font-bold text-slate-700 bg-white border border-slate-200/60 shadow-sm px-5 py-2.5 rounded-2xl">
              <User className="size-4 text-primary" />
              Prontuário Geral
            </div>
          )}
          <Badge className={`border-none shadow-none font-bold uppercase tracking-wider text-[10px] px-3 py-1 rounded-full ${anamnesisStatus.color}`}>
            {anamnesisStatus.label}
          </Badge>
        </div>
      </div>
    </div>
  )
}
