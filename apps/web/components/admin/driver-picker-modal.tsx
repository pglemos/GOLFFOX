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
import { Search, CheckCircle2, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { maskCPF } from "@/lib/geocoding"
import { ScrollArea } from "@/components/ui/scroll-area"

interface motorista {
  id: string
  name: string
  cpf: string
  documents_valid: boolean
  rating?: number
}

interface MotoristaPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (motorista: motorista) => void
  companyId?: string
}

export function DriverPickerModal({
  isOpen,
  onClose,
  onSelect,
  companyId
}: MotoristaPickerModalProps) {
  const [drivers, setDrivers] = useState<motorista[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (isOpen) {
      loadDrivers()
    }
  }, [isOpen, companyId])

  const loadDrivers = async () => {
    setLoading(true)
    try {
      // Usar API route para bypassar RLS
      const url = companyId 
        ? `/api/admin/drivers-list?company_id=${companyId}`
        : '/api/admin/drivers-list'
      
      const response = await fetch(url)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar motoristas')
      }

      const driversData: motorista[] = (result.drivers || []).map((d: any) => ({
        id: d.id,
        name: d.name || "Sem nome",
        cpf: d.cpf || "",
        documents_valid: !!d.cpf,
        rating: undefined
      }))

      setDrivers(driversData)
    } catch (error) {
      console.error("Erro ao carregar motoristas:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDrivers = useMemo(() => {
    if (!searchQuery) return drivers

    const query = searchQuery.toLowerCase().trim()
    return drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.cpf.replace(/\D/g, "").includes(query.replace(/\D/g, ""))
    )
  }, [drivers, searchQuery])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold break-words">Selecionar Motorista</DialogTitle>
          <DialogDescription className="text-sm sm:text-base break-words">
            Busque e selecione um motorista para a rota
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-light" />
            <Input
              placeholder="Buscar por nome ou CPF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-ink-muted">Carregando...</div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredDrivers.length === 0 ? (
                  <div className="text-center py-8 text-ink-muted">
                    Nenhum motorista encontrado
                  </div>
                ) : (
                  filteredDrivers.map((motorista) => (
                    <div
                      key={motorista.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-bg-soft cursor-pointer transition-colors"
                      onClick={() => {
                        onSelect(motorista)
                        onClose()
                      }}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{motorista.name}</div>
                        {motorista.cpf && (
                          <div className="text-sm text-ink-muted">
                            CPF: {maskCPF(motorista.cpf)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {motorista.documents_valid ? (
                          <Badge variant="default" className="bg-success-light text-success">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Docs OK
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                        {motorista.rating && (
                          <Badge variant="outline">
                            ⭐ {motorista.rating.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

