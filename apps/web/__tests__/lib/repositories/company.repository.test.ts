/**
 * Testes Unitários - Company Repository
 */

import { CompanyRepository } from '@/lib/repositories/company.repository'

// Mock do Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null
          })),
          maybeSingle: jest.fn(() => ({
            data: null,
            error: null
          }))
        })),
        order: jest.fn(() => ({
          range: jest.fn(() => ({
            data: [],
            error: null,
            count: 0
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 'test-id', name: 'Test Company' },
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { id: 'test-id', name: 'Updated Company' },
              error: null
            }))
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          error: null
        }))
      }))
    }))
  }))
}))

describe('CompanyRepository', () => {
  let repository: CompanyRepository

  beforeEach(() => {
    repository = new CompanyRepository()
  })

  describe('findById', () => {
    it('deve retornar empresa quando encontrada', async () => {
      const result = await repository.findById('test-id')
      expect(result).toBeDefined()
    })

    it('deve retornar null quando não encontrada', async () => {
      const result = await repository.findById('non-existent')
      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    it('deve retornar lista paginada', async () => {
      const result = await repository.findAll({ page: 1, limit: 10 })
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('count')
      expect(result).toHaveProperty('page')
      expect(result).toHaveProperty('limit')
    })
  })

  describe('create', () => {
    it('deve criar nova empresa', async () => {
      const companyData = {
        name: 'Test Company',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      const result = await repository.create(companyData)
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('name', 'Test Company')
    })
  })

  describe('update', () => {
    it('deve atualizar empresa existente', async () => {
      const updateData = {
        name: 'Updated Company',
        updated_at: new Date().toISOString()
      }
      const result = await repository.update('test-id', updateData)
      expect(result).toHaveProperty('name', 'Updated Company')
    })
  })

  describe('delete', () => {
    it('deve deletar empresa (soft delete)', async () => {
      await expect(repository.delete('test-id', false)).resolves.not.toThrow()
    })

    it('deve deletar empresa (hard delete)', async () => {
      await expect(repository.delete('test-id', true)).resolves.not.toThrow()
    })
  })
})

