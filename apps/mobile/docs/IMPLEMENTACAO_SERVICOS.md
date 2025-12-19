# Implementação de Serviços Mobile - GolfFox

**Data:** 2025-01-XX

---

## ✅ Serviços Criados

### 1. TripsService (`src/services/trips.service.ts`)

**Funcionalidades:**
- `getNextTrips(driverId)` - Buscar próximas viagens do motorista
- `getCurrentTrip(driverId)` - Buscar viagem atual em andamento
- `startTrip(tripId, checklistData)` - Iniciar viagem
- `completeTrip(tripId)` - Finalizar viagem

**Integração:**
- Substitui dados mock por chamadas reais ao Supabase
- Mapeia dados do Supabase para formato da interface `Trip`
- Tratamento de erros com logging estruturado

**Uso:**
```typescript
import { TripsService } from '@/src/services/trips.service'

const trips = await TripsService.getNextTrips(driverId)
const currentTrip = await TripsService.getCurrentTrip(driverId)
```

---

### 2. LocationService (`src/services/location.service.ts`)

**Funcionalidades:**
- `requestPermissions()` - Solicitar permissões de localização
- `startTracking(tripId, vehicleId, options)` - Iniciar rastreamento GPS
- `stopTracking()` - Parar rastreamento
- `getCurrentLocation()` - Obter localização atual (one-shot)

**Características:**
- Rastreamento em tempo real com `expo-location`
- Envio automático de localização para `driver_positions`
- Suporte a rastreamento em background
- Otimização de bateria (timeInterval, distanceInterval)

**Uso:**
```typescript
import { LocationService } from '@/src/services/location.service'

await LocationService.startTracking(tripId, vehicleId, {
  accuracy: Location.Accuracy.High,
  timeInterval: 30000, // 30 segundos
  distanceInterval: 50, // 50 metros
})
```

---

## 🔄 Próximos Passos

### 1. Integrar Serviços nas Telas

**Driver Dashboard (`app/driver/index.tsx`):**
- Substituir `mockTrips` por `TripsService.getNextTrips()`
- Usar `TripsService.getCurrentTrip()` para viagem atual

**Driver Route (`app/driver/route.tsx`):**
- Integrar `LocationService.startTracking()` ao iniciar viagem
- Parar rastreamento ao finalizar viagem

**Passenger Map (`app/passenger/map.tsx`):**
- Buscar localização do veículo via Supabase Realtime
- Exibir posição em tempo real

### 2. Adicionar Mais Serviços

- **ChecklistService** - Gerenciar checklist pré-viagem
- **PassengerService** - Gerenciar check-in de passageiros
- **NotificationsService** - Notificações push
- **OfflineService** - Cache e sincronização offline

### 3. Testes

- Testes unitários para serviços
- Testes de integração com Supabase
- Testes E2E de fluxos completos

---

## 📝 Notas

- Serviços usam logging estruturado (`debug`, `logError`)
- Tratamento de erros robusto
- Tipos TypeScript completos
- Prontos para integração nas telas

---

**Status:** ✅ Serviços criados, aguardando integração nas telas
