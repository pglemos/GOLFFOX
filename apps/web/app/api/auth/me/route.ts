import { NextRequest, NextResponse } from 'next/server'

function tryDecode(cookieValue: string): any | null {
  try {
    // Base64
    const b64 = Buffer.from(cookieValue, 'base64').toString('utf-8')
    return JSON.parse(b64)
  } catch (_) {
    try {
      // URI encoded JSON
      const uri = decodeURIComponent(cookieValue)
      return JSON.parse(uri)
    } catch {
      return null
    }
  }
}

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('golffox-session')?.value
  if (!cookie) {
    return NextResponse.json({ success: false }, { status: 401 })
  }
  const userData = tryDecode(cookie)
  if (!userData || !userData.id || !userData.role) {
    return NextResponse.json({ success: false }, { status: 401 })
  }
  return NextResponse.json({ success: true, user: {
    id: userData.id,
    email: userData.email || '',
    role: userData.role,
    companyId: userData.companyId ?? null,
  }})
}