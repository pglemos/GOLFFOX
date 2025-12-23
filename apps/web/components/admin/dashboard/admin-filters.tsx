"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Filter, Save, Calendar, SlidersHorizontal } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { FilterDrawer } from "@/components/shared/filter-drawer"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

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

  const hasActiveFilters = tempFilters.empresa || tempFilters.turno || (tempFilters.data && tempFilters.data !== new Date().toISOString().split('T')[0])
  const activeFiltersCount = [tempFilters.empresa, tempFilters.turno].filter(Boolean).length + (tempFilters.data && tempFilters.data !== new Date().toISOString().split('T')[0] ? 1 : 0)

  return (
    <Popover open={filtersExpanded} onOpenChange={setFiltersExpanded}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 px-3 gap-2 relative",
            hasActiveFilters && "border-primary bg-primary/5 hover:bg-primary/10"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filtros</span>
          {hasActiveFilters && (
            <Badge 
              variant="default" 
              className="ml-1 h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-semibold"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="start">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm">Filtros</h4>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Limpar
              </Button>
            )}
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Empresa</label>
              <Input
                placeholder="Todas as empresas"
                value={tempFilters.empresa}
                onChange={(e) => setTempFilters({ ...tempFilters, empresa: e.target.value })}
                className="h-9"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Data</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  type="date"
                  value={tempFilters.data}
                  onChange={(e) => setTempFilters({ ...tempFilters, data: e.target.value })}
                  className="pl-10 h-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Turno</label>
              <select
                className="min-h-[48px] w-full px-4 py-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
          
          <Separator />
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersExpanded(false)}
              className="flex-1 h-9"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveFilters}
              className="flex-1 h-9"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

