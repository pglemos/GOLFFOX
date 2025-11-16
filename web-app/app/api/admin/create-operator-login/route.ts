import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
	if (!url || !serviceKey) {
		throw new Error('Supabase não configurado')
	}
	return createClient(url, serviceKey)
}

export async function POST(request: NextRequest) {
	try {
		const isDevelopment = process.env.NODE_ENV === 'development'
		const authErrorResponse = await requireAuth(request, 'admin')
		if (authErrorResponse && !isDevelopment) {
		 return authErrorResponse
		}

		const body = await request.json()
		const companyId = body?.company_id || body?.companyId
		const email = (body?.email || '').toString().toLowerCase().trim()
		const password = (body?.password || '').toString()
		const name = (body?.name || '').toString().trim()
		const phone = (body?.phone || null)?.toString().trim() || null

		if (!companyId) {
			return NextResponse.json({ error: 'company_id é obrigatório' }, { status: 400 })
		}
		if (!email) {
		 return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
		}
		if (!password || password.length < 6) {
			return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 })
		}
		if (!name) {
			return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
		}

		const supabase = getSupabaseAdmin()

		// Verificar empresa
		const { data: company, error: companyError } = await supabase
			.from('companies')
			.select('id, name')
			.eq('id', companyId)
			.single()
		if (companyError || !company) {
			return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
		}

		// Criar usuário no Auth
		let auth = await supabase.auth.admin.createUser({
			email,
			password,
			email_confirm: true,
			user_metadata: { name, role: 'operator', company_id: companyId }
		})

		// Fallback: se erro de Database, tentar listar e reutilizar
		if (auth.error && auth.error.message?.includes('Database error')) {
			const { data: list } = await supabase.auth.admin.listUsers()
			const found = list?.users?.find((u: any) => u.email?.toLowerCase() === email)
			if (found) {
				auth = { data: { user: found }, error: null } as any
			}
		}

		if (auth.error || !auth.data?.user) {
			return NextResponse.json(
				{ error: 'Erro ao criar usuário no sistema de autenticação', message: auth.error?.message || 'Erro desconhecido' },
				{ status: 500 }
			)
		}

		const userId = auth.data.user.id

		// Upsert perfil em public.users
		const { error: profileError } = await supabase
			.from('users')
			.upsert(
				{
					id: userId,
					email,
					name,
					phone,
					role: 'operator',
					company_id: companyId
				},
				{ onConflict: 'id' }
			)
		if (profileError) {
			// Cleanup auth user se falhar perfil
			try { await supabase.auth.admin.deleteUser(userId) } catch {}
			return NextResponse.json(
				{ error: 'Erro ao criar perfil do usuário', message: profileError.message },
				{ status: 500 }
			)
		}

		// Mapeamento opcional (ignorar se tabela não existir)
		try {
			await supabase
				.from('gf_user_company_map')
				.insert({ user_id: userId, company_id: companyId })
		} catch { /* ignore */ }

		return NextResponse.json({
			success: true,
			message: 'Login de operador criado com sucesso',
			user: { id: userId, email, name, role: 'operator', company_id: companyId }
		})
	} catch (error: any) {
		return NextResponse.json(
			{ error: 'Erro ao criar login de operador', message: error.message },
			{ status: 500 }
		)
	}
}


