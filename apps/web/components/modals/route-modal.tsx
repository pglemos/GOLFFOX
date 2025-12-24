"use client"

import { useState, useEffect } from "react"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  Route,
  MapPin,
  Clock,
  Calendar,
  Building2,
  X,
  Sparkles,
  Navigation
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { logError } from "@/lib/logger"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSupabaseSync } from "@/hooks/use-supabase-sync"
import { auditLogs } from "@/lib/audit-log"
import { formatError } from "@/lib/error-utils"
import { globalSyncManager } from "@/lib/global-sync"
import { t } from "@/lib/i18n"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import type { Database } from "@/types/supabase"

type RotasUpdate = Database['public']['Tables']['rotas']['Update']
type RotasInsert = Database['public']['Tables']['rotas']['Insert']

interface RouteData {
  id?: string
  name: string
  company_id: string
  description?: string
  origin_address?: string
  origin_lat?: number
  origin_lng?: number
  destination_address?: string
  destination_lat?: number
  destination_lng?: number
  scheduled_time?: string
  days_of_week?: number[] // 0-6 (domingo-sábado)
  exceptions?: string[] // Datas de exceção (YYYY-MM-DD)
  holidays?: string[] // Feriados aplicáveis
  is_active?: boolean
  shift?: string
}

interface RouteModalProps {
  route: RouteData | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  onGenerateStops?: (routeId: string) => Promise<void>
  onOptimize?: (routeId: string) => Promise<void>
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

const SHIFTS = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
]

export function RouteModal({
  route,
  isOpen,
  onClose,
  onSave,
  onGenerateStops,
  onOptimize
}: RouteModalProps) {
  const { sync } = useSupabaseSync({ showToast: false })
  const [formData, setFormData] = useState<RouteData>({
    name: "",
    company_id: "",
    description: "",
    origin_address: "",
    destination_address: "",
    scheduled_time: "",
    days_of_week: [],
    exceptions: [],
    holidays: [],
    is_active: true,
    shift: 'manha'
  })
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(false)
  const [generatingStops, setGeneratingStops] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [newException, setNewException] = useState("")
  const [avgSpeedKmh, setAvgSpeedKmh] = useState<number>(30)
  const [employeeTable, setEmployeeTable] = useState<string>(process.env.NEXT_PUBLIC_EMPLOYEE_DB_TABLE || 'gf_employee_company')
  const [debounceMs, setDebounceMs] = useState<number>(Number(process.env.NEXT_PUBLIC_STOPS_DEBOUNCE_MS || 500))
  const [itemsPerPage, setItemsPerPage] = useState<number>(Number(process.env.NEXT_PUBLIC_EMPLOYEE_PAGE_SIZE || 200))
  const [realtimeRetries, setRealtimeRetries] = useState<number>(Number(process.env.NEXT_PUBLIC_REALTIME_RETRIES || 3))

  useEffect(() => {
    if (route) {
      setFormData({
        ...route,
        days_of_week: route.days_of_week || [],
        exceptions: route.exceptions || [],
        holidays: route.holidays || []
      })
    } else {
      setFormData({
        name: "",
        company_id: "",
        description: "",
        origin_address: "",
        destination_address: "",
        scheduled_time: "",
        days_of_week: [],
        exceptions: [],
        holidays: [],
        is_active: true,
        shift: 'manha'
      })
    }
    loadCompanies()
  }, [route, isOpen])

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, name')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error: any) {
      logError('Erro ao carregar empresas', { error }, 'RouteModal')
      notifyError(error, t('common', 'errors.loadCompanies'))
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.company_id) {
      notifyError('', undefined, { i18n: { ns: 'common', key: 'validation.fillNameCompany' } })
      return
    }

    setLoading(true)
    try {
      // Payload comum para sincronização/auditoria
      const payload = {
        name: formData.name,
        company_id: formData.company_id,
        description: formData.description || null,
        origin_address: formData.origin_address || null,
        origin_lat: formData.origin_lat || null,
        origin_lng: formData.origin_lng || null,
        destination_address: formData.destination_address || null,
        destination_lat: formData.destination_lat || null,
        destination_lng: formData.destination_lng || null,
        scheduled_time: formData.scheduled_time || null,
        days_of_week: formData.days_of_week || [],
        exceptions: formData.exceptions || [],
        holidays: formData.holidays || [],
        is_active: formData.is_active,
        shift: formData.shift
      }
      if (route?.id) {
        // Atualizar
        const { error } = await supabase
          .from('rotas')
          .update(payload as RotasUpdate)
          .eq('id', route.id)

        if (error) throw error
        notifySuccess('', { i18n: { ns: 'common', key: 'success.routeUpdated' } })

        // Notificar sincronização global
        globalSyncManager.triggerSync('route.updated', { id: route.id, ...payload })

        // Sincronização e auditoria para update
        await sync({
          resourceType: 'route',
          resourceId: route.id,
          action: 'update',
          data: payload,
        })
        await auditLogs.update('route', route.id, { name: formData.name })
      } else {
        // Criar
        const { data, error } = await supabase
          .from('rotas')
          .insert(payload as RotasInsert)
          .select("*")
          .single()

        if (error) throw error

        // Atualizar formData com o ID criado
        if (data) {
          setFormData({ ...formData, id: data.id })

          // Notificar sincronização global
          globalSyncManager.triggerSync('route.created', data)

          // Sincronização com Supabase (garantia adicional)
          await sync({
            resourceType: 'route',
            resourceId: data.id,
            action: 'create',
            data: payload,
          })

          // Log de auditoria
          await auditLogs.create('route', data.id, { name: formData.name, company_id: formData.company_id })
        }
      }

      onSave()
      onClose()
    } catch (error: any) {
      logError('Erro ao salvar rota', { error }, 'RouteModal')
      notifyError(error, t('common', 'errors.saveRoute'))
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateStops = async () => {
    if (!route?.id && !formData.id) {
      notifyError('', undefined, { i18n: { ns: 'common', key: 'validation.saveRouteFirst' } })
      return
    }

    const routeId = route?.id || formData.id
    if (!routeId) return

    setGeneratingStops(true)
    try {
      const resp = await fetch('/api/admin/generate-stops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId,
          avgSpeedKmh,
          employeeDb: employeeTable,
          itemsPerPage,
          dbSave: true, // salvar direto em gf_route_plan com service role
          tableName: 'gf_route_plan'
        })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Falha ao gerar pontos')
      notifySuccess('', { i18n: { ns: 'common', key: 'success.pointsGeneratedSaved' } })
      if (onGenerateStops) await onGenerateStops(routeId)
    } catch (error: any) {
      logError('Erro ao gerar pontos', { error }, 'RouteModal')
      notifyError(error, t('common', 'errors.generatePoints'))
    } finally {
      setGeneratingStops(false)
    }
  }

  const handleOptimize = async () => {
    if (!route?.id && !formData.id) {
      notifyError('', undefined, { i18n: { ns: 'common', key: 'validation.saveRouteBeforeOptimize' } })
      return
    }

    const routeId = route?.id || formData.id
    if (!routeId) return

    setOptimizing(true)
    try {
      const response = await fetch(`/api/admin/optimize-route?routeId=${routeId}`, {
        method: 'POST'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao otimizar rota')
      }

      notifySuccess('', { i18n: { ns: 'common', key: 'success.routeOptimized' } })

      if (onOptimize) {
        await onOptimize(routeId)
      }
    } catch (error: any) {
      logError('Erro ao otimizar rota', { error }, 'RouteModal')
      notifyError(error, t('common', 'errors.optimizeRoute'))
    } finally {
      setOptimizing(false)
    }
  }

  const toggleDay = (day: number) => {
    const days = formData.days_of_week || []
    if (days.includes(day)) {
      setFormData({ ...formData, days_of_week: days.filter(d => d !== day) })
    } else {
      setFormData({ ...formData, days_of_week: [...days, day] })
    }
  }

  const addException = () => {
    if (!newException) return

    // Converter formato dd/mm/aaaa para YYYY-MM-DD
    let dateStr = newException.trim()
    const parts = dateStr.split('/')

    if (parts.length === 3) {
      // Formato dd/mm/aaaa
      const day = parts[0].padStart(2, '0')
      const month = parts[1].padStart(2, '0')
      const year = parts[2]
      dateStr = `${year}-${month}-${day}`
    }

    const exceptions = formData.exceptions || []
    if (!exceptions.includes(dateStr)) {
      setFormData({ ...formData, exceptions: [...exceptions, dateStr] })
      setNewException("")
    }
  }

  const removeException = (date: string) => {
    const exceptions = formData.exceptions || []
    setFormData({ ...formData, exceptions: exceptions.filter(e => e !== date) })
  }

  // Realtime: assina mudanças no plano da rota e sincroniza com debounce
  useEffect(() => {
    const routeId = route?.id || formData.id
    if (!isOpen || !routeId) return
    let attempts = 0
    let timeoutRef: any
    let unsub: any
    let scheduled: any

    const trigger = () => {
      if (scheduled) clearTimeout(scheduled)
      scheduled = setTimeout(async () => {
        try {
          if (onGenerateStops) await onGenerateStops(routeId)
          notifySuccess('', { i18n: { ns: 'common', key: 'success.routePlanUpdated' } })
        } catch (e) {
          // silencioso
        }
      }, debounceMs)
    }

    const subscribe = () => {
      attempts++
      unsub = supabase
        .channel(`rt_gf_route_plan_${routeId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'gf_route_plan', filter: `route_id=eq.${routeId}` }, trigger)
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            // ok
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            if (attempts <= realtimeRetries) {
              timeoutRef = setTimeout(subscribe, 1000 * attempts)
            }
          }
        })
    }
    subscribe()

    return () => {
      if (timeoutRef) clearTimeout(timeoutRef)
      if (scheduled) clearTimeout(scheduled)
      if (unsub) supabase.removeChannel(unsub)
    }
  }, [isOpen, route?.id, formData.id, debounceMs, realtimeRetries])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed top-[50%] left-[50%] z-50 grid translate-x-[-50%] translate-y-[-50%] gap-0 rounded-2xl border shadow-2xl shadow-black/20 duration-200 w-[95vw] sm:w-[90vw] max-w-3xl max-h-[95vh] overflow-hidden p-0 bg-card/95 backdrop-blur-sm border-border">
        {/* Header - Premium Style */}
        <DialogHeader className="p-4 sm:p-6 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 bg-gradient-to-r from-brand to-brand-hover bg-clip-text text-transparent">
                <div className="p-2 rounded-lg bg-gradient-to-br from-brand-light to-brand-soft shadow-sm">
                  <Route className="h-5 w-5 text-brand flex-shrink-0" />
                </div>
                {route?.id ? 'Editar Rota' : 'Nova Rota'}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base text-ink-muted">
                {route?.id ? "Edite as configurações da sua rota" : "Configure o itinerário e a programação da nova rota"}
              </DialogDescription>
            </div>

            {route?.id && (
              <Badge variant={formData.is_active ? "success" : "secondary"} className="hidden sm:flex">
                {formData.is_active ? "Ativa" : "Inativa"}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Content - Scrollable area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 max-h-[calc(95vh-180px)]">

          {/* Section 1: Informações Básicas */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink-muted/70">
              <Building2 className="h-4 w-4" />
              Informações Básicas
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium px-1">Nome da Rota *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Linha 101 - Centro/Aeroporto"
                  className="bg-background/50"
                  hover="enabled"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium px-1">Empresa *</Label>
                <Select
                  value={formData.company_id}
                  onValueChange={(value) => setFormData({ ...formData, company_id: value })}
                >
                  <SelectTrigger className="bg-background/50 h-[48px]">
                    <SelectValue placeholder="Selecione a empresa" />
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
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="description" className="text-sm font-medium px-1">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva brevemente esta rota..."
                  className="bg-background/50"
                  hover="enabled"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Itinerário */}
          <section className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink-muted/70">
              <MapPin className="h-4 w-4" />
              Itinerário
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <Label htmlFor="origin" className="text-sm font-medium px-1">Origem</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand" />
                  <Input
                    id="origin"
                    value={formData.origin_address || ""}
                    onChange={(e) => setFormData({ ...formData, origin_address: e.target.value })}
                    placeholder="Ponto de partida"
                    className="pl-10 bg-background"
                    hover="enabled"
                  />
                </div>
              </div>
              <div className="space-y-2 relative">
                <Label htmlFor="destination" className="text-sm font-medium px-1">Destino</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-error" />
                  <Input
                    id="destination"
                    value={formData.destination_address || ""}
                    onChange={(e) => setFormData({ ...formData, destination_address: e.target.value })}
                    placeholder="Ponto final"
                    className="pl-10 bg-background"
                    hover="enabled"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Programação */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink-muted/70">
              <Clock className="h-4 w-4" />
              Programação
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="time" className="text-sm font-medium px-1">Horário de Saída</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.scheduled_time || ""}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  className="bg-background/50"
                  hover="enabled"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift" className="text-sm font-medium px-1">Turno</Label>
                <Select
                  value={formData.shift || 'manha'}
                  onValueChange={(value) => setFormData({ ...formData, shift: value })}
                >
                  <SelectTrigger className="bg-background/50 h-[48px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIFTS.map((shift) => (
                      <SelectItem key={shift.value} value={shift.value}>
                        {shift.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium px-1">Dias de Operação</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = (formData.days_of_week || []).includes(day.value)
                  return (
                    <Button
                      key={day.value}
                      type="button"
                      variant={isSelected ? "premium" : "outline"}
                      size="sm"
                      onClick={() => toggleDay(day.value)}
                      className={cn(
                        "flex-1 sm:flex-none transition-all duration-300",
                        isSelected
                          ? "bg-brand text-white border-brand hover:bg-brand-hover shadow-md scale-105"
                          : "hover:border-brand/40"
                      )}
                    >
                      <span className="hidden sm:inline">{day.label}</span>
                      <span className="sm:hidden">{day.label.substring(0, 3)}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium px-1">Exceções e Feriados</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newException}
                  onChange={(e) => setNewException(e.target.value)}
                  placeholder="dd/mm/aaaa"
                  className="flex-1 bg-background/50"
                  onKeyPress={(e) => e.key === 'Enter' && addException()}
                />
                <Button
                  type="button"
                  onClick={addException}
                  variant="outline"
                  className="shrink-0"
                >
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[1.5rem]">
                {(formData.exceptions || []).map((date) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={date}
                  >
                    <Badge variant="secondary" className="pl-3 pr-1 py-1 flex items-center gap-2 bg-muted/50 border-border group">
                      <span className="text-xs font-medium">
                        {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive rounded-full"
                        onClick={() => removeException(date)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 4: Opções Avançadas */}
          <section className="pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active_check"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="size-4 rounded border-border text-brand focus:ring-brand shadow-sm"
              />
              <Label htmlFor="is_active_check" className="text-sm font-medium cursor-pointer">
                Esta rota está ativa para operação
              </Label>
            </div>
          </section>
        </div>

        {/* Footer - Unified Actions */}
        <DialogFooter className="p-4 sm:p-6 border-t border-border bg-muted/30 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {route?.id || formData.id ? (
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={handleGenerateStops}
                  disabled={generatingStops || loading}
                  className="w-full sm:w-auto hover:bg-brand/5 hover:text-brand hover:border-brand/30"
                >
                  <Sparkles className={cn("h-4 w-4 mr-2", generatingStops && "animate-pulse")} />
                  {generatingStops ? 'Gerando...' : 'Gerar Pontos'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOptimize}
                  disabled={optimizing || loading}
                  className="w-full sm:w-auto hover:bg-brand/5 hover:text-brand hover:border-brand/30"
                >
                  <Navigation className={cn("h-4 w-4 mr-2", optimizing && "animate-spin-slow")} />
                  {optimizing ? 'Otimizando...' : 'Otimizar'}
                </Button>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1 sm:flex-initial text-ink-muted hover:text-ink"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || generatingStops || optimizing}
              className="flex-1 sm:flex-initial bg-brand hover:bg-brand-hover text-white shadow-lg shadow-brand/20 min-w-[120px]"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Rota'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

