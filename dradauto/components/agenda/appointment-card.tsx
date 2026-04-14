'use client'

import { Video, RefreshCw, Stethoscope, CalendarCheck, CalendarX, CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { AppointmentWithPatient } from '@/types'

// Cores por STATUS (pending/confirmed/completed/cancelled)
// Define visual completo: background, border, texto, ícone
const statusStyles: Record<string, { bg: string; border: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: {
    bg: 'bg-amber-50',
    border: 'border border-amber-200',
    text: 'text-amber-900',
    icon: Clock,
  },
  confirmed: {
    bg: 'bg-emerald-50',
    border: 'border border-emerald-200',
    text: 'text-emerald-900',
    icon: CheckCircle2,
  },
  completed: {
    bg: 'bg-slate-100',
    border: 'border border-slate-200',
    text: 'text-slate-600',
    icon: CheckCircle2,
  },
  cancelled: {
    bg: 'bg-red-50',
    border: 'border border-red-200',
    text: 'text-red-900',
    icon: XCircle,
  },
}

export function AppointmentCard({ appointment }: { appointment: AppointmentWithPatient }) {
  const status = statusStyles[appointment.status] || statusStyles.pending
  const StatusIcon = status.icon

  const timeStr = new Date(appointment.scheduled_at).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit'
  })

  // Consultas <= 30 min ficam curtas demais para duas linhas de texto visíveis
  const isShort = (appointment.duration_minutes || 30) <= 30

  return (
    <div className={`w-full h-full px-2 py-1 rounded-md relative overflow-hidden transition-all hover:shadow-md hover:brightness-105 flex ${isShort ? 'flex-row items-center gap-2' : 'flex-col justify-start'} cursor-pointer text-[11px] leading-tight shadow-sm ${status.bg} ${status.border} ${status.text}`}>
      <div className="flex-1 min-w-0">
        <span className="font-semibold truncate block">{appointment.patient_name}</span>
        <span className={`truncate opacity-85 flex items-center gap-1 text-[10px] ${isShort ? '' : 'mt-0.5'}`}>
          {!isShort && (appointment.tipo === 'teleconsulta'
            ? <Video className="size-3 shrink-0" />
            : appointment.tipo === 'retorno'
            ? <RefreshCw className="size-3 shrink-0" />
            : <Stethoscope className="size-3 shrink-0" />)}
          {timeStr} {!isShort && `· ${appointment.duration_minutes}min`}
        </span>
      </div>

      {/* Status icon — top right */}
      {!isShort && (
        <StatusIcon className="absolute top-1 right-2 size-3 shrink-0 opacity-70" />
      )}

      {/* Google sync indicator — bottom right */}
      {appointment.google_event_id ? (
        <CalendarCheck className="absolute bottom-1 right-1 size-3 opacity-50 shrink-0" />
      ) : (
        <CalendarX className="absolute bottom-1 right-1 size-3 opacity-25 shrink-0" />
      )}
    </div>
  )
}
