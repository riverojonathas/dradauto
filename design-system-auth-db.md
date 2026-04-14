# Design System + Auth + Layout — dradauto

> **Data:** 2026-04-12  
> **Identidade escolhida:** B — Saúde Humanizada (teal/verde-azulado)  
> **Depende de:** Fase 0 concluída (Shadcn v4, Clerk, Supabase, estrutura de pastas)  
> **Executar antes de:** Fase 3 (Prontuário)

---

## Diagnóstico: O que está errado hoje

| Problema | Arquivo | Linha |
|---------|---------|-------|
| Emojis no ToggleGroup de tipo de consulta | `components/agenda/new-appointment-dialog.tsx` | 141–143 |
| Dashboard mostra `clinic?.especialidade` bruto no card (exibe "e23es23") | `components/dashboard/dashboard-content.tsx` | 107 |
| `bg-blue-50/50` na sidebar ainda usa azul antigo | `components/layout/sidebar.tsx` | 79 |
| `text-primary`, `bg-blue-100`, `ring-blue-...` espalhados — perderão consistência ao trocar cor | múltiplos arquivos | — |
| Login screen sem Google Social Login | `app/(auth)/sign-in/[[...sign-in]]/page.tsx` | — |
| Layout da tela de login sem fundo visual, textos truncados | `app/(auth)/sign-in/[[...sign-in]]/page.tsx` | — |
| `afterSignOutUrl` não configurado no ClerkProvider | `app/layout.tsx` | — |

---

## Parte 1 — Novo Design System (Saúde Humanizada)

### 1.1 Substituição completa do `globals.css`

Substituir TODO o bloco `:root { ... }` em `app/globals.css`:

```css
@import "tailwindcss";

@plugin "tailwindcss-animate";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);

  --color-background: var(--background);
  --color-foreground: var(--foreground);

  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);

  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);

  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);

  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);

  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);

  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);

  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);

  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);

  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);

  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;

  @keyframes accordion-down {
    from { height: 0; }
    to { height: var(--radix-accordion-content-height); }
  }
  @keyframes accordion-up {
    from { height: var(--radix-accordion-content-height); }
    to { height: 0; }
  }
}

@layer base {
  :root {
    /* =====================================================
       dradauto — Saúde Humanizada
       Teal como cor primária: cuidado, confiança, saúde
       ===================================================== */

    /* Superfícies */
    --background: #F7FAFA;        /* off-white com toque teal */
    --foreground: #0F172A;        /* slate-900 — texto principal */

    --card: #FFFFFF;
    --card-foreground: #0F172A;

    --popover: #FFFFFF;
    --popover-foreground: #0F172A;

    /* Primária — teal-600 */
    --primary: #0D9488;
    --primary-foreground: #FFFFFF;

    /* Secundária — teal-50 */
    --secondary: #F0FDFA;
    --secondary-foreground: #134E4A;

    /* Muted — slate neutro */
    --muted: #F1F5F9;
    --muted-foreground: #64748B;

    /* Accent — teal-100 (hover states, selected) */
    --accent: #CCFBF1;
    --accent-foreground: #0F766E;

    /* Destructivo */
    --destructive: #EF4444;
    --destructive-foreground: #FFFFFF;

    /* Bordas e inputs */
    --border: #E2E8F0;
    --input: #E2E8F0;
    --ring: #0D9488;

    /* Raio padrão */
    --radius: 0.75rem;

    /* Status semânticos */
    --success: #10B981;
    --success-bg: #ECFDF5;
    --success-fg: #065F46;
    --warning: #F59E0B;
    --warning-bg: #FFFBEB;
    --warning-fg: #92400E;
    --danger: #EF4444;
    --danger-bg: #FEF2F2;
    --danger-fg: #991B1B;
    --info: #0D9488;
    --info-bg: #F0FDFA;
    --info-fg: #0F766E;

    /* Layout */
    --sidebar-width: 280px;
    --header-height: 72px;

    /* Charts */
    --chart-1: #0D9488;
    --chart-2: #14B8A6;
    --chart-3: #2DD4BF;
    --chart-4: #5EEAD4;
    --chart-5: #99F6E4;
  }

  .dark {
    --background: #0A1A1A;
    --foreground: #F0FDFA;

    --card: #0F2626;
    --card-foreground: #F0FDFA;

    --popover: #0F2626;
    --popover-foreground: #F0FDFA;

    --primary: #14B8A6;
    --primary-foreground: #042F2E;

    --secondary: #134E4A;
    --secondary-foreground: #CCFBF1;

    --muted: #134E4A;
    --muted-foreground: #94A3B8;

    --accent: #134E4A;
    --accent-foreground: #CCFBF1;

    --destructive: #EF4444;
    --destructive-foreground: #F8FAFC;

    --border: #1F3A3A;
    --input: #1F3A3A;
    --ring: #14B8A6;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans antialiased;
  }
}
```

---

### 1.2 Regras de Design — NUNCA violar

```
❌ PROIBIDO — nunca fazer isso
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Emojis em qualquer elemento de UI (botões, badges, labels, toggles)
- Ícones hardcoded com classes de cor "blue-*" (usar sempre "text-primary")
- Texto de status hardcoded em português sem Badge
- alert() nativo do browser — usar toast ou Alert do Shadcn
- bg-blue-50, bg-blue-100, text-blue-600 etc — substituir por bg-accent, text-primary
- Padding < p-5 em cards principais
- Padding < p-6 em Dialogs/modals
- Fontes menores que text-xs para labels de campo

✅ OBRIGATÓRIO — sempre fazer isso
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Ícones: somente Lucide React, tamanho size-4 (inline) ou size-5 (standalone)
- Status: sempre com <Badge> com as classes de cor semântica
- Loading: <Loader2 className="animate-spin size-4" /> dentro do botão
- Labels de campo: <Label> do Shadcn, nunca div/span raw
- Dialogs: sempre <DialogTitle> (obrigatório para acessibilidade)
- Cards: border-border/60 shadow-sm hover:shadow-md transition-shadow
- Hierarquia de texto:
    Título de página:   text-2xl font-bold text-foreground
    Título de seção:    text-xl font-semibold text-foreground
    Label:              text-sm font-medium text-slate-700
    Body:               text-sm text-foreground
    Caption/hint:       text-xs text-muted-foreground
```

---

### 1.3 Ícones corretos para tipo de consulta

Substituir emojis pelos ícones Lucide correspondentes em `new-appointment-dialog.tsx`:

```tsx
import { Stethoscope, RefreshCw, Video } from 'lucide-react'

// Tipo de consulta — ToggleGroup SEM emojis
<ToggleGroup value={tipo} onValueChange={(v) => v && setTipo(v)} className="justify-start gap-2">
  <ToggleGroupItem value="consulta" className="gap-2">
    <Stethoscope className="size-4" />
    Consulta
  </ToggleGroupItem>
  <ToggleGroupItem value="retorno" className="gap-2">
    <RefreshCw className="size-4" />
    Retorno
  </ToggleGroupItem>
  <ToggleGroupItem value="teleconsulta" className="gap-2">
    <Video className="size-4" />
    Teleconsulta
  </ToggleGroupItem>
</ToggleGroup>
```

---

### 1.4 Fix no Dashboard — card "Valor da Consulta"

Em `components/dashboard/dashboard-content.tsx`, linha 107:

```tsx
// Antes (exibe dado bruto do banco)
trend: clinic?.especialidade || "Médico",

// Depois (label neutro, não expõe dado técnico)
trend: "por consulta",
```

---

### 1.5 Atualizar cores fixas na Sidebar

Em `components/layout/sidebar.tsx`:

```tsx
// Antes
"text-primary bg-blue-50/50"

// Depois
"text-primary bg-accent/50"

// Antes (AvatarFallback)
className="bg-blue-100 text-primary text-xs font-bold"

// Depois
className="bg-accent text-primary text-xs font-bold"
```

---

### 1.6 Atualizar cores fixas no Header

Em `components/layout/header.tsx`:

```tsx
// Antes
className="bg-slate-50/80 backdrop-blur-md"

// Depois — fundo levemente teal, mais identidade
className="bg-background/80 backdrop-blur-md border-b border-border/50"

// Antes (AvatarFallback)
className="bg-blue-100 text-primary text-sm font-bold"

// Depois
className="bg-accent text-primary text-sm font-bold"

// Antes (Bell hover)
className="relative size-11 text-slate-500 rounded-2xl hover:bg-white/80"

// Depois
className="relative size-11 text-muted-foreground rounded-2xl hover:bg-accent/50"
```

---

### 1.7 Melhorar o modal Nova Consulta — layout e padding

Substituir `DialogContent` em `new-appointment-dialog.tsx`:

```tsx
<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden">
    <DialogHeader className="px-8 pt-8 pb-6 border-b border-border/50">
      <DialogTitle className="text-xl font-bold">Nova Consulta</DialogTitle>
      <DialogDescription className="text-sm text-muted-foreground mt-1">
        {initialDate?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </DialogDescription>
    </DialogHeader>

    <div className="px-8 py-6 flex flex-col gap-5 max-h-[60vh] overflow-y-auto">
      {/* campos aqui — manter lógica existente, só atualizar o wrapper */}
    </div>

    {conflict && (
      <div className="px-8 pb-2">
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Conflito de Horário</AlertTitle>
          <AlertDescription>
            Já existe uma consulta próxima. Clique "Confirmar mesmo assim" para prosseguir.
          </AlertDescription>
        </Alert>
      </div>
    )}

    <DialogFooter className="px-8 py-6 border-t border-border/50 bg-muted/30">
      <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
        Cancelar
      </Button>
      <Button onClick={handleSubmit} disabled={isLoading || !patientName || !whatsapp}>
        {isLoading && <Loader2 className="size-4 animate-spin" />}
        {conflict ? 'Confirmar mesmo assim' : 'Criar Consulta'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Parte 2 — Fixes de Layout

### 2.1 Header height CSS variable

Em `app/(dashboard)/layout.tsx`, o `mt-[--header-height]` pode não estar funcionando corretamente em todos os contextos do Tailwind v4. Garantir que use a sintaxe correta:

```tsx
// Verificar e corrigir se necessário:
// Antes
<main className="flex-1 mt-[--header-height] p-8 md:p-10 ...">

// Tailwind v4 aceita a sintaxe acima, mas se não funcionar, usar:
<main className="flex-1 pt-[72px] p-8 md:p-10 ...">
// (72px = valor de --header-height)
```

Além disso, o header deve ter a mesma altura declarada na CSS variable. Verificar se `h-[--header-height]` no header e `mt-[--header-height]` no main batem.

### 2.2 Barra de pesquisa colada na borda

A barra de pesquisa no header está alinhada à direita. Em telas onde a sidebar não existe (mobile), o header ocupa `w-full` mas o `px-10 md:px-12` pode não ser suficiente. Verificar e aumentar padding lateral se necessário:

```tsx
// No header, o input de busca:
className="h-11 w-80 lg:w-96 rounded-xl border border-border bg-white/70 pl-11 pr-4 text-sm ..."
```

### 2.3 Título da página em cada rota

O layout atual não passa o título dinâmico para o header — o header sempre recebe `title="Dashboard"`. Cada página deve ter seu próprio `<h1>` visible (não dependendo do header para isso):

```tsx
// Em cada page.tsx, adicionar no topo do conteúdo:
<div className="flex items-center justify-between mb-8">
  <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
  {/* ações da página */}
</div>
```

---

## Parte 3 — Autenticação

### 3.1 Google Social Login via Clerk

**Configuração no Clerk Dashboard (passo a passo):**

1. Acesse https://dashboard.clerk.com
2. Selecione seu projeto dradauto
3. Menu lateral → **"User & Authentication"** → **"Social Connections"**
4. Encontre **Google** → clique no toggle para **Enable**
5. Escolha: **Use Clerk credentials** (mais fácil para dev) ou **Use custom credentials** (produção)
   - Para dev/MVP: usar **Clerk credentials** — zero configuração adicional
6. Salvar

Após habilitar no Clerk Dashboard, o componente `<SignIn />` automaticamente exibe o botão "Continuar com Google". **Nenhuma mudança de código é necessária** — o Clerk cuida de tudo.

### 3.2 Redesenho da tela de Login

Substituir `app/(auth)/sign-in/[[...sign-in]]/page.tsx`:

```tsx
import { SignIn } from '@clerk/nextjs'
import { Stethoscope } from 'lucide-react'

export default function SignInPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Lado esquerdo — identidade visual */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-white">
        <div className="flex items-center gap-3">
          <Stethoscope className="size-8" />
          <span className="text-2xl font-bold tracking-tight">dradauto</span>
        </div>

        <div className="flex flex-col gap-6">
          <blockquote className="text-3xl font-light leading-relaxed text-white/90">
            "Sua agenda, seus pacientes e sua secretária — tudo em um só lugar."
          </blockquote>
          <p className="text-white/60 text-sm">
            Consultório virtual completo para médicos modernos.
          </p>
        </div>

        <div className="text-white/40 text-xs">
          © 2026 dradauto — Todos os direitos reservados
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="flex flex-col items-center justify-center px-8 py-12 bg-background">
        {/* Logo no mobile */}
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <Stethoscope className="size-7 text-primary" />
          <span className="text-2xl font-bold text-primary tracking-tight">dradauto</span>
        </div>

        <div className="w-full max-w-[440px] flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h1>
            <p className="text-sm text-muted-foreground">
              Entre na sua conta para continuar
            </p>
          </div>

          <SignIn
            fallbackRedirectUrl="/"
            signUpUrl="/sign-up"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 p-0 bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border border-border rounded-xl h-12 font-medium text-sm hover:bg-accent/30 transition-colors",
                formButtonPrimary: "bg-primary hover:bg-primary/90 rounded-xl h-12 font-semibold",
                formFieldInput: "border-border rounded-xl h-12 focus:ring-2 focus:ring-ring",
                footerActionLink: "text-primary hover:text-primary/80 font-medium",
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
```

Aplicar o mesmo padrão para `app/(auth)/sign-up/[[...sign-up]]/page.tsx`.

### 3.3 ClerkProvider — configurar afterSignOutUrl

Em `app/layout.tsx`, adicionar `afterSignOutUrl` para evitar loop de redirect e problemas de cache:

```tsx
// Localizar o <ClerkProvider> e adicionar:
<ClerkProvider afterSignOutUrl="/sign-in">
  {children}
</ClerkProvider>
```

### 3.4 Problema de cache do Clerk

O "precisa limpar o cache" geralmente vem de cookies stale do Clerk. A solução correta é:

1. `afterSignOutUrl="/sign-in"` já resolve o mais comum
2. Em desenvolvimento, se persistir: adicionar `signInUrl` e `signUpUrl` ao ClerkProvider:

```tsx
<ClerkProvider
  afterSignOutUrl="/sign-in"
  signInUrl="/sign-in"
  signUpUrl="/sign-up"
>
```

---

## Parte 4 — Documentação do Banco de Dados

### 4.1 Criar o arquivo `database.md`

Criar `/Users/prom1/Downloads/dradauto/database.md` com a documentação completa:

```markdown
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

## Migrations Pendentes

> Executar no Supabase SQL Editor ou via MCP

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

**Status:** ⬜ Pendente — executar antes de testar OAuth do Google

---

## Como Atualizar Este Documento

- Sempre que uma migration for criada, adicionar em "Migrations Pendentes"
- Quando executada, marcar como ✅ e mover para uma seção "Migrations Aplicadas"
- Quando uma coluna for adicionada, atualizar a tabela correspondente
- Também atualizar `types/supabase.ts` para refletir as mudanças
```

---

## Tarefas Atômicas

### Plano A — Design System + Fixes

- [ ] Substituir `:root { ... }` completo no `globals.css` (paleta teal)
- [ ] Remover emojis do `new-appointment-dialog.tsx` → substituir por ícones Lucide
- [ ] Fix no dashboard: `clinic?.especialidade` → `"por consulta"`
- [ ] Substituir `bg-blue-50/50` por `bg-accent/50` na sidebar
- [ ] Substituir `bg-blue-100` por `bg-accent` nos AvatarFallback (sidebar + header)
- [ ] Atualizar `new-appointment-dialog.tsx`: layout modal com `p-0 gap-0`, header separado, footer com bg-muted
- [ ] Verificar e corrigir `mt-[--header-height]` no dashboard layout
- [ ] `npm run build` sem erros após todas as mudanças
- [ ] Commit: `design: teal design system + modal polish + emoji removal`

### Plano B — Auth

- [ ] **No Clerk Dashboard**: habilitar Google Social Connection (Use Clerk credentials)
- [ ] Redesenhar `app/(auth)/sign-in/[[...sign-in]]/page.tsx` com layout split (esquerda teal + direita form)
- [ ] Redesenhar `app/(auth)/sign-up/[[...sign-up]]/page.tsx` com mesmo padrão
- [ ] Adicionar `afterSignOutUrl="/sign-in"` + `signInUrl` + `signUpUrl` ao `<ClerkProvider>` em `app/layout.tsx`
- [ ] Testar login com Google → deve redirecionar para `/` após autenticação
- [ ] Testar logout → deve redirecionar para `/sign-in` sem precisar limpar cache
- [ ] Commit: `feat: google login + redesign auth screens`

### Plano C — Database

- [ ] Criar `/Users/prom1/Downloads/dradauto/database.md` com conteúdo acima
- [ ] Executar migration M001 (colunas Google) no Supabase SQL Editor
- [ ] Atualizar `types/supabase.ts` — adicionar colunas Google na interface `clinics`
- [ ] Atualizar `types/index.ts` — adicionar campos Google em `ClinicInsert`/`ClinicUpdate`
- [ ] Commit: `docs: database documentation + google columns migration`

---

## Checklist de Verificação Final

- [ ] Nenhum emoji visível na interface
- [ ] Cores teal em todos os elementos: primary buttons, links, indicadores ativos, focus rings
- [ ] Dashboard card "Valor da Consulta" mostra "por consulta" não o especialidade raw
- [ ] Login screen: layout split funcionando, botão Google visível
- [ ] Logout redireciona para `/sign-in` corretamente, sem loop
- [ ] Modal Nova Consulta: padding generoso, sem emojis, layout estruturado com header/body/footer
- [ ] `npm run build` passando sem erros TypeScript
- [ ] `database.md` criado e reflete estado atual do banco
