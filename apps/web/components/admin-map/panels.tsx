/**
 * Painéis Laterais
 * Painéis de veículo, rota e alertas
 */

'use client'

import { memo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Navigation, LifeBuoy, History, Clock, Users, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { modalContent } from '@/lib/animations'
import type { Vehicle, RoutePolyline, Alert } from './admin-map'

interface VehiclePanelProps {
  vehicle: Vehicle
  onClose: () => void
  onFollow: () => void
  onDispatch: () => void
  onViewHistory?: () => void
}

export const VehiclePanel = memo(function VehiclePanel({
  vehicle,
  onClose,
  onFollow,
  onDispatch,
  onViewHistory,
}: VehiclePanelProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={modalContent}
      className="absolute top-6 right-6 w-80 z-30"
    >
      <Card className="p-6 glass shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-bold text-xl">{vehicle.plate}</h3>
            <p className="text-sm text-[var(--ink-muted)]">{vehicle.model}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <span className="text-[var(--ink-muted)] block mb-1">Motorista:</span>
            <p className="font-semibold">{vehicle.driver_name}</p>
          </div>

          <div>
            <span className="text-[var(--ink-muted)] block mb-1">Empresa:</span>
            <p className="font-semibold">{vehicle.company_name}</p>
          </div>

          <div>
            <span className="text-[var(--ink-muted)] block mb-1">Rota:</span>
            <p className="font-semibold">{vehicle.route_name}</p>
          </div>

          <div>
            <span className="text-[var(--ink-muted)] block mb-2">Status:</span>
            <Badge
              variant={
                vehicle.vehicle_status === 'moving'
                  ? 'default'
                  : vehicle.vehicle_status === 'stopped_long'
                  ? 'destructive'
                  : 'warning'
              }
            >
              {vehicle.vehicle_status === 'moving'
                ? 'Em Movimento'
                : vehicle.vehicle_status === 'stopped_long'
                ? 'Parado (>3min)'
                : vehicle.vehicle_status === 'stopped_short'
                ? 'Parado (<2min)'
                : 'Na Garagem'}
            </Badge>
          </div>

          <div className="flex items-center gap-4 pt-2 border-t">
            <Users className="h-4 w-4 text-[var(--ink-muted)]" />
            <div>
              <span className="text-[var(--ink-muted)] block text-xs">Passageiros</span>
              <span className="font-semibold">{vehicle.passenger_count || 0}</span>
            </div>
            <Clock className="h-4 w-4 text-[var(--ink-muted)]" />
            <div>
              <span className="text-[var(--ink-muted)] block text-xs">Velocidade</span>
              <span className="font-semibold">
                {vehicle.speed ? `${(vehicle.speed * 3.6).toFixed(0)} km/h` : 'Parado'}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button className="flex-1" variant="outline" onClick={onFollow}>
              <Navigation className="h-4 w-4 mr-2" />
              Seguir
            </Button>
            <Button className="flex-1" variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              Abrir Rota
            </Button>
          </div>

          <Button className="w-full" variant="destructive" onClick={onDispatch}>
            <LifeBuoy className="h-4 w-4 mr-2" />
            Despachar Socorro
          </Button>

          <Button className="w-full" variant="outline" onClick={onViewHistory}>
            <History className="h-4 w-4 mr-2" />
            Ver Histórico (2h)
          </Button>
        </div>
      </Card>
    </motion.div>
  )
})

interface RoutePanelProps {
  route: RoutePolyline
  onClose: () => void
  onViewDetails?: () => void
}

export const RoutePanel = memo(function RoutePanel({ route, onClose, onViewDetails }: RoutePanelProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={modalContent}
      className="absolute top-6 right-6 w-80 z-30"
    >
      <Card className="p-6 glass shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-bold text-xl">{route.route_name}</h3>
            <p className="text-sm text-[var(--ink-muted)]">{route.company_name}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[var(--ink-muted)] block mb-1">Paradas:</span>
              <p className="font-semibold text-lg">{route.stops_count || 0}</p>
            </div>
            <div>
              <span className="text-[var(--ink-muted)] block mb-1">Pontos:</span>
              <p className="font-semibold text-lg">{route.polyline_points?.length || 0}</p>
            </div>
          </div>

          {route.origin_address && (
            <div>
              <span className="text-[var(--ink-muted)] block mb-1">Origem:</span>
              <p className="font-semibold">{route.origin_address}</p>
            </div>
          )}

          {route.destination_address && (
            <div>
              <span className="text-[var(--ink-muted)] block mb-1">Destino:</span>
              <p className="font-semibold">{route.destination_address}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t">
            <Button className="flex-1" variant="outline" onClick={onViewDetails}>
              <MapPin className="h-4 w-4 mr-2" />
              Ver Detalhes
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
})

interface AlertsPanelProps {
  alerts: Alert[]
  onClose: () => void
}

export const AlertsPanel = memo(function AlertsPanel({ alerts, onClose }: AlertsPanelProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={modalContent}
      className="absolute top-6 right-6 w-96 z-30 max-h-[600px] overflow-y-auto"
    >
      <Card className="p-6 glass shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-bold text-xl">Alertas Abertos</h3>
            <p className="text-sm text-[var(--ink-muted)]">{alerts.length} alerta(s)</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.alert_id}
              className="p-3 border rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer"
              onClick={() => {
                // Implementar navegação para alerta
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <Badge
                  variant={alert.severity === 'critical' ? 'destructive' : 'warning'}
                >
                  {alert.alert_type === 'incident' ? 'Incidente' : 'Socorro'}
                </Badge>
                <span className="text-xs text-[var(--ink-muted)]">
                  {new Date(alert.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm">{alert.description}</p>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  )
})

