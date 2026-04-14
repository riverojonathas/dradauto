"use client"

import { Menu, Stethoscope, LayoutDashboard, Calendar, Users, FileText, DollarSign, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Agenda", href: "/agenda", icon: Calendar },
  { label: "Pacientes", href: "/pacientes", icon: Users },
  { label: "Prontuários", href: "/prontuarios", icon: FileText },
  { label: "Financeiro", href: "/financeiro", icon: DollarSign },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        }
      />
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="p-6 text-left">
          <SheetTitle className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight text-primary">
              dradauto
            </span>
          </SheetTitle>
        </SheetHeader>
        
        <Separator />

        <div className="flex flex-col gap-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-primary"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-slate-400")} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
