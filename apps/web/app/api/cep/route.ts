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

        // Primeiro: Tentar ViaCEP
        try {
            const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
                headers: { 'Accept': 'application/json' },
            })

            if (viaCepResponse.ok) {
                const viaCepData = await viaCepResponse.json()

                // Se encontrou no ViaCEP
                if (!viaCepData.erro) {
                    return NextResponse.json({
                        success: true,
                        address: {
                            cep: viaCepData.cep,
                            logradouro: viaCepData.logradouro,
                            complemento: viaCepData.complemento,
                            bairro: viaCepData.bairro,
                            localidade: viaCepData.localidade,
                            uf: viaCepData.uf,
                        }
                    })
                }
            }
        } catch (viaCepError) {
            logger.warn('ViaCEP falhou, tentando BrasilAPI', { cep: cleanCep, error: viaCepError })
        }

        // Fallback: Tentar BrasilAPI (especialmente útil para CEPs genéricos -000)
        try {
            const brasilApiResponse = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`, {
                headers: { 'Accept': 'application/json' },
            })

            if (brasilApiResponse.ok) {
                const brasilApiData = await brasilApiResponse.json()

                // BrasilAPI encontrou
                return NextResponse.json({
                    success: true,
                    address: {
                        cep: brasilApiData.cep ? `${brasilApiData.cep.slice(0, 5)}-${brasilApiData.cep.slice(5)}` : cleanCep,
                        logradouro: brasilApiData.street || '',
                        complemento: '',
                        bairro: brasilApiData.neighborhood || '',
                        localidade: brasilApiData.city || '',
                        uf: brasilApiData.state || '',
                    }
                })
            }
        } catch (brasilApiError) {
            logger.warn('BrasilAPI também falhou', { cep: cleanCep, error: brasilApiError })
        }

        // Nenhuma API encontrou
        return NextResponse.json(
            { success: false, error: 'CEP não encontrado' },
            { status: 404 }
        )
    } catch (error: any) {
        logger.error('Erro ao buscar CEP', { error, cep })
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar endereço pelo CEP' },
            { status: 500 }
        )
    }
}

export const GET = withRateLimit(cepHandler, 'public')
