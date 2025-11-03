import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const body = await req.json()
    const { email, password, name, phone, role = 'passenger' } = body

    // Create user via admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || Math.random().toString(36).slice(-8),
      user_metadata: {
        name,
        phone,
        role
      }
    })

    if (authError) throw authError

    // Update users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        name,
        phone,
        role
      })
      .eq('id', authData.user.id)

    if (userError) throw userError

    return NextResponse.json({ user: authData.user, userId: authData.user.id })
  } catch (error: any) {
    console.error("Erro ao criar funcionário:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

