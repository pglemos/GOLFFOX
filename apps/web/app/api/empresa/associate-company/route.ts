import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { getSupabaseAdmin } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  // Verificar autenticação (admin ou empresa)
  const authError = await requireAuth(request, ['admin', 'gestor_empresa', 'gestor_empresa', 'gestor_transportadora', 'gestor_empresa'])
  if (authError) return authError
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

    // 2. Verificar se já existe mapeamento (selecionar apenas colunas necessárias)
    const { data: existingMapping } = await supabaseAdmin
      .from('gf_user_company_map')
      .select('user_id,company_id')
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
        role: 'gestor_transportadora',
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
  } catch (err) {
    logError('Erro ao associar operador', { error: err }, 'AssociateCompanyAPI')
    const errorMessage = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

