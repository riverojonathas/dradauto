import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { getCurrentUser } from "@/lib/supabase/auth-server"
import { getCurrentClinic } from "@/lib/clinic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, clinic] = await Promise.all([getCurrentUser(), getCurrentClinic()])

  const metadata = (user?.user_metadata || {}) as Record<string, string>
  const userData = {
    fullName:
      metadata.full_name ||
      metadata.name ||
      user?.email ||
      'Médico',
    imageUrl: metadata.avatar_url || '',
    especialidade: clinic?.especialidade || undefined,
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <Sidebar user={userData} />
      <div className="flex flex-col md:pl-[var(--sidebar-width)]">
        <Header title="Dashboard" user={userData} />
        <main className="flex-1 w-full px-6 md:px-12 pb-10 pt-[104px]">
          {children}
        </main>
      </div>
    </div>
  )
}
