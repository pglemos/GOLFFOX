import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    if (searchParams.get('key') !== 'fix123') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    const log: string[] = []

    try {
        // 1. Fix Admin
        log.push('Fixing Admin...')
        await fixUser(supabase, 'golffox@admin.com', 'senha123', 'admin', null, null, log)

        // 2. Fix Transportadora
        log.push('Fixing Transportadora...')
        let transId = null
        // Table is 'carriers'
        const { data: trans, error: transErr } = await supabase.from('carriers').select('id').eq('email', 'teste@transportadora.com').maybeSingle()
        if (trans) {
            transId = trans.id
            log.push(`Found existing carrier: ${transId}`)
        } else {
            log.push('Creating new carrier...')
            const { data: newTrans, error: createTransErr } = await supabase.from('carriers').insert({
                name: 'Transportadora Teste',
                email: 'teste@transportadora.com',
                cnpj: '00.000.000/0001-00',
                active: true,
                address: 'Rua Teste, 123',
                phone: '11999999999'
            }).select().single()

            if (newTrans) {
                transId = newTrans.id
                log.push(`Created carrier: ${transId}`)
            } else {
                log.push(`Failed to create carrier: ${createTransErr?.message}`)
            }
        }

        if (transId) {
            await fixUser(supabase, 'teste@transportadora.com', 'senha123', 'transportadora', transId, null, log)
        }

        // 3. Fix Empresa
        log.push('Fixing Empresa...')
        let compId = null
        // Table is 'companies'
        const { data: comp, error: compErr } = await supabase.from('companies').select('id').eq('email', 'teste@empresa.com').maybeSingle()
        if (comp) {
            compId = comp.id
            log.push(`Found existing company: ${compId}`)
        } else {
            log.push('Creating new company...')
            const { data: newComp, error: createCompErr } = await supabase.from('companies').insert({
                name: 'Empresa Teste',
                email: 'teste@empresa.com',
                cnpj: '00.000.000/0002-00',
                is_active: true,
                address: 'Av Teste, 456',
                phone: '11888888888'
            }).select().single()

            if (newComp) {
                compId = newComp.id
                log.push(`Created company: ${compId}`)
            } else {
                log.push(`Failed to create company: ${createCompErr?.message}`)
            }
        }

        if (compId) {
            await fixUser(supabase, 'teste@empresa.com', 'senha123', 'empresa', null, compId, log)
        }

        return NextResponse.json({ success: true, log })
    } catch (err: any) {
        return NextResponse.json({ error: err.message, stack: err.stack, log }, { status: 500 })
    }
}

async function fixUser(supabase: any, email: string, password: string, role: string, transId: string | null, compId: string | null, log: string[]) {
    // Auth User
    const { data: users } = await supabase.auth.admin.listUsers()
    let user = users.users.find((u: any) => u.email === email)

    if (user) {
        log.push(`Updating auth for ${email}`)
        const { error } = await supabase.auth.admin.updateUserById(user.id, {
            password,
            email_confirm: true,
            user_metadata: { role, name: role === 'admin' ? 'Administrador' : (role === 'transportadora' ? 'Transportadora Teste' : 'Empresa Teste') }
        })
        if (error) log.push(`Error updating auth: ${error.message}`)
    } else {
        log.push(`Creating auth for ${email}`)
        const { data: newUser, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role, name: role === 'admin' ? 'Administrador' : (role === 'transportadora' ? 'Transportadora Teste' : 'Empresa Teste') }
        })
        if (error) {
            log.push(`Error creating auth: ${error.message}`)
            return // Stop if auth creation failed
        }
        user = newUser.user
    }

    if (!user) return

    // Public User Table
    log.push(`Upserting public user for ${email} (ID: ${user.id})`)

    const userData: any = {
        id: user.id,
        email,
        role,
        name: role === 'admin' ? 'Administrador' : (role === 'transportadora' ? 'Transportadora Teste' : 'Empresa Teste'),
        is_active: true
    }

    if (transId) userData.transportadora_id = transId
    if (compId) userData.company_id = compId

    const { error: upsertErr } = await supabase.from('users').upsert(userData)

    if (upsertErr) log.push(`Upsert error: ${upsertErr.message}`)
    else log.push(`Upsert success for ${email}`)
}
