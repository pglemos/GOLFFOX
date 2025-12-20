# AdminMap - Componente de Mapa Admin

Componente principal para visualização e gerenciamento de veículos, rotas e alertas em tempo real e histórico.

## Props

```typescript
interface AdminMapProps {
  companyId?: string        // ID da empresa para filtrar (opcional)
  routeId?: string          // ID da rota para filtrar (opcional)
  vehicleId?: string        // ID do veículo para filtrar (opcional)
  initialCenter?: { lat: number; lng: number }  // Centro inicial do mapa (opcional)
  initialZoom?: number      // Zoom inicial do mapa (opcional, padrão: 13)
}
```

## Interfaces

### veiculo

```typescript
interface veiculo {
  vehicle_id: string
  trip_id: string
  route_id: string
  route_name: string
  driver_id: string
  driver_name: string
  company_id: string
  company_name: string
  plate: string
  model: string
  lat: number
  lng: number
  speed: number | null
  heading: number | null
  vehicle_status: 'moving' | 'stopped_short' | 'stopped_long' | 'garage'
  passenger_count: number
  last_position_time?: string
}
```

### RoutePolyline

```typescript
interface RoutePolyline {
  route_id: string
  route_name: string
  company_id: string
  polyline_points: Array<{ lat: number; lng: number; order: number }>
  stops_count: number
}
```

### Alert

```typescript
interface Alert {
  alert_id: string
  alert_type: 'incident' | 'assistance'
  company_id: string
  route_id?: string
  vehicle_id?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  lat?: number
  lng?: number
  description: string
  created_at: string
}
```

## Funcionalidades

### Modo Ao Vivo

- Visualização em tempo real de veículos, rotas e alertas
- Atualizações via Supabase Realtime
- Fallback para polling se realtime falhar
- Detecção automática de desvio de rota
- Despacho de socorro

### Modo Histórico

- Playback de posições históricas
- Controles de velocidade (1x, 2x, 4x)
- Seleção de período customizado
- Visualização de trajetos reais vs planejados

### Filtros

- Empresa
- Rota
- Veículo
- Motorista
- Status
- Turno
- Busca global (com debounce)

### Exportação

- PNG do mapa
- CSV dos veículos visíveis

### Camadas

- **Rotas Planejadas**: Polylines azuis
- **Trajetos Reais**: Polylines amarelas/laranjas (modo histórico ou veículo selecionado)
- **Paradas**: Marcadores roxos com círculos de detecção
- **Veículos**: Marcadores com cores baseadas em status
- **Alertas**: Marcadores pulsantes
- **Heatmap**: Densidade de veículos (toggle on/off)

### Performance

- Virtualização de marcadores (>50 veículos)
- Lazy loading de rotas (50 por vez)
- Debounce em filtros de busca (500ms)
- Clusterização de marcadores quando necessário

## Exemplo de Uso

```tsx
import { AdminMap } from '@/components/admin-map/admin-map'

export default function MapPage() {
  return (
    <div className="h-screen">
      <AdminMap
        companyId="company-123"
        initialCenter={{ lat: -19.916681, lng: -43.934493 }}
        initialZoom={13}
      />
    </div>
  )
}
```

## Callbacks e Eventos

O componente gerencia eventos internamente via:
- `RealtimeService`: Atualizações em tempo real
- `PlaybackService`: Playback histórico
- `RouteDeviationDetector`: Detecção de desvios
- `createAlert`: Criação de alertas operacionais

## Dependências

- Google Maps API (com biblioteca `visualization` para heatmap)
- Supabase (para realtime e dados)
- `@googlemaps/markerclusterer` (para clusterização)
- `react-hot-toast` (para notificações)
- `framer-motion` (para animações)

## Notas

- O componente sincroniza estado com URL (deep-linking)
- Implementa fallback para modo lista se Google Maps falhar
- Monitora quota do Google Maps API
- Limita marcadores visíveis a 100 simultâneos quando usando virtualização

