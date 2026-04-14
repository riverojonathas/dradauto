import { getCurrentClinic } from '@/lib/clinic'
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const clinic = await getCurrentClinic()
  const userData = clinic
    ? {
        fullName: clinic.nome,
        imageUrl: '',
        especialidade: clinic.especialidade || undefined,
      }
    : undefined

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
