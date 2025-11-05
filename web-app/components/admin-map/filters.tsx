/**
 * Componente de Filtros do Mapa
 */

'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Clock, Search, Radio } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

interface MapFiltersProps {
  filters: {
    company: string
    route: string
    vehicle: string
    driver: string
    status: string
    shift: string
    search: string
  }
  onFiltersChange: (filters: any) => void
  vehiclesCount: number
  routesCount: number
  alertsCount: number
  mode: 'live' | 'history'
  onModeChange: (mode: 'live' | 'history') => void
}

export function MapFilters({
  filters,
  onFiltersChange,
  vehiclesCount,
  routesCount,
  alertsCount,
  mode,
  onModeChange,
}: MapFiltersProps) {
  const [companies, setCompanies] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])

  // Carregar opções de filtros
  useEffect(() => {
    loadFilterOptions()
  }, [])

  const loadFilterOptions = async () => {
    try {
      // Carregar empresas
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name')
        .order('name')
      if (companiesData) setCompanies(companiesData)

      // Carregar rotas
      const { data: routesData } = await supabase
        .from('routes')
        .select('id, name')
        .eq('company_id', filters.company || null)
        .order('name')
      if (routesData) setRoutes(routesData)

      // Carregar veículos
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('id, plate')
        .eq('company_id', filters.company || null)
        .order('plate')
      if (vehiclesData) setVehicles(vehiclesData)

      // Carregar motoristas
      const { data: driversData } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'driver')
        .eq('company_id', filters.company || null)
        .order('name')
      if (driversData) setDrivers(driversData)
    } catch (error) {
      console.error('Erro ao carregar opções de filtros:', error)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    const normalized = value === '__ALL__' ? '' : value
    onFiltersChange({ ...filters, [key]: normalized })
  }

  return (
    <Card className="p-4 glass shadow-xl">
      <div className="flex flex-wrap items-center gap-3">
        {/* Modo: Ao vivo | Histórico */}
        <div className="flex items-center gap-2 border-r pr-3">
          <Button
            variant={mode === 'live' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onModeChange('live')}
          >
            <Radio className="h-4 w-4 mr-2" />
            Ao vivo
          </Button>
          <Button
            variant={mode === 'history' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onModeChange('history')}
          >
            <Clock className="h-4 w-4 mr-2" />
            Histórico
          </Button>
        </div>

        {/* Empresa */}
        <Select
          value={filters.company || '__ALL__'}
          onValueChange={(value) => handleFilterChange('company', value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__ALL__">Todas</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Rota */}
        <Select
          value={filters.route || '__ALL__'}
          onValueChange={(value) => handleFilterChange('route', value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Rota" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__ALL__">Todas</SelectItem>
            {routes.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Veículo */}
        <Select
          value={filters.vehicle || '__ALL__'}
          onValueChange={(value) => handleFilterChange('vehicle', value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Veículo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__ALL__">Todos</SelectItem>
            {vehicles.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.plate}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Motorista */}
        <Select
          value={filters.driver || '__ALL__'}
          onValueChange={(value) => handleFilterChange('driver', value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Motorista" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__ALL__">Todos</SelectItem>
            {drivers.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select
          value={filters.status || '__ALL__'}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__ALL__">Todos</SelectItem>
            <SelectItem value="moving">Em andamento</SelectItem>
            <SelectItem value="scheduled">Agendada</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
            <SelectItem value="stopped_short">Parado &lt;2min</SelectItem>
            <SelectItem value="stopped_long">Parado &gt;3min</SelectItem>
            <SelectItem value="garage">Na garagem</SelectItem>
          </SelectContent>
        </Select>

        {/* Turno */}
        <Select
          value={filters.shift || '__ALL__'}
          onValueChange={(value) => handleFilterChange('shift', value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Turno" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__ALL__">Todos</SelectItem>
            <SelectItem value="manha">Manhã</SelectItem>
            <SelectItem value="tarde">Tarde</SelectItem>
            <SelectItem value="noite">Noite</SelectItem>
          </SelectContent>
        </Select>

        {/* Busca Global */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-muted)]" />
          <Input
            placeholder="Buscar (ID, placa, motorista)..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Date Picker (quando histórico) */}
        {mode === 'history' && (
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Período
          </Button>
        )}

        {/* Badges de Contagem */}
        <div className="flex items-center gap-2 border-l pl-3">
          <Badge variant="outline">
            {vehiclesCount} veículos
          </Badge>
          <Badge variant="outline">
            {routesCount} rotas
          </Badge>
          {alertsCount > 0 && (
            <Badge variant="destructive">
              {alertsCount} alertas
            </Badge>
          )}
        </div>
      </div>
    </Card>
  )
}

