// Rota de compatibilidade: chama a rota /api/admin/transportadoras/update
import { NextRequest } from 'next/server'
import { PUT as transportadoraUpdatePUT } from '../../../transportadoras/update/route'

export async function PUT(req: NextRequest) {
  return transportadoraUpdatePUT(req)
}

