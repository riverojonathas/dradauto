import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex flex-col md:pl-[var(--sidebar-width)]">
        <Header title="Dashboard" />
        <main className="flex-1 mt-[--header-height] p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
