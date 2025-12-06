/**
 * OpenAPI Documentation Endpoint
 * Retorna a especificação OpenAPI da API
 */

import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const openApiPath = join(process.cwd(), 'apps/web/openapi.yaml')
    const content = await readFile(openApiPath, 'utf-8')
    
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
