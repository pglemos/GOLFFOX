"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Truck, Calendar, Users as Capacity, Hash } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CarrierVehiclesModalProps {
  carrier: { id: string; name: string }
  isOpen: boolean
  onClose: () => void
}

export function CarrierVehiclesModal({ carrier, isOpen, onClose }: CarrierVehiclesModalProps) {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && carrier) {
      loadVehicles()
    }
  }, [isOpen, carrier])

  const loadVehicles = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/carriers/${carrier.id}/vehicles`)
      if (response.ok) {
        const result = await response.json()
        setVehicles(result.vehicles || [])
      }
    } catch (error) {
      console.error('Erro ao carregar veículos:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Veículos - {carrier.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Total de Veículos: {vehicles.length}</h3>
          </div>

          {loading && (
            <div className="text-center py-8 text-[var(--muted)]">Carregando veículos...</div>
          )}

          {!loading && vehicles.length === 0 && (
            <Card className="p-8 text-center">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-[var(--muted)]">Nenhum veículo associado a esta transportadora</p>
            </Card>
          )}

          {!loading && vehicles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.map((vehicle) => (
                <Card key={vehicle.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    {/* Cabeçalho */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-[var(--brand)]" />
                        <div>
                          <h4 className="font-bold text-lg">{vehicle.plate}</h4>
                          {vehicle.prefix && (
                            <p className="text-xs text-[var(--muted)]">Prefixo: {vehicle.prefix}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={vehicle.is_active ? "default" : "secondary"}>
                        {vehicle.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>

                    {/* Informações do Veículo */}
                    <div className="space-y-2 text-sm">
                      {vehicle.manufacturer && vehicle.model && (
                        <div className="flex items-center gap-2 text-[var(--muted)]">
                          <Hash className="h-4 w-4" />
                          <span>{vehicle.manufacturer} - {vehicle.model}</span>
                        </div>
                      )}
                      
                      {vehicle.year && (
                        <div className="flex items-center gap-2 text-[var(--muted)]">
                          <Calendar className="h-4 w-4" />
                          <span>Ano: {vehicle.year}</span>
                        </div>
                      )}
                      
                      {vehicle.capacity && (
                        <div className="flex items-center gap-2 text-[var(--muted)]">
                          <Capacity className="h-4 w-4" />
                          <span>Capacidade: {vehicle.capacity} passageiros</span>
                        </div>
                      )}
                    </div>

                    {/* Foto do veículo (se houver) */}
                    {vehicle.photo_url && (
                      <div className="mt-3">
                        <img 
                          src={vehicle.photo_url} 
                          alt={`Veículo ${vehicle.plate}`}
                          className="w-full h-32 object-cover rounded-lg border border-[var(--border)]"
                        />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

