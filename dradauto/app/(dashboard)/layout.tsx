import { currentUser } from "@clerk/nextjs/server"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()
  const metadata = user?.publicMetadata as any

  const userData = user ? {
    fullName: user.fullName,
    imageUrl: user.imageUrl,
    especialidade: metadata?.especialidade as string | undefined
  } : undefined

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
