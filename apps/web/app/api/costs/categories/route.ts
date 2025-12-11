/**
 * API: Categorias de Custos
 * GET - Lista categorias por perfil com sugestões inteligentes
 * POST - Cria nova categoria (apenas admin)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import type { CostCategory, CostCategoryInsert, ProfileType } from '@/types/financial'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

// GET /api/costs/categories
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)

    const profileType = searchParams.get('profile_type') as ProfileType | null
    const includeInactive = searchParams.get('include_inactive') === 'true'
    const search = searchParams.get('search')
    const legacyMode = searchParams.get('legacy') === 'true'

    // Verificar se está usando estrutura nova ou legada
    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from('gf_cost_categories')
      .select('id, profile_type')
      .limit(1)

    // Se profile_type existe, usar nova estrutura
    const useNewStructure = !tableError && tableCheck?.[0]?.profile_type !== undefined

    if (useNewStructure && !legacyMode) {
      // Nova estrutura com profile_type
      let query = supabaseAdmin
        .from('gf_cost_categories')
        .select('*')
        .order('display_order', { ascending: true })

      // Filtrar por perfil
      if (profileType) {
        query = query.or(`profile_type.eq.${profileType},profile_type.eq.all`)
      }

      // Filtrar ativos
      if (!includeInactive) {
        query = query.eq('is_active', true)
      }

      // Busca por nome/keywords
      if (search) {
        query = query.or(`name.ilike.%${search}%,keywords.cs.{${search}}`)
      }

      const { data, error } = await query

      if (error) {
        console.error('[API] Erro ao buscar categorias (nova estrutura):', error)
        return NextResponse.json(
          { success: false, error: error.message, data: [] },
          { status: 200 }
        )
      }

      // Transformar para camelCase
      const categories: CostCategory[] = (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        name: row.name as string,
        profileType: row.profile_type as ProfileType,
        parentId: row.parent_id as string | null,
        icon: row.icon as string | null,
        color: row.color as string | null,
        keywords: (row.keywords as string[]) || [],
        isOperational: row.is_operational as boolean,
        isActive: row.is_active as boolean,
        displayOrder: row.display_order as number,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
      }))

      return NextResponse.json({ success: true, data: categories })
    } else {
      // Estrutura legada (group_name, category, subcategory)
      const categoryColumns = 'id,group_name,category,subcategory,description,is_active,created_at,updated_at'
      const { data, error } = await supabaseAdmin
        .from('gf_cost_categories')
        .select(categoryColumns)

      if (error) {
        console.error('Erro ao buscar categorias:', error)

        // Se a tabela não existe, retornar array vazio
        if (error.message?.includes('does not exist') ||
          error.message?.includes('relation') ||
          error.message?.includes('table') ||
          error.code === 'PGRST205') {
          return NextResponse.json(
            {
              error: 'Tabela gf_cost_categories não encontrada',
              message: 'Execute a migração 20241211_financial_system.sql para criar a tabela.',
              data: []
            },
            { status: 200 }
          )
        }

        return NextResponse.json(
          { error: error.message, data: [] },
          { status: 200 }
        )
      }

      const filtered = (data || []).filter((cat: Record<string, unknown>) =>
        (cat.is_active === undefined ? true : cat.is_active === true)
      )
      const sorted = filtered.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const gA = ((a.group_name || '') as string).localeCompare((b.group_name || '') as string)
        if (gA !== 0) return gA
        const cA = ((a.category || '') as string).localeCompare((b.category || '') as string)
        if (cA !== 0) return cA
        return ((a.subcategory || '') as string).localeCompare((b.subcategory || '') as string)
      })

      return NextResponse.json(sorted)
    }
  } catch (err) {
    console.error('[API] Erro ao buscar categorias:', err)
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: errorMessage, data: [] },
      { status: 200 }
    )
  }
}

// POST /api/costs/categories
export async function POST(request: NextRequest) {
  try {
    // Requerer autenticação como admin
    const authResponse = await requireAuth(request, 'admin')
    if (authResponse) return authResponse

    const supabaseAdmin = getSupabaseAdmin()
    const body: CostCategoryInsert = await request.json()

    // Validação
    if (!body.name || !body.profileType) {
      return NextResponse.json(
        { success: false, error: 'Nome e tipo de perfil são obrigatórios' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('gf_cost_categories')
      .insert({
        name: body.name,
        profile_type: body.profileType,
        parent_id: body.parentId,
        icon: body.icon,
        color: body.color,
        keywords: body.keywords || [],
        is_operational: body.isOperational ?? false,
        display_order: body.displayOrder ?? 0,
      })
      .select()
      .single()

    if (error) {
      console.error('[API] Erro ao criar categoria:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('[API] Erro interno:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
