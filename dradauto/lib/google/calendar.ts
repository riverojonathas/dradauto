import { Clinic } from '@/types'
import { getValidAccessToken } from './auth'
import { AppointmentInsert } from '@/types'

export async function createCalendarEvent(
  clinic: Clinic,
  appointment: AppointmentInsert
): Promise<{ google_event_id: string; google_meet_link: string | null }> {
  const accessToken = await getValidAccessToken(clinic)

  const startDt = new Date(appointment.scheduled_at!)
  const endDt = new Date(startDt.getTime() + (appointment.duration_minutes ?? 30) * 60_000)

  const tipoEmoji = { consulta: '🩺', retorno: '🔄', teleconsulta: '🎥' }

  const body = {
    summary: `${tipoEmoji[appointment.tipo as keyof typeof tipoEmoji] || '📅'} ${appointment.patient_name}`,
    description: [
      `Paciente: ${appointment.patient_name}`,
      `WhatsApp: ${appointment.patient_whatsapp}`,
      `Tipo: ${appointment.tipo}`,
      `Valor: R$ ${appointment.valor}`,
      appointment.observacoes ? `Obs: ${appointment.observacoes}` : null,
    ].filter(Boolean).join('\n'),
    start: { dateTime: startDt.toISOString(), timeZone: 'America/Sao_Paulo' },
    end:   { dateTime: endDt.toISOString(),   timeZone: 'America/Sao_Paulo' },
    conferenceData: {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 10 },
      ],
    },
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${clinic.google_calendar_id}/events?conferenceDataVersion=1`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) throw new Error(`Google Calendar API error: ${res.status}`)

  const event = await res.json()
  const meetLink = event.conferenceData?.entryPoints?.find(
    (ep: { entryPointType: string; uri: string }) => ep.entryPointType === 'video'
  )?.uri ?? null

  return { google_event_id: event.id, google_meet_link: meetLink }
}

export async function updateCalendarEvent(
  clinic: Clinic,
  eventId: string,
  newStart: string,
  durationMinutes: number
): Promise<void> {
  const accessToken = await getValidAccessToken(clinic)
  const startDt = new Date(newStart)
  const endDt = new Date(startDt.getTime() + durationMinutes * 60_000)

  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${clinic.google_calendar_id}/events/${eventId}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: { dateTime: startDt.toISOString(), timeZone: 'America/Sao_Paulo' },
        end:   { dateTime: endDt.toISOString(),   timeZone: 'America/Sao_Paulo' },
      }),
    }
  )
}

export async function deleteCalendarEvent(clinic: Clinic, eventId: string): Promise<void> {
  const accessToken = await getValidAccessToken(clinic)
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${clinic.google_calendar_id}/events/${eventId}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }
  )
  // 404 = já foi deletado, ignorar
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`Failed to delete event: ${res.status}`)
  }
}

export async function getFreeBusy(
  clinic: Clinic,
  timeMin: string,
  timeMax: string
): Promise<Array<{ start: string; end: string }>> {
  const accessToken = await getValidAccessToken(clinic)

  const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone: 'America/Sao_Paulo',
      items: [{ id: clinic.google_calendar_id }],
    }),
  })

  const data = await res.json()
  return data.calendars[clinic.google_calendar_id]?.busy ?? []
}

export function findFreeSlots(
  busyPeriods: Array<{ start: string; end: string }>,
  workStart: string,   // "08:00"
  workEnd: string,     // "18:00"
  slotDuration: number, // minutos
  dateRange: Date[]    // dias a verificar
): Array<{ date: string; time: string; datetime: string }> {
  const freeSlots: Array<{ date: string; time: string; datetime: string }> = []
  
  const [startHour, startMin] = workStart.split(':').map(Number)
  const [endHour, endMin] = workEnd.split(':').map(Number)

  for (const date of dateRange) {
    let currentSlot = new Date(date)
    currentSlot.setHours(startHour, startMin, 0, 0)
    
    const dayEnd = new Date(date)
    dayEnd.setHours(endHour, endMin, 0, 0)

    while (currentSlot.getTime() + slotDuration * 60_000 <= dayEnd.getTime()) {
      const slotEnd = new Date(currentSlot.getTime() + slotDuration * 60_000)
      
      let hasConflict = false
      for (const busy of busyPeriods) {
        const busyStart = new Date(busy.start).getTime()
        const busyEnd = new Date(busy.end).getTime()
        
        if (currentSlot.getTime() < busyEnd && slotEnd.getTime() > busyStart) {
          hasConflict = true
          break
        }
      }

      if (!hasConflict) {
        freeSlots.push({
          date: date.toISOString().split('T')[0],
          time: currentSlot.toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' }),
          datetime: currentSlot.toISOString()
        })
      }
      
      currentSlot = slotEnd
    }
  }

  return freeSlots
}
