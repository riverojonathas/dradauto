'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CloudUpload, Loader2, Plus, Search } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useDebounce } from 'use-debounce'
import { listPatients, syncAllPatientsToGoogle } from '@/app/actions/patients'
import { PatientCard } from './patient-card'
import { PatientFormDialog } from './patient-form-dialog'
import { recordUxMetric } from '@/lib/ux-metrics'

interface PatientsListProps {
  isProviderConnected: boolean
  initialFilter?: string
}

const PAGE_SIZE = 20

export function PatientsList({ isProviderConnected, initialFilter }: PatientsListProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [query, setQuery] = useState(initialFilter || '')
  const [debouncedQuery] = useDebounce(query, 400)
  
  const [patients, setPatients] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [searchStartedAt, setSearchStartedAt] = useState<number | null>(
    initialFilter?.trim() ? Date.now() : null
  )
  
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{ synced: number, show: boolean }>({ synced: 0, show: false })
  const [syncError, setSyncError] = useState<string | null>(null)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // O total global de pacientes e os stats (novos, sem consulta) 
  // idealmente viriam do backend pra exibir nos cards fora desta lista.
  // Aqui estamos renderizando a lista de fato.

  const fetchPatients = async (targetPage = 1, append = false) => {
    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
    }

    try {
      const res = await listPatients({ search: debouncedQuery, page: targetPage, limit: PAGE_SIZE })
      setPatients((prev) => {
        if (!append) return res.patients
        const merged = [...prev, ...res.patients]
        const unique = new Map(merged.map((p) => [p.id, p]))
        return Array.from(unique.values())
      })
      setTotal(res.total)
      setPage(targetPage)
      setHasMore(targetPage * PAGE_SIZE < (res.total || 0))
    } catch (e) {
      console.error(e)
    } finally {
      if (append) {
        setIsLoadingMore(false)
      } else {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchPatients(1, false)
  }, [debouncedQuery])

  useEffect(() => {
    if (debouncedQuery.trim()) {
      setSearchStartedAt(Date.now())
      recordUxMetric('patients_search_started', {
        queryLength: debouncedQuery.trim().length,
      })
    } else {
      setSearchStartedAt(null)
    }
  }, [debouncedQuery])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const value = debouncedQuery.trim()

    if (value) {
      params.set('q', value)
    } else {
      params.delete('q')
    }

    const next = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(next, { scroll: false })
  }, [debouncedQuery, pathname, router])

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore) return
    await fetchPatients(page + 1, true)
  }

  const handlePullToRefresh = async () => {
    if (isRefreshing || isLoading) return
    setIsRefreshing(true)
    try {
      await fetchPatients(1, false)
      setSyncStatus((prev) => ({ ...prev, show: false }))
      setSyncError(null)
      recordUxMetric('patients_pull_to_refresh', {
        queryActive: !!debouncedQuery.trim(),
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (window.scrollY > 0) {
      touchStartYRef.current = null
      return
    }
    touchStartYRef.current = e.touches[0]?.clientY ?? null
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartYRef.current === null || window.scrollY > 0 || isRefreshing) return

    const currentY = e.touches[0]?.clientY ?? 0
    const delta = currentY - touchStartYRef.current
    if (delta <= 0) {
      setPullDistance(0)
      return
    }

    const clamped = Math.min(delta * 0.45, 96)
    setPullDistance(clamped)
  }

  const handleTouchEnd = async () => {
    const shouldRefresh = pullDistance >= 72
    setPullDistance(0)
    touchStartYRef.current = null

    if (shouldRefresh) {
      await handlePullToRefresh()
    }
  }

  const handleOpenPatient = (patientId: string) => {
    const queryValue = debouncedQuery.trim()
    const elapsedMs = searchStartedAt ? Date.now() - searchStartedAt : null

    recordUxMetric('patients_open_profile', {
      patientId,
      queryLength: queryValue.length,
      usedSearch: !!queryValue,
      elapsedMs,
    })
  }

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first?.isIntersecting && !isLoadingMore) {
          handleLoadMore()
        }
      },
      { rootMargin: '280px 0px' }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, page])

  const handleBulkSync = async () => {
    setIsSyncing(true)
    setSyncError(null)
    try {
      const res = await syncAllPatientsToGoogle()
      if (res.success) {
        if ((res.synced || 0) === 0 && (res.failed || 0) > 0) {
          setSyncError(`Não foi possível sincronizar ${res.failed} paciente(s). Verifique a conexão com Google em Configurações.`)
        } else {
          setSyncStatus({ synced: res.synced || 0, show: true })
          fetchPatients()
        }
      } else {
        if (res.error === 'api_disabled') {
          setSyncError('People API não está habilitada no Google Cloud Console. Acesse console.cloud.google.com → APIs & Services → Enable APIs → "People API" e habilite.')
        } else if (res.error === 'scope_missing') {
          setSyncError('Permissão de Contatos não autorizada. Clique em "Reconectar / atualizar permissões" em Configurações.')
        } else if (res.error === 'token_revoked' || res.error === 'not_connected') {
          setSyncError('Google desconectado ou token revogado. Reconecte em Configurações.')
        } else {
          setSyncError('Erro ao sincronizar contatos.')
        }
      }
    } finally {
      setIsSyncing(false)
    }
  }

  // Descobrir quantos não estão sincronizados (dos que aparecem em tela, mas como a busca tem limit 100, é só uma métrica local)
  const unsyncedCount = patients.filter(p => !p.google_contact_id).length

  return (
    <div
      className="flex flex-col gap-6"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {(pullDistance > 0 || isRefreshing) && (
        <div className="-mb-2 flex justify-center">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm"
            style={{ transform: `translateY(${Math.min(pullDistance, 36)}px)` }}
          >
            <Loader2 className={`size-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando pacientes...' : 'Puxe para atualizar'}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input 
            placeholder="Buscar por nome ou WhatsApp..." 
            className="pl-11 h-12 rounded-full border-slate-200 bg-white"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button className="rounded-full shadow-md w-full sm:w-auto" size="lg" onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 size-5" />
          Novo Paciente
        </Button>
      </div>

      {!isLoading && (
        <p className="text-xs sm:text-sm text-slate-500">
          Mostrando {patients.length} de {total} paciente(s)
          {debouncedQuery ? ` para "${debouncedQuery}"` : ''}
        </p>
      )}

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
              <PatientCard
                key={p.id}
                patient={p}
                isProviderConnected={isProviderConnected}
                searchQuery={debouncedQuery}
                onOpen={handleOpenPatient}
              />
            ))}

            {hasMore && (
              <div ref={loadMoreRef} className="pt-2">
                <div className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 text-center text-sm text-slate-500">
                  {isLoadingMore ? (
                    <div className="space-y-2 px-2">
                      <div className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                      <div className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                    </div>
                  ) : (
                    'Role para carregar mais pacientes'
                  )}
                </div>
              </div>
            )}
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
