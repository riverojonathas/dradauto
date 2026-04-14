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
**Stack principal:** Next.js 14+ · PostgreSQL (Supabase) · Supabase Auth · Stripe · WhatsApp Cloud API · PydanticAI · n8n

---

## Onde estão os documentos

| Documento | Caminho | Função |
|-----------|---------|--------|
| Este arquivo | `CLAUDE.md` | Contexto vivo, conhecimento acumulado, estado atual |
| Plano geral | `consultorio-medico-virtual.md` | Fases, planos de execução, checklist de progresso |
| Fase 1 — Agenda | `fase-1-agenda-google-calendar.md` | Spec completa: OAuth, Calendar API, UI, regras de negócio |
| Commits e pushes | `commits-e-pushes.md` | Histórico oficial de commits/pushes + status de publicação |
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
**Última atualização:** 2026-04-14  
**Próxima ação:** Fechar migração Auth (SQL/RLS) e retomar Fase 5 — Pagamentos Stripe + link de pagamento via WhatsApp  
**Design System:** Saúde Humanizada (teal — `#0D9488`) — aplicado globalmente

### Progresso das Fases

| Fase | Nome | Status |
|------|------|--------|
| 0 | Setup, Infraestrutura e Estrutura Base | ✅ Concluída |
| 1 | Multi-tenant e Onboarding do Médico | ✅ Concluída (Planos 1–2: design system, auth + onboarding; migração para Supabase Auth iniciada em 2026-04-14) |
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
| 2026-04-14 | Conflito no agendamento | Pré-checar conflito e exigir confirmação antes do insert | Salvar na primeira tentativa com alerta | Evita duplicidade de consultas |
| 2026-04-14 | Padrão de telefone | Persistir WhatsApp em E.164 com DDI (55...) | Armazenar com máscara local | Deduplicação consistente e melhor integração com WhatsApp/Google |
| 2026-04-14 | Auth (migração) | Supabase Auth | Clerk | Eliminar atrito de integração com RLS e reduzir complexidade operacional |

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
- **2026-04-14 — Fluxo de conflito no modal de nova consulta pode duplicar registros:** o fluxo atual inseria a consulta antes da confirmação explícita de conflito. Decisão aplicada no plano: pré-check sem insert e confirmação obrigatória antes de salvar.
- **2026-04-14 — Normalização de WhatsApp para E.164 é necessária ponta a ponta:** variações de máscara/DDI impactam deduplicação de pacientes e integrações. Padrão adotado: persistir em E.164 com DDI.
- **2026-04-14 — Migração Clerk → Supabase Auth destrava fluxo com RLS:** a troca remove acoplamentos com metadata/webhooks e simplifica autenticação para o padrão nativo do Supabase.

---

## Contexto da Última Sessão

> Esta seção é sobrescrita a cada sessão. Mantém apenas o estado mais recente.
> **Sempre atualize ao encerrar uma sessão.**

**Data da última sessão:** 2026-04-14  
**O que foi feito:**
- Migração de autenticação Clerk → Supabase Auth concluída (código + banco)
- RLS completo: 23 policies em 9 tabelas (clinics, patients, appointments, medical_records, anamnesis, privacy_consents, whatsapp_sessions, conversation_memory, audit_logs)
- `clinics.clerk_user_id` NOT NULL removida; `user_id uuid` como FK principal confirmada
- Onboarding redesenhado (layout split, validação por etapa, persistência real)
- Build validado sem erros (`npm run build`)

**Estado da implementação:**
- Migração de código para Supabase Auth ✅
- Remoção de dependência Clerk ✅
- RLS banco completo ✅
- Build sem erros ✅
- Pendente: QA end-to-end de Google OAuth/Contacts + deploy Vercel ⏳

**O que está em andamento:** Migração Clerk → Supabase Auth encerrada. Próximo: Fase 5 (Pagamentos Stripe).

**Pendências para a próxima sessão:**
- [ ] Testar Google OAuth pós-migração (login social + integração Agenda)
- [ ] Testar sync Google Contacts em paciente
- [ ] Atualizar variáveis de ambiente em produção (Vercel)
- [ ] Iniciar Fase 5 — Pagamentos via Stripe + Magic Link

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
| 2026-04-14 | Claude Code | Revisão do modal de nova consulta; bug crítico de conflito identificado; decisões fechadas (pré-check de conflito e padrão E.164); plano em commits atômicos definido |
| 2026-04-14 | Claude Code | Documento `commits-e-pushes.md` criado para rastreio oficial de commits/pushes e regra de atualização contínua adicionada ao `CLAUDE.md` |
| 2026-04-14 | Claude | Debug Google Contacts sync: adicionado logging detalhado no callback, melhorado token refresh com validações, criado diagnostico-google-oauth.sql para diagnosticar RLS e Clerk issues |
| 2026-04-14 | Copilot | Migração de autenticação executada no código: Clerk removido, Supabase Auth aplicado em proxy/layout/actions/callback/login/logout, build validado; docs atualizadas |

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
- **Ao fazer commit ou push:** Atualize obrigatoriamente `commits-e-pushes.md` na mesma sessão (criação de commit, status de push, data/hora e observações)
- **Nunca apague** decisões ou log de sessões — apenas acrescente
- **Para novas skills:** Siga o processo em "Como Adicionar uma Nova Skill"
