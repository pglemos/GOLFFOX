// Rota de compatibilidade: chama a rota /api/admin/transportadoras/[transportadoraId]/users
import { NextRequest } from 'next/server'
import { GET as transportadoraUsersGET } from '../../transportadoras/[transportadoraId]/users/route'

export async function GET(
  req: NextRequest,
  { params }: { params: { carrierId: string } }
) {
  // Chamar a rota nova passando carrierId como transportadoraId
  return transportadoraUsersGET(req, { params: { transportadoraId: params.carrierId } } as any)
}
