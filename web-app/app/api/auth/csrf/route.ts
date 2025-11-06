import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"

function generateToken(length = 32) {
  return randomBytes(length).toString('hex')
}

export async function GET(req: NextRequest) {
  const token = generateToken(32)
  const url = new URL(req.url)
  const isSecure = url.protocol === 'https:'

  const res = NextResponse.json({ token })
  res.cookies.set({
    name: 'golffox-csrf',
    value: token,
    path: '/',
    httpOnly: false, // permite estratégia de double-submit sem precisar ler cookie via JS
    sameSite: 'strict',
    secure: isSecure,
    maxAge: 15 * 60, // 15 minutos
  })
  return res
}
