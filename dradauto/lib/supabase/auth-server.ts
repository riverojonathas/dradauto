import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export async function createAuthServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // No-op in contexts where response cookies cannot be set.
          }
        },
      },
    }
  )
}

export async function getCurrentUser() {
  const supabase = await createAuthServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}
