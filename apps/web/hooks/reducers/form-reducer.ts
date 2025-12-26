import { useReducer } from 'react'

import type { Database } from '@/types/supabase'

type RotasRow = Database['public']['Tables']['rotas']['Row']
type UserRow = Database['public']['Tables']['users']['Row']
type VeiculosRow = Database['public']['Tables']['veiculos']['Row']

// Estado de formulário de despacho
export interface DispatchFormState {
  resources: {
    routes: RotasRow[]
    drivers: UserRow[]
    vehicles: VeiculosRow[]
  }
  selections: {
    routeId: string
    driverId: string
    vehicleId: string
  }
  loading: {
    dispatching: boolean
    loadingResources: boolean
  }
}

// Ações do formulário
type DispatchFormAction =
  | { type: 'SET_ROUTES'; payload: RotasRow[] }
  | { type: 'SET_DRIVERS'; payload: UserRow[] }
  | { type: 'SET_VEHICLES'; payload: VeiculosRow[] }
  | { type: 'SET_ALL_RESOURCES'; payload: { routes: RotasRow[]; drivers: UserRow[]; vehicles: VeiculosRow[] } }
  | { type: 'SET_ROUTE_ID'; payload: string }
  | { type: 'SET_DRIVER_ID'; payload: string }
  | { type: 'SET_VEHICLE_ID'; payload: string }
  | { type: 'SET_DISPATCHING'; payload: boolean }
  | { type: 'SET_LOADING_RESOURCES'; payload: boolean }
  | { type: 'RESET_FORM' }
  | { type: 'RESET_SELECTIONS' }

const initialState: DispatchFormState = {
  resources: {
    routes: [],
    drivers: [],
    vehicles: [],
  },
  selections: {
    routeId: '',
    driverId: '',
    vehicleId: '',
  },
  loading: {
    dispatching: false,
    loadingResources: false,
  },
}

function dispatchFormReducer(state: DispatchFormState, action: DispatchFormAction): DispatchFormState {
  switch (action.type) {
    case 'SET_ROUTES':
      return {
        ...state,
        resources: { ...state.resources, routes: action.payload },
      }
    case 'SET_DRIVERS':
      return {
        ...state,
        resources: { ...state.resources, drivers: action.payload },
      }
    case 'SET_VEHICLES':
      return {
        ...state,
        resources: { ...state.resources, vehicles: action.payload },
      }
    case 'SET_ALL_RESOURCES':
      return {
        ...state,
        resources: action.payload,
      }
    case 'SET_ROUTE_ID':
      return {
        ...state,
        selections: { ...state.selections, routeId: action.payload },
      }
    case 'SET_DRIVER_ID':
      return {
        ...state,
        selections: { ...state.selections, driverId: action.payload },
      }
    case 'SET_VEHICLE_ID':
      return {
        ...state,
        selections: { ...state.selections, vehicleId: action.payload },
      }
    case 'SET_DISPATCHING':
      return {
        ...state,
        loading: { ...state.loading, dispatching: action.payload },
      }
    case 'SET_LOADING_RESOURCES':
      return {
        ...state,
        loading: { ...state.loading, loadingResources: action.payload },
      }
    case 'RESET_FORM':
      return initialState
    case 'RESET_SELECTIONS':
      return {
        ...state,
        selections: {
          routeId: '',
          driverId: '',
          vehicleId: '',
        },
      }
    default:
      return state
  }
}

export function useDispatchFormReducer() {
  return useReducer(dispatchFormReducer, initialState)
}

