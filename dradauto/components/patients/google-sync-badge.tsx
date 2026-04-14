'use client'

import { useCallback, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, CloudOff, Loader2, RefreshCw, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { syncPatientToGoogle } from '@/app/actions/patients'

interface GoogleSyncBadgeProps {
  patientId: string
  googleContactId: string | null
  isProviderConnected: boolean
  patientName: string
  patientWhatsapp: string
}

type SyncToast = {
  type: 'success' | 'error'
  message: string
}

export function GoogleSyncBadge({ 
  patientId, 
  googleContactId, 
  isProviderConnected,
  patientName,
  patientWhatsapp
}: GoogleSyncBadgeProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSynced, setIsSynced] = useState(!!googleContactId)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [needsReconnect, setNeedsReconnect] = useState(false)
  const [toast, setToast] = useState<SyncToast | null>(null)
  const toastTimerRef = useRef<number | null>(null)

  const showToast = useCallback((type: SyncToast['type'], message: string) => {
    setToast({ type, message })

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToast(null)
      toastTimerRef.current = null
    }, 4500)
  }, [])

  const handleManualSync = async () => {
    if (!isProviderConnected) return

    if (needsReconnect) {
      window.location.href = '/configuracoes'
      return
    }

    setIsSyncing(true)
    setSyncError(null)
    try {
      const res = await syncPatientToGoogle(patientId)
      if (res.success) {
        setIsSynced(true)
        setNeedsReconnect(false)
        setSyncError(null)
        showToast('success', `${patientName} sincronizado com Google Contacts.`)
      } else {
        if (res.error === 'scope_missing') {
          setSyncError('Permissão de Contatos ausente')
          setNeedsReconnect(true)
          showToast('error', 'Google Contacts sem permissão. Reautorize em Configurações > Integrações.')
        } else if (res.error === 'token_revoked' || res.error === 'not_connected') {
          setSyncError('Google desconectado')
          setNeedsReconnect(true)
          showToast('error', 'Google desconectado ou token revogado. Reconecte em Configurações.')
        } else if (res.error === 'google_api_error') {
          setSyncError('Falha da API Google')
          setNeedsReconnect(false)
          showToast('error', res.detail || 'A API do Google recusou a criação do contato.')
        } else {
          setSyncError('Falha ao sincronizar')
          setNeedsReconnect(false)
          showToast('error', 'Não foi possível sincronizar agora. Tente novamente em instantes.')
        }
      }
    } finally {
      setIsSyncing(false)
    }
  }

  if (!isProviderConnected) {
    return null // Hide badge if clinic hasn't connected google
  }

  if (isSynced) {
    return (
      <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none hover:bg-emerald-100 transition-colors shadow-none">
        <CheckCircle2 className="mr-1 size-3" />
        Sincronizado
      </Badge>
    )
  }

  return (
    <>
      {toast && (
        <div className={`fixed right-4 top-4 z-[70] max-w-sm rounded-xl border px-3 py-2 shadow-lg backdrop-blur-sm ${
          toast.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-red-200 bg-red-50 text-red-800'
        }`}>
          <div className="flex items-start gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
            )}
            <p className="text-xs font-medium leading-5">{toast.message}</p>
            <button
              type="button"
              className="ml-1 rounded p-0.5 hover:bg-black/5"
              onClick={() => setToast(null)}
              aria-label="Fechar aviso"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      <Badge
        variant="outline"
        className={`gap-1 pr-1 pointer-events-auto shadow-none ${
          syncError
            ? 'text-red-700 border-red-200 bg-red-50'
            : 'text-muted-foreground border-slate-200 bg-slate-50'
        }`}
      >
        <CloudOff className="size-3" />
        {syncError ? 'Falha no sync' : 'Não sincronizado'}
        <Button 
          variant="ghost" 
          size="icon" 
          className="size-5 rounded-full hover:bg-slate-200"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleManualSync()
          }}
          disabled={isSyncing}
          aria-label={needsReconnect
            ? `Abrir configurações para reconectar Google de ${patientName}`
            : `Sincronizar ${patientName} com Google Contacts`}
        >
          {isSyncing ? (
            <Loader2 className="size-3 animate-spin text-muted-foreground" />
          ) : (
            <RefreshCw className="size-3 text-muted-foreground" />
          )}
        </Button> 
      </Badge>
    </>
  )
}
