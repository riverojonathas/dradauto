'use client'

import { useState, useEffect, useRef } from 'react'
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

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'

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
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week')
  const [mounted, setMounted] = useState(false)
  const [isFetchingWeek, setIsFetchingWeek] = useState(false)
  const latestFetchIdRef = useRef(0)

  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>('09:00')
  const [selectedApp, setSelectedApp] = useState<AppointmentWithPatient | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Garante que selectedDay nunca seja null quando mounted
  const displayDay = selectedDay && mounted ? selectedDay : (currentWeek && mounted ? new Date(currentWeek) : null)

  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const monday = getMondayOf(today)
    setCurrentWeek(monday)
    setSelectedDay(today)
    setMounted(true)
  }, [])

  // Busca appointments quando a semana muda (navegação ← →)
  const fetchWeekAppointments = async (weekMonday: Date) => {
    const requestId = latestFetchIdRef.current + 1
    latestFetchIdRef.current = requestId

    setIsFetchingWeek(true)
    try {
      const start = new Date(weekMonday)
      start.setHours(0, 0, 0, 0)
      const end = new Date(weekMonday)
      end.setDate(end.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      const data = await getAppointmentsByDateRange(start.toISOString(), end.toISOString())
      if (latestFetchIdRef.current === requestId) {
        setAppointments(data)
      }
    } finally {
      if (latestFetchIdRef.current === requestId) {
        setIsFetchingWeek(false)
      }
    }
  }

  const handleWeekChange = (date: Date) => {
    const day = new Date(date)
    day.setHours(0, 0, 0, 0)
    
    if (viewMode === 'day') {
      // Modo dia: sempre atualiza o dia selecionado
      setSelectedDay(day)
      
      const monday = getMondayOf(day)
      const hasWeekChanged = !currentWeek || monday.getTime() !== currentWeek.getTime()
      if (hasWeekChanged) {
        setCurrentWeek(monday)
        fetchWeekAppointments(monday)
      }
    } else {
      // Modo semana: atualiza a semana e mantém selectedDay sincronizado
      const monday = getMondayOf(day)
      setCurrentWeek(monday)
      // Sempre atualiza selectedDay para o primeiro dia que foi clicado
      setSelectedDay(day)
      fetchWeekAppointments(monday)
    }
  }

  // Seleciona um dia específico a partir do strip mobile (muda modo + dia atomicamente)
  const handleDaySelect = (date: Date) => {
    const day = new Date(date)
    day.setHours(0, 0, 0, 0)  // Força normalização
    setSelectedDay(day)
    setViewMode('day')

    const monday = getMondayOf(day)
    const hasWeekChanged = !currentWeek || monday.getTime() !== currentWeek.getTime()
    if (hasWeekChanged) {
      setCurrentWeek(monday)
      fetchWeekAppointments(monday)
    }
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

  const filteredAppointments = appointments.filter((app) => {
    if (statusFilter === 'all') return true
    return app.status === statusFilter
  })

  const hasItemsForScope =
    viewMode === 'day'
      ? filteredAppointments.some((a) => {
          if (!selectedDay) return false
          const appDate = new Date(a.scheduled_at)
          return (
            appDate.getDate() === selectedDay.getDate() &&
            appDate.getMonth() === selectedDay.getMonth() &&
            appDate.getFullYear() === selectedDay.getFullYear()
          )
        })
      : filteredAppointments.length > 0

  const openQuickCreate = () => {
    const baseDate = selectedDay ?? currentWeek ?? new Date()
    setSelectedDate(baseDate)
    setSelectedTime('09:00')
    setIsNewDialogOpen(true)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-full bg-background rounded-xl p-2 md:p-6 shadow-sm border border-border/50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Sua Agenda</h1>
          <p className="text-muted-foreground text-sm">Organize seus horários e pacientes em um só lugar</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {clinic.google_access_token && (
            <FindTimeDialog onSelectSlot={handleSlotClick} />
          )}
          {(!clinic.google_access_token && !connected) && <ConnectGoogleBanner />}
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive font-medium">
          {error === 'google_auth_failed' ? 'Falha ao conectar com o Google. Tente novamente.' : error}
        </div>
      )}

      {mounted && currentWeek && (
        <WeekNavigation
          startDate={viewMode === 'day' && selectedDay ? selectedDay : (currentWeek ?? new Date())}
          onChangeWeek={handleWeekChange}
          onDaySelect={handleDaySelect}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          isLoading={isFetchingWeek}
        />
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Filtrar:</span>
        {[
          { key: 'all', label: 'Todas', color: '' },
          { key: 'pending', label: 'Pendentes', color: 'amber' },
          { key: 'confirmed', label: 'Confirmadas', color: 'emerald' },
          { key: 'completed', label: 'Concluídas', color: 'slate' },
          { key: 'cancelled', label: 'Canceladas', color: 'red' },
        ].map((item) => {
          const isActive = statusFilter === item.key
          const colorMap: Record<string, { active: string; inactive: string }> = {
            amber: { active: 'bg-amber-500 text-white border-amber-500', inactive: 'text-amber-700 border-amber-200 hover:bg-amber-50' },
            emerald: { active: 'bg-emerald-500 text-white border-emerald-500', inactive: 'text-emerald-700 border-emerald-200 hover:bg-emerald-50' },
            slate: { active: 'bg-slate-400 text-white border-slate-400', inactive: 'text-slate-600 border-slate-200 hover:bg-slate-50' },
            red: { active: 'bg-red-500 text-white border-red-500', inactive: 'text-red-700 border-red-200 hover:bg-red-50' },
          }
          const colorClass = item.color ? colorMap[item.color][isActive ? 'active' : 'inactive'] : 'bg-primary text-primary-foreground border-primary'
          
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key as StatusFilter)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                isActive
                  ? colorClass
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Desktop View */}
      <div className="flex-1 overflow-hidden hidden md:block">
        {mounted && currentWeek && displayDay && (
          <CalendarView
            startDate={viewMode === 'day' ? displayDay : currentWeek}
            appointments={filteredAppointments}
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
        {mounted && displayDay && (
          <MobileDayView
            date={displayDay}
            appointments={filteredAppointments}
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

      {!isFetchingWeek && mounted && !hasItemsForScope && (
        <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center bg-muted/20">
          <p className="text-sm font-semibold">Nenhuma consulta encontrada</p>
          <p className="text-xs text-muted-foreground mt-1">
            Crie uma nova consulta ou ajuste o filtro para visualizar outros atendimentos.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={openQuickCreate}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              Nova consulta
            </button>
            {statusFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted"
              >
                Limpar filtro
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button (Mobile) */}
      <button
        className="md:hidden fixed bottom-6 right-6 h-14 w-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-primary/90 transition-transform active:scale-95"
        onClick={openQuickCreate}
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
