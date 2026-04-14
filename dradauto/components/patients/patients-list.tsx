'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CloudUpload, Loader2, Plus, Search } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useDebounce } from 'use-debounce'
import { listPatients, syncAllPatientsToGoogle } from '@/app/actions/patients'
import { PatientCard } from './patient-card'
import { PatientFormDialog } from './patient-form-dialog'

interface PatientsListProps {
  isProviderConnected: boolean
  initialFilter?: string
}

export function PatientsList({ isProviderConnected }: PatientsListProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebounce(query, 400)
  
  const [patients, setPatients] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{ synced: number, show: boolean }>({ synced: 0, show: false })
  const [syncError, setSyncError] = useState<string | null>(null)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // O total global de pacientes e os stats (novos, sem consulta) 
  // idealmente viriam do backend pra exibir nos cards fora desta lista.
  // Aqui estamos renderizando a lista de fato.

  const fetchPatients = async () => {
    setIsLoading(true)
    try {
      const res = await listPatients({ search: debouncedQuery, limit: 100 })
      setPatients(res.patients)
      setTotal(res.total)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [debouncedQuery])

  const handleBulkSync = async () => {
    setIsSyncing(true)
    setSyncError(null)
    try {
      const res = await syncAllPatientsToGoogle()
      if (res.success) {
        setSyncStatus({ synced: res.synced || 0, show: true })
        fetchPatients()
      } else {
        setSyncError(res.error === 'scope_missing'
          ? 'Escopo de Contatos não autorizado. Reconecte o Google em Configurações.'
          : 'Erro ao sincronizar contatos.')
      }
    } finally {
      setIsSyncing(false)
    }
  }

  // Descobrir quantos não estão sincronizados (dos que aparecem em tela, mas como a busca tem limit 100, é só uma métrica local)
  const unsyncedCount = patients.filter(p => !p.google_contact_id).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input 
            placeholder="Buscar por nome ou WhatsApp..." 
            className="pl-11 h-12 rounded-full border-slate-200 bg-white"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button className="rounded-full shadow-md" size="lg" onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 size-5" />
          Novo Paciente
        </Button>
      </div>

      {isProviderConnected && unsyncedCount > 0 && !query && (
        <Alert className="border-primary/20 bg-primary/5 rounded-2xl shadow-sm relative overflow-hidden">
          <CloudUpload className="size-5 text-primary absolute left-4 top-4" />
          <div className="pl-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <AlertTitle className="text-base text-slate-900">Existem pacientes não sincronizados</AlertTitle>
              <AlertDescription className="text-slate-600 mt-1">
                Sincronize para ver o nome deles na tela do seu celular quando ligarem para você.
              </AlertDescription>
            </div>
            <Button size="sm" onClick={handleBulkSync} disabled={isSyncing} className="shrink-0 bg-primary/20 text-primary hover:bg-primary/30">
              {isSyncing ? <Loader2 className="size-4 animate-spin mr-2" /> : <CloudUpload className="size-4 mr-2" />}
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Todos'}
            </Button>
          </div>
        </Alert>
      )}

      {syncError && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertDescription>{syncError}</AlertDescription>
        </Alert>
      )}

      {syncStatus.show && (
        <Alert className="border-emerald-200 bg-emerald-50 rounded-2xl">
          <AlertTitle className="text-emerald-800">Sincronização concluída</AlertTitle>
          <AlertDescription className="text-emerald-600">
            {syncStatus.synced} paciente(s) adicionado(s) aos seus contatos do Google!
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="size-8 animate-spin opacity-50" />
            <p className="text-sm font-medium">Buscando pacientes...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
            <Search className="size-10 opacity-20 mb-3" />
            <p className="text-lg font-bold text-slate-500">Nenhum paciente encontrado</p>
            <p className="text-sm mt-1 mb-6 text-center">Não encontramos resultados para sua busca.</p>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)} className="rounded-full">
              Cadastrar Agora
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {patients.map(p => (
              <PatientCard key={p.id} patient={p} isProviderConnected={isProviderConnected} />
            ))}
          </div>
        )}
      </div>

      <PatientFormDialog 
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          fetchPatients() // Reload list
        }}
        isProviderConnected={isProviderConnected}
      />
    </div>
  )
}
