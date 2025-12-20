'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface TransportadoraContextType {
    transportadoraId: string | null
    transportadoraName: string
    logoUrl: string | null
    loading: boolean
    error: string | null
}

const TenantContext = createContext<TransportadoraContextType | undefined>(undefined)

export function TransportadoraTenantProvider({ children }: { children: ReactNode }) {
    const [transportadoraId, setTransportadoraId] = useState<string | null>(null)
    const [transportadoraName, setTransportadoraName] = useState('Transportadora')
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadTransportadora = async () => {
            try {
                setLoading(true)
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) return

                // 1. Tentar pegar transportadora_id direto do usuário
                const { data: userData } = await supabase
                    .from('users')
                    .select('transportadora_id')
                    .eq('id', user.id)
                    .single()

                let foundId = (userData as any)?.transportadora_id

                // 2. Se não achou, tentar buscar na tabela carriers por e-mail ou dono?
                // Assumindo que o usuário DEVE ter transportadora_id setado.

                if (foundId) {
                    // Buscar dados da transportadora
                    const { data: transportadoraData } = await (supabase as any)
                        .from('transportadoras')
                        .select('id, name, logo_url')
                        .eq('id', foundId)
                        .single()

                    if (transportadoraData) {
                        setTransportadoraId(transportadoraData.id)
                        setTransportadoraName(transportadoraData.name || 'Transportadora')
                        setLogoUrl(transportadoraData.logo_url)
                    }
                } else {
                    // Fallback para dev/test se necessário
                    // setError('Usuário não vinculado a uma transportadora')
                }

            } catch (err: any) {
                console.error('Erro ao carregar transportadora:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        loadTransportadora()
    }, [])

    return (
        <TenantContext.Provider value={{
            transportadoraId,
            transportadoraName,
            logoUrl,
            loading,
            error
        }}>
            {children}
        </TenantContext.Provider>
    )
}

export function useTransportadoraTenant() {
    const context = useContext(TenantContext)
    if (!context) {
        throw new Error('useTransportadoraTenant deve ser usado dentro de TransportadoraTenantProvider')
    }
    return context
}
