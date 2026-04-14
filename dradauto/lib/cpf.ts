export function normalizeCPF(value: string): string {
  return (value || '').replace(/\D/g, '').slice(0, 11)
}

export function formatCPF(value: string): string {
  const digits = normalizeCPF(value)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function isValidCPF(value: string): boolean {
  const cpf = normalizeCPF(value)
  if (cpf.length !== 11) return false

  // Reject obvious invalid sequences.
  if (/^(\d)\1{10}$/.test(cpf)) return false

  const calcDigit = (base: string, factor: number) => {
    let total = 0
    for (let i = 0; i < base.length; i++) {
      total += Number(base[i]) * (factor - i)
    }
    const mod = total % 11
    return mod < 2 ? 0 : 11 - mod
  }

  const d1 = calcDigit(cpf.slice(0, 9), 10)
  const d2 = calcDigit(cpf.slice(0, 9) + String(d1), 11)

  return cpf.endsWith(`${d1}${d2}`)
}
