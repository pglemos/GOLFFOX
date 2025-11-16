import { NextResponse } from 'next/server'

export function middleware(req: Request) {
  try {
    const url = new URL(req.url)
    const target = new URL(url.pathname + url.search, 'https://golffox-1bbrfdn87-synvolt.vercel.app')
    return NextResponse.redirect(target, { status: 302 })
  } catch {
    return NextResponse.redirect('https://golffox-1bbrfdn87-synvolt.vercel.app', { status: 302 })
  }
}

export const config = {
  matcher: '/:path*',
}
