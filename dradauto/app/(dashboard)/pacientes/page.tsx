import { redirect } from 'next/navigation'
import { getCurrentClinic } from '@/lib/clinic'
import { PatientsList } from '@/components/patients/patients-list'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Users, UserPlus } from 'lucide-react'

export const metadata = {
  title: 'Pacientes | dradauto',
}

export default async function PacientesPage(props: { searchParams?: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams
  const initialFilter = typeof searchParams?.q === 'string' ? searchParams.q : ''

  const clinic = await getCurrentClinic()
  if (!clinic) redirect('/sign-in')

  const supabase = createServerClient() as any

  // Buscar stats para o cabeçalho
  // Em um cenário real, você faria count() no banco. 
  // Exemplo para demonstração (ou faríamos as queries de stats):
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const [{ count: totalPacientes }, { count: novosMes }, { count: sincronizadosGoogle }] = await Promise.all([
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
      .not('google_contact_id', 'is', null),
  ])

  const realTotal = totalPacientes || 0
  const realNovosMes = novosMes || 0
  const realSincronizadosGoogle = sincronizadosGoogle || 0
  
  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pacientes</h1>
        <p className="text-slate-500">Gerencie o cadastro e histórico das pessoas que você atende.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white">
          <CardContent className="p-4 sm:p-5 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Users className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{realTotal}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Total de pacientes</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white">
          <CardContent className="p-4 sm:p-5 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <UserPlus className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{realNovosMes}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Novos este mês</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white">
          <CardContent className="p-4 sm:p-5 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{realSincronizadosGoogle}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Sincronizados Google</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <PatientsList isProviderConnected={!!clinic.google_connected} initialFilter={initialFilter} />
    </div>
  )
}
