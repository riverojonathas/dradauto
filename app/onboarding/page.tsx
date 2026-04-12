"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Stethoscope, User, Building2, Settings2, Loader2, ArrowRight, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { completeOnboarding, type OnboardingData } from "@/app/actions/onboarding"

const estados = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT",
  "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = React.useState(1)
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState<OnboardingData>({
    nomeCompleto: "",
    crm: "",
    crmEstado: "",
    especialidade: "",
    nomeClinica: "",
    whatsappClinica: "",
    valorConsulta: 0,
    duracaoConsulta: 30
  })

  const nextStep = () => setStep(s => Math.min(s + 1, 3))
  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === "valorConsulta" ? Number(value) : value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: name === "duracaoConsulta" ? Number(value) : value
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await completeOnboarding(formData)
      router.push("/")
    } catch (error) {
      console.error("Erro ao completar onboarding:", error)
      alert("Erro ao salvar os dados. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-2">
        <Stethoscope className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold tracking-tight text-primary">dradauto</span>
      </div>

      <Card className="w-full max-w-lg border-slate-200 shadow-xl bg-white rounded-2xl overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 pb-8">
          <div className="flex justify-between items-center mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all",
                  step === s ? "bg-primary text-white ring-4 ring-blue-50" : 
                  step > s ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                )}>
                  {step > s ? "✓" : s}
                </div>
                {s < 3 && (
                  <div className={cn(
                    "w-12 sm:w-20 h-0.5 mx-2 transition-all",
                    step > s ? "bg-emerald-500" : "bg-slate-100"
                  )} />
                )}
              </div>
            ))}
          </div>
          <CardTitle className="text-xl font-bold text-slate-900">
            {step === 1 && "Dados Pessoais"}
            {step === 2 && "Dados da Clínica"}
            {step === 3 && "Configurações de Consulta"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Precisamos identificar você como médico no sistema."}
            {step === 2 && "Essas informações serão exibidas para seus pacientes."}
            {step === 3 && "Defina os valores padrão para seus atendimentos."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-8 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nomeCompleto">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    id="nomeCompleto" 
                    name="nomeCompleto"
                    placeholder="Dr. Nome Sobrenome" 
                    className="pl-9"
                    value={formData.nomeCompleto}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="crm">CRM</Label>
                  <Input 
                    id="crm" 
                    name="crm"
                    placeholder="000000" 
                    value={formData.crm}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crmEstado">UF do CRM</Label>
                  <Select 
                    value={formData.crmEstado ?? ""}
                    onValueChange={(v) => handleSelectChange("crmEstado", v || "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="especialidade">Especialidade Principal</Label>
                <Input 
                  id="especialidade" 
                  name="especialidade"
                  placeholder="Ex: Clínico Geral, Ortopedia..." 
                  value={formData.especialidade}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nomeClinica">Nome da Clínica / Consultório</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    id="nomeClinica" 
                    name="nomeClinica"
                    placeholder="Ex: Clínica Saúde, Consultório Dr. Ricardo" 
                    className="pl-9"
                    value={formData.nomeClinica}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappClinica">WhatsApp da Clínica</Label>
                <Input 
                  id="whatsappClinica" 
                  name="whatsappClinica"
                  placeholder="+55 11 99999-9999" 
                  value={formData.whatsappClinica}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-slate-500">Número usado para enviar agendamentos aos pacientes.</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="valorConsulta">Valor da Consulta (R$)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-sm">R$</span>
                  <Input 
                    id="valorConsulta" 
                    name="valorConsulta"
                    type="number"
                    placeholder="0.00" 
                    className="pl-9"
                    value={formData.valorConsulta || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duracaoConsulta">Duração Padrão</Label>
                <div className="relative">
                  <Settings2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 z-10" />
                  <Select 
                    value={(formData.duracaoConsulta ?? 30).toString()}
                    onValueChange={(v) => handleSelectChange("duracaoConsulta", v || "")}
                  >
                    <SelectTrigger className="w-full pl-9">
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
              </div>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>Dica:</strong> Você poderá alterar estas configurações a qualquer momento em Configurações &gt; Clínica.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            {step > 1 && (
              <Button 
                variant="outline" 
                onClick={prevStep}
                disabled={loading}
                className="flex-1 h-12 rounded-xl text-slate-600 border-slate-200"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
            )}
            {step < 3 ? (
              <Button 
                onClick={nextStep} 
                className="flex-1 h-12 rounded-xl bg-primary hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                Continuar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading || !formData.nomeCompleto || !formData.crm}
                className="flex-1 h-12 rounded-xl bg-primary hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Finalizar Cadastro"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
