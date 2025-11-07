"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"
import { auditLogs } from "@/lib/audit-log"
import { useSupabaseSync } from "@/hooks/use-supabase-sync"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

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
        .from('companies')
        .select('id, name')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar empresas:', error)
      toast.error('Erro ao carregar empresas')
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.company_id) {
      toast.error('Preencha nome e empresa')
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
          .from('routes')
          .update(payload)
          .eq('id', route.id)

        if (error) throw error
        toast.success('Rota atualizada com sucesso!')

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
          .from('routes')
          .insert(payload)
          .select()
          .single()

        if (error) throw error
        
        // Atualizar formData com o ID criado
        if (data) {
          setFormData({ ...formData, id: data.id })
          
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
      console.error('Erro ao salvar rota:', error)
      toast.error(`Erro ao salvar: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateStops = async () => {
    if (!route?.id && !formData.id) {
      toast.error('Salve a rota antes de gerar pontos')
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
      toast.success('Pontos gerados e salvos com sucesso!')
      if (onGenerateStops) await onGenerateStops(routeId)
    } catch (error: any) {
      console.error('Erro ao gerar pontos:', error)
      toast.error(`Erro ao gerar pontos: ${error.message}`)
    } finally {
      setGeneratingStops(false)
    }
  }

  const handleOptimize = async () => {
    if (!route?.id && !formData.id) {
      toast.error('Salve a rota antes de otimizar')
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

      toast.success('Rota otimizada com sucesso!')
      
      if (onOptimize) {
        await onOptimize(routeId)
      }
    } catch (error: any) {
      console.error('Erro ao otimizar rota:', error)
      toast.error(`Erro ao otimizar: ${error.message}`)
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
    const exceptions = formData.exceptions || []
    if (!exceptions.includes(newException)) {
      setFormData({ ...formData, exceptions: [...exceptions, newException] })
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
          toast.success('Plano de rota atualizado')
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-[var(--brand)]" />
            {route?.id ? 'Editar Rota' : 'Nova Rota'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nome e Empresa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome da Rota *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Linha 101 - Centro/Aeroporto"
              />
            </div>
            <div>
              <Label htmlFor="company">Empresa *</Label>
              <Select
                value={formData.company_id}
                onValueChange={(value) => setFormData({ ...formData, company_id: value })}
              >
                <SelectTrigger>
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
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição da rota"
            />
          </div>

          {/* Origem e Destino */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="origin" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Origem
              </Label>
              <Input
                id="origin"
                value={formData.origin_address || ""}
                onChange={(e) => setFormData({ ...formData, origin_address: e.target.value })}
                placeholder="Endereço de origem"
              />
            </div>
            <div>
              <Label htmlFor="destination" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Destino
              </Label>
              <Input
                id="destination"
                value={formData.destination_address || ""}
                onChange={(e) => setFormData({ ...formData, destination_address: e.target.value })}
                placeholder="Endereço de destino"
              />
            </div>
          </div>

          {/* Horário e Turno */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horário
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.scheduled_time || ""}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="shift">Turno</Label>
              <Select
                value={formData.shift || 'manha'}
                onValueChange={(value) => setFormData({ ...formData, shift: value })}
              >
                <SelectTrigger>
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

          {/* Dias da Semana */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4" />
              Dias da Semana
            </Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = (formData.days_of_week || []).includes(day.value)
                return (
                  <Button
                    key={day.value}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDay(day.value)}
                  >
                    {day.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Exceções/Feriados */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4" />
              Exceções (Datas sem rota)
            </Label>
            <div className="flex gap-2 mb-2">
              <Input
                type="date"
                value={newException}
                onChange={(e) => setNewException(e.target.value)}
                className="flex-1"
              />
              <Button type="button" onClick={addException} size="sm">
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(formData.exceptions || []).map((date) => (
                <Badge key={date} variant="secondary" className="flex items-center gap-1">
                  {new Date(date).toLocaleDateString('pt-BR')}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeException(date)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="is_active">Rota ativa</Label>
          </div>
        </div>

        {/* Configuração do Gerador */}
        <div className="space-y-3 p-3 border rounded-md">
          <div className="font-medium">Configuração do Gerador</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Fonte de funcionários</Label>
              <Input value={employeeTable} onChange={(e) => setEmployeeTable(e.target.value)} placeholder="ex.: gf_employee_company" />
            </div>
            <div>
              <Label>Velocidade média (km/h)</Label>
              <Input type="number" value={avgSpeedKmh} onChange={(e) => setAvgSpeedKmh(Number(e.target.value) || 30)} />
            </div>
            <div>
              <Label>Debounce realtime (ms)</Label>
              <Input type="number" value={debounceMs} onChange={(e) => setDebounceMs(Number(e.target.value) || 500)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Itens por página</Label>
              <Input type="number" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value) || 200)} />
            </div>
            <div>
              <Label>Tentativas de reconexão</Label>
              <Input type="number" value={realtimeRetries} onChange={(e) => setRealtimeRetries(Number(e.target.value) || 3)} />
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            {route?.id || formData.id ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleGenerateStops}
                  disabled={generatingStops}
                  className="flex-1"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {generatingStops ? 'Gerando...' : 'Gerar Pontos'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOptimize}
                  disabled={optimizing}
                  className="flex-1"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  {optimizing ? 'Otimizando...' : 'Otimizar Rota'}
                </Button>
              </>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

