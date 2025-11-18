"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Route,
  MapPin,
  Clock,
  Calendar,
  Building2,
  Users,
  Truck,
  User,
  Search,
  X,
  Navigation,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import { maskCPF } from "@/lib/geocoding"
import { optimizeRoute } from "@/lib/route-optimization"
import { loadGoogleMaps } from "@/lib/google-maps-loader"
import { geocodeAddress } from "@/lib/geocoding"
import type { EmployeeLite, OptimizeRouteResponse, RouteFormData } from "@/types/routes"
import { DriverPickerModal } from "@/components/admin/driver-picker-modal"
import { VehiclePickerModal } from "@/components/admin/vehicle-picker-modal"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { z } from "zod"
import React from "react"

const routeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  company_id: z.string().min(1, "Empresa é obrigatória"),
  scheduled_time: z.string().min(1, "Horário é obrigatório"),
  shift: z.enum(["manha", "tarde", "noite"]),
  selected_employees: z.array(z.string()).min(1, "Selecione pelo menos um funcionário"),
})

const DAYS_OF_WEEK = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
]

interface RouteCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function RouteCreateModal({ isOpen, onClose, onSave }: RouteCreateModalProps) {
  const [formData, setFormData] = useState<Partial<RouteFormData>>({
    name: "",
    company_id: "",
    description: "",
    origin_address: "",
    origin_lat: 0,
    origin_lng: 0,
    destination_address: "",
    destination_lat: 0,
    destination_lng: 0,
    scheduled_time: "",
    shift: "manha",
    days_of_week: [],
    exceptions: [],
    is_active: true,
    selected_employees: [],
  })

  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [employees, setEmployees] = useState<EmployeeLite[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [searchEmployee, setSearchEmployee] = useState("")
  const [selectedDriver, setSelectedDriver] = useState<{ id: string; name: string; documents_valid?: boolean } | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<{ id: string; plate: string; capacity: number } | null>(null)
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false)
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState<OptimizeRouteResponse | null>(null)
  const [optimizing, setOptimizing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [newException, setNewException] = useState("")

  useEffect(() => {
    if (isOpen) {
      loadCompanies()
      loadGoogleMaps()
        .then(() => setMapLoaded(true))
        .catch((err) => {
          setMapError("Erro ao carregar Google Maps")
          console.error(err)
        })
    } else {
      // Reset form when closing
      setFormData({
        name: "",
        company_id: "",
        description: "",
        origin_address: "",
        origin_lat: 0,
        origin_lng: 0,
        destination_address: "",
        destination_lat: 0,
        destination_lng: 0,
        scheduled_time: "",
        shift: "manha",
        days_of_week: [],
        exceptions: [],
        is_active: true,
        selected_employees: [],
      })
      setSelectedDriver(null)
      setSelectedVehicle(null)
      setOptimizationResult(null)
      setWarnings([])
      setNewException("")
      setSearchEmployee("")
    }
  }, [isOpen])

  useEffect(() => {
    if (formData.company_id) {
      loadEmployees()
      loadCompanyAddress()
    }
  }, [formData.company_id])

  const loadCompanies = async () => {
    try {
      console.log("🔄 Carregando empresas...")
      
      // Usar API route (bypass RLS com service role)
      const response = await fetch('/api/admin/companies-list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Incluir cookies
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.companies) {
          console.log("✅ Empresas carregadas via API:", result.companies.length, result.companies)
          setCompanies(result.companies)
          return
        } else {
          console.warn("⚠️ API retornou sucesso mas sem empresas:", result)
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        console.warn("⚠️ Erro na API, tentando direto:", errorData)
      }
      
      // Fallback: tentar direto via Supabase
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name")

      if (error) {
        console.error("❌ Erro ao buscar empresas:", error)
        throw error
      }
      
      console.log("✅ Empresas carregadas:", data?.length || 0, data)
      setCompanies(data || [])
      
      if (!data || data.length === 0) {
        console.warn("⚠️ Nenhuma empresa encontrada no banco de dados")
      }
    } catch (error) {
      console.error("❌ Erro ao carregar empresas:", error)
      notifyError(error, "Erro ao carregar empresas")
    }
  }

  const loadEmployees = async () => {
    if (!formData.company_id) return

    setLoadingEmployees(true)
    try {
      console.log("🔍 Carregando funcionários para company_id:", formData.company_id)
      // Tentar usar a view primeiro, se não existir usar a tabela diretamente
      let { data, error } = await supabase
        .from("v_company_employees_secure")
        .select("*")
        .eq("company_id", formData.company_id)

      // Fallback: usar API route (bypass RLS com service role)
      if (error && (error.message?.includes("does not exist") || (error as any).code === "PGRST205")) {
        console.log("🔄 Usando API route para carregar funcionários (bypass RLS)")
        console.log("🔍 Buscando funcionários com company_id:", formData.company_id)
        
        try {
          const response = await fetch(`/api/admin/employees-list?company_id=${formData.company_id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          })

          if (response.ok) {
            const result = await response.json()
            if (result.success && result.employees) {
              console.log(`✅ Funcionários carregados via API: ${result.employees.length}`)
              setEmployees(result.employees as EmployeeLite[])
              return
            } else {
              console.warn("⚠️ API retornou sucesso mas sem funcionários:", result)
            }
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
            console.warn("⚠️ Erro na API de funcionários:", errorData)
          }
        } catch (apiError) {
          console.error("❌ Erro ao chamar API de funcionários:", apiError)
        }

        // Fallback final: tentar direto da tabela (pode falhar por RLS)
        console.log("🔄 Tentando fallback final: carregando diretamente da tabela")
        const { data: empData, error: empError } = await supabase
          .from("gf_employee_company")
          .select("id, company_id, name, cpf, address, latitude, longitude")
          .eq("company_id", formData.company_id)
        
        console.log("📊 Resultado da consulta direta:", { empData, empError, count: empData?.length || 0 })

        if (empError) {
          console.error("❌ Erro ao carregar da tabela:", empError)
          throw empError
        }

        // Transformar dados da tabela para o formato EmployeeLite
        data = (empData || []).map((emp: any) => ({
          employee_id: emp.id,
          company_id: emp.company_id,
          first_name: emp.name?.split(" ")[0] || "",
          last_name: emp.name?.split(" ").slice(1).join(" ") || "",
          cpf: emp.cpf || "",
          address: emp.address || "",
          city: "",
          state: "",
          zipcode: "",
          lat: emp.latitude ? parseFloat(emp.latitude.toString()) : null,
          lng: emp.longitude ? parseFloat(emp.longitude.toString()) : null,
        })) as any
        console.log(`✅ Funcionários carregados via fallback: ${data?.length || 0}`)
        setEmployees((data || []) as EmployeeLite[])
        return
      } else if (error) {
        throw error
      }

      setEmployees((data || []) as EmployeeLite[])
    } catch (error: any) {
      console.error("Erro ao carregar funcionários:", error)
      // Se o erro for PGRST205, tentar fallback novamente
      if ((error as any)?.code === "PGRST205" || error?.message?.includes("does not exist")) {
        console.log("🔄 Tentando fallback novamente após catch...")
        try {
          const { data: empData, error: empError } = await supabase
            .from("gf_employee_company")
            .select("id, company_id, name, cpf, address, latitude, longitude")
            .eq("company_id", formData.company_id)

          if (empError) throw empError

          const transformedData = (empData || []).map((emp: any) => ({
            employee_id: emp.id,
            company_id: emp.company_id,
            first_name: emp.name?.split(" ")[0] || "",
            last_name: emp.name?.split(" ").slice(1).join(" ") || "",
            cpf: emp.cpf || "",
            address: emp.address || "",
            city: "",
            state: "",
            zipcode: "",
            lat: emp.latitude ? parseFloat(emp.latitude.toString()) : null,
            lng: emp.longitude ? parseFloat(emp.longitude.toString()) : null,
          })) as EmployeeLite[]

          console.log(`✅ Funcionários carregados via fallback (catch): ${transformedData.length}`)
          setEmployees(transformedData)
          return
        } catch (fallbackError) {
          console.error("❌ Erro no fallback:", fallbackError)
          notifyError(fallbackError, "Erro ao carregar funcionários")
        }
      } else {
        notifyError(error, "Erro ao carregar funcionários")
      }
    } finally {
      setLoadingEmployees(false)
    }
  }

  const loadCompanyAddress = async () => {
    if (!formData.company_id) return

    try {
      const { data } = await supabase
        .from("companies")
        .select("address")
        .eq("id", formData.company_id)
        .maybeSingle()

      if (data && typeof data === 'object' && (data as any).address) {
        const address = (data as any).address
        if (address) {
          const geocoded = await geocodeAddress(address)
          if (geocoded) {
            setFormData((prev) => ({
              ...prev,
              destination_address: geocoded.formatted_address,
              destination_lat: geocoded.lat,
              destination_lng: geocoded.lng,
            }))
          } else {
            setFormData((prev) => ({
              ...prev,
              destination_address: address,
            }))
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar endereço da empresa:", error)
    }
  }

  const filteredEmployees = useMemo(() => {
    if (!searchEmployee) return employees

    const query = searchEmployee.toLowerCase().trim()
    const queryNumbers = query.replace(/\D/g, "")
    
    return employees.filter(
      (e) => {
        const fullName = `${e.first_name} ${e.last_name}`.toLowerCase()
        const cpfNumbers = e.cpf.replace(/\D/g, "")
        
        return (
          fullName.includes(query) ||
          fullName.startsWith(query) ||
          cpfNumbers.includes(queryNumbers) ||
          cpfNumbers.startsWith(queryNumbers)
        )
      }
    )
  }, [employees, searchEmployee])

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
      setFormData((prev) => ({ ...prev, exceptions: [...exceptions, dateStr] }))
      setNewException("")
    }
  }

  const removeException = (date: string) => {
    const exceptions = formData.exceptions || []
    setFormData((prev) => ({ ...prev, exceptions: exceptions.filter(e => e !== date) }))
  }

  const toggleEmployee = (employeeId: string) => {
    setFormData((prev) => {
      const selected = prev.selected_employees || []
      const newSelected = selected.includes(employeeId)
        ? selected.filter((id) => id !== employeeId)
        : [...selected, employeeId]
      return { ...prev, selected_employees: newSelected }
    })
  }

  const handleOptimize = async () => {
    if (!formData.company_id || !formData.selected_employees || formData.selected_employees.length === 0) {
      notifyError(new Error("Selecione pelo menos um funcionário"), "Selecione funcionários")
      return
    }

    const selectedEmps = employees.filter((e) => formData.selected_employees?.includes(e.employee_id))
    const missingCoords = selectedEmps.filter((e) => !e.lat || !e.lng)

    if (missingCoords.length > 0) {
      setWarnings([`${missingCoords.length} funcionário(s) sem coordenadas. Geocodificando...`])
      
      for (const emp of missingCoords) {
        const geocoded = await geocodeAddress(emp.address)
        if (geocoded) {
          const updatePayload: { latitude: number; longitude: number } = { 
            latitude: geocoded.lat, 
            longitude: geocoded.lng 
          }
          // @ts-ignore - Supabase types are too strict for dynamic updates
          const updateQuery = (supabase.from("gf_employee_company").update(updatePayload as any) as any)
          const { error: updateError } = await updateQuery.eq("id", emp.employee_id)
          if (updateError) console.warn("Erro ao atualizar coordenadas:", updateError)
        }
      }
      
      await loadEmployees()
    }

    const waypoints = selectedEmps
      .filter((e) => e.lat && e.lng)
      .map((e) => ({
        id: e.employee_id,
        lat: e.lat!,
        lng: e.lng!,
      }))

    if (waypoints.length === 0) {
      notifyError(new Error("Nenhum funcionário com coordenadas válidas"), "Erro")
      return
    }

    // Se origem não tiver coordenadas, usar primeiro funcionário como origem
    let originLat = formData.origin_lat
    let originLng = formData.origin_lng
    if (!originLat || !originLng) {
      if (waypoints.length > 0) {
        originLat = waypoints[0].lat
        originLng = waypoints[0].lng
        setFormData((prev) => ({
          ...prev,
          origin_lat: waypoints[0].lat,
          origin_lng: waypoints[0].lng,
          origin_address: prev.origin_address || "Primeiro ponto",
        }))
      } else {
        notifyError(new Error("Defina a origem (garagem) ou selecione funcionários"), "Erro")
        return
      }
    }

    // Se destino não tiver coordenadas, usar último funcionário como destino
    let destLat = formData.destination_lat
    let destLng = formData.destination_lng
    if (!destLat || !destLng) {
      if (waypoints.length > 0) {
        const lastWaypoint = waypoints[waypoints.length - 1]
        destLat = lastWaypoint.lat
        destLng = lastWaypoint.lng
        setFormData((prev) => ({
          ...prev,
          destination_lat: lastWaypoint.lat,
          destination_lng: lastWaypoint.lng,
          destination_address: prev.destination_address || "Último ponto",
        }))
      } else {
        notifyError(new Error("Defina o destino (empresa) ou selecione funcionários"), "Erro")
        return
      }
    }

    setOptimizing(true)
    try {
      // Criar timestamp ISO para o horário agendado (hoje + horário)
      let departureTimeIso: string | undefined
      if (formData.scheduled_time) {
        const [hours, minutes] = formData.scheduled_time.split(":")
        const departureDate = new Date()
        departureDate.setHours(parseInt(hours || "0", 10), parseInt(minutes || "0", 10), 0, 0)
        departureTimeIso = Math.floor(departureDate.getTime() / 1000).toString()
      }

      const result = await optimizeRoute({
        companyId: formData.company_id,
        origin: { lat: originLat!, lng: originLng! },
        destination: { lat: destLat!, lng: destLng! },
        waypoints,
        departureTimeIso,
      })

      setOptimizationResult(result)
      
      const newWarnings: string[] = []
      
      if (selectedVehicle && selectedVehicle.capacity < waypoints.length) {
        newWarnings.push(`⚠️ Capacidade do veículo (${selectedVehicle.capacity}) menor que número de passageiros (${waypoints.length})`)
      }
      
      if (!selectedDriver) {
        newWarnings.push("⚠️ Motorista não selecionado")
      }
      
      if (!selectedVehicle) {
        newWarnings.push("⚠️ Veículo não selecionado")
      }
      
      if (selectedDriver && selectedDriver.documents_valid === false) {
        newWarnings.push("⚠️ Motorista com documentos pendentes")
      }
      
      setWarnings([...(result.warnings || []), ...newWarnings])
    } catch (error: any) {
      notifyError(error, error.message || "Erro ao otimizar rota")
    } finally {
      setOptimizing(false)
    }
  }

  const handleSave = async () => {
    try {
      const validated = routeSchema.parse(formData)
      setSaving(true)

      if (!selectedDriver) {
        notifyError(new Error("Selecione um motorista"), "Motorista obrigatório")
        setSaving(false)
        return
      }

      if (!selectedVehicle) {
        notifyError(new Error("Selecione um veículo"), "Veículo obrigatório")
        setSaving(false)
        return
      }

      // Validar capacidade do veículo
      const orderedEmployees = optimizationResult
        ? optimizationResult.ordered.map((o) => o.id)
        : formData.selected_employees || []
      
      if (selectedVehicle.capacity < orderedEmployees.length) {
        const confirm = window.confirm(
          `Atenção: O veículo selecionado tem capacidade de ${selectedVehicle.capacity} passageiros, mas ${orderedEmployees.length} foram selecionados. Deseja continuar mesmo assim?`
        )
        if (!confirm) {
          setSaving(false)
          return
        }
      }

      const insertPayload = {
        name: validated.name,
        company_id: validated.company_id,
        description: formData.description || null,
        origin_address: formData.origin_address || null,
        origin_lat: formData.origin_lat || null,
        origin_lng: formData.origin_lng || null,
        destination_address: formData.destination_address || null,
        destination_lat: formData.destination_lat || null,
        destination_lng: formData.destination_lng || null,
        scheduled_time: validated.scheduled_time,
        shift: validated.shift,
        days_of_week: formData.days_of_week || [],
        exceptions: formData.exceptions || [],
        is_active: formData.is_active ?? true,
        driver_id: selectedDriver.id,
        vehicle_id: selectedVehicle.id,
        polyline: optimizationResult?.polyline || null,
      } as any
      const insertQuery = supabase.from("routes").insert(insertPayload) as any
      const { data: routeData, error: routeError } = await insertQuery.select("*").single()

      if (routeError) throw routeError

      // .single() retorna o objeto diretamente, não um array
      const routeId = (routeData as any)?.id
      if (!routeId) {
        console.error("Route data:", routeData)
        throw new Error("Erro ao criar rota: ID não retornado")
      }

      const stops = orderedEmployees.map((employeeId, index) => {
        const emp = employees.find((e) => e.employee_id === employeeId)
        if (!emp || !emp.lat || !emp.lng) {
          throw new Error(`Funcionário ${emp?.first_name || employeeId} sem coordenadas válidas`)
        }
        return {
          route_id: routeId,
          employee_id: employeeId,
          seq: index + 1,
          lat: emp.lat,
          lng: emp.lng,
          name: `${emp.first_name} ${emp.last_name}`,
          address: emp.address || null,
        }
      })

      const { error: stopsError } = await supabase.from("route_stops").insert(stops as any)

      if (stopsError) throw stopsError

      notifySuccess("Rota criada com sucesso!")
      onSave()
      onClose()
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        notifyError(error, error.errors[0].message)
      } else {
        notifyError(error, "Erro ao salvar rota")
      }
    } finally {
      setSaving(false)
    }
  }

  const selectedEmployeesData = useMemo(() => {
    return employees.filter((e) => formData.selected_employees?.includes(e.employee_id))
  }, [employees, formData.selected_employees])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6">
          <DialogHeader className="pb-2 sm:pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Route className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--brand)]" />
              Nova Rota
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Preencha os dados da rota, selecione os funcionários e otimize o trajeto
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="form" className="flex-1 flex flex-col overflow-hidden min-h-0">
            <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
              <TabsTrigger value="form" className="text-xs sm:text-sm">Formulário</TabsTrigger>
              <TabsTrigger value="preview" disabled={!optimizationResult} className="text-xs sm:text-sm">
                Pré-visualização
              </TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pt-3 sm:pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="grid gap-1.5 sm:gap-2">
                  <Label htmlFor="name" className="text-sm sm:text-base">Nome da Rota *</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Rota Centro - Manhã"
                    className="text-sm sm:text-base h-9 sm:h-10"
                  />
                </div>

                <div className="grid gap-1.5 sm:gap-2">
                  <Label htmlFor="company" className="text-sm sm:text-base">Empresa *</Label>
                  <Select
                    key={`company-select-${companies.length}`}
                    value={formData.company_id || ""}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        company_id: value,
                        selected_employees: [],
                      }))
                    }
                  >
                    <SelectTrigger id="company" className="text-sm sm:text-base h-9 sm:h-10">
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-gray-500">
                          Nenhuma empresa encontrada
                        </div>
                      ) : (
                        companies.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-sm sm:text-base">
                            {c.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.company_id && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Label className="text-sm sm:text-base">Funcionários *</Label>
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      Selecionados: {formData.selected_employees?.length || 0} / {employees.length}
                    </Badge>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nome ou CPF..."
                      value={searchEmployee}
                      onChange={(e) => setSearchEmployee(e.target.value)}
                      className="pl-10 text-sm sm:text-base h-9 sm:h-10"
                      aria-label="Buscar funcionários por nome ou CPF"
                    />
                  </div>
                  <ScrollArea className="h-[200px] sm:h-[300px] border rounded-lg p-2">
                    {loadingEmployees ? (
                      <div className="text-center py-8 text-gray-500">Carregando...</div>
                    ) : filteredEmployees.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">Nenhum funcionário encontrado</div>
                    ) : (
                      <div className="space-y-2">
                        {filteredEmployees.map((emp) => {
                          const isSelected = formData.selected_employees?.includes(emp.employee_id)
                          return (
                            <div
                              key={emp.employee_id}
                              className={`flex items-start gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                                isSelected ? "bg-orange-50 border-orange-200" : "hover:bg-gray-50"
                              }`}
                              onClick={() => toggleEmployee(emp.employee_id)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault()
                                  toggleEmployee(emp.employee_id)
                                }
                              }}
                              aria-label={`${isSelected ? "Desmarcar" : "Selecionar"} funcionário ${emp.first_name} ${emp.last_name}`}
                            >
                              <Checkbox 
                                checked={isSelected} 
                                onCheckedChange={() => toggleEmployee(emp.employee_id)}
                                aria-label={`${isSelected ? "Desmarcar" : "Selecionar"} ${emp.first_name} ${emp.last_name}`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium">
                                  {emp.first_name} {emp.last_name}
                                </div>
                                <div className="text-sm text-gray-600 truncate">{emp.address}</div>
                                {emp.cpf && (
                                  <div className="text-xs text-gray-400">{maskCPF(emp.cpf)}</div>
                                )}
                                {(!emp.lat || !emp.lng) && (
                                  <Badge variant="destructive" className="mt-1 text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Sem coordenadas
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}

              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="description" className="text-sm sm:text-base">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição opcional da rota"
                  className="text-sm sm:text-base h-9 sm:h-10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <AddressAutocomplete
                  value={formData.origin_address || ""}
                  onChange={(address, lat, lng) => {
                    setFormData((prev) => ({
                      ...prev,
                      origin_address: address,
                      origin_lat: lat || 0,
                      origin_lng: lng || 0,
                    }))
                    if (address && lat && lng) {
                      notifySuccess("Origem geocodificada automaticamente!")
                    }
                  }}
                  label="Origem (Garagem)"
                  placeholder="Digite o endereço da garagem..."
                  onGeocodeError={(error) => {
                    notifyError(error, "Erro no autocomplete")
                  }}
                  className="w-full"
                />
                <AddressAutocomplete
                  value={formData.destination_address || ""}
                  onChange={(address, lat, lng) => {
                    setFormData((prev) => ({
                      ...prev,
                      destination_address: address,
                      destination_lat: lat || 0,
                      destination_lng: lng || 0,
                    }))
                    if (address && lat && lng) {
                      notifySuccess("Destino geocodificado automaticamente!")
                    }
                  }}
                  label="Destino (Empresa)"
                  placeholder="Digite o endereço da empresa..."
                  onGeocodeError={(error) => {
                    notifyError(error, "Erro no autocomplete")
                  }}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="grid gap-1.5 sm:gap-2">
                  <Label htmlFor="time" className="text-sm sm:text-base">Horário *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.scheduled_time || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, scheduled_time: e.target.value }))}
                    className="text-sm sm:text-base h-9 sm:h-10"
                  />
                </div>
                <div className="grid gap-1.5 sm:gap-2">
                  <Label htmlFor="shift" className="text-sm sm:text-base">Turno *</Label>
                  <Select
                    value={formData.shift || "manha"}
                    onValueChange={(value: "manha" | "tarde" | "noite") =>
                      setFormData((prev) => ({ ...prev, shift: value }))
                    }
                  >
                    <SelectTrigger id="shift" className="text-sm sm:text-base h-9 sm:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manha" className="text-sm sm:text-base">Manhã</SelectItem>
                      <SelectItem value="tarde" className="text-sm sm:text-base">Tarde</SelectItem>
                      <SelectItem value="noite" className="text-sm sm:text-base">Noite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-1.5 sm:gap-2">
                <Label className="text-sm sm:text-base">Dias da Semana</Label>
                <div className="flex flex-wrap gap-2 mt-1 sm:mt-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = formData.days_of_week?.includes(day.value)
                    return (
                      <Badge
                        key={day.value}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                        onClick={() => {
                          setFormData((prev) => {
                            const days = prev.days_of_week || []
                            return {
                              ...prev,
                              days_of_week: isSelected
                                ? days.filter((d) => d !== day.value)
                                : [...days, day.value],
                            }
                          })
                        }}
                      >
                        {day.label}
                      </Badge>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-1.5 sm:gap-2">
                <Label className="flex items-center gap-2 text-sm sm:text-base">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  Exceções (Datas sem rota)
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="text"
                    value={newException}
                    onChange={(e) => setNewException(e.target.value)}
                    placeholder="dd/mm/aaaa"
                    className="flex-1 text-sm sm:text-base h-9 sm:h-10"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addException()
                      }
                    }}
                  />
                  <Button type="button" onClick={addException} size="sm" className="w-full sm:w-auto">
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.exceptions || []).map((date) => (
                    <Badge key={date} variant="secondary" className="flex items-center gap-1 text-xs sm:text-sm">
                      {new Date(date).toLocaleDateString('pt-BR')}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeException(date)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="grid gap-1.5 sm:gap-2">
                  <Label className="text-sm sm:text-base">Motorista</Label>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-sm sm:text-base h-9 sm:h-10"
                    onClick={() => setIsDriverModalOpen(true)}
                    aria-label="Selecionar motorista"
                  >
                    <User className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="truncate">{selectedDriver ? selectedDriver.name : "Selecionar Motorista"}</span>
                  </Button>
                </div>
                <div className="grid gap-1.5 sm:gap-2">
                  <Label className="text-sm sm:text-base">Veículo</Label>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-sm sm:text-base h-9 sm:h-10"
                    onClick={() => setIsVehicleModalOpen(true)}
                    aria-label="Selecionar veículo"
                  >
                    <Truck className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="truncate">{selectedVehicle ? `${selectedVehicle.plate} (Cap: ${selectedVehicle.capacity})` : "Selecionar Veículo"}</span>
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active ?? true}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked as boolean }))
                  }
                  className="w-4 h-4 sm:w-5 sm:h-5"
                />
                <Label htmlFor="is_active" className="text-sm sm:text-base cursor-pointer">Rota ativa</Label>
              </div>

              {warnings.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  {warnings.map((w, i) => (
                    <div key={i} className="text-sm text-yellow-800 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      {w}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-hidden flex flex-col">
              {optimizationResult && mapLoaded ? (
                <RoutePreviewMap
                  result={optimizationResult}
                  employees={selectedEmployeesData}
                  origin={formData.origin_address || ""}
                  destination={formData.destination_address || ""}
                />
              ) : mapError ? (
                <div className="text-center py-8 text-red-600">{mapError}</div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Clique em "Pré-visualizar & Otimizar" para ver o mapa
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex-shrink-0 flex-col sm:flex-row gap-2 sm:gap-0 pt-2 sm:pt-4 border-t mt-2 sm:mt-4">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={saving}
              aria-label="Cancelar criação de rota"
              className="w-full sm:w-auto order-3 sm:order-1 text-sm sm:text-base"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleOptimize}
              disabled={optimizing || !formData.company_id || !formData.selected_employees?.length}
              variant="outline"
              className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto order-2 sm:order-2 text-sm sm:text-base"
              aria-label="Pré-visualizar e otimizar rota"
            >
              {optimizing ? "Otimizando..." : <span className="hidden sm:inline">Pré-visualizar & Otimizar</span>}
              <span className="sm:hidden">Otimizar</span>
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto order-1 sm:order-3 text-sm sm:text-base"
              aria-label="Salvar rota"
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DriverPickerModal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        onSelect={(driver) => setSelectedDriver({ 
          id: driver.id, 
          name: driver.name,
          documents_valid: driver.documents_valid 
        })}
        companyId={formData.company_id}
      />

      <VehiclePickerModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onSelect={(vehicle) =>
          setSelectedVehicle({ id: vehicle.id, plate: vehicle.plate, capacity: vehicle.capacity })
        }
        companyId={formData.company_id}
        requiredCapacity={formData.selected_employees?.length}
      />
    </>
  )
}

function RoutePreviewMap({
  result,
  employees,
  origin,
  destination,
}: {
  result: OptimizeRouteResponse
  employees: EmployeeLite[]
  origin: string
  destination: string
}) {
  const mapRef = React.useRef<HTMLDivElement>(null)
  const [map, setMap] = React.useState<any>(null)
  const [manualOrder, setManualOrder] = React.useState<Array<{ id: string; lat: number; lng: number; order: number }>>(result.ordered)

  // Atualizar manualOrder quando result mudar
  React.useEffect(() => {
    setManualOrder(result.ordered)
  }, [result])

  // Função para mover item na lista
  const moveItem = React.useCallback((fromIndex: number, toIndex: number) => {
    setManualOrder((prev) => {
      const newOrder = [...prev]
      const [movedItem] = newOrder.splice(fromIndex, 1)
      newOrder.splice(toIndex, 0, movedItem)
      // Atualizar ordem numérica
      return newOrder.map((item, index) => ({
        ...item,
        order: index + 1
      }))
    })
  }, [])

  React.useEffect(() => {
    if (!mapRef.current || typeof window === "undefined" || !window.google?.maps) return

    const googleMap = new window.google.maps.Map(mapRef.current, {
      zoom: 12,
      center: { lat: result.ordered[0]?.lat || -23.5505, lng: result.ordered[0]?.lng || -46.6333 },
    })

    setMap(googleMap)

    if (!window.google.maps.LatLngBounds || !window.google.maps.Marker) return

    const bounds = new window.google.maps.LatLngBounds()

    // Origem
    if (result.ordered[0]) {
      new window.google.maps.Marker({
        position: { lat: result.ordered[0].lat, lng: result.ordered[0].lng },
        map: googleMap,
        label: "O",
        title: origin,
      })
      bounds.extend({ lat: result.ordered[0].lat, lng: result.ordered[0].lng })
    }

    // Paradas numeradas
    result.ordered.forEach((point) => {
      const emp = employees.find((e) => e.employee_id === point.id)
      new window.google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: googleMap,
        label: String(point.order),
        title: emp ? `${emp.first_name} ${emp.last_name}` : `Parada ${point.order}`,
      })
      bounds.extend({ lat: point.lat, lng: point.lng })
    })

    // Polyline otimizada
    if (result.polyline && window.google?.maps?.geometry?.encoding) {
      try {
        const decoded = window.google.maps.geometry.encoding.decodePath(result.polyline)
        new window.google.maps.Polyline({
          path: decoded,
          map: googleMap,
          strokeColor: "#10B981",
          strokeWeight: 4,
        })
      } catch (e) {
        console.warn("Erro ao decodificar polyline:", e)
      }
    }

    try {
      googleMap.fitBounds(bounds)
    } catch (e) {
      console.warn("Erro ao ajustar bounds do mapa:", e)
    }
  }, [result, employees, origin, destination])

  const totalMinutes = Math.round(result.totalDurationSeconds / 60)
  const totalKm = (result.totalDistanceMeters / 1000).toFixed(1)

  return (
    <div className="space-y-3 sm:space-y-4 h-full flex flex-col">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
          <div className="text-xs sm:text-sm text-gray-600">Distância Total</div>
          <div className="text-lg sm:text-2xl font-bold">{totalKm} km</div>
        </div>
        <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
          <div className="text-xs sm:text-sm text-gray-600">Tempo Total</div>
          <div className="text-lg sm:text-2xl font-bold">{totalMinutes} min</div>
        </div>
        <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
          <div className="text-xs sm:text-sm text-gray-600">Paradas</div>
          <div className="text-lg sm:text-2xl font-bold">{result.ordered.length}</div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <div ref={mapRef} className="w-full h-full rounded-lg" />
      </div>

      <div className="border rounded-lg p-2 sm:p-4 max-h-48 overflow-y-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
          <div className="font-medium text-sm sm:text-base">Ordem dos Embarques:</div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {JSON.stringify(manualOrder.map((o: { id: string }) => o.id)) !== JSON.stringify(result.ordered.map((o: { id: string }) => o.id)) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setManualOrder(result.ordered)}
                aria-label="Aplicar ordem otimizada"
                className="text-xs sm:text-sm flex-1 sm:flex-initial"
              >
                <span className="hidden sm:inline">Aplicar Ordem Otimizada</span>
                <span className="sm:hidden">Aplicar</span>
              </Button>
            )}
            {JSON.stringify(manualOrder.map((o: { id: string }) => o.id)) !== JSON.stringify(result.ordered.map((o: { id: string }) => o.id)) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setManualOrder(result.ordered)}
                aria-label="Reverter para ordem otimizada"
                className="text-xs sm:text-sm flex-1 sm:flex-initial"
              >
                Reverter
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-1">
          {manualOrder.map((point: { id: string; lat: number; lng: number; order: number }, idx: number) => {
            const emp = employees.find((e) => e.employee_id === point.id)
            return (
              <div
                key={point.id}
                className="flex items-center gap-2 text-xs sm:text-sm p-1.5 sm:p-2 hover:bg-gray-50 rounded cursor-move"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", idx.toString())
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const fromIndex = parseInt(e.dataTransfer.getData("text/plain"))
                  moveItem(fromIndex, idx)
                }}
                aria-label={`Parada ${point.order}: ${emp ? `${emp.first_name} ${emp.last_name}` : `Parada ${point.order}`}. Arraste para reordenar`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp" && idx > 0) {
                    e.preventDefault()
                    moveItem(idx, idx - 1)
                  } else if (e.key === "ArrowDown" && idx < manualOrder.length - 1) {
                    e.preventDefault()
                    moveItem(idx, idx + 1)
                  }
                }}
              >
                <Badge className="text-xs">{point.order}</Badge>
                <span className="flex-1 truncate">
                  {emp ? `${emp.first_name} ${emp.last_name}` : `Parada ${point.order}`}
                </span>
                <Navigation className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

