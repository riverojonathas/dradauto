# dradauto — Cérebro do Projeto

> Abra esta pasta (`Planos/MedFlow/`) como raiz no Claude Code para ter contexto completo do projeto.
> Este arquivo é atualizado a cada sessão. Nunca apague — apenas atualize.

---

## O que é este projeto

**dradauto** é um SaaS B2B para médicos e clínicas que oferece:
- Consultório virtual completo (agenda + Google Meet)
- Prontuário médico eletrônico e anamnese digital
- Integração Whitebook (referência médica)
- Pagamentos de consulta via Stripe
- Secretária e assistente IA via WhatsApp com memória de contexto

**Público:** Médicos autônomos, clínicas pequenas e médias  
**Stack principal:** Next.js 14+ · PostgreSQL (Supabase) · Clerk · Stripe · WhatsApp Cloud API · PydanticAI · n8n

---

## Onde estão os documentos

| Documento | Caminho | Função |
|-----------|---------|--------|
| Este arquivo | `CLAUDE.md` | Contexto vivo, conhecimento acumulado, estado atual |
| Plano geral | `consultorio-medico-virtual.md` | Fases, planos de execução, checklist de progresso |
| Fase 1 — Agenda | `fase-1-agenda-google-calendar.md` | Spec completa: OAuth, Calendar API, UI, regras de negócio |
| Orquestrador de skills | `/Users/prom1/Downloads/Habilidades do Gemini/CLAUDE.md` | Selecionar/adicionar skills ao projeto |
| Catálogo de skills | `/Users/prom1/Downloads/Habilidades do Gemini/SKILLS-CATALOG.md` | 1290+ skills disponíveis |

---

## Ferramentas de desenvolvimento

| Ferramenta | Uso |
|-----------|-----|
| **antigravity** | Todo o desenvolvimento de código (implementação, testes, debug) |
| **Claude** | Evolução de planos, decisões arquiteturais, documentação, contexto |

> Mantenha ambos alinhados: ao tomar uma decisão importante no Claude, documente aqui.
> Ao implementar algo no antigravity, atualize o status da fase correspondente no plano.

---

## Status Atual

**Fase:** `5 — Pagamentos via Stripe + Magic Link`  
**Última atualização:** 2026-04-13  
**Próxima ação:** Fase 5 — Pagamentos Stripe + link de pagamento via WhatsApp  
**Design System:** Saúde Humanizada (teal — `#0D9488`) — aplicado globalmente

### Progresso das Fases

| Fase | Nome | Status |
|------|------|--------|
| 0 | Setup, Infraestrutura e Estrutura Base | ✅ Concluída |
| 1 | Multi-tenant e Onboarding do Médico | ✅ Concluída (Planos 1–2: design system, Clerk auth, onboarding) |
| 2 | Agenda + Google Meet | ✅ Concluída (Planos 5a–5d: OAuth, Calendar API, UI desktop+mobile) |
| 3 | Pacientes + Google Contacts | ✅ Concluída (Planos 6a–6d: People API, Combobox agenda, listagem, perfil) |
| 4 | Prontuário, Anamnese e Magic Link | ✅ Concluída (Planos 7a–7d: prontuário 2 colunas, anamnese pública, magic link, médico preenche durante consulta) |
| 5 | Pagamentos via Stripe + Magic Link | ⬜ Não iniciada |
| 6 | Secretária IA no WhatsApp (n8n + MCP + PydanticAI) | ⬜ Não iniciada |
| 7 | LGPD e Segurança | ⬜ Não iniciada |
| 8 | Receitas Digitais e Documentos | ⬜ Não iniciada |
| 9 | Whitebook / ANVISA (pós-MVP, condicional) | ⬜ Não iniciada |
| 10 | Painel, Dashboard e Lançamento | ⬜ Não iniciada |

**Legenda:** ⬜ Não iniciada · 🔄 Em andamento · ✅ Concluída · 🔁 Revisão necessária

---

## Skills Instaladas no Projeto

> Atualize esta lista sempre que copiar uma skill para o projeto.
> Para verificar o estado real: `ls /caminho/do/projeto/.claude/skills/`

| Status | Skill | Camada |
|--------|-------|--------|
| ✅ | `saas-mvp-launcher` | Fundação |
| ✅ | `react-nextjs-development` | Fundação |
| ✅ | `shadcn` | Fundação |
| ✅ | `clerk-auth` | Fundação |
| ✅ | `postgresql` | Fundação |
| ✅ | `google-calendar-automation` | Integrações |
| ✅ | `stripe-integration` | Integrações |
| ✅ | `payment-integration` | Integrações |
| ✅ | `whatsapp-cloud-api` | Secretária IA |
| ✅ | `pydantic-ai` | Secretária IA |
| ✅ | `conversation-memory` | Secretária IA |
| ✅ | `agent-memory-systems` | Secretária IA |
| ✅ | `llm-application-dev-ai-assistant` | Secretária IA |
| ✅ | `n8n-workflow-patterns` | Orquestração |
| ✅ | `n8n-node-configuration` | Orquestração |
| ✅ | `gdpr-data-handling` | Segurança |
| ✅ | `api-security-best-practices` | Segurança |

---

## Repositório e Infraestrutura

```
Repositório:    /Users/prom1/Downloads/dradauto/
Deploy:         (a definir — Vercel / Railway / Fly.io)
Banco:          (a definir — Supabase / Railway PostgreSQL)
Ambiente dev:   /Users/prom1/Downloads/dradauto/
```

---

## Decisões Arquiteturais

> Registre aqui toda decisão importante. Inclua data, motivo e alternativa descartada.
> Isso evita rediscutir o mesmo assunto em sessões futuras.

| Data | Decisão | Escolha | Alternativa descartada | Motivo |
|------|---------|---------|----------------------|--------|
| 2026-04-11 | Auth | Clerk | Supabase Auth | Melhor suporte a roles e multi-tenant |
| 2026-04-11 | Banco | PostgreSQL (Supabase) | MongoDB | Dados médicos são relacionais |
| 2026-04-11 | Agendamento | Google Calendar API | Cal.com | Médicos já usam Google Agenda |
| 2026-04-11 | IA Secretary | PydanticAI | LangChain | Type-safe, mais simples para tools definidas |
| 2026-04-11 | Orquestração | n8n self-hosted (Fly.io) | n8n cloud | Free tier ilimitado; cloud tem limite de workflows |
| 2026-04-11 | Tools do agente | MCP Servers | REST direto | MCP padroniza tools; agente não depende de implementação |
| 2026-04-11 | Video | Google Meet (via Calendar API) | Zoom / Whereby | Incluso na Calendar API, zero custo extra |
| 2026-04-11 | App médico | PWA (Next.js) | React Native | Custo zero, sem App Store, parece app nativo no celular |
| 2026-04-11 | Paciente | WhatsApp-first, sem conta | Portal com login | Menor fricção; magic links para anamnese, pgto, receita |
| 2026-04-11 | Whitebook | Adiado pós-MVP | Integrar no MVP | API pública não confirmada; ANVISA é alternativa gratuita |
| 2026-04-11 | Deploy Python | Vercel Python Functions | Railway separado | Mantém tudo no mesmo deploy, free tier cobre o MVP |
| 2026-04-11 | Custo MVP | R$0 fixo | Serviços pagos | Vercel+Supabase+Clerk+Fly.io free tiers suficientes para MVP |

---

## Descobertas e Aprendizados

> Registre aqui tudo que foi descoberto durante o desenvolvimento que não estava no plano original.
> Problemas encontrados, limitações de APIs, comportamentos inesperados, soluções encontradas.

- **2026-04-11 — n8n + MCP são complementares, não alternativos:** n8n orquestra fluxos por cliente (`clinic_id`), o agente IA usa MCP Servers como interface padronizada para tools (Calendar, Stripe, Supabase). Não substituir um pelo outro.
- **2026-04-11 — PydanticAI cabe no Vercel:** Vercel suporta Python Serverless Functions nativamente. Não é necessário Railway ou serviço separado para o agente Python no MVP.
- **2026-04-11 — Whitebook não tem API pública confirmada:** alternativa gratuita é ANVISA API + dataset CID-10. Decisão adiada para pós-MVP.
- **2026-04-11 — Paciente não precisa de conta:** toda jornada via WhatsApp + magic links (anamnese, pagamento, receita). Reduz fricção e complexidade.
- **2026-04-11 — Shadcn v4 usa `@base-ui/react` em vez de Radix UI:** API mudou — usar `render` em vez de `asChild` em alguns componentes. Tailwind v4 configurado via `@theme inline` no globals.css, sem `tailwind.config.js`. Componentes instalados com `npx shadcn@latest add`.
- **2026-04-12 — Combobox de paciente substituído por Input na Fase 2:** base-ui/Combobox gerou atrito ao misturar criação + seleção de pacientes. Input simples foi usado por ora. **Consequência:** pode gerar pacientes duplicados. Resolver na Fase 3 ao implementar busca de pacientes existentes.
- **2026-04-12 — Dialog mantido no mobile (Fase 2) em vez de Sheet:** Dialog Shadcn v4 já se adapta bem a telas pequenas. Sheet (bottom drawer) dispensado para reduzir dependências. Decisão válida — revisar se UX mobile for insatisfatória.
- **2026-04-12 — Skeleton desnecessário na Agenda:** Server Components carregam dados antes de enviar HTML. Skeletons só fazem sentido em Client Components com fetch assíncrono. Não implementar Skeleton na agenda.
- **2026-04-12 — Design System Teal (Saúde Humanizada):** Paleta migrada de azul genérico (#2563EB) para teal (#0D9488). Emojis banidos de toda a UI — usar apenas Lucide icons. Modal com layout estruturado (header/body/footer separados com border). Clerk Social Google habilitado via Clerk Dashboard (Use Clerk credentials). Login screen com layout split (esquerda teal + direita form). `afterSignOutUrl="/sign-in"` adicionado ao ClerkProvider.
- **2026-04-12 — `database.md` criado:** Documentação completa das 9 tabelas. Migration M001 (colunas Google em clinics) documentada como pendente de execução no Supabase.
- **2026-04-13/14 — `middleware.ts` → `proxy.ts` (breaking change Next.js):** Esta versão do Next.js deprecou `middleware.ts` em favor de `proxy.ts`. O arquivo correto é `dradauto/proxy.ts`. O `middleware.ts` foi recriado por engano 2x — causou conflito fatal. **Protocolo obrigatório:** nunca recriar `middleware.ts`; usar apenas `proxy.ts`. Verificar `ls dradauto/proxy.ts` no início de cada sessão. O `proxy.ts` tem: `clerkMiddleware` + redirecionamento manual para `/sign-in` + proteção de onboarding.
- **2026-04-13 — themeColor incorreto:** `app/layout.tsx` tinha `themeColor: "#2563EB"` (azul antigo). Corrigido para `#0D9488` (teal). Verificar sempre que o design system mudar.

---

## Contexto da Última Sessão

> Esta seção é sobrescrita a cada sessão. Mantém apenas o estado mais recente.
> **Sempre atualize ao encerrar uma sessão.**

**Data da última sessão:** 2026-04-13  
**O que foi feito:**
- `middleware.ts` recriado novamente (2ª perda — bug recorrente crítico)
- Bugs da agenda corrigidos: posição dos agendamentos (pxPerMin dinâmico via getBoundingClientRect), label da semana (âncora na segunda-feira com getMondayOf), navegação sem refetch
- Melhorias na agenda: linha do "agora", auto-scroll, indicador de hoje, loading na navegação
- Configurações de horário de trabalho: UI completa em `/configuracoes`, server action `updateClinicSettings`
- `new-appointment-dialog.tsx`: pre-preenche duração e valor das configurações da clínica
- `agenda/page.tsx`: cálculo de semana corrigido (getMondayOf, sem mutação, com setHours)
- Clerk vs Supabase Auth: decidido manter Clerk — lentidão é apenas em dev (chaves de dev), prod é ~100-200ms

**Estado da implementação:**
- Agenda desktop + mobile ✅ | posição agendamentos ✅ | navegação semana ✅
- Configurações de horário ✅ | linha do "agora" ✅ | auto-scroll ✅
- proxy.ts ✅ (arquivo correto — NÃO recriar middleware.ts)
- `lib/date-utils.ts` ✅ (isDatesSameDay, getSafeLocalTime, formatLongDate, getLocalISODate)

**O que está em andamento:** Fase 4 ✅ concluída. Pronto para Fase 5.

**Pendências para a próxima sessão:**
- ✅ Migrations M002 + M003 executadas no Supabase
- Iniciar **Fase 5** — Pagamentos via Stripe + Magic Link
- n8n no Fly.io ainda pendente (necessário antes da Fase 6 — WhatsApp)
- **ATENÇÃO:** Nunca recriar `middleware.ts` — o arquivo correto é `proxy.ts` (breaking change desta versão do Next.js)

---

## Log de Sessões

> Histórico resumido de todas as sessões. Acrescente uma linha ao encerrar cada sessão.
> Formato: `YYYY-MM-DD | Ferramenta | O que foi feito`

| Data | Ferramenta | Resumo |
|------|-----------|--------|
| 2026-04-11 | Claude | Planejamento inicial: produto, skills, arquitetura, plano de 8 fases |
| 2026-04-11 | Claude | Nome definido (dradauto), projeto criado, 17 skills copiadas para /Downloads/dradauto/ |
| 2026-04-11 | Claude | Plano evoluído: infra custo zero, jornada paciente, n8n+MCP, PWA, 9 fases detalhadas |
| 2026-04-11 | antigravity | Plano 1 concluído: Shadcn v4, design system médico, layout dashboard, estrutura base |
| 2026-04-11 | antigravity | Plano 2 concluído: Clerk auth pt-BR, middleware, onboarding 3 steps, sidebar com dados reais |
| 2026-04-12 | antigravity | Plano 3 concluído: Supabase instalado, schema 9 tabelas, tipos TS manuais, clinic sync, dashboard dinâmico |
| 2026-04-12 | antigravity | Plano 4 concluído: PWA manual (sem next-pwa), SW com allSettled, SVG icons, meta iOS — Fase 0 encerrada |
| 2026-04-12 | Claude | Spec Fase 2 (Agenda) criada: fase-1-agenda-google-calendar.md revisado com 17 skills, Google Cloud configurado |
| 2026-04-12 | antigravity | Planos 5a–5d concluídos: Google OAuth, Calendar API, UI agenda desktop+mobile — Fase 2 encerrada |
| 2026-04-12 | Claude+antigravity | Design System teal, auth Google, login redesign, database.md — polish pré-Fase 3 concluído |
| 2026-04-12 | Claude+antigravity | Fase 3 concluída: Google Contacts API, PatientSearch combobox, listagem + perfil de pacientes |
| 2026-04-13 | Claude+antigravity | Fase 4 concluída: prontuário 2 colunas, anamnese magic link, médico preenche durante consulta |
| 2026-04-13 | Claude | Auditoria Fases 0–4: middleware.ts recriado (bug crítico), themeColor corrigido, database.md atualizado |
| 2026-04-13 | Claude Code | Bugs agenda corrigidos (posição, semana, navegação), linha do agora, configurações horário, middleware.ts recriado (2ª vez) |

---

## Como Adicionar uma Nova Skill

Quando surgir uma necessidade não coberta pelas skills instaladas:

1. **Verifique** se já está instalada: `ls /caminho/do/projeto/.claude/skills/`
2. **Abra o orquestrador:** `/Users/prom1/Downloads/Habilidades do Gemini/` no Claude Code
3. **Descreva a necessidade** — o orquestrador consultará o `SKILLS-CATALOG.md` e retornará a skill certa + comando de cópia
4. **Copie a skill** para o projeto
5. **Atualize** a tabela "Skills Instaladas" acima marcando `✅`
6. **Registre** em "Decisões Arquiteturais" se a adição envolver uma escolha arquitetural

---

## Instruções para o Claude

> Leia este bloco no início de cada sessão.

- **Contexto do projeto:** Leia as seções "Status Atual", "Contexto da Última Sessão" e "Decisões Arquiteturais" antes de qualquer ação
- **Ao evoluir o plano:** Atualize `consultorio-medico-virtual.md` com as novas tarefas/fases e reflita o novo status aqui
- **Ao tomar uma decisão:** Registre imediatamente em "Decisões Arquiteturais" com data e motivo
- **Ao encerrar a sessão:** Sobrescreva "Contexto da Última Sessão" e acrescente uma linha em "Log de Sessões"
- **Ao descobrir algo novo:** Registre em "Descobertas e Aprendizados"
- **Nunca apague** decisões ou log de sessões — apenas acrescente
- **Para novas skills:** Siga o processo em "Como Adicionar uma Nova Skill"
