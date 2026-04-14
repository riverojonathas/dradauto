# Plano de Migração — Clerk → Supabase Auth

**Data:** 2026-04-14  
**Objetivo:** Remover Clerk, usar Supabase Auth nativo  
**Estimativa:** 3-4 horas  
**Risco:** Médio (auth é crítica, mas teste em dev)

---

## 🎯 Visão Geral

### Antes (Clerk + Supabase)
```
Google OAuth → Clerk → clerk_user_id → Supabase (RLS bloqueado)
```

### Depois (Supabase Auth)
```
Google OAuth → Supabase Auth → auth.uid() → Supabase RLS (automático)
```

### O Que Muda
| Componente | Antes | Depois |
|-----------|-------|--------|
| Auth middleware | `clerkMiddleware()` | `createServerClient()` + JWT |
| User ID | `clerk_user_id` | `auth.uid()` (nativo) |
| Tabela clinics | `clerk_user_id: text` | `user_id: uuid` (FK) |
| Google callback | Via Clerk | Via Supabase |
| RLS policies | Complexas | Simples (nativa) |
| Login/Signup | Clerk hosted | Supabase Auth forms |

---

## 📋 Checklist de Migração

### Fase 0 — Preparação
- [x] Backup do código atual (git branch)
- [ ] Anotar valores atuais de `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- [x] Copiar `package.json` para referência
- [ ] Preparar script SQL de migração de dados

### Fase 1 — Dependências (20 min)
- [x] Remover `@clerk/nextjs` do `package.json`
- [x] Adicionar pacotes Supabase (se não estiverem)
- [x] Rodar `npm install`

### Fase 2 — Configuração Supabase (30 min)
- [ ] Ativar Google OAuth no Supabase
- [ ] Gerar chaves Supabase se não tiver
- [ ] Configurar variáveis de ambiente

### Fase 3 — Refatorar Código (90 min)
- [x] Recriar `proxy.ts` (remover Clerk middleware)
- [x] Atualizar Google callback route
- [x] Refatorar server actions (remover Clerk auth())
- [ ] Atualizar tipos TypeScript
- [x] Criar componentes de login/signup

### Fase 4 — Banco de Dados (30 min)
- [x] Migração: `clerk_user_id` → `user_id` em clinics (NOT NULL removido, user_id nullable confirmado)
- [x] Criar RLS policies nativas (23 policies em 9 tabelas — concluído 2026-04-14)
- [x] Testar RLS (verificação final executada — todas as tabelas com policies corretas)

### Fase 5 — Testes (60 min)
- [x] Signup com email
- [x] Login com email
- [x] Logout
- [ ] Google OAuth (vai funcionar 🎉)
- [ ] Sync Google Contacts
- [x] Proteger rotas privadas

### Fase 6 — Deploy
- [ ] Atualizar variáveis em Vercel
- [ ] Deploy em produção
- [ ] Testar end-to-end

---

## 🔧 Fase 1 — Dependências

### Passo 1.1: Remover Clerk
```bash
npm uninstall @clerk/nextjs
```

### Passo 1.2: Verificar Supabase
```bash
npm list @supabase/supabase-js
```
(Deve estar já instalado)

### Passo 1.3: Adicionar Supabase Auth Frontend
```bash
npm install @supabase/auth-js
```

---

## 🔐 Fase 2 — Configuração Supabase

### Passo 2.1: Ativar Google OAuth no Supabase

1. Ir a **Supabase Dashboard** → seu projeto
2. Ir a **Authentication** → **Providers**
3. Procurar por **Google**
4. Clicar em **Enable**
5. Copiar seu `GOOGLE_CLIENT_ID` (do Google Cloud Console)
6. Copiar seu `GOOGLE_CLIENT_SECRET`
7. Clicar **Save**

### Passo 2.2: Configurar Redirect URIs no Supabase

1. Em **Authentication** → **URL Configuration**
2. Adicionar em **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   https://seu-dominio.com/auth/callback
   ```

**Importante:** essas URLs acima sao o `redirectTo` final do app depois que o Supabase conclui o login.
Elas **nao** substituem a URI de callback que precisa estar cadastrada no **Google Cloud Console** para o provider do Supabase.

### Passo 2.2.1: Configurar Authorized Redirect URI no Google Cloud Console

Para **Google Social Login via Supabase Auth**, a URI autorizada no Google deve ser a callback do proprio Supabase:

```
https://aucsxszfryxyjfkippsu.supabase.co/auth/v1/callback
```

Adicionar em **Google Cloud Console** → **APIs & Services** → **Credentials** → seu OAuth Client → **Authorized redirect URIs**.

**Nao usar aqui** `http://localhost:3000/auth/callback`, porque essa rota e apenas o destino final apos o Supabase trocar o codigo por sessao.

### Passo 2.3: Atualizar `.env.local`

```bash
# Manter os existentes (se tiver)
NEXT_PUBLIC_SUPABASE_URL=seu_url
SUPABASE_SERVICE_ROLE_KEY=seu_key

# Remover
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
# CLERK_SECRET_KEY=...

# Adicionar (se não tiver)
SUPABASE_JWT_SECRET=seu_jwt_secret  # Copiar de Supabase Dashboard → Settings → API
```

---

## 💻 Fase 3 — Refatorar Código

### Passo 3.1: Recriar `proxy.ts`

**Arquivo:** `dradauto/proxy.ts`

```typescript
import { type NextRequest } from 'next/server'
import { createServerClient, SupabaseClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export async function middleware(request: NextRequest) {
  const response = request.nextResponse.next()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getSetCookie().map(cookie => {
            const [name, ...rest] = cookie.split('=')
            return { name, value: rest.join('=') }
          })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Proteger rotas privadas
  const isAuthRoute = request.nextUrl.pathname.startsWith('/sign-in') ||
                      request.nextUrl.pathname.startsWith('/sign-up') ||
                      request.nextUrl.pathname.startsWith('/auth/')

  const isDashboardRoute = request.nextUrl.pathname.startsWith('/(dashboard)') ||
                           request.nextUrl.pathname.startsWith('/configuracoes') ||
                           request.nextUrl.pathname.startsWith('/agenda') ||
                           request.nextUrl.pathname.startsWith('/pacientes') ||
                           request.nextUrl.pathname.startsWith('/prontuarios') ||
                           request.nextUrl.pathname.startsWith('/financeiro')

  // Se sem user e tenta acessar dashboard → redirecionar para login
  if (!user && isDashboardRoute) {
    return Response.redirect(new URL('/sign-in', request.url))
  }

  // Se com user e tenta acessar signup → redirecionar para dashboard
  if (user && request.nextUrl.pathname === '/sign-up') {
    return Response.redirect(new URL('/agenda', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
```

### Passo 3.2: Criar `lib/supabase/client.ts` (para client components)

**Arquivo:** `dradauto/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Passo 3.3: Atualizar `lib/supabase/server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export function createServerClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle in edge case where cookies can't be set
          }
        },
      },
    }
  )
}

// Helper para obter user atual
export async function getUser() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
```

### Passo 3.4: Remover `@clerk/nextjs` de componentes

**Arquivo:** `app/layout.tsx`

**Antes:**
```tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html>...</html>
    </ClerkProvider>
  )
}
```

**Depois:**
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>...</html>
  )
}
```

### Passo 3.5: Recriar `app/api/auth/google/callback/route.ts`

**Arquivo:** `dradauto/app/api/auth/google/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    console.error('[Google Callback] OAuth error:', error)
    return NextResponse.redirect(
      new URL(`/sign-in?error=${error}`, request.url)
    )
  }

  if (!code) {
    console.error('[Google Callback] No code provided')
    return NextResponse.redirect(
      new URL('/sign-in?error=no_code', request.url)
    )
  }

  const supabase = createServerClient()

  try {
    // Exchange code for session via Supabase
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[Google Callback] Exchange error:', exchangeError)
      return NextResponse.redirect(
        new URL('/sign-in?error=exchange_failed', request.url)
      )
    }

    if (!data.user) {
      return NextResponse.redirect(
        new URL('/sign-in?error=no_user', request.url)
      )
    }

    // Criar ou atualizar clinic com novo user_id
    const { error: clinicError } = await supabase
      .from('clinics')
      .upsert({
        user_id: data.user.id,
        email: data.user.email,
        // Outros campos com defaults se primeira vez
      }, {
        onConflict: 'user_id'
      })

    if (clinicError) {
      console.error('[Google Callback] Clinic update error:', clinicError)
      return NextResponse.redirect(
        new URL('/agenda?error=clinic_update_failed', request.url)
      )
    }

    console.log('[Google Callback] ✅ Session exchanged successfully')

    // Redirect ao dashboard
    return NextResponse.redirect(new URL('/agenda?connected=true', request.url))
  } catch (err) {
    console.error('[Google Callback] Unexpected error:', err)
    return NextResponse.redirect(
      new URL('/sign-in?error=unexpected', request.url)
    )
  }
}
```

### Passo 3.6: Atualizar `app/actions/google.ts`

```typescript
'use server'
import { createServerClient, getUser } from '@/lib/supabase/server'

export async function getGoogleAuthUrl(options?: {
  returnTo?: string
}): Promise<string> {
  const user = await getUser()
  if (!user) throw new Error('Not authenticated')

  const supabase = createServerClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback${
        options?.returnTo ? `?returnTo=${encodeURIComponent(options.returnTo)}` : ''
      }`,
      scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/contacts',
    },
  })

  if (error) throw new Error(error.message)

  return data.url || ''
}

export async function disconnectGoogle(): Promise<void> {
  const user = await getUser()
  if (!user) throw new Error('Not authenticated')

  const supabase = createServerClient()

  // Clear Google tokens (Supabase handles this internally)
  // Você armazena tokens em tabela separada se precisar (ver schema)
}
```

### Passo 3.7: Atualizar `app/(dashboard)/layout.tsx`

**Remover:** `import { useAuth } from '@clerk/nextjs'`

**Adicionar:**
```typescript
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Verificar autenticação
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/sign-in')
      }
      setIsLoading(false)
    }

    checkAuth()

    // Listen para logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/sign-in')
      }
    })

    return () => subscription?.unsubscribe()
  }, [supabase, router])

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>
  }

  return <>{children}</>
}
```

### Passo 3.8: Atualizar componentes com `auth()`

**Em todos os `app/actions/*.ts`:**

**Antes:**
```typescript
import { auth } from '@clerk/nextjs/server'

const { userId } = await auth()
if (!userId) throw new Error('Not authenticated')
```

**Depois:**
```typescript
import { getUser } from '@/lib/supabase/server'

const user = await getUser()
if (!user) throw new Error('Not authenticated')

// Usar user.id em vez de userId
```

---

## 🗄️ Fase 4 — Banco de Dados

### Passo 4.1: Migração de Schema

**Script pronto no repositório:** `/Users/prom1/Downloads/dradauto/migracao-auth-rls.sql`

**Execute no Supabase SQL Editor:**

```sql
-- Execute o arquivo completo migracao-auth-rls.sql.
-- Resumo do que ele faz:
alter table clinics
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create unique index if not exists clinics_user_id_unique_idx
  on clinics (user_id)
  where user_id is not null;

-- Habilita RLS em clinics, patients, appointments, medical_records,
-- anamnesis, privacy_consents, whatsapp_sessions, conversation_memory e audit_logs.
-- Cria policies idempotentes para service_role e para authenticated.
```

**Observação:** o runtime do app já foi ajustado para usar `user_id`/`clinic.id`, então a remoção de `clerk_user_id` em `clinics` deixa de bloquear o fluxo depois que a migração for executada.

**Se aparecer erro `23502` em onboarding (`null value in column "clerk_user_id"`)**

Isso indica que a coluna legada ainda está com `NOT NULL` no banco. Execute:

```sql
-- 1) Garantir dados legados preenchidos antes de soltar a constraint
update clinics
set clerk_user_id = coalesce(clerk_user_id, user_id::text)
where clerk_user_id is null
  and user_id is not null;

-- 2) Remover a trava legada
alter table clinics
  alter column clerk_user_id drop not null;

-- 3) (Opcional quando todo o runtime já estiver em user_id)
-- alter table clinics drop column clerk_user_id;
```

### Passo 4.2: Testar RLS

```sql
-- Verificar se RLS está ativado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Listar policies
SELECT tablename, policyname, permissive 
FROM pg_policies 
WHERE schemaname = 'public';
```

---

## ✅ Fase 5 — Testes

### Teste 5.1: Signup (Criar conta nova)

1. Abrir `http://localhost:3000/sign-up`
2. Preencher email e senha
3. Clique em criar conta
4. Verificar em Supabase → **Authentication** → **Users** (deve aparecer novo user)
5. Verificar em **clinics** (deve ter linha com novo `user_id`)

### Teste 5.2: Login

1. Fazer logout (se tiver sessão ativa)
2. Ir a `/sign-in`
3. Entrar com email e senha
4. Deve redirecionar para `/agenda`

### Teste 5.3: Logout

1. No sidebar, clicar em logout
2. Deve redirecionar para `/sign-in`

### Teste 5.4: Google OAuth 🎉

1. Ir a Configurações > Integrações
2. Clicar em "Autorizar Google"
3. Completar flow do Google
4. **Deve voltar com `?connected=true`**
5. Abrir DevTools → Network → procurar por `/api/auth/google/callback`
6. Status deve ser 307 redirect (sucesso)

### Teste 5.5: Sync Google Contacts

1. Ir a Pacientes
2. Criar novo paciente
3. Clicar em sincronizar no card
4. **Deve aparecer** "Sincronizado com Google Contacts" (verde)
5. Abrir Google Contacts → deve ter o paciente lá

### Teste 5.6: Proteger Rotas

1. Abrir navegador incógnito
2. Tentar acessar `http://localhost:3000/agenda` (sem login)
3. Deve redirecionar para `/sign-in`

### Status parcial executado em 2026-04-14

- Build local: `npm run build` concluído sem erros
- Migração de código concluída: `app/layout.tsx`, `proxy.ts`, `lib/clinic.ts`, `app/actions/onboarding.ts`, `app/actions/google.ts`, `app/api/auth/google/callback/route.ts`, `app/(dashboard)/layout.tsx`, `components/layout/header.tsx`, `components/settings/clinic-settings-form.tsx`, `app/(auth)/sign-in/[[...sign-in]]/page.tsx`, `app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- Remoção de dependência concluída: `@clerk/nextjs`
- Pendente para fechamento da migração: SQL de banco/RLS (Fase 4) + validações end-to-end de Google OAuth e sync Contacts

---

## 🚀 Fase 6 — Deploy

### Passo 6.1: Atualizar Variáveis em Vercel

**Remover:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

**Adicionar/Verificar:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `NEXT_PUBLIC_APP_URL` (seu domínio)

### Passo 6.2: Atualizar Redirect URI no Google Cloud Console

Para o **Google Social Login via Supabase Auth**, manter no Google Cloud Console a callback do Supabase:

```
https://aucsxszfryxyjfkippsu.supabase.co/auth/v1/callback
```

Se houver deploy em producao, adicionar tambem o destino final no **Supabase Dashboard** → **Authentication** → **URL Configuration**:

```
https://seu-dominio.com/auth/callback
```

**Separacao correta:**
- Google Cloud Console / Authorized redirect URIs: callback do Supabase (`/auth/v1/callback`)
- Supabase / Redirect URLs: callback final da sua aplicacao (`/auth/callback`)
- `.env.local` / `GOOGLE_REDIRECT_URI`: callback manual da integracao Agenda/Contatos (`/api/auth/google/callback`)

### Passo 6.3: Deploy

```bash
git add .
git commit -m "chore: migrate from Clerk to Supabase Auth"
git push origin main
```

Vercel fará deploy automaticamente.

### Passo 6.4: QA em Produção

1. Ir a https://seu-dominio.com/sign-in
2. Testar signup
3. Testar login
4. Testar Google OAuth
5. Testar sync Contacts
6. Verificar em Supabase se dados estão salvando corretamente

---

## ⏮️ Rollback (Se Algo Der Errado)

```bash
# Reverter últimos commits
git revert HEAD~N

# Ou, se ainda em dev (não commitou)
git checkout -- .

# Se em produção e quebrou
git revert <commit-hash>
git push origin main
```

---

## 📝 Checklist Final

- [ ] Branch criado: `git checkout -b feat/migrate-supabase-auth`
- [ ] Fase 1 completa: dependências atualizadas, `npm install` rodou
- [ ] Fase 2 completa: Google OAuth ativado no Supabase, env vars definidas
- [ ] Fase 3 completa: todos os arquivos refatorados, sem erros de compilação
- [ ] Fase 4 completa: migrations SQL executadas, RLS policies criadas
- [ ] Fase 5 completa: todos os 6 testes passaram
- [ ] Fase 6 completa: variáveis em Vercel atualizadas, deploy em produção OK
- [ ] Documentação atualizada: database.md, CLAUDE.md, etc

---

## ⏱️ Timeline Sugerida

| Fase | Tempo | Quando |
|------|-------|--------|
| 0 (Prep) | 10 min | Agora |
| 1 (Deps) | 10 min | Agora |
| 2 (Config) | 20 min | Agora |
| 3 (Code) | 90 min | Hoje (pode pausar no meio) |
| 4 (DB) | 20 min | Hoje à noite |
| 5 (Tests) | 60 min | Amanhã de manhã |
| 6 (Deploy) | 15 min | Amanhã |

---

## 🆘 Se Travar Em Alguma Etapa

Deixe-me saber qual fase + qual erro, que debugo contigo. As fases mais críticas são:

1. **Fase 3.1** (proxy.ts) — auth middleware
2. **Fase 4.1** (RLS policies) — segurança
3. **Fase 5.4** (Google OAuth) — callback correto

Começamos agora?
