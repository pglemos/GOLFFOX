"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Route, Navigation } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import { optimizeRoute } from "@/lib/route-optimization"
import { geocodeAddress } from "@/lib/geocoding"
import { GenericPickerModal, type PickerItem } from "@/components/shared/generic-picker-modal"
import { z } from "zod"
import React from "react"
import { useRouteCreate } from "./use-route-create"
import { RouteForm } from "@/components/modals/route-create/route-form"
import { EmployeeSelector } from "@/components/modals/route-create/employee-selector"
import { useGoogleMapsLoader } from "@/components/modals/route-create/use-google-maps-loader"
import type { OptimizeRouteResponse, EmployeeLite, RouteFormData } from "@/types/routes"

const routeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  company_id: z.string().min(1, "Empresa é obrigatória"),
  scheduled_time: z.string().min(1, "Horário é obrigatório"),
  shift: z.enum(["manha", "tarde", "noite"]),
  selected_employees: z.array(z.string()).min(1, "Selecione pelo menos um funcionário"),
})

interface RouteCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function RouteCreateModal({ isOpen, onClose, onSave }: RouteCreateModalProps) {
  const {
    formData, setFormData,
    companies, loadingCompanies,
    employees, loadingEmployees, loadEmployees,
    searchEmployee, setSearchEmployee,
    selectedMotorista, setSelectedMotorista,
    selectedVeiculo, setSelectedVeiculo,
    optimizationResult, setOptimizationResult,
    optimizing, setOptimizing,
    saving, setSaving,
    warnings, setWarnings,
    newException, setNewException,
    addException, removeException, toggleEmployee
  } = useRouteCreate(isOpen)

  const [isMotoristaModalOpen, setIsMotoristaModalOpen] = useState(false)
  const [isVeiculoModalOpen, setIsVeiculoModalOpen] = useState(false)
  const [motoristas, setMotoristas] = useState<PickerItem[]>([])
  const [veiculos, setVeiculos] = useState<PickerItem[]>([])
  const [loadingMotoristas, setLoadingMotoristas] = useState(false)
  const [loadingVeiculos, setLoadingVeiculos] = useState(false)

  // Use the new hook for Google Maps loading
  const { isLoaded: mapLoaded, error: mapError } = useGoogleMapsLoader(isOpen)

  const selectedEmployeesData = useMemo(() => {
    return employees.filter((e) => formData.selected_employees?.includes(e.employee_id))
  }, [employees, formData.selected_employees])

  // Carregar motoristas quando modal abrir
  useEffect(() => {
    if (isMotoristaModalOpen && formData.company_id) {
      setLoadingMotoristas(true)
      fetch(`/api/admin/motoristas-list?company_id=${formData.company_id}`)
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            setMotoristas((result.motoristas || []).map((d: any) => ({
              id: d.id,
              name: d.name || "Sem nome",
              cpf: d.cpf || "",
              documents_valid: !!d.cpf,
              rating: undefined
            })))
          }
        })
        .catch(err => console.error("Erro ao carregar motoristas:", err))
        .finally(() => setLoadingMotoristas(false))
    }
  }, [isMotoristaModalOpen, formData.company_id])

  // Carregar veículos quando modal abrir
  useEffect(() => {
    if (isVeiculoModalOpen && formData.company_id) {
      setLoadingVeiculos(true)
      fetch(`/api/admin/veiculos-list?company_id=${formData.company_id}${formData.selected_employees?.length ? `&required_capacity=${formData.selected_employees.length}` : ''}`)
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            setVeiculos((result.vehicles || []).map((d: any) => ({
              id: d.id,
              name: d.plate || "Sem placa",
              plate: d.plate,
              capacity: d.capacity || 0,
              model: d.model || ""
            })))
          }
        })
        .catch(err => console.error("Erro ao carregar veículos:", err))
        .finally(() => setLoadingVeiculos(false))
    }
  }, [isVeiculoModalOpen, formData.company_id, formData.selected_employees?.length])

  const handleOptimize = async () => {
    if (!formData.company_id || !formData.selected_employees || formData.selected_employees.length === 0) {
      notifyError(new Error("Selecione pelo menos um funcionário"), "Selecione funcionários")
      return
    }

    const selectedEmps = employees.filter((e) => formData.selected_employees?.includes(e.employee_id))
    const missingCoords = selectedEmps.filter((e) => !e.lat || !e.lng)

    if (missingCoords.length > 0) {
      setWarnings([`${missingCoords.length} funcionário(s) sem coordenadas. Geocodificando...`])

      await Promise.all(missingCoords.map(async (emp) => {
        const geocoded = await geocodeAddress(emp.address)
        if (geocoded) {
          const updatePayload: { latitude: number; longitude: number } = {
            latitude: geocoded.lat,
            longitude: geocoded.lng
          }
          const updateQuery = (supabase.from("gf_employee_company").update(updatePayload as any) as any)
          const { error: updateError } = await updateQuery.eq("id", emp.employee_id)
          if (updateError) console.warn("Erro ao atualizar coordenadas:", updateError)
        }
      }))

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

      if (selectedVeiculo && selectedVeiculo.capacity < waypoints.length) {
        newWarnings.push(`⚠️ Capacidade do veículo (${selectedVeiculo.capacity}) menor que número de passageiros (${waypoints.length})`)
      }

      if (!selectedMotorista) {
        newWarnings.push("⚠️ Motorista não selecionado")
      }

      if (!selectedVeiculo) {
        newWarnings.push("⚠️ VeÃ­culo não selecionado")
      }

      if (selectedMotorista && selectedMotorista.documents_valid === false) {
        newWarnings.push("⚠️ Motorista com documentos pendentes")
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

      if (!selectedMotorista) {
        notifyError(new Error("Selecione um motorista"), "Motorista obrigatório")
        setSaving(false)
        return
      }

      if (!selectedVeiculo) {
        notifyError(new Error("Selecione um veículo"), "Veículo obrigatório")
        setSaving(false)
        return
      }

      // Validar capacidade do veículo
      const orderedEmployees = optimizationResult
        ? optimizationResult.ordered.map((o) => o.id)
        : formData.selected_employees || []

      if (selectedVeiculo.capacity < orderedEmployees.length) {
        const confirm = window.confirm(
          `Atenção: O veículo selecionado tem capacidade de ${selectedVeiculo.capacity} passageiros, mas ${orderedEmployees.length} foram selecionados. Deseja continuar mesmo assim?`
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
        motorista_id: selectedMotorista.id,
        veiculo_id: selectedVeiculo.id,
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-6 sm:p-8">
          <DialogHeader className="pb-6">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
              <Route className="h-6 w-6 text-brand" />
              Nova Rota
            </DialogTitle>
            <DialogDescription className="text-base text-ink-muted mt-2">
              Preencha os dados da rota, selecione os funcionários e otimize o trajeto
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="form" className="flex-1 flex flex-col overflow-hidden min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form">Formulário</TabsTrigger>
              <TabsTrigger value="preview" disabled={!optimizationResult}>
                Pré-visualização
              </TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="flex-1 overflow-y-auto bg-transparent border-0 p-0 shadow-none">
              <RouteForm
                formData={formData as RouteFormData}
                setFormData={setFormData as React.Dispatch<React.SetStateAction<RouteFormData>>}
                companies={companies}
                loadingCompanies={loadingCompanies}
                selectedMotorista={selectedMotorista ? { ...selectedMotorista, documents_valid: selectedMotorista.documents_valid ?? false } : null}
                selectedVeiculo={selectedVeiculo}
                onOpenMotoristaModal={() => setIsMotoristaModalOpen(true)}
                onOpenVeiculoModal={() => setIsVeiculoModalOpen(true)}
                newException={newException}
                setNewException={setNewException}
                addException={addException}
                removeException={removeException}
                warnings={warnings}
              >
                <EmployeeSelector
                  employees={employees}
                  selectedEmployees={formData.selected_employees || []}
                  loading={loadingEmployees}
                  searchQuery={searchEmployee}
                  onSearchChange={setSearchEmployee}
                  onToggleEmployee={toggleEmployee}
                />
              </RouteForm>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-hidden flex flex-col bg-transparent border-0 p-0 shadow-none">
              {optimizationResult && mapLoaded ? (
                <LocalRoutePreviewMap
                  result={optimizationResult}
                  employees={selectedEmployeesData}
                  origin={formData.origin_address || ""}
                  destination={formData.destination_address || ""}
                />
              ) : mapError ? (
                <div className="text-center py-8 text-error">{mapError}</div>
              ) : (
                <div className="text-center py-8 text-ink-muted">
                  Clique em &quot;Pre-visualizar &amp; Otimizar&quot; para ver o mapa
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex-shrink-0 flex-col sm:flex-row gap-3 pt-6 border-t mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              aria-label="Cancelar criação de rota"
              className="w-full sm:w-auto order-3 sm:order-1 text-base font-medium"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleOptimize}
              disabled={optimizing || !formData.company_id || !formData.selected_employees?.length}
              variant="outline"
              className="bg-brand hover:bg-brand-hover text-white w-full sm:w-auto order-2 sm:order-2 text-base font-medium"
              aria-label="Pré-visualizar e otimizar rota"
            >
              {optimizing ? "Otimizando..." : <span className="hidden sm:inline">Pré-visualizar & Otimizar</span>}
              <span className="sm:hidden">Otimizar</span>
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-brand hover:bg-brand-hover text-white w-full sm:w-auto order-1 sm:order-3 text-base font-medium"
              aria-label="Salvar rota"
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GenericPickerModal
        open={isMotoristaModalOpen}
        title="Selecionar Motorista"
        items={motoristas}
        isLoading={loadingMotoristas}
        onSelect={(item: PickerItem) => {
          setSelectedMotorista({
            id: item.id,
            name: item.name as string,
            documents_valid: item.documents_valid as boolean
          })
          setIsMotoristaModalOpen(false)
        }}
        onClose={() => setIsMotoristaModalOpen(false)}
        searchPlaceholder="Buscar por nome ou CPF..."
        columns={[
          { key: 'name', label: 'Nome', isPrimary: true },
          { key: 'cpf', label: 'CPF' }
        ]}
        renderItem={(item: PickerItem): React.ReactNode => (
          <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-bg-soft cursor-pointer transition-colors">
            <div className="flex-1">
              <div className="font-medium">{String(item.name || '')}</div>
              {item.cpf && (
                <div className="text-sm text-ink-muted">CPF: {String(item.cpf)}</div>
              )}
            </div>
            {item.documents_valid ? (
              <Badge variant="default" className="bg-success-light text-success">
                Docs OK
              </Badge>
            ) : (
              <Badge variant="destructive">Pendente</Badge>
            )}
          </div>
        )}
      />

      <GenericPickerModal
        open={isVeiculoModalOpen}
        title="Selecionar Veículo"
        items={veiculos}
        isLoading={loadingVeiculos}
        onSelect={(item: PickerItem) => {
          setSelectedVeiculo({
            id: item.id,
            plate: item.plate as string,
            capacity: item.capacity as number
          })
          setIsVeiculoModalOpen(false)
        }}
        onClose={() => setIsVeiculoModalOpen(false)}
        searchPlaceholder="Buscar por placa ou modelo..."
        columns={[
          { key: 'name', label: 'Placa', isPrimary: true },
          { key: 'model', label: 'Modelo' },
          { key: 'capacity', label: 'Capacidade' }
        ]}
        renderItem={(item: PickerItem): React.ReactNode => (
          <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-bg-soft cursor-pointer transition-colors">
            <div className="flex-1">
              <div className="font-medium">{String(item.name || '')}</div>
              {item.model && (
                <div className="text-sm text-ink-muted">{String(item.model)}</div>
              )}
            </div>
            {item.capacity && (
              <Badge variant="outline">Capacidade: {Number(item.capacity)}</Badge>
            )}
          </div>
        )}
      />
    </>
  )
}

function LocalRoutePreviewMap({
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
    result.ordered.forEach((point: { id: string; lat: number; lng: number; order: number }) => {
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
        <div className="p-2 sm:p-3 bg-bg-soft rounded-lg">
          <div className="text-xs sm:text-sm text-ink-muted">Distância Total</div>
          <div className="text-lg sm:text-2xl font-bold">{totalKm} km</div>
        </div>
        <div className="p-2 sm:p-3 bg-bg-soft rounded-lg">
          <div className="text-xs sm:text-sm text-ink-muted">Tempo Total</div>
          <div className="text-lg sm:text-2xl font-bold">{totalMinutes} min</div>
        </div>
        <div className="p-2 sm:p-3 bg-bg-soft rounded-lg">
          <div className="text-xs sm:text-sm text-ink-muted">Paradas</div>
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
                className="flex items-center gap-2 text-xs sm:text-sm p-1.5 sm:p-2 hover:bg-bg-soft rounded cursor-move"
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
                <Navigation className="h-3 w-3 sm:h-4 sm:w-4 text-ink-light flex-shrink-0" />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

