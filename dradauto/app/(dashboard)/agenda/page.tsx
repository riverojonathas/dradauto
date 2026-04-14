import { getCurrentClinic } from '@/lib/clinic'
import { getAppointmentsByDateRange } from '@/app/actions/appointments'
import { AgendaClient } from '@/components/agenda/agenda-client'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ connected?: string; error?: string }> }) {
  const params = await searchParams
  const clinic = await getCurrentClinic()
  if (!clinic) redirect('/onboarding')

  // Buscar consultas da semana atual — âncora na segunda-feira
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() + diffToMonday)
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const appointments = await getAppointmentsByDateRange(
    startOfWeek.toISOString(),
    endOfWeek.toISOString()
  )

  return (
    <AgendaClient
      clinic={clinic}
      initialAppointments={appointments}
      connected={params.connected === 'true'}
      error={params.error}
    />
  )
}
