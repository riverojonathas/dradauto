'use client'

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  step?: number
}

export function TimePicker({ value, onChange, step = 30 }: TimePickerProps) {
  const times = []
  for (let h = 7; h <= 20; h++) {
    for (let m = 0; m < 60; m += step) {
      if (h === 20 && m > 0) continue
      times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    }
  }

  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione o horário" />
      </SelectTrigger>
      <SelectContent className="max-h-56">
        {times.map((t) => (
          <SelectItem key={t} value={t}>{t}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
