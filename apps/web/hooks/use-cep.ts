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
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
            const data = await response.json()

            if (data.erro) {
                notifyError('CEP não encontrado')
                return null
            }

            return data
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
