# Banco de Dados — dradauto

> **Banco:** PostgreSQL (Supabase)  
> **Estratégia de segurança:** Row Level Security (RLS) habilitado em todas as tabelas.  
> Acesso via `service_role` no servidor com filtro explícito por `clinic_id`.  
> Nunca expor `service_role` no cliente.

---

## Tabelas

### clinics
Registro central de cada médico/clínica. 1 médico = 1 clínica.

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|------------|-----------|
| id | uuid | ✅ PK | Gerado automaticamente |
| clerk_user_id | text | ✅ UNIQUE | ID do usuário no Clerk |
| nome | text | ✅ | Nome completo do médico |
| crm | text | ✅ | Número do CRM |
| crm_estado | text | ✅ | UF do CRM (ex: SP) |
| especialidade | text | ✅ | Ex: Clínico Geral, Cardiologia |
| whatsapp | text | ✅ | Número WhatsApp da clínica |
| valor_consulta | numeric | — | Valor padrão (default 0) |
| duracao_consulta | int | — | Duração padrão em minutos (default 30) |
| nome_secretaria | text | — | Nome da secretária IA |
| google_connected | boolean | — | Se Google Agenda está conectado |
| google_access_token | text | — | Token de acesso OAuth (criptografado) |
| google_refresh_token | text | — | Refresh token OAuth (permanente) |
| google_token_expires_at | timestamptz | — | Expiração do access token |
| google_calendar_id | text | — | ID do calendário Google vinculado |
| working_hours_start | int | — | Hora início de atendimento (ex: 8) |
| working_hours_end | int | — | Hora fim de atendimento (ex: 18) |
| working_days | int[] | — | Dias da semana [1=Seg...5=Sex] |
| created_at | timestamptz | ✅ | Auto |
| updated_at | timestamptz | ✅ | Auto |

### patients
Pacientes cadastrados. Ligados a uma clínica.

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|------------|-----------|
| id | uuid | ✅ PK | — |
| clinic_id | uuid | ✅ FK→clinics | — |
| nome | text | ✅ | — |
| whatsapp | text | ✅ | Identificador principal do paciente |
| email | text | — | — |
| data_nascimento | date | — | — |
| cpf | text | — | Armazenar apenas se necessário (LGPD) |
| google_contact_id | text | — | ID do contato no Google Contacts (resourceName) |
| notes | text | — | Notas internas do médico sobre o paciente |
| created_at | timestamptz | ✅ | — |
| updated_at | timestamptz | ✅ | — |

### appointments
Consultas agendadas.

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|------------|-----------|
| id | uuid | ✅ PK | — |
| clinic_id | uuid | ✅ FK→clinics | — |
| patient_id | uuid | — | FK→patients (nullable — paciente pode não existir ainda) |
| patient_name | text | ✅ | Desnormalizado para performance |
| patient_whatsapp | text | ✅ | Desnormalizado para envio de mensagens |
| scheduled_at | timestamptz | ✅ | UTC |
| duration_minutes | int | ✅ | Default 30 |
| tipo | text | ✅ | consulta / retorno / teleconsulta |
| google_event_id | text | — | ID do evento no Google Calendar |
| google_meet_link | text | — | Link do Google Meet gerado |
| status | enum | ✅ | pending / confirmed / cancelled / completed |
| payment_status | enum | ✅ | pending / paid / refunded |
| stripe_session_id | text | — | ID da sessão Stripe |
| stripe_payment_intent_id | text | — | ID do PaymentIntent Stripe |
| valor | numeric | — | Valor cobrado nesta consulta |
| anamnesis_token | uuid | — | Token único para magic link de anamnese |
| anamnesis_token_used | boolean | ✅ | Se o token já foi utilizado |
| anamnesis_token_expires_at | timestamptz | — | Expiração do token |
| observacoes | text | — | Notas internas do médico |
| created_at | timestamptz | ✅ | — |
| updated_at | timestamptz | ✅ | — |

### medical_records
Prontuário eletrônico. 1 registro por consulta (opcional).

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|------------|-----------|
| id | uuid | ✅ PK | — |
| clinic_id | uuid | ✅ FK→clinics | — |
| patient_id | uuid | ✅ FK→patients | — |
| appointment_id | uuid | — | FK→appointments |
| queixas | text | — | Queixa principal |
| hipotese_diagnostica | text | — | CID textual ou hipótese |
| cid_10 | text | — | Código CID-10 |
| prescricao | text | — | Texto livre da prescrição |
| observacoes | text | — | Anotações do médico |
| anexos | jsonb | — | Array de URLs de arquivos |
| created_at | timestamptz | ✅ | — |
| updated_at | timestamptz | ✅ | — |

### anamnesis
Ficha de anamnese preenchida pelo paciente via magic link.

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|------------|-----------|
| id | uuid | ✅ PK | — |
| clinic_id | uuid | ✅ FK→clinics | — |
| patient_id | uuid | — | FK→patients |
| appointment_id | uuid | — | FK→appointments |
| queixa_principal | text | — | — |
| historico_familiar | text | — | — |
| alergias | text | — | — |
| medicamentos_em_uso | text | — | — |
| antecedentes | text | — | — |
| habitos | text | — | — |
| lgpd_consent | boolean | ✅ | Consentimento LGPD explícito |
| lgpd_consent_at | timestamptz | — | Momento do consentimento |
| lgpd_terms_version | text | — | Versão dos termos aceitos |
| created_at | timestamptz | ✅ | — |

### privacy_consents
Registro de consentimentos LGPD por paciente.

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|------------|-----------|
| id | uuid | ✅ PK | — |
| clinic_id | uuid | — | — |
| patient_id | uuid | — | — |
| whatsapp | text | — | Identificador quando patient_id não existe |
| consent_type | text | ✅ | Tipo: data_processing / marketing / etc |
| consented | boolean | ✅ | — |
| terms_version | text | ✅ | Ex: "v1.0" |
| ip_address | text | — | — |
| created_at | timestamptz | ✅ | — |

### whatsapp_sessions
Sessões ativas de conversa WhatsApp (gerenciadas pelo n8n + agente IA).

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|------------|-----------|
| id | uuid | ✅ PK | — |
| clinic_id | uuid | ✅ FK→clinics | — |
| whatsapp_number | text | ✅ | Número do paciente |
| patient_id | uuid | — | FK→patients (preenchido ao identificar) |
| current_intent | text | — | Intenção atual: agendamento / duvida / etc |
| session_data | jsonb | — | Estado da conversa (dados parciais) |
| last_message_at | timestamptz | ✅ | Para expirar sessões inativas |
| created_at | timestamptz | ✅ | — |

### conversation_memory
Histórico de mensagens da secretária IA. Alimenta contexto dos próximos turnos.

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|------------|-----------|
| id | uuid | ✅ PK | — |
| clinic_id | uuid | ✅ FK→clinics | — |
| whatsapp_number | text | ✅ | — |
| role | enum | ✅ | user / assistant |
| content | text | ✅ | Texto da mensagem |
| metadata | jsonb | — | Intent, confidence, etc |
| created_at | timestamptz | ✅ | — |

### audit_logs
Log de auditoria para LGPD e rastreabilidade.

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|------------|-----------|
| id | uuid | ✅ PK | — |
| clinic_id | uuid | — | — |
| clerk_user_id | text | — | — |
| action | text | ✅ | Ex: patient.create / appointment.cancel |
| resource_type | text | ✅ | Ex: patient / appointment |
| resource_id | uuid | — | — |
| ip_address | text | — | — |
| metadata | jsonb | — | Dados antes/depois |
| created_at | timestamptz | ✅ | — |

---

## Relacionamentos

```
clinics ──< patients           (1 clínica → N pacientes)
clinics ──< appointments       (1 clínica → N consultas)
clinics ──< medical_records    (1 clínica → N prontuários)
clinics ──< anamnesis          (1 clínica → N fichas)
clinics ──< whatsapp_sessions  (1 clínica → N sessões ativas)
clinics ──< conversation_memory
patients ──< appointments      (1 paciente → N consultas)
patients ──< medical_records   (1 paciente → N prontuários)
appointments ──< medical_records (1 consulta → 1 prontuário)
appointments ──< anamnesis      (1 consulta → 1 anamnese)
```

---

## Migrations Aplicadas

### M001 — Colunas Google na tabela clinics (Fase 2)
```sql
-- Adicionar suporte a Google Calendar
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS google_connected boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_access_token text,
  ADD COLUMN IF NOT EXISTS google_refresh_token text,
  ADD COLUMN IF NOT EXISTS google_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS google_calendar_id text,
  ADD COLUMN IF NOT EXISTS working_hours_start integer DEFAULT 8,
  ADD COLUMN IF NOT EXISTS working_hours_end integer DEFAULT 18,
  ADD COLUMN IF NOT EXISTS working_days integer[] DEFAULT ARRAY[1,2,3,4,5];

-- Index para lookup rápido por google_calendar_id
CREATE INDEX IF NOT EXISTS clinics_google_calendar_id_idx ON clinics(google_calendar_id);
```

**Status:** ✅ Aplicada

### M002 — Suporte a Google Contacts e notas em pacientes (Fase 3)
```sql
-- Adicionar colunas em patients
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS google_contact_id text,
  ADD COLUMN IF NOT EXISTS notes text;

-- Index para lookup por google_contact_id
CREATE INDEX IF NOT EXISTS patients_google_contact_id_idx
  ON patients(google_contact_id)
  WHERE google_contact_id IS NOT NULL;

-- Index para busca por nome
CREATE INDEX IF NOT EXISTS patients_nome_idx
  ON patients USING gin(to_tsvector('portuguese', nome));

-- Index para clinic_id + created_at (listagem paginada)
CREATE INDEX IF NOT EXISTS patients_clinic_created_idx
  ON patients(clinic_id, created_at DESC);
```

**Status:** ✅ Aplicada

### M003 — Setup Anamnese (Fase 4)
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE INDEX IF NOT EXISTS medical_records_appointment_id_idx ON medical_records(appointment_id);
CREATE INDEX IF NOT EXISTS medical_records_patient_id_idx ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS anamnesis_appointment_id_idx ON anamnesis(appointment_id);
CREATE INDEX IF NOT EXISTS appointments_anamnesis_token_idx ON appointments(anamnesis_token) WHERE anamnesis_token IS NOT NULL;
```

**Status:** ✅ Aplicada

---

## Como Atualizar Este Documento

- Sempre que uma migration for criada, adicionar em "Migrations Pendentes"
- Quando executada, marcar como ✅ e mover para uma seção "Migrations Aplicadas"
- Quando uma coluna for adicionada, atualizar a tabela correspondente
- Também atualizar `types/supabase.ts` para refletir as mudanças
