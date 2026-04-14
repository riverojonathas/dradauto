'use client'

import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WeekNavigationProps {
  startDate: Date
  onChangeWeek: (date: Date) => void
  onDaySelect: (date: Date) => void
  viewMode: 'day' | 'week'
  onChangeViewMode: (mode: 'day' | 'week') => void
  isLoading?: boolean
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Retorna o domingo da semana
function getSundayOf(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

export function WeekNavigation({ startDate, onChangeWeek, onDaySelect, viewMode, onChangeViewMode, isLoading }: WeekNavigationProps) {
  const handlePrev = () => {
    const newDate = new Date(startDate)
    newDate.setDate(newDate.getDate() - (viewMode === 'week' ? 7 : 1))
    onChangeWeek(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(startDate)
    newDate.setDate(newDate.getDate() + (viewMode === 'week' ? 7 : 1))
    onChangeWeek(newDate)
  }

  const handleToday = () => {
    onChangeWeek(new Date())
  }

  const getWeekRangeLabel = () => {
    if (viewMode === 'day') {
      return startDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
    }
    const end = new Date(startDate)
    end.setDate(end.getDate() + 4)
    return `${startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
  }

  // Gera os 7 dias da semana atual para o strip mobile
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(getSundayOf(startDate))
    d.setDate(d.getDate() + i)
    d.setHours(0, 0, 0, 0)  // Normaliza para meia-noite
    return d
  })
  const today = new Date()
  today.setHours(0, 0, 0, 0)  // Normaliza para comparação
  const isToday = (d: Date) => d.toDateString() === today.toDateString()
  const isSelected = (d: Date) => d.toDateString() === startDate.toDateString()

  return (
    <div className="flex flex-col mb-4 gap-3">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrev}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="size-4" />
          </Button>
          <span className="font-medium text-lg ml-2 capitalize flex items-center gap-2">
            {getWeekRangeLabel()}
            {isLoading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </span>
        </div>

        <div className="flex bg-muted p-1 rounded-lg">
          <Button
            variant={viewMode === 'day' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onChangeViewMode('day')}
          >
            Dia
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onChangeViewMode('week')}
          >
            Semana
          </Button>
        </div>
      </div>

      {/* 7-day strip — visível apenas no mobile */}
      <div className="flex md:hidden items-center justify-between gap-1 bg-muted/30 rounded-xl p-2 border border-border/50">
        {weekDays.map((d) => (
          <button
            key={d.toDateString()}
            type="button"
            onClick={() => onDaySelect(d)}
            className={`flex flex-col items-center flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isSelected(d)
                ? 'bg-primary text-primary-foreground shadow-sm'
                : isToday(d)
                ? 'text-primary font-bold'
                : 'text-muted-foreground hover:bg-background'
            }`}
          >
            <span className="text-[10px] uppercase">{DAY_LABELS[d.getDay()]}</span>
            <span className="text-sm font-bold leading-none mt-0.5">{d.getDate()}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
