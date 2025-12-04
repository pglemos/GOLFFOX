import { formatError, getErrorMeta } from '@/lib/error-utils'

describe('lib/error-utils', () => {
  describe('formatError', () => {
    it('deve formatar erro com mensagem', () => {
      const error = { message: 'Erro de teste' }
      expect(formatError(error)).toBe('Erro de teste')
    })

    it('deve formatar erro aninhado', () => {
      const error = { error: { message: 'Erro aninhado' } }
      expect(formatError(error)).toBe('Erro aninhado')
    })

    it('deve formatar string como erro', () => {
      expect(formatError('Erro string')).toBe('Erro string')
    })

    it('deve usar fallback quando erro vazio', () => {
      expect(formatError(null, 'Fallback')).toBe('Fallback')
      expect(formatError(undefined, 'Fallback')).toBe('Fallback')
    })

    it('deve formatar erro sem mensagem', () => {
      const error = { code: 'ERROR_CODE' }
      const result = formatError(error)
      expect(result).toBeDefined()
    })

    it('deve lidar com erro circular', () => {
      const error: any = {}
      error.self = error
      const result = formatError(error, 'Fallback')
      expect(result).toBeDefined()
    })
  })

  describe('getErrorMeta', () => {
    it('deve extrair metadados do erro', () => {
      const error = {
        message: 'Erro de teste',
        code: 'ERROR_CODE',
        details: 'Detalhes',
        hint: 'Hint',
      }
      const meta = getErrorMeta(error)
      expect(meta.message).toBe('Erro de teste')
      expect(meta.code).toBe('ERROR_CODE')
      expect(meta.details).toBe('Detalhes')
      expect(meta.hint).toBe('Hint')
    })

    it('deve extrair metadados de erro aninhado', () => {
      const error = {
        error: {
          message: 'Erro aninhado',
          code: 'NESTED_CODE',
        },
      }
      const meta = getErrorMeta(error)
      expect(meta.message).toBe('Erro aninhado')
      expect(meta.code).toBe('NESTED_CODE')
    })

    it('deve retornar objeto vazio para erro sem metadados', () => {
      const meta = getErrorMeta(null)
      expect(meta).toEqual({})
    })
  })
})

