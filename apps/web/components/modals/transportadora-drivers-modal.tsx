"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Mail, Phone, Plus, Edit, Trash2, X, CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { notifySuccess, notifyError } from "@/lib/toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TransportadoraDriversModalProps {
  carrier: { id: string; name: string }
  isOpen: boolean
  onClose: () => void
}

export function TransportadoraDriversModal({ carrier, isOpen, onClose }: TransportadoraDriversModalProps) {
  const [drivers, setDrivers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("list")
  
  // Form states
  const [editingDriver, setEditingDriver] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    cnh: "",
    cnh_category: ""
  })

  useEffect(() => {
    if (isOpen && carrier) {
      loadDrivers()
      setActiveTab("list")
    }
  }, [isOpen, carrier])

  const loadDrivers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/transportadora/${carrier.id}/drivers`)
      if (response.ok) {
        const result = await response.json()
        setDrivers(result.drivers || [])
      } else {
        throw new Error('Erro ao carregar motoristas')
      }
    } catch (error) {
      console.error('Erro ao carregar motoristas:', error)
      notifyError(error, 'Erro ao carregar motoristas')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      cpf: "",
      cnh: "",
      cnh_category: ""
    })
    setEditingDriver(null)
    setActiveTab("list")
  }

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/transportadora/${carrier.id}/drivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          transportadora_id: carrier.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar motorista')
      }

      notifySuccess('Motorista criado com sucesso')
      await loadDrivers()
      resetForm()
    } catch (error: any) {
      notifyError(error, error.message || 'Erro ao criar motorista')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDriver) return

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/transportadora/${carrier.id}/drivers/${editingDriver.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar motorista')
      }

      notifySuccess('Motorista atualizado com sucesso')
      await loadDrivers()
      resetForm()
    } catch (error: any) {
      notifyError(error, error.message || 'Erro ao atualizar motorista')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDriver = async (driverId: string, driverName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o motorista "${driverName}"?`)) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/transportadora/${carrier.id}/drivers/${driverId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir motorista')
      }

      notifySuccess('Motorista excluído com sucesso')
      await loadDrivers()
    } catch (error: any) {
      notifyError(error, error.message || 'Erro ao excluir motorista')
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (driver: any) => {
    setEditingDriver(driver)
    setFormData({
      name: driver.name || "",
      email: driver.email || "",
      phone: driver.phone || "",
      cpf: driver.cpf || "",
      cnh: driver.cnh || "",
      cnh_category: driver.cnh_category || ""
    })
    setActiveTab("form")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold break-words">Motoristas - {carrier.name}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full grid grid-cols-2 gap-1 sm:gap-2">
            <TabsTrigger value="list" className="text-xs sm:text-sm min-h-[44px]">Lista ({drivers.length})</TabsTrigger>
            <TabsTrigger value="form" className="text-xs sm:text-sm min-h-[44px]">
              {editingDriver ? 'Editar' : 'Novo Motorista'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="flex-1 overflow-y-auto mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Total de Motoristas: {drivers.length}</h3>
              <Button size="sm" onClick={() => {
                resetForm()
                setActiveTab("form")
              }} className="min-h-[44px] text-xs sm:text-sm">
                <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Novo Motorista</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </div>

            {loading && (
              <div className="text-center py-8 text-[var(--muted)]">Carregando motoristas...</div>
            )}

            {!loading && drivers.length === 0 && (
              <Card className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-[var(--muted)] mb-4">Nenhum motorista associado a esta transportadora</p>
                <Button onClick={() => setActiveTab("form")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Motorista
                </Button>
              </Card>
            )}

            {!loading && drivers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drivers.map((driver) => (
                  <Card key={driver.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      {/* Cabeçalho */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-[var(--brand)]" />
                          <div>
                            <h4 className="font-bold text-lg">{driver.name}</h4>
                            <Badge variant="outline" className="mt-1">{driver.role || "driver"}</Badge>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditClick(driver)}
                              className="min-h-[44px] min-w-[44px]"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteDriver(driver.id, driver.name)}
                              disabled={loading}
                              className="min-h-[44px] min-w-[44px]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Informações do Motorista */}
                      <div className="space-y-2 text-sm">
                        {driver.email && (
                          <div className="flex items-center gap-2 text-[var(--muted)]">
                            <Mail className="h-4 w-4" />
                            <span>{driver.email}</span>
                          </div>
                        )}
                        {driver.phone && (
                          <div className="flex items-center gap-2 text-[var(--muted)]">
                            <Phone className="h-4 w-4" />
                            <span>{driver.phone}</span>
                          </div>
                        )}
                        {driver.cpf && (
                          <div className="flex items-center gap-2 text-[var(--muted)]">
                            <CreditCard className="h-4 w-4" />
                            <span>CPF: {driver.cpf}</span>
                          </div>
                        )}
                        {driver.cnh && (
                          <div className="text-xs text-[var(--muted)]">
                            CNH: {driver.cnh} {driver.cnh_category && `(${driver.cnh_category})`}
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
            <form onSubmit={editingDriver ? handleUpdateDriver : handleCreateDriver} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="col-span-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="João da Silva"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="joao@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 98765-4321"
                  />
                </div>
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
                <div>
                  <Label htmlFor="cnh">CNH</Label>
                  <Input
                    id="cnh"
                    value={formData.cnh}
                    onChange={(e) => setFormData({ ...formData, cnh: e.target.value })}
                    placeholder="00000000000"
                  />
                </div>
                <div>
                  <Label htmlFor="cnh_category">Categoria CNH</Label>
                  <Input
                    id="cnh_category"
                    value={formData.cnh_category}
                    onChange={(e) => setFormData({ ...formData, cnh_category: e.target.value.toUpperCase() })}
                    placeholder="D"
                    maxLength={2}
                  />
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
                  disabled={loading || !formData.name}
                  className="w-full sm:w-auto order-1 sm:order-2 bg-orange-500 hover:bg-orange-600 min-h-[44px] text-base font-medium"
                >
                  {loading ? 'Salvando...' : editingDriver ? 'Atualizar Motorista' : 'Criar Motorista'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
