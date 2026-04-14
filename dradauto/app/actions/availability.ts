'use server'

import { getCurrentClinic } from '@/lib/clinic'
import { getFreeBusy, findFreeSlots } from '@/lib/google/calendar'

export async function findNextFreeSlots(durationMinutes: number) {
  const clinic = await getCurrentClinic()
  if (!clinic || !clinic.google_connected) {
    throw new Error('Google Calendar não conectado')
  }

  const today = new Date()
  const timeMin = today.toISOString()
  
  const targetDate = new Date(today)
  targetDate.setDate(targetDate.getDate() + 15) // Look ahead 15 days
  const timeMax = targetDate.toISOString()

  // 1. Obter 'busy' do Google
  const busyPeriods = await getFreeBusy(clinic, timeMin, timeMax)

  // 2. Gerar Date Range dos próximos 15 dias usando clinic.working_days
  const dateRange: Date[] = []
  for (let i = 0; i < 15; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    if (clinic.working_days.includes(d.getDay())) {
      dateRange.push(d)
    }
  }

  // 3. Encontrar slots livres
  const freeSlots = findFreeSlots(
    busyPeriods,
    clinic.working_hours_start,
    clinic.working_hours_end,
    durationMinutes,
    dateRange
  )

  // Retornar apenas os 10 primeiros
  return freeSlots.slice(0, 10)
}
