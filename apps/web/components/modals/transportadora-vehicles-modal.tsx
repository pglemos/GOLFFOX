"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Truck, Calendar, Users as Capacity, Hash, Plus, Edit, Trash2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { notifySuccess, notifyError } from "@/lib/toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface TransportadoraVehiclesModalProps {
  transportadora: { id: string; name: string }
  isOpen: boolean
  onClose: () => void
}

export function TransportadoraVehiclesModal({ transportadora, isOpen, onClose }: TransportadoraVehiclesModalProps) {
  const [veiculos, setVeiculos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("list")

  // Form states
  const [editingVehicle, setEditingVehicle] = useState<any>(null)
  const [formData, setFormData] = useState({
    plate: "",
    prefix: "",
    manufacturer: "",
    model: "",
    year: "",
    capacity: "",
    is_active: true,
    veiculo_type: "bus",
    renavam: "",
    chassis: ""
  })

  useEffect(() => {
    if (isOpen && transportadora) {
      loadVeiculos()
      setActiveTab("list")
    }
  }, [isOpen, transportadora])

  const loadVeiculos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/transportadora/${transportadora.id}/veiculos`)
      if (response.ok) {
        const result = await response.json()
        setVeiculos(result.veiculos || [])
      }
    } catch (error) {
      console.error('Erro ao carregar veículos:', error)
      notifyError(error, 'Erro ao carregar veículos')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      plate: "",
      prefix: "",
      manufacturer: "",
      model: "",
      year: "",
      capacity: "",
      is_active: true,
      veiculo_type: "bus",
      renavam: "",
      chassis: ""
    })
    setEditingVehicle(null)
    setActiveTab("list")
  }

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/transportadora/${transportadora.id}/veiculos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          transportadora_id: transportadora.id,
          year: formData.year ? parseInt(formData.year) : null,
          capacity: formData.capacity ? parseInt(formData.capacity) : null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar veículo')
      }

      notifySuccess('Veículo criado com sucesso')
      await loadVeiculos()
      resetForm()
    } catch (error: any) {
      notifyError(error, error.message || 'Erro ao criar veículo')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVehicle) return

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/transportadora/${transportadora.id}/veiculos/${editingVehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          year: formData.year ? parseInt(formData.year) : null,
          capacity: formData.capacity ? parseInt(formData.capacity) : null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar veículo')
      }

      notifySuccess('Veículo atualizado com sucesso')
      await loadVeiculos()
      resetForm()
    } catch (error: any) {
      notifyError(error, error.message || 'Erro ao atualizar veículo')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVehicle = async (vehicleId: string, vehiclePlate: string) => {
    if (!confirm(`Tem certeza que deseja excluir o veículo "${vehiclePlate}"?`)) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/transportadora/${transportadora.id}/veiculos/${vehicleId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir veículo')
      }

      notifySuccess('Veículo excluído com sucesso')
      await loadVeiculos()
    } catch (error: any) {
      notifyError(error, error.message || 'Erro ao excluir veículo')
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (veiculo: any) => {
    setEditingVehicle(veiculo)
    setFormData({
      plate: veiculo.plate || "",
      prefix: veiculo.prefix || "",
      manufacturer: veiculo.manufacturer || "",
      model: veiculo.model || "",
      year: veiculo.year?.toString() || "",
      capacity: veiculo.capacity?.toString() || "",
      is_active: veiculo.is_active ?? true,
      veiculo_type: veiculo.veiculo_type || "bus",
      renavam: veiculo.renavam || "",
      chassis: veiculo.chassis || ""
    })
    setActiveTab("form")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold break-words">Veículos - {transportadora.name}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full grid grid-cols-2 gap-1 sm:gap-2">
            <TabsTrigger value="list" className="text-xs sm:text-sm min-h-[44px]">Lista ({veiculos.length})</TabsTrigger>
            <TabsTrigger value="form" className="text-xs sm:text-sm min-h-[44px]">
              {editingVehicle ? 'Editar' : 'Novo Veículo'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="flex-1 overflow-y-auto mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Total de Veículos: {veiculos.length}</h3>
              <Button size="sm" onClick={() => {
                resetForm()
                setActiveTab("form")
              }} className="min-h-[44px] text-xs sm:text-sm">
                <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Novo Veículo</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </div>

            {loading && (
              <div className="text-center py-8 text-muted-foreground">Carregando veículos...</div>
            )}

            {!loading && veiculos.length === 0 && (
              <Card className="p-8 text-center">
                <Truck className="h-12 w-12 text-ink-light mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Nenhum veículo associado a esta transportadora</p>
                <Button onClick={() => setActiveTab("form")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Veículo
                </Button>
              </Card>
            )}

            {!loading && veiculos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {veiculos.map((veiculo) => (
                  <Card key={veiculo.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      {/* Cabeçalho */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="h-5 w-5 text-brand" />
                          <div>
                            <h4 className="font-bold text-lg">{veiculo.plate}</h4>
                            {veiculo.prefix && (
                              <p className="text-xs text-muted-foreground">Prefixo: {veiculo.prefix}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={veiculo.is_active ? "default" : "secondary"}>
                            {veiculo.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditClick(veiculo)}
                              className="min-h-[44px] min-w-[44px]"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteVehicle(veiculo.id, veiculo.plate)}
                              disabled={loading}
                              className="min-h-[44px] min-w-[44px]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Informações do Veículo */}
                      <div className="space-y-2 text-sm">
                        {veiculo.manufacturer && veiculo.model && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Hash className="h-4 w-4" />
                            <span>{veiculo.manufacturer} - {veiculo.model}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          {veiculo.year && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Ano: {veiculo.year}</span>
                            </div>
                          )}

                          {veiculo.capacity && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Capacity className="h-4 w-4" />
                              <span>{veiculo.capacity} passageiros</span>
                            </div>
                          )}
                        </div>

                        {veiculo.renavam && (
                          <div className="text-xs text-muted-foreground">
                            RENAVAM: {veiculo.renavam}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="form" className="flex-1 overflow-y-auto mt-4">
            <form onSubmit={editingVehicle ? handleUpdateVehicle : handleCreateVehicle} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="plate">Placa *</Label>
                  <Input
                    id="plate"
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                    required
                    placeholder="ABC-1234"
                    maxLength={8}
                  />
                </div>
                <div>
                  <Label htmlFor="prefix">Prefixo</Label>
                  <Input
                    id="prefix"
                    value={formData.prefix}
                    onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                    placeholder="001"
                  />
                </div>
                <div>
                  <Label htmlFor="manufacturer">Fabricante</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="Mercedes-Benz"
                  />
                </div>
                <div>
                  <Label htmlFor="model">Modelo</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="OF-1721"
                  />
                </div>
                <div>
                  <Label htmlFor="year">Ano</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="2023"
                    min="1900"
                    max="2100"
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Capacidade (passageiros)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="44"
                    min="1"
                    max="200"
                  />
                </div>
                <div>
                  <Label htmlFor="veiculo_type">Tipo de Veículo</Label>
                  <Select
                    value={formData.veiculo_type}
                    onValueChange={(value) => setFormData({ ...formData, veiculo_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bus">Ônibus</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="microonibus">Microônibus</SelectItem>
                      <SelectItem value="car">Carro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="renavam">RENAVAM</Label>
                  <Input
                    id="renavam"
                    value={formData.renavam}
                    onChange={(e) => setFormData({ ...formData, renavam: e.target.value })}
                    placeholder="00000000000"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="chassis">Chassi</Label>
                  <Input
                    id="chassis"
                    value={formData.chassis}
                    onChange={(e) => setFormData({ ...formData, chassis: e.target.value.toUpperCase() })}
                    placeholder="9BWZZZ377VT004251"
                    maxLength={17}
                  />
                </div>
                <div className="col-span-2 flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Veículo Ativo
                  </Label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 justify-end pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={loading}
                  className="w-full sm:w-auto order-2 sm:order-1 min-h-[44px] text-base font-medium"
                >
                  <X className="h-4 w-4 mr-2 flex-shrink-0" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.plate}
                  className="w-full sm:w-auto order-1 sm:order-2 bg-brand hover:bg-brand-hover min-h-[44px] text-base font-medium"
                >
                  {loading ? 'Salvando...' : editingVehicle ? 'Atualizar Veículo' : 'Criar Veículo'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
