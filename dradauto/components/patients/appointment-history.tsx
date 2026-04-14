'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock3, AlertCircle, Video, FileText, ArrowUpRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface AppointmentHistoryProps {
  appointments: any[]
}

const statusConfig = {
  confirmada: {
    label: "Confirmada",
    className: "bg-emerald-100 text-emerald-700 border-none shadow-none",
    icon: CheckCircle2,
  },
  aguardando_pagamento: {
    label: "Aguardando Pgto",
    className: "bg-amber-100 text-amber-700 border-none shadow-none",
    icon: Clock3,
  },
  pendente: {
    label: "Agendado",
    className: "bg-slate-100 text-slate-700 border-none shadow-none",
    icon: AlertCircle,
  },
  cancelada: {
    label: "Cancelada",
    className: "bg-red-100 text-red-700 border-none shadow-none",
    icon: AlertCircle,
  },
  completed: {
    label: "Concluída",
    className: "bg-emerald-100 text-emerald-700 border-none shadow-none",
    icon: CheckCircle2,
  },
}

export function AppointmentHistory({ appointments }: AppointmentHistoryProps) {
  if (!appointments || appointments.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
        <Clock3 className="size-10 opacity-20 mb-3" />
        <p className="text-lg font-bold text-slate-500">Nenhuma consulta</p>
        <p className="text-sm mt-1 text-center">Este paciente ainda não teve consultas agendadas.</p>
      </div>
    )
  }

  // Ordenar da mais recente para a mais antiga
  const sorted = [...appointments].sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())

  return (
    <div className="flex flex-col gap-4">
      {sorted.map((apt) => {
        const date = new Date(apt.scheduled_at)
        const isPast = date < new Date()
        const config = statusConfig[apt.status as keyof typeof statusConfig] || statusConfig.pendente
        
        return (
          <Card key={apt.id} className="rounded-2xl border-transparent hover:border-slate-200 hover:bg-slate-50/80 transition-all shadow-sm">
            <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{format(date, 'MMM', { locale: ptBR })}</span>
                  <span className="text-2xl font-black text-slate-800 -mt-1">{format(date, 'dd')}</span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-slate-900">{format(date, 'HH:mm')}</span>
                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wide px-2 bg-slate-100 rounded-md">
                      {apt.tipo}
                    </span>
                    {apt.tipo === 'teleconsulta' && <Video className="size-4 text-blue-500" />}
                  </div>
                  
                  {apt.observacoes && (
                    <p className="text-sm text-slate-500 line-clamp-1">{apt.observacoes}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {apt.payment_status === 'paid' && (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none">
                    Pago
                  </Badge>
                )}
                <Badge className={cn("px-3 py-1 font-bold text-[11px] uppercase tracking-wider", config.className)}>
                  {config.label}
                </Badge>
                
                {isPast ? (
                  <Link href={`/prontuarios/${apt.id}`} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                    Prontuário
                    <FileText className="size-3" />
                  </Link>
                ) : (
                  <button className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors">
                    Detalhes
                    <ArrowUpRight className="size-3" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
