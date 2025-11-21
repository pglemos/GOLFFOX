import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase não configurado')
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const { email, companyId } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 1. Buscar usuário pelo email
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 })
    }
    
    const operatorUser = authUsers.users.find(u => u.email === email)
    
    if (!operatorUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // 2. Verificar se já existe mapeamento
    const { data: existingMapping } = await supabaseAdmin
      .from('gf_user_company_map')
      .select('*')
      .eq('user_id', operatorUser.id)
      .limit(1)
      .single()
    
    if (existingMapping) {
      return NextResponse.json({ 
        success: true, 
        message: 'Operador já está associado a uma empresa',
        companyId: existingMapping.company_id
      })
    }

    // 3. Buscar empresa (usar companyId se fornecido, senão buscar primeira disponível)
    let finalCompanyId: string
    
    if (companyId) {
      // Verificar se a empresa existe
      const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('id, name')
        .eq('id', companyId)
        .eq('is_active', true)
        .single()
      
      if (companyError || !company) {
        return NextResponse.json({ error: 'Empresa não encontrada ou inativa' }, { status: 404 })
      }
      
      finalCompanyId = company.id
    } else {
      // Buscar primeira empresa disponível
      const { data: companies, error: companiesError } = await supabaseAdmin
        .from('companies')
        .select('id, name')
        .eq('is_active', true)
        .limit(1)
      
      if (companiesError) {
        return NextResponse.json({ error: 'Erro ao buscar empresas' }, { status: 500 })
      }
      
      if (!companies || companies.length === 0) {
        return NextResponse.json({ 
          error: 'Nenhuma empresa cadastrada no sistema. Entre em contato com o administrador.' 
        }, { status: 404 })
      }
      
      finalCompanyId = companies[0].id
    }

    // 4. Criar mapeamento
    const { data: mapping, error: mapError } = await supabaseAdmin
      .from('gf_user_company_map')
      .insert({
        user_id: operatorUser.id,
        company_id: finalCompanyId
      })
      .select()
      .single()
    
    if (mapError) {
      return NextResponse.json({ error: 'Erro ao criar mapeamento' }, { status: 500 })
    }

    // 5. Atualizar perfil do usuário
    await supabaseAdmin
      .from('users')
      .upsert({
        id: operatorUser.id,
        email: operatorUser.email,
        role: 'operador',
        company_id: finalCompanyId,
        is_active: true
      }, {
        onConflict: 'id'
      })

    return NextResponse.json({ 
      success: true, 
      message: 'Operador associado à empresa com sucesso',
      companyId: finalCompanyId
    })
  } catch (error: any) {
    console.error('Erro ao associar operador:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}

