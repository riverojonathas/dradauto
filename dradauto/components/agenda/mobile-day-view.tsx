'use client'

import { useState, useEffect, useMemo } from 'react'
import { AppointmentCard } from './appointment-card'
import { isDatesSameDay, getSafeLocalTime, formatLongDate, getLocalISODate } from '@/lib/date-utils'
import type { AppointmentWithPatient } from '@/types'

interface MobileDayViewProps {
  date: Date
  appointments: AppointmentWithPatient[]
  onSlotClick: (date: Date, time: string) => void
  onAppointmentClick: (appointment: AppointmentWithPatient) => void
  workStart: string | null
  workEnd: string | null
}

export function MobileDayView({
  date, appointments, onSlotClick, onAppointmentClick, workStart, workEnd
}: MobileDayViewProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const dailyApps = useMemo(() => {
    if (!isClient) return []
    const key = getLocalISODate(date)
    return appointments.filter(a => getLocalISODate(a.scheduled_at) === key)
  }, [isClient, appointments, date])
  
  const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7 to 20
  const MINS = ['00', '30']
  const SLOT_H = 80 // height do slot no mobile (h-20 = 5rem = 80px)
  const PPM = SLOT_H / 30 // pixel per minute

  return (
    <div className="flex flex-col gap-2 bg-white rounded-lg border">
      <div className="bg-muted/10 p-4 text-center font-bold sticky top-0 z-20 backdrop-blur-sm border-b rounded-t-lg text-primary">
        {formatLongDate(date).toUpperCase()}
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 relative min-h-[600px] pb-4">
        {HOURS.map(h => (
          MINS.map(m => {
            const timeStr = `${h.toString().padStart(2, '0')}:${m}`
            const isOutOfWork = workStart && workEnd
              ? (timeStr < workStart || timeStr >= workEnd)
              : false
            
            return (
              <div 
                key={`${h}:${m}`}
                onClick={() => !isOutOfWork && onSlotClick(date, timeStr)}
                className={`relative h-20 border-b flex items-start p-1 transition-colors ${
                  isOutOfWork ? 'bg-muted/30 opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/10'
                }`}
              >
                <span className="text-xs font-semibold text-muted-foreground w-12 pt-1">{timeStr}</span>
              </div>
            )
          })
        ))}

        {isClient && dailyApps.map(app => {
          const { hour: startHour, min: startMin } = getSafeLocalTime(app.scheduled_at)
          
          if (startHour < 7 || startHour > 20) return null

          const topMinutes = (startHour - 7) * 60 + startMin
          const topPx = topMinutes * PPM
          const duration = app.duration_minutes || 30
          const heightPx = duration * PPM

          return (
            <div
              key={app.id}
              style={{ top: `${topPx}px`, height: `${heightPx}px`, position: 'absolute', left: '3.5rem', right: '0.5rem' }}
              className="z-10 absolute pointer-events-auto shadow-md"
              onClick={(e) => { e.stopPropagation(); onAppointmentClick(app); }}
            >
              <AppointmentCard appointment={app} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
