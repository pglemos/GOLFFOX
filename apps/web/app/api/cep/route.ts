import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

async function cepHandler(request: NextRequest) {
    let cep: string | null = null
    try {
        const { searchParams } = new URL(request.url)
        cep = searchParams.get('cep')

        if (!cep) {
            return NextResponse.json(
                { success: false, error: 'CEP não fornecido' },
                { status: 400 }
            )
        }

        // Remove non-digits
        const cleanCep = cep.replace(/\D/g, '')

        if (cleanCep.length !== 8) {
            return NextResponse.json(
                { success: false, error: 'CEP deve ter 8 dígitos' },
                { status: 400 }
            )
        }

        // Call ViaCEP API from server-side
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
            headers: {
                'Accept': 'application/json',
            },
        })

        if (!response.ok) {
            throw new Error('Erro ao consultar ViaCEP')
        }

        const data = await response.json()

        if (data.erro) {
            return NextResponse.json(
                { success: false, error: 'CEP não encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            address: {
                cep: data.cep,
                logradouro: data.logradouro,
                complemento: data.complemento,
                bairro: data.bairro,
                localidade: data.localidade,
                uf: data.uf,
            }
        })
    } catch (error: any) {
        logger.error('Erro ao buscar CEP', { error, cep })
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar endereço pelo CEP' },
            { status: 500 }
        )
    }
}

export const GET = withRateLimit(cepHandler, 'public')
