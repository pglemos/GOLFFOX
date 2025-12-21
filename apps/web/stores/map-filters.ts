import { create } from "zustand"

export interface MapFiltersState {
  company: string
  route: string
  veiculo: string
  motorista: string
  status: string
  shift: string
  search: string
  // Métodos para atualizar
  setCompany: (company: string) => void
  setRoute: (route: string) => void
  setVeiculo: (veiculo: string) => void
  setMotorista: (motorista: string) => void
  setStatus: (status: string) => void
  setShift: (shift: string) => void
  setSearch: (search: string) => void
  setFilters: (filters: Partial<Omit<MapFiltersState, 'setCompany' | 'setRoute' | 'setVeiculo' | 'setMotorista' | 'setStatus' | 'setShift' | 'setSearch' | 'setFilters' | 'reset'>>) => void
  reset: () => void
}

const initialState = {
  company: '',
  route: '',
  veiculo: '',
  motorista: '',
  status: '',
  shift: '',
  search: '',
}

export const useMapFilters = create<MapFiltersState>((set) => ({
  ...initialState,
  setCompany: (company) => set({ company }),
  setRoute: (route) => set({ route }),
  setVeiculo: (veiculo) => set({ veiculo }),
  setMotorista: (motorista) => set({ motorista }),
  setStatus: (status) => set({ status }),
  setShift: (shift) => set({ shift }),
  setSearch: (search) => set({ search }),
  setFilters: (filters) => set((state) => ({ ...state, ...filters })),
  reset: () => set(initialState),
}))

