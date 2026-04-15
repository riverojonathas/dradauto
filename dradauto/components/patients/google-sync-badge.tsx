'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, CloudOff, Loader2, RefreshCw } from 'lucide-react'
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

  const handleManualSync = async () => {
    if (!isProviderConnected) return
    setIsSyncing(true)
    setSyncError(null)
    try {
      const result = await syncPatientToGoogle(patientId)
      if (result.success) {
        setIsSynced(true)
        return
      }

      if (result.error === 'scope_missing') {
        setSyncError('Permissão de Contatos ausente. Reconecte o Google em Configurações.')
      } else if (result.error === 'api_disabled') {
        setSyncError('People API desabilitada no Google Cloud.')
      } else if (result.error === 'token_revoked' || result.error === 'not_connected') {
        setSyncError('Google desconectado. Reconecte em Configurações.')
      } else {
        setSyncError('Falha ao sincronizar contato.')
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
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-muted-foreground border-slate-200 bg-slate-50 gap-1 pr-1 pointer-events-auto shadow-none">
        <CloudOff className="size-3" />
        Não sincronizado
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
          title={`Sincronizar ${patientName}`}
          aria-label={`Sincronizar ${patientName}`}
        >
          {isSyncing ? <Loader2 className="size-3 animate-spin text-muted-foreground" /> : <RefreshCw className="size-3 text-muted-foreground" />}
        </Button>
      </Badge>

      {syncError && (
        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700">
          <AlertCircle className="size-3" />
          {syncError}
        </span>
      )}
    </div>
  )
}
