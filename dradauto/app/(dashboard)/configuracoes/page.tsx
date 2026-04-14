import { redirect } from 'next/navigation'
import { getCurrentClinic } from '@/lib/clinic'
import { ClinicSettingsForm } from '@/components/settings/clinic-settings-form'
import { Settings } from 'lucide-react'

export const metadata = {
  title: 'Configurações | dradauto',
}

export default async function ConfiguracoesPage() {
  const clinic = await getCurrentClinic()
  if (!clinic) redirect('/sign-in')

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Settings className="size-8 text-primary" />
          Configurações
        </h1>
        <p className="text-slate-500">Personalize sua agenda e preferências de atendimento.</p>
      </div>

      <ClinicSettingsForm clinic={clinic} />
    </div>
  )
}
