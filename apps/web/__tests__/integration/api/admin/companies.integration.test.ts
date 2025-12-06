/**
 * Testes de Integração - Companies API
 * Testa o fluxo completo da API de empresas
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/admin/companies/route'

// Mock de autenticação
jest.mock('@/lib/api-auth', () => ({
  requireAuth: jest.fn(() => null) // Sem erro = autenticado
}))

// Mock do serviço
jest.mock('@/lib/services', () => ({
  CompanyService: {
    listCompanies: jest.fn(),
    createCompany: jest.fn()
  }
}))

describe('Companies API - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/admin/companies', () => {
    it('deve retornar lista de empresas', async () => {
      const { CompanyService } = await import('@/lib/services')
      ;(CompanyService.listCompanies as jest.Mock).mockResolvedValue({
        data: [{ id: '1', name: 'Company 1' }],
        count: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      })

      const request = new NextRequest('http://localhost:3000/api/admin/companies')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
    })

    it('deve suportar paginação via query params', async () => {
      const { CompanyService } = await import('@/lib/services')
      ;(CompanyService.listCompanies as jest.Mock).mockResolvedValue({
        data: [],
        count: 0,
        page: 2,
        limit: 20,
        totalPages: 0,
        hasNext: false,
        hasPrev: true
      })

      const request = new NextRequest('http://localhost:3000/api/admin/companies?page=2&limit=20')
      const response = await GET(request)
      const data = await response.json()

      expect(CompanyService.listCompanies).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20
        })
      )
      expect(data.page).toBe(2)
    })
  })

  describe('POST /api/admin/companies', () => {
    it('deve criar nova empresa', async () => {
      const { CompanyService } = await import('@/lib/services')
      const mockCompany = {
        id: 'new-id',
        name: 'New Company',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      ;(CompanyService.createCompany as jest.Mock).mockResolvedValue(mockCompany)

      const request = new NextRequest('http://localhost:3000/api/admin/companies', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Company'
        })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('name', 'New Company')
    })

    it('deve retornar erro 400 para dados inválidos', async () => {
      const { CompanyService } = await import('@/lib/services')
      ;(CompanyService.createCompany as jest.Mock).mockRejectedValue(
        new Error('Nome da empresa é obrigatório')
      )

      const request = new NextRequest('http://localhost:3000/api/admin/companies', {
        method: 'POST',
        body: JSON.stringify({})
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })
  })
})

