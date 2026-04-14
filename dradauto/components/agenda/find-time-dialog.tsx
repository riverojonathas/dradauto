'use client'

import React, { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, Clock, Loader2, Sparkles } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { findNextFreeSlots } from '@/app/actions/availability'
import { buttonVariants } from '@/components/ui/button'

interface FindTimeDialogProps {
  onSelectSlot: (date: Date, time: string) => void
}

export function FindTimeDialog({ onSelectSlot }: FindTimeDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [duration, setDuration] = useState('30')
  const [slots, setSlots] = useState<{date: string, time: string, datetime: string}[]>([])
  
  const handleSearch = async () => {
    setIsLoading(true)
    setSlots([])
    try {
      const free = await findNextFreeSlots(parseInt(duration))
      setSlots(free)
    } catch (e: any) {
      alert("Erro ao buscar horários: " + e.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (s: {date: string, time: string}) => {
    const [y, m, d] = s.date.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)
    setIsOpen(false)
    onSelectSlot(dateObj, s.time)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className={buttonVariants({ variant: "outline", className: "gap-2 border-primary/50 text-primary hover:bg-primary/10" })}>
        <Sparkles className="size-4" />
        <span className="hidden sm:inline">Achar Horário</span>
        <span className="sm:hidden">Livre</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Encontrar Horário Livre</DialogTitle>
          <DialogDescription>
            Busca na sua agenda do Google os próximos buracos vazios.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-1.5">
            <Label>Duração da consulta</Label>
            <ToggleGroup value={duration as any} onValueChange={(v: any) => v && setDuration(v)} className="justify-start">
              <ToggleGroupItem value="30">30 min</ToggleGroupItem>
              <ToggleGroupItem value="45">45 min</ToggleGroupItem>
              <ToggleGroupItem value="60">60 min</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Button onClick={handleSearch} disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Buscar na Agenda
          </Button>

          {slots.length > 0 && (
            <div className="mt-4 flex flex-col gap-2 max-h-48 overflow-y-auto px-1 pb-1">
              <Label className="text-muted-foreground pb-1">Próximos horários disponíveis:</Label>
              {slots.map((s, i) => (
                <div key={i} className="flex justify-between items-center p-3 border rounded-md shadow-sm transition-colors hover:border-primary/50">
                  <div className="flex gap-3 items-center">
                    <CalendarIcon className="size-4 text-primary" />
                    <span className="font-medium text-sm">
                      {new Date(s.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit'})}
                    </span>
                    <span className="font-bold text-sm bg-muted px-2 py-1 rounded">{s.time}</span>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => handleSelect(s)}>Agendar</Button>
                </div>
              ))}
            </div>
          )}
          
          {!isLoading && slots.length === 0 && (
             <span className="text-xs text-muted-foreground text-center">Nenhum slot encontrado ou clique em buscar.</span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
