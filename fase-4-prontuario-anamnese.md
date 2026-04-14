# Fase 4 — Prontuário + Anamnese + Magic Link

> **Produto:** dradauto  
> **Data:** 2026-04-12  
> **Skills:** `react-nextjs-development` · `shadcn` · `postgresql` · `gdpr-data-handling`  
> **Depende de:** Fase 3 concluída (pacientes com ID, histórico de consultas)

---

## Objetivo

Fechar o ciclo clínico completo. A anamnese tem **dois modos de preenchimento** — o médico escolhe qual usar para cada consulta:

- **Modo paciente:** médico envia magic link → paciente preenche pelo celular antes da consulta (sem conta)
- **Modo médico:** médico preenche diretamente no prontuário durante ou após a consulta

Durante/após a consulta, o médico registra queixas, hipótese diagnóstica, CID-10 e prescrição. Tudo vinculado ao mesmo agendamento.

---

## ⚠️ Fix Urgente — Emojis no `appointment-detail-dialog.tsx`

Antes de tudo, corrigir emojis que sobraram da Fase 2 no arquivo `components/agenda/appointment-detail-dialog.tsx`, linha 78:

```tsx
// Antes (emojis — violar regra do design system)
appointment.tipo === 'teleconsulta' ? '🎥 Teleconsulta' 
  : appointment.tipo === 'retorno' ? '🔄 Retorno' 
  : '🩺 Consulta'

// Depois (ícones Lucide)
import { Stethoscope, RefreshCw, Video } from 'lucide-react'

const tipoConfig = {
  teleconsulta: { icon: Video,       label: 'Teleconsulta' },
  retorno:      { icon: RefreshCw,   label: 'Retorno'      },
  consulta:     { icon: Stethoscope, label: 'Consulta'     },
}
const tipo = tipoConfig[appointment.tipo as keyof typeof tipoConfig] ?? tipoConfig.consulta
// Usar: <tipo.icon className="size-4" /> {tipo.label}
```

---

## Dois Fluxos de Anamnese

### Fluxo A — Paciente preenche (assíncrono, antes da consulta)

```
1. MÉDICO cria consulta na agenda
        │
        ▼
2. MÉDICO abre detalhe da consulta → clica "Enviar ficha para paciente"
   Sistema gera token UUID + define expiração (7 dias após a consulta)
   Copia link para clipboard
   (Fase 6: envio automático pela secretária IA)
        │
        ▼
3. PACIENTE abre link no celular → preenche ficha → LGPD consent → envia
   (sem login, sem conta)
        │
        ▼
4. MÉDICO abre prontuário → painel esquerdo mostra anamnese do paciente (read-only)
   Médico preenche notas clínicas à direita
        │
        ▼
5. MÉDICO salva prontuário → consulta marcada como "concluída"
```

### Fluxo B — Médico preenche (durante a consulta)

```
1. MÉDICO cria consulta na agenda
        │
        ▼
2. MÉDICO abre prontuário → painel esquerdo está vazio (sem anamnese)
   Médico clica "Preencher anamnese agora"
   Painel esquerdo vira formulário editável
        │
        ▼
3. MÉDICO preenche anamnese enquanto conversa com o paciente
   (queixa principal, alergias, medicamentos, antecedentes, hábitos)
   Salva anamnese → painel vira read-only (como se o paciente tivesse preenchido)
        │
        ▼
4. MÉDICO preenche notas clínicas à direita
   Salva prontuário → consulta "concluída"
```

### Regra de precedência

- Se o **paciente já preencheu** a anamnese (via magic link): painel esquerdo é sempre read-only. Médico não pode sobrescrever.
- Se **nenhuma anamnese existe**: médico vê dois botões — "Enviar para paciente" e "Preencher agora".
- Se **médico preencheu** e depois o paciente tenta usar o link: exibir "Ficha já registrada pelo médico".

---

## Migration SQL — executar no Supabase

Não há novas tabelas. As tabelas `medical_records` e `anamnesis` já existem. Apenas garantir que o token seja gerado ao criar consulta:

```sql
-- M003: Função para gerar token de anamnese (se não existir extensão uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Verificar se as tabelas têm os indexes necessários
CREATE INDEX IF NOT EXISTS medical_records_appointment_id_idx
  ON medical_records(appointment_id);

CREATE INDEX IF NOT EXISTS medical_records_patient_id_idx
  ON medical_records(patient_id);

CREATE INDEX IF NOT EXISTS anamnesis_appointment_id_idx
  ON anamnesis(appointment_id);

-- Index para lookup do token (rota pública /anamnese/[token])
CREATE INDEX IF NOT EXISTS appointments_anamnesis_token_idx
  ON appointments(anamnesis_token)
  WHERE anamnesis_token IS NOT NULL;
```

---

## Token gerado sob demanda (não automático)

O token **não é gerado ao criar a consulta**. Ele é gerado apenas quando o médico clica "Enviar ficha para paciente". Isso evita tokens inúteis para consultas cujo médico preferiu preencher a anamnese ele mesmo.

Adicionar Server Action em `app/actions/anamnesis.ts`:

```typescript
// Gerar token para envio ao paciente (chamado pelo médico)
export async function generateAnamnesisToken(appointmentId: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  // Verificar se já existe anamnese preenchida
  const { data: existing } = await supabase
    .from('anamnesis')
    .select('id')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  if (existing) return { success: false, error: 'already_filled' }

  // Verificar se já existe token válido
  const { data: appointment } = await supabase
    .from('appointments')
    .select('anamnesis_token, anamnesis_token_expires_at, anamnesis_token_used, scheduled_at')
    .eq('id', appointmentId)
    .eq('clinic_id', clinic.id)
    .single()

  if (!appointment) throw new Error('Consulta não encontrada')

  // Reutilizar token existente se ainda válido
  if (
    appointment.anamnesis_token &&
    !appointment.anamnesis_token_used &&
    new Date(appointment.anamnesis_token_expires_at) > new Date()
  ) {
    return { success: true, token: appointment.anamnesis_token }
  }

  // Gerar novo token
  const { randomUUID } = await import('crypto')
  const token = randomUUID()
  const appointmentDate = new Date(appointment.scheduled_at)
  const expiry = new Date(appointmentDate)
  expiry.setDate(expiry.getDate() + 7)

  await supabase
    .from('appointments')
    .update({
      anamnesis_token: token,
      anamnesis_token_expires_at: expiry.toISOString(),
      anamnesis_token_used: false,
    })
    .eq('id', appointmentId)

  return { success: true, token }
}
```

---

## `app/actions/medical-records.ts`

```typescript
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { getCurrentClinic } from '@/lib/clinic'
import { revalidatePath } from 'next/cache'

// Buscar prontuário de um agendamento (cria se não existir)
export async function getOrCreateMedicalRecord(appointmentId: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  // Buscar agendamento para garantir que pertence à clínica
  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, patient_id, patient_name, clinic_id')
    .eq('id', appointmentId)
    .eq('clinic_id', clinic.id)
    .single()

  if (!appointment) throw new Error('Consulta não encontrada')

  // Buscar prontuário existente
  const { data: existing } = await supabase
    .from('medical_records')
    .select('*')
    .eq('appointment_id', appointmentId)
    .single()

  if (existing) return { record: existing, isNew: false }

  // Criar prontuário vazio
  const { data: created, error } = await supabase
    .from('medical_records')
    .insert({
      clinic_id: clinic.id,
      patient_id: appointment.patient_id,
      appointment_id: appointmentId,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return { record: created, isNew: true }
}

// Salvar prontuário (upsert por appointment_id)
export async function saveMedicalRecord(appointmentId: string, data: {
  queixas?: string
  hipotese_diagnostica?: string
  cid_10?: string
  prescricao?: string
  observacoes?: string
}) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  const { data: record, error } = await supabase
    .from('medical_records')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('appointment_id', appointmentId)
    .eq('clinic_id', clinic.id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Marcar consulta como concluída ao salvar prontuário
  await supabase
    .from('appointments')
    .update({ status: 'completed' })
    .eq('id', appointmentId)
    .eq('status', 'confirmed') // só promove se estava confirmada

  revalidatePath(`/prontuarios/${appointmentId}`)
  revalidatePath('/prontuarios')
  revalidatePath('/pacientes')
  return record
}

// Listar todos os prontuários da clínica
export async function listMedicalRecords(params?: {
  search?: string
  page?: number
}) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any
  const page = params?.page ?? 1
  const limit = 20
  const from = (page - 1) * limit

  let query = supabase
    .from('medical_records')
    .select(`
      id, created_at, updated_at, queixas, cid_10,
      patients(id, nome, whatsapp),
      appointments(id, scheduled_at, tipo, status)
    `, { count: 'exact' })
    .eq('clinic_id', clinic.id)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (params?.search) {
    // Busca por nome do paciente — join manual
    const { data: patientIds } = await supabase
      .from('patients')
      .select('id')
      .eq('clinic_id', clinic.id)
      .ilike('nome', `%${params.search}%`)

    if (patientIds?.length) {
      query = query.in('patient_id', patientIds.map((p: any) => p.id))
    }
  }

  const { data, count, error } = await query
  if (error) throw new Error(error.message)
  return { records: data || [], total: count || 0 }
}

// Buscar prontuário com anamnese incluída (para tela de edição)
export async function getMedicalRecordWithAnamnesis(appointmentId: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  const [recordRes, appointmentRes] = await Promise.all([
    supabase
      .from('medical_records')
      .select('*')
      .eq('appointment_id', appointmentId)
      .eq('clinic_id', clinic.id)
      .maybeSingle(),
    supabase
      .from('appointments')
      .select(`
        id, scheduled_at, tipo, status, patient_name, patient_whatsapp,
        duration_minutes, google_meet_link, anamnesis_token, anamnesis_token_used,
        anamnesis_token_expires_at, valor,
        patients(id, nome, whatsapp, data_nascimento)
      `)
      .eq('id', appointmentId)
      .eq('clinic_id', clinic.id)
      .single(),
  ])

  if (appointmentRes.error) throw new Error('Consulta não encontrada')

  const appointment = appointmentRes.data

  // Buscar anamnese pelo appointment_id
  const { data: anamnesis } = await supabase
    .from('anamnesis')
    .select('*')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  return {
    record: recordRes.data,
    appointment,
    anamnesis,
    clinic,
  }
}
```

---

## `app/actions/anamnesis.ts` — rota pública

```typescript
'use server'

import { createServerClient } from '@/lib/supabase/server'

// Validar token (rota pública — sem auth)
export async function validateAnamnesisToken(token: string) {
  const supabase = createServerClient() as any

  const { data: appointment } = await supabase
    .from('appointments')
    .select(`
      id, patient_name, scheduled_at, anamnesis_token_used,
      anamnesis_token_expires_at, clinic_id,
      clinics(nome, especialidade, nome_secretaria)
    `)
    .eq('anamnesis_token', token)
    .single()

  if (!appointment) return { valid: false, reason: 'not_found' }
  if (appointment.anamnesis_token_used) return { valid: false, reason: 'already_used' }

  const expires = new Date(appointment.anamnesis_token_expires_at)
  if (expires < new Date()) return { valid: false, reason: 'expired' }

  return { valid: true, appointment }
}

// Submeter anamnese preenchida pelo paciente (sem auth)
export async function submitAnamnesis(token: string, data: {
  queixa_principal: string
  historico_familiar?: string
  alergias?: string
  medicamentos_em_uso?: string
  antecedentes?: string
  habitos?: string
  lgpd_consent: boolean
}) {
  if (!data.lgpd_consent) {
    return { success: false, error: 'lgpd_required' }
  }

  const supabase = createServerClient() as any

  // Buscar e validar token
  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, patient_id, clinic_id, anamnesis_token_used, anamnesis_token_expires_at')
    .eq('anamnesis_token', token)
    .single()

  if (!appointment) return { success: false, error: 'invalid_token' }
  if (appointment.anamnesis_token_used) return { success: false, error: 'already_used' }
  if (new Date(appointment.anamnesis_token_expires_at) < new Date()) {
    return { success: false, error: 'expired' }
  }

  // Inserir anamnese
  const { error: insertError } = await supabase
    .from('anamnesis')
    .insert({
      clinic_id: appointment.clinic_id,
      patient_id: appointment.patient_id,
      appointment_id: appointment.id,
      ...data,
      lgpd_consent_at: new Date().toISOString(),
      lgpd_terms_version: 'v1.0',
    })

  if (insertError) return { success: false, error: 'save_failed' }

  // Marcar token como usado
  await supabase
    .from('appointments')
    .update({ anamnesis_token_used: true })
    .eq('id', appointment.id)

  return { success: true }
}
```

---

## UI — Tela Pública de Anamnese (`/anamnese/[token]`)

Página **sem sidebar, sem header de navegação**. Layout mobile-first — o paciente acessa pelo celular.

```
┌───────────────────────────────────────┐
│  🩺 dradauto                          │
│  Dr. Sofia · Clínica Geral            │
│                                       │
│  Ficha de Saúde                       │
│  Olá! Preencha antes da sua consulta  │
│  em 15/04 às 09:00.                   │
│                                       │
│  Qual é seu principal problema hoje?* │
│  ┌───────────────────────────────┐    │
│  │                               │    │
│  └───────────────────────────────┘    │
│                                       │
│  Histórico familiar                   │
│  ┌───────────────────────────────┐    │
│  └───────────────────────────────┘    │
│                                       │
│  Alergias conhecidas                  │
│  ┌───────────────────────────────┐    │
│  └───────────────────────────────┘    │
│                                       │
│  Medicamentos em uso                  │
│  ┌───────────────────────────────┐    │
│  └───────────────────────────────┘    │
│                                       │
│  Antecedentes médicos                 │
│  ┌───────────────────────────────┐    │
│  └───────────────────────────────┘    │
│                                       │
│  Hábitos (fumo, álcool, exercício)    │
│  ┌───────────────────────────────┐    │
│  └───────────────────────────────┘    │
│                                       │
│  ┌─────────────────────────────────┐  │
│  │ ☐ Autorizo o uso dos meus dados │  │
│  │   para fins de atendimento      │  │
│  │   médico (LGPD — obrigatório)   │  │
│  └─────────────────────────────────┘  │
│                                       │
│  [       Enviar Ficha de Saúde      ] │
└───────────────────────────────────────┘
```

**Estados da página:**
- **Token válido:** exibir formulário
- **Token já usado:** `"Você já enviou sua ficha. Até a consulta!"` (com ícone de check)
- **Token expirado:** `"Este link expirou. Solicite um novo ao consultório."`
- **Token não encontrado:** `"Link inválido."`
- **Após envio:** tela de confirmação `"Ficha enviada! O médico poderá vê-la antes da sua consulta."`

```tsx
// app/(public)/anamnese/[token]/page.tsx
// Server Component que valida o token e passa dados para o Client Component

import { validateAnamnesisToken } from '@/app/actions/anamnesis'
import { AnamnesisForm } from '@/components/anamnese/anamnesis-form'
import { Stethoscope, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export default async function AnamnesePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const result = await validateAnamnesisToken(token)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-6 py-10">
        {/* Header público */}
        <div className="flex items-center gap-3 mb-8">
          <div className="size-10 rounded-2xl bg-primary flex items-center justify-center">
            <Stethoscope className="size-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground text-lg">dradauto</p>
            {result.valid && (
              <p className="text-sm text-muted-foreground">
                {result.appointment.clinics?.nome}
              </p>
            )}
          </div>
        </div>

        {/* Formulário ou estado de erro */}
        {result.valid ? (
          <AnamnesisForm token={token} appointment={result.appointment} />
        ) : result.reason === 'already_used' ? (
          <TokenState
            icon={CheckCircle2}
            iconClass="text-primary"
            title="Ficha já enviada"
            message="Você já preencheu sua ficha de saúde. Até a consulta!"
          />
        ) : result.reason === 'expired' ? (
          <TokenState
            icon={Clock}
            iconClass="text-warning"
            title="Link expirado"
            message="Este link de anamnese expirou. Peça ao consultório para enviar um novo."
          />
        ) : (
          <TokenState
            icon={AlertCircle}
            iconClass="text-destructive"
            title="Link inválido"
            message="Este link não é válido. Verifique o endereço e tente novamente."
          />
        )}
      </div>
    </div>
  )
}

function TokenState({ icon: Icon, iconClass, title, message }: {
  icon: any; iconClass: string; title: string; message: string
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <Icon className={`size-14 ${iconClass}`} />
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}
```

---

## `components/anamnese/anamnesis-form.tsx` — Formulário público

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { submitAnamnesis } from '@/app/actions/anamnesis'

// Instalar Checkbox se não estiver instalado:
// npx shadcn@latest add checkbox

interface AnamnesisFormProps {
  token: string
  appointment: {
    patient_name: string
    scheduled_at: string
    clinics?: { nome: string; especialidade: string }
  }
}

export function AnamnesisForm({ token, appointment }: AnamnesisFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [lgpdConsent, setLgpdConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fields, setFields] = useState({
    queixa_principal: '',
    historico_familiar: '',
    alergias: '',
    medicamentos_em_uso: '',
    antecedentes: '',
    habitos: '',
  })

  const handleSubmit = async () => {
    if (!lgpdConsent) {
      setError('Você precisa aceitar os termos de privacidade para continuar.')
      return
    }
    if (!fields.queixa_principal.trim()) {
      setError('Por favor, descreva o motivo principal da sua consulta.')
      return
    }

    setIsLoading(true)
    setError(null)

    const result = await submitAnamnesis(token, { ...fields, lgpd_consent: true })

    if (result.success) {
      setSubmitted(true)
    } else {
      setError(
        result.error === 'already_used'
          ? 'Esta ficha já foi enviada anteriormente.'
          : 'Erro ao enviar. Por favor, tente novamente.'
      )
    }
    setIsLoading(false)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <CheckCircle2 className="size-16 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Ficha enviada!</h1>
        <p className="text-muted-foreground">
          O médico poderá ver suas informações antes da consulta.
          Até dia {new Date(appointment.scheduled_at).toLocaleDateString('pt-BR')}!
        </p>
      </div>
    )
  }

  const consultaDate = new Date(appointment.scheduled_at)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ficha de Saúde</h1>
        <p className="text-muted-foreground mt-1">
          Sua consulta está marcada para{' '}
          <strong>
            {consultaDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} às{' '}
            {consultaDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </strong>
          . Preencha para ajudar o médico a se preparar.
        </p>
      </div>

      {/* Campo obrigatório */}
      <div className="flex flex-col gap-2">
        <Label className="font-semibold">
          Qual é o principal motivo da sua consulta? <span className="text-destructive">*</span>
        </Label>
        <Textarea
          placeholder="Descreva o que está sentindo, há quanto tempo, como começou..."
          rows={4}
          value={fields.queixa_principal}
          onChange={(e) => setFields(f => ({ ...f, queixa_principal: e.target.value }))}
          className="resize-none"
        />
      </div>

      {/* Campos opcionais */}
      {[
        { key: 'historico_familiar', label: 'Histórico familiar', placeholder: 'Ex: diabetes, hipertensão na família...' },
        { key: 'alergias', label: 'Alergias conhecidas', placeholder: 'Ex: dipirona, penicilina, frutos do mar...' },
        { key: 'medicamentos_em_uso', label: 'Medicamentos que usa atualmente', placeholder: 'Nome, dose e frequência de cada um...' },
        { key: 'antecedentes', label: 'Histórico médico pessoal', placeholder: 'Cirurgias, internações, doenças crônicas...' },
        { key: 'habitos', label: 'Hábitos de vida', placeholder: 'Fumo, álcool, atividade física, alimentação...' },
      ].map(({ key, label, placeholder }) => (
        <div key={key} className="flex flex-col gap-2">
          <Label className="font-medium text-foreground">{label}</Label>
          <Textarea
            placeholder={placeholder}
            rows={2}
            value={fields[key as keyof typeof fields]}
            onChange={(e) => setFields(f => ({ ...f, [key]: e.target.value }))}
            className="resize-none"
          />
        </div>
      ))}

      {/* LGPD */}
      <div className="rounded-2xl border border-border bg-muted/30 p-5">
        <div className="flex items-start gap-3">
          <Checkbox
            id="lgpd"
            checked={lgpdConsent}
            onCheckedChange={(v) => setLgpdConsent(v === true)}
            className="mt-0.5"
          />
          <Label htmlFor="lgpd" className="text-sm text-foreground cursor-pointer leading-relaxed">
            Autorizo que estas informações sejam utilizadas exclusivamente para fins de atendimento médico
            pelo consultório <strong>{appointment.clinics?.nome}</strong>, em conformidade com a LGPD
            (Lei Geral de Proteção de Dados — Lei 13.709/2018).
          </Label>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isLoading || !lgpdConsent}
        size="lg"
        className="w-full h-14 text-base font-semibold rounded-2xl"
      >
        {isLoading ? <Loader2 className="size-5 animate-spin" /> : 'Enviar Ficha de Saúde'}
      </Button>

      <p className="text-center text-xs text-muted-foreground pb-6">
        Seus dados são protegidos e usados apenas pelo seu médico.
      </p>
    </div>
  )
}
```

---

## UI — Tela do Prontuário (`/prontuarios/[appointmentId]`)

Layout desktop em duas colunas: **esquerda = anamnese**, **direita = notas clínicas**.  
O painel esquerdo muda de estado conforme o contexto.

### Estado 1 — Sem anamnese (nenhuma preenchida ainda)

```
├─────────────────────────────┬────────────────────────────────────────┤
│  ANAMNESE                   │  NOTAS CLÍNICAS                        │
│                             │                                        │
│  Nenhuma ficha ainda.       │  Queixas                               │
│                             │  ┌──────────────────────────────────┐  │
│  [Enviar para paciente]     │  └──────────────────────────────────┘  │
│  Gera link para o WhatsApp  │                                        │
│                             │  ...demais campos...                   │
│  [Preencher agora]          │                                        │
│  Médico preenche durante    │                                        │
│  a consulta                 │                                        │
└─────────────────────────────┴────────────────────────────────────────┘
```

### Estado 2 — Médico clicou "Enviar para paciente" (aguardando)

```
├─────────────────────────────┬────────────────────────────────────────┤
│  ANAMNESE                   │  NOTAS CLÍNICAS                        │
│  [Badge: Aguardando]        │                                        │
│                             │  ...                                   │
│  Link copiado para enviar   │                                        │
│  pelo WhatsApp.             │                                        │
│                             │                                        │
│  [Copiar link novamente]    │                                        │
│  [Preencher mesmo assim →]  │                                        │
└─────────────────────────────┴────────────────────────────────────────┘
```

### Estado 3 — Médico clicou "Preencher agora" (formulário inline)

```
├─────────────────────────────┬────────────────────────────────────────┤
│  ANAMNESE                   │  NOTAS CLÍNICAS                        │
│  [editável pelo médico]     │                                        │
│                             │  ...                                   │
│  Queixa principal *         │                                        │
│  ┌─────────────────────┐    │                                        │
│  └─────────────────────┘    │                                        │
│                             │                                        │
│  Alergias                   │                                        │
│  ┌─────────────────────┐    │                                        │
│  └─────────────────────┘    │                                        │
│  ...demais campos...        │                                        │
│                             │                                        │
│  [Salvar anamnese]          │                                        │
└─────────────────────────────┴────────────────────────────────────────┘
```

### Estado 4 — Anamnese preenchida (qualquer origem)

```
├─────────────────────────────┬────────────────────────────────────────┤
│  ANAMNESE                   │  NOTAS CLÍNICAS                        │
│  [Badge: ✓ Recebida]        │                                        │
│  preenchida em 14/04 20h    │  Queixas                               │
│                             │  ┌──────────────────────────────────┐  │
│  Queixa principal:          │  └──────────────────────────────────┘  │
│  "Dor de cabeça há 3 dias"  │                                        │
│                             │  Hipótese diagnóstica                  │
│  Alergias: Dipirona         │  ┌──────────────────────────────────┐  │
│                             │  └──────────────────────────────────┘  │
│  Medicamentos:              │                                        │
│  Losartana 50mg/dia         │  CID-10                                │
│                             │  ┌──────────────────────────────────┐  │
│  Antecedentes: HAS, DM2     │  └──────────────────────────────────┘  │
│                             │                                        │
│  Hábitos: sedentário        │  Prescrição                            │
│                             │  ┌──────────────────────────────────┐  │
│  [read-only — não editável] │  └──────────────────────────────────┘  │
└─────────────────────────────┴────────────────────────────────────────┘
```

**Mobile:** colunas viram Accordion vertical — "Anamnese" colapsada por padrão, "Notas Clínicas" aberta.

---

## `app/(dashboard)/prontuarios/[appointmentId]/page.tsx`

```tsx
// Server Component
import { getMedicalRecordWithAnamnesis, getOrCreateMedicalRecord } from '@/app/actions/medical-records'
import { MedicalRecordEditor } from '@/components/prontuario/medical-record-editor'
import { redirect } from 'next/navigation'

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
```

---

## `app/(dashboard)/prontuarios/page.tsx` — Listagem

```
┌─────────────────────────────────────────────────────────┐
│  Prontuários                                            │
│                                                         │
│  [🔍 Buscar por paciente...]                            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Maria Santos              15/04 · Retorno        │   │
│  │ "Dor de cabeça há 3 dias" · CID: R51             │   │
│  │                          [Abrir Prontuário →]    │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ João Oliveira             10/04 · Consulta       │   │
│  │ Sem queixas registradas  · CID: —                │   │
│  │                          [Abrir Prontuário →]    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Adicionar botão "Abrir Prontuário" no AppointmentDetailDialog

Em `components/agenda/appointment-detail-dialog.tsx`, adicionar no footer:

```tsx
import Link from 'next/link'
import { FileText } from 'lucide-react'

// No DialogFooter, antes dos botões de ação:
<Button variant="outline" asChild className="w-full">
  <Link href={`/prontuarios/${appointment.id}`}>
    <FileText className="size-4" />
    Abrir Prontuário
  </Link>
</Button>
```

---

## Seção de Anamnese no AppointmentDetailDialog

Substituir lógica de link fixo por botão que gera token sob demanda:

```tsx
import { generateAnamnesisToken } from '@/app/actions/anamnesis'
import { Send, CheckCircle2, Copy } from 'lucide-react'

// Estado local no dialog
const [anamnesisToken, setAnamnesisToken] = useState(appointment.anamnesis_token)
const [tokenUsed, setTokenUsed] = useState(appointment.anamnesis_token_used)
const [isSendingLink, setIsSendingLink] = useState(false)

const handleSendAnamnesis = async () => {
  setIsSendingLink(true)
  const res = await generateAnamnesisToken(appointment.id)
  if (res.success) {
    setAnamnesisToken(res.token)
    const url = `${window.location.origin}/anamnese/${res.token}`
    navigator.clipboard.writeText(url)
    // toast: "Link copiado! Cole no WhatsApp do paciente."
  }
  setIsSendingLink(false)
}

// No JSX do dialog:

// Anamnese já preenchida (qualquer origem)
{tokenUsed ? (
  <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/20 p-4">
    <CheckCircle2 className="size-4 text-primary shrink-0" />
    <p className="text-sm font-medium text-primary">Ficha de saúde preenchida</p>
  </div>

// Token gerado, aguardando paciente
) : anamnesisToken ? (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4">
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">Ficha de saúde</p>
      <p className="text-xs text-muted-foreground">Aguardando paciente</p>
    </div>
    <Button size="sm" variant="outline" onClick={() => {
      navigator.clipboard.writeText(`${window.location.origin}/anamnese/${anamnesisToken}`)
      // toast: "Link copiado!"
    }}>
      <Copy className="size-4" />
      Copiar link
    </Button>
  </div>

// Sem anamnese — botão para gerar e enviar
) : (
  <Button
    variant="outline"
    className="w-full"
    onClick={handleSendAnamnesis}
    disabled={isSendingLink}
  >
    {isSendingLink
      ? <Loader2 className="size-4 animate-spin" />
      : <Send className="size-4" />
    }
    Enviar ficha para o paciente
  </Button>
)}
```

---

## Middleware — liberar rota pública `/anamnese`

Verificar `middleware.ts` para garantir que `/anamnese/(.*)` não exige auth do Clerk:

```typescript
// Em middleware.ts, o matcher do Clerk deve excluir rotas públicas:
export default clerkMiddleware((auth, req) => {
  // Rotas públicas — não proteger
  const publicRoutes = ['/sign-in', '/sign-up', '/anamnese', '/pagamento']
  const isPublic = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  if (!isPublic) {
    auth.protect()
  }
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
```

---

## Arquivos a Criar / Modificar

```
NOVOS:
app/actions/medical-records.ts                     ← CRUD prontuário
app/actions/anamnesis.ts                           ← submit + token validation
app/(public)/anamnese/[token]/page.tsx             ← página pública
components/anamnese/
  anamnesis-form.tsx                               ← formulário do paciente
app/(dashboard)/prontuarios/[appointmentId]/page.tsx ← editor do médico
components/prontuario/
  medical-record-editor.tsx                        ← editor 2 colunas
  anamnesis-panel.tsx                              ← painel esquerdo (read-only)
  clinical-notes-form.tsx                          ← painel direito (editável)
  record-header.tsx                                ← cabeçalho com badges + ações

MODIFICAR:
app/actions/appointments.ts                        ← gerar anamnesis_token ao criar
app/(dashboard)/prontuarios/page.tsx               ← listagem real
components/agenda/appointment-detail-dialog.tsx    ← botão prontuário + link anamnese + fix emojis
components/patients/appointment-history.tsx        ← link "Abrir prontuário" em cada consulta
middleware.ts                                      ← liberar /anamnese/* sem auth
```

---

## Action — Médico preenche anamnese durante a consulta

Adicionar em `app/actions/anamnesis.ts`:

```typescript
// Médico preenche a anamnese durante a consulta (sem token)
export async function submitAnamnesisAsDoctor(appointmentId: string, data: {
  queixa_principal: string
  historico_familiar?: string
  alergias?: string
  medicamentos_em_uso?: string
  antecedentes?: string
  habitos?: string
}) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  // Verificar se já existe anamnese
  const { data: existing } = await supabase
    .from('anamnesis')
    .select('id')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  if (existing) return { success: false, error: 'already_filled' }

  const { data: appointment } = await supabase
    .from('appointments')
    .select('patient_id, clinic_id')
    .eq('id', appointmentId)
    .eq('clinic_id', clinic.id)
    .single()

  if (!appointment) throw new Error('Consulta não encontrada')

  const { error } = await supabase
    .from('anamnesis')
    .insert({
      clinic_id: clinic.id,
      patient_id: appointment.patient_id,
      appointment_id: appointmentId,
      ...data,
      lgpd_consent: true,         // Médico assume responsabilidade
      lgpd_consent_at: new Date().toISOString(),
      lgpd_terms_version: 'v1.0-medico',
    })

  if (error) throw new Error(error.message)

  // Invalidar o token existente (se havia link enviado ao paciente)
  await supabase
    .from('appointments')
    .update({ anamnesis_token_used: true })
    .eq('id', appointmentId)
    .not('anamnesis_token', 'is', null)

  revalidatePath(`/prontuarios/${appointmentId}`)
  return { success: true }
}
```

---

## Regras de Negócio

1. **Token sob demanda:** o token só é gerado quando o médico clica "Enviar para paciente". Consultas sem envio não têm token.

2. **Token reutilizável:** se já existe token válido (não expirado, não usado), retorna o mesmo. Não gera duplicatas.

3. **Token invalidado pelo médico:** se o médico preenche a anamnese (`submitAnamnesisAsDoctor`), o token existente é marcado como `used`. Paciente que tentar abrir o link verá "ficha já registrada".

4. **Precedência da anamnese do paciente:** se o paciente já preencheu via link, o médico não pode sobrescrever. Painel esquerdo fica sempre read-only.

5. **Prontuário por consulta:** cada consulta tem no máximo 1 prontuário e 1 anamnese.

6. **Criação automática do prontuário:** ao abrir `/prontuarios/[id]`, o prontuário é criado vazio se não existir. O médico não precisa "criar" — só abre e preenche.

7. **Salvar = concluir:** ao salvar o prontuário (notas clínicas), a consulta muda de `confirmed` para `completed`. Idempotente se já estava `completed`.

8. **LGPD paciente:** `submitAnamnesis` (pelo paciente) rejeita sem `lgpd_consent = true`. Botão desabilitado até marcar checkbox.

9. **LGPD médico:** `submitAnamnesisAsDoctor` assume consentimento com versão `'v1.0-medico'` — o médico tem responsabilidade legal pelo preenchimento.

10. **Rota pública:** `/anamnese/[token]` não exige login. Middleware já está correto.

11. **Campos opcionais:** apenas `queixa_principal` é obrigatório. Nos dois modos (paciente e médico).

12. **Prescrição — texto livre no MVP.** Fase futura: template + assinatura digital.

---

## Tratamento de Erros

| Código | Causa | Ação |
|--------|-------|------|
| `invalid_token` | Token não existe | Página: "Link inválido" |
| `already_used` | Anamnese já enviada | Página: "Já enviado" com check |
| `expired` | Token vencido | Página: "Link expirado" |
| `lgpd_required` | Sem consentimento | Erro inline no checkbox |
| `record_not_found` | Prontuário de outra clínica | Redirect para `/prontuarios` |
| `supabase_error` | Banco indisponível | Toast de erro |

---

## Tarefas Atômicas

### Plano 7a — Base + Actions

- [ ] Executar migration M003 no Supabase (indexes — sem alteração de colunas)
- [ ] Verificar middleware: `/anamnese/*` passa sem auth (já está correto — confirmar)
- [ ] Criar `app/actions/anamnesis.ts`:
  - `validateAnamnesisToken` — valida token público
  - `submitAnamnesis` — paciente envia via link
  - `submitAnamnesisAsDoctor` — médico preenche durante consulta
  - `generateAnamnesisToken` — médico solicita envio ao paciente (gera token sob demanda)
- [ ] Criar `app/actions/medical-records.ts` (getOrCreateMedicalRecord, saveMedicalRecord, listMedicalRecords, getMedicalRecordWithAnamnesis)
- [ ] **Não alterar** `createAppointment` — token não é mais gerado automaticamente
- [ ] Commit: `feat: anamnesis + medical record actions`

### Plano 7b — Página Pública de Anamnese

- [ ] Instalar componente Shadcn: `npx shadcn@latest add checkbox`
- [ ] Criar `components/anamnese/anamnesis-form.tsx`
- [ ] Implementar `app/(public)/anamnese/[token]/page.tsx`
- [ ] Testar token válido → formulário aparece
- [ ] Testar submit → `anamnesis_token_used = true` no banco
- [ ] Testar token já usado → tela "já enviado"
- [ ] Testar token expirado → tela correta
- [ ] Testar mobile: layout correto em 375px
- [ ] Commit: `feat: public anamnesis form with lgpd consent`

### Plano 7c — Editor do Prontuário

- [ ] Criar `components/prontuario/anamnesis-panel.tsx`
- [ ] Criar `components/prontuario/clinical-notes-form.tsx`
- [ ] Criar `components/prontuario/record-header.tsx`
- [ ] Criar `components/prontuario/medical-record-editor.tsx` (layout 2 colunas)
- [ ] Criar `app/(dashboard)/prontuarios/[appointmentId]/page.tsx`
- [ ] Testar: abrir prontuário → anamnese visível à esquerda (se preenchida)
- [ ] Testar: salvar notas → atualizado no banco
- [ ] Commit: `feat: medical record editor`

### Plano 7d — Listagem + Integrações

- [ ] Implementar `app/(dashboard)/prontuarios/page.tsx` (listagem real com busca)
- [ ] Adicionar botão "Abrir Prontuário" no `appointment-detail-dialog.tsx`
- [ ] Fix emojis no `appointment-detail-dialog.tsx` (🎥🔄🩺 → ícones Lucide)
- [ ] Adicionar magic link + status no `appointment-detail-dialog.tsx`
- [ ] Adicionar link "Abrir Prontuário" em `appointment-history.tsx` no perfil do paciente
- [ ] Testar fluxo completo: criar consulta → copiar link → preencher anamnese → abrir prontuário → ver anamnese → salvar notas
- [ ] `npm run build` sem erros TypeScript
- [ ] Commit: `feat: prontuarios list + full clinical flow integration`

---

## Checklist de Verificação Final

- [ ] Criar consulta → token gerado automaticamente no banco
- [ ] AppointmentDetail → botão "Abrir Prontuário" + link de anamnese copiável
- [ ] `/anamnese/[token]` abre sem login em mobile e desktop
- [ ] Preencher anamnese → LGPD consent obrigatório → botão habilitado
- [ ] Submeter anamnese → página de confirmação → token marcado como usado
- [ ] Link usado novamente → "já enviado" (não erro 500)
- [ ] Médico abre prontuário → anamnese visível se preenchida, ausente se não
- [ ] Salvar prontuário → status da consulta muda para "concluída"
- [ ] Prontuário existente → salvar novamente não duplica (update)
- [ ] Listagem de prontuários com busca por paciente
- [ ] Perfil do paciente → aba Consultas → link "Abrir Prontuário" em cada consulta
- [ ] Sem emojis em nenhum lugar
- [ ] `npm run build` sem erros TypeScript
- [ ] Lighthouse: página pública de anamnese score > 90 (mobile-first)
