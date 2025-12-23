"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Mail, Phone, Plus, Edit, Trash2, X, CreditCard, Search, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { notifySuccess, notifyError } from "@/lib/toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCep } from "@/hooks/use-cep"
import { formatCPF, formatPhone, formatCEP, unformatNumber } from "@/lib/format-utils"

interface TransportadoraDriversModalProps {
  transportadora: { id: string; name: string }
  isOpen: boolean
  onClose: () => void
}

export function TransportadoraDriversModal({ transportadora, isOpen, onClose }: TransportadoraDriversModalProps) {
  const [motoristas, setMotoristas] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("list")
  const { fetchCep, loading: loadingCep } = useCep()

  // Form states
  const [editingDriver, setEditingDriver] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    cnh: "",
    cnh_category: "",
    password: "",
    role: "motorista",
    address_zip_code: "",
    address_street: "",
    address_number: "",
    address_neighborhood: "",
    address_complement: "",
    address_city: "",
    address_state: "",
  })

  useEffect(() => {
    if (isOpen && transportadora) {
      loadMotoristas()
      setActiveTab("list")
    }
  }, [isOpen, transportadora])

  const loadMotoristas = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/transportadora/${transportadora.id}/motoristas`)
      if (response.ok) {
        const result = await response.json()
        setMotoristas(result.motoristas || [])
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
      cnh_category: "",
      password: "",
      role: "motorista",
      address_zip_code: "",
      address_street: "",
      address_number: "",
      address_neighborhood: "",
      address_complement: "",
      address_city: "",
      address_state: "",
    })
    setEditingDriver(null)
    setActiveTab("list")
  }

  const handleCepBlur = async () => {
    if (formData.address_zip_code.length >= 8) {
      const address = await fetchCep(formData.address_zip_code)
      if (address) {
        setFormData(prev => ({
          ...prev,
          address_street: address.logradouro,
          address_neighborhood: address.bairro,
          address_city: address.localidade,
          address_state: address.uf,
        }))
      }
    }
  }

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.address_street.trim() || !formData.address_number.trim() || !formData.address_neighborhood.trim() || !formData.address_zip_code.trim()) {
        throw new Error("Endereço completo é obrigatório")
      }

      const response = await fetch(`/api/admin/transportadora/${transportadora.id}/motoristas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          transportadora_id: transportadora.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar motorista')
      }

      notifySuccess('Motorista criado com sucesso')
      await loadMotoristas()
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
      const response = await fetch(`/api/admin/transportadora/${transportadora.id}/motoristas/${editingDriver.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar motorista')
      }

      notifySuccess('Motorista atualizado com sucesso')
      await loadMotoristas()
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
      const response = await fetch(`/api/admin/transportadora/${transportadora.id}/motoristas/${driverId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir motorista')
      }

      notifySuccess('Motorista excluído com sucesso')
      await loadMotoristas()
    } catch (error: any) {
      notifyError(error, error.message || 'Erro ao excluir motorista')
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (motorista: any) => {
    setEditingDriver(motorista)
    setFormData({
      name: motorista.name || "",
      email: motorista.email || "",
      phone: motorista.phone || "",
      cpf: motorista.cpf || "",
      cnh: motorista.cnh || "",
      cnh_category: motorista.cnh_category || "",
      password: "",
      role: motorista.role || "motorista",
      address_zip_code: motorista.address_zip_code || "",
      address_street: motorista.address_street || "",
      address_number: motorista.address_number || "",
      address_neighborhood: motorista.address_neighborhood || "",
      address_complement: motorista.address_complement || "",
      address_city: motorista.address_city || "",
      address_state: motorista.address_state || "",
    })
    setActiveTab("form")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold break-words">Motoristas - {transportadora.name}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="list">Lista ({motoristas.length})</TabsTrigger>
            <TabsTrigger value="form">
              {editingDriver ? 'Editar' : 'Novo Motorista'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="flex-1 overflow-y-auto bg-transparent border-0 p-0 shadow-none space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Total de Motoristas: {motoristas.length}</h3>
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
              <div className="text-center py-8 text-muted-foreground">Carregando motoristas...</div>
            )}

            {!loading && motoristas.length === 0 && (
              <Card className="p-8 text-center">
                <Users className="h-12 w-12 text-ink-light mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Nenhum motorista associado a esta transportadora</p>
                <Button onClick={() => setActiveTab("form")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Motorista
                </Button>
              </Card>
            )}

            {!loading && motoristas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {motoristas.map((motorista) => (
                  <Card key={motorista.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      {/* Cabeçalho */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-brand" />
                          <div>
                            <h4 className="font-bold text-lg">{motorista.name}</h4>
                            <Badge variant="outline" className="mt-1">{motorista.role || "motorista"}</Badge>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditClick(motorista)}
                              className="min-h-[44px] min-w-[44px]"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteDriver(motorista.id, motorista.name)}
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
                        {motorista.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{motorista.email}</span>
                          </div>
                        )}
                        {motorista.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{motorista.phone}</span>
                          </div>
                        )}
                        {motorista.cpf && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CreditCard className="h-4 w-4" />
                            <span>CPF: {motorista.cpf}</span>
                          </div>
                        )}
                        {motorista.cnh && (
                          <div className="text-xs text-muted-foreground">
                            CNH: {motorista.cnh} {motorista.cnh_category && `(${motorista.cnh_category})`}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="form" className="flex-1 overflow-y-auto bg-transparent border-0 p-0 shadow-none">
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
                  <Label htmlFor="email">E-mail (Login) *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="joao@exemplo.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    placeholder="(11) 98765-4321"
                    maxLength={15}
                  />
                </div>
                <div>
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required
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
                {!editingDriver && (
                  <div className="col-span-2 sm:col-span-1">
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Senha de acesso"
                      required
                      minLength={6}
                    />
                  </div>
                )}

                {/* Endereço */}
                <div className="col-span-1 sm:col-span-2 border-t pt-4 mt-2">
                  <h3 className="font-semibold mb-3">Endereço</h3>
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <Label htmlFor="cep" className="text-base font-medium">CEP *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cep"
                      value={formData.address_zip_code}
                      onChange={(e) => setFormData({ ...formData, address_zip_code: formatCEP(e.target.value) })}
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                      disabled={loading}
                      required
                      maxLength={9}
                      className="h-11"
                    />
                    <Button type="button" variant="outline" onClick={handleCepBlur} disabled={loading || loadingCep} className="h-11 px-4">
                      {loadingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <Label htmlFor="street" className="text-base font-medium">Rua/Avenida *</Label>
                  <Input
                    id="street"
                    value={formData.address_street}
                    onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                    placeholder="Rua Exemplo"
                    disabled={loading}
                    required
                    className="h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="number" className="text-base font-medium">Número *</Label>
                  <Input
                    id="number"
                    value={formData.address_number}
                    onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                    placeholder="123"
                    disabled={loading}
                    required
                    className="h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="neighborhood" className="text-base font-medium">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    value={formData.address_neighborhood}
                    onChange={(e) => setFormData({ ...formData, address_neighborhood: e.target.value })}
                    placeholder="Centro"
                    disabled={loading}
                    required
                    className="h-11"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <Label htmlFor="complement" className="text-base font-medium">Complemento</Label>
                  <Input
                    id="complement"
                    value={formData.address_complement}
                    onChange={(e) => setFormData({ ...formData, address_complement: e.target.value })}
                    placeholder="Apto 101"
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="city" className="text-base font-medium">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.address_city}
                    readOnly
                    className="h-11 bg-bg-soft"
                  />
                </div>

                <div>
                  <Label htmlFor="state" className="text-base font-medium">Estado</Label>
                  <Input
                    id="state"
                    value={formData.address_state}
                    readOnly
                    className="h-11 bg-bg-soft"
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
                  className="w-full sm:w-auto order-1 sm:order-2 bg-brand hover:bg-brand-hover min-h-[44px] text-base font-medium"
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
