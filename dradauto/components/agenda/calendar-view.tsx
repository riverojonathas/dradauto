'use client'

import { useState, useEffect, useRef } from 'react'
import { AppointmentCard } from './appointment-card'
import { isDatesSameDay, getSafeLocalTime } from '@/lib/date-utils'
import type { AppointmentWithPatient } from '@/types'

interface CalendarViewProps {
  startDate: Date
  appointments: AppointmentWithPatient[]
  onSlotClick: (date: Date, time: string) => void
  onAppointmentClick: (appointment: AppointmentWithPatient) => void
  viewMode: 'day' | 'week'
  workStart: string | null
  workEnd: string | null
  workingDays: number[]
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7 to 20
const MINS = ['00', '30']
const HEADER_H = 72 // h-12 header (48px) + h-6 top spacer (24px)

export function CalendarView({
  startDate, appointments, onSlotClick, onAppointmentClick, viewMode, workStart, workEnd, workingDays
}: CalendarViewProps) {
  const [isClient, setIsClient] = useState(false)
  const [nowTopPx, setNowTopPx] = useState<number | null>(null)
  const [pxPerMin, setPxPerMin] = useState(1.6) // 48px/30min fallback

  const scrollRef = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLDivElement>(null) // referência para medir altura real do slot

  // Calcula posição da linha do "agora" com base na altura real dos slots
  const getNowTopPx = (ppm: number): number | null => {
    const now = new Date()
    const { hour, min } = getSafeLocalTime(now)
    if (hour < 7 || hour >= 21) return null
    return ((hour - 7) * 60 + min) * ppm + HEADER_H
  }

  useEffect(() => {
    // 1. Medir a altura REAL do slot renderizado (resolve bug de posição)
    let ppm = 1.6
    if (slotRef.current) {
      const h = slotRef.current.getBoundingClientRect().height
      if (h > 0) {
        ppm = h / 30
        setPxPerMin(ppm)
      }
    }

    setIsClient(true)
    const px = getNowTopPx(ppm)
    setNowTopPx(px)

    // 2. Auto-scroll para 1 hora antes do horário atual
    if (scrollRef.current && px !== null) {
      scrollRef.current.scrollTop = Math.max(0, px - HEADER_H - 60 * ppm)
    }

    // 3. Atualiza a linha do "agora" a cada minuto
    const timer = setInterval(() => setNowTopPx(getNowTopPx(ppm)), 60_000)
    return () => clearInterval(timer)
  }, [])

  const days = viewMode === 'week' ? workingDays : [0]

  const getDayDate = (dayOffset: number) => {
    const d = new Date(startDate)
    if (viewMode === 'week') {
      const startDay = d.getDay()
      d.setDate(d.getDate() + (dayOffset - startDay))
    }
    return d
  }

  // Normaliza workStart/workEnd: aceita null, "08:00" ou número
  const normalizeTime = (v: string | null | undefined): string => {
    if (!v) return ''
    if (String(v).includes(':')) return String(v)
    return String(v).padStart(2, '0') + ':00'
  }
  const wStart = normalizeTime(workStart)
  const wEnd   = normalizeTime(workEnd)

  return (
    <div ref={scrollRef} className="flex border rounded-lg bg-white shadow-sm overflow-x-auto overflow-y-auto h-full min-h-[600px] max-h-[calc(100vh-280px)]">
      {/* Coluna de horas */}
      <div className="flex flex-col border-r w-20 flex-shrink-0 bg-muted/5 select-none">
        <div className="h-12 border-b border-border shrink-0" /> {/* Alinha com o header dos dias */}
        <div className="h-6 shrink-0" /> {/* Espaçador — afasta 7:00 do header */}
        {HOURS.map(h =>
          MINS.map(m => {
            // A linha forte de uma hora cheia (ex: 8:00) na verdade é a borda inferior do bloco anterior (7:30).
            const isHalfHour = m === '30'
            const isFullHour = m === '00'
            return (
              <div
                key={`t-${h}:${m}`}
                className={`h-12 border-b relative shrink-0 ${isHalfHour ? 'border-b-border/40' : 'border-b-border'}`}
              >
                {isFullHour && (
                  <span className="text-[11px] font-semibold text-muted-foreground absolute top-1 right-2 leading-none">
                    {`${h}:00`}
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Colunas dos dias */}
      {days.map(dayOffset => {
        const d = getDayDate(dayOffset)
        const isToday = isDatesSameDay(d, new Date())
        
        // No modo SSR, dailyApps deve ser vazio para evitar desvios até hidratar
        const dailyApps = isClient 
          ? appointments.filter(a => isDatesSameDay(a.scheduled_at, d))
          : []
          
        const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '')
        const dayNum = d.getDate()

        return (
          <div key={dayOffset} className="flex flex-col border-r flex-1 min-w-[200px] relative">
            {/* Cabeçalho do dia */}
            <div className={`h-12 border-b flex items-center justify-center gap-1.5 text-xs font-semibold shrink-0 ${isToday ? 'bg-primary/5' : 'bg-muted/10'}`}>
              <span className={isToday ? 'text-primary font-bold' : 'text-muted-foreground'}>
                {weekday}
              </span>
              <span className={`flex items-center justify-center font-bold transition-all ${
                isToday
                  ? 'size-7 rounded-full bg-primary text-white text-sm shadow-sm'
                  : 'text-foreground'
              }`}>
                {dayNum}
              </span>
            </div>

            {/* Espaçador — afasta 7:00 do header (deve ter mesma altura que na coluna de horas) */}
            <div className="h-6 shrink-0" />

            {/* Slots de tempo */}
            {HOURS.map(h =>
              MINS.map(m => {
                const timeStr = `${h.toString().padStart(2, '0')}:${m}`
                const isOutOfWork = wStart && wEnd
                  ? (timeStr < wStart || timeStr >= wEnd)
                  : false
                const isHalfHour = m === '30'

                return (
                  <div
                    key={`s-${h}:${m}`}
                    ref={h === 7 && m === '00' && dayOffset === days[0] ? slotRef : undefined}
                    onClick={() => onSlotClick(d, timeStr)}
                    className={`h-12 shrink-0 border-b transition-colors relative
                      ${isOutOfWork ? 'bg-muted/10 cursor-not-allowed' : 'cursor-pointer hover:bg-accent/40'}
                      ${isHalfHour ? 'border-b-border/40' : 'border-b-border'}
                    `}
                  />
                )
              })
            )}

            {/* Linha do "agora" — apenas na coluna de hoje */}
            {isClient && isToday && nowTopPx !== null && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none flex items-center -translate-y-1/2"
                style={{ top: `${nowTopPx}px` }}
              >
                <div className="size-2.5 rounded-full bg-red-500 -ml-1.5 shrink-0 shadow-sm" />
                <div className="h-px flex-1 bg-red-500" />
              </div>
            )}

            {/* Consultas — Calculadas apenas no Cliente para evitar desvio UTC */}
            {isClient && dailyApps.map(app => {
              const { hour: startHour, min: startMin } = getSafeLocalTime(app.scheduled_at)
              if (startHour < 7 || startHour > 20) return null
              
              const topPx = ((startHour - 7) * 60 + startMin) * pxPerMin + HEADER_H
              const heightPx = Math.max((app.duration_minutes || 30) * pxPerMin, 24)
              
              return (
                <div
                  key={app.id}
                  style={{ top: `${topPx}px`, height: `${heightPx}px`, position: 'absolute', left: 4, right: 4 }}
                  className="z-10 pointer-events-auto"
                  onClick={e => { e.stopPropagation(); onAppointmentClick(app) }}
                >
                  <AppointmentCard appointment={app} />
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
