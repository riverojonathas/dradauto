import { format, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Retorna se duas datas são o mesmo dia, ignorando timezone.
 * Converte para o fuso horário local do ambiente antes de comparar.
 */
export function isDatesSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2
  return isSameDay(d1, d2)
}

/**
 * Retorna hora e minuto locais de forma segura.
 */
export function getSafeLocalTime(date: Date | string): { hour: number; min: number; timeStr: string } {
  const d = typeof date === 'string' ? parseISO(date) : date
  const hour = d.getHours()
  const min = d.getMinutes()
  const timeStr = format(d, 'HH:mm')
  return { hour, min, timeStr }
}

/**
 * Formata uma data para exibição por extenso (PT-BR).
 */
export function formatLongDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "eeee, dd 'de' MMMM", { locale: ptBR })
}

/**
 * Retorna o "YYYY-MM-DD" local de uma data.
 */
export function getLocalISODate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'yyyy-MM-dd')
}
