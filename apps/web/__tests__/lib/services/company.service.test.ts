/**
 * Testes Unitários - Company Service
 */

import { CompanyService } from '@/lib/services/company.service'

// Mock do repositório
jest.mock('@/lib/repositories', () => ({
  CompanyRepository: jest.fn().mockImplementation(() => ({
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCnpj: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }))
}))

// Mock do cache
jest.mock('@/lib/cache/cache.service', () => ({
  cacheService: {
    invalidate: jest.fn(),
    invalidatePattern: jest.fn()
  },
  withCache: jest.fn((key, fn) => fn())
}))

describe('CompanyService', () => {
  describe('listCompanies', () => {
    it('deve listar empresas com paginação', async () => {
      const filters = {
        page: 1,
        limit: 10
      }
      const result = await CompanyService.listCompanies(filters)
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('count')
    })
  })

  describe('createCompany', () => {
    it('deve criar empresa com dados válidos', async () => {
      const companyData = {
        name: 'Test Company',
        cnpj: '12345678000190'
      }
      await expect(CompanyService.createCompany(companyData)).resolves.toBeDefined()
    })

    it('deve rejeitar empresa sem nome', async () => {
      const companyData = {
        name: '',
        cnpj: '12345678000190'
      }
      await expect(CompanyService.createCompany(companyData)).rejects.toThrow()
    })
  })

  describe('getCompanyById', () => {
    it('deve retornar empresa quando encontrada', async () => {
      const result = await CompanyService.getCompanyById('test-id')
      expect(result).toBeDefined()
    })
  })
})

