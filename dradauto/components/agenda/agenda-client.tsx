'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarView } from './calendar-view'
import { MobileDayView } from './mobile-day-view'
import { WeekNavigation } from './week-navigation'
import { NewAppointmentDialog } from './new-appointment-dialog'
import { AppointmentDetailDialog } from './appointment-detail-dialog'
import { ConnectGoogleBanner } from './connect-google-banner'
import { FindTimeDialog } from './find-time-dialog'
import { getAppointmentsByDateRange } from '@/app/actions/appointments'
import type { Clinic, AppointmentWithPatient } from '@/types'

interface AgendaClientProps {
  clinic: Clinic
  initialAppointments: AppointmentWithPatient[]
  connected: boolean
  error?: string
}

// Retorna a segunda-feira da semana do date fornecido
function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Dom, 1=Seg... 6=Sab
  const diff = day === 0 ? -6 : 1 - day // Se domingo, volta 6 dias; senão, volta até segunda
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function AgendaClient({ clinic, initialAppointments, connected, error }: AgendaClientProps) {
  const router = useRouter()

  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>(initialAppointments)
  const [currentWeek, setCurrentWeek] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week')
  const [mounted, setMounted] = useState(false)
  const [isFetchingWeek, setIsFetchingWeek] = useState(false)

  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>('09:00')
  const [selectedApp, setSelectedApp] = useState<AppointmentWithPatient | null>(null)

  useEffect(() => {
    const monday = getMondayOf(new Date())
    setCurrentWeek(monday)
    setMounted(true)
  }, [])

  // Busca appointments quando a semana muda (navegação ← →)
  const fetchWeekAppointments = async (weekMonday: Date) => {
    setIsFetchingWeek(true)
    try {
      const start = new Date(weekMonday)
      start.setHours(0, 0, 0, 0)
      const end = new Date(weekMonday)
      end.setDate(end.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      const data = await getAppointmentsByDateRange(start.toISOString(), end.toISOString())
      setAppointments(data)
    } finally {
      setIsFetchingWeek(false)
    }
  }

  const handleWeekChange = (date: Date) => {
    const monday = getMondayOf(date)
    setCurrentWeek(monday)
    fetchWeekAppointments(monday)
  }

  const handleSlotClick = (date: Date, time: string) => {
    setSelectedDate(date)
    setSelectedTime(time)
    setIsNewDialogOpen(true)
  }

  const handleAppClick = (app: AppointmentWithPatient) => {
    setSelectedApp(app)
    setIsDetailDialogOpen(true)
  }

  const refreshData = () => {
    if (currentWeek) fetchWeekAppointments(currentWeek)
    else router.refresh()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-full bg-background rounded-xl p-2 md:p-6 shadow-sm border border-border/50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Sua Agenda</h1>
          <p className="text-muted-foreground text-sm">Organize seus horários e pacientes em um só lugar</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {clinic.google_connected && (
            <FindTimeDialog onSelectSlot={handleSlotClick} />
          )}
          {(!clinic.google_connected && !connected) && <ConnectGoogleBanner />}
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive font-medium">
          {error === 'google_auth_failed' ? 'Falha ao conectar com o Google. Tente novamente.' : error}
        </div>
      )}

      {mounted && currentWeek && (
        <WeekNavigation
          startDate={currentWeek}
          onChangeWeek={handleWeekChange}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          isLoading={isFetchingWeek}
        />
      )}

      {/* Desktop View */}
      <div className="flex-1 overflow-hidden hidden md:block">
        {mounted && currentWeek && (
          <CalendarView
            startDate={currentWeek}
            appointments={appointments}
            onSlotClick={handleSlotClick}
            onAppointmentClick={handleAppClick}
            viewMode={viewMode}
            workStart={clinic.working_hours_start}
            workEnd={clinic.working_hours_end}
            workingDays={clinic.working_days?.length ? clinic.working_days : [1, 2, 3, 4, 5]}
          />
        )}
      </div>

      {/* Mobile View */}
      <div className="flex-1 overflow-hidden block md:hidden">
        {mounted && currentWeek && (
          <MobileDayView
            date={currentWeek}
            appointments={appointments}
            onSlotClick={handleSlotClick}
            onAppointmentClick={handleAppClick}
            workStart={clinic.working_hours_start}
            workEnd={clinic.working_hours_end}
          />
        )}
        {viewMode === 'week' && (
          <p className="text-xs text-center text-muted-foreground mt-2 border-t pt-2">
            No celular, a exibição é focada no dia. Use a seta &gt; acima para ver o próximo dia.
          </p>
        )}
      </div>

      {/* Floating Action Button (Mobile) */}
      <button
        className="md:hidden fixed bottom-6 right-6 h-14 w-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-primary/90 transition-transform active:scale-95"
        onClick={() => {
          if (currentWeek) {
            setSelectedDate(currentWeek)
            setSelectedTime('09:00')
            setIsNewDialogOpen(true)
          }
        }}
      >
        <span className="text-3xl font-light mb-1">+</span>
      </button>

      {mounted && (
        <>
          <NewAppointmentDialog
            isOpen={isNewDialogOpen}
            onClose={() => setIsNewDialogOpen(false)}
            initialDate={selectedDate}
            initialTime={selectedTime}
            defaultDuration={clinic.duracao_consulta || 30}
            defaultValor={clinic.valor_consulta || 0}
            onSuccess={refreshData}
          />
          <AppointmentDetailDialog
            isOpen={isDetailDialogOpen}
            onClose={() => { setIsDetailDialogOpen(false); setSelectedApp(null) }}
            appointment={selectedApp}
            onSuccess={refreshData}
          />
        </>
      )}
    </div>
  )
}
