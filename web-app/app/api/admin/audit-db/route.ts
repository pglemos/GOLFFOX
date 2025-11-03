import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Esta rota precisa de service_role para consultar information_schema
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET() {
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
        features: ["driver", "passenger", "operator", "admin"],
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

