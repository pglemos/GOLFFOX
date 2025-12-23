"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, Mail, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import { useSupabaseSync } from "@/hooks/use-supabase-sync"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ScheduleReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  reportKey: string
  companyId?: string
  schedule?: any // Para edição de agendamento existente
}

const REPORT_TYPES = [
  { id: 'delays', label: 'Atrasos' },
  { id: 'occupancy', label: 'Ocupação' },
  { id: 'not_boarded', label: 'Não Embarcados' },
  { id: 'routes', label: 'Rotas Eficientes' },
  { id: 'motoristas', label: 'Ranking de Motoristas' },
]

const CRON_PRESETS = [
  { value: '0 9 * * 1', label: 'Toda Segunda às 9h' },
  { value: '0 9 * * 5', label: 'Toda Sexta às 9h' },
  { value: '0 9 1 * *', label: 'Dia 1 de cada mês às 9h' },
  { value: '0 9 * * 1-5', label: 'Dias úteis às 9h' },
]

export function ScheduleReportModal({
  isOpen,
  onClose,
  onSave,
  reportKey,
  companyId,
  schedule,
}: ScheduleReportModalProps) {
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>(companyId || schedule?.company_id || "")
  const [selectedReport, setSelectedReport] = useState<string>(reportKey || schedule?.report_key || "")
  const [cronExpression, setCronExpression] = useState<string>(schedule?.cron || "")
  const [cronPreset, setCronPreset] = useState<string>("")
  const [recipients, setRecipients] = useState<string>(schedule?.recipients?.join(', ') || "")
  const [isActive, setIsActive] = useState<boolean>(schedule?.is_active ?? true)
  const { sync } = useSupabaseSync({ showToast: false })

  useEffect(() => {
    if (isOpen) {
      loadCompanies()
      // Preencher dados do schedule se estiver editando
      if (schedule) {
        setSelectedCompany(schedule.company_id || "")
        setSelectedReport(schedule.report_key || reportKey)
        setCronExpression(schedule.cron || "")
        setRecipients(schedule.recipients?.join(', ') || "")
        setIsActive(schedule.is_active ?? true)
      }
      if (cronPreset) {
        const preset = CRON_PRESETS.find(p => p.value === cronPreset)
        if (preset) {
          setCronExpression(preset.value)
        }
      }
    }
  }, [isOpen, cronPreset, schedule, reportKey])

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("is_active", true)
        .order("name")

      if (error) throw error
      setCompanies(data || [])
    } catch (error: any) {
      console.error("Erro ao carregar empresas:", error)
      notifyError("Erro ao carregar empresas", undefined, {
        i18n: { ns: 'common', key: 'errors.generic' }
      })
    }
  }

  const validateCron = (cron: string): boolean => {
    // Validação simples: 5 campos separados por espaço
    const parts = cron.trim().split(/\s+/)
    if (parts.length !== 5) return false
    
    // Validar cada parte (minuto, hora, dia do mês, mês, dia da semana)
    const patterns = [
      /^[0-5]?\d$/, // minuto: 0-59
      /^[01]?\d$|^2[0-3]$/, // hora: 0-23
      /^[12]?\d$|^3[01]$/, // dia: 1-31
      /^[0-9]|1[0-2]$/, // mês: 1-12
      /^[0-6]$/, // dia da semana: 0-6
    ]
    
    for (let i = 0; i < 5; i++) {
      if (parts[i] === '*') continue
      if (!patterns[i].test(parts[i])) return false
    }
    
    return true
  }

  const validateEmails = (emails: string): boolean => {
    if (!emails.trim()) return false
    const emailList = emails.split(',').map(e => e.trim()).filter(Boolean)
    if (emailList.length === 0) return false
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailList.every(email => emailRegex.test(email))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validações
      if (!selectedCompany) {
        notifyError("Selecione uma empresa", undefined, {
          i18n: { ns: 'operador', key: 'reports.schedule.validation.selectCompany' }
        })
        return
      }
      if (!selectedReport) {
        notifyError("Selecione um relatório", undefined, {
          i18n: { ns: 'operador', key: 'reports.schedule.validation.selectReport' }
        })
        return
      }
      if (!cronExpression || !validateCron(cronExpression)) {
        notifyError("Cron expression inválida. Use o formato: minuto hora dia mês dia-semana", undefined, {
          i18n: { ns: 'common', key: 'validation.invalidCron' }
        })
        return
      }
      if (!recipients || !validateEmails(recipients)) {
        notifyError("Adicione pelo menos um email válido", undefined, {
          i18n: { ns: 'common', key: 'validation.invalidEmails' }
        })
        return
      }

      const recipientsArray = recipients
        .split(',')
        .map(e => e.trim())
        .filter(Boolean)

      const method = schedule ? 'POST' : 'POST' // Usar POST para criar ou atualizar
      const url = schedule 
        ? `/api/reports/schedule?scheduleId=${schedule.id}`
        : '/api/reports/schedule'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId: schedule?.id,
          companyId: selectedCompany,
          reportKey: selectedReport,
          cron: cronExpression,
          recipients: recipientsArray,
          isActive: isActive,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar agendamento')
      }

      const responseData = await response.json()
      const scheduleId = schedule?.id || responseData.schedule?.id

      // Sincronização com Supabase (garantia adicional)
      if (scheduleId) {
        await sync({
          resourceType: 'schedule',
          resourceId: scheduleId,
          action: schedule ? 'update' : 'create',
          data: {
            company_id: selectedCompany,
            report_key: selectedReport,
            cron: cronExpression,
            recipients: recipientsArray,
            is_active: isActive,
          },
        })
      }

      notifySuccess(`Agendamento ${schedule ? 'atualizado' : 'criado'} com sucesso!`, {
        i18n: { ns: 'operador', key: schedule ? 'reports.schedule.successUpdated' : 'reports.schedule.successCreated' }
      })
      onSave()
      onClose()
      
      // Reset form apenas se não estiver editando
      if (!schedule) {
        setSelectedCompany("")
        setSelectedReport(reportKey)
        setCronExpression("")
        setCronPreset("")
        setRecipients("")
        setIsActive(true)
      }
    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error)
      notifyError(error.message || "Erro ao criar agendamento", undefined, {
        i18n: { ns: 'operador', key: 'reports.schedule.errors.createSchedule' }
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 break-words">
            <Clock className="h-5 w-5 flex-shrink-0" />
            {schedule ? 'Editar Agendamento' : 'Agendar Relatório'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Empresa */}
          <div className="space-y-2">
            <Label htmlFor="company" className="text-base font-medium">Empresa *</Label>
            <Select
              value={selectedCompany}
              onValueChange={setSelectedCompany}
              required
            >
              <SelectTrigger className="min-h-[48px] text-base">
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Relatório */}
          <div className="space-y-2">
            <Label htmlFor="report" className="text-base font-medium">Relatório *</Label>
            <Select
              value={selectedReport}
              onValueChange={setSelectedReport}
              required
            >
              <SelectTrigger className="min-h-[48px] text-base">
                <SelectValue placeholder="Selecione um relatório" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((report) => (
                  <SelectItem key={report.id} value={report.id}>
                    {report.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cron Expression */}
          <div className="space-y-2">
            <Label htmlFor="cron">Cron Expression *</Label>
            <div className="space-y-2">
              <Select
                value={cronPreset}
                onValueChange={(value) => {
                  setCronPreset(value)
                  const preset = CRON_PRESETS.find(p => p.value === value)
                  if (preset) {
                    setCronExpression(preset.value)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ou escolha um preset" />
                </SelectTrigger>
                <SelectContent>
                  {CRON_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="cron"
                placeholder="0 9 * * 1 (minuto hora dia mês dia-semana)"
                value={cronExpression}
                onChange={(e) => {
                  setCronExpression(e.target.value)
                  setCronPreset("")
                }}
                required
              />
              <p className="text-xs text-ink-muted">
                Formato: minuto (0-59) hora (0-23) dia (1-31) mês (1-12) dia-semana (0-6)
              </p>
            </div>
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label htmlFor="recipients" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Destinatários (emails separados por vírgula) *
            </Label>
            <Input
              id="recipients"
              type="text"
              placeholder="email1@exemplo.com, email2@exemplo.com"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              required
            />
          </div>

          {/* Ativo */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Agendamento ativo
            </Label>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto order-2 sm:order-1 text-base font-medium"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto order-1 sm:order-2 bg-brand hover:bg-brand-hover text-base font-medium"
            >
              {loading ? "Salvando..." : "Agendar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

