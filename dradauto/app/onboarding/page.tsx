"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Clock3, Loader2, Settings2, ShieldCheck, Sparkles, Stethoscope, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { formatPhoneBR } from "@/lib/phone"
import { completeOnboarding, type OnboardingData } from "@/app/actions/onboarding"

const estados = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT",
  "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"
]

const steps = [
  {
    number: 1,
    title: "Perfil médico",
    description: "Dados que identificam você no produto e em futuras integrações.",
  },
  {
    number: 2,
    title: "Contato da clínica",
    description: "Canal principal para agenda, lembretes e fluxo com pacientes.",
  },
  {
    number: 3,
    title: "Padrões de consulta",
    description: "Valores iniciais que podem ser ajustados depois em Configurações.",
  },
]

export default function OnboardingPage() {
  const [step, setStep] = React.useState(1)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState<OnboardingData>({
    nomeCompleto: "",
    crm: "",
    crmEstado: "",
    especialidade: "",
    whatsappClinica: "",
    valorConsulta: 0,
    duracaoConsulta: 30
  })

  const nextStep = () => {
    const validationError = validateStep(step)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setStep(s => Math.min(s + 1, 3))
  }

  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: name === "valorConsulta"
        ? (value === "" ? 0 : Number(value))
        : name === "whatsappClinica"
          ? formatPhoneBR(value)
          : value
    }))
  }

  const handleSelectChange = (name: string, value: string | null) => {
    setFormData(prev => ({
      ...prev,
      [name]: name === "duracaoConsulta" ? Number(value || 0) : (value || "")
    }))
  }

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      if (!formData.nomeCompleto.trim()) return "Informe seu nome completo."
      if (!formData.crm.trim()) return "Informe seu CRM."
      if (!formData.crmEstado.trim()) return "Selecione a UF do CRM."
      if (!formData.especialidade.trim()) return "Informe sua especialidade."
    }

    if (currentStep === 2) {
      if (!formData.whatsappClinica.trim()) return "Informe o WhatsApp principal da clínica."
    }

    if (currentStep === 3) {
      if (formData.valorConsulta < 0) return "O valor da consulta não pode ser negativo."
      if (!formData.duracaoConsulta) return "Selecione a duração padrão da consulta."
    }

    return null
  }

  const handleSubmit = async () => {
    const validationError = validateStep(3)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await completeOnboarding(formData)

      if (res?.success) {
        window.location.href = "/agenda"
      } else {
        setError(res?.error || "Falha ao salvar dados")
      }
    } catch (error) {
      console.error("Erro ao completar onboarding:", error)
      setError("Erro ao salvar os dados. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_30%)]" />

        <div className="relative flex items-center gap-3">
          <Stethoscope className="size-8" />
          <span className="text-2xl font-bold tracking-tight">dradauto</span>
        </div>

        <div className="relative flex flex-col gap-8 max-w-xl">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
              Configuração inicial
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-white/95">
              Seu consultório pronto para operar com agenda, pacientes e atendimento digital.
            </h1>
            <p className="text-base leading-7 text-white/72">
              Falta só definir seus dados profissionais, o canal principal da clínica e os padrões da consulta.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-white/90">
                <ShieldCheck className="size-5" />
                <span className="font-medium">Base preparada para RLS e autenticação nativa</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-white/90">
                <Sparkles className="size-5" />
                <span className="font-medium">Mesmo design system das telas de entrada</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative text-white/42 text-xs">
          © 2026 dradauto — onboarding médico
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-10 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <Stethoscope className="size-7 text-primary" />
          <span className="text-2xl font-bold text-primary tracking-tight">dradauto</span>
        </div>

        <div className="w-full max-w-[520px] rounded-[28px] border border-border bg-background/95 p-6 shadow-xl shadow-black/5 sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
                  Etapa {step} de 3
                </p>
                <h2 className="text-2xl font-bold text-foreground">
                  {steps[step - 1].title}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {steps[step - 1].description}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <UserRound className="size-3.5" />
                Setup inicial
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {steps.map((item) => (
                <div key={item.number} className="space-y-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-colors",
                      step > item.number ? "bg-primary/80" : step === item.number ? "bg-primary" : "bg-border"
                    )}
                  />
                  <p className={cn(
                    "text-xs font-medium",
                    step === item.number ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {item.title}
                  </p>
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
              >
                <FieldGroup className="gap-5">
                  {step === 1 && (
                    <>
                      <Field>
                        <FieldLabel htmlFor="nomeCompleto">Nome completo</FieldLabel>
                        <Input
                          id="nomeCompleto"
                          name="nomeCompleto"
                          placeholder="Dra. Maria Fernanda Alves"
                          className="h-12 rounded-xl px-4"
                          value={formData.nomeCompleto}
                          onChange={handleInputChange}
                        />
                      </Field>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
                        <Field>
                          <FieldLabel htmlFor="crm">CRM</FieldLabel>
                          <Input
                            id="crm"
                            name="crm"
                            placeholder="123456"
                            className="h-12 rounded-xl px-4"
                            value={formData.crm}
                            onChange={handleInputChange}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="crmEstado">UF</FieldLabel>
                          <Select
                            value={formData.crmEstado}
                            onValueChange={(value) => handleSelectChange("crmEstado", value)}
                          >
                            <SelectTrigger className="h-12 w-full rounded-xl px-4">
                              <SelectValue placeholder="UF" />
                            </SelectTrigger>
                            <SelectContent>
                              {estados.map((uf) => (
                                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>

                      <Field>
                        <FieldLabel htmlFor="especialidade">Especialidade principal</FieldLabel>
                        <Input
                          id="especialidade"
                          name="especialidade"
                          placeholder="Clínica médica, cardiologia, pediatria..."
                          className="h-12 rounded-xl px-4"
                          value={formData.especialidade}
                          onChange={handleInputChange}
                        />
                      </Field>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <Field>
                        <FieldLabel htmlFor="whatsappClinica">WhatsApp principal</FieldLabel>
                        <Input
                          id="whatsappClinica"
                          name="whatsappClinica"
                          placeholder="(11) 99999-9999"
                          className="h-12 rounded-xl px-4"
                          value={formData.whatsappClinica}
                          onChange={handleInputChange}
                        />
                        <FieldDescription>
                          Esse número será usado na agenda, em confirmações e nos fluxos com pacientes.
                        </FieldDescription>
                      </Field>

                      <div className="rounded-2xl border border-border bg-muted/30 p-4">
                        <p className="text-sm leading-6 text-muted-foreground">
                          O sistema salva esse contato em formato padronizado para evitar duplicidade e manter compatibilidade com WhatsApp e Google.
                        </p>
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <Field>
                        <FieldLabel htmlFor="valorConsulta">Valor padrão da consulta</FieldLabel>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                          <Input
                            id="valorConsulta"
                            name="valorConsulta"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0,00"
                            className="h-12 rounded-xl pl-12 pr-4"
                            value={formData.valorConsulta || ""}
                            onChange={handleInputChange}
                          />
                        </div>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="duracaoConsulta">Duração padrão</FieldLabel>
                        <div className="relative">
                          <Clock3 className="absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Select
                            value={String(formData.duracaoConsulta)}
                            onValueChange={(value) => handleSelectChange("duracaoConsulta", value)}
                          >
                            <SelectTrigger className="h-12 w-full rounded-xl pl-11 pr-4">
                              <SelectValue placeholder="Selecione a duração" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">30 minutos</SelectItem>
                              <SelectItem value="45">45 minutos</SelectItem>
                              <SelectItem value="60">60 minutos</SelectItem>
                              <SelectItem value="90">90 minutos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </Field>

                      <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                        <div className="flex items-start gap-3">
                          <Settings2 className="mt-0.5 size-4 text-primary" />
                          <p className="text-sm leading-6 text-muted-foreground">
                            Você poderá ajustar esses padrões depois em Configurações, sem impactar consultas já registradas.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </FieldGroup>
              </motion.div>
            </AnimatePresence>

            {error ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              {step > 1 ? (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={prevStep}
                  disabled={loading}
                  className="h-12 flex-1 rounded-xl"
                >
                  <ArrowLeft data-icon="inline-start" />
                  Voltar
                </Button>
              ) : (
                <div className="hidden sm:block flex-1" />
              )}

              {step < 3 ? (
                <Button
                  size="lg"
                  onClick={nextStep}
                  className="h-12 flex-1 rounded-xl"
                >
                  Continuar
                  <ArrowRight data-icon="inline-end" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="h-12 flex-1 rounded-xl"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Finalizar onboarding"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
