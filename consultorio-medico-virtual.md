# Plano de Desenvolvimento — Consultório Médico Virtual SaaS

> **Skills de planejamento utilizadas:** `writing-plans` + `saas-mvp-launcher`
> **Data:** 2026-04-11
> **Status:** Planejamento evoluído — Fases 0–4 concluídas + migração Clerk → Supabase Auth em andamento

---

## Orquestrador de Skills

> Antes de iniciar qualquer fase, consulte o orquestrador para validar as skills necessárias ou adicionar novas:
>
> **Caminho:** `/Users/prom1/Downloads/Habilidades do Gemini/CLAUDE.md`
> **Catálogo:** `/Users/prom1/Downloads/Habilidades do Gemini/SKILLS-CATALOG.md`

---

## Visão Geral do Produto

**Nome:** dradauto
**Tipo:** SaaS B2B para médicos e clínicas
**Público:** Médicos autônomos, clínicas pequenas e médias

### Funcionalidades principais

| # | Funcionalidade | Canal | Prioridade |
|---|---------------|-------|-----------|
| 1 | Agenda de pacientes integrada ao Google Agenda | Web App (PWA) | Alta |
| 2 | Consultas virtuais via Google Meet | Web App (PWA) | Alta |
| 3 | Prontuário médico eletrônico | Web App (PWA) | Alta |
| 4 | Anamnese digital pré-consulta | Magic Link (paciente) | Alta |
| 5 | Pagamento de consultas (Stripe) | WhatsApp / Magic Link | Alta |
| 6 | Secretária e assistente IA via WhatsApp | WhatsApp | Alta |
| 7 | Lembretes automáticos de consulta | WhatsApp | Alta |
| 8 | Receitas e recibos digitais | WhatsApp / PDF | Alta |
| 9 | Integração Whitebook (referência médica) | Web App | Baixa (pós-MVP) |

---

## Estratégia de Custo Zero (MVP)

> O objetivo é lançar o MVP sem custo fixo, pagando apenas por uso quando o produto gerar receita.

| Serviço | Plano | Limite gratuito | Quando começa a custar |
|---------|-------|----------------|------------------------|
| **Vercel** | Hobby (free) | 100GB bandwidth, serverless + Python functions | +$20/mês se precisar de equipe ou mais recursos |
| **Supabase** | Free | 500MB DB, 50K MAU, 1GB storage, RLS, Vault | +$25/mês ao escalar |
| **Supabase Auth (nativo)** | Incluso no Free | Integrado ao limite do projeto Supabase | Sem custo adicional específico de auth no MVP |
| **n8n** | Self-hosted Fly.io (free) | 3 VMs shared, ilimitados workflows | +$0 até crescer muito |
| **OpenAI / Anthropic** | Pay-per-use | — | ~R$0,01–0,05 por conversa WhatsApp |
| **Stripe** | — | Sem taxa fixa | 2,9% + R$0,30 por transação |
| **WhatsApp Cloud API** | Free (Meta) | 1.000 conversas/mês grátis | +$0,08 por conversa acima do limite |
| **Google Calendar API** | Free | 1M requests/dia | — |

**Total custo fixo MVP: R$0,00**
**Custo variável:** proporcional ao uso — só paga quando gerar receita.

---

## Plataformas e Apps

### Para o médico — PWA (Progressive Web App)
- Next.js configurado como PWA: manifest.json + Service Worker
- Médico adiciona ao home screen do celular: parece um app nativo
- Sem App Store, sem custo de distribuição
- Funciona offline para visualizar prontuários cacheados
- Notificações push para novas consultas (via Web Push API)

### Para o paciente — WhatsApp-first (sem conta)
O paciente **não precisa criar conta**. Toda a jornada acontece via:
- **WhatsApp**: agendamento, lembretes, confirmações, receitas
- **Magic Links**: anamnese pré-consulta, pagamento (Stripe), recibo PDF
- **Sem app, sem login, sem senha**

---

## Jornada do Paciente (sem conta)

```
Paciente envia WhatsApp para o número da clínica
         ↓
Secretária IA responde (agente PydanticAI via n8n)
         ↓
Agente coleta: nome, queixa, data preferida
         ↓
Agente verifica disponibilidade → Google Calendar API
         ↓
Agente confirma horário e envia:
  • Link de pagamento → Stripe Checkout (magic link)
  • Link de anamnese → formulário Next.js (magic link, token único por consulta)
         ↓
Paciente paga → Stripe webhook → consulta confirmada no sistema
         ↓
Paciente preenche anamnese → salva no banco vinculado à consulta
         ↓
24h antes: WhatsApp automático com lembrete + link Google Meet
         ↓
Pós-consulta: médico finaliza prontuário
         ↓
Sistema envia via WhatsApp:
  • Receita médica em PDF
  • Recibo da consulta em PDF
  • Próxima consulta (se indicada)
```

---

## Arquitetura de Serviços

### Diagrama geral

```
┌──────────────────────────────────────────────────────────────┐
│                    VERCEL (único deploy)                      │
│                                                              │
│  ┌─────────────────────┐   ┌──────────────────────────────┐  │
│  │   Next.js App       │   │   Python Functions           │  │
│  │   (PWA médico)      │   │   /api/agent/ (PydanticAI)   │  │
│  │   App Router        │   │   /api/whatsapp/webhook       │  │
│  │   Server Components │   │   /api/payments/webhook       │  │
│  └──────────┬──────────┘   └──────────────┬───────────────┘  │
└─────────────┼────────────────────────────┼──────────────────┘
              │                            │
   ┌──────────▼────────────────────────────▼──────────┐
   │              SUPABASE (free tier)                 │
   │  PostgreSQL + RLS + Vault + Storage               │
   └──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  n8n SELF-HOSTED (Fly.io)                     │
│                                                              │
│  Workflow: WhatsApp → Agente IA → Ação → Resposta            │
│                                                              │
│  Agente IA usa MCP Servers como tools:                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐  │
│  │ Calendar MCP │ │ Stripe MCP   │ │ Supabase MCP         │  │
│  │ (agendar,    │ │ (gerar link  │ │ (buscar paciente,    │  │
│  │  verificar)  │ │  de pgto)    │ │  salvar contexto)    │  │
│  └──────────────┘ └──────────────┘ └──────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Por que n8n + MCP juntos?
- **n8n** orquestra os fluxos de trabalho por cliente (`clinic_id`): recebe webhook WhatsApp, chama o agente, trata erros, envia resposta, dispara lembretes
- **MCP** é o protocolo que padroniza as tools que o agente IA usa (Calendar, Stripe, Supabase) — o agente não chama APIs diretamente, usa MCP servers
- Para **N clínicas**: workflows n8n parametrizados com `clinic_id`, cada clínica tem seu contexto isolado
- **Escalabilidade**: adicionar nova clínica = criar registro no banco, sem novo código

---

## Skills Selecionadas

### Camada 1 — Fundação do SaaS

| Skill | Finalidade |
|-------|-----------|
| `saas-mvp-launcher` | Roadmap, stack, arquitetura multi-tenant |
| `react-nextjs-development` | Frontend: Next.js 14+ App Router, PWA, Server Components |
| `shadcn` | Componentes UI: forms, calendário, prontuário |
| `postgresql` + `@supabase/ssr` | Auth nativo com Supabase + RLS por `auth.uid()` |
| `postgresql` | Schema: pacientes, prontuário, anamnese, consultas, RLS |

### Camada 2 — Integrações Principais

| Skill | Finalidade |
|-------|-----------|
| `google-calendar-automation` | Agenda + criação automática de links Google Meet |
| `stripe-integration` | Pagamento de consultas, magic links de checkout |
| `payment-integration` | Padrões PCI, webhook, recibos |

### Camada 3 — Secretária IA no WhatsApp

| Skill | Finalidade |
|-------|-----------|
| `whatsapp-cloud-api` | WhatsApp Business Cloud API (Meta): mensagens, webhooks HMAC |
| `pydantic-ai` | Agente IA type-safe via Vercel Python Functions |
| `conversation-memory` | Histórico de conversa por `whatsapp_number` no Supabase |
| `agent-memory-systems` | Perfil do paciente: preferências, histórico, padrões por clínica |
| `llm-application-dev-ai-assistant` | Fallback, rate limiting, erros de produção |

### Camada 4 — Orquestração

| Skill | Finalidade |
|-------|-----------|
| `n8n-workflow-patterns` | Fluxos: WhatsApp → IA → Calendar → Stripe → lembretes |
| `n8n-node-configuration` | Configuração correta dos nodes n8n com MCP |

### Camada 5 — Segurança e LGPD

| Skill | Finalidade |
|-------|-----------|
| `gdpr-data-handling` | LGPD: consentimento, anonimização, dados médicos sensíveis |
| `api-security-best-practices` | HMAC webhooks, rate limiting, RLS, validação |

### Skills Opcionais (pós-MVP)

| Skill | Quando adicionar |
|-------|----------------|
| `cal-com-automation` | Se adicionar agendamento self-service via link público |
| `monetization` | Na definição de planos de assinatura para médicos |
| `trpc-fullstack` | Se migrar para API totalmente type-safe |

---

## Planos de Execução (Antigravity)

> Cada plano é um prompt completo para rodar no antigravity. Marque as tarefas conforme forem concluídas.
> **Legenda:** ⬜ Pendente · ✅ Concluído · 🔄 Em andamento · ❌ Bloqueado

---

### Plano 1 — Design System + Estrutura Base
**Status:** ✅ Concluído — 2026-04-11  
**Skill principal:** `react-nextjs-development` + `shadcn`  
**Commit:** `feat: design system + dashboard layout + base structure`

> **Nota:** Shadcn v4 usa `@base-ui/react` em vez de Radix UI. API `render` em vez de `asChild` em alguns componentes. Tailwind v4 configurado via `@theme inline` no globals.css — sem tailwind.config.js.

- [x] Instalar `shadcn@latest` com detecção Tailwind v4 — usou `@base-ui/react` + `components.json`
- [x] Instalar componentes Shadcn: 14 componentes UI fundamentais instalados
- [x] Instalar `lucide-react`
- [x] Criar estrutura de pastas: `(auth)/`, `(dashboard)/`, `(public)/`, `components/layout/`, `lib/`, `types/`, `hooks/`
- [x] Definir design tokens médicos no `globals.css` (paleta azul #2563EB / slate-50 / branco)
- [x] Criar `components/layout/sidebar.tsx` (nav categorizada, item ativo, avatar no rodapé)
- [x] Criar `components/layout/header.tsx` (título dinâmico, perfil do usuário)
- [x] Criar `components/layout/mobile-nav.tsx` (drawer responsivo para mobile)
- [x] Criar `app/(dashboard)/layout.tsx` (shell sidebar + header + conteúdo)
- [x] Criar `app/(dashboard)/page.tsx` (4 cards métricas + consultas + feed atividade)
- [x] Criar páginas placeholder: `agenda/`, `pacientes/`, `prontuarios/`, `financeiro/`, `configuracoes/`
- [x] Criar páginas placeholder: `(public)/anamnese/[token]/`, `(public)/pagamento/[token]/`
- [x] Deletar `app/page.tsx` raiz (rota `/` servida pelo `(dashboard)/page.tsx`)
- [x] `npm run build` executado com sucesso — sem erros TypeScript

---

### Plano 2 — Autenticação (Histórico)
**Status:** ✅ Concluído — 2026-04-11  
**Skill principal:** `clerk-auth`  
**Commit:** `feat: clerk auth + roles + onboarding`

> **Atualização 2026-04-14:** Implementada migração para Supabase Auth no código (`proxy.ts`, layout, ações server, login/signup, logout). Plano histórico mantido para rastreabilidade.

> **Nota:** ClerkProvider configurado com suporte a `pt-BR`. Middleware com redirecionamento inteligente: não autenticado → `/sign-in`; autenticado sem onboarding → `/onboarding`; onboarding completo tentando acessar `/onboarding` → `/`.

- [x] Instalar `@clerk/nextjs`
- [x] Criar `.env.local` com variáveis Clerk + placeholders para Supabase, Stripe, WhatsApp, Google
- [x] Criar `middleware.ts` na raiz com proteção de rotas e lógica de onboarding obrigatório
- [x] Envolver `app/layout.tsx` com `<ClerkProvider>` (pt-BR)
- [x] Criar `app/(auth)/sign-in/[[...sign-in]]/page.tsx` (catch-all, visual dradauto)
- [x] Criar `app/(auth)/sign-up/[[...sign-up]]/page.tsx` (catch-all, visual dradauto)
- [x] Deletar páginas antigas `sign-in/page.tsx` e `sign-up/page.tsx`
- [x] Criar `app/actions/onboarding.ts` — Server Action salva em `publicMetadata` do Clerk
- [x] Criar `app/onboarding/page.tsx` — 3 steps: dados pessoais → clínica → configurações
- [x] Sidebar e Header conectados com `fullName`, `imageUrl`, `especialidade` reais do Clerk
- [x] Botão de logout integrado ao menu de perfil
- [x] `npm run build` executado com sucesso

---

### Plano 3 — Supabase + Schema + RLS
**Status:** ✅ Concluído — 2026-04-12  
**Skill principal:** `postgresql`  
**Commit:** `feat: supabase schema + RLS + typescript types + clinic sync`

> **Nota:** Tipos TypeScript criados manualmente (CLI requer login interativo). Dashboard é agora um Server Component consumindo dados reais da clínica via `getCurrentClinic()`. Strategy: service role exclusivamente no servidor, sem exposição ao browser.

- [x] Credenciais Supabase adicionadas ao `.env.local`
- [x] Instalar `@supabase/ssr` e `@supabase/supabase-js`
- [x] Criar `lib/supabase/server.ts` — Service Role client para servidor
- [x] Criar `lib/supabase/client.ts` — Anon Key client para browser
- [x] Criar `types/supabase.ts` — schema completo (Row/Insert/Update para 9 tabelas)
- [x] Criar `types/index.ts` — tipos de domínio, enums e tipos compostos com joins
- [x] SQL do schema executado no Supabase Dashboard (9 tabelas + índices + RLS)
- [x] Criar `lib/clinic.ts` com helper `getCurrentClinic()`
- [x] Atualizar `app/actions/onboarding.ts` — salva dados em `clinics` no Supabase após Clerk
- [x] Atualizar `app/(dashboard)/page.tsx` — dados reais da clínica (saudação, valor consulta)
- [x] `npm run build` executado com sucesso

---

### Plano 4 — PWA (Progressive Web App)
**Status:** ✅ Concluído — 2026-04-12  
**Commit:** `feat: pwa configuration`

> **Nota:** Sem pacotes externos (next-pwa incompatível com Next.js 16). Implementação manual. Ícones em SVG escalável em vez de PNG (sem dependência de canvas). Service worker usa `Promise.allSettled` para resiliência em builds dinâmicos. Bypass explícito para rotas `/api/`, Clerk e Supabase.

- [x] Criar `public/manifest.json` (standalone, theme #2563EB, shortcuts para Agenda e Pacientes)
- [x] Criar `public/icons/icon-192.svg` e `icon-512.svg` (SVG com logo dradauto)
- [x] Criar `public/sw.js` — service worker com cache do shell + bypass de auth/API
- [x] Criar `components/shared/pwa-register.tsx` — Client Component com registro seguro via `useEffect`
- [x] Atualizar `app/layout.tsx` — `metadata.manifest`, `metadata.appleWebApp`, export `viewport`
- [x] Injetar `<PWARegister />` no `RootLayout`
- [x] `npm run build` executado com sucesso

---

## Plano de Desenvolvimento — Fases e Tarefas

> Metodologia: `writing-plans` — cada tarefa é atômica (2–5 min), com commit ao final de cada etapa.

---

### Fase 0 — Setup, Infraestrutura e Estrutura Base
**Status:** ✅ Concluída via Planos 1–4

> Concluída pelos 4 planos de execução Antigravity. Ver seção "Planos de Execução" para detalhes.

| Sub-fase | Plano | Status |
|----------|-------|--------|
| 0a — Next.js + Shadcn + design system | Plano 1 | ✅ |
| 0b — Auth + onboarding (histórico Clerk) | Plano 2 | ✅ |
| 0c — Supabase schema + RLS + tipos | Plano 3 | ✅ |
| 0d — PWA manifest + service worker | Plano 4 | ✅ |
| 0e — n8n Fly.io | — | ⬜ (iniciar antes da Fase 5) |

---

### Fase 1 — Multi-tenant e Onboarding do Médico

> Objetivo: médico cria conta → configura clínica → acessa painel vazio.

- [x] Implementar login/signup com Supabase Auth
- [ ] Criar tabela `clinics` com: nome, logo, CRM, especialidade, valor_consulta, whatsapp_number
- [ ] Criar fluxo de onboarding: 3 steps (dados pessoais → dados da clínica → configurações)
- [x] Vincular usuário autenticado ao registro da clínica no Supabase (`clerk_user_id` temporário + `user_id` em migração)
- [ ] Criar layout do painel: sidebar, header, área de conteúdo
- [x] Testar: médico cria conta → preenche onboarding → acessa painel
- [ ] Commit: `feat: multi-tenant onboarding`

---

### Fase 2 — Agenda de Pacientes + Google Meet

> Objetivo: médico agenda consulta → evento no Google Agenda com link Meet.

- [ ] Criar OAuth 2.0 para Google Calendar (escopos: `calendar.events`, `calendar.readonly`)
- [ ] Salvar tokens de acesso por médico no Supabase Vault (criptografado)
- [ ] Implementar `POST /api/appointments` → cria evento no Google Calendar
- [ ] Ativar `conferenceData: { createRequest }` → gera link Google Meet automaticamente
- [ ] Criar UI de agenda: calendário semanal com Shadcn/Calendar
- [ ] Criar página de detalhes da consulta (paciente, link Meet, status)
- [ ] Testar: médico agenda → evento aparece no Google Agenda com link Meet
- [ ] Commit: `feat: google calendar + meet integration`

---

### Fase 3 — Prontuário, Anamnese e Magic Link do Paciente

> Objetivo: prontuário preenchido pelo médico + anamnese preenchida pelo paciente via link.

#### 3a — Schema e prontuário
- [ ] Schema `medical_records`: queixas, hipóteses diagnósticas, CID-10, prescrição, observações, anexos
- [ ] Schema `anamnesis`: histórico familiar, alergias, medicamentos em uso, antecedentes, hábitos
- [ ] Criar UI do prontuário: form step-by-step (Shadcn/Form + React Hook Form + Zod)
- [ ] Commit: `feat: medical records schema + UI`

#### 3b — Anamnese via magic link
- [ ] Ao criar consulta, gerar token único de anamnese (`uuid`, expiração 48h) salvo no banco
- [ ] Criar rota pública `/anamnese/[token]` (sem login) — paciente preenche formulário
- [ ] Formulário de anamnese: dados básicos + histórico + alergias + medicamentos
- [ ] Ao submeter: salvar no banco, marcar token como usado, notificar médico via WhatsApp
- [ ] Médico visualiza anamnese na tela de consulta antes de iniciar o atendimento
- [ ] Testar: médico cria consulta → paciente recebe magic link → preenche anamnese → médico visualiza
- [ ] Commit: `feat: anamnesis magic link flow`

#### 3c — Busca de pacientes
- [ ] Implementar busca de pacientes com paginação por `clinic_id`
- [ ] Histórico de consultas por paciente
- [ ] Commit: `feat: patient search + history`

---

### Fase 4 — Pagamentos via Stripe + Magic Link

> Objetivo: paciente recebe link de pagamento via WhatsApp → paga → consulta confirmada.

- [ ] Configurar Stripe (chaves, webhook endpoint, produto "Consulta")
- [ ] Implementar `POST /api/payments/checkout` → cria sessão Stripe Checkout com `appointment_id` nos metadata
- [ ] Gerar magic link de pagamento por consulta (Stripe Checkout URL)
- [ ] Configurar webhook `checkout.session.completed` → atualiza status da consulta para `confirmed`
- [ ] Ao confirmar pagamento: enviar magic link de anamnese via WhatsApp automaticamente
- [ ] Gerar recibo em PDF após pagamento (usando `@react-pdf/renderer`)
- [ ] Enviar recibo PDF via WhatsApp após consulta realizada
- [ ] Testar: paciente recebe link → paga → consulta confirmada → anamnese enviada → recibo gerado
- [ ] Commit: `feat: stripe payment + receipt flow`

---

### Fase 5 — Secretária IA no WhatsApp (n8n + PydanticAI + MCP)

> Objetivo: paciente conversa com a secretária IA via WhatsApp e agenda consulta completa.

#### 5a — Infraestrutura WhatsApp
- [ ] Criar conta WhatsApp Business Cloud API no Meta Developers
- [ ] Criar número de telefone de negócios no Meta
- [ ] Configurar webhook `POST /api/whatsapp/webhook` com verificação HMAC-SHA256
- [ ] Criar template de mensagem aprovado pela Meta: confirmação de consulta
- [ ] Testar: enviar mensagem → webhook recebe payload no Vercel
- [ ] Commit: `feat: whatsapp webhook infrastructure`

#### 5b — MCP Servers das tools do agente
- [ ] Implementar `calendar-mcp-server`: tools `check_availability`, `create_appointment`, `cancel_appointment`
- [ ] Implementar `stripe-mcp-server`: tools `create_payment_link`, `check_payment_status`
- [ ] Implementar `supabase-mcp-server`: tools `get_patient`, `save_conversation`, `get_clinic_config`
- [ ] Testar cada MCP server isoladamente
- [ ] Commit: `feat: mcp servers for agent tools`

#### 5c — Agente IA (PydanticAI via Vercel Python Functions)
- [ ] Criar `api/agent/index.py` — Vercel Python Function com PydanticAI
- [ ] Definir `SecretariaAgent` com as tools MCP:
  - `agendar_consulta(paciente, data, clinic_id)`
  - `cancelar_consulta(consulta_id)`
  - `consultar_disponibilidade(clinic_id, data)`
  - `informar_valor_consulta(clinic_id)`
  - `enviar_link_pagamento(consulta_id, whatsapp_number)`
  - `enviar_link_anamnese(consulta_id, whatsapp_number)`
- [ ] System prompt: secretária com nome personalizável por clínica (campo em `clinics`)
- [ ] Testar: enviar "quero agendar" → agente interpreta → coleta dados → agenda
- [ ] Commit: `feat: pydantic-ai secretary agent`

#### 5d — Memória de Contexto
- [ ] `conversation-memory`: salvar histórico por `whatsapp_number` + `clinic_id` no Supabase
- [ ] `agent-memory-systems`: perfil do paciente — preferências de horário, histórico de consultas
- [ ] Testar: paciente retorna → agente lembra nome e último atendimento
- [ ] Commit: `feat: persistent conversation memory`

#### 5e — Orquestração n8n
- [ ] Workflow principal: `WhatsApp Webhook → Agente IA → Resposta WhatsApp`
- [ ] Workflow lembretes: `Cron 24h antes → buscar consultas → enviar WhatsApp`
- [ ] Workflow fallback: se agente falhar → mensagem de erro amigável + notifica médico
- [ ] Todos os workflows parametrizados com `clinic_id`
- [ ] Testar fluxo completo de ponta a ponta para 2 clínicas distintas
- [ ] Commit: `feat: n8n orchestration + reminders`

---

### Fase 6 — LGPD e Segurança

> Objetivo: conformidade com dados médicos sensíveis.

- [ ] Consentimento LGPD no magic link de anamnese (checkbox explícito antes do formulário)
- [ ] Criar tabela `privacy_consents` com timestamp, versão dos termos, `whatsapp_number`
- [ ] RLS revisado: nenhuma query retorna dados fora do `clinic_id` do usuário autenticado
- [ ] Supabase Vault ativo para campos sensíveis do prontuário (prescrição, diagnóstico)
- [ ] Validar todos os webhooks com HMAC: Stripe + WhatsApp
- [ ] Rate limiting nas rotas públicas (`/api/whatsapp/webhook`, `/anamnese/[token]`)
- [ ] Logs de auditoria: tabela `audit_logs` para acesso ao prontuário
- [ ] Testar: acesso sem token bloqueado, logs registrados, RLS funcionando
- [ ] Commit: `feat: lgpd compliance + security hardening`

---

### Fase 7 — Receitas Digitais e Documentos

> Objetivo: médico gera receita → paciente recebe via WhatsApp.

- [ ] Criar template de receita médica em PDF (`@react-pdf/renderer`)
  - Campos: cabeçalho clínica, dados paciente, medicamentos, posologia, CRM médico, data
- [ ] Criar template de recibo de consulta em PDF
- [ ] Endpoint `POST /api/documents/receita` → gera PDF → upload no Supabase Storage
- [ ] Gerar URL pública temporária (assinada, expira em 7 dias) para envio via WhatsApp
- [ ] Médico clica "Enviar Receita" → PDF gerado → link enviado via WhatsApp automaticamente
- [ ] Testar: médico gera receita → PDF salvo no Storage → paciente recebe link no WhatsApp
- [ ] Commit: `feat: digital prescriptions + documents`

---

### Fase 8 — Whitebook (pós-MVP, condicional)

> Nota: depende de API pública da Whitebook. Avaliar alternativas se necessário:
> - ANVISA API (medicamentos, bulas): pública e gratuita
> - TUSS/CBHPM (procedimentos médicos): pública
> - CID-10: dataset público disponível para download

- [ ] Verificar se Whitebook possui API pública e obter credenciais
- [ ] **Alternativa A (se Whitebook tiver API):** criar wrapper `lib/whitebook.ts` com autocomplete de medicamentos no prontuário
- [ ] **Alternativa B (sem Whitebook):** integrar ANVISA API + dataset CID-10 local (custo zero)
- [ ] Integrar busca na tela de prontuário (campo de prescrição com autocomplete)
- [ ] Commit: `feat: drug reference integration`

---

### Fase 9 — Painel, Dashboard e Lançamento

> Objetivo: painel operacional + deploy em produção.

- [ ] Dashboard do médico: próximas consultas do dia, pacientes pendentes, receita do mês
- [ ] Configurações da clínica: nome da secretária IA, valor da consulta, horários disponíveis
- [ ] Página de agenda completa com filtros (dia/semana/mês)
- [ ] Configurar domínio personalizado no Vercel + SSL automático
- [ ] Executar checklist de lançamento do `saas-mvp-launcher`
- [ ] Monitoramento: Vercel Analytics + Supabase Dashboard
- [ ] Testar fluxo completo com usuário real (médico beta)
- [ ] Commit: `feat: dashboard + production deploy`

---

## Checklist de Skills Instaladas

```bash
ORIGEM="/Users/prom1/Downloads/Habilidades do Gemini"
DESTINO="/Users/prom1/Downloads/dradauto/.claude/skills"

# Verificar o que está instalado
for skill in saas-mvp-launcher react-nextjs-development shadcn clerk-auth postgresql \
  google-calendar-automation stripe-integration payment-integration \
  whatsapp-cloud-api pydantic-ai conversation-memory agent-memory-systems \
  llm-application-dev-ai-assistant n8n-workflow-patterns n8n-node-configuration \
  gdpr-data-handling api-security-best-practices; do
  [ -d "$DESTINO/$skill" ] && echo "✓ $skill" || echo "✗ $skill ← não instalada"
done
```

---

## Decisões Arquiteturais

| Data | Decisão | Escolha | Alternativa descartada | Motivo |
|------|---------|---------|----------------------|--------|
| 2026-04-11 | Auth | Clerk | Supabase Auth | Clerk tem melhor suporte a roles e multi-tenant |
| 2026-04-14 | Auth (migração) | Supabase Auth | Clerk | Melhor alinhamento com RLS e menor complexidade operacional/custo |
| 2026-04-11 | Banco | PostgreSQL (Supabase) | MongoDB | Dados médicos são relacionais |
| 2026-04-11 | Agendamento | Google Calendar API | Cal.com | Médicos já usam Google Agenda |
| 2026-04-11 | IA Secretary | PydanticAI | LangChain | Type-safe, mais simples para agents com tools definidas |
| 2026-04-11 | Orquestração | n8n self-hosted (Fly.io) | n8n cloud | Fly.io free tier = custo zero; cloud tem limite de workflows |
| 2026-04-11 | Tools do agente | MCP Servers | Chamadas REST diretas | MCP padroniza interface; facilita trocar implementação sem mudar o agente |
| 2026-04-11 | Video | Google Meet (via Calendar) | Zoom / Whereby | Já incluído na Calendar API, zero custo |
| 2026-04-11 | App médico | PWA (Next.js) | React Native / Expo | Custo zero, sem App Store, funciona no celular como app nativo |
| 2026-04-11 | Paciente | WhatsApp-first, sem conta | Portal web com login | Menor fricção; paciente já usa WhatsApp |
| 2026-04-11 | Whitebook | Adiado pós-MVP | Integrar no MVP | API pública não confirmada; ANVISA é alternativa gratuita |
| 2026-04-11 | Python + Vercel | Vercel Python Functions | Railway separado | Mantém tudo no mesmo deploy; free tier cobre o MVP |
| 2026-04-11 | Deploy | Vercel (único) | Vercel + Railway | Custo zero; Python functions nativas no Vercel eliminam serviço extra |

---

## Notas sobre Multi-cliente (N Clínicas)

Para suportar múltiplas clínicas sem custo adicional:

1. **Banco (Supabase + RLS):** toda tabela tem `clinic_id`. RLS garante que cada médico só vê seus dados
2. **n8n (workflows parametrizados):** cada execução recebe `clinic_id` como variável. Um único workflow serve todas as clínicas
3. **Agente IA:** recebe configuração da clínica (nome secretária, valor consulta, horários) via MCP `get_clinic_config`
4. **WhatsApp:** cada clínica usa seu próprio número WhatsApp Business (gerenciado pelo médico)
5. **Escalabilidade:** adicionar nova clínica = criar registro em `clinics` + conectar Google Calendar + WhatsApp Business

