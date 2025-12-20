import { create } from "zustand"

/**
 * EmpresaFilters - Filtros do painel da Empresa Contratante
 * @deprecated Preferir EmpresaFilters ao invés de OperadorFilters
 */
export interface EmpresaFilters {
    companyId: string | null
    dateRange: { start: Date | null; end: Date | null }
    shift: 'manha' | 'tarde' | 'noite' | null
    status: string | null
    carrierId: string | null
    routeId: string | null
    // Métodos para atualizar
    setCompanyId: (id: string | null) => void
    setDateRange: (range: { start: Date | null; end: Date | null }) => void
    setShift: (shift: 'manha' | 'tarde' | 'noite' | null) => void
    setStatus: (status: string | null) => void
    setCarrierId: (id: string | null) => void
    setRouteId: (id: string | null) => void
    reset: () => void
}

// Alias para compatibilidade com código legado
export type OperadorFilters = EmpresaFilters

const initialState = {
    companyId: null,
    dateRange: { start: null, end: null },
    shift: null,
    status: null,
    carrierId: null,
    routeId: null,
}

export const useEmpresaFilters = create<EmpresaFilters>((set) => ({
    ...initialState,
    setCompanyId: (id) => set({ companyId: id }),
    setDateRange: (range) => set({ dateRange: range }),
    setShift: (shift) => set({ shift }),
    setStatus: (status) => set({ status }),
    setCarrierId: (id) => set({ carrierId: id }),
    setRouteId: (id) => set({ routeId: id }),
    reset: () => set(initialState),
}))

// Alias para compatibilidade com código legado
export const useOperatorFilters = useEmpresaFilters
