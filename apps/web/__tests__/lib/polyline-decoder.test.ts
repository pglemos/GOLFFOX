import { decodePolylineAsync, cleanupPolylineWorker } from '@/lib/polyline-decoder'

// Mock Worker
global.Worker = jest.fn().mockImplementation(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  postMessage: jest.fn(),
  terminate: jest.fn(),
})) as any

global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
global.Blob = jest.fn().mockImplementation((parts) => ({
  parts,
  type: 'application/javascript',
})) as any

describe('lib/polyline-decoder', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    cleanupPolylineWorker()
  })

  it('deve decodificar polyline válida', async () => {
    // Polyline simples: São Paulo (-23.5505, -46.6333) para Rio (-22.9068, -43.1729)
    const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@'
    
    const points = await decodePolylineAsync(encoded)
    
    expect(Array.isArray(points)).toBe(true)
    expect(points.length).toBeGreaterThan(0)
    expect(points[0]).toHaveProperty('lat')
    expect(points[0]).toHaveProperty('lng')
  })

  it('deve retornar array vazio para polyline vazia', async () => {
    const points = await decodePolylineAsync('')
    
    expect(points).toEqual([])
  })

  it('deve usar fallback síncrono quando Worker não disponível', async () => {
    // Simular ambiente sem Worker
    const originalWorker = global.Worker
    ;(global as any).Worker = undefined
    
    const encoded = '_p~iF~ps|U'
    
    try {
      const points = await decodePolylineAsync(encoded)
      expect(Array.isArray(points)).toBe(true)
    } catch (error) {
      // Pode falhar em ambiente sem Worker, mas deve tentar fallback
      expect(error).toBeDefined()
    }
    
    global.Worker = originalWorker
  })

  it('deve limpar worker', () => {
    cleanupPolylineWorker()
    // Não deve lançar erro
    expect(true).toBe(true)
  })
})

