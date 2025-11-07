"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Filter, X, Calendar } from "lucide-react"

export interface CostFilters {
  start_date?: string
  end_date?: string
  route_id?: string
  vehicle_id?: string
  driver_id?: string
  category_id?: string
  group_name?: string
  carrier_id?: string
  cost_center_id?: string
}

interface CostFiltersProps {
  onFiltersChange: (filters: CostFilters) => void
  routes?: Array<{ id: string; name: string }>
  vehicles?: Array<{ id: string; plate: string }>
  drivers?: Array<{ id: string; email: string }>
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
  vehicles = [],
  drivers = [],
  categories = [],
  carriers = []
}: CostFiltersProps) {
  const [filters, setFilters] = useState<CostFilters>({})
  const [showFilters, setShowFilters] = useState(false)

  const handleFilterChange = (key: keyof CostFilters, value: string | undefined) => {
    const newFilters = { ...filters }
    if (value) {
      newFilters[key] = value
    } else {
      delete newFilters[key]
    }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handlePreset = (preset: keyof typeof PERIOD_PRESETS) => {
    const { start, end } = PERIOD_PRESETS[preset]
    const newFilters = {
      ...filters,
      start_date: start,
      end_date: end
    }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    setFilters({})
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold">Filtros</h3>
          {hasActiveFilters && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
              {Object.keys(filters).length} ativo(s)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
          </Button>
        </div>
      </div>

      {/* Presets de Período */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(PERIOD_PRESETS).map(([key, preset]) => (
          <Button
            key={key}
            variant={filters.start_date === preset.start ? "default" : "outline"}
            size="sm"
            onClick={() => handlePreset(key as keyof typeof PERIOD_PRESETS)}
          >
            <Calendar className="h-3 w-3 mr-1" />
            {preset.label}
          </Button>
        ))}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
          {/* Período Customizado */}
          <div className="space-y-2">
            <Label>Data Início</Label>
            <Input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label>Data Fim</Label>
            <Input
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => handleFilterChange('end_date', e.target.value || undefined)}
            />
          </div>

          {/* Rota */}
          {routes.length > 0 && (
            <div className="space-y-2">
              <Label>Rota</Label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                value={filters.route_id || ''}
                onChange={(e) => handleFilterChange('route_id', e.target.value || undefined)}
              >
                <option value="">Todas as rotas</option>
                {routes.map(route => (
                  <option key={route.id} value={route.id}>{route.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Veículo */}
          {vehicles.length > 0 && (
            <div className="space-y-2">
              <Label>Veículo</Label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                value={filters.vehicle_id || ''}
                onChange={(e) => handleFilterChange('vehicle_id', e.target.value || undefined)}
              >
                <option value="">Todos os veículos</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>{vehicle.plate}</option>
                ))}
              </select>
            </div>
          )}

          {/* Motorista */}
          {drivers.length > 0 && (
            <div className="space-y-2">
              <Label>Motorista</Label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                value={filters.driver_id || ''}
                onChange={(e) => handleFilterChange('driver_id', e.target.value || undefined)}
              >
                <option value="">Todos os motoristas</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>{driver.email}</option>
                ))}
              </select>
            </div>
          )}

          {/* Grupo de Custo */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label>Grupo de Custo</Label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                value={filters.group_name || ''}
                onChange={(e) => handleFilterChange('group_name', e.target.value || undefined)}
              >
                <option value="">Todos os grupos</option>
                {Array.from(new Set(categories.map(c => c.group_name))).map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
          )}

          {/* Categoria */}
          {categories.length > 0 && filters.group_name && (
            <div className="space-y-2">
              <Label>Categoria</Label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                value={filters.category_id || ''}
                onChange={(e) => handleFilterChange('category_id', e.target.value || undefined)}
              >
                <option value="">Todas as categorias</option>
                {categories
                  .filter(c => c.group_name === filters.group_name)
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
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                value={filters.carrier_id || ''}
                onChange={(e) => handleFilterChange('carrier_id', e.target.value || undefined)}
              >
                <option value="">Todas as transportadoras</option>
                {carriers.map(carrier => (
                  <option key={carrier.id} value={carrier.id}>{carrier.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

