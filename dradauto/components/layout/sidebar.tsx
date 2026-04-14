"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
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

interface SidebarProps {
  user?: {
    fullName: string | null;
    imageUrl: string;
    especialidade?: string;
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[--sidebar-width] flex-col border-r bg-white md:flex">
      <div className="flex h-20 items-center px-8">
        <Link href="/" className="flex items-center gap-3">
          <Stethoscope className="size-7 text-primary" />
          <span className="text-2xl font-bold tracking-tight text-primary">
            dradauto
          </span>
        </Link>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto px-4 py-8 flex flex-col gap-6">
        {navItems.map((group, groupIdx) => (
          <div key={group.group} className="flex flex-col gap-2">
            <span className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400/80">
              {group.group}
            </span>
            <div className="flex flex-col gap-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all group",
                      isActive
                        ? "text-primary bg-accent/50"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <item.icon className={cn("size-5 transition-transform group-hover:scale-110", isActive ? "text-primary" : "text-slate-400")} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t p-6 bg-slate-50/30">
        <div className="flex items-center gap-3 px-2 py-1">
          <Avatar className="size-9 border-2 border-white shadow-sm">
            <AvatarImage src={user?.imageUrl} />
            <AvatarFallback className="bg-accent text-primary text-xs font-bold">
              {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'DR'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-slate-900 truncate">
              {user?.fullName || 'Médico'}
            </span>
            <span className="text-xs text-slate-500 truncate">
              {user?.especialidade || 'Clínico Geral'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
