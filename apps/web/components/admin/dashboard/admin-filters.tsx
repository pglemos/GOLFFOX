"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Filter, ChevronDown, ChevronUp, Save, X, Calendar } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { FilterDrawer } from "@/components/shared/filter-drawer"

interface AdminFiltersProps {
  initialFilters?: {
    empresa: string
    data: string
    turno: string
  }
  onFiltersChange: (filters: { empresa: string; data: string; turno: string }) => void
}

export function AdminFilters({ initialFilters, onFiltersChange }: AdminFiltersProps) {
  const isMobile = useMobile()
  const [isPending, startTransition] = useTransition()
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [tempFilters, setTempFilters] = useState({
    empresa: initialFilters?.empresa || '',
    data: initialFilters?.data || new Date().toISOString().split('T')[0],
    turno: initialFilters?.turno || ''
  })

  const handleSaveFilters = () => {
    startTransition(() => {
      onFiltersChange(tempFilters)
    })
    setFiltersExpanded(false)
  }

  const handleResetFilters = () => {
    const resetFilters = {
      empresa: '',
      data: new Date().toISOString().split('T')[0],
      turno: ''
    }
    setTempFilters(resetFilters)
    onFiltersChange(resetFilters)
    setFiltersExpanded(false)
  }

  if (isMobile) {
    return (
      <FilterDrawer
        filters={[
          {
            key: "empresa",
            label: "Empresa",
            type: "text",
            placeholder: "Todas as empresas"
          },
          {
            key: "data",
            label: "Data",
            type: "date"
          },
          {
            key: "turno",
            label: "Turno",
            type: "select",
            options: [
              { label: "Manhã", value: "manha" },
              { label: "Tarde", value: "tarde" },
              { label: "Noite", value: "noite" }
            ]
          }
        ]}
        values={{
          empresa: tempFilters.empresa,
          data: tempFilters.data,
          turno: tempFilters.turno
        }}
        onFilterChange={(key, value) => {
          setTempFilters({ ...tempFilters, [key]: value })
        }}
        onReset={handleResetFilters}
        title="Filtros"
        description="Filtre os dados do dashboard"
      />
    )
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-brand flex-shrink-0" />
            <CardTitle className="text-base sm:text-lg font-semibold">Filtros</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="gap-2 w-full sm:w-auto min-h-[44px] touch-manipulation"
          >
            {filtersExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                <span className="hidden sm:inline">Minimizar</span>
                <span className="sm:hidden">Fechar</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span className="hidden sm:inline">Expandir</span>
                <span className="sm:hidden">Abrir</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      {filtersExpanded && (
        <CardContent className="pt-0 px-3 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-ink-strong">Empresa</label>
              <Input
                placeholder="Todas as empresas"
                value={tempFilters.empresa}
                onChange={(e) => setTempFilters({ ...tempFilters, empresa: e.target.value })}
                className="w-full min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-ink-strong">Data</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted pointer-events-none z-10" />
                <Input
                  type="date"
                  value={tempFilters.data}
                  onChange={(e) => setTempFilters({ ...tempFilters, data: e.target.value })}
                  className="pl-10 w-full min-h-[44px]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-ink-strong">Turno</label>
              <select
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-border bg-bg-soft text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:ring-opacity-20 transition-all touch-manipulation"
                value={tempFilters.turno}
                onChange={(e) => setTempFilters({ ...tempFilters, turno: e.target.value })}
              >
                <option value="">Todos os turnos</option>
                <option value="manha">Manhã</option>
                <option value="tarde">Tarde</option>
                <option value="noite">Noite</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="gap-2 w-full sm:w-auto min-h-[44px] touch-manipulation"
            >
              <X className="h-4 w-4" />
              Limpar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveFilters}
              className="gap-2 w-full sm:w-auto min-h-[44px] touch-manipulation"
            >
              <Save className="h-4 w-4" />
              Salvar Filtros
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

