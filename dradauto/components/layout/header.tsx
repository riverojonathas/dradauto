"use client"

import { Bell, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MobileNav } from "./mobile-nav"
import { createClient } from "@/lib/supabase/client"

interface HeaderProps {
  title: string
  user?: {
    fullName: string | null
    imageUrl: string
  }
}

export function Header({ title, user }: HeaderProps) {
  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/sign-in'
  }

  return (
    <header className="fixed right-0 top-0 z-30 flex h-[72px] w-full items-center bg-background/80 backdrop-blur-md border-b border-border/50 md:w-[calc(100%-var(--sidebar-width))]">
      <div className="flex w-full items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-4">
          <MobileNav />
          {/* Título removido para integração seamless */}
        </div>

        <div className="flex items-center gap-6 flex-1 justify-end">
          <div className="relative hidden md:block w-full max-w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar em toda clínica..."
              className="h-11 w-full rounded-full border border-border bg-background/50 pl-11 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 hover:bg-background shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative size-11 text-muted-foreground rounded-2xl hover:bg-accent/50">
              <Bell className="size-6" />
              <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" className="relative size-11 rounded-full p-0 overflow-hidden border-2 border-transparent hover:border-accent transition-all">
                    <Avatar className="size-full rounded-full">
                      <AvatarImage src={user?.imageUrl} />
                      <AvatarFallback className="bg-accent text-primary text-xs font-bold">
                        {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'DR'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-xl border-border/50">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem className="rounded-xl px-3 py-2.5 cursor-pointer">Ver perfil</DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl px-3 py-2.5 cursor-pointer">Configurações</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  className="text-destructive rounded-xl px-3 py-2.5 cursor-pointer font-semibold"
                  onClick={handleSignOut}
                >
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
