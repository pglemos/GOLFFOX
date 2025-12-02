import { NextResponse } from 'next/server'
import spec from '@/../docs/api/openapi.json'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json(spec)
}

