"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Users, Mail, Phone } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CarrierDriversModalProps {
  carrier: { id: string; name: string }
  isOpen: boolean
  onClose: () => void
}

export function CarrierDriversModal({ carrier, isOpen, onClose }: CarrierDriversModalProps) {
  const [drivers, setDrivers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && carrier) {
      loadDrivers()
    }
  }, [isOpen, carrier])

  const loadDrivers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/carriers/${carrier.id}/drivers`)
      if (response.ok) {
        const result = await response.json()
        setDrivers(result.drivers || [])
      }
    } catch (error) {
      console.error('Erro ao carregar motoristas:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Motoristas - {carrier.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Total de Motoristas: {drivers.length}</h3>
          </div>

          {loading && (
            <div className="text-center py-8 text-[var(--muted)]">Carregando motoristas...</div>
          )}

          {!loading && drivers.length === 0 && (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-[var(--muted)]">Nenhum motorista associado a esta transportadora</p>
            </Card>
          )}

          {!loading && drivers.length > 0 && (
            <div className="space-y-2">
              {drivers.map((driver) => (
                <Card key={driver.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-[var(--brand)]" />
                        <h4 className="font-semibold">{driver.name}</h4>
                        <Badge variant="outline">{driver.role || "driver"}</Badge>
                      </div>
                      <div className="space-y-1 text-sm text-[var(--muted)]">
                        {driver.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <span>{driver.email}</span>
                          </div>
                        )}
                        {driver.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span>{driver.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
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

