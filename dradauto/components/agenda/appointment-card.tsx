'use client'

import { Video, RefreshCw, Stethoscope } from 'lucide-react'
import type { AppointmentWithPatient } from '@/types'

const cardStyles: Record<string, string> = {
  consulta:     'bg-primary/10 border-l-4 border-primary text-primary',
  retorno:      'bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800',
  teleconsulta: 'bg-violet-50 border-l-4 border-violet-500 text-violet-800',
}

const statusOverride: Record<string, string> = {
  pending:   'opacity-70 border-dashed',
  cancelled: 'opacity-40 line-through bg-muted',
  completed: 'opacity-60 bg-muted/50',
  confirmed: '',
}

export function AppointmentCard({ appointment }: { appointment: AppointmentWithPatient }) {
  const typeStyle = cardStyles[appointment.tipo] || cardStyles.consulta
  const statusStyle = statusOverride[appointment.status] || ''

  const timeStr = new Date(appointment.scheduled_at).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit'
  })

  // Consultas <= 30 min ficam curtas demais para duas linhas de texto visíveis
  const isShort = (appointment.duration_minutes || 30) <= 30

  return (
    <div className={`w-full h-full px-2 py-1 rounded relative overflow-hidden transition-all hover:brightness-95 flex ${isShort ? 'flex-row items-center gap-2' : 'flex-col justify-start'} cursor-pointer text-[11px] leading-tight shadow-sm ${typeStyle} ${statusStyle}`}>
      <span className="font-semibold truncate">{appointment.patient_name}</span>
      <span className={`truncate opacity-80 flex items-center gap-1 text-[10px] ${isShort ? '' : 'mt-0.5'}`}>
        {!isShort && (appointment.tipo === 'teleconsulta'
          ? <Video className="size-3 shrink-0" />
          : appointment.tipo === 'retorno'
          ? <RefreshCw className="size-3 shrink-0" />
          : <Stethoscope className="size-3 shrink-0" />)}
        {timeStr} {!isShort && `· ${appointment.duration_minutes}min`}
      </span>
      {appointment.status === 'confirmed' && !isShort && (
        <div className="absolute right-2 top-2 size-2 rounded-full bg-emerald-500" />
      )}
    </div>
  )
}
