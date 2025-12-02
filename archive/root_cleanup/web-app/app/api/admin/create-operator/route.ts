import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
	if (!url || !serviceKey) {
		throw new Error('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
	}
	return createClient(url, serviceKey)
}

export async function POST(request: NextRequest) {
	try {
		const supabase = getSupabaseAdmin()
		const isDevelopment = process.env.NODE_ENV === 'development'
		const authErrorResponse = await requireAuth(request, 'admin')
		if (authErrorResponse && !isDevelopment) {
			return authErrorResponse
		}

		const body = await request.json()
		const companyName = body?.company_name || body?.companyName
		const cnpj = body?.cnpj || null
		const address = body?.address || null
		const city = body?.city || null
		const state = body?.state || null
		const zipCode = body?.zip_code || body?.zipCode || null
		const companyPhone = body?.company_phone || body?.companyPhone || null
		const companyEmail = body?.company_email || body?.companyEmail || null

		if (!companyName || !companyName.trim()) {
			return NextResponse.json({ error: 'Nome da empresa é obrigatório' }, { status: 400 })
		}

		// Verifica se já existe com o mesmo nome
		const { data: existing } = await supabase.from('companies').select('id').eq('name', companyName).maybeSingle()
		if (existing) {
			return NextResponse.json({ error: 'Uma empresa com esse nome já existe' }, { status: 400 })
		}

		const companyData: any = {
			name: companyName,
		}
		if (cnpj) companyData.cnpj = cnpj
		if (address) companyData.address = address
		if (city) companyData.city = city
		if (state) companyData.state = state
		if (zipCode) companyData.zip_code = zipCode
		if (companyPhone) companyData.phone = companyPhone
		if (companyEmail) companyData.email = companyEmail

		const { data: company, error } = await supabase.from('companies').insert(companyData).select('*').single()
		if (error || !company) {
			return NextResponse.json(
				{ error: 'Erro ao criar empresa', message: error?.message || 'Erro desconhecido' },
				{ status: 500 }
			)
		}

		return NextResponse.json({
			success: true,
			companyId: company.id,
			company,
			message: 'Empresa criada com sucesso. O login do operador pode ser criado posteriormente.',
		}, { status: 201 })
	} catch (error: any) {
		return NextResponse.json(
			{ error: 'Erro ao criar empresa', message: error.message },
			{ status: 500 }
		)
	}
}


