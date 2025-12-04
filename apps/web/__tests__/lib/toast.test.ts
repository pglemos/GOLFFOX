/**
 * Testes para Toast/Notifications
 */

import { notifySuccess, notifyInfo, notifyWarning, notifyError, withToast } from '@/lib/toast'
import toast from 'react-hot-toast'
import { formatError } from '@/lib/error-utils'
import { t } from '@/lib/i18n'

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}))

jest.mock('@/lib/error-utils', () => ({
  formatError: jest.fn((error) => (error instanceof Error ? error.message : String(error))),
}))

jest.mock('@/lib/i18n', () => ({
  t: jest.fn((ns, key, params) => `translated:${ns}:${key}`),
}))

describe('Toast Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('notifySuccess', () => {
    it('deve mostrar toast de sucesso com mensagem', () => {
      notifySuccess('Operação realizada com sucesso')

      expect(toast.success).toHaveBeenCalledWith('Operação realizada com sucesso', undefined)
    })

    it('deve usar tradução quando i18n fornecido', () => {
      notifySuccess('', {
        i18n: { ns: 'common', key: 'success.operation', params: {} },
      })

      expect(t).toHaveBeenCalledWith('common', 'success.operation', {})
      expect(toast.success).toHaveBeenCalledWith('translated:common:success.operation', expect.any(Object))
    })

    it('deve passar opções adicionais', () => {
      notifySuccess('Success', { duration: 5000, id: 'custom-id' })

      expect(toast.success).toHaveBeenCalledWith('Success', { duration: 5000, id: 'custom-id' })
    })
  })

  describe('notifyInfo', () => {
    it('deve mostrar toast de informação', () => {
      notifyInfo('Informação importante')

      expect(toast).toHaveBeenCalledWith('Informação importante', undefined)
    })

    it('deve usar tradução quando i18n fornecido', () => {
      notifyInfo('', {
        i18n: { ns: 'common', key: 'info.message', params: {} },
      })

      expect(t).toHaveBeenCalledWith('common', 'info.message', {})
      expect(toast).toHaveBeenCalledWith('translated:common:info.message', expect.any(Object))
    })
  })

  describe('notifyWarning', () => {
    it('deve mostrar toast de aviso com ícone', () => {
      notifyWarning('Atenção necessária')

      expect(toast).toHaveBeenCalledWith('Atenção necessária', { icon: '⚠️' })
    })

    it('deve usar tradução quando i18n fornecido', () => {
      notifyWarning('', {
        i18n: { ns: 'common', key: 'warning.message', params: {} },
      })

      expect(t).toHaveBeenCalledWith('common', 'warning.message', {})
      expect(toast).toHaveBeenCalledWith('translated:common:warning.message', expect.objectContaining({ icon: '⚠️' }))
    })

    it('deve preservar outras opções além do ícone', () => {
      notifyWarning('Warning', { duration: 3000 })

      expect(toast).toHaveBeenCalledWith('Warning', { icon: '⚠️', duration: 3000 })
    })
  })

  describe('notifyError', () => {
    it('deve mostrar toast de erro com string', () => {
      notifyError('Erro ao processar')

      expect(toast.error).toHaveBeenCalledWith('Erro ao processar', undefined)
    })

    it('deve formatar erro quando Error object fornecido', () => {
      const error = new Error('Network error')
      notifyError(error)

      expect(formatError).toHaveBeenCalledWith(error, undefined)
      expect(toast.error).toHaveBeenCalledWith('Network error', undefined)
    })

    it('deve usar fallback message quando fornecido', () => {
      const error = new Error('Network error')
      notifyError(error, 'Erro genérico')

      expect(formatError).toHaveBeenCalledWith(error, 'Erro genérico')
    })

    it('deve usar tradução quando i18n fornecido com string', () => {
      notifyError('', undefined, {
        i18n: { ns: 'common', key: 'error.message', params: {} },
      })

      expect(t).toHaveBeenCalledWith('common', 'error.message', {})
      expect(toast.error).toHaveBeenCalledWith('translated:common:error.message', expect.any(Object))
    })

    it('deve passar opções adicionais', () => {
      notifyError('Error', undefined, { duration: 10000 })

      expect(toast.error).toHaveBeenCalledWith('Error', { duration: 10000 })
    })
  })

  describe('withToast', () => {
    it('deve mostrar loading, depois success quando promise resolve', async () => {
      const promise = Promise.resolve('result')
      const messages = {
        loading: 'Processando...',
        success: 'Concluído!',
      }

      const result = await withToast(promise, messages)

      expect(toast.loading).toHaveBeenCalledWith('Processando...', expect.any(Object))
      expect(toast.success).toHaveBeenCalledWith('Concluído!', expect.any(Object))
      expect(result).toBe('result')
    })

    it('deve mostrar loading, depois error quando promise rejeita', async () => {
      const error = new Error('Failed')
      const promise = Promise.reject(error)
      const messages = {
        loading: 'Processando...',
        success: 'Concluído!',
        error: 'Falhou!',
      }

      await expect(withToast(promise, messages)).rejects.toThrow('Failed')

      expect(toast.loading).toHaveBeenCalledWith('Processando...', expect.any(Object))
      expect(formatError).toHaveBeenCalledWith(error, 'Falhou!')
      expect(toast.error).toHaveBeenCalled()
    })

    it('deve usar loading message como fallback error quando error não fornecido', async () => {
      const error = new Error('Failed')
      const promise = Promise.reject(error)
      const messages = {
        loading: 'Processando...',
        success: 'Concluído!',
      }

      await expect(withToast(promise, messages)).rejects.toThrow('Failed')

      expect(formatError).toHaveBeenCalledWith(error, 'Processando...')
    })

    it('deve usar ID customizado quando fornecido', async () => {
      const promise = Promise.resolve('result')
      const messages = {
        loading: 'Processando...',
        success: 'Concluído!',
      }

      await withToast(promise, messages, { id: 'custom-id' })

      expect(toast.loading).toHaveBeenCalledWith('Processando...', { id: 'custom-id' })
      expect(toast.success).toHaveBeenCalledWith('Concluído!', { id: 'custom-id' })
    })

    it('deve gerar ID aleatório quando não fornecido', async () => {
      const promise = Promise.resolve('result')
      const messages = {
        loading: 'Processando...',
        success: 'Concluído!',
      }

      await withToast(promise, messages)

      const loadingCall = (toast.loading as jest.Mock).mock.calls[0]
      expect(loadingCall[1]).toHaveProperty('id')
      expect(typeof loadingCall[1].id).toBe('string')
    })
  })
})

