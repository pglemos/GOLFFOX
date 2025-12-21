import { create } from "zustand"

export interface Veiculo {
  id: string
  plate?: string
  [key: string]: any
}

export interface RoutePolyline {
  route_id: string
  route_name?: string
  [key: string]: any
}

export interface MapAlert {
  id: string
  [key: string]: any
}

export interface MapSelectionState {
  selectedVeiculo: Veiculo | null
  selectedRoute: RoutePolyline | null
  selectedAlert: MapAlert | null
  selectedRouteId: string | null
  // Métodos para atualizar
  setSelectedVeiculo: (veiculo: Veiculo | null) => void
  setSelectedRoute: (route: RoutePolyline | null) => void
  setSelectedAlert: (alert: MapAlert | null) => void
  setSelectedRouteId: (routeId: string | null) => void
  clearSelection: () => void
}

export const useMapSelection = create<MapSelectionState>((set) => ({
  selectedVeiculo: null,
  selectedRoute: null,
  selectedAlert: null,
  selectedRouteId: null,
  setSelectedVeiculo: (veiculo) => set({ selectedVeiculo: veiculo }),
  setSelectedRoute: (route) => set({ selectedRoute: route, selectedRouteId: route?.route_id || null }),
  setSelectedAlert: (alert) => set({ selectedAlert: alert }),
  setSelectedRouteId: (routeId) => set({ selectedRouteId: routeId }),
  clearSelection: () => set({
    selectedVeiculo: null,
    selectedRoute: null,
    selectedAlert: null,
    selectedRouteId: null,
  }),
}))

