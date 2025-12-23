/**
 * OpenAPI Documentation Endpoint
 * Retorna a especificação OpenAPI da API
 */

import { readFile } from 'fs/promises'
import { join } from 'path'

import { NextRequest, NextResponse } from 'next/server'

import { applyRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // Aplicar rate limiting para documentação pública
  const rateLimitResponse = await applyRateLimit(request, 'public')
  if (rateLimitResponse) return rateLimitResponse
  try {
    // Usar process.cwd() que funciona bem no Node.js runtime
    // No Vercel, process.cwd() aponta para o diretório raiz do projeto
    const openApiPath = join(process.cwd(), 'apps/web/openapi.yaml')
    
    // Fallback: tentar caminho alternativo se o primeiro não existir
    let content: string
    try {
      content = await readFile(openApiPath, 'utf-8')
    } catch (err) {
      // Tentar caminho relativo do diretório de build
      const fallbackPath = join(process.cwd(), 'openapi.yaml')
      content = await readFile(fallbackPath, 'utf-8')
    }
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/yaml',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro ao carregar documentação OpenAPI',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
