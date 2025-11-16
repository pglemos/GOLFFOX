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
		const supabaseAdmin = getSupabaseAdmin()

		let { data, error } = await supabaseAdmin
			.from('companies')
			.select('*')
			.order('created_at', { ascending: false })

		if (error) {
			return NextResponse.json(
				{ success: false, error: 'Erro ao buscar empresas', message: error.message },
				{ status: 500 }
			)
		}

		return NextResponse.json({ success: true, companies: data || [] })
	} catch (error: any) {
		return NextResponse.json(
			{ success: false, error: 'Erro ao listar empresas', message: error.message },
			{ status: 500 }
		)
	}
}


