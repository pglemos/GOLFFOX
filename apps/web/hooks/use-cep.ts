import { useState } from 'react'

import { notifyError } from '@/lib/toast'

interface AddressData {
    cep: string
    logradouro: string
    complemento: string
    bairro: string
    localidade: string
    uf: string
    erro?: boolean
}

export function useCep() {
    const [loading, setLoading] = useState(false)

    const fetchCep = async (cep: string): Promise<AddressData | null> => {
        // Remove non-digits
        const cleanCep = cep.replace(/\D/g, '')

        if (cleanCep.length !== 8) {
            return null
        }

        setLoading(true)
        try {
            // Use our API route instead of calling ViaCEP directly
            const response = await fetch(`/api/cep?cep=${cleanCep}`)
            const result = await response.json()

            if (!response.ok || !result.success) {
                notifyError(result.error || 'CEP não encontrado')
                return null
            }

            return result.address
        } catch (error) {
            console.error('Erro ao buscar CEP:', error)
            notifyError('Erro ao buscar endereço pelo CEP')
            return null
        } finally {
            setLoading(false)
        }
    }

    return { fetchCep, loading }
}
