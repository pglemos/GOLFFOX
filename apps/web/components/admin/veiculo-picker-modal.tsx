"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ScrollArea } from "@/components/ui/scroll-area"

interface veiculo {
  id: string
  plate: string
  model: string
  capacity: number
  status: string
  is_active: boolean
}

interface VeiculoPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (veiculo: veiculo) => void
  companyId?: string
  requiredCapacity?: number
}

export function VeiculoPickerModal({
  isOpen,
  onClose,
  onSelect,
  companyId,
  requiredCapacity
}: VeiculoPickerModalProps) {
  const [veiculos, setVeiculos] = useState<veiculo[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    if (isOpen) {
      loadVeiculos()
    }
  }, [isOpen, companyId])

  const loadVeiculos = async () => {
    setLoading(true)
    try {
      // Usar API route para bypassar RLS
      const url = companyId 
        ? `/api/admin/veiculos-list?company_id=${companyId}`
        : '/api/admin/veiculos-list'
      
      const response = await fetch(url)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar veículos')
      }

      // Mapear dados da API para o formato veiculo (adicionar status padrão se não existir)
      const veiculosData: veiculo[] = (result.veiculos || []).map((v: any) => ({
        id: v.id,
        plate: v.plate,
        model: v.model,
        capacity: v.capacity || 0,
        status: v.status || (v.is_active ? 'active' : 'garage'),
        is_active: v.is_active ?? true,
      }))

      setVeiculos(veiculosData)
    } catch (error) {
      console.error("Erro ao carregar veículos:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredVeiculos = useMemo(() => {
    let filtered = veiculos

    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (v) =>
          v.plate.toLowerCase().includes(query) ||
          v.model.toLowerCase().includes(query)
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((v) => {
        if (statusFilter === "active") return v.is_active
        if (statusFilter === "maintenance") return v.status === "maintenance"
        if (statusFilter === "garage") return v.status === "garage"
        return true
      })
    }

    return filtered
  }, [veiculos, searchQuery, statusFilter])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold break-words">Selecionar Veículo</DialogTitle>
          <DialogDescription className="text-sm sm:text-base break-words">
            Busque e selecione um veículo para a rota. Verifique a capacidade antes de selecionar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-light" />
              <Input
                placeholder="Buscar por placa ou modelo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
                <SelectItem value="garage">Garagem</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {requiredCapacity && (
            <div className="p-3 bg-brand-light border border-brand-soft rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-brand" />
              <span className="text-sm text-brand">
                Capacidade mínima necessária: {requiredCapacity} passageiros
              </span>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-ink-muted">Carregando...</div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredVeiculos.length === 0 ? (
                  <div className="text-center py-8 text-ink-muted">
                    Nenhum veículo encontrado
                  </div>
                ) : (
                  filteredVeiculos.map((veiculo) => {
                    const hasCapacity = !requiredCapacity || veiculo.capacity >= requiredCapacity
                    return (
                      <div
                        key={veiculo.id}
                        className={`flex items-center justify-between p-3 border rounded-lg hover:bg-bg-soft cursor-pointer transition-colors ${
                          !hasCapacity ? "opacity-60" : ""
                        }`}
                        onClick={() => {
                          if (hasCapacity) {
                            onSelect(veiculo)
                            onClose()
                          }
                        }}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{veiculo.plate}</div>
                          <div className="text-sm text-ink-muted">{veiculo.model}</div>
                          <div className="text-xs text-ink-light">
                            Capacidade: {veiculo.capacity} passageiros
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              veiculo.is_active
                                ? "default"
                                : veiculo.status === "maintenance"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {veiculo.is_active
                              ? "Ativo"
                              : veiculo.status === "maintenance"
                              ? "Manutenção"
                              : "Garagem"}
                          </Badge>
                          {!hasCapacity && (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Insuficiente
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

