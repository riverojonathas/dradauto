'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, FileText, Loader2, Calendar, FileHeart, User } from 'lucide-react'
import { listMedicalRecords } from '@/app/actions/medical-records'
import { useDebounce } from 'use-debounce'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default function ProntuariosPage() {
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebounce(query, 400)
  
  const [records, setRecords] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchRecords() {
      setIsLoading(true)
      try {
        const res = await listMedicalRecords({ search: debouncedQuery })
        setRecords(res.records)
        setTotal(res.total)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRecords()
  }, [debouncedQuery])

  const groupedRecords = useMemo(() => {
    const groups: Record<string, any[]> = {}
    records.forEach(r => {
      const patientId = r.patients?.id || 'unknown'
      if (!groups[patientId]) groups[patientId] = []
      groups[patientId].push(r)
    })
    return groups
  }, [records])

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Prontuários</h1>
        <p className="text-slate-500">Acesse o histórico clínico e anotações médicas dos seus pacientes.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input 
            placeholder="Buscar por paciente..." 
            className="pl-11 h-12 rounded-full border-slate-200 bg-white"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-3">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="size-8 animate-spin opacity-50" />
            <p className="text-sm font-medium">Buscando prontuários...</p>
          </div>
        ) : Object.keys(groupedRecords).length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
            <FileText className="size-10 opacity-20 mb-3" />
            <p className="text-lg font-bold text-slate-500">Nenhum prontuário encontrado</p>
            <p className="text-sm mt-1 mb-6 text-center">Os prontuários aparecerão aqui à medida que as consultas forem marcadas e salvas.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(groupedRecords).map(([patientId, patientRecords]) => {
              const patientName = patientRecords[0].patients?.nome || 'Paciente Desconhecido'
              return (
                <Card key={patientId} className="flex flex-col md:flex-row md:items-center justify-between p-5 py-6 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-slate-50/80 transition-all shadow-sm gap-4">
                  <div className="flex items-center gap-5">
                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="size-6 text-primary" />
                    </div>
                    
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-base font-bold text-slate-900 truncate">{patientName}</span>
                        <Badge variant="secondary" className="font-bold text-xs bg-slate-100 text-slate-600">
                          {patientRecords.length} {patientRecords.length === 1 ? 'prontuário' : 'prontuários'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-slate-500">
                        Última atualização: {new Date(patientRecords[0].created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-2 shrink-0">
                    <Link href={`/pacientes/${patientId}`} className="inline-flex items-center justify-center whitespace-nowrap text-sm h-9 px-4 py-2 border border-input rounded-full shadow-sm w-full md:w-auto font-bold bg-white hover:bg-slate-100 transition-colors">
                      Ver Prontuários
                    </Link>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
