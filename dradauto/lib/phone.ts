export function normalizeDigits(value: string): string {
  return (value || '').replace(/\D/g, '')
}

// Returns E.164-like BR format without plus sign, e.g. 5511999999999.
export function toE164BR(value: string): string | null {
  const digits = normalizeDigits(value)

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`
  }

  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    return digits
  }

  return null
}

export function formatPhoneBR(value: string): string {
  const digits = normalizeDigits(value)
  const national =
    (digits.startsWith('55') && (digits.length === 12 || digits.length === 13))
      ? digits.slice(2)
      : digits

  const limited = national.slice(0, 11)

  if (limited.length <= 2) return limited
  if (limited.length <= 6) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
  if (limited.length <= 10) return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
}
