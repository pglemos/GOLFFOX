"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Filter, X, Calendar, ChevronDown, ChevronUp, Save } from "lucide-react"

export interface CostFilters {
  start_date?: string
  end_date?: string
  route_id?: string
  veiculo_id?: string
  motorista_id?: string
  category_id?: string
  group_name?: string
  transportadora_id?: string
  cost_center_id?: string
}

interface CostFiltersProps {
  onFiltersChange: (filters: CostFilters) => void
  routes?: Array<{ id: string; name: string }>
  veiculos?: Array<{ id: string; plate: string }>
  motoristas?: Array<{ id: string; email: string }>
  categories?: Array<{ id: string; group_name: string; category: string }>
  carriers?: Array<{ id: string; name: string }>
}

const PERIOD_PRESETS = {
  today: {
    label: 'Hoje',
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  },
  week: {
    label: 'Última Semana',
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  },
  month: {
    label: 'Último Mês',
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  },
  quarter: {
    label: 'Último Trimestre',
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  },
  year: {
    label: 'Último Ano',
    start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  }
}

export function CostFilters({
  onFiltersChange,
  routes = [],
  veiculos = [],
  motoristas = [],
  categories = [],
  carriers = []
}: CostFiltersProps) {
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [tempFilters, setTempFilters] = useState<CostFilters>({})
  const [appliedFilters, setAppliedFilters] = useState<CostFilters>({})

  const handleTempFilterChange = (key: keyof CostFilters, value: string | undefined) => {
    const newFilters = { ...tempFilters }
    if (value) {
      newFilters[key] = value
    } else {
      delete newFilters[key]
    }
    setTempFilters(newFilters)
  }

  const handleSaveFilters = () => {
    setAppliedFilters(tempFilters)
    onFiltersChange(tempFilters)
    setFiltersExpanded(false)
  }

  const handleResetFilters = () => {
    setTempFilters({})
    setAppliedFilters({})
    onFiltersChange({})
    setFiltersExpanded(false)
  }

  const handlePreset = (preset: keyof typeof PERIOD_PRESETS) => {
    const { start, end } = PERIOD_PRESETS[preset]
    const newFilters = {
      ...tempFilters,
      start_date: start,
      end_date: end
    }
    setTempFilters(newFilters)
  }

  const hasActiveFilters = Object.keys(appliedFilters).length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-brand" />
            <CardTitle className="text-lg">Filtros</CardTitle>
            {hasActiveFilters && (
              <span className="px-2 py-1 bg-brand-light text-brand rounded-full text-xs font-medium">
                {Object.keys(appliedFilters).length} ativo(s)
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="gap-2"
          >
            {filtersExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Minimizar
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Expandir
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      {filtersExpanded && (
        <CardContent>
          {/* Presets de Período */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(PERIOD_PRESETS).map(([key, preset]) => (
              <Button
                key={key}
                variant={tempFilters.start_date === preset.start ? "default" : "outline"}
                size="sm"
                onClick={() => handlePreset(key as keyof typeof PERIOD_PRESETS)}
              >
                <Calendar className="h-3 w-3 mr-1" />
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Período Customizado */}
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={tempFilters.start_date || ''}
                onChange={(e) => handleTempFilterChange('start_date', e.target.value || undefined)}
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={tempFilters.end_date || ''}
                onChange={(e) => handleTempFilterChange('end_date', e.target.value || undefined)}
                className="min-h-[44px]"
              />
            </div>

            {/* Rota */}
            {routes.length > 0 && (
              <div className="space-y-2">
                <Label>Rota</Label>
                <select
                  className="min-h-[48px] w-full px-4 py-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-manipulation"
                  value={tempFilters.route_id || ''}
                  onChange={(e) => handleTempFilterChange('route_id', e.target.value || undefined)}
                >
                  <option value="">Todas as rotas</option>
                  {routes.map(route => (
                    <option key={route.id} value={route.id}>{route.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Veículo */}
            {veiculos.length > 0 && (
              <div className="space-y-2">
                <Label>Veículo</Label>
                <select
                  className="min-h-[48px] w-full px-4 py-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={tempFilters.veiculo_id || ''}
                  onChange={(e) => handleTempFilterChange('veiculo_id', e.target.value || undefined)}
                >
                  <option value="">Todos os veículos</option>
                  {veiculos.map(veiculo => (
                    <option key={veiculo.id} value={veiculo.id}>{veiculo.plate}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Motorista */}
            {motoristas.length > 0 && (
              <div className="space-y-2">
                <Label>Motorista</Label>
                <select
                  className="min-h-[48px] w-full px-4 py-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={tempFilters.motorista_id || ''}
                  onChange={(e) => handleTempFilterChange('motorista_id', e.target.value || undefined)}
                >
                  <option value="">Todos os motoristas</option>
                  {motoristas.map(motorista => (
                    <option key={motorista.id} value={motorista.id}>{motorista.email}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Grupo de Custo */}
            {categories.length > 0 && (
              <div className="space-y-2">
                <Label>Grupo de Custo</Label>
                <select
                  className="min-h-[48px] w-full px-4 py-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={tempFilters.group_name || ''}
                  onChange={(e) => handleTempFilterChange('group_name', e.target.value || undefined)}
                >
                  <option value="">Todos os grupos</option>
                  {Array.from(new Set(categories.map(c => c.group_name))).map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Categoria */}
            {categories.length > 0 && tempFilters.group_name && (
              <div className="space-y-2">
                <Label>Categoria</Label>
                <select
                  className="min-h-[48px] w-full px-4 py-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={tempFilters.category_id || ''}
                  onChange={(e) => handleTempFilterChange('category_id', e.target.value || undefined)}
                >
                  <option value="">Todas as categorias</option>
                  {categories
                    .filter(c => c.group_name === tempFilters.group_name)
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.category}</option>
                    ))}
                </select>
              </div>
            )}

            {/* Transportadora */}
            {carriers.length > 0 && (
              <div className="space-y-2">
                <Label>Transportadora</Label>
                <select
                  className="min-h-[48px] w-full px-4 py-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={tempFilters.transportadora_id || ''}
                  onChange={(e) => handleTempFilterChange('transportadora_id', e.target.value || undefined)}
                >
                  <option value="">Todas as transportadoras</option>
                  {carriers.map(transportadora => (
                    <option key={transportadora.id} value={transportadora.id}>{transportadora.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Limpar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveFilters}
              className="gap-2"
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

