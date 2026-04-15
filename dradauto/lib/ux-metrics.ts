type UxMetricEvent = {
  type: string
  timestamp: number
  payload: Record<string, unknown>
}

const STORAGE_KEY = 'dradauto_ux_metrics_v1'
const MAX_EVENTS = 200

export function recordUxMetric(type: string, payload: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return

  try {
    const event: UxMetricEvent = {
      type,
      timestamp: Date.now(),
      payload,
    }

    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as UxMetricEvent[]) : []
    const next = [...parsed, event].slice(-MAX_EVENTS)

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Falha de storage não pode impactar a UX
  }
}
