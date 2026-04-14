import { getMedicalRecordWithAnamnesis, getOrCreateMedicalRecord } from '@/app/actions/medical-records'
import { MedicalRecordEditor } from '@/components/prontuario/medical-record-editor'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Prontuário | dradauto',
}

export default async function ProntuarioPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>
}) {
  const { appointmentId } = await params

  // Garante que o prontuário existe (cria se necessário)
  await getOrCreateMedicalRecord(appointmentId)

  const data = await getMedicalRecordWithAnamnesis(appointmentId)

  if (!data.appointment) redirect('/prontuarios')

  return <MedicalRecordEditor data={data} />
}
