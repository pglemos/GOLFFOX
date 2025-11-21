// Rota de compatibilidade: chama a rota /api/admin/transportadoras/create
import { NextRequest } from 'next/server'
import { POST as transportadoraCreatePOST } from '../transportadoras/create/route'

export async function POST(req: NextRequest) {
  return transportadoraCreatePOST(req)
}

