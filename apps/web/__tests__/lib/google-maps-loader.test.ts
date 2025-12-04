/**
 * Testes para Google Maps Loader
 */

import { loadGoogleMaps, loadGoogleMapsAPI } from '@/lib/google-maps-loader'

describe('Google Maps Loader', () => {
  const originalWindow = global.window
  const originalDocument = global.document
  const originalEnv = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  beforeEach(() => {
    jest.clearAllMocks()
    delete (global as any).window
    delete (global as any).document
  })

  afterEach(() => {
    global.window = originalWindow
    global.document = originalDocument
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = originalEnv
  })

  describe('loadGoogleMaps', () => {
    it('deve retornar Promise resolvida em ambiente server-side', async () => {
      await expect(loadGoogleMaps()).resolves.toBeUndefined()
    })

    it('deve retornar Promise resolvida se Google Maps já está carregado', async () => {
      global.window = {
        google: {
          maps: {} as any,
        },
      } as any

      await expect(loadGoogleMaps()).resolves.toBeUndefined()
    })

    it('deve rejeitar se API key não está configurada', async () => {
      global.window = {} as any
      global.document = {
        createElement: jest.fn(),
        head: {
          appendChild: jest.fn(),
        },
      } as any

      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

      await expect(loadGoogleMaps()).rejects.toThrow('Google Maps API key não configurada')
    })

    it('deve carregar script do Google Maps', async () => {
      const mockScript = {
        src: '',
        async: false,
        defer: false,
        onerror: null as any,
      }

      global.window = {
        initGoogleMaps: jest.fn(),
      } as any
      global.document = {
        createElement: jest.fn((tag: string) => {
          if (tag === 'script') return mockScript
          return {} as any
        }),
        head: {
          appendChild: jest.fn(),
        },
      } as any

      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

      const loadPromise = loadGoogleMaps()

      expect(global.document.createElement).toHaveBeenCalledWith('script')
      expect(mockScript.src).toContain('maps.googleapis.com')
      expect(mockScript.src).toContain('test-api-key')
      expect(mockScript.async).toBe(true)
      expect(mockScript.defer).toBe(true)

      // Simular callback
      if (global.window.initGoogleMaps) {
        ;(global.window.initGoogleMaps as jest.Mock)()
      }

      await expect(loadPromise).resolves.toBeUndefined()
    })

    it('deve rejeitar se script falhar ao carregar', async () => {
      const mockScript = {
        src: '',
        async: false,
        defer: false,
        onerror: null as any,
      }

      global.window = {
        initGoogleMaps: jest.fn(),
      } as any
      global.document = {
        createElement: jest.fn((tag: string) => {
          if (tag === 'script') return mockScript
          return {} as any
        }),
        head: {
          appendChild: jest.fn(),
        },
      } as any

      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

      const loadPromise = loadGoogleMaps()

      // Simular erro
      if (mockScript.onerror) {
        mockScript.onerror()
      }

      await expect(loadPromise).rejects.toThrow('Falha ao carregar Google Maps')
    })

    it('deve reutilizar promise existente se já está carregando', async () => {
      global.window = {} as any
      global.document = {
        createElement: jest.fn(() => ({}) as any),
        head: {
          appendChild: jest.fn(),
        },
      } as any

      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

      const promise1 = loadGoogleMaps()
      const promise2 = loadGoogleMaps()

      expect(promise1).toBe(promise2)
    })
  })

  describe('loadGoogleMapsAPI', () => {
    it('deve retornar Promise resolvida em ambiente server-side', async () => {
      await expect(loadGoogleMapsAPI('test-key')).resolves.toBeUndefined()
    })

    it('deve retornar Promise resolvida se Google Maps já está carregado', async () => {
      global.window = {
        google: {
          maps: {} as any,
        },
      } as any

      await expect(loadGoogleMapsAPI('test-key')).resolves.toBeUndefined()
    })

    it('deve rejeitar se API key não é fornecida', async () => {
      global.window = {} as any
      global.document = {
        createElement: jest.fn(),
        head: {
          appendChild: jest.fn(),
        },
      } as any

      await expect(loadGoogleMapsAPI('')).rejects.toThrow('Google Maps API key não fornecida')
    })

    it('deve carregar script com API key fornecida', async () => {
      const mockScript = {
        src: '',
        async: false,
        defer: false,
        onerror: null as any,
      }

      global.window = {
        initGoogleMaps: jest.fn(),
      } as any
      global.document = {
        createElement: jest.fn((tag: string) => {
          if (tag === 'script') return mockScript
          return {} as any
        }),
        head: {
          appendChild: jest.fn(),
        },
      } as any

      const loadPromise = loadGoogleMapsAPI('custom-api-key')

      expect(mockScript.src).toContain('custom-api-key')

      // Simular callback
      if (global.window.initGoogleMaps) {
        ;(global.window.initGoogleMaps as jest.Mock)()
      }

      await expect(loadPromise).resolves.toBeUndefined()
    })
  })
})

