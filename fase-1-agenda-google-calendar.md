# Fase 1 — Agenda + Google Calendar + Google Meet

> **Produto:** dradauto  
> **Data:** 2026-04-12  
> **Skills:** `google-calendar-automation` · `react-nextjs-development` · `shadcn` · `postgresql`  
> **Depende de:** Fase 0 concluída (auth Clerk, banco Supabase, tipos TypeScript)

---

## ⚠️ Avisos Críticos Antes de Começar

**1. Google Workspace vs Gmail pessoal**  
A skill `google-calendar-automation` avisa explicitamente: *"Requires Google Workspace account. Personal Gmail accounts are not supported."* Para `conferenceData` (Meet links), o Google pode exigir uma conta Google Workspace ou Google One. **Testar com a conta real do médico antes de prometer a funcionalidade.**

**Plano de contingência:** se o médico usar Gmail pessoal sem suporte a Meet, criar o evento normalmente sem `conferenceData` e informar que o link deve ser gerado manualmente ou via Google Meet separado.

**2. Google Workspace Account para o dradauto (OAuth App)**  
O próprio app dradauto não precisa de Workspace — só precisa publicar o OAuth app no Google Cloud Console. Na fase de testes, basta adicionar os emails dos médicos como "Test Users" na tela de consentimento. Para produção (>100 usuários), precisará passar pelo processo de verificação do Google.

---

## Visão Geral da Funcionalidade

O médico conecta sua conta Google uma única vez. A partir daí, toda consulta criada no dradauto aparece automaticamente no Google Agenda com link do Google Meet. A agenda do painel é a fonte de verdade (banco Supabase) — o Google Calendar é o espelho.

**Princípio de UX:** o médico já vive no Google Agenda. O dradauto deve se encaixar no fluxo existente, não substituir.

**O que o médico consegue fazer:**
- Ver todas as consultas em um calendário visual (dia/semana)
- Criar consulta em 3 cliques: selecionar horário → preencher paciente → salvar
- Receber link Google Meet automático para teleconsultas
- Editar, cancelar e concluir consultas
- Ver quais pacientes ainda não pagaram
- Verificar slots livres antes de sugerir horário ao paciente
- Usar no celular como app (PWA) com vista de dia adaptada

---

## Pré-requisito: Configuração Google Cloud Console

### Passo a passo completo

**1. Criar projeto**
- Acesse https://console.cloud.google.com
- Clique em "Select a project" → "New Project"
- Nome: `dradauto` → Create

**2. Ativar Google Calendar API**
- Menu → "APIs & Services" → "Library"
- Buscar "Google Calendar API" → Enable

**3. Configurar OAuth Consent Screen**
- "APIs & Services" → "OAuth consent screen"
- User Type: **External** → Create
- App name: `dradauto`
- User support email: seu email
- Developer contact: seu email
- Scopes → "Add or Remove Scopes":
  - `https://www.googleapis.com/auth/calendar.events`
  - `https://www.googleapis.com/auth/calendar.readonly`
- Test users → adicionar o(s) email(s) do(s) médico(s) que vão testar
- **Não publicar o app ainda** — manter em modo de teste

**4. Criar credenciais OAuth 2.0**
- "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
- Application type: **Web application**
- Name: `dradauto-web`
- Authorized JavaScript origins: `http://localhost:3000`
- Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
- Create → copiar Client ID e Client Secret

**5. Variáveis de ambiente**
```bash
GOOGLE_CLIENT_ID=<seu_client_id>
GOOGLE_CLIENT_SECRET=<seu_client_secret>
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

---

## Arquitetura da Funcionalidade

```
┌──────────────────────────────────────────────────────────────┐
│                  PAINEL DO MÉDICO (/agenda)                   │
│                                                              │
│  [Banner: Conectar Google Agenda]  ← se não conectado        │
│                                                              │
│  [← Ant.]  [Hoje]  Semana 07–11 Abr  [Próx. →]  [+ Nova]   │
│  [Dia | Semana]                                              │
│                                                              │
│  Grid de horários 07h–20h com slots de 30min                │
│  Consultas como cards coloridos clicáveis                    │
└──────────────────┬───────────────────────────────────────────┘
                   │ Server Actions + fetch
     ┌─────────────┴──────────────┐
     ▼                            ▼
┌──────────────┐        ┌─────────────────────┐
│   Supabase   │        │  Google Calendar API │
│              │        │                     │
│ appointments │◄──────►│  events.insert()    │
│ clinics      │        │  events.patch()     │
│ patients     │        │  events.delete()    │
└──────────────┘        │  events.list()      │
  fonte de verdade      │  freebusy.query()   │
                        │  conferenceData     │
                        └─────────────────────┘
                               espelho
```

**Fonte de verdade:** Supabase. O Google Calendar é apenas o espelho para o médico ver no app deles.

---

## Modelo de Dados

### SQL — Adicionar campos Google na tabela `clinics`

```sql
-- Tokens OAuth e configurações Google por clínica
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS google_connected        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_access_token     TEXT,
  ADD COLUMN IF NOT EXISTS google_refresh_token    TEXT,
  ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_calendar_id      TEXT NOT NULL DEFAULT 'primary',
  ADD COLUMN IF NOT EXISTS working_hours_start     TIME NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS working_hours_end       TIME NOT NULL DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS working_days            INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}';
  -- working_days: 0=Dom, 1=Seg, ..., 6=Sáb

-- Índice para busca por token (futuro: revogação em massa)
CREATE INDEX IF NOT EXISTS idx_clinics_google_connected
  ON clinics(google_connected) WHERE google_connected = true;
```

> **Nota (skill postgresql):** FK indexes são manuais no PostgreSQL. Os índices nas FK de `appointments` já foram criados no schema do Plano 3. Verificar que `idx_appointments_clinic_id` existe.

### Campos já existentes em `appointments` que serão usados

| Campo | Tipo | Uso |
|-------|------|-----|
| `scheduled_at` | `TIMESTAMPTZ` | Início da consulta (UTC no banco, exibir em America/Sao_Paulo) |
| `duration_minutes` | `INTEGER` | Duração (30, 45 ou 60) |
| `tipo` | `TEXT` | `consulta` / `retorno` / `teleconsulta` |
| `google_event_id` | `TEXT` | ID do evento no Google Calendar |
| `google_meet_link` | `TEXT` | Link do Meet gerado pelo Google |
| `status` | `TEXT` | `pending` / `confirmed` / `cancelled` / `completed` |
| `payment_status` | `TEXT` | `pending` / `paid` / `refunded` |
| `valor` | `NUMERIC(10,2)` | Valor da consulta (NUMERIC para dinheiro, nunca FLOAT) |
| `anamnesis_token` | `UUID` | Token para magic link da anamnese |

### Atualizar `types/supabase.ts`

Adicionar os novos campos nos tipos `Row`, `Insert` e `Update` de `clinics`:

```typescript
// Campos novos em clinics Row:
google_connected: boolean
google_access_token: string | null
google_refresh_token: string | null
google_token_expires_at: string | null
google_calendar_id: string
working_hours_start: string  // "08:00"
working_hours_end: string    // "18:00"
working_days: number[]       // [1,2,3,4,5]
```

---

## UX do Médico — Fluxos Detalhados

### Fluxo 1: Primeira vez (sem Google conectado)

```
1. Médico acessa /agenda pela primeira vez
2. Ver: banner Alert (Shadcn) no topo
   "📅 Conecte sua Google Agenda para sincronizar consultas e gerar links do Google Meet"
   [Conectar Google Agenda]
3. Clicar → redirect para OAuth Google
4. Autorizar → voltar para /agenda?connected=true
5. Banner some → toast "Google Agenda conectado com sucesso!"
6. Agenda aparece vazia com slots disponíveis
```

### Fluxo 2: Criar consulta (fluxo principal — 3 cliques)

```
1. Médico vê a grade de horários
2. Clica em um slot vazio (ex: Terça 14:00)
   → Dialog "Nova Consulta" abre com data e hora pré-preenchidas

3. Preenche:
   - Paciente: Combobox com busca (digita nome → sugere existentes ou cria novo)
   - WhatsApp: pré-preenchido se paciente existente; campo obrigatório se novo
   - Tipo: ToggleGroup com 3 opções (Consulta / Retorno / Teleconsulta)
   - Duração: ToggleGroup com opções da clínica (30 / 45 / 60 min)
   - Valor: pré-preenchido do config da clínica, editável
   - Observações: opcional

4. Clicar "Criar Consulta"
   → Loading spinner no botão
   → Salva no Supabase
   → Cria evento Google Calendar com Meet link
   → Dialog fecha
   → Card aparece na grade imediatamente (optimistic update)
   → Toast: "Consulta criada ✓ | [Ver no Google Agenda]"
```

### Fluxo 3: Ver detalhes e agir sobre uma consulta

```
1. Médico clica no card de uma consulta
2. Dialog "Detalhe da Consulta" abre
3. Ver: dados completos, status, Meet link, valor/pagamento
4. Ações disponíveis (dependendo do status):
   - pending:    [Confirmar]  [Cancelar]
   - confirmed:  [Concluir]   [Reagendar]  [Cancelar]
   - completed:  [Ver Prontuário] (somente leitura)
   - cancelled:  somente leitura

5. Clicar "Reagendar" → abre DatePicker inline no dialog
   → Seleciona nova data/hora
   → Salva → atualiza Google Calendar (mesmo event_id, novo horário)

6. Clicar "Cancelar consulta" → Alert de confirmação
   → Confirma → status = cancelled, remove do Google Calendar
   → Toast: "Consulta cancelada"
```

### Fluxo 4: Verificar disponibilidade (find-free-time)

```
Caso de uso: paciente liga perguntando "quando tem horário?"

1. Médico clica em "Verificar Disponibilidade" (botão na toolbar da agenda)
2. Seleciona período (ex: próxima semana)
3. Sistema consulta Google Calendar (freebusy.query) + banco
4. Exibe lista de slots livres no período
   Ex: "Seg 10h, Seg 14h, Ter 09h, Qua 11h, Qua 15h..."
5. Médico copia ou clica direto para abrir "Nova Consulta" com horário pré-selecionado
```

### Fluxo 5: Visualização mobile (PWA)

```
- Tela < 768px: mostrar vista de DIA (não semana)
- Swipe esquerda/direita para navegar entre dias
- Botão flutuante "+" no canto inferior direito para nova consulta
- Cards compactos (nome + horário + tipo)
- Dialog de detalhe usa Sheet (drawer bottom) em vez de Dialog central
```

---

## Componentes de UI — Especificação Detalhada

> **Regras Shadcn v4 aplicadas:**  
> - Formulários usam `FieldGroup + Field`, nunca `div` com `space-y-*`  
> - Opções de 2–5 itens usam `ToggleGroup`  
> - Busca com autocomplete usa `Combobox`  
> - Alertas/banners usam `Alert`  
> - Placeholders de carregamento usam `Skeleton`  
> - Status usam `Badge`  
> - Ícones em botões usam `data-icon`  
> - Dialogs sempre têm `DialogTitle` (acessibilidade)  
> - Cards usam estrutura completa: `CardHeader/CardTitle/CardContent`

### Componente: `connect-google-banner.tsx`

```tsx
// Usar Alert do Shadcn (não div customizado)
<Alert variant="default" className="border-primary/30 bg-primary/5">
  <CalendarIcon className="size-4" />
  <AlertTitle>Conecte sua Google Agenda</AlertTitle>
  <AlertDescription>
    Sincronize consultas e gere links Google Meet automaticamente.
  </AlertDescription>
  <Button size="sm" onClick={handleConnect} className="mt-3">
    <GoogleIcon data-icon="inline-start" />
    Conectar Google Agenda
  </Button>
</Alert>
```

### Componente: `calendar-view.tsx` — Grid semanal

**Desktop (semana):**

```
       SEG 07  TER 08  QUA 09  QUI 10  SEX 11
07:00  │       │       │       │       │
07:30  │       │       │       │       │
08:00  │ █████ │       │       │       │
08:30  │ Maria │       │ █████ │       │
09:00  │       │ █████ │ João  │       │
09:30  │       │ Ana C.│       │       │
10:00  │       │       │       │       │
...
```

**Células:**
- Slot vazio: `hover:bg-accent cursor-pointer` → click abre "Nova Consulta"
- Slot fora do horário de trabalho: `bg-muted/40 cursor-not-allowed`
- Card de consulta: posição absoluta, altura proporcional à duração

**Mobile (dia):**
- Lista vertical de slots, sem grade
- Consultas como cards expandidos com nome, horário, tipo e status badge

### Componente: `appointment-card.tsx` — Card no calendário

Cores semânticas por tipo + status (usar CSS variables, não hardcode):

```tsx
const cardStyles = {
  consulta:     'bg-primary/10 border-l-4 border-primary text-primary',
  retorno:      'bg-emerald-50 border-l-4 border-emerald-500',
  teleconsulta: 'bg-violet-50 border-l-4 border-violet-500',
}
const statusOverride = {
  pending:   'opacity-70 border-dashed',
  cancelled: 'opacity-40 line-through bg-muted',
  completed: 'opacity-60 bg-muted/50',
}
```

Conteúdo do card (compacto):
```
09:00 ────────────────────
      Maria Santos
      🎥 Teleconsulta · 60min
      ● Confirmada
```

### Componente: `new-appointment-dialog.tsx`

```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Nova Consulta</DialogTitle>  {/* obrigatório para a11y */}
    </DialogHeader>

    <form>
      <FieldGroup>

        {/* Busca de paciente — Combobox para autocomplete */}
        <Field>
          <FieldLabel>Paciente *</FieldLabel>
          <Combobox
            placeholder="Buscar ou criar paciente..."
            options={patients}
            onCreate={(name) => setNewPatient(name)}
          />
        </Field>

        {/* WhatsApp — InputGroup com prefixo */}
        <Field>
          <FieldLabel>WhatsApp *</FieldLabel>
          <InputGroup>
            <InputGroupAddon>+55</InputGroupAddon>
            <InputGroupInput placeholder="(11) 99999-9999" />
          </InputGroup>
        </Field>

        {/* Data e hora — dois campos lado a lado */}
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel>Data *</FieldLabel>
            <DatePicker value={date} onChange={setDate} />
          </Field>
          <Field>
            <FieldLabel>Horário *</FieldLabel>
            <TimePicker value={time} onChange={setTime} step={30} />
          </Field>
        </div>

        {/* Tipo — ToggleGroup (3 opções) */}
        <Field>
          <FieldLabel>Tipo *</FieldLabel>
          <ToggleGroup type="single" value={tipo} onValueChange={setTipo}>
            <ToggleGroupItem value="consulta">🩺 Consulta</ToggleGroupItem>
            <ToggleGroupItem value="retorno">🔄 Retorno</ToggleGroupItem>
            <ToggleGroupItem value="teleconsulta">🎥 Teleconsulta</ToggleGroupItem>
          </ToggleGroup>
        </Field>

        {/* Duração — ToggleGroup */}
        <Field>
          <FieldLabel>Duração</FieldLabel>
          <ToggleGroup type="single" value={duracao} onValueChange={setDuracao}>
            <ToggleGroupItem value="30">30 min</ToggleGroupItem>
            <ToggleGroupItem value="45">45 min</ToggleGroupItem>
            <ToggleGroupItem value="60">60 min</ToggleGroupItem>
          </ToggleGroup>
        </Field>

        {/* Valor */}
        <Field>
          <FieldLabel>Valor (R$)</FieldLabel>
          <InputGroup>
            <InputGroupAddon>R$</InputGroupAddon>
            <InputGroupInput type="number" value={valor} />
          </InputGroup>
        </Field>

        {/* Observações */}
        <Field>
          <FieldLabel>Observações</FieldLabel>
          <Textarea placeholder="Motivo da consulta, histórico relevante..." />
        </Field>

      </FieldGroup>

      {/* Warning de conflito — usar Alert, não div customizado */}
      {conflict && (
        <Alert variant="warning" className="mt-3">
          <AlertTriangle className="size-4" />
          <AlertDescription>
            Já existe uma consulta próxima a este horário. Verifique antes de confirmar.
          </AlertDescription>
        </Alert>
      )}
    </form>

    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Cancelar</Button>
      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading && <Spinner data-icon="inline-start" />}
        {isLoading ? 'Criando...' : 'Criar Consulta'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Componente: `appointment-detail-dialog.tsx`

Desktop: `Dialog` centralizado  
Mobile: `Sheet` com `side="bottom"` (drawer)

Conteúdo:
```tsx
<DialogHeader>
  <DialogTitle>{appointment.patient_name}</DialogTitle>
  <DialogDescription>
    {formatDate(appointment.scheduled_at)} · {appointment.duration_minutes} min
  </DialogDescription>
</DialogHeader>

{/* Status com Badge (nunca span customizado) */}
<div className="flex gap-2">
  <Badge variant={statusVariant[appointment.status]}>
    {statusLabel[appointment.status]}
  </Badge>
  <Badge variant={paymentVariant[appointment.payment_status]}>
    {paymentLabel[appointment.payment_status]}
  </Badge>
</div>

{/* Tipo */}
<p className="text-sm text-muted-foreground">{tipoLabel[appointment.tipo]}</p>

{/* Google Meet link — só exibir se existir */}
{appointment.google_meet_link && (
  <Card>
    <CardContent className="flex items-center justify-between gap-3 p-4">
      <div>
        <p className="text-sm font-medium">Google Meet</p>
        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
          {appointment.google_meet_link}
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={copyMeetLink}>
          <Copy data-icon="inline-start" /> Copiar
        </Button>
        <Button size="sm" asChild>
          <a href={appointment.google_meet_link} target="_blank">Abrir</a>
        </Button>
      </div>
    </CardContent>
  </Card>
)}

{/* Observações */}
{appointment.observacoes && (
  <p className="text-sm text-muted-foreground">{appointment.observacoes}</p>
)}

{/* Ações por status */}
<DialogFooter className="flex-col gap-2">
  {appointment.status === 'pending' && (
    <>
      <Button onClick={() => confirm(appointment.id)}>Confirmar</Button>
      <Button variant="outline" onClick={() => reschedule(appointment.id)}>
        Reagendar
      </Button>
    </>
  )}
  {appointment.status === 'confirmed' && (
    <>
      <Button onClick={() => complete(appointment.id)}>
        Marcar como Concluída
      </Button>
      <Button variant="outline" onClick={() => reschedule(appointment.id)}>
        Reagendar
      </Button>
    </>
  )}
  {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
    <Button variant="destructive" onClick={() => cancel(appointment.id)}>
      Cancelar Consulta
    </Button>
  )}
  {appointment.status === 'completed' && (
    <Button asChild>
      <Link href={`/prontuarios?appointment=${appointment.id}`}>
        Abrir Prontuário
      </Link>
    </Button>
  )}
</DialogFooter>
```

### Estado de carregamento da agenda

```tsx
// Usar Skeleton enquanto carrega consultas (nunca animate-pulse customizado)
{isLoading ? (
  <div className="space-y-2">
    <Skeleton className="h-16 w-full rounded-lg" />
    <Skeleton className="h-12 w-3/4 rounded-lg" />
    <Skeleton className="h-16 w-full rounded-lg" />
  </div>
) : (
  <CalendarGrid appointments={appointments} />
)}
```

### Estado vazio

```tsx
// Usar Empty (Shadcn) para estado sem consultas no dia
<Empty>
  <EmptyIcon><CalendarIcon /></EmptyIcon>
  <EmptyTitle>Nenhuma consulta hoje</EmptyTitle>
  <EmptyDescription>
    Clique em um horário para criar uma nova consulta.
  </EmptyDescription>
</Empty>
```

---

## Fluxo OAuth Completo

### Sequência

```
1. Médico clica "Conectar Google Agenda"
2. Server Action gera URL OAuth → redirect do browser
3. Google mostra tela de consentimento
4. Médico autoriza
5. Google redireciona para /api/auth/google/callback?code=XXX&state=clerk_user_id
6. Route Handler valida state, troca code por tokens, salva no banco
7. Redirect para /agenda?connected=true
8. Banner some, toast de sucesso
```

### URL de autorização (montar no servidor)

```
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=GOOGLE_CLIENT_ID
  &redirect_uri=GOOGLE_REDIRECT_URI
  &response_type=code
  &scope=https://www.googleapis.com/auth/calendar.events
         https://www.googleapis.com/auth/calendar.readonly
  &access_type=offline         ← garante refresh_token
  &prompt=consent              ← força exibir mesmo se já autorizou
  &state=CLERK_USER_ID         ← proteção CSRF
```

### Troca de tokens (server-side)

```typescript
// POST https://oauth2.googleapis.com/token
const tokens = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    grant_type: 'authorization_code',
  }),
}).then(r => r.json())

// Salvar no banco (service role)
await supabase.from('clinics').update({
  google_connected: true,
  google_access_token: tokens.access_token,
  google_refresh_token: tokens.refresh_token,  // só vem na 1ª autorização
  google_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
}).eq('clerk_user_id', userId)
```

### Refresh automático (antes de toda chamada à API)

```typescript
// lib/google/auth.ts
export async function getValidAccessToken(clinic: Clinic): Promise<string> {
  const expiresAt = new Date(clinic.google_token_expires_at!)
  const needsRefresh = expiresAt <= new Date(Date.now() + 5 * 60 * 1000)

  if (!needsRefresh) return clinic.google_access_token!

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: clinic.google_refresh_token!,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    // Refresh token revogado — desconectar
    await supabase.from('clinics')
      .update({ google_connected: false, google_access_token: null })
      .eq('id', clinic.id)
    throw new Error('GOOGLE_TOKEN_REVOKED')
  }

  const data = await res.json()
  const newExpiry = new Date(Date.now() + data.expires_in * 1000).toISOString()

  await supabase.from('clinics').update({
    google_access_token: data.access_token,
    google_token_expires_at: newExpiry,
  }).eq('id', clinic.id)

  return data.access_token
}
```

---

## Google Calendar API — Operações

### Criar evento com Meet

```typescript
// lib/google/calendar.ts
export async function createCalendarEvent(
  clinic: Clinic,
  appointment: AppointmentInsert
): Promise<{ google_event_id: string; google_meet_link: string | null }> {
  const accessToken = await getValidAccessToken(clinic)

  const startDt = new Date(appointment.scheduled_at!)
  const endDt = new Date(startDt.getTime() + (appointment.duration_minutes ?? 30) * 60_000)

  const tipoEmoji = { consulta: '🩺', retorno: '🔄', teleconsulta: '🎥' }

  const body = {
    summary: `${tipoEmoji[appointment.tipo as keyof typeof tipoEmoji]} ${appointment.patient_name}`,
    description: [
      `Paciente: ${appointment.patient_name}`,
      `WhatsApp: ${appointment.patient_whatsapp}`,
      `Tipo: ${appointment.tipo}`,
      `Valor: R$ ${appointment.valor}`,
      appointment.observacoes ? `Obs: ${appointment.observacoes}` : null,
    ].filter(Boolean).join('\n'),
    start: { dateTime: startDt.toISOString(), timeZone: 'America/Sao_Paulo' },
    end:   { dateTime: endDt.toISOString(),   timeZone: 'America/Sao_Paulo' },
    conferenceData: {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 10 },
      ],
    },
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${clinic.google_calendar_id}/events?conferenceDataVersion=1`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) throw new Error(`Google Calendar API error: ${res.status}`)

  const event = await res.json()
  const meetLink = event.conferenceData?.entryPoints?.find(
    (ep: { entryPointType: string; uri: string }) => ep.entryPointType === 'video'
  )?.uri ?? null

  return { google_event_id: event.id, google_meet_link: meetLink }
}
```

### Atualizar evento (reagendamento)

```typescript
export async function updateCalendarEvent(
  clinic: Clinic,
  eventId: string,
  newStart: string,
  durationMinutes: number
): Promise<void> {
  const accessToken = await getValidAccessToken(clinic)
  const startDt = new Date(newStart)
  const endDt = new Date(startDt.getTime() + durationMinutes * 60_000)

  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${clinic.google_calendar_id}/events/${eventId}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: { dateTime: startDt.toISOString(), timeZone: 'America/Sao_Paulo' },
        end:   { dateTime: endDt.toISOString(),   timeZone: 'America/Sao_Paulo' },
      }),
    }
  )
}
```

### Cancelar evento

```typescript
export async function deleteCalendarEvent(clinic: Clinic, eventId: string): Promise<void> {
  const accessToken = await getValidAccessToken(clinic)
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${clinic.google_calendar_id}/events/${eventId}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }
  )
  // 404 = já foi deletado, ignorar
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`Failed to delete event: ${res.status}`)
  }
}
```

### Verificar disponibilidade (find-free-time)

```typescript
export async function getFreeBusy(
  clinic: Clinic,
  timeMin: string,
  timeMax: string
): Promise<Array<{ start: string; end: string }>> {
  const accessToken = await getValidAccessToken(clinic)

  const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone: 'America/Sao_Paulo',
      items: [{ id: clinic.google_calendar_id }],
    }),
  })

  const data = await res.json()
  return data.calendars[clinic.google_calendar_id]?.busy ?? []
}

// Função utilitária: retorna slots livres dado os busy periods
export function findFreeSlots(
  busyPeriods: Array<{ start: string; end: string }>,
  workStart: string,   // "08:00"
  workEnd: string,     // "18:00"
  slotDuration: number, // minutos
  dateRange: Date[]    // dias a verificar
): Array<{ date: string; time: string; datetime: string }> {
  // Implementar lógica de slots livres
  // Retorna array de { date: "2026-04-14", time: "09:00", datetime: ISO string }
}
```

---

## Server Actions

### `app/actions/appointments.ts`

```typescript
'use server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentClinic } from '@/lib/clinic'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/google/calendar'
import type { AppointmentInsert } from '@/types'

// 1. Criar consulta
export async function createAppointment(data: AppointmentInsert) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient()

  // Verificar conflito (warning, não bloqueio hard)
  const conflictCheck = await supabase
    .from('appointments')
    .select('id, scheduled_at, patient_name')
    .eq('clinic_id', clinic.id)
    .neq('status', 'cancelled')
    .gte('scheduled_at', new Date(new Date(data.scheduled_at!).getTime() - 30 * 60_000).toISOString())
    .lte('scheduled_at', new Date(new Date(data.scheduled_at!).getTime() + 30 * 60_000).toISOString())

  // Inserir no banco primeiro
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({ ...data, clinic_id: clinic.id, status: 'pending' })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Tentar criar no Google Calendar (não falha a operação se o Google estiver offline)
  if (clinic.google_connected) {
    try {
      const { google_event_id, google_meet_link } = await createCalendarEvent(clinic, appointment)
      await supabase.from('appointments').update({ google_event_id, google_meet_link })
        .eq('id', appointment.id)
      return { ...appointment, google_event_id, google_meet_link, hasConflict: (conflictCheck.data?.length ?? 0) > 0 }
    } catch (e) {
      // Google falhou — retornar consulta sem event_id, frontend exibe aviso
      return { ...appointment, google_error: true, hasConflict: (conflictCheck.data?.length ?? 0) > 0 }
    }
  }

  return { ...appointment, hasConflict: (conflictCheck.data?.length ?? 0) > 0 }
}

// 2. Reagendar consulta
export async function rescheduleAppointment(
  id: string,
  newScheduledAt: string,
  durationMinutes?: number
) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient()

  const { data: current } = await supabase.from('appointments').select('*').eq('id', id).single()
  if (!current) throw new Error('Consulta não encontrada')

  await supabase.from('appointments').update({
    scheduled_at: newScheduledAt,
    duration_minutes: durationMinutes ?? current.duration_minutes,
  }).eq('id', id)

  if (clinic.google_connected && current.google_event_id) {
    try {
      await updateCalendarEvent(clinic, current.google_event_id, newScheduledAt, durationMinutes ?? current.duration_minutes)
    } catch { /* silencioso */ }
  }
}

// 3. Cancelar consulta
export async function cancelAppointment(id: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) throw new Error('Clínica não encontrada')

  const supabase = createServerClient()

  const { data: current } = await supabase.from('appointments').select('*').eq('id', id).single()
  if (!current) throw new Error('Consulta não encontrada')

  await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)

  if (clinic.google_connected && current.google_event_id) {
    try { await deleteCalendarEvent(clinic, current.google_event_id) } catch { /* silencioso */ }
  }
}

// 4. Concluir consulta
export async function completeAppointment(id: string) {
  const supabase = createServerClient()
  await supabase.from('appointments').update({ status: 'completed' }).eq('id', id)
  // NÃO remove do Google Calendar — manter no histórico do médico
}

// 5. Confirmar consulta (pending → confirmed)
export async function confirmAppointment(id: string) {
  const supabase = createServerClient()
  await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', id)
}

// 6. Buscar consultas por intervalo de datas
export async function getAppointmentsByDateRange(startDate: string, endDate: string) {
  const clinic = await getCurrentClinic()
  if (!clinic) return []

  const supabase = createServerClient()
  const { data } = await supabase
    .from('appointments')
    .select('*, patients(id, nome, whatsapp, email)')
    .eq('clinic_id', clinic.id)
    .gte('scheduled_at', startDate)
    .lte('scheduled_at', endDate)
    .order('scheduled_at', { ascending: true })

  return data ?? []
}
```

### `app/actions/google.ts`

```typescript
'use server'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export async function getGoogleAuthUrl(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error('Não autenticado')

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: userId,
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function disconnectGoogle(): Promise<void> {
  const { userId } = await auth()
  if (!userId) throw new Error('Não autenticado')

  const supabase = createServerClient()
  await supabase.from('clinics').update({
    google_connected: false,
    google_access_token: null,
    google_refresh_token: null,
    google_token_expires_at: null,
  }).eq('clerk_user_id', userId)
}
```

---

## Route Handler OAuth Callback

### `app/api/auth/google/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Usuário negou acesso
  if (error) return NextResponse.redirect(new URL('/agenda?error=google_denied', request.url))

  // Validar state (proteção CSRF)
  const { userId } = await auth()
  if (!userId || state !== userId) {
    return NextResponse.redirect(new URL('/agenda?error=invalid_state', request.url))
  }

  if (!code) return NextResponse.redirect(new URL('/agenda?error=no_code', request.url))

  // Trocar code por tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) return NextResponse.redirect(new URL('/agenda?error=token_exchange_failed', request.url))

  const tokens = await tokenRes.json()

  // Salvar no banco
  const supabase = createServerClient()
  const { error: dbError } = await supabase.from('clinics').update({
    google_connected: true,
    google_access_token: tokens.access_token,
    google_refresh_token: tokens.refresh_token ?? null,
    google_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  }).eq('clerk_user_id', userId)

  if (dbError) return NextResponse.redirect(new URL('/agenda?error=save_failed', request.url))

  return NextResponse.redirect(new URL('/agenda?connected=true', request.url))
}
```

---

## Página `/agenda` (Server Component)

```typescript
// app/(dashboard)/agenda/page.tsx
import { getCurrentClinic } from '@/lib/clinic'
import { getAppointmentsByDateRange } from '@/app/actions/appointments'
import { AgendaClient } from '@/components/agenda/agenda-client'

export default async function AgendaPage({ searchParams }: { searchParams: { connected?: string; error?: string } }) {
  const clinic = await getCurrentClinic()
  if (!clinic) redirect('/onboarding')

  // Buscar consultas da semana atual
  const today = new Date()
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1))
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 6)

  const appointments = await getAppointmentsByDateRange(
    startOfWeek.toISOString(),
    endOfWeek.toISOString()
  )

  return (
    <AgendaClient
      clinic={clinic}
      initialAppointments={appointments}
      connected={searchParams.connected === 'true'}
      error={searchParams.error}
    />
  )
}
```

---

## Regras de Negócio

1. **Conflito de horário:** warning (não bloqueio hard). Médico pode criar dois agendamentos no mesmo horário se quiser.

2. **Google offline:** salvar consulta no banco com `google_event_id = null`. Exibir `Alert` com aviso. Botão "Sincronizar com Google" para tentar novamente depois.

3. **Meet link:** gerado para TODOS os tipos de consulta, não apenas teleconsulta. O médico decide se usa ou não.

4. **Reagendamento:** PATCH no mesmo evento Google (preserva event_id e Meet link). Não criar novo evento.

5. **Cancelamento:** DELETE no Google Calendar. Se retornar 404 ou 410, ignorar e prosseguir com cancelamento no banco.

6. **Fuso horário:** armazenar UTC no banco (TIMESTAMPTZ). Exibir sempre em `America/Sao_Paulo`. Nunca armazenar horário local sem timezone.

7. **Horário de trabalho:** slots fora do intervalo `working_hours_start`–`working_hours_end` ficam cinzas mas AINDA permitem agendamento (médico pode atender fora do horário se quiser).

8. **Google Workspace vs Gmail:** se a criação do `conferenceData` falhar (erro 403 ou campo ausente na resposta), criar o evento sem Meet link e exibir aviso específico: *"Conta Google pessoal pode não suportar Google Meet automático. O evento foi criado sem link."*

9. **Refresh token ausente:** se `google_refresh_token` for null (médico não autorizou `access_type=offline`), forçar reconexão com `prompt=consent`.

10. **Histórico:** consultas `completed` e `cancelled` nunca são deletadas. Ficam visíveis na agenda com estilo apagado. Filtro opcional para ocultar canceladas.

11. **Working days:** não exibir slots em dias fora de `working_days[]`. Sábado e domingo aparecem cinzas por padrão.

12. **Paciente novo vs existente:** se o Combobox cria um paciente novo, criar registro na tabela `patients` junto com a consulta (transação).

---

## Tratamento de Erros

| Código | Causa | Ação no Frontend |
|--------|-------|-----------------|
| `GOOGLE_TOKEN_REVOKED` | Refresh token revogado | Banner: "Reconecte sua Google Agenda" |
| `GOOGLE_WORKSPACE_REQUIRED` | Conta não suporta Meet | Evento criado, aviso sobre Meet |
| `GOOGLE_API_ERROR` | Calendar API offline | Consulta salva, Alert de aviso |
| `conflict_warning` | Horário próximo ocupado | Alert inline no form (não bloqueia) |
| `invalid_date` | Data no passado | Erro inline no campo |
| `invalid_whatsapp` | Formato inválido | Erro inline no campo |
| `google_denied` | Médico cancelou OAuth | Toast: "Conexão cancelada" |
| `invalid_state` | CSRF detectado | Toast: "Erro de segurança, tente novamente" |
| `supabase_error` | Banco indisponível | Toast de erro crítico |

---

## Arquivos a Criar / Modificar

```
NOVOS:
lib/google/auth.ts                          ← OAuth helpers + token refresh
lib/google/calendar.ts                      ← Calendar API wrapper completo
app/api/auth/google/callback/route.ts       ← OAuth callback handler
app/actions/appointments.ts                 ← CRUD completo de consultas
app/actions/google.ts                       ← getGoogleAuthUrl, disconnect
components/agenda/
  agenda-client.tsx                         ← Client wrapper da página
  calendar-view.tsx                         ← Grid semanal/dia
  appointment-card.tsx                      ← Card colorido no grid
  new-appointment-dialog.tsx                ← Dialog criar consulta
  appointment-detail-dialog.tsx             ← Dialog detalhe + ações
  connect-google-banner.tsx                 ← Alert de conexão
  week-navigation.tsx                       ← Navegação de semanas
  free-slots-dialog.tsx                     ← Verificar disponibilidade
  time-picker.tsx                           ← Seletor de horário (slots 30min)

MODIFICAR:
app/(dashboard)/agenda/page.tsx             ← Server Component com dados reais
types/supabase.ts                           ← Campos Google em clinics
types/index.ts                              ← Atualizar ClinicInsert/Update

SUPABASE SQL:
ALTER TABLE clinics ADD COLUMN google_connected ...
ALTER TABLE clinics ADD COLUMN google_access_token ...
ALTER TABLE clinics ADD COLUMN google_refresh_token ...
ALTER TABLE clinics ADD COLUMN google_token_expires_at ...
ALTER TABLE clinics ADD COLUMN google_calendar_id ...
ALTER TABLE clinics ADD COLUMN working_hours_start ...
ALTER TABLE clinics ADD COLUMN working_hours_end ...
ALTER TABLE clinics ADD COLUMN working_days ...
```

---

## Tarefas Atômicas de Implementação

### Plano 5a — SQL + OAuth Infrastructure

- [ ] Executar SQL de alteração da tabela `clinics` no Supabase
- [ ] Atualizar `types/supabase.ts` e `types/index.ts`
- [ ] Adicionar `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` ao `.env.local`
- [ ] Criar `lib/google/auth.ts` (getValidAccessToken com auto-refresh + revogação)
- [ ] Criar `app/actions/google.ts` (getGoogleAuthUrl, disconnectGoogle)
- [ ] Criar `app/api/auth/google/callback/route.ts` (handler com validação CSRF)
- [ ] Criar `components/agenda/connect-google-banner.tsx` (Alert Shadcn)
- [ ] Testar fluxo OAuth completo: clicar → autorizar → tokens no Supabase
- [ ] Commit: `feat: google oauth + token management`

### Plano 5b — Calendar API + Appointment Actions

- [ ] Criar `lib/google/calendar.ts` (create, update, delete, freeBusy, findFreeSlots)
- [ ] Criar `app/actions/appointments.ts` (create, reschedule, cancel, complete, confirm, list)
- [ ] Testar createCalendarEvent com evento real no Google Agenda
- [ ] Testar geração de Meet link (verificar se conta suporta)
- [ ] Testar deleteCalendarEvent ignorando 404
- [ ] Testar auto-refresh de token
- [ ] Commit: `feat: calendar api wrapper + appointment actions`

### Plano 5c — UI Agenda (Desktop)

- [ ] Instalar componentes Shadcn faltantes: `npx shadcn@latest add combobox toggle-group`
- [ ] Criar `components/agenda/week-navigation.tsx`
- [ ] Criar `components/agenda/time-picker.tsx` (slots de 30min)
- [ ] Criar `components/agenda/calendar-view.tsx` (grid 07h–20h, 5 dias)
- [ ] Criar `components/agenda/appointment-card.tsx` (cores por tipo/status)
- [ ] Criar `components/agenda/new-appointment-dialog.tsx` (form completo com FieldGroup)
- [ ] Criar `components/agenda/appointment-detail-dialog.tsx` (detalhe + ações)
- [ ] Criar `components/agenda/agenda-client.tsx` (wrapper com state management)
- [ ] Atualizar `app/(dashboard)/agenda/page.tsx` (Server Component)
- [ ] Commit: `feat: agenda ui desktop`

### Plano 5d — UI Agenda (Mobile + Find Free Time)

- [ ] Adaptar calendar-view para vista de DIA no mobile (< 768px)
- [ ] appointment-detail usa `Sheet` (bottom drawer) no mobile
- [ ] Botão flutuante "+" no mobile
- [ ] Criar `components/agenda/free-slots-dialog.tsx` (verificar disponibilidade)
- [ ] Testar swipe para navegar dias no mobile
- [ ] Testar `npm run build` sem erros
- [ ] Commit: `feat: agenda mobile + free slots`

---

## Checklist de Verificação Final

- [ ] OAuth completo: conectar → desconectar → reconectar sem erros
- [ ] Token refresh automático funciona sem que o médico perceba
- [ ] Criar consulta → evento aparece no Google Agenda em < 3s
- [ ] Link do Google Meet é gerado e funcional
- [ ] Se Gmail pessoal: exibir aviso sobre Meet, mas evento é criado
- [ ] Reagendar → mesmo evento atualizado no Google (não duplicado)
- [ ] Cancelar → evento removido do Google Agenda
- [ ] Google offline → consulta salva com Alert de aviso
- [ ] Conflito de horário → warning inline, não bloqueia
- [ ] Todos os status de consulta com Badge correto
- [ ] Formulário usa FieldGroup + Field (nunca div raw)
- [ ] ToggleGroup para tipo e duração
- [ ] Combobox para busca de paciente
- [ ] Loading com Skeleton (não animate-pulse manual)
- [ ] Dialog tem DialogTitle (acessibilidade)
- [ ] Vista de dia no mobile (< 768px)
- [ ] Botão "+" flutuante no mobile
- [ ] `npm run build` sem erros TypeScript
- [ ] Lighthouse PWA score mantido > 80

---

## Integrações Futuras (não implementar agora)

| Fase | Integração | Gatilho |
|------|-----------|---------|
| Fase 4 — Pagamentos | Ao criar consulta → gerar Stripe Checkout link | `createAppointment` retorna link |
| Fase 5 — WhatsApp | Ao confirmar → enviar Meet link + confirmação ao paciente | n8n webhook |
| Fase 5 — Lembretes | Cron 24h antes → buscar consultas → WhatsApp | n8n cron |
| Fase 3 — Prontuário | Botão "Abrir Prontuário" no detalhe → `/prontuarios/[appointment_id]` | Link interno |
| Fase 8 — Analytics | Consultas concluídas → receita do mês no dashboard | Aggregation query |
