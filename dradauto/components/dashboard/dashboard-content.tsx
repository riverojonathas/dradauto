"use client"

import * as React from "react"
import { motion, type Variants } from "framer-motion"
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
import type { Clinic } from "@/types"

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
    className: "bg-emerald-100 text-emerald-700 border-none shadow-none",
    icon: CheckCircle2,
  },
  aguardando_pagamento: {
    label: "Aguardando",
    className: "bg-amber-100 text-amber-700 border-none shadow-none",
    icon: Clock3,
  },
  pendente: {
    label: "Pendente",
    className: "bg-slate-100 text-slate-700 border-none shadow-none",
    icon: AlertCircle,
  },
  teleconsulta: {
    label: "Teleconsulta",
    className: "bg-blue-100 text-blue-700 border-none shadow-none",
    icon: Video,
  },
}

const containerVars: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVars: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
}

interface DashboardContentProps {
  clinic: Clinic | null;
}

export function DashboardContent({ clinic }: DashboardContentProps) {
  const dynamicMetrics = [
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
      title: "Valor da Consulta",
      value: clinic ? `R$ ${clinic.valor_consulta}` : "R$ 0",
      trend: "por consulta",
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

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVars}
      className="flex flex-col gap-10"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
          Olá, {clinic?.nome_secretaria || 'Sofia'} aqui!
        </h2>
        <p className="text-lg text-slate-500">Hoje é um ótimo dia para salvar vidas.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {dynamicMetrics.map((metric) => (
          <motion.div key={metric.title} variants={itemVars}>
            <Card className="border-slate-200/60 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 rounded-3xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                  {metric.title}
                </CardTitle>
                <div className={cn("size-12 flex items-center justify-center rounded-2xl", metric.bgColor)}>
                  <metric.icon className={cn("size-6", metric.color)} />
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8 pt-0">
                <div className="text-4xl font-bold text-slate-900 tracking-tight mb-2">{metric.value}</div>
                <p className="text-sm flex items-center gap-1.5 text-emerald-600 font-semibold">
                  {metric.trend.startsWith('+') || metric.trend.includes(' hoje') ? <ArrowUpRight className="size-4" /> : null}
                  {metric.trend}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-7">
        {/* Next Appointments */}
        <motion.div variants={itemVars} className="md:col-span-4">
          <Card className="h-full border-slate-200/60 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
              <div className="flex flex-col gap-2">
                <CardTitle className="text-xl font-bold text-slate-900">Próximas consultas hoje</CardTitle>
                <p className="text-sm text-slate-500">Você tem {appointments.length} atendimentos agendados</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-full px-6">Ver Agenda</Button>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                {appointments.map((apt, index) => {
                  const status = apt.tipo === "Teleconsulta" ? "teleconsulta" : apt.status as keyof typeof statusConfig
                  const config = statusConfig[status] || statusConfig.pendente
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-5 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50/80 transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="text-lg font-bold text-slate-900 tabular-nums w-12 text-center">
                          {apt.horario}
                        </div>
                        <div className="flex items-center gap-4">
                          <Avatar className="size-11 border-2 border-white shadow-md ring-1 ring-slate-100">
                            <AvatarFallback className="bg-blue-50 text-primary font-bold text-sm">
                              {apt.nome.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">{apt.nome}</div>
                            <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">{apt.tipo}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={cn("px-4 py-1.5 rounded-full font-bold border-none shadow-none text-[11px] uppercase tracking-wider", config.className)}>
                          {config.label}
                        </Badge>
                        <Button variant="ghost" size="icon" className="size-10 text-slate-300 hover:text-slate-600 rounded-full">
                          <MoreVertical className="size-5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVars} className="md:col-span-3">
          <Card className="h-full border-slate-200/60 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-bold text-slate-900">Atividade recente</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="relative flex flex-col gap-10 mt-6 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-slate-100">
                {activities.map((activity, index) => (
                  <div key={index} className="relative flex gap-6 pl-10">
                    <div className="absolute left-0 top-1.5 size-6 rounded-full border-4 border-white bg-primary shadow-md ring-1 ring-slate-100 transition-transform hover:scale-125" />
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">
                        {activity.text}
                      </p>
                      <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-12 text-primary hover:text-primary hover:bg-blue-50 text-xs font-bold uppercase tracking-widest border border-dashed border-blue-100 py-8 rounded-2xl">
                Ver todo o histórico
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
