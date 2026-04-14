'use client'

import { RecordHeader } from './record-header'
import { AnamnesisPanel } from './anamnesis-panel'
import { ClinicalNotesForm } from './clinical-notes-form'

interface MedicalRecordEditorProps {
  data: {
    record: any
    appointment: any | null       // null = standalone
    patient?: any                 // presente no modo standalone
    anamnesis: any
    clinic: any
    mode?: 'appointment' | 'patient'
  }
}

export function MedicalRecordEditor({ data }: MedicalRecordEditorProps) {
  const { record, appointment, patient, anamnesis, mode = 'appointment' } = data

  // Em modo standalone, derivamos os dados do patient
  const patientId = mode === 'patient' ? patient?.id : appointment?.patients?.id
  const displayName = mode === 'patient'
    ? patient?.nome
    : (appointment?.patient_name ?? appointment?.patients?.nome)

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-6 max-w-[1400px] mx-auto w-full">
      <div className="flex-none">
        <RecordHeader
          appointment={appointment}
          patient={patient}
          anamnesis={anamnesis}
          mode={mode}
          displayName={displayName}
        />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Painel Esquerdo: Anamnese (4 colunas) */}
        <div className="lg:col-span-4 h-full flex flex-col">
          <AnamnesisPanel
            appointmentId={appointment?.id ?? null}
            patientId={patientId}
            anamnesis={anamnesis}
            appointment={appointment}
            mode={mode}
          />
        </div>

        {/* Painel Direito: Notas Clínicas (8 colunas) */}
        <div className="lg:col-span-8 h-full flex flex-col">
          <ClinicalNotesForm
            appointmentId={appointment?.id ?? null}
            recordId={record?.id}
            record={record}
            mode={mode}
          />
        </div>
      </div>
    </div>
  )
}

