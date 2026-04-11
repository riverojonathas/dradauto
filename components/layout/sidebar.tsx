"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  DollarSign,
  Settings,
  Stethoscope,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navItems = [
  {
    group: "Principal",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Agenda", href: "/agenda", icon: Calendar },
      { label: "Pacientes", href: "/pacientes", icon: Users },
      { label: "Prontuários", href: "/prontuarios", icon: FileText },
      { label: "Financeiro", href: "/financeiro", icon: DollarSign },
    ],
  },
  {
    group: "Configurações",
    items: [
      { label: "Configurações", href: "/configuracoes", icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[--sidebar-width] flex-col border-r bg-white md:flex">
      <div className="flex h-[--header-height] items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight text-primary">
            dradauto
          </span>
        </Link>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {navItems.map((group, groupIdx) => (
          <div key={group.group} className={cn(groupIdx > 0 && "mt-6")}>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-primary border-l-2 border-primary rounded-l-none"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-slate-400")} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
            {groupIdx === 0 && <Separator className="mt-6" />}
          </div>
        ))}
      </div>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 px-2 py-1">
          <Avatar className="h-9 w-9">
            <AvatarImage src="" />
            <AvatarFallback className="bg-blue-100 text-primary text-xs font-bold">DR</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">Dr. Ricardo</span>
            <span className="text-xs text-slate-500">Ortopedista</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
