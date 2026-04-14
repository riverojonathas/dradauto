'use client'

import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WeekNavigationProps {
  startDate: Date
  onChangeWeek: (date: Date) => void
  viewMode: 'day' | 'week'
  onChangeViewMode: (mode: 'day' | 'week') => void
  isLoading?: boolean
}

export function WeekNavigation({ startDate, onChangeWeek, viewMode, onChangeViewMode, isLoading }: WeekNavigationProps) {
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

  return (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
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
  )
}
