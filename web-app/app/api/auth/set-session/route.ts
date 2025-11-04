import { NextRequest, NextResponse } from "next/server"

interface UserData {
  id: string
  email: string
  role: string
  accessToken: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const user: UserData | undefined = body?.user

    if (!user || !user.id || !user.email || !user.role || !user.accessToken) {
      return NextResponse.json({ error: "invalid_user_payload" }, { status: 400 })
    }

    // Serialize and encode cookie value
    const cookieValue = Buffer.from(JSON.stringify(user)).toString("base64")

    const url = new URL(req.url)
    const isSecure = url.protocol === "https:"

    const res = NextResponse.json({ ok: true })

    res.cookies.set({
      name: "golffox-session",
      value: cookieValue,
      path: "/",
      httpOnly: false, // middleware lê, e cliente pode limpar no logout
      sameSite: "lax",
      secure: isSecure,
      maxAge: 60 * 60, // 1 hora
    })

    return res
  } catch (error: any) {
    console.error("Erro ao setar cookie de sessão:", error)
    return NextResponse.json({ error: error?.message || "unexpected_error" }, { status: 500 })
  }
}

