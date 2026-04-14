import { redirect } from 'next/navigation'
import { getCurrentClinic } from '@/lib/clinic'
import { getPatient } from '@/app/actions/patients'
import { listPatientMedicalRecords, listPatientAnamneses } from '@/app/actions/medical-records'
import { PatientDetailHeader } from '@/components/patients/patient-detail-header'
import { AppointmentHistory } from '@/components/patients/appointment-history'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileHeart, FileText, Plus, Calendar, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Perfil do Paciente | dradauto',
}

export default async function PatientDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const clinic = await getCurrentClinic()
  if (!clinic) redirect('/sign-in')

  let patient
  try {
    patient = await getPatient(params.id)
  } catch (e) {
    redirect('/pacientes')
  }

  const [prontuarios, anamneses] = await Promise.all([
    listPatientMedicalRecords(params.id).catch(() => []),
    listPatientAnamneses(params.id).catch(() => []),
  ])

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
      <PatientDetailHeader 
        patient={patient} 
        isProviderConnected={!!clinic.google_access_token} 
      />

      {patient.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-amber-800 uppercase tracking-widest mb-2">Notas Administrativas</h3>
          <p className="text-amber-900 whitespace-pre-wrap text-sm leading-relaxed">{patient.notes}</p>
        </div>
      )}

      <Tabs defaultValue="consultas" className="w-full">
        <TabsList className="w-full max-w-md grid grid-cols-3 bg-slate-100/50 p-1 rounded-2xl mb-6">
          <TabsTrigger value="consultas" className="rounded-xl font-bold data-[state=active]:shadow-sm">
            Consultas
          </TabsTrigger>
          <TabsTrigger value="prontuarios" className="rounded-xl font-bold data-[state=active]:shadow-sm">
            Prontuários
          </TabsTrigger>
          <TabsTrigger value="anamneses" className="rounded-xl font-bold data-[state=active]:shadow-sm">
            Anamneses
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="consultas">
          <AppointmentHistory appointments={patient.appointments || []} />
        </TabsContent>
        
        <TabsContent value="prontuarios">
          <div className="flex flex-col gap-4">
            {/* Botão Criar Prontuário Geral */}
            <Link
              href={`/prontuarios/paciente/${params.id}`}
              className="flex items-center justify-between gap-4 p-5 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Plus className="size-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Prontuário Geral</p>
                  <p className="text-xs text-slate-500">Criar/abrir prontuário sem consulta associada</p>
                </div>
              </div>
              <ChevronRight className="size-5 text-primary opacity-60 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Prontuários vinculados a consultas */}
            {prontuarios.filter((p: any) => p.appointment_id).map((p: any) => {
              const appt = p.appointments
              const href = appt ? `/prontuarios/${appt.id}` : `/prontuarios/paciente/${params.id}`
              const date = appt?.scheduled_at ? new Date(appt.scheduled_at) : new Date(p.created_at)
              return (
                <Link key={p.id} href={href} className="flex items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm group">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <FileText className="size-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">
                        {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                      {p.queixas && <p className="text-xs text-slate-500 truncate max-w-[260px]">{p.queixas}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {appt && (
                      <Badge variant="secondary" className="text-xs font-bold bg-slate-100 text-slate-600">
                        {appt.tipo}
                      </Badge>
                    )}
                    <ChevronRight className="size-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              )
            })}

            {prontuarios.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">Nenhum prontuário de consulta ainda. Crie um prontuário geral acima.</p>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="anamneses">
          <div className="flex flex-col gap-4">
            {anamneses.length === 0 ? (
              <Card className="rounded-3xl border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none">
                <CardContent className="py-16 flex flex-col items-center justify-center text-slate-400 gap-4">
                  <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <FileHeart className="size-7 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-slate-500">Nenhuma anamnese</h3>
                    <p className="text-sm text-slate-400 mt-1">As fichas preenchidas pelo médico ou pelo paciente aparecerão aqui.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              anamneses.map((a: any) => {
                const date = new Date(a.created_at)
                return (
                  <div key={a.id} className="flex items-center gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <FileHeart className="size-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-700 text-sm">
                        {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                      {a.queixa_principal && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{a.queixa_principal}</p>
                      )}
                    </div>
                    {a.appointments?.scheduled_at && (
                      <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                        <Calendar className="size-3" />
                        {new Date(a.appointments.scheduled_at).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
