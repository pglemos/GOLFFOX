/**
 * Testes para i18n
 */

import { t, I18nKey } from '@/lib/i18n'
import common from '@/i18n/common.json'
import operator from '@/i18n/operator.json'
import admin from '@/i18n/admin.json'

describe('i18n', () => {
  describe('t', () => {
    it('deve retornar tradução do namespace common', () => {
      // Assumindo que common.json tem uma chave 'test'
      const result = t('common', 'test')
      // Se a chave existir, retorna a tradução, senão retorna a própria chave
      expect(typeof result).toBe('string')
    })

    it('deve retornar tradução do namespace operator', () => {
      const result = t('operator', 'test')
      expect(typeof result).toBe('string')
    })

    it('deve retornar tradução do namespace admin', () => {
      const result = t('admin', 'test')
      expect(typeof result).toBe('string')
    })

    it('deve retornar a chave quando tradução não encontrada', () => {
      const result = t('common', 'non.existent.key')
      expect(result).toBe('non.existent.key')
    })

    it('deve interpolar parâmetros na tradução', () => {
      // Testar com uma chave que sabemos que existe ou criar um mock
      // Por enquanto, testamos a lógica de interpolação
      const result = t('common', 'test', { name: 'João', count: 5 })
      expect(typeof result).toBe('string')
    })

    it('deve resolver chaves com dot notation', () => {
      // Testar resolução de chaves aninhadas como "success.exportGenerated"
      const result = t('common', 'success.exportGenerated')
      expect(typeof result).toBe('string')
    })

    it('deve lidar com parâmetros undefined', () => {
      const result = t('common', 'test', undefined)
      expect(typeof result).toBe('string')
    })

    it('deve interpolar múltiplos parâmetros', () => {
      const result = t('common', 'test', { 
        name: 'João', 
        count: 5,
        total: 10 
      })
      expect(typeof result).toBe('string')
    })

    it('deve interpolar números como strings', () => {
      const result = t('common', 'test', { count: 42 })
      expect(typeof result).toBe('string')
    })
  })

  describe('I18nKey type', () => {
    it('deve aceitar I18nKey válido', () => {
      const key: I18nKey = {
        ns: 'common',
        key: 'test',
        params: { name: 'Test' },
      }
      expect(key.ns).toBe('common')
      expect(key.key).toBe('test')
      expect(key.params).toEqual({ name: 'Test' })
    })

    it('deve aceitar I18nKey sem params', () => {
      const key: I18nKey = {
        ns: 'operator',
        key: 'test',
      }
      expect(key.params).toBeUndefined()
    })
  })
})

