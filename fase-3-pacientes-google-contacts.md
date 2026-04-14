# Fase 3 — Pacientes + Google Contacts

> **Produto:** dradauto  
> **Data:** 2026-04-12  
> **Skills:** `google-calendar-automation` · `react-nextjs-development` · `shadcn` · `postgresql`  
> **Depende de:** Fase 2 concluída (OAuth Google, tokens salvos em clinics)

---

## Objetivo

Construir o módulo de pacientes completo: listagem com busca, perfil individual com histórico, edição inline e criação independente. Resolver o Combobox pendente da Fase 2 (busca de paciente ao criar consulta). Sincronizar cada paciente com o Google Contacts do médico — quando um paciente liga, o médico vê o nome na tela do celular.

---

## ⚠️ Antes de Implementar — Google Cloud Console

Adicionar scope de Contacts ao OAuth existente:

1. Console → **APIs & Services → Library** → buscar **"Google People API"** → Enable
2. **OAuth Consent Screen → Edit → Scopes** → adicionar:
   - `https://www.googleapis.com/auth/contacts`
3. Salvar

**Consequência:** médicos que já autorizaram precisarão reconectar o Google. O sistema detecta automaticamente (scope faltando → forçar reconexão).

Adicionar ao `.env.local` (já existe, não precisa mudar — apenas documenta):
```bash
GOOGLE_CLIENT_ID=...       # já preenchido
GOOGLE_CLIENT_SECRET=...   # já preenchido
```

---

## Arquitetura da Funcionalidade

```
/pacientes
  ├── Listagem com busca/filtro
  ├── Stats (total, novos, sem consulta)
  └── [id]
        ├── Perfil completo
        ├── Histórico de consultas
        └── Google Contact status

Google Contacts (People API)
  ├── Criar contato ao registrar paciente
  ├── Atualizar contato ao editar paciente
  └── Badge de sync em cada paciente

Agenda (fix)
  └── Combobox com busca real de pacientes existentes
```

---

## Migration SQL — executar no Supabase antes de implementar

```sql
-- M002: Suporte a Google Contacts e notas em pacientes
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS google_contact_id text,
  ADD COLUMN IF NOT EXISTS notes text;

-- Index para lookup por google_contact_id
CREATE INDEX IF NOT EXISTS patients_google_contact_id_idx
  ON patients(google_contact_id)
  WHERE google_contact_id IS NOT NULL;

-- Index para busca por nome (já deve existir, mas garantir)
CREATE INDEX IF NOT EXISTS patients_nome_idx
  ON patients USING gin(to_tsvector('portuguese', nome));

-- Index para clinic_id + created_at (listagem paginada)
CREATE INDEX IF NOT EXISTS patients_clinic_created_idx
  ON patients(clinic_id, created_at DESC);
```

Atualizar `types/supabase.ts` — adicionar nas interfaces de `patients`:

```typescript
// Row
google_contact_id: string | null
notes: string | null

// Insert
google_contact_id?: string | null
notes?: string | null

// Update
google_contact_id?: string | null
notes?: string | null
```

---

## OAuth — atualizar scope para incluir Contacts

Em `app/actions/google.ts`, localizar `getGoogleAuthUrl` e adicionar o scope de contacts:

```typescript
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/contacts',   // NOVO
]
```

Quando o médico tenta sincronizar um contato mas o scope não está autorizado, detectar e redirecionar para reconexão:

```typescript
// Em lib/google/contacts.ts, verificar 403 com scope insuficiente:
if (res.status === 403) {
  throw new Error('GOOGLE_CONTACTS_SCOPE_MISSING')
}
// No frontend: capturar esse erro e exibir Alert com botão "Reconectar Google"
```

---

## `lib/google/contacts.ts` — People API wrapper

```typescript
// lib/google/contacts.ts

const PEOPLE_API = 'https://people.googleapis.com/v1'

export interface GoogleContactData {
  nome: string
  whatsapp: string
  especialidadeMedico?: string
  nomeMedico?: string
}

// Criar contato no Google Contacts do médico
export async function createGoogleContact(
  accessToken: string,
  data: GoogleContactData
): Promise<string | null> {
  const body = {
    names: [{ givenName: data.nome }],
    phoneNumbers: [
      {
        value: data.whatsapp,
        type: 'mobile',
        canonicalForm: data.whatsapp,
      },
    ],
    biographies: [
      {
        value: `Paciente dradauto${data.especialidadeMedico ? ` — ${data.especialidadeMedico}` : ''}`,
        contentType: 'TEXT_PLAIN',
      },
    ],
  }

  const res = await fetch(`${PEOPLE_API}/people:createContact`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (res.status === 403) throw new Error('GOOGLE_CONTACTS_SCOPE_MISSING')
  if (!res.ok) {
    console.error('Google Contacts create error:', await res.text())
    return null // Falha silenciosa — paciente é salvo no banco mesmo sem contato
  }

  const contact = await res.json()
  // resourceName ex: "people/c123456789"
  return contact.resourceName as string
}

// Atualizar contato existente
export async function updateGoogleContact(
  accessToken: string,
  resourceName: string,
  data: GoogleContactData
): Promise<boolean> {
  // 1. Buscar etag atual (obrigatório para update)
  const getRes = await fetch(
    `${PEOPLE_API}/${resourceName}?personFields=names,phoneNumbers,biographies`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!getRes.ok) return false
  const current = await getRes.json()

  const body = {
    ...current,
    names: [{ givenName: data.nome }],
    phoneNumbers: [{ value: data.whatsapp, type: 'mobile' }],
  }

  const res = await fetch(
    `${PEOPLE_API}/${resourceName}:updateContact?updatePersonFields=names,phoneNumbers`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  return res.ok
}

// Deletar contato (ao excluir paciente — opcional)
export async function deleteGoogleContact(
  accessToken: string,
  resourceName: string
): Promise<void> {
  await fetch(`${PEOPLE_API}/${resourceName}:deleteContact`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  // Ignorar erros — paciente já foi removido do banco
}
```

---

## `app/actions/patients.ts` — CRUD completo

```typescript
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { getCurrentClinic } from '@/lib/clinic'
import { getValidAccessToken } from '@/lib/google/auth'
import { createGoogleContact, updateGoogleContact, deleteGoogleContact } from '@/lib/google/contacts'
import { revalidatePath } from 'next/cache'

// Listar pacientes com busca e paginação
export async function listPatients(params?: {
  search?: string
  page?: number
  limit?: number
}) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any
  const { search, page = 1, limit = 20 } = params || {}
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('patients')
    .select('*, appointments(count)', { count: 'exact' })
    .eq('clinic_id', clinic.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.ilike('nome', `%${search}%`)
  }

  const { data, error, count } = await query

  if (error) throw new Error(error.message)
  return { patients: data || [], total: count || 0 }
}

// Buscar paciente por ID (para detalhe)
export async function getPatient(id: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      appointments(
        id, scheduled_at, tipo, status, payment_status, valor,
        google_meet_link, observacoes
      )
    `)
    .eq('id', id)
    .eq('clinic_id', clinic.id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Criar paciente (standalone — não via agenda)
export async function createPatient(data: {
  nome: string
  whatsapp: string
  email?: string
  data_nascimento?: string
  cpf?: string
  notes?: string
}) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  // Verificar duplicata por WhatsApp
  const { data: existing } = await supabase
    .from('patients')
    .select('id, nome')
    .eq('clinic_id', clinic.id)
    .eq('whatsapp', data.whatsapp)
    .single()

  if (existing) {
    return { 
      success: false, 
      error: 'duplicate_whatsapp',
      existingId: existing.id,
      existingName: existing.nome,
    }
  }

  const { data: patient, error } = await supabase
    .from('patients')
    .insert({ ...data, clinic_id: clinic.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Sincronizar com Google Contacts (se conectado)
  if (clinic.google_connected && clinic.google_refresh_token) {
    try {
      const accessToken = await getValidAccessToken(clinic)
      const resourceName = await createGoogleContact(accessToken, {
        nome: data.nome,
        whatsapp: data.whatsapp,
        especialidadeMedico: clinic.especialidade,
        nomeMedico: clinic.nome,
      })
      if (resourceName) {
        await (supabase as any)
          .from('patients')
          .update({ google_contact_id: resourceName })
          .eq('id', patient.id)
        patient.google_contact_id = resourceName
      }
    } catch (e: any) {
      if (e.message === 'GOOGLE_CONTACTS_SCOPE_MISSING') {
        console.warn('Google Contacts scope não autorizado — paciente salvo sem sync')
      }
      // Falha silenciosa — paciente foi salvo com sucesso
    }
  }

  revalidatePath('/pacientes')
  return { success: true, patient }
}

// Atualizar paciente
export async function updatePatient(id: string, data: {
  nome?: string
  whatsapp?: string
  email?: string
  data_nascimento?: string
  cpf?: string
  notes?: string
}) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient() as any

  const { data: patient, error } = await supabase
    .from('patients')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('clinic_id', clinic.id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Atualizar Google Contact se existir
  if (
    clinic.google_connected &&
    patient.google_contact_id &&
    (data.nome || data.whatsapp)
  ) {
    try {
      const accessToken = await getValidAccessToken(clinic)
      await updateGoogleContact(accessToken, patient.google_contact_id, {
        nome: patient.nome,
        whatsapp: patient.whatsapp,
      })
    } catch {
      // Falha silenciosa
    }
  }

  revalidatePath('/pacientes')
  revalidatePath(`/pacientes/${id}`)
  return { success: true, patient }
}

// Buscar pacientes para o Combobox da agenda
export async function searchPatients(query: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) return []

  const supabase = createServerClient() as any

  const { data } = await (supabase as any)
    .from('patients')
    .select('id, nome, whatsapp')
    .eq('clinic_id', clinic.id)
    .ilike('nome', `%${query}%`)
    .order('nome')
    .limit(8)

  return data || []
}

// Sincronizar TODOS os pacientes sem google_contact_id (bulk sync)
export async function syncAllPatientsToGoogle() {
  const clinic = await getCurrentClinic()
  if (!clinic?.google_connected) {
    return { success: false, error: 'not_connected' }
  }

  const supabase = createServerClient() as any

  const { data: patients } = await supabase
    .from('patients')
    .select('id, nome, whatsapp')
    .eq('clinic_id', clinic.id)
    .is('google_contact_id', null)
    .limit(50) // Processar em lotes para evitar rate limiting

  if (!patients?.length) return { success: true, synced: 0 }

  let synced = 0
  let failed = 0

  try {
    const accessToken = await getValidAccessToken(clinic)
    for (const patient of patients) {
      try {
        const resourceName = await createGoogleContact(accessToken, {
          nome: patient.nome,
          whatsapp: patient.whatsapp,
          especialidadeMedico: clinic.especialidade,
        })
        if (resourceName) {
          await (supabase as any)
            .from('patients')
            .update({ google_contact_id: resourceName })
            .eq('id', patient.id)
          synced++
        }
      } catch {
        failed++
      }
    }
  } catch (e: any) {
    if (e.message === 'GOOGLE_CONTACTS_SCOPE_MISSING') {
      return { success: false, error: 'scope_missing' }
    }
  }

  revalidatePath('/pacientes')
  return { success: true, synced, failed, remaining: patients.length - synced }
}
```

---

## UX Flows

### Flow 1 — Listagem de Pacientes (`/pacientes`)

```
┌─────────────────────────────────────────────────────┐
│  Pacientes                              [+ Novo]     │
│                                                      │
│  ┌─────────────────────────────────────────────────┐│
│  │ 🔍 Buscar por nome ou WhatsApp...               ││
│  └─────────────────────────────────────────────────┘│
│                                                      │
│  ┌──────┐ ┌─────────────┐ ┌────────────────────────┐│
│  │  47  │ │      8      │ │         3              ││
│  │Total │ │ Novos/mês   │ │  Sem consulta recente  ││
│  └──────┘ └─────────────┘ └────────────────────────┘│
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ [Avatar] Maria Santos          (11) 99999-9999   ││
│  │          Clínica Geral · 3 consultas             ││
│  │          [Badge: Google Sync ✓]  [→ Ver perfil] ││
│  ├──────────────────────────────────────────────────┤│
│  │ [Avatar] João Oliveira         (11) 98888-8888   ││
│  │          2 consultas · Último: 10/04             ││
│  │          [Badge: Sem sync]  [→ Ver perfil]       ││
│  └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

**Componentes:**
- Busca: `<Input>` com debounce de 300ms (Client Component) — sem submit, filtra em tempo real
- Stats: 3 cards pequenos (Server Component, dados reais)
- Lista: cada linha com Avatar + nome + whatsapp + badge de sync + link para detalhe
- Badge Google Sync: verde "Salvo nos contatos" ou cinza "Não sincronizado" + botão de sync individual
- Botão "+ Novo": abre `PatientFormDialog`
- Paginação: "Mostrar mais" (load more, não paginação numérica)

---

### Flow 2 — Perfil do Paciente (`/pacientes/[id]`)

```
┌──────────────────────────────────────────────────────┐
│ ← Voltar                                             │
│                                                      │
│  [Avatar Grande]  Maria Santos                       │
│                   (11) 99999-9999 · 32 anos          │
│                   [Badge: Google ✓]  [Editar]        │
│                   [WhatsApp ↗]  [Nova Consulta]      │
│                                                      │
│  ┌─────────────────┬──────────────────┬────────────┐ │
│  │   Consultas (3) │   Prontuários    │  Anamneses │ │
│  └─────────────────┴──────────────────┴────────────┘ │
│                                                      │
│  Timeline de consultas:                              │
│  ● 10/04 — Retorno — Confirmada  [Pago]             │
│  ● 25/03 — Consulta — Concluída  [Pago]             │
│  ● 10/03 — Primeira vez — Concluída  [Pago]         │
│                                                      │
│  Notas internas (só o médico vê):                    │
│  ┌────────────────────────────────────────────────┐  │
│  │ Observações sobre o paciente...                │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**Tabs:**
- **Consultas** — timeline com status, tipo, pagamento. Link "Abrir prontuário" (disponível na Fase 4)
- **Prontuários** — lista de prontuários (placeholder na Fase 3 → "Em breve na Fase 4")
- **Anamneses** — fichas preenchidas (placeholder)

**Ações no cabeçalho:**
- Botão WhatsApp: abre `wa.me/55{numero}` em nova aba
- Botão "Nova Consulta": abre `NewAppointmentDialog` com paciente pré-selecionado
- Botão "Editar": abre `PatientFormDialog` em modo edição

---

### Flow 3 — Criar/Editar Paciente (Dialog)

```
┌──────────────────────────────────────────────┐
│ Novo Paciente                              ✕  │
├──────────────────────────────────────────────┤
│                                              │
│  Nome completo *                             │
│  [___________________________________]       │
│                                              │
│  WhatsApp *                                  │
│  [+55] [(11) 99999-9999______________]       │
│                                              │
│  Email                 Data de nascimento    │
│  [__________________]  [__/__/____]          │
│                                              │
│  CPF (opcional)                              │
│  [___.___.___-__]                            │
│                                              │
│  Notas internas (só você vê)                 │
│  [________________________________________]  │
│                                              │
│  ☁ Salvar nos contatos do Google             │
│    (aparece no seu celular quando ligar)     │
│                                              │
├──────────────────────────────────────────────┤
│           [Cancelar]  [Salvar Paciente]      │
└──────────────────────────────────────────────┘
```

**Regras:**
- WhatsApp é único por clínica — se duplicado, mostrar Alert com link para o paciente existente
- Checkbox "Salvar nos contatos" — checked por padrão se `clinic.google_connected`, disabled se não conectado (com tooltip: "Conecte o Google Agenda para habilitar")
- CPF mascarado, não obrigatório (LGPD)
- Data de nascimento: calcular idade ao carregar o perfil

---

### Flow 4 — Combobox corrigido na Agenda

Substituir o `<Input>` simples em `new-appointment-dialog.tsx` por busca real:

```tsx
// Componente de busca de paciente com criação inline
function PatientSearch({ onSelect, clinicId }: {
  onSelect: (patient: { id: string | null; nome: string; whatsapp: string }) => void
  clinicId: string
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Patient[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timeout = setTimeout(async () => {
      setIsSearching(true)
      const patients = await searchPatients(query)
      setResults(patients)
      setIsSearching(false)
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar paciente existente ou digitar nome novo..."
          className="pl-9"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown de resultados */}
      {query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border bg-white shadow-lg overflow-hidden">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onSelect({ id: p.id, nome: p.nome, whatsapp: p.whatsapp })
                setQuery(p.nome)
                setResults([])
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
            >
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-accent text-primary text-xs font-bold">
                  {p.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium text-foreground">{p.nome}</div>
                <div className="text-xs text-muted-foreground">{p.whatsapp}</div>
              </div>
            </button>
          ))}

          {/* Opção de criar novo paciente */}
          <button
            type="button"
            onClick={() => {
              onSelect({ id: null, nome: query, whatsapp: '' })
              setResults([])
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors border-t border-border"
          >
            <div className="size-8 shrink-0 flex items-center justify-center rounded-full bg-primary/10">
              <UserPlus className="size-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium text-primary">Criar "{query}"</div>
              <div className="text-xs text-muted-foreground">Novo paciente — preencha o WhatsApp abaixo</div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
```

**Lógica:**
- Digitar 2+ caracteres → busca em tempo real com debounce 300ms
- Selecionar existente → preenche WhatsApp automaticamente (campo torna-se readonly)
- Clicar "Criar [nome]" → campo WhatsApp fica obrigatório, paciente criado junto com consulta
- Limpar campo → reseta seleção

---

### Flow 5 — Bulk Sync Google Contacts

Banner na página `/pacientes` quando há pacientes sem sync:

```tsx
// Mostrar se clinic.google_connected && totalSemSync > 0
<Alert className="border-primary/20 bg-primary/5">
  <CloudUpload className="size-4 text-primary" />
  <AlertTitle>12 pacientes não estão nos seus contatos</AlertTitle>
  <AlertDescription className="flex items-center justify-between">
    <span>Sincronize para ver o nome deles quando ligarem para você.</span>
    <Button size="sm" onClick={handleBulkSync} disabled={isSyncing}>
      {isSyncing ? <Loader2 className="size-4 animate-spin" /> : 'Sincronizar agora'}
    </Button>
  </AlertDescription>
</Alert>
```

---

## Arquivos a Criar / Modificar

```
NOVOS:
app/actions/patients.ts                      ← CRUD + Google Contacts sync
lib/google/contacts.ts                       ← People API wrapper
app/(dashboard)/pacientes/[id]/page.tsx      ← Perfil do paciente (Server Component)
components/patients/
  patients-list.tsx                          ← Lista com busca (Client Component)
  patient-card.tsx                           ← Card individual na lista
  patient-form-dialog.tsx                    ← Dialog criar/editar
  patient-detail-header.tsx                  ← Cabeçalho do perfil
  appointment-history.tsx                    ← Timeline de consultas
  google-sync-badge.tsx                      ← Badge de status de sync

MODIFICAR:
app/(dashboard)/pacientes/page.tsx           ← Implementar (hoje é placeholder)
components/agenda/new-appointment-dialog.tsx ← Substituir Input por PatientSearch
app/actions/google.ts                        ← Adicionar scope contacts
types/supabase.ts                            ← Colunas google_contact_id e notes em patients
types/index.ts                               ← Atualizar PatientInsert/Update
database.md                                  ← Marcar M001 como executada, adicionar M002
```

---

## Regras de Negócio

1. **WhatsApp único por clínica:** não permitir dois pacientes com o mesmo número. Exibir Alert com link para o duplicado.

2. **Criação implícita (via agenda):** quando `createAppointment` cria um paciente novo (por não encontrar pelo WhatsApp), esse paciente NÃO é sincronizado com Google Contacts automaticamente — isso evita spam de sync. O sync acontece apenas ao criar via formulário de paciente ou via bulk sync.

3. **Google Contacts — falha silenciosa:** se o sync falhar por qualquer motivo, o paciente é salvo no banco normalmente. O erro é logado mas não exibido ao médico. Badge mostra "Não sincronizado" com botão de retry.

4. **Scope ausente:** se o médico não tem o scope `contacts` autorizado (conectou antes desta feature), mostrar Alert específico: *"Para salvar nos contatos, reconecte sua conta Google"* com botão de reconexão.

5. **CPF:** armazenar apenas se o médico preencher. Nunca obrigar. Mascarar no frontend: `000.000.000-00`.

6. **Notas:** campo livre, só o médico vê. Não aparece em nenhuma tela do paciente (WhatsApp, magic links, anamnese).

7. **Excluir paciente:** não implementar exclusão física. Manter dados por 5 anos (LGPD — dado médico). Se necessário no futuro: soft delete com `deleted_at`.

8. **Tab Prontuários e Anamneses no perfil:** renderizar como placeholder com UI vazia e mensagem *"Disponível em breve"* — não omitir as tabs, para o médico já visualizar a estrutura.

9. **Busca na listagem:** case-insensitive, busca por nome ou WhatsApp. Debounce 300ms no cliente.

10. **Idade:** calcular dinamicamente a partir de `data_nascimento`. Exibir como "32 anos" ao lado do WhatsApp.

---

## Tratamento de Erros

| Código | Causa | Ação |
|--------|-------|------|
| `duplicate_whatsapp` | WhatsApp já cadastrado | Alert com link para paciente existente |
| `GOOGLE_CONTACTS_SCOPE_MISSING` | Scope não autorizado | Alert: "Reconecte o Google" |
| `GOOGLE_TOKEN_REVOKED` | Token expirado | Banner: "Reconecte sua Google Agenda" |
| `patient_not_found` | ID inválido ou de outra clínica | Redirect para `/pacientes` |
| `supabase_error` | Banco indisponível | Toast de erro |

---

## Tarefas Atômicas de Implementação

### Plano 6a — SQL + API Google Contacts

- [ ] Adicionar `https://www.googleapis.com/auth/contacts` no Google Cloud Console (People API)
- [ ] Executar migration M002 no Supabase SQL Editor
- [ ] Atualizar `types/supabase.ts` — colunas `google_contact_id` e `notes` em patients
- [ ] Atualizar `types/index.ts` — `PatientInsert` e `PatientUpdate`
- [ ] Criar `lib/google/contacts.ts` (createGoogleContact, updateGoogleContact, deleteGoogleContact)
- [ ] Atualizar `app/actions/google.ts` — adicionar scope `contacts` em `getGoogleAuthUrl`
- [ ] Commit: `feat: google contacts api + patients migration`

### Plano 6b — Server Actions + Combobox Fix

- [ ] Criar `app/actions/patients.ts` (listPatients, getPatient, createPatient, updatePatient, searchPatients, syncAllPatientsToGoogle)
- [ ] Substituir `<Input>` por `PatientSearch` em `new-appointment-dialog.tsx`
- [ ] Testar: criar consulta selecionando paciente existente → WhatsApp preenchido automaticamente
- [ ] Testar: criar consulta com paciente novo → paciente criado no banco
- [ ] Commit: `feat: patient actions + combobox fix in agenda`

### Plano 6c — UI Listagem de Pacientes

- [ ] Criar `components/patients/google-sync-badge.tsx`
- [ ] Criar `components/patients/patient-card.tsx`
- [ ] Criar `components/patients/patient-form-dialog.tsx`
- [ ] Criar `components/patients/patients-list.tsx` (com busca debounced + bulk sync banner)
- [ ] Implementar `app/(dashboard)/pacientes/page.tsx` (Server Component com dados reais)
- [ ] Testar criar paciente → aparece na lista → badge Google sync
- [ ] Commit: `feat: patients list ui`

### Plano 6d — Perfil do Paciente

- [ ] Criar `components/patients/patient-detail-header.tsx`
- [ ] Criar `components/patients/appointment-history.tsx`
- [ ] Criar `app/(dashboard)/pacientes/[id]/page.tsx`
- [ ] Testar: clicar em paciente na lista → ver perfil → histórico de consultas
- [ ] Testar: editar paciente → Google Contact atualizado
- [ ] Testar: `npm run build` sem erros
- [ ] Commit: `feat: patient detail page + appointment history`

---

## Checklist de Verificação Final

- [ ] Nenhum emoji na UI de pacientes
- [ ] Busca na listagem funciona (case-insensitive, debounce)
- [ ] Criar paciente → aparece imediatamente na lista
- [ ] WhatsApp duplicado → Alert com link para existente (não cria duplicata)
- [ ] Nova consulta → Combobox busca pacientes reais + cria novo se não encontrar
- [ ] Selecionar paciente existente na agenda → WhatsApp preenchido automaticamente
- [ ] Google connected → ao criar paciente, Google Contact criado
- [ ] Google não conectado → paciente salvo normalmente, sem erro
- [ ] Scope ausente → Alert específico com botão de reconexão
- [ ] Perfil do paciente → timeline de consultas correta
- [ ] Tabs Prontuários e Anamneses → placeholder "Em breve"
- [ ] Botão WhatsApp → abre wa.me no celular/WhatsApp Web
- [ ] `npm run build` sem erros TypeScript
