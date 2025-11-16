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

export async function GET(request: NextRequest) {
	try {
		const isDevelopment = process.env.NODE_ENV === 'development'
		const authErrorResponse = await requireAuth(request, 'admin')
		if (authErrorResponse && !isDevelopment) {
			return authErrorResponse
		}

		const supabase = getSupabaseAdmin()
		const { searchParams } = new URL(request.url)
		const role = searchParams.get('role')
		const companyId = searchParams.get('company_id')
		const status = searchParams.get('status')

		let query = supabase.from('users').select('*').order('created_at', { ascending: false })
		if (role && role !== 'all') query = query.eq('role', role)
		if (companyId) query = query.eq('company_id', companyId)
		if (status && status !== 'all') query = query.eq('is_active', status === 'active')

		const { data, error } = await query
		if (error) {
			return NextResponse.json(
				{ success: false, error: 'Erro ao buscar usuários', message: error.message },
				{ status: 500 }
			)
		}

		return NextResponse.json({ success: true, users: data || [] })
	} catch (error: any) {
		return NextResponse.json(
			{ success: false, error: 'Erro ao listar usuários', message: error.message },
			{ status: 500 }
		)
	}
}


