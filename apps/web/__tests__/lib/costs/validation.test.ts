import {
  costSchema,
  budgetSchema,
  reconciliationSchema,
  hasSignificantDiscrepancy,
  importCostRowSchema,
} from '@/lib/costs/validation'

describe('lib/costs/validation', () => {
  describe('costSchema', () => {
    it('deve validar custo válido', () => {
      const cost = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        cost_category_id: '550e8400-e29b-41d4-a716-446655440001',
        date: '2024-01-15',
        amount: 1000,
      }
      expect(() => costSchema.parse(cost)).not.toThrow()
    })

    it('deve rejeitar UUID inválido', () => {
      const cost = {
        company_id: 'invalid-uuid',
        cost_category_id: '550e8400-e29b-41d4-a716-446655440001',
        date: '2024-01-15',
        amount: 1000,
      }
      expect(() => costSchema.parse(cost)).toThrow()
    })

    it('deve rejeitar data inválida', () => {
      const cost = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        cost_category_id: '550e8400-e29b-41d4-a716-446655440001',
        date: '15/01/2024',
        amount: 1000,
      }
      expect(() => costSchema.parse(cost)).toThrow()
    })

    it('deve rejeitar valor negativo', () => {
      const cost = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        cost_category_id: '550e8400-e29b-41d4-a716-446655440001',
        date: '2024-01-15',
        amount: -100,
      }
      expect(() => costSchema.parse(cost)).toThrow()
    })
  })

  describe('budgetSchema', () => {
    it('deve validar orçamento válido', () => {
      const budget = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        period_month: 1,
        period_year: 2024,
        amount_budgeted: 10000,
      }
      expect(() => budgetSchema.parse(budget)).not.toThrow()
    })

    it('deve rejeitar mês inválido', () => {
      const budget = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        period_month: 13,
        period_year: 2024,
        amount_budgeted: 10000,
      }
      expect(() => budgetSchema.parse(budget)).toThrow()
    })
  })

  describe('reconciliationSchema', () => {
    it('deve validar conciliação válida', () => {
      const reconciliation = {
        invoice_id: '550e8400-e29b-41d4-a716-446655440000',
        action: 'approve' as const,
      }
      expect(() => reconciliationSchema.parse(reconciliation)).not.toThrow()
    })

    it('deve rejeitar ação inválida', () => {
      const reconciliation = {
        invoice_id: '550e8400-e29b-41d4-a716-446655440000',
        action: 'invalid',
      }
      expect(() => reconciliationSchema.parse(reconciliation)).toThrow()
    })
  })

  describe('hasSignificantDiscrepancy', () => {
    it('deve detectar divergência por percentual', () => {
      expect(hasSignificantDiscrepancy(1000, 1100, 5, 100)).toBe(true)
    })

    it('deve detectar divergência por valor absoluto', () => {
      expect(hasSignificantDiscrepancy(1000, 1110, 5, 100)).toBe(true)
    })

    it('deve retornar false para divergência pequena', () => {
      expect(hasSignificantDiscrepancy(1000, 1020, 5, 100)).toBe(false)
    })

    it('deve lidar com measuredAmount = 0', () => {
      expect(hasSignificantDiscrepancy(0, 100, 5, 100)).toBe(true)
    })
  })

  describe('importCostRowSchema', () => {
    it('deve validar linha de importação válida', () => {
      const row = {
        date: '2024-01-15',
        category: 'Combustível',
        amount: 1000,
      }
      expect(() => importCostRowSchema.parse(row)).not.toThrow()
    })

    it('deve rejeitar categoria vazia', () => {
      const row = {
        date: '2024-01-15',
        category: '',
        amount: 1000,
      }
      expect(() => importCostRowSchema.parse(row)).toThrow()
    })

    it('deve rejeitar valor inválido', () => {
      const row = {
        date: '2024-01-15',
        category: 'Combustível',
        amount: -100,
      }
      expect(() => importCostRowSchema.parse(row)).toThrow()
    })
  })
})

