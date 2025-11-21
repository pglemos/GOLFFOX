// Rota de compatibilidade: chama a rota /api/admin/transportadoras/delete
import { NextRequest } from 'next/server'
import { DELETE as transportadoraDeleteDELETE } from '../../transportadoras/delete/route'

export async function DELETE(req: NextRequest) {
  return transportadoraDeleteDELETE(req)
}

