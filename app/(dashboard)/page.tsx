"use client"

import { 
  Users, 
  CalendarCheck, 
  DollarSign, 
  Clock, 
  ArrowUpRight,
  MoreVertical,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Video
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const metrics = [
  {
    title: "Consultas hoje",
    value: "8",
    trend: "+2 hoje",
    icon: CalendarCheck,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Pacientes novos",
    value: "3",
    trend: "esta semana",
    icon: Users,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    title: "Receita este mês",
    value: "R$ 2.400",
    trend: "+12.5%",
    icon: DollarSign,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Pendentes",
    value: "2",
    trend: "pagamentos",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
]

const appointments = [
  { nome: "Maria Santos", horario: "09:00", tipo: "Retorno", status: "confirmada" },
  { nome: "João Oliveira", horario: "10:30", tipo: "Primeira vez", status: "aguardando_pagamento" },
  { nome: "Ana Costa", horario: "11:00", tipo: "Retorno", status: "confirmada" },
  { nome: "Pedro Lima", horario: "14:00", tipo: "Teleconsulta", status: "confirmada" },
  { nome: "Carla Mendes", horario: "15:30", tipo: "Retorno", status: "pendente" },
]

const activities = [
  { text: "João Oliveira agendou uma consulta", time: "Há 10 min", type: "appointment" },
  { text: "Pagamento de Maria Santos confirmado", time: "Há 45 min", type: "payment" },
  { text: "Prontuário de Ana Costa finalizado", time: "Há 2 horas", type: "medical" },
  { text: "Nova anamnese enviada para Pedro Lima", time: "Há 3 horas", type: "system" },
  { text: "Relatório financeiro semanal pronto", time: "Há 5 horas", type: "system" },
]

const statusConfig = {
  confirmada: {
    label: "Confirmada",
    className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    icon: CheckCircle2,
  },
  aguardando_pagamento: {
    label: "Aguardando",
    className: "bg-amber-50 text-amber-700 border-amber-100",
    icon: Clock3,
  },
  pendente: {
    label: "Pendente",
    className: "bg-slate-50 text-slate-700 border-slate-100",
    icon: AlertCircle,
  },
  teleconsulta: {
    label: "Teleconsulta",
    className: "bg-blue-50 text-blue-700 border-blue-100",
    icon: Video,
  },
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="border-slate-200 shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-500">
                {metric.title}
              </CardTitle>
              <div className={cn("p-2 rounded-lg", metric.bgColor)}>
                <metric.icon className={cn("h-4 w-4", metric.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metric.value}</div>
              <p className="text-xs flex items-center gap-1 mt-1 text-emerald-600 font-medium">
                {metric.trend.startsWith('+') && <ArrowUpRight className="h-3 w-3" />}
                {metric.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Next Appointments */}
        <Card className="md:col-span-4 border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Próximas consultas hoje</CardTitle>
              <p className="text-sm text-slate-500">Você tem {appointments.length} atendimentos agendados</p>
            </div>
            <Button variant="outline" size="sm">Ver Agenda</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.map((apt, index) => {
                const status = apt.tipo === "Teleconsulta" ? "teleconsulta" : apt.status as keyof typeof statusConfig
                const config = statusConfig[status] || statusConfig.pendente
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-semibold text-slate-900 tabular-nums">
                        {apt.horario}
                      </div>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-white shadow-sm">
                          <AvatarFallback className="bg-slate-100 text-slate-600 font-medium text-xs">
                            {apt.nome.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{apt.nome}</div>
                          <div className="text-xs text-slate-500">{apt.tipo}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={cn("px-2 py-0.5 font-medium border", config.className)}>
                        {config.label}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="md:col-span-3 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Atividade recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-4 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-[1px] before:bg-slate-200">
              {activities.map((activity, index) => (
                <div key={index} className="relative flex gap-4 pl-8">
                  <div className="absolute left-0 top-1.5 h-[22px] w-[22px] rounded-full border-4 border-white bg-blue-500 shadow-sm ring-1 ring-slate-100" />
                  <div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {activity.text}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-6 text-primary hover:text-primary hover:bg-blue-50 text-xs font-semibold uppercase tracking-wider">
              Ver todo o histórico
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
