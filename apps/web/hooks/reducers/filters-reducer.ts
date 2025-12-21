import { useReducer } from 'react'

// Estado de filtros
export interface FiltersState {
  expanded: boolean
  temp: {
    severity: string
    status: string
  }
  active: {
    severity: string
    status: string
  }
}

// Ações de filtros
type FiltersAction =
  | { type: 'SET_EXPANDED'; payload: boolean }
  | { type: 'UPDATE_TEMP_SEVERITY'; payload: string }
  | { type: 'UPDATE_TEMP_STATUS'; payload: string }
  | { type: 'UPDATE_TEMP_FILTERS'; payload: { severity: string; status: string } }
  | { type: 'SAVE_FILTERS' }
  | { type: 'RESET_FILTERS' }
  | { type: 'TOGGLE_EXPANDED' }

const initialState: FiltersState = {
  expanded: false,
  temp: {
    severity: 'all',
    status: 'all',
  },
  active: {
    severity: 'all',
    status: 'all',
  },
}

function filtersReducer(state: FiltersState, action: FiltersAction): FiltersState {
  switch (action.type) {
    case 'SET_EXPANDED':
      return { ...state, expanded: action.payload }
    case 'UPDATE_TEMP_SEVERITY':
      return {
        ...state,
        temp: { ...state.temp, severity: action.payload },
      }
    case 'UPDATE_TEMP_STATUS':
      return {
        ...state,
        temp: { ...state.temp, status: action.payload },
      }
    case 'UPDATE_TEMP_FILTERS':
      return {
        ...state,
        temp: { ...state.temp, ...action.payload },
      }
    case 'SAVE_FILTERS':
      return {
        ...state,
        active: { ...state.temp },
        expanded: false,
      }
    case 'RESET_FILTERS':
      return {
        expanded: false,
        temp: { severity: 'all', status: 'all' },
        active: { severity: 'all', status: 'all' },
      }
    case 'TOGGLE_EXPANDED':
      return { ...state, expanded: !state.expanded }
    default:
      return state
  }
}

export function useFiltersReducer() {
  return useReducer(filtersReducer, initialState)
}

