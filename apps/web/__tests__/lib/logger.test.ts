import { logger, log, getLogs, clearLogs, debug, info, warn, error, logError } from '@/lib/logger'

describe('lib/logger', () => {
  beforeEach(() => {
    clearLogs()
    jest.clearAllMocks()
    process.env.NODE_ENV = 'test'
  })

  describe('logger', () => {
    it('deve logar em desenvolvimento', () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      logger.log('test message')
      
      expect(consoleSpy).toHaveBeenCalledWith('test message')
      consoleSpy.mockRestore()
    })

    it('não deve logar em produção', () => {
      process.env.NODE_ENV = 'production'
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      logger.log('test message')
      
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('deve sempre logar erros', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      
      logger.error('error message')
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('error message')
      consoleErrorSpy.mockRestore()
    })
  })

  describe('log function', () => {
    it('deve armazenar log', () => {
      log('info', 'test message', { data: 'test' })
      
      const logs = getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('info')
      expect(logs[0].message).toBe('test message')
      expect(logs[0].data).toEqual({ data: 'test' })
    })

    it('deve limpar logs', () => {
      log('info', 'test')
      expect(getLogs().length).toBeGreaterThan(0)
      
      clearLogs()
      expect(getLogs()).toHaveLength(0)
    })
  })

  describe('exported functions', () => {
    it('deve exportar funções corretamente', () => {
      expect(typeof debug).toBe('function')
      expect(typeof info).toBe('function')
      expect(typeof warn).toBe('function')
      expect(typeof error).toBe('function')
      expect(typeof logError).toBe('function')
    })
  })
})

