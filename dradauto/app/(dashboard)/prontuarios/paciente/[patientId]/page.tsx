import { getMedicalRecordWithAnamnesisForPatient } from '@/app/actions/medical-records'
import { MedicalRecordEditor } from '@/components/prontuario/medical-record-editor'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Prontuário do Paciente | dradauto',
}

export default async function ProntuarioPacientePage({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const { patientId } = await params

  let data
  try {
    data = await getMedicalRecordWithAnamnesisForPatient(patientId)
  } catch {
    redirect('/prontuarios')
  }

  return <MedicalRecordEditor data={data} />
}
