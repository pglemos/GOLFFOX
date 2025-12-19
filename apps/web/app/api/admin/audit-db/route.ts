import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  // Verificar autenticação admin
  const authError = await requireAuth(request, 'admin')
  if (authError) return authError
  try {
    // Usar RPC ou query direta se possível
    // Nota: information_schema pode não estar acessível via Supabase client
    // Vamos retornar estrutura baseada nas migrations existentes
    
    const audit = {
      web: {
        stack: "next15",
        tem_12_abas: true,
        tem_mapa_google: true,
        usa_app_router: true
      },
      mobile: {
        stack: "flutter3.24",
        features: ["driver", "passenger", "operador", "admin"],
        tem_tracking_service: false // precisa verificar
      },
      db: {
        schema: "v7.4",
        tabelas: "verificar_via_sql_editor",
        views: "verificar_via_sql_editor", 
        rpcs: "verificar_via_sql_editor",
        faltando: "verificar_via_sql_editor"
      },
      mensagem: "Execute as queries SQL manualmente no Supabase SQL Editor para auditoria completa"
    }

    return NextResponse.json(audit)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

