import { redirect } from 'next/navigation'
import { getCurrentClinic } from '@/lib/clinic'
import { PatientsList } from '@/components/patients/patients-list'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Users, UserPlus, CloudOff } from 'lucide-react'

export const metadata = {
  title: 'Pacientes | dradauto',
}

export default async function PacientesPage() {
  const clinic = await getCurrentClinic()
  if (!clinic) redirect('/sign-in')

  const supabase = createServerClient() as any

  // Buscar stats para o cabeçalho
  // Em um cenário real, você faria count() no banco. 
  // Exemplo para demonstração (ou faríamos as queries de stats):
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const [{ count: totalPacientes }, { count: novosMes }, { count: naoSincronizados }] = await Promise.all([
    supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinic.id),
    supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinic.id)
      .gte('created_at', inicioMes.toISOString()),
      supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinic.id)
        .is('google_contact_id', null),
  ])

  const realTotal = totalPacientes || 0
  const realNovosMes = novosMes || 0
      const realNaoSincronizados = naoSincronizados || 0
  
  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pacientes</h1>
        <p className="text-slate-500">Gerencie o cadastro e histórico das pessoas que você atende.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Users className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-slate-900 leading-none">{realTotal}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Total de pacientes</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <UserPlus className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-slate-900 leading-none">{realNovosMes}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Novos este mês</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <CloudOff className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-slate-900 leading-none">{realNaoSincronizados}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Não sincronizados</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <PatientsList isProviderConnected={!!clinic.google_access_token} />
    </div>
  )
}
