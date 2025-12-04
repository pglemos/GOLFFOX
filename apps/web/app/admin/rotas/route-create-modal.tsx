"use client"

import { useState, useMemo } from "react"
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
import { DriverPickerModal } from "@/components/admin/driver-picker-modal"
import { VehiclePickerModal } from "@/components/admin/vehicle-picker-modal"
import { z } from "zod"
import React from "react"
import { useRouteCreate } from "./use-route-create"
import { RouteForm } from "@/components/modals/route-create/route-form"
import { EmployeeSelector } from "@/components/modals/route-create/employee-selector"
import { RoutePreviewMap } from "@/components/modals/route-create/route-preview-map"
import { useGoogleMapsLoader } from "@/components/modals/route-create/use-google-maps-loader"

const routeSchema = z.object({
  name: z.string().min(1, "Nome Ã© obrigatÃ³rio"),
  company_id: z.string().min(1, "Empresa Ã© obrigatÃ³ria"),
  scheduled_time: z.string().min(1, "HorÃ¡rio Ã© obrigatÃ³rio"),
  shift: z.enum(["manha", "tarde", "noite"]),
  selected_employees: z.array(z.string()).min(1, "Selecione pelo menos um funcionÃ¡rio"),
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
    selectedDriver, setSelectedDriver,
    selectedVehicle, setSelectedVehicle,
    optimizationResult, setOptimizationResult,
    optimizing, setOptimizing,
    saving, setSaving,
    warnings, setWarnings,
    newException, setNewException,
    addException, removeException, toggleEmployee
  } = useRouteCreate(isOpen)

  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false)
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false)

  // Use the new hook for Google Maps loading
  const { isLoaded: mapLoaded, error: mapError } = useGoogleMapsLoader(isOpen)

  const selectedEmployeesData = useMemo(() => {
    return employees.filter((e) => formData.selected_employees?.includes(e.employee_id))
  }, [employees, formData.selected_employees])

  const handleOptimize = async () => {
    if (!formData.company_id || !formData.selected_employees || formData.selected_employees.length === 0) {
      notifyError(new Error("Selecione pelo menos um funcionÃ¡rio"), "Selecione funcionÃ¡rios")
      return
    }

    const selectedEmps = employees.filter((e) => formData.selected_employees?.includes(e.employee_id))
    const missingCoords = selectedEmps.filter((e) => !e.lat || !e.lng)

    if (missingCoords.length > 0) {
      setWarnings([`${missingCoords.length} funcionÃ¡rio(s) sem coordenadas. Geocodificando...`])

      await Promise.all(missingCoords.map(async (emp) => {
        const geocoded = await geocodeAddress(emp.address)
        if (geocoded) {
          const updatePayload: { latitude: number; longitude: number } = {
            latitude: geocoded.lat,
            longitude: geocoded.lng
          }
          // @ts-expect-error - Supabase types are too strict for dynamic updates
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
      notifyError(new Error("Nenhum funcionÃ¡rio com coordenadas vÃ¡lidas"), "Erro")
      return
    }

    // Se origem nÃ£o tiver coordenadas, usar primeiro funcionÃ¡rio como origem
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
        notifyError(new Error("Defina a origem (garagem) ou selecione funcionÃ¡rios"), "Erro")
        return
      }
    }

    // Se destino nÃ£o tiver coordenadas, usar Ãºltimo funcionÃ¡rio como destino
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
          destination_address: prev.destination_address || "Ãšltimo ponto",
        }))
      } else {
        notifyError(new Error("Defina o destino (empresa) ou selecione funcionÃ¡rios"), "Erro")
        return
      }
    }

    setOptimizing(true)
    try {
      // Criar timestamp ISO para o horÃ¡rio agendado (hoje + horÃ¡rio)
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
        newWarnings.push(`âš ï¸ Capacidade do veÃ­culo (${selectedVehicle.capacity}) menor que nÃºmero de passageiros (${waypoints.length})`)
      }

      if (!selectedDriver) {
        newWarnings.push("âš ï¸ Motorista nÃ£o selecionado")
      }

      if (!selectedVehicle) {
        newWarnings.push("âš ï¸ VeÃ­culo nÃ£o selecionado")
      }

      if (selectedDriver && selectedDriver.documents_valid === false) {
        newWarnings.push("âš ï¸ Motorista com documentos pendentes")
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
        notifyError(new Error("Selecione um motorista"), "Motorista obrigatÃ³rio")
        setSaving(false)
        return
      }

      if (!selectedVehicle) {
        notifyError(new Error("Selecione um veÃ­culo"), "VeÃ­culo obrigatÃ³rio")
        setSaving(false)
        return
      }

      // Validar capacidade do veÃ­culo
      const orderedEmployees = optimizationResult
        ? optimizationResult.ordered.map((o) => o.id)
        : formData.selected_employees || []

      if (selectedVehicle.capacity < orderedEmployees.length) {
        const confirm = window.confirm(
          `AtenÃ§Ã£o: O veÃ­culo selecionado tem capacidade de ${selectedVehicle.capacity} passageiros, mas ${orderedEmployees.length} foram selecionados. Deseja continuar mesmo assim?`
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

      // .single() retorna o objeto diretamente, nÃ£o um array
      const routeId = (routeData as any)?.id
      if (!routeId) {
        console.error("Route data:", routeData)
        throw new Error("Erro ao criar rota: ID nÃ£o retornado")
      }

      const stops = orderedEmployees.map((employeeId, index) => {
        const emp = employees.find((e) => e.employee_id === employeeId)
        if (!emp || !emp.lat || !emp.lng) {
          throw new Error(`FuncionÃ¡rio ${emp?.first_name || employeeId} sem coordenadas vÃ¡lidas`)
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
              <Route className="h-6 w-6 text-[var(--brand)]" />
              Nova Rota
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 mt-2">
              Preencha os dados da rota, selecione os funcionÃ¡rios e otimize o trajeto
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="form" className="flex-1 flex flex-col overflow-hidden min-h-0">
            <TabsList className="grid w-full grid-cols-2 h-12 mb-6">
              <TabsTrigger value="form" className="text-base font-medium">FormulÃ¡rio</TabsTrigger>
              <TabsTrigger value="preview" disabled={!optimizationResult} className="text-base font-medium">
                PrÃ©-visualizaÃ§Ã£o
              </TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="flex-1 overflow-y-auto">
              <RouteForm
                formData={formData}
                setFormData={setFormData}
                companies={companies}
                loadingCompanies={loadingCompanies}
                selectedDriver={selectedDriver}
                selectedVehicle={selectedVehicle}
                onOpenDriverModal={() => setIsDriverModalOpen(true)}
                onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
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
              aria-label="Cancelar criaÃ§Ã£o de rota"
              className="w-full sm:w-auto order-3 sm:order-1 text-base font-medium h-11 sm:h-12"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleOptimize}
              disabled={optimizing || !formData.company_id || !formData.selected_employees?.length}
              variant="outline"
              className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto order-2 sm:order-2 text-base font-medium h-11 sm:h-12"
              aria-label="PrÃ©-visualizar e otimizar rota"
            >
              {optimizing ? "Otimizando..." : <span className="hidden sm:inline">PrÃ©-visualizar & Otimizar</span>}
              <span className="sm:hidden">Otimizar</span>
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto order-1 sm:order-3 text-base font-medium h-11 sm:h-12"
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

